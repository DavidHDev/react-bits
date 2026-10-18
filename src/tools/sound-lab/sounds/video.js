import { KEYCAP } from './samples.js';
import {
  bell,
  bubble,
  chord,
  fmbell,
  glass,
  hz,
  keys,
  knock,
  pad,
  room,
  round,
  scatter,
  seeded,
  shimmer,
  stardust,
  sub,
  sweep,
  vibe,
  wood
} from './kit.js';

const brass = (midi, { at = 0, hold = 0.1, decay = 0.3, gain = 0, voices = 3 } = {}) => ({
  type: 'tone',
  wave: 'sawtooth',
  voices,
  detune: 8,
  freq: hz(midi),
  at,
  gain,
  filter: {
    type: 'lowpass',
    freq: {
      points: [
        [0, 500],
        [0.05, 2400],
        [round(0.05 + hold + decay * 0.5), 900]
      ]
    },
    q: 0.7
  },
  env: { attack: 0.025, hold, decay, curve: 4 }
});

const piano = (midi, { at = 0, decay = 2, gain = 0, pan } = {}) => ({
  type: 'tone',
  freq: hz(midi),
  at,
  gain,
  ...(pan === undefined ? {} : { pan }),
  partials: [
    [1, 1, 1],
    [2, 0.45, 0.6],
    [3, 0.22, 0.42],
    [4, 0.1, 0.3],
    [5, 0.05, 0.24],
    [6, 0.025, 0.2]
  ],
  env: { attack: 0.003, decay, curve: 6 }
});

const throttle = () => {
  const layers = [];
  let at = 0;
  let gap = 0.34;
  while (at < 3.75) {
    const lift = at / 3.8;
    layers.push({
      type: 'tone',
      wave: 'triangle',
      freq: round(hz(50) * Math.pow(2, lift)),
      at: round(at),
      gain: round(-9 + 6 * lift),
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    });
    layers.push({
      type: 'tone',
      freq: round(hz(38) * Math.pow(2, lift)),
      at: round(at),
      gain: round(-10 + 5 * lift),
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    });
    at += gap;
    gap = Math.max(0.05, gap * 0.9);
  }
  return layers;
};

const ticks = (count, { gap, start = 0, from, to, accel = 1, decay = 0.02, gain = 0, seed = 1 }) => {
  const next = seeded(seed);
  let at = start;
  let step = gap;
  return Array.from({ length: count }, (_, index) => {
    const lift = index / Math.max(1, count - 1);
    const layer = wood(round(from * Math.pow(to / from, lift) * (1 + (next() - 0.5) * 0.02)), {
      at: round(at),
      decay,
      gain: round(gain - next() * 2),
      pan: round((next() * 2 - 1) * 0.25)
    });
    at += step;
    step *= accel;
    return layer;
  });
};

const VIDEO_MORE = [
  {
    id: 'tide',
    name: 'Tide',
    category: 'risers',
    description: 'A slow eight second build of air and low drone.',
    tags: 'riser build tension long cinematic drone',
    recipe: {
      duration: 8.2,
      seed: 104,
      loudness: -15,
      lowpass: 9000,
      highpass: 28,
      width: 0.8,
      ...room(0.3, 3, { damp: 4000, predelay: 0.025 }),
      layers: [
        {
          type: 'noise',
          color: 'pink',
          filter: { type: 'lowpass', freq: { from: 200, to: 6000, time: 8, curve: 0.6 }, q: 0.6 },
          env: { attack: 7.8, rise: 2.4, decay: 0.3, curve: 3 }
        },
        {
          type: 'tone',
          wave: 'sawtooth',
          voices: 4,
          detune: 10,
          freq: { from: hz(38), to: hz(45), time: 8, curve: 0.8 },
          gain: -8,
          filter: { type: 'lowpass', freq: { from: 250, to: 1500, time: 8 }, q: 0.7 },
          env: { attack: 7.6, rise: 2.2, decay: 0.35, curve: 3 }
        },
        {
          type: 'tone',
          freq: { from: hz(26), to: hz(33), time: 8, curve: 0.8 },
          gain: -10,
          env: { attack: 7.5, rise: 2, decay: 0.35, curve: 3 }
        },
        {
          type: 'tone',
          wave: 'triangle',
          voices: 2,
          detune: 6,
          freq: { from: hz(62), to: hz(69), time: 8, curve: 0.8 },
          gain: -16,
          filter: { type: 'lowpass', freq: 2500, q: 0.6 },
          env: { attack: 7.6, rise: 2.2, decay: 0.3, curve: 3 }
        }
      ]
    }
  },
  {
    id: 'spiral',
    name: 'Spiral',
    category: 'risers',
    description: 'An endless-feeling rise that keeps climbing.',
    tags: 'riser shepard endless climb illusion loop',
    recipe: {
      duration: 5.2,
      seed: 105,
      loudness: -16,
      lowpass: 8000,
      highpass: 40,
      width: 0.6,
      ...room(0.3, 2.2, { damp: 5000 }),
      layers: [
        ...[0, 1, 2, 3, 4].map(octave => ({
          type: 'tone',
          freq: { from: round(hz(38) * 2 ** octave), to: round(hz(38) * 2 ** (octave + 1)), time: 5, curve: 1 },
          gain: [-12, -5, -2, -5, -12][octave],
          env:
            octave === 0
              ? { attack: 4.6, rise: 1.4, decay: 0.3, curve: 3 }
              : octave === 4
                ? { attack: 0.5, hold: 0.6, decay: 4.2, curve: 2 }
                : { attack: 0.5, hold: 4.2, decay: 0.3, curve: 3 }
        })),
        {
          type: 'noise',
          color: 'pink',
          gain: -16,
          filter: { type: 'bandpass', freq: { from: 400, to: 3200, time: 5, curve: 1 }, q: 0.7 },
          env: { attack: 4.6, rise: 2, decay: 0.3, curve: 3 }
        }
      ]
    }
  },
  {
    id: 'throttle',
    name: 'Throttle',
    category: 'risers',
    description: 'A rising pulse that speeds up into the cut.',
    tags: 'riser pulse accelerate countdown build tension',
    recipe: {
      duration: 4.1,
      seed: 106,
      loudness: -15,
      lowpass: 6000,
      highpass: 35,
      ...room(0.18, 1.2, { damp: 4000 }),
      layers: [
        ...throttle(),
        {
          type: 'noise',
          color: 'pink',
          gain: -10,
          filter: { type: 'lowpass', freq: { from: 300, to: 5000, time: 3.9, curve: 0.7 }, q: 0.6 },
          env: { attack: 3.8, rise: 2.2, decay: 0.08, curve: 3 }
        }
      ]
    }
  },
  {
    id: 'aurora',
    name: 'Aurora',
    category: 'risers',
    description: 'A bright, glittering rise of high tones.',
    tags: 'riser sparkle magic glitter bright shimmer',
    recipe: {
      duration: 3.4,
      seed: 107,
      loudness: -16,
      lowpass: 9500,
      highpass: 200,
      width: 0.8,
      ...room(0.35, 2.4, { damp: 7000 }),
      layers: [
        ...scatter(28, 107, (index, next) => {
          const lift = index / 27;
          return glass(hz([74, 76, 78, 81, 83, 86, 88, 90, 93][Math.min(8, Math.floor(lift * 6 + next() * 3))]), {
            at: round(3 * Math.pow(lift, 0.7)),
            decay: round(0.25 + next() * 0.25),
            bright: 0.3,
            gain: round(-16 + lift * 8 - next() * 3),
            pan: round((next() * 2 - 1) * 0.75)
          });
        }),
        {
          type: 'noise',
          color: 'pink',
          gain: -14,
          filter: [
            { type: 'highpass', freq: 2000, q: 0.5 },
            { type: 'lowpass', freq: { from: 3000, to: 8000, time: 3 }, q: 0.5 }
          ],
          env: { attack: 2.8, rise: 2, decay: 0.3, curve: 3 }
        },
        ...pad([74, 81, 90], { gain: -12, attack: 2.6, decay: 0.5, wave: 'sine', voices: 2, detune: 6, cutoff: 6000 })
      ]
    }
  },
  {
    id: 'swell',
    name: 'Swell',
    category: 'risers',
    description: 'A reversed cymbal swell that pulls into the hit.',
    tags: 'riser reverse cymbal swell suck in',
    recipe: {
      duration: 2.4,
      seed: 108,
      loudness: -16,
      lowpass: 7000,
      highpass: 200,
      width: 0.7,
      reverse: true,
      ...room(0.3, 1.6, { damp: 6000 }),
      layers: [
        {
          type: 'noise',
          color: 'pink',
          filter: [
            { type: 'highpass', freq: 1200, q: 0.5 },
            { type: 'lowpass', freq: 6500, q: 0.5 }
          ],
          gain: -4,
          env: { attack: 0.002, decay: 2.2, curve: 4 }
        },
        {
          type: 'tone',
          freq: 420,
          partials: [
            [1, 0.5, 1],
            [2.83, 0.6, 0.9],
            [5.11, 0.4, 0.8],
            [7.3, 0.25, 0.7],
            [11.2, 0.12, 0.6]
          ],
          gain: -16,
          env: { attack: 0.002, decay: 2, curve: 4 }
        },
        {
          type: 'noise',
          color: 'pink',
          gain: -8,
          filter: { type: 'bandpass', freq: 1200, q: 0.6 },
          env: { attack: 0.002, decay: 1.2, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'strain',
    name: 'Strain',
    category: 'risers',
    description: 'A tense, rising string-like swell.',
    tags: 'riser strings tension suspense swell',
    recipe: {
      duration: 4.1,
      seed: 109,
      loudness: -16,
      lowpass: 4000,
      highpass: 60,
      width: 0.8,
      ...room(0.3, 2, { damp: 4500 }),
      layers: [
        {
          type: 'tone',
          wave: 'sawtooth',
          voices: 5,
          detune: 14,
          freq: { from: hz(57), to: hz(62), time: 4, curve: 0.8 },
          vibrato: { rate: 5.2, depth: 12 },
          filter: { type: 'lowpass', freq: { from: 500, to: 2600, time: 4, curve: 0.7 }, q: 0.9 },
          gain: -6,
          env: { attack: 3.6, rise: 2, decay: 0.25, curve: 3 }
        },
        {
          type: 'tone',
          wave: 'sawtooth',
          voices: 4,
          detune: 12,
          freq: { from: hz(64), to: hz(69), time: 4, curve: 0.8 },
          vibrato: { rate: 5.6, depth: 14 },
          filter: { type: 'lowpass', freq: { from: 600, to: 3000, time: 4, curve: 0.7 }, q: 0.9 },
          gain: -9,
          env: { attack: 3.7, rise: 2, decay: 0.25, curve: 3 }
        },
        {
          type: 'tone',
          freq: { from: hz(81), to: hz(86), time: 4, curve: 0.8 },
          tremolo: { rate: 7, depth: 0.35 },
          gain: -18,
          env: { attack: 3.6, rise: 2, decay: 0.2, curve: 3 }
        },
        {
          type: 'noise',
          color: 'pink',
          gain: -20,
          filter: { type: 'bandpass', freq: { from: 800, to: 2600, time: 4 }, q: 0.7 },
          env: { attack: 3.7, rise: 2, decay: 0.2, curve: 3 }
        }
      ]
    }
  },
  {
    id: 'upswing',
    name: 'Upswing',
    category: 'risers',
    description: 'A half second rise for quick cuts.',
    tags: 'riser short quick fast swell',
    recipe: {
      duration: 0.65,
      seed: 110,
      loudness: -16,
      lowpass: 7500,
      highpass: 80,
      ...room(0.2, 0.8),
      layers: [
        {
          type: 'noise',
          color: 'pink',
          filter: { type: 'lowpass', freq: { from: 500, to: 6000, time: 0.55, curve: 0.7 }, q: 0.7 },
          env: { attack: 0.5, rise: 2, decay: 0.06, curve: 3 }
        },
        {
          type: 'tone',
          wave: 'triangle',
          freq: { from: hz(62), to: hz(74), time: 0.55, curve: 0.8 },
          gain: -10,
          filter: { type: 'lowpass', freq: 3000, q: 0.6 },
          env: { attack: 0.5, rise: 2, decay: 0.06, curve: 3 }
        }
      ]
    }
  },
  {
    id: 'thunder',
    name: 'Thunder',
    category: 'impacts',
    description: 'A deep cinematic boom with a long rumble.',
    tags: 'impact boom thunder rumble cinematic deep',
    recipe: {
      duration: 3.8,
      seed: 114,
      loudness: -14,
      lowpass: 3000,
      highpass: 25,
      drive: 0.1,
      width: 0.8,
      ...room(0.35, 3.5, { damp: 2000, predelay: 0.02 }),
      layers: [
        sub(62, 30, { time: 1.2, decay: 2.6 }),
        {
          type: 'tone',
          freq: { from: 140, to: 70, time: 0.4, curve: 3 },
          gain: -2,
          env: { attack: 0.004, decay: 0.7, curve: 5 }
        },
        {
          type: 'noise',
          color: 'brown',
          gain: -2,
          tremolo: { rate: 7, depth: 0.45 },
          filter: { type: 'lowpass', freq: { from: 500, to: 120, time: 3 }, q: 0.6 },
          env: { attack: 0.01, decay: 3.4, curve: 3 }
        },
        {
          type: 'noise',
          color: 'pink',
          gain: -8,
          filter: { type: 'lowpass', freq: { from: 1800, to: 300, time: 0.3 }, q: 0.6 },
          env: { attack: 0.003, decay: 0.25, curve: 5 }
        }
      ]
    }
  },
  {
    id: 'slam',
    name: 'Slam',
    category: 'impacts',
    description: 'A tight, punchy hit for hard cuts.',
    tags: 'impact hit punch slam hard cut',
    recipe: {
      duration: 0.6,
      seed: 115,
      loudness: -13.5,
      lowpass: 6000,
      highpass: 30,
      drive: 0.2,
      ...room(0.12, 0.7, { damp: 3000 }),
      layers: [
        sub(95, 48, { time: 0.15, decay: 0.45 }),
        {
          type: 'tone',
          freq: { from: 210, to: 120, time: 0.06, curve: 3 },
          env: { attack: 0.002, decay: 0.16, curve: 5 }
        },
        {
          type: 'noise',
          color: 'pink',
          gain: -4,
          filter: { type: 'lowpass', freq: { from: 3500, to: 600, time: 0.06 }, q: 0.6 },
          env: { attack: 0.001, decay: 0.05, curve: 5 }
        },
        knock(1200, { gain: -12, decay: 0.012, q: 0.6 })
      ]
    }
  },
  {
    id: 'anvil',
    name: 'Anvil',
    category: 'impacts',
    description: 'A resonant metallic hit with a ringing tail.',
    tags: 'impact metal hit ring clang cinematic',
    recipe: {
      duration: 2,
      seed: 116,
      loudness: -15,
      lowpass: 7000,
      highpass: 40,
      ...room(0.25, 1.8, { damp: 5000 }),
      layers: [
        {
          type: 'tone',
          freq: 196,
          partials: [
            [1, 1, 1],
            [2.76, 0.5, 0.8],
            [5.4, 0.25, 0.5],
            [8.93, 0.12, 0.35],
            [13.3, 0.05, 0.2]
          ],
          env: { attack: 0.002, decay: 1.6, curve: 5 }
        },
        sub(110, 70, { decay: 0.3, gain: -6 }),
        knock(1500, { gain: -8, decay: 0.01, q: 0.7 })
      ]
    }
  },
  {
    id: 'timber',
    name: 'Timber',
    category: 'impacts',
    description: 'A dry wooden thud for warm cuts.',
    tags: 'impact wood thud knock warm dry',
    recipe: {
      duration: 0.6,
      seed: 117,
      loudness: -14.5,
      lowpass: 5000,
      highpass: 40,
      ...room(0.1, 0.6, { damp: 3500 }),
      layers: [
        wood(hz(43), { decay: 0.22 }),
        {
          type: 'tone',
          freq: { from: 160, to: 110, time: 0.05, curve: 3 },
          gain: -4,
          env: { attack: 0.002, decay: 0.12, curve: 5 }
        },
        knock(900, { gain: -6, decay: 0.02, q: 0.6 }),
        knock(2400, { gain: -16, decay: 0.006, q: 0.8 })
      ]
    }
  },
  {
    id: 'crystal',
    name: 'Crystal',
    category: 'impacts',
    description: 'A clear glassy impact with a shimmering tail.',
    tags: 'impact glass crystal shimmer bright',
    recipe: {
      duration: 2.4,
      seed: 118,
      loudness: -15,
      lowpass: 9000,
      highpass: 40,
      width: 0.8,
      ...room(0.35, 2.4, { damp: 7000 }),
      layers: [
        sub(80, 50, { decay: 0.4, gain: -4 }),
        knock(1000, { gain: -10, decay: 0.02, q: 0.6 }),
        ...[86, 93, 98].map((midi, index) =>
          glass(hz(midi), {
            decay: round(1.2 - index * 0.25),
            bright: 0.5,
            gain: -2 - index * 3,
            pan: [-0.3, 0.3, 0][index]
          })
        ),
        ...scatter(8, 118, (index, next) =>
          glass(hz([88, 91, 93, 95, 98][Math.floor(next() * 5)]), {
            at: round(0.05 + next() * 0.9),
            decay: round(0.2 + next() * 0.3),
            bright: 0.3,
            gain: round(-14 - next() * 6),
            pan: round((next() * 2 - 1) * 0.8)
          })
        )
      ]
    }
  },
  {
    id: 'braam',
    name: 'Braam',
    category: 'impacts',
    description: 'A huge low brass-like blast for trailers.',
    tags: 'impact braam trailer brass cinematic huge',
    recipe: {
      duration: 3,
      seed: 119,
      loudness: -14,
      lowpass: 3500,
      highpass: 28,
      drive: 0.25,
      width: 0.8,
      ...room(0.3, 3, { damp: 2500, predelay: 0.02, lowcut: 150 }),
      layers: [
        ...[
          [38, 6, 14, 0],
          [50, 4, 12, -6],
          [57, 3, 10, -10]
        ].map(([midi, voices, detune, gain]) => ({
          type: 'tone',
          wave: 'sawtooth',
          voices,
          detune,
          freq: hz(midi),
          gain,
          filter: {
            type: 'lowpass',
            freq: {
              points: [
                [0, 300],
                [0.25, 1500],
                [2.4, 380]
              ]
            },
            q: 1
          },
          env: { attack: 0.05, hold: 0.4, decay: 2.2, curve: 3 }
        })),
        sub(hz(26), hz(26), { decay: 2.4, gain: -4, attack: 0.03 }),
        {
          type: 'noise',
          color: 'pink',
          gain: -14,
          filter: { type: 'lowpass', freq: { from: 2000, to: 300, time: 0.3 }, q: 0.6 },
          env: { attack: 0.01, decay: 0.3, curve: 5 }
        }
      ]
    }
  },
  {
    id: 'distant',
    name: 'Distant',
    category: 'impacts',
    description: 'A far-off boom with a long echo.',
    tags: 'impact distant far boom echo atmosphere',
    recipe: {
      duration: 1.6,
      seed: 120,
      loudness: -15,
      lowpass: 1200,
      highpass: 28,
      echo: { time: 0.34, feedback: 0.45, mix: 0.35, damp: 900 },
      ...room(0.45, 3.5, { damp: 1500, predelay: 0.04, lowcut: 120 }),
      layers: [
        sub(70, 40, { decay: 1.2 }),
        {
          type: 'noise',
          color: 'brown',
          filter: { type: 'lowpass', freq: { from: 300, to: 100, time: 0.6 }, q: 0.6 },
          env: { attack: 0.005, decay: 0.8, curve: 4 }
        },
        {
          type: 'noise',
          color: 'pink',
          gain: -10,
          filter: { type: 'lowpass', freq: 700, q: 0.6 },
          env: { attack: 0.003, decay: 0.2, curve: 5 }
        }
      ]
    }
  },
  {
    id: 'swoop',
    name: 'Swoop',
    category: 'whooshes',
    description: 'A fast, deep swoop with a tonal edge.',
    tags: 'whoosh swoop pass tonal deep',
    recipe: {
      duration: 0.75,
      seed: 124,
      loudness: -16,
      lowpass: 6000,
      highpass: 60,
      ...room(0.12, 0.7),
      layers: [
        sweep({
          from: 300,
          top: 1500,
          to: 400,
          attack: 0.3,
          decay: 0.38,
          q: 0.8,
          pan: { from: -0.7, to: 0.7, time: 0.65 }
        }),
        {
          type: 'tone',
          freq: {
            points: [
              [0, 180],
              [0.3, 560],
              [0.68, 220]
            ]
          },
          gain: -10,
          pan: { from: -0.5, to: 0.5, time: 0.65 },
          env: { attack: 0.28, rise: 1.6, decay: 0.38, curve: 4 }
        },
        {
          type: 'noise',
          color: 'brown',
          gain: -8,
          filter: { type: 'lowpass', freq: 300, q: 0.6 },
          env: { attack: 0.3, rise: 1.6, decay: 0.35, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'whip',
    name: 'Whip',
    category: 'whooshes',
    description: 'A sharp, quick whip for snappy cuts.',
    tags: 'whoosh whip fast snap swipe',
    recipe: {
      duration: 0.3,
      seed: 125,
      loudness: -16.5,
      lowpass: 6500,
      highpass: 120,
      ...room(0.08, 0.4),
      layers: [
        sweep({
          from: 700,
          top: 1800,
          to: 1500,
          attack: 0.12,
          decay: 0.12,
          q: 0.9,
          rise: 2.2,
          pan: { from: -0.4, to: 0.5, time: 0.24 }
        }),
        sweep({ from: 300, top: 900, to: 400, gain: -8, attack: 0.12, decay: 0.1, q: 0.7, rise: 2.2 })
      ]
    }
  },
  {
    id: 'spin',
    name: 'Spin',
    category: 'whooshes',
    description: 'A whirling whoosh that circles around.',
    tags: 'whoosh spin circle whirl rotate',
    recipe: {
      duration: 1.2,
      seed: 126,
      loudness: -16.5,
      lowpass: 6000,
      highpass: 80,
      ...room(0.15, 0.9),
      layers: [
        {
          ...sweep({ from: 400, top: 1400, to: 500, attack: 0.5, decay: 0.6, q: 0.8 }),
          tremolo: { rate: 7, depth: 0.55 },
          pan: {
            points: [
              [0, -0.7],
              [0.2, 0.7],
              [0.4, -0.7],
              [0.6, 0.7],
              [0.8, -0.7],
              [1, 0.7]
            ]
          }
        },
        {
          type: 'tone',
          freq: {
            points: [
              [0, 220],
              [0.55, 440],
              [1.1, 260]
            ]
          },
          gain: -14,
          tremolo: { rate: 7, depth: 0.5 },
          env: { attack: 0.5, rise: 1.6, decay: 0.6, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'twin',
    name: 'Twin',
    category: 'whooshes',
    description: 'Two quick passes, one after the other.',
    tags: 'whoosh double pass twin fly by',
    recipe: {
      duration: 0.65,
      seed: 127,
      loudness: -16.5,
      lowpass: 6000,
      highpass: 80,
      ...room(0.1, 0.6),
      layers: [
        sweep({
          from: 500,
          top: 1300,
          to: 600,
          attack: 0.15,
          decay: 0.18,
          q: 0.85,
          pan: { from: -0.6, to: 0.2, time: 0.33 }
        }),
        sweep({
          from: 550,
          top: 1400,
          to: 650,
          at: 0.26,
          attack: 0.14,
          decay: 0.2,
          q: 0.85,
          pan: { from: -0.2, to: 0.6, time: 0.34 }
        })
      ]
    }
  },
  {
    id: 'gale',
    name: 'Gale',
    category: 'whooshes',
    description: 'A heavy, wide whoosh with low weight.',
    tags: 'whoosh heavy wide wind big low',
    recipe: {
      duration: 1.7,
      seed: 128,
      loudness: -15.5,
      lowpass: 5000,
      highpass: 30,
      width: 1,
      ...room(0.18, 1.2, { damp: 3500 }),
      layers: [
        sweep({
          from: 220,
          top: 950,
          to: 260,
          attack: 0.7,
          decay: 0.85,
          q: 0.6,
          pan: { from: -0.5, to: 0.5, time: 1.5 }
        }),
        {
          type: 'noise',
          color: 'brown',
          gain: -2,
          filter: {
            type: 'lowpass',
            freq: {
              points: [
                [0, 150],
                [0.7, 450],
                [1.55, 160]
              ]
            },
            q: 0.6
          },
          env: { attack: 0.7, rise: 1.5, decay: 0.85, curve: 3 }
        },
        sub(55, 45, { at: 0.6, decay: 0.8, gain: -10, attack: 0.15 })
      ]
    }
  },
  {
    id: 'silk',
    name: 'Silk',
    category: 'whooshes',
    description: 'A smooth, silky swish like fabric.',
    tags: 'whoosh silk fabric smooth soft swish',
    recipe: {
      duration: 0.7,
      seed: 129,
      loudness: -18,
      lowpass: 6000,
      highpass: 400,
      ...room(0.12, 0.6),
      layers: [
        sweep({
          from: 1100,
          top: 1500,
          to: 1400,
          attack: 0.25,
          decay: 0.35,
          q: 0.6,
          rise: 1.4,
          pan: { from: 0.4, to: -0.4, time: 0.6 }
        }),
        {
          type: 'noise',
          color: 'pink',
          gain: -22,
          filter: [
            { type: 'highpass', freq: 3500, q: 0.5 },
            { type: 'lowpass', freq: 7000, q: 0.5 }
          ],
          env: { attack: 0.25, rise: 1.4, decay: 0.3, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'backdraft',
    name: 'Backdraft',
    category: 'whooshes',
    description: 'A reversed whoosh that sucks into the cut.',
    tags: 'whoosh reverse suck in backdraft pull',
    recipe: {
      duration: 1.3,
      seed: 130,
      loudness: -16,
      lowpass: 6000,
      highpass: 50,
      reverse: true,
      ...room(0.2, 1),
      layers: [
        sweep({
          from: 1600,
          to: 300,
          attack: 0.01,
          decay: 1.2,
          q: 0.7,
          rise: 1,
          curve: 3,
          pan: { from: 0.6, to: -0.6, time: 1.2 }
        }),
        {
          type: 'noise',
          color: 'brown',
          gain: -6,
          filter: { type: 'lowpass', freq: 400, q: 0.6 },
          env: { attack: 0.01, decay: 1.1, curve: 3 }
        }
      ]
    }
  },
  {
    id: 'rewind',
    name: 'Rewind',
    category: 'transitions',
    description: 'A quick tape rewind for flashbacks.',
    tags: 'rewind tape flashback reverse retro transition',
    recipe: {
      duration: 1.05,
      seed: 134,
      loudness: -17,
      lowpass: 5000,
      highpass: 100,
      ...room(0.08, 0.4),
      layers: [
        {
          type: 'tone',
          wave: 'sawtooth',
          freq: { from: 180, to: 1600, time: 0.95, curve: 0.8 },
          tremolo: { rate: 28, depth: 0.6 },
          filter: { type: 'lowpass', freq: 2600, q: 0.8 },
          gain: -6,
          env: { attack: 0.05, hold: 0.8, decay: 0.12, curve: 4 }
        },
        {
          type: 'tone',
          wave: 'triangle',
          freq: { from: 260, to: 2200, time: 0.95, curve: 0.8 },
          vibrato: { rate: 13, depth: 60 },
          gain: -12,
          filter: { type: 'lowpass', freq: 3000, q: 0.6 },
          env: { attack: 0.05, hold: 0.8, decay: 0.12, curve: 4 }
        },
        sweep({ from: 500, to: 3000, gain: -10, attack: 0.05, hold: 0.8, decay: 0.12, q: 0.6 })
      ]
    }
  },
  {
    id: 'slowdown',
    name: 'Slowdown',
    category: 'transitions',
    description: 'A tape stop that winds the scene down.',
    tags: 'tape stop slow down wind down power off transition',
    recipe: {
      duration: 1.15,
      seed: 135,
      loudness: -16,
      lowpass: 5000,
      highpass: 30,
      ...room(0.1, 0.5),
      layers: [
        ...[50, 57, 62].map((midi, index) => ({
          type: 'tone',
          wave: 'sawtooth',
          voices: 2,
          detune: 6,
          freq: { from: hz(midi), to: round(hz(midi) * 0.12), time: 0.95, curve: 0.55 },
          gain: -4 - index * 3,
          filter: { type: 'lowpass', freq: { from: 2400, to: 200, time: 0.95 }, q: 0.7 },
          env: { attack: 0.01, hold: 0.8, decay: 0.2, curve: 3 }
        })),
        {
          type: 'noise',
          color: 'pink',
          gain: -16,
          filter: { type: 'lowpass', freq: { from: 3000, to: 200, time: 0.9 }, q: 0.6 },
          env: { attack: 0.01, hold: 0.7, decay: 0.25, curve: 3 }
        }
      ]
    }
  },
  {
    id: 'wipe',
    name: 'Wipe',
    category: 'transitions',
    description: 'A clean tonal sweep for wipes and slides.',
    tags: 'wipe slide transition sweep clean',
    recipe: {
      duration: 0.55,
      seed: 136,
      loudness: -18,
      lowpass: 7000,
      highpass: 120,
      ...room(0.15, 0.7),
      layers: [
        {
          type: 'tone',
          freq: { from: 300, to: 1200, time: 0.5, curve: 1.5 },
          pan: { from: -0.6, to: 0.6, time: 0.5 },
          env: { attack: 0.2, rise: 1.4, decay: 0.3, curve: 4 }
        },
        {
          type: 'tone',
          wave: 'triangle',
          freq: { from: 600, to: 2400, time: 0.5, curve: 1.5 },
          gain: -14,
          pan: { from: -0.6, to: 0.6, time: 0.5 },
          filter: { type: 'lowpass', freq: 3000, q: 0.6 },
          env: { attack: 0.2, rise: 1.4, decay: 0.3, curve: 4 }
        },
        sweep({
          from: 600,
          to: 2400,
          gain: -8,
          attack: 0.2,
          decay: 0.3,
          q: 0.8,
          pan: { from: -0.6, to: 0.6, time: 0.5 }
        })
      ]
    }
  },
  {
    id: 'zoom',
    name: 'Zoom',
    category: 'transitions',
    description: 'A punchy zoom-in with a tonal rise and a landing.',
    tags: 'zoom in punch transition rise focus',
    recipe: {
      duration: 0.65,
      seed: 137,
      loudness: -15.5,
      lowpass: 7000,
      highpass: 35,
      ...room(0.12, 0.6),
      layers: [
        {
          type: 'tone',
          freq: { from: 120, to: 900, time: 0.3, curve: 0.7 },
          env: { attack: 0.25, rise: 2, decay: 0.05, curve: 4 }
        },
        sweep({ from: 400, to: 3500, attack: 0.28, decay: 0.05, q: 0.7, rise: 2 }),
        sub(110, 55, { at: 0.3, decay: 0.25, gain: -4 }),
        knock(800, { at: 0.3, gain: -10, decay: 0.03, q: 0.6 })
      ]
    }
  },
  {
    id: 'dissolve',
    name: 'Dissolve',
    category: 'transitions',
    description: 'A soft granular shimmer for fading between scenes.',
    tags: 'dissolve fade crossfade granular shimmer soft',
    recipe: {
      duration: 1.6,
      seed: 138,
      loudness: -19,
      lowpass: 9000,
      highpass: 300,
      width: 0.8,
      ...room(0.4, 1.8, { damp: 7000 }),
      layers: [
        ...scatter(26, 138, (index, next) => ({
          type: 'tone',
          freq: hz([74, 78, 81, 83, 86, 88, 90, 93][Math.floor(next() * 8)]),
          at: round(Math.sin((next() * Math.PI) / 2) * 1.3),
          gain: round(-10 - next() * 8),
          pan: round((next() * 2 - 1) * 0.8),
          env: { attack: 0.02, decay: round(0.05 + next() * 0.1), curve: 4 }
        })),
        {
          type: 'noise',
          color: 'pink',
          gain: -20,
          filter: { type: 'bandpass', freq: 3000, q: 0.5 },
          env: { attack: 0.6, rise: 1.5, decay: 0.9, curve: 3 }
        }
      ]
    }
  },
  {
    id: 'portal',
    name: 'Portal',
    category: 'transitions',
    description: 'A swirling warp for magical transitions.',
    tags: 'portal warp magic swirl teleport transition',
    recipe: {
      duration: 1.9,
      seed: 139,
      loudness: -17,
      lowpass: 3500,
      highpass: 60,
      width: 0.8,
      ...room(0.4, 2.2, { damp: 5000 }),
      layers: [
        {
          type: 'tone',
          freq: {
            points: [
              [0, 200],
              [0.9, 700],
              [1.8, 300]
            ]
          },
          fm: {
            ratio: 1.5,
            index: {
              points: [
                [0, 0.5],
                [0.9, 1.5],
                [1.8, 0.5]
              ]
            }
          },
          vibrato: { rate: 6, depth: 40 },
          gain: -6,
          filter: { type: 'lowpass', freq: 3000, q: 0.6 },
          env: { attack: 0.8, rise: 1.6, decay: 1, curve: 3 }
        },
        {
          ...sweep({ from: 300, top: 1500, to: 400, attack: 0.9, decay: 1, q: 1.2 }),
          tremolo: { rate: 9, depth: 0.5 },
          pan: {
            points: [
              [0, -0.6],
              [0.4, 0.6],
              [0.8, -0.6],
              [1.2, 0.6],
              [1.6, -0.6]
            ]
          }
        }
      ]
    }
  },
  {
    id: 'ding',
    name: 'Ding',
    category: 'accents',
    description: 'A clean bell ding for highlights.',
    tags: 'ding bell highlight accent correct',
    recipe: {
      duration: 1.6,
      seed: 143,
      loudness: -16,
      lowpass: 8500,
      ...room(0.25, 1.4, { damp: 6500 }),
      layers: [bell(hz(88), { decay: 1.4, bright: 0.8 }), bell(hz(76), { decay: 1, bright: 0.3, gain: -14 })]
    }
  },
  {
    id: 'spark',
    name: 'Spark',
    category: 'accents',
    description: 'A tiny electric spark for callouts.',
    tags: 'spark electric zap tiny accent',
    recipe: {
      duration: 0.3,
      seed: 144,
      loudness: -18,
      lowpass: 6000,
      highpass: 400,
      ...room(0.1, 0.4),
      layers: [
        ...scatter(9, 144, (index, next) =>
          knock(round(1200 + next() * 1600), {
            at: round(Math.pow(next(), 1.5) * 0.08),
            gain: round(-8 - next() * 10),
            decay: 0.002,
            attack: 0.0004,
            q: 1.2
          })
        ),
        {
          type: 'tone',
          freq: { from: 2200, to: 900, time: 0.05, curve: 3 },
          gain: -12,
          env: { attack: 0.001, decay: 0.04, curve: 5 }
        }
      ]
    }
  },
  {
    id: 'wand',
    name: 'Wand',
    category: 'accents',
    description: 'A quick magical flourish.',
    tags: 'magic wand flourish sparkle fantasy',
    recipe: {
      duration: 1.3,
      seed: 145,
      loudness: -17,
      lowpass: 9500,
      highpass: 200,
      width: 0.8,
      ...room(0.35, 1.6, { damp: 7500 }),
      layers: [
        ...[74, 78, 81, 86, 90, 93, 98].map((midi, index) =>
          glass(hz(midi), {
            at: round(index * 0.05),
            decay: round(0.3 + index * 0.05),
            bright: 0.4,
            gain: round(-4 - index * 0.8),
            pan: index % 2 ? 0.3 : -0.3
          })
        ),
        sweep({ from: 2000, to: 7000, gain: -18, attack: 0.3, decay: 0.6, q: 0.5 })
      ]
    }
  },
  {
    id: 'stroke',
    name: 'Stroke',
    category: 'accents',
    description: 'A quick marker stroke for underlines and circles.',
    tags: 'marker pen underline circle draw stroke',
    recipe: {
      duration: 0.36,
      seed: 146,
      loudness: -19,
      lowpass: 6000,
      highpass: 500,
      ...room(0.06, 0.3),
      layers: [
        {
          type: 'noise',
          color: 'pink',
          tremolo: { rate: 45, depth: 0.35 },
          pan: { from: -0.3, to: 0.3, time: 0.3 },
          filter: { type: 'bandpass', freq: { from: 1100, to: 1500, time: 0.3 }, q: 0.9 },
          env: { attack: 0.03, hold: 0.18, decay: 0.12, curve: 4 }
        },
        {
          type: 'noise',
          color: 'crackle',
          gain: 1,
          filter: { type: 'bandpass', freq: 1800, q: 0.7 },
          env: { attack: 0.03, hold: 0.18, decay: 0.12, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'glint',
    name: 'Glint',
    category: 'accents',
    description: 'A bright glint for shiny highlights.',
    tags: 'glint shine sparkle highlight bright',
    recipe: {
      duration: 0.8,
      seed: 147,
      loudness: -18,
      lowpass: 10000,
      highpass: 500,
      ...room(0.3, 1.2, { damp: 8000 }),
      layers: [
        fmbell(hz(88), { decay: 0.5, ratio: 3.01, index: 0.7 }),
        fmbell(hz(95), { at: 0.03, decay: 0.35, gain: -8, ratio: 2, index: 0.5 }),
        sweep({ from: 2500, to: 6000, gain: -20, attack: 0.04, decay: 0.2, q: 0.6 })
      ]
    }
  },
  {
    id: 'focus',
    name: 'Focus',
    category: 'accents',
    description: 'A camera focus whir and confirm beeps for emphasis.',
    tags: 'camera focus autofocus beep emphasis',
    recipe: {
      duration: 0.32,
      seed: 148,
      loudness: -19,
      lowpass: 8000,
      ...room(0.06, 0.25),
      layers: [
        knock(3000, { gain: -10, decay: 0.003, q: 1.5 }),
        knock(3000, { at: 0.06, gain: -12, decay: 0.003, q: 1.5 }),
        { type: 'tone', freq: hz(93), at: 0.12, env: { attack: 0.003, hold: 0.03, decay: 0.04, curve: 5 } },
        { type: 'tone', freq: hz(93), at: 0.2, env: { attack: 0.003, hold: 0.03, decay: 0.06, curve: 5 } }
      ]
    }
  },
  {
    id: 'plunge',
    name: 'Plunge',
    category: 'drops',
    description: 'A deep sub drop that lands heavy.',
    tags: 'drop sub bass deep heavy plunge',
    recipe: {
      duration: 2,
      seed: 301,
      loudness: -14,
      lowpass: 2500,
      highpass: 20,
      drive: 0.12,
      ...room(0.2, 1.8, { damp: 2500 }),
      layers: [
        sub(110, 32, { time: 1.4, decay: 1.8, curve: 4 }),
        {
          type: 'noise',
          color: 'brown',
          gain: -10,
          filter: { type: 'lowpass', freq: { from: 600, to: 120, time: 1.2 }, q: 0.6 },
          env: { attack: 0.005, decay: 1.2, curve: 4 }
        },
        knock(900, { gain: -14, decay: 0.02, q: 0.6 })
      ]
    }
  },
  {
    id: 'descent',
    name: 'Descent',
    category: 'drops',
    description: 'A falling noise sweep that settles the energy.',
    tags: 'downlifter drop fall sweep release',
    recipe: {
      duration: 2.6,
      seed: 302,
      loudness: -16,
      lowpass: 8000,
      highpass: 40,
      width: 0.7,
      ...room(0.25, 1.8, { damp: 4000 }),
      layers: [
        {
          type: 'noise',
          color: 'pink',
          filter: { type: 'lowpass', freq: { from: 8000, to: 250, time: 2.4, curve: 2 }, q: 0.7 },
          env: { attack: 0.05, decay: 2.4, curve: 3 }
        },
        {
          type: 'tone',
          wave: 'triangle',
          freq: { from: hz(74), to: hz(50), time: 2.2, curve: 2 },
          gain: -12,
          filter: { type: 'lowpass', freq: 1800, q: 0.6 },
          env: { attack: 0.05, decay: 2.2, curve: 3 }
        }
      ]
    }
  },
  {
    id: 'sink',
    name: 'Sink',
    category: 'drops',
    description: 'A smooth bass slide down into silence.',
    tags: 'drop bass slide sink low smooth',
    recipe: {
      duration: 1.4,
      seed: 303,
      loudness: -15,
      lowpass: 1500,
      highpass: 22,
      ...room(0.15, 1.2, { damp: 2000 }),
      layers: [
        {
          type: 'tone',
          wave: 'triangle',
          freq: { from: hz(38), to: hz(26), time: 1.1, curve: 2 },
          filter: { type: 'lowpass', freq: 400, q: 0.6 },
          env: { attack: 0.01, decay: 1.3, curve: 3 }
        },
        sub(hz(26), hz(14), { time: 1.1, decay: 1.3, gain: -4, attack: 0.01, curve: 3 })
      ]
    }
  },
  {
    id: 'quake',
    name: 'Quake',
    category: 'drops',
    description: 'A low rumble that drops out from under you.',
    tags: 'rumble quake earthquake low drop shake',
    recipe: {
      duration: 2.6,
      seed: 304,
      loudness: -14.5,
      lowpass: 1200,
      highpass: 22,
      drive: 0.15,
      width: 0.8,
      ...room(0.25, 2.4, { damp: 1800 }),
      layers: [
        {
          type: 'noise',
          color: 'brown',
          tremolo: { rate: 6, depth: 0.6 },
          filter: { type: 'lowpass', freq: { from: 260, to: 90, time: 2.4 }, q: 0.7 },
          env: { attack: 0.08, decay: 2.4, curve: 3 }
        },
        sub(50, 30, { time: 2, decay: 2.3, gain: -2, attack: 0.05, curve: 3 })
      ]
    }
  },
  {
    id: 'fall',
    name: 'Fall',
    category: 'drops',
    description: 'A falling tone and air for exits.',
    tags: 'fall drop down exit downlifter tone',
    recipe: {
      duration: 2,
      seed: 305,
      loudness: -16.5,
      lowpass: 7000,
      highpass: 40,
      ...room(0.25, 1.6, { damp: 4500 }),
      layers: [
        {
          type: 'tone',
          freq: { from: hz(86), to: hz(50), time: 1.8, curve: 1.5 },
          env: { attack: 0.03, decay: 1.8, curve: 3 }
        },
        {
          type: 'tone',
          wave: 'triangle',
          freq: { from: hz(74), to: hz(38), time: 1.8, curve: 1.5 },
          gain: -10,
          filter: { type: 'lowpass', freq: 1500, q: 0.6 },
          env: { attack: 0.03, decay: 1.8, curve: 3 }
        },
        sweep({ from: 3000, to: 400, gain: -12, attack: 0.05, decay: 1.6, q: 0.7, rise: 1, curve: 3 })
      ]
    }
  },
  {
    id: 'dip',
    name: 'Dip',
    category: 'drops',
    description: 'A quick half second drop for beat cuts.',
    tags: 'drop quick short dip beat cut',
    recipe: {
      duration: 0.45,
      seed: 306,
      loudness: -15,
      lowpass: 3000,
      highpass: 30,
      ...room(0.12, 0.5, { damp: 2500 }),
      layers: [
        sub(220, 60, { time: 0.35, decay: 0.4, curve: 4 }),
        sweep({ from: 1500, to: 300, gain: -10, attack: 0.01, decay: 0.3, q: 0.7, rise: 1 })
      ]
    }
  },
  {
    id: 'gravity',
    name: 'Gravity',
    category: 'drops',
    description: 'A heavy pitch dive with a deep landing.',
    tags: 'drop dive gravity heavy landing bass',
    recipe: {
      duration: 1.7,
      seed: 307,
      loudness: -14.5,
      lowpass: 4000,
      highpass: 25,
      drive: 0.2,
      ...room(0.2, 1.4, { damp: 2500 }),
      layers: [
        {
          type: 'tone',
          wave: 'sawtooth',
          voices: 3,
          detune: 10,
          freq: { from: 400, to: 50, time: 1.2, curve: 1.6 },
          filter: { type: 'lowpass', freq: { from: 3000, to: 250, time: 1.2 }, q: 0.8 },
          gain: -4,
          env: { attack: 0.02, hold: 1, decay: 0.2, curve: 3 }
        },
        sub(70, 38, { at: 1.18, time: 0.3, decay: 0.5 }),
        knock(600, { at: 1.18, gain: -8, decay: 0.03, q: 0.6 })
      ]
    }
  },
  {
    id: 'bitflip',
    name: 'Bitflip',
    category: 'glitches',
    description: 'A short digital stutter.',
    tags: 'glitch stutter digital bit error',
    recipe: {
      duration: 0.4,
      seed: 311,
      loudness: -18,
      lowpass: 6000,
      highpass: 100,
      crush: 0.35,
      stutter: { slice: 0.025, chance: 0.55 },
      layers: [
        {
          type: 'tone',
          harmonics: [1, 0, 0.33, 0, 0.2],
          freq: hz(69),
          env: { attack: 0.003, hold: 0.25, decay: 0.12, curve: 4 }
        },
        {
          type: 'tone',
          harmonics: [1, 0, 0.33, 0, 0.2],
          freq: hz(76),
          gain: -6,
          env: { attack: 0.003, hold: 0.25, decay: 0.12, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'snow',
    name: 'Snow',
    category: 'glitches',
    description: 'A brief burst of soft static.',
    tags: 'static noise tv snow interference glitch',
    recipe: {
      duration: 0.5,
      seed: 312,
      loudness: -20,
      lowpass: 4500,
      highpass: 500,
      ...room(0.05, 0.3),
      layers: [
        {
          type: 'noise',
          color: 'pink',
          tremolo: { rate: 35, depth: 0.4 },
          filter: { type: 'bandpass', freq: 1200, q: 0.5 },
          env: { attack: 0.01, decay: 0.45, curve: 3 }
        },
        {
          type: 'noise',
          color: 'crackle',
          gain: 4,
          filter: { type: 'highpass', freq: 1500, q: 0.5 },
          env: { attack: 0.01, decay: 0.45, curve: 3 }
        }
      ]
    }
  },
  {
    id: 'data',
    name: 'Data',
    category: 'glitches',
    description: 'A quick chirp of digital data.',
    tags: 'data digital computer chirp tech hud',
    recipe: {
      duration: 0.6,
      seed: 313,
      loudness: -19,
      lowpass: 5000,
      highpass: 200,
      ...room(0.08, 0.3),
      layers: scatter(18, 313, (index, next) => ({
        type: 'tone',
        harmonics: [1, 0, 0.3, 0, 0.15],
        freq: hz([76, 79, 81, 83, 86, 88, 91, 93][Math.floor(next() * 8)]),
        at: round(index * 0.03),
        gain: round(-2 - next() * 6),
        pan: round((next() * 2 - 1) * 0.4),
        env: { attack: 0.002, hold: 0.012, decay: 0.008, curve: 5 }
      }))
    }
  },
  {
    id: 'scramble',
    name: 'Scramble',
    category: 'glitches',
    description: 'A fast scramble of tones for tech reveals.',
    tags: 'scramble glitch tech decode reveal digital',
    recipe: {
      duration: 0.8,
      seed: 314,
      loudness: -18.5,
      lowpass: 6000,
      highpass: 150,
      crush: 0.25,
      ...room(0.1, 0.4),
      layers: scatter(26, 314, (index, next) => ({
        type: 'tone',
        freq: round(250 + Math.pow(next(), 1.5) * 950),
        fm: { ratio: round(1 + next() * 2), index: 1.4 },
        at: round(index * 0.026 + next() * 0.008),
        gain: round(-4 - next() * 8),
        pan: round((next() * 2 - 1) * 0.6),
        env: { attack: 0.002, hold: 0.01, decay: 0.012, curve: 5 }
      }))
    }
  },
  {
    id: 'tracking',
    name: 'Tracking',
    category: 'glitches',
    description: 'A wobbly tape glitch like old VHS.',
    tags: 'vhs tape wobble retro glitch warp',
    recipe: {
      duration: 1.2,
      seed: 315,
      loudness: -18,
      lowpass: 5000,
      highpass: 80,
      crush: 0.15,
      ...room(0.12, 0.6),
      layers: [
        ...[62, 66, 69].map((midi, index) => ({
          type: 'tone',
          wave: 'triangle',
          freq: hz(midi),
          vibrato: { rate: 1.3, depth: 45 },
          gain: -index * 3,
          filter: { type: 'lowpass', freq: 2000, q: 0.6 },
          env: { attack: 0.02, hold: 0.8, decay: 0.3, curve: 4 }
        })),
        {
          type: 'noise',
          color: 'pink',
          gain: -16,
          filter: { type: 'highpass', freq: 2500, q: 0.5 },
          env: { attack: 0.02, hold: 0.8, decay: 0.3, curve: 4 }
        },
        {
          type: 'noise',
          color: 'crackle',
          gain: 2,
          filter: { type: 'bandpass', freq: 3000, q: 0.6 },
          env: { attack: 0.02, hold: 0.8, decay: 0.3, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'corrupt',
    name: 'Corrupt',
    category: 'glitches',
    description: 'A crunchy digital error hit.',
    tags: 'error corrupt glitch crunch digital hit',
    recipe: {
      duration: 0.6,
      seed: 316,
      loudness: -16.5,
      lowpass: 6000,
      highpass: 40,
      drive: 0.3,
      crush: 0.5,
      stutter: { slice: 0.04, chance: 0.6 },
      ...room(0.08, 0.4),
      layers: [
        {
          type: 'tone',
          harmonics: [1, 0, 0.33, 0, 0.2, 0, 0.14],
          freq: hz(38),
          env: { attack: 0.002, hold: 0.3, decay: 0.2, curve: 4 }
        },
        {
          type: 'noise',
          color: 'pink',
          gain: -6,
          filter: { type: 'bandpass', freq: 1500, q: 0.5 },
          env: { attack: 0.002, decay: 0.3, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'zap',
    name: 'Zap',
    category: 'glitches',
    description: 'A quick electric zap.',
    tags: 'zap electric laser shock sci-fi',
    recipe: {
      duration: 0.25,
      seed: 317,
      loudness: -18,
      lowpass: 7000,
      highpass: 120,
      ...room(0.08, 0.35),
      layers: [
        {
          type: 'tone',
          freq: { from: 1600, to: 160, time: 0.18, curve: 2 },
          fm: { ratio: 1.41, index: 2 },
          env: { attack: 0.002, decay: 0.2, curve: 4 }
        },
        {
          type: 'noise',
          color: 'crackle',
          gain: 6,
          filter: { type: 'bandpass', freq: 2000, q: 0.6 },
          env: { attack: 0.002, decay: 0.15, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'pixel',
    name: 'Pixel',
    category: 'glitches',
    description: 'Tiny 8-bit blips for pixel graphics.',
    tags: '8bit retro game pixel chiptune blip',
    recipe: {
      duration: 0.4,
      seed: 318,
      loudness: -19,
      lowpass: 6000,
      ...room(0.08, 0.3),
      layers: [72, 76, 79, 84].map((midi, index) => ({
        type: 'tone',
        harmonics: [1, 0, 0.33, 0, 0.2],
        freq: hz(midi),
        at: round(index * 0.045),
        gain: -index,
        env: { attack: 0.002, hold: 0.03, decay: index === 3 ? 0.18 : 0.012, curve: 5 }
      }))
    }
  },
  {
    id: 'nebula',
    name: 'Nebula',
    category: 'ambience',
    description: 'A soft, airy space pad.',
    tags: 'ambience pad space air bed atmosphere',
    recipe: {
      duration: 9.5,
      seed: 321,
      loudness: -21,
      lowpass: 7000,
      highpass: 60,
      width: 0.9,
      ...room(0.4, 3, { damp: 5000, predelay: 0.03 }),
      layers: [
        ...pad([62, 69, 76, 78], {
          gain: -4,
          attack: 2.5,
          hold: 4.5,
          decay: 2.5,
          wave: 'sine',
          voices: 3,
          detune: 9,
          cutoff: 5000,
          step: 2.5
        }).map((layer, index) => ({ ...layer, vibrato: { rate: round(0.2 + index * 0.07), depth: 8 } })),
        {
          type: 'noise',
          color: 'pink',
          gain: -14,
          filter: {
            type: 'bandpass',
            freq: {
              points: [
                [0, 2000],
                [3, 3500],
                [6, 2200],
                [9.5, 3200]
              ]
            },
            q: 1.2
          },
          env: { attack: 2.5, hold: 4.5, decay: 2.5, curve: 3 }
        }
      ]
    }
  },
  {
    id: 'calm',
    name: 'Calm',
    category: 'ambience',
    description: 'A warm, quiet pad for calm scenes.',
    tags: 'ambience calm warm pad soft bed',
    recipe: {
      duration: 9.5,
      seed: 322,
      loudness: -21,
      lowpass: 2500,
      highpass: 40,
      width: 0.8,
      ...room(0.3, 2.6, { damp: 3500 }),
      layers: pad([50, 57, 62, 66], {
        gain: -2,
        attack: 2.5,
        hold: 5,
        decay: 2,
        voices: 3,
        detune: 7,
        cutoff: 900,
        step: 2
      }).map(layer => ({ ...layer, tremolo: { rate: 0.2, depth: 0.25 } }))
    }
  },
  {
    id: 'drizzle',
    name: 'Drizzle',
    category: 'ambience',
    description: 'Soft rain on glass.',
    tags: 'rain drizzle weather ambience water',
    recipe: {
      duration: 9.5,
      seed: 323,
      loudness: -22,
      lowpass: 7000,
      highpass: 150,
      width: 1,
      ...room(0.2, 1.2, { damp: 6000 }),
      layers: [
        {
          type: 'noise',
          color: 'pink',
          filter: { type: 'lowpass', freq: 2400, q: 0.5 },
          env: { attack: 1.5, hold: 6.5, decay: 1.5, curve: 3 }
        },
        {
          type: 'noise',
          color: 'crackle',
          gain: 3,
          filter: [
            { type: 'bandpass', freq: 2600, q: 0.6 },
            { type: 'lowpass', freq: 4500, q: 0.5 }
          ],
          env: { attack: 1.5, hold: 6.5, decay: 1.5, curve: 3 }
        },
        ...scatter(30, 323, (index, next) =>
          bubble(round(1800 + next() * 2000), {
            at: round(0.8 + next() * 7.8),
            decay: 0.008,
            rise: 1.3,
            gain: round(-12 - next() * 10),
            pan: round((next() * 2 - 1) * 0.9)
          })
        )
      ]
    }
  },
  {
    id: 'studio',
    name: 'Studio',
    category: 'ambience',
    description: 'A quiet room tone to fill silence.',
    tags: 'room tone silence fill ambience quiet',
    recipe: {
      duration: 9.5,
      seed: 324,
      loudness: -30,
      lowpass: 1500,
      highpass: 40,
      width: 0.8,
      layers: [
        {
          type: 'noise',
          color: 'brown',
          filter: { type: 'lowpass', freq: 800, q: 0.5 },
          env: { attack: 1, hold: 7.5, decay: 1, curve: 3 }
        },
        {
          type: 'noise',
          color: 'pink',
          gain: -10,
          filter: { type: 'lowpass', freq: 1500, q: 0.5 },
          env: { attack: 1, hold: 7.5, decay: 1, curve: 3 }
        }
      ]
    }
  },
  {
    id: 'highland',
    name: 'Highland',
    category: 'ambience',
    description: 'A soft wind with gentle gusts.',
    tags: 'wind outdoor gust ambience nature',
    recipe: {
      duration: 9.5,
      seed: 325,
      loudness: -21,
      lowpass: 5000,
      highpass: 60,
      width: 1,
      ...room(0.2, 1.5, { damp: 4000 }),
      layers: [
        {
          type: 'noise',
          color: 'pink',
          pan: {
            points: [
              [0, -0.4],
              [3, 0.3],
              [6, -0.2],
              [9.5, 0.4]
            ]
          },
          filter: {
            type: 'bandpass',
            freq: {
              points: [
                [0, 350],
                [2, 900],
                [3.8, 420],
                [5.6, 1100],
                [7.5, 380],
                [9.5, 700]
              ]
            },
            q: 1.4
          },
          env: { attack: 1.5, hold: 6.5, decay: 1.5, curve: 3 }
        },
        {
          type: 'noise',
          color: 'brown',
          gain: -4,
          tremolo: { rate: 0.3, depth: 0.5 },
          filter: { type: 'lowpass', freq: 300, q: 0.6 },
          env: { attack: 1.5, hold: 6.5, decay: 1.5, curve: 3 }
        }
      ]
    }
  },
  {
    id: 'deep',
    name: 'Deep',
    category: 'ambience',
    description: 'A muffled underwater drone with a few bubbles.',
    tags: 'underwater ocean deep drone ambience bubbles',
    recipe: {
      duration: 9.5,
      seed: 326,
      loudness: -21,
      lowpass: 1200,
      highpass: 30,
      width: 0.8,
      ...room(0.35, 2.5, { damp: 1200 }),
      layers: [
        {
          type: 'noise',
          color: 'brown',
          filter: { type: 'lowpass', freq: 350, q: 0.6 },
          env: { attack: 2, hold: 5.5, decay: 2, curve: 3 }
        },
        {
          type: 'tone',
          freq: hz(38),
          vibrato: { rate: 0.3, depth: 30 },
          gain: -6,
          env: { attack: 2, hold: 5.5, decay: 2, curve: 3 }
        },
        ...scatter(6, 326, (index, next) =>
          bubble(round(250 + next() * 300), {
            at: round(1.5 + index * 1.2 + next() * 0.6),
            decay: 0.06,
            rise: 1.8,
            gain: round(-6 - next() * 6),
            pan: round((next() * 2 - 1) * 0.6)
          })
        )
      ]
    }
  },
  {
    id: 'nocturne',
    name: 'Nocturne',
    category: 'ambience',
    description: 'A dark, slow drone with faint night insects.',
    tags: 'night dark drone ambience crickets',
    recipe: {
      duration: 9.5,
      seed: 327,
      loudness: -21,
      lowpass: 6000,
      highpass: 40,
      width: 0.9,
      ...room(0.3, 2.4, { damp: 3500 }),
      layers: [
        ...pad([38, 45, 50], {
          gain: -2,
          attack: 2.5,
          hold: 5,
          decay: 2,
          wave: 'sawtooth',
          voices: 3,
          detune: 9,
          cutoff: 450,
          step: 3
        }),
        ...scatter(10, 327, (index, next) => ({
          type: 'tone',
          freq: round(3800 + next() * 700),
          at: round(1 + index * 0.75 + next() * 0.3),
          gain: round(-24 - next() * 6),
          pan: round((next() * 2 - 1) * 0.8),
          tremolo: { rate: 38, depth: 0.9 },
          env: { attack: 0.02, hold: 0.1, decay: 0.05, curve: 4 }
        }))
      ]
    }
  },
  {
    id: 'caption',
    name: 'Caption',
    category: 'titles',
    description: 'Real key clicks for type-on titles.',
    tags: 'typing typewriter type on title text keyboard recorded',
    recipe: {
      duration: 0.95,
      seed: 331,
      samples: KEYCAP,
      loudness: -20,
      highpass: 160,
      lowpass: 9500,
      ...room(0.05, 0.2),
      layers: scatter(10, 331, (index, next) => ({
        type: 'sample',
        offset: index,
        at: round(index * 0.085 + next() * 0.02),
        gain: round(-next() * 2.5),
        env: { attack: 0.0012, hold: 0.07, decay: 0.02, curve: 4 }
      }))
    }
  },
  {
    id: 'appear',
    name: 'Appear',
    category: 'titles',
    description: 'A soft pop for text popping in.',
    tags: 'pop text appear title in',
    recipe: {
      duration: 0.2,
      seed: 332,
      loudness: -18,
      lowpass: 7000,
      ...room(0.1, 0.35),
      layers: [
        bubble(380, { decay: 0.06 }),
        sweep({ from: 900, to: 1800, gain: -18, attack: 0.012, decay: 0.05, q: 0.9 })
      ]
    }
  },
  {
    id: 'tickertape',
    name: 'Tickertape',
    category: 'titles',
    description: 'Rapid soft ticks for letter by letter text.',
    tags: 'letters text reveal tick title typing',
    recipe: {
      duration: 0.7,
      seed: 333,
      loudness: -19,
      lowpass: 7000,
      ...room(0.06, 0.2),
      layers: ticks(14, { gap: 0.045, from: hz(86), to: hz(86), decay: 0.015, seed: 333 })
    }
  },
  {
    id: 'slide',
    name: 'Slide',
    category: 'titles',
    description: 'A short tonal slide that lands, for titles moving in.',
    tags: 'slide title move in text motion',
    recipe: {
      duration: 0.45,
      seed: 334,
      loudness: -18,
      lowpass: 6500,
      highpass: 150,
      ...room(0.1, 0.4),
      layers: [
        sweep({ from: 500, to: 1500, attack: 0.25, decay: 0.08, q: 0.8, rise: 1.6 }),
        {
          type: 'tone',
          freq: { from: hz(69), to: hz(76), time: 0.3, curve: 2 },
          gain: -10,
          env: { attack: 0.25, rise: 1.6, decay: 0.08, curve: 4 }
        },
        wood(hz(76), { at: 0.32, decay: 0.06, gain: -6 })
      ]
    }
  },
  {
    id: 'counter',
    name: 'Counter',
    category: 'titles',
    description: 'Fast rising ticks for counting numbers.',
    tags: 'counter numbers count up stats ticks',
    recipe: {
      duration: 1.2,
      seed: 335,
      loudness: -18.5,
      lowpass: 7000,
      ...room(0.06, 0.25),
      layers: [
        ...ticks(20, { gap: 0.075, accel: 0.94, from: hz(74), to: hz(93), decay: 0.02, seed: 335 }),
        bell(hz(93), { at: 0.9, decay: 0.3, bright: 0.4, gain: -6 })
      ]
    }
  },
  {
    id: 'banner',
    name: 'Banner',
    category: 'titles',
    description: 'A clean sweep and click for lower thirds.',
    tags: 'lower third banner title name sweep',
    recipe: {
      duration: 0.7,
      seed: 336,
      loudness: -18,
      lowpass: 7000,
      highpass: 120,
      ...room(0.12, 0.5),
      layers: [
        sweep({
          from: 500,
          top: 1500,
          to: 900,
          attack: 0.18,
          decay: 0.12,
          q: 0.8,
          pan: { from: -0.6, to: 0.2, time: 0.3 }
        }),
        knock(1500, { at: 0.3, gain: -10, decay: 0.006 }),
        bell(hz(86), { at: 0.3, decay: 0.3, bright: 0.3, gain: -8 })
      ]
    }
  },
  {
    id: 'stamp',
    name: 'Stamp',
    category: 'titles',
    description: 'A firm stamp for bold kinetic text.',
    tags: 'stamp hit kinetic text bold slam title',
    recipe: {
      duration: 0.45,
      seed: 337,
      loudness: -15,
      lowpass: 5000,
      highpass: 40,
      drive: 0.15,
      ...room(0.08, 0.35),
      layers: [
        sub(150, 90, { decay: 0.15, time: 0.05 }),
        knock(500, { gain: -4, decay: 0.04, q: 0.6 }),
        {
          type: 'noise',
          color: 'pink',
          gain: -8,
          filter: { type: 'lowpass', freq: 2000, q: 0.6 },
          env: { attack: 0.001, decay: 0.03, curve: 5 }
        }
      ]
    }
  },
  {
    id: 'vanish',
    name: 'Vanish',
    category: 'titles',
    description: 'A soft airy fade for text disappearing.',
    tags: 'vanish disappear fade out text title',
    recipe: {
      duration: 0.6,
      seed: 338,
      loudness: -19,
      lowpass: 8000,
      highpass: 300,
      ...room(0.2, 0.8, { damp: 7000 }),
      layers: [
        sweep({ from: 1500, to: 3500, attack: 0.08, decay: 0.45, q: 0.7, rise: 1.2 }),
        {
          type: 'tone',
          freq: { from: hz(81), to: hz(88), time: 0.4, curve: 2 },
          gain: -10,
          env: { attack: 0.06, decay: 0.45, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'cork',
    name: 'Cork',
    category: 'pops',
    description: 'A round cork pop with a little fizz.',
    tags: 'cork pop bottle celebrate champagne',
    recipe: {
      duration: 0.6,
      seed: 341,
      loudness: -16,
      lowpass: 8000,
      highpass: 60,
      ...room(0.12, 0.5),
      layers: [
        {
          type: 'tone',
          freq: { from: 900, to: 350, time: 0.012, curve: 3 },
          env: { attack: 0.002, decay: 0.03, curve: 5 }
        },
        knock(700, { gain: -4, decay: 0.012, q: 0.6 }),
        {
          type: 'noise',
          color: 'crackle',
          at: 0.02,
          gain: 2,
          filter: [
            { type: 'highpass', freq: 3000, q: 0.5 },
            { type: 'lowpass', freq: 8000, q: 0.5 }
          ],
          env: { attack: 0.01, decay: 0.5, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'fizz',
    name: 'Fizz',
    category: 'pops',
    description: 'A cluster of tiny bubbles.',
    tags: 'bubbles fizz soda sparkle pop',
    recipe: {
      duration: 0.7,
      seed: 342,
      loudness: -19,
      lowpass: 6000,
      highpass: 400,
      width: 0.8,
      ...room(0.1, 0.4),
      layers: scatter(18, 342, (index, next) =>
        bubble(round(700 + next() * 900), {
          at: round(next() * 0.6),
          decay: round(0.012 + next() * 0.01),
          rise: 1.5,
          gain: round(-6 - next() * 8),
          pan: round((next() * 2 - 1) * 0.8)
        })
      )
    }
  },
  {
    id: 'blop',
    name: 'Blop',
    category: 'pops',
    description: 'A round mouth pop for playful motion graphics.',
    tags: 'pop mouth blop playful cartoon',
    recipe: {
      duration: 0.12,
      seed: 343,
      loudness: -17,
      lowpass: 5000,
      ...room(0.08, 0.25),
      layers: [
        {
          type: 'tone',
          freq: { from: 520, to: 260, time: 0.03, curve: 2 },
          partials: [
            [1, 1, 1],
            [2, 0.15, 0.5]
          ],
          env: { attack: 0.002, decay: 0.06, curve: 5 }
        }
      ]
    }
  },
  {
    id: 'balloon',
    name: 'Balloon',
    category: 'pops',
    description: 'A soft balloon pop without the harshness.',
    tags: 'balloon pop burst party',
    recipe: {
      duration: 0.3,
      seed: 344,
      loudness: -16,
      lowpass: 3500,
      highpass: 50,
      ...room(0.12, 0.45),
      layers: [
        {
          type: 'noise',
          color: 'pink',
          filter: { type: 'lowpass', freq: 2500, q: 0.6 },
          env: { attack: 0.001, decay: 0.04, curve: 6 }
        },
        sub(140, 90, { decay: 0.08, time: 0.03 }),
        {
          type: 'noise',
          color: 'pink',
          at: 0.02,
          gain: -12,
          tremolo: { rate: 30, depth: 0.7 },
          filter: { type: 'bandpass', freq: 600, q: 0.8 },
          env: { attack: 0.005, decay: 0.12, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'sprout',
    name: 'Sprout',
    category: 'pops',
    description: 'A springy little pop for elements appearing.',
    tags: 'pop appear spring element motion graphics',
    recipe: {
      duration: 0.3,
      seed: 345,
      loudness: -18,
      lowpass: 6000,
      ...room(0.1, 0.35),
      layers: [
        bubble(400, { decay: 0.06 }),
        {
          type: 'tone',
          freq: { from: 600, to: 900, time: 0.05, curve: 2 },
          at: 0.04,
          vibrato: { rate: 18, depth: 50 },
          gain: -6,
          env: { attack: 0.005, decay: 0.18, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'squeak',
    name: 'Squeak',
    category: 'pops',
    description: 'A soft rubber squeak for cute moments.',
    tags: 'squeak rubber toy cute playful',
    recipe: {
      duration: 0.3,
      seed: 346,
      loudness: -19,
      lowpass: 4000,
      ...room(0.08, 0.3),
      layers: [
        {
          type: 'tone',
          freq: {
            points: [
              [0, 900],
              [0.08, 1400],
              [0.2, 1050]
            ]
          },
          vibrato: { rate: 9, depth: 40 },
          partials: [
            [1, 1, 1],
            [2, 0.15, 0.5]
          ],
          env: { attack: 0.02, decay: 0.22, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'burble',
    name: 'Burble',
    category: 'pops',
    description: 'A string of bubbles rising.',
    tags: 'bubbles rise water underwater burble',
    recipe: {
      duration: 0.9,
      seed: 347,
      loudness: -18,
      lowpass: 5000,
      highpass: 150,
      ...room(0.15, 0.6),
      layers: scatter(8, 347, (index, next) =>
        bubble(round(300 * Math.pow(3, index / 7) * (1 + (next() - 0.5) * 0.1)), {
          at: round(index * 0.09 + next() * 0.03),
          decay: 0.05,
          rise: 1.8,
          gain: round(-index * 0.6 - next() * 2),
          pan: round((next() * 2 - 1) * 0.4)
        })
      )
    }
  },
  {
    id: 'herald',
    name: 'Herald',
    category: 'stingers',
    description: 'A short, bright brass-like fanfare.',
    tags: 'fanfare brass sting intro announce',
    recipe: {
      duration: 1.7,
      seed: 351,
      loudness: -16,
      lowpass: 5000,
      highpass: 60,
      width: 0.7,
      ...room(0.25, 1.4, { damp: 4500 }),
      layers: [
        brass(74, { hold: 0.08, decay: 0.08 }),
        brass(81, { at: 0.18, hold: 0.08, decay: 0.08 }),
        brass(86, { at: 0.38, hold: 0.5, decay: 0.7 }),
        brass(78, { at: 0.38, hold: 0.5, decay: 0.7, gain: -4 }),
        brass(69, { at: 0.38, hold: 0.5, decay: 0.7, gain: -6 }),
        sub(hz(38), hz(38), { at: 0.38, decay: 0.8, gain: -8, attack: 0.02 })
      ]
    }
  },
  {
    id: 'emblem',
    name: 'Emblem',
    category: 'stingers',
    description: 'A minimal piano-like sting for logos.',
    tags: 'logo sting piano minimal reveal',
    recipe: {
      duration: 2.6,
      seed: 352,
      loudness: -16.5,
      lowpass: 6000,
      ...room(0.3, 2.2, { damp: 5000 }),
      layers: [
        piano(62, { decay: 2.2 }),
        piano(69, { at: 0.015, decay: 2, gain: -2 }),
        piano(76, { at: 0.03, decay: 1.8, gain: -4 }),
        knock(1800, { gain: -22, decay: 0.004 }),
        sub(hz(38), hz(38), { decay: 1.5, gain: -12, attack: 0.01 })
      ]
    }
  },
  {
    id: 'verdict',
    name: 'Verdict',
    category: 'stingers',
    description: 'A dark, dramatic hit and chord.',
    tags: 'dramatic dark sting reveal tension hit',
    recipe: {
      duration: 2.8,
      seed: 353,
      loudness: -15,
      lowpass: 3500,
      highpass: 30,
      width: 0.8,
      drive: 0.1,
      ...room(0.35, 2.8, { damp: 3000, predelay: 0.02 }),
      layers: [
        sub(70, 35, { decay: 1.6, time: 0.6 }),
        knock(700, { gain: -8, decay: 0.03, q: 0.6 }),
        ...pad([50, 53, 57, 62], {
          gain: -4,
          attack: 0.02,
          decay: 2.4,
          wave: 'sawtooth',
          voices: 3,
          detune: 10,
          cutoff: 1200,
          step: 1.5,
          rise: 1,
          curve: 4
        })
      ]
    }
  },
  {
    id: 'uplift',
    name: 'Uplift',
    category: 'stingers',
    description: 'A bright, uplifting chord swell.',
    tags: 'uplifting positive chord swell sting happy',
    recipe: {
      duration: 3,
      seed: 354,
      loudness: -16,
      lowpass: 8000,
      highpass: 50,
      width: 0.8,
      ...room(0.3, 2.2, { damp: 6000 }),
      layers: [
        ...pad([62, 66, 69, 76], { gain: -4, attack: 1.2, hold: 0.6, decay: 1.2, cutoff: 3500, step: 1.5 }),
        ...scatter(10, 354, (index, next) =>
          glass(hz([81, 86, 88, 90, 93][Math.floor(next() * 5)]), {
            at: round(1 + index * 0.12 + next() * 0.05),
            decay: round(0.3 + next() * 0.3),
            bright: 0.3,
            gain: round(-14 - next() * 6),
            pan: round((next() * 2 - 1) * 0.7)
          })
        )
      ]
    }
  },
  {
    id: 'enigma',
    name: 'Enigma',
    category: 'stingers',
    description: 'A curious, unresolved sting.',
    tags: 'mystery curious unresolved sting question',
    recipe: {
      duration: 2.6,
      seed: 355,
      loudness: -16.5,
      lowpass: 6500,
      highpass: 50,
      ...room(0.35, 2.4, { damp: 5000 }),
      layers: [
        vibe(hz(74), { decay: 2 }),
        vibe(hz(80), { at: 0.02, decay: 1.9, gain: -2 }),
        vibe(hz(84), { at: 0.04, decay: 1.8, gain: -4 }),
        {
          type: 'tone',
          wave: 'triangle',
          freq: hz(38),
          gain: -10,
          filter: { type: 'lowpass', freq: 400, q: 0.6 },
          env: { attack: 0.3, decay: 2, curve: 3 }
        }
      ]
    }
  },
  {
    id: 'circuit',
    name: 'Circuit',
    category: 'stingers',
    description: 'A clean electronic logo sting.',
    tags: 'tech electronic logo sting digital startup',
    recipe: {
      duration: 2.2,
      seed: 356,
      loudness: -16,
      lowpass: 7000,
      highpass: 40,
      width: 0.7,
      ...room(0.25, 1.8, { damp: 5500 }),
      layers: [
        ...[74, 81, 86, 90, 93].map((midi, index) =>
          fmbell(hz(midi), { at: round(index * 0.06), decay: 0.25, ratio: 2, index: 1, gain: -2 - index })
        ),
        sub(90, 45, { at: 0.3, decay: 0.6 }),
        ...pad([62, 69, 74, 78], {
          at: 0.3,
          gain: -6,
          attack: 0.05,
          decay: 1.6,
          wave: 'sine',
          voices: 2,
          detune: 6,
          cutoff: 4000,
          rise: 1,
          curve: 4
        })
      ]
    }
  },
  {
    id: 'punchline',
    name: 'Punchline',
    category: 'stingers',
    description: 'A playful drum sting for comedic beats.',
    tags: 'comedy joke rimshot punchline playful sting',
    recipe: {
      duration: 1,
      seed: 357,
      loudness: -16,
      lowpass: 8000,
      highpass: 50,
      ...room(0.15, 0.7),
      layers: [
        sub(180, 120, { decay: 0.15, time: 0.06 }),
        knock(900, { gain: -12, decay: 0.01, q: 0.7 }),
        sub(130, 90, { at: 0.16, decay: 0.2, time: 0.08 }),
        knock(700, { at: 0.16, gain: -12, decay: 0.01, q: 0.7 }),
        {
          type: 'noise',
          color: 'white',
          at: 0.34,
          gain: -10,
          filter: [
            { type: 'highpass', freq: 5000, q: 0.5 },
            { type: 'lowpass', freq: 9000, q: 0.5 }
          ],
          env: { attack: 0.002, decay: 0.4, curve: 5 }
        }
      ]
    }
  },
  {
    id: 'finale',
    name: 'Finale',
    category: 'stingers',
    description: 'A warm, resolving chord to end a video.',
    tags: 'ending outro resolve chord finale credits',
    recipe: {
      duration: 3.5,
      seed: 358,
      loudness: -16,
      lowpass: 6000,
      highpass: 40,
      width: 0.8,
      ...room(0.3, 2.4, { damp: 5000 }),
      layers: [
        ...[55, 59, 62, 67].map((midi, index) =>
          keys(hz(midi), { at: round(index * 0.012), decay: 1, gain: -2 - index * 1.5 })
        ),
        ...[50, 57, 62, 66, 69].map((midi, index) =>
          keys(hz(midi), { at: round(0.6 + index * 0.012), decay: 2.6, gain: -1 - index * 1.5 })
        ),
        ...pad([50, 57, 62], { at: 0.6, gain: -12, attack: 0.4, decay: 2.4, cutoff: 1500, step: 2 })
      ]
    }
  },
  {
    id: 'heartbeat',
    name: 'Heartbeat',
    category: 'tension',
    description: 'A slow, deep heartbeat for suspense.',
    tags: 'heartbeat suspense tension pulse thriller',
    recipe: {
      duration: 3.2,
      seed: 361,
      loudness: -15,
      lowpass: 600,
      highpass: 25,
      ...room(0.1, 0.6, { damp: 1500 }),
      layers: [0, 1, 2].flatMap(beat => [
        sub(70, 50, { at: beat, decay: 0.18, time: 0.08 }),
        { type: 'tone', freq: 120, at: beat, gain: -8, env: { attack: 0.004, decay: 0.1, curve: 5 } },
        sub(62, 46, { at: round(beat + 0.24), decay: 0.22, time: 0.1, gain: -2 }),
        { type: 'tone', freq: 105, at: round(beat + 0.24), gain: -10, env: { attack: 0.004, decay: 0.12, curve: 5 } }
      ])
    }
  },
  {
    id: 'clockwork',
    name: 'Clockwork',
    category: 'tension',
    description: 'A steady clock tick that builds unease.',
    tags: 'clock tick tock time pressure tension',
    recipe: {
      duration: 4.2,
      seed: 362,
      loudness: -17,
      lowpass: 7000,
      highpass: 300,
      ...room(0.15, 0.8),
      layers: Array.from({ length: 8 }, (_, index) => [
        wood(hz(index % 2 ? 81 : 88), { at: round(index * 0.5), decay: 0.03, gain: index % 2 ? -2 : 0 }),
        knock(index % 2 ? 1800 : 2400, { at: round(index * 0.5), gain: -10, decay: 0.003, attack: 0.0006, q: 1.1 })
      ]).flat()
    }
  },
  {
    id: 'unease',
    name: 'Unease',
    category: 'tension',
    description: 'A low, uneasy drone.',
    tags: 'drone tension uneasy dark horror suspense',
    recipe: {
      duration: 6,
      seed: 363,
      loudness: -17,
      lowpass: 2500,
      highpass: 30,
      width: 0.9,
      ...room(0.35, 3, { damp: 2500 }),
      layers: [
        ...[38, 39].map((midi, index) => ({
          type: 'tone',
          wave: 'sawtooth',
          voices: 2,
          detune: 8,
          freq: hz(midi),
          gain: -index * 2,
          filter: { type: 'lowpass', freq: 300, q: 0.7 },
          env: { attack: 3, hold: 0.5, decay: 2.5, curve: 3 }
        })),
        ...[74, 75].map((midi, index) => ({
          type: 'tone',
          freq: hz(midi),
          tremolo: { rate: 4.5 + index, depth: 0.5 },
          gain: -18 - index * 2,
          env: { attack: 3, hold: 0.5, decay: 2.5, curve: 3 }
        })),
        {
          type: 'noise',
          color: 'brown',
          gain: -10,
          filter: { type: 'lowpass', freq: 250, q: 0.6 },
          env: { attack: 3, hold: 0.5, decay: 2.5, curve: 3 }
        }
      ]
    }
  },
  {
    id: 'stalk',
    name: 'Stalk',
    category: 'tension',
    description: 'A pulsing low bass for suspense.',
    tags: 'bass pulse suspense chase tension low',
    recipe: {
      duration: 4,
      seed: 364,
      loudness: -15.5,
      lowpass: 600,
      highpass: 25,
      ...room(0.15, 1, { damp: 1500 }),
      layers: [
        {
          type: 'tone',
          wave: 'triangle',
          freq: hz(38),
          tremolo: { rate: 2, depth: 0.9 },
          filter: { type: 'lowpass', freq: 300, q: 0.7 },
          env: { attack: 0.3, hold: 3.2, decay: 0.5, curve: 3 }
        },
        {
          type: 'tone',
          freq: hz(26),
          tremolo: { rate: 2, depth: 0.9 },
          gain: -4,
          env: { attack: 0.3, hold: 3.2, decay: 0.5, curve: 3 }
        }
      ]
    }
  },
  {
    id: 'suspense',
    name: 'Suspense',
    category: 'tension',
    description: 'High, trembling tones that hang in the air.',
    tags: 'suspense tension high trembling strings eerie',
    recipe: {
      duration: 5,
      seed: 365,
      loudness: -18,
      lowpass: 6000,
      highpass: 40,
      width: 0.9,
      ...room(0.35, 2.6, { damp: 5000 }),
      layers: [
        ...[88, 89].map((midi, index) => ({
          type: 'tone',
          freq: hz(midi),
          voices: 2,
          detune: 6,
          tremolo: { rate: 7 + index * 0.6, depth: 0.5 },
          gain: -index * 2,
          pan: index ? 0.3 : -0.3,
          env: { attack: 2, hold: 2, decay: 1, curve: 3 }
        })),
        {
          type: 'tone',
          wave: 'triangle',
          freq: hz(38),
          gain: -12,
          filter: { type: 'lowpass', freq: 300, q: 0.6 },
          env: { attack: 2, hold: 2, decay: 1, curve: 3 }
        }
      ]
    }
  },
  {
    id: 'dread',
    name: 'Dread',
    category: 'tension',
    description: 'A slow, swelling dark breath.',
    tags: 'dread dark breath swell horror tension',
    recipe: {
      duration: 5,
      seed: 366,
      loudness: -17,
      lowpass: 2500,
      highpass: 30,
      width: 0.9,
      ...room(0.35, 2.8, { damp: 2000, lowcut: 150 }),
      layers: [
        {
          type: 'noise',
          color: 'pink',
          filter: {
            type: 'lowpass',
            freq: {
              points: [
                [0, 200],
                [2.5, 1500],
                [5, 200]
              ]
            },
            q: 0.8
          },
          env: { attack: 2.5, rise: 1.5, decay: 2.3, curve: 3 }
        },
        {
          type: 'tone',
          wave: 'sawtooth',
          voices: 3,
          detune: 10,
          freq: hz(38),
          gain: -6,
          filter: { type: 'lowpass', freq: 350, q: 0.7 },
          env: { attack: 2.5, rise: 1.5, decay: 2.3, curve: 3 }
        },
        sub(hz(26), hz(26), { decay: 4.5, attack: 2.5, gain: -6, curve: 3 })
      ]
    }
  },
  {
    id: 'siren',
    name: 'Siren',
    category: 'tension',
    description: 'A distant, soft siren swell.',
    tags: 'siren distant alarm city emergency',
    recipe: {
      duration: 4,
      seed: 367,
      loudness: -18,
      lowpass: 1800,
      highpass: 150,
      width: 0.8,
      ...room(0.5, 2.5, { damp: 2000, predelay: 0.04 }),
      layers: [
        {
          type: 'tone',
          freq: hz(74),
          vibrato: { rate: 0.45, depth: 350 },
          partials: [
            [1, 1, 1],
            [2, 0.2, 1],
            [3, 0.08, 1]
          ],
          env: { attack: 1.2, hold: 1.4, decay: 1.3, curve: 3 }
        }
      ]
    }
  },
  {
    id: 'countdown',
    name: 'Countdown',
    category: 'tension',
    description: 'Three beeps and a go.',
    tags: 'countdown beep start race timer go',
    recipe: {
      duration: 2.2,
      seed: 368,
      loudness: -16.5,
      lowpass: 7000,
      ...room(0.12, 0.6),
      layers: [
        ...[0, 0.6, 1.2].map(at => ({
          type: 'tone',
          freq: hz(81),
          at,
          partials: [
            [1, 1, 1],
            [2, 0.1, 0.6]
          ],
          env: { attack: 0.004, hold: 0.06, decay: 0.12, curve: 5 }
        })),
        {
          type: 'tone',
          freq: hz(93),
          at: 1.8,
          partials: [
            [1, 1, 1],
            [2, 0.1, 0.6]
          ],
          env: { attack: 0.004, hold: 0.15, decay: 0.5, curve: 5 }
        }
      ]
    }
  }
];

export const VIDEO = [
  {
    id: 'ascent',
    name: 'Ascent',
    category: 'risers',
    description: 'A soft four second rise of air and warm tone.',
    tags: 'riser build up tension intro',
    recipe: {
      duration: 4.1,
      seed: 101,
      loudness: -15,
      lowpass: 9000,
      highpass: 30,
      width: 0.7,
      ...room(0.25, 2.2, { damp: 4000, predelay: 0.02 }),
      layers: [
        {
          type: 'noise',
          color: 'pink',
          filter: { type: 'lowpass', freq: { from: 300, to: 5200, time: 3.9, curve: 0.7 }, q: 0.6 },
          env: { attack: 3.8, rise: 2.2, decay: 0.25, curve: 3 }
        },
        {
          type: 'tone',
          wave: 'triangle',
          voices: 3,
          detune: 7,
          freq: { from: hz(57), to: hz(64), time: 3.9, curve: 0.7 },
          gain: -9,
          filter: { type: 'lowpass', freq: { from: 500, to: 2600, time: 3.9 }, q: 0.6 },
          env: { attack: 3.7, rise: 2, decay: 0.3, curve: 3 }
        },
        {
          type: 'tone',
          freq: { from: hz(69), to: hz(76), time: 3.9, curve: 0.7 },
          gain: -18,
          env: { attack: 3.6, rise: 2, decay: 0.25, curve: 3 }
        },
        {
          type: 'tone',
          freq: { from: 52, to: 78, time: 3.9 },
          gain: -15,
          env: { attack: 3.5, rise: 2, decay: 0.3, curve: 3 }
        }
      ]
    }
  },
  {
    id: 'lift',
    name: 'Lift',
    category: 'risers',
    description: 'A quick, airy swell for fast cuts.',
    tags: 'riser swell short build',
    recipe: {
      duration: 1.35,
      seed: 102,
      loudness: -16,
      lowpass: 7000,
      highpass: 40,
      width: 0.7,
      ...room(0.22, 1.3, { damp: 4500 }),
      layers: [
        {
          type: 'noise',
          color: 'pink',
          filter: { type: 'lowpass', freq: { from: 500, to: 4500, time: 1.15, curve: 0.8 }, q: 0.6 },
          env: { attack: 1.1, rise: 2, decay: 0.18, curve: 3 }
        },
        {
          type: 'tone',
          wave: 'triangle',
          voices: 2,
          detune: 6,
          freq: { from: hz(64), to: hz(71), time: 1.1, curve: 0.7 },
          gain: -13,
          filter: { type: 'lowpass', freq: 2400, q: 0.6 },
          env: { attack: 1, rise: 1.8, decay: 0.2, curve: 3 }
        }
      ]
    }
  },
  {
    id: 'glow',
    name: 'Glow',
    category: 'risers',
    description: 'A warm chord that blooms upward into the cut.',
    tags: 'riser pad swell chord warm',
    recipe: {
      duration: 3,
      seed: 103,
      loudness: -16,
      lowpass: 8000,
      highpass: 40,
      width: 0.8,
      ...room(0.3, 2.4, { damp: 4500, predelay: 0.02 }),
      layers: [
        ...[62, 66, 69].map((midi, index) => ({
          type: 'tone',
          wave: 'triangle',
          voices: 3,
          detune: 8,
          freq: { from: hz(midi), to: round(hz(midi) * 1.0595), time: 2.6, curve: 0.8 },
          gain: -6 - index * 2,
          filter: { type: 'lowpass', freq: { from: 400, to: 2600, time: 2.4 }, q: 0.6 },
          env: { attack: 2.2, rise: 1.5, decay: 0.6, curve: 4 }
        })),
        {
          type: 'noise',
          color: 'pink',
          gain: -16,
          filter: { type: 'lowpass', freq: { from: 600, to: 3000, time: 2.4 }, q: 0.5 },
          env: { attack: 2.2, rise: 2, decay: 0.4, curve: 3 }
        }
      ]
    }
  },
  {
    id: 'velvet',
    name: 'Velvet',
    category: 'impacts',
    description: 'A soft, round hit with a warm low tail.',
    tags: 'impact hit boom cinematic soft',
    recipe: {
      duration: 1.9,
      seed: 111,
      loudness: -14,
      lowpass: 5000,
      highpass: 28,
      drive: 0.12,
      ...room(0.22, 2.2, { damp: 2600, predelay: 0.015 }),
      layers: [
        {
          type: 'tone',
          freq: { from: 78, to: 42, time: 0.55, curve: 3 },
          env: { attack: 0.004, decay: 1.7, curve: 5 }
        },
        {
          type: 'tone',
          freq: { from: 190, to: 112, time: 0.3, curve: 3 },
          gain: 1,
          env: { attack: 0.004, decay: 0.45, curve: 5 }
        },
        {
          type: 'tone',
          freq: { from: 380, to: 226, time: 0.2, curve: 3 },
          gain: -12,
          env: { attack: 0.004, decay: 0.18, curve: 5 }
        },
        {
          type: 'noise',
          color: 'pink',
          gain: -5,
          filter: { type: 'lowpass', freq: { from: 1100, to: 300, time: 0.12 }, q: 0.6 },
          env: { attack: 0.003, decay: 0.1, curve: 5 }
        },
        {
          type: 'noise',
          color: 'brown',
          gain: -4,
          filter: { type: 'lowpass', freq: { from: 420, to: 120, time: 0.2 }, q: 0.6 },
          env: { attack: 0.003, decay: 0.25, curve: 5 }
        },
        {
          type: 'noise',
          color: 'pink',
          gain: -22,
          filter: { type: 'bandpass', freq: 900, q: 0.6 },
          env: { attack: 0.002, decay: 0.06, curve: 5 }
        }
      ]
    }
  },
  {
    id: 'cushion',
    name: 'Cushion',
    category: 'impacts',
    description: 'A muffled, padded thump for gentle cuts.',
    tags: 'impact thump hit muted short',
    recipe: {
      duration: 0.6,
      seed: 112,
      loudness: -15,
      lowpass: 2800,
      highpass: 30,
      ...room(0.12, 0.8, { damp: 2000 }),
      layers: [
        {
          type: 'tone',
          freq: { from: 98, to: 56, time: 0.14, curve: 3 },
          env: { attack: 0.003, decay: 0.45, curve: 5 }
        },
        {
          type: 'tone',
          freq: { from: 210, to: 130, time: 0.08, curve: 3 },
          gain: 2,
          env: { attack: 0.003, decay: 0.14, curve: 5 }
        },
        {
          type: 'noise',
          color: 'pink',
          gain: -6,
          filter: { type: 'lowpass', freq: { from: 900, to: 250, time: 0.08 }, q: 0.6 },
          env: { attack: 0.002, decay: 0.08, curve: 5 }
        }
      ]
    }
  },
  {
    id: 'haze',
    name: 'Haze',
    category: 'impacts',
    description: 'A soft low boom that fades into air.',
    tags: 'impact boom sub low atmosphere',
    recipe: {
      duration: 2.8,
      seed: 113,
      loudness: -15,
      lowpass: 6500,
      highpass: 26,
      width: 0.8,
      ...room(0.35, 3, { damp: 3000, predelay: 0.02 }),
      layers: [
        {
          type: 'tone',
          freq: { from: 64, to: 38, time: 0.8, curve: 3 },
          env: { attack: 0.006, decay: 2.5, curve: 5 }
        },
        {
          type: 'tone',
          freq: { from: 170, to: 104, time: 0.5, curve: 3 },
          gain: 0,
          env: { attack: 0.006, decay: 0.75, curve: 5 }
        },
        {
          type: 'noise',
          color: 'pink',
          gain: -15,
          filter: { type: 'lowpass', freq: { from: 700, to: 200, time: 0.3 }, q: 0.6 },
          env: { attack: 0.005, decay: 0.35, curve: 5 }
        },
        {
          type: 'noise',
          color: 'brown',
          gain: -8,
          filter: { type: 'lowpass', freq: { from: 260, to: 90, time: 0.4 }, q: 0.6 },
          env: { attack: 0.004, decay: 0.5, curve: 5 }
        },
        {
          type: 'noise',
          color: 'pink',
          gain: -24,
          filter: [
            { type: 'highpass', freq: 1800, q: 0.5 },
            { type: 'lowpass', freq: 6000, q: 0.5 }
          ],
          env: { attack: 0.08, decay: 2.4, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'gust',
    name: 'Gust',
    category: 'whooshes',
    description: 'A full, soft whoosh that passes left to right.',
    tags: 'whoosh swoosh pass transition',
    recipe: {
      duration: 1.3,
      seed: 121,
      loudness: -16,
      lowpass: 7000,
      highpass: 60,
      ...room(0.14, 1, { damp: 4500 }),
      layers: [
        {
          type: 'noise',
          color: 'pink',
          pan: { from: -0.75, to: 0.75, time: 1.15 },
          filter: {
            type: 'bandpass',
            freq: {
              points: [
                [0, 360],
                [0.6, 1300],
                [1.2, 450]
              ]
            },
            q: 0.8
          },
          env: { attack: 0.55, rise: 1.6, decay: 0.65, curve: 4 }
        },
        {
          type: 'noise',
          color: 'brown',
          gain: -10,
          pan: { from: -0.4, to: 0.4, time: 1.15 },
          filter: { type: 'lowpass', freq: 320, q: 0.6 },
          env: { attack: 0.55, rise: 1.6, decay: 0.6, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'pass',
    name: 'Pass',
    category: 'whooshes',
    description: 'A light, quick fly by.',
    tags: 'whoosh fly by fast swipe',
    recipe: {
      duration: 0.7,
      seed: 122,
      loudness: -17,
      lowpass: 5500,
      highpass: 80,
      ...room(0.1, 0.6, { damp: 4500 }),
      layers: [
        {
          type: 'noise',
          color: 'pink',
          pan: { from: -0.6, to: 0.6, time: 0.6 },
          filter: {
            type: 'bandpass',
            freq: {
              points: [
                [0, 560],
                [0.3, 1450],
                [0.65, 640]
              ]
            },
            q: 0.85
          },
          env: { attack: 0.28, rise: 1.8, decay: 0.34, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'drift',
    name: 'Drift',
    category: 'whooshes',
    description: 'A slow, airy pass with a gentle tail.',
    tags: 'whoosh slow air wind',
    recipe: {
      duration: 2.3,
      seed: 123,
      loudness: -17,
      lowpass: 6000,
      highpass: 50,
      width: 0.8,
      ...room(0.2, 1.6, { damp: 4000 }),
      layers: [
        {
          type: 'noise',
          color: 'pink',
          pan: { from: -0.5, to: 0.5, time: 2.1 },
          filter: {
            type: 'bandpass',
            freq: {
              points: [
                [0, 300],
                [1.1, 1100],
                [2.2, 380]
              ]
            },
            q: 0.7
          },
          env: { attack: 1, rise: 1.4, decay: 1.2, curve: 3 }
        },
        {
          type: 'noise',
          color: 'brown',
          gain: -12,
          filter: { type: 'lowpass', freq: 260, q: 0.6 },
          env: { attack: 1, rise: 1.4, decay: 1.1, curve: 3 }
        }
      ]
    }
  },
  {
    id: 'inhale',
    name: 'Inhale',
    category: 'transitions',
    description: 'A soft reversed swell that pulls into the cut.',
    tags: 'reverse swell transition suck in',
    recipe: {
      duration: 1.7,
      seed: 131,
      loudness: -16,
      lowpass: 8000,
      width: 0.7,
      reverse: true,
      ...room(0.45, 1.6, { damp: 5000 }),
      layers: [
        bell(hz(69), { decay: 1.4, bright: 0.6 }),
        bell(hz(76), { decay: 1.3, bright: 0.6, gain: -3 }),
        bell(hz(81), { decay: 1.1, bright: 0.5, gain: -8 }),
        {
          type: 'noise',
          color: 'pink',
          gain: -20,
          filter: { type: 'lowpass', freq: 3000, q: 0.5 },
          env: { attack: 0.01, decay: 1.2, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'exhale',
    name: 'Exhale',
    category: 'transitions',
    description: 'A gentle breath out after the cut.',
    tags: 'transition release fade out breath',
    recipe: {
      duration: 1.5,
      seed: 132,
      loudness: -17,
      lowpass: 5500,
      highpass: 60,
      ...room(0.25, 1.5, { damp: 4000 }),
      layers: [
        {
          type: 'noise',
          color: 'pink',
          filter: { type: 'bandpass', freq: { from: 1500, to: 420, time: 1.3, curve: 2 }, q: 0.6 },
          env: { attack: 0.03, decay: 1.3, curve: 3 }
        },
        {
          type: 'tone',
          freq: { from: hz(57), to: hz(52), time: 1, curve: 2 },
          gain: -14,
          env: { attack: 0.03, decay: 0.9, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'shimmer',
    name: 'Shimmer',
    category: 'transitions',
    description: 'A quiet glassy sweep between scenes.',
    tags: 'transition glass sparkle sweep magic',
    recipe: {
      duration: 1.7,
      seed: 133,
      loudness: -18,
      lowpass: 10000,
      highpass: 300,
      width: 0.8,
      ...room(0.35, 2, { damp: 7000, predelay: 0.015 }),
      layers: [
        ...shimmer(),
        {
          type: 'noise',
          color: 'pink',
          gain: -30,
          filter: [
            { type: 'highpass', freq: 5000, q: 0.5 },
            { type: 'lowpass', freq: 9000, q: 0.5 }
          ],
          env: { attack: 0.4, rise: 1.5, decay: 0.8, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'stardust',
    name: 'Stardust',
    category: 'accents',
    description: 'A few soft twinkles that settle.',
    tags: 'sparkle twinkle magic accent',
    recipe: {
      duration: 1.8,
      seed: 141,
      loudness: -18,
      lowpass: 8000,
      highpass: 400,
      width: 0.7,
      ...room(0.35, 1.8, { damp: 6500 }),
      layers: stardust()
    }
  },
  {
    id: 'reveal',
    name: 'Reveal',
    category: 'accents',
    description: 'A soft swell into a warm chord for logo reveals.',
    tags: 'logo reveal intro chord swell',
    recipe: {
      duration: 3.4,
      seed: 142,
      loudness: -15,
      lowpass: 8500,
      highpass: 30,
      drive: 0.08,
      width: 0.8,
      ...room(0.3, 2.6, { damp: 5000, predelay: 0.02 }),
      layers: [
        {
          type: 'noise',
          color: 'pink',
          filter: { type: 'lowpass', freq: { from: 400, to: 3800, time: 1.1, curve: 0.7 }, q: 0.6 },
          env: { attack: 1.1, rise: 2.1, decay: 0.12, curve: 3 }
        },
        {
          type: 'tone',
          at: 1.12,
          freq: { from: 96, to: 58, time: 0.5, curve: 3 },
          gain: -6,
          env: { attack: 0.006, decay: 1.2, curve: 5 }
        },
        ...chord([62, 69, 74, 78], { at: 1.12, decay: 2.05, gain: -4 })
      ]
    }
  },
  ...VIDEO_MORE
];
