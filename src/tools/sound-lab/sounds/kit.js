export const hz = midi => Number((440 * Math.pow(2, (midi - 69) / 12)).toFixed(2));

export const seeded = seed => {
  let state = seed >>> 0 || 1;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const round = value => Number(value.toFixed(4));

const panned = pan => (pan === undefined ? {} : { pan });

export const blip = (
  from,
  to,
  { at = 0, gain = 0, attack = 0.0015, decay = 0.07, glide = 0.025, curve = 6, wave } = {}
) => ({
  type: 'tone',
  ...(wave ? { wave } : {}),
  freq: from === to ? from : { from, to, time: glide, curve: 3 },
  at,
  gain,
  env: { attack, decay, curve }
});

export const knock = (freq, { at = 0, gain = -14, decay = 0.008, attack = 0.001, q = 0.8 } = {}) => ({
  type: 'noise',
  color: 'pink',
  at,
  gain,
  punch: true,
  filter: [
    { type: 'bandpass', freq, q },
    { type: 'lowpass', freq: Math.min(9000, freq * 2.6), q: 0.5 }
  ],
  env: { attack, decay, curve: 6 }
});

export const bell = (freq, { at = 0, gain = 0, decay = 0.6, attack = 0.004, bright = 1, pan } = {}) => ({
  type: 'tone',
  freq,
  at,
  gain,
  ...panned(pan),
  partials: [
    [1, 1, 1],
    [2, round(0.16 * bright), 0.55],
    [3, round(0.04 * bright), 0.35]
  ],
  env: { attack, decay, curve: 6 }
});

export const glass = (freq, { at = 0, gain = 0, decay = 0.4, attack = 0.0025, bright = 1, pan } = {}) => ({
  type: 'tone',
  freq,
  at,
  gain,
  ...panned(pan),
  partials: [
    [1, 1, 1],
    [2.76, round(0.12 * bright), 0.4],
    [5.4, round(0.03 * bright), 0.22]
  ],
  env: { attack, decay, curve: 6 }
});

export const wood = (freq, { at = 0, gain = 0, decay = 0.4, attack = 0.002, pan } = {}) => ({
  type: 'tone',
  freq,
  at,
  gain,
  ...panned(pan),
  partials: [
    [1, 1, 1],
    [3.93, 0.16, 0.25],
    [9.2, 0.025, 0.1]
  ],
  env: { attack, decay, curve: 6 }
});

export const pluck = (freq, { at = 0, gain = 0, decay = 0.35, attack = 0.0015, bright = 1, pan } = {}) => ({
  type: 'tone',
  freq,
  at,
  gain,
  ...panned(pan),
  partials: [
    [1, 1, 1],
    [2, round(0.4 * bright), 0.55],
    [3, round(0.16 * bright), 0.35],
    [4, round(0.07 * bright), 0.22],
    [5, round(0.03 * bright), 0.15]
  ],
  env: { attack, decay, curve: 6 }
});

export const tine = (freq, { at = 0, gain = 0, decay = 0.7, attack = 0.002, bright = 1, pan } = {}) => ({
  type: 'tone',
  freq,
  at,
  gain,
  ...panned(pan),
  partials: [
    [1, 1, 1],
    [5.95, round(0.14 * bright), 0.1],
    [11.6, round(0.03 * bright), 0.05]
  ],
  env: { attack, decay, curve: 6 }
});

export const vibe = (freq, { at = 0, gain = 0, decay = 1.1, attack = 0.003, pan } = {}) => ({
  type: 'tone',
  freq,
  at,
  gain,
  ...panned(pan),
  partials: [
    [1, 1, 1],
    [4, 0.09, 0.35],
    [10, 0.012, 0.12]
  ],
  tremolo: { rate: 5.5, depth: 0.28 },
  env: { attack, decay, curve: 5 }
});

export const keys = (freq, { at = 0, gain = 0, decay = 0.9, attack = 0.003, bright = 1, pan } = {}) => ({
  type: 'tone',
  freq,
  at,
  gain,
  ...panned(pan),
  fm: { ratio: 1, index: { from: round(1.4 * bright), to: 0.15, time: round(decay * 0.5) } },
  partials: [
    [1, 1, 1],
    [2, 0.12, 0.5]
  ],
  env: { attack, decay, curve: 5 }
});

export const fmbell = (
  freq,
  { at = 0, gain = 0, decay = 0.6, attack = 0.002, ratio = 3.5, index = 1.6, pan } = {}
) => ({
  type: 'tone',
  freq,
  at,
  gain,
  ...panned(pan),
  fm: { ratio, index: { from: index, to: 0, time: round(decay * 0.6) } },
  env: { attack, decay, curve: 6 }
});

export const bubble = (freq, { at = 0, gain = 0, decay = 0.05, rise = 2.1, attack = 0.002, pan } = {}) => ({
  type: 'tone',
  freq: { from: freq, to: round(freq * rise), time: round(decay * 0.9), curve: 1.6 },
  at,
  gain,
  ...panned(pan),
  env: { attack, decay, curve: 5 }
});

export const sweep = ({
  from,
  to,
  top,
  at = 0,
  gain = 0,
  attack,
  hold = 0,
  decay,
  q = 0.8,
  color = 'pink',
  pan,
  rise = 1.5,
  curve = 4
}) => {
  const total = round(attack + hold + decay);
  return {
    type: 'noise',
    color,
    at,
    gain,
    ...panned(pan),
    filter: {
      type: 'bandpass',
      freq: top
        ? {
            points: [
              [0, from],
              [round(attack + hold * 0.5), top],
              [total, to]
            ]
          }
        : { from, to, time: total, curve: 2 },
      q
    },
    env: { attack, rise, ...(hold ? { hold } : {}), decay, curve }
  };
};

export const sub = (from, to, { at = 0, gain = 0, time, decay = 0.6, attack = 0.004, curve = 5 } = {}) => ({
  type: 'tone',
  freq: { from, to, time: time ?? round(decay * 0.6), curve: 3 },
  at,
  gain,
  env: { attack, decay, curve }
});

export const pad = (
  notes,
  {
    at = 0,
    gain = -6,
    attack = 1,
    hold = 0,
    decay = 2,
    wave = 'triangle',
    voices = 3,
    detune = 8,
    cutoff = 1800,
    step = 2,
    rise = 1.6,
    curve = 3
  } = {}
) =>
  notes.map((midi, index) => ({
    type: 'tone',
    wave,
    voices,
    detune,
    freq: hz(midi),
    at,
    gain: gain - index * step,
    filter: { type: 'lowpass', freq: cutoff, q: 0.6 },
    env: { attack, rise, ...(hold ? { hold } : {}), decay, curve }
  }));

export const scatter = (count, seed, make) => {
  const next = seeded(seed);
  return Array.from({ length: count }, (_, index) => make(index, next));
};

export const room = (mix, decay, extra = {}) => ({ reverb: { mix, decay, predelay: 0.01, damp: 5000, ...extra } });

export const shimmer = () => {
  const next = seeded(707);
  return [84, 86, 88, 91, 93, 96].map((midi, index) => ({
    type: 'tone',
    freq: hz(midi),
    at: round(index * 0.09 + next() * 0.02),
    gain: round(-8 - index * 1.6),
    pan: round((index % 2 ? 1 : -1) * (0.15 + 0.08 * index)),
    partials: [
      [1, 1, 1],
      [2, 0.06, 0.5]
    ],
    env: { attack: 0.03, decay: round(0.7 + next() * 0.3), curve: 5 }
  }));
};

export const stardust = () => {
  const next = seeded(4242);
  const scale = [81, 84, 86, 88, 91, 93];
  return Array.from({ length: 10 }, (_, index) => {
    const at = round(Math.pow(index / 10, 1.2) * 1.1 + next() * 0.04);
    const midi = scale[Math.floor(next() * scale.length)];
    return {
      type: 'tone',
      freq: hz(midi),
      at,
      gain: round(-9 - next() * 6 - index * 0.5),
      pan: round((next() * 2 - 1) * 0.7),
      partials: [
        [1, 1, 1],
        [2.76, 0.05, 0.35]
      ],
      env: { attack: round(0.012 + next() * 0.008), decay: round(0.3 + next() * 0.3), curve: 6 }
    };
  });
};

export const chord = (notes, { at = 0, gain = -6, decay = 2, bright = 0.5 } = {}) =>
  notes.map((midi, index) =>
    bell(hz(midi), { at: round(at + index * 0.012), decay: decay + index * 0.05, gain: gain - index * 1.5, bright })
  );
