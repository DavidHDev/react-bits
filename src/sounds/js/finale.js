const finale = {
  duration: 3.5,
  seed: 358,
  loudness: -16,
  lowpass: 6000,
  highpass: 40,
  width: 0.8,
  reverb: { mix: 0.3, decay: 2.4, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 196,
      at: 0,
      gain: -2,
      fm: { ratio: 1, index: { from: 1.4, to: 0.15, time: 0.5 } },
      partials: [
        [1, 1, 1],
        [2, 0.12, 0.5]
      ],
      env: { attack: 0.003, decay: 1, curve: 5 }
    },
    {
      type: 'tone',
      freq: 246.94,
      at: 0.012,
      gain: -3.5,
      fm: { ratio: 1, index: { from: 1.4, to: 0.15, time: 0.5 } },
      partials: [
        [1, 1, 1],
        [2, 0.12, 0.5]
      ],
      env: { attack: 0.003, decay: 1, curve: 5 }
    },
    {
      type: 'tone',
      freq: 293.66,
      at: 0.024,
      gain: -5,
      fm: { ratio: 1, index: { from: 1.4, to: 0.15, time: 0.5 } },
      partials: [
        [1, 1, 1],
        [2, 0.12, 0.5]
      ],
      env: { attack: 0.003, decay: 1, curve: 5 }
    },
    {
      type: 'tone',
      freq: 392,
      at: 0.036,
      gain: -6.5,
      fm: { ratio: 1, index: { from: 1.4, to: 0.15, time: 0.5 } },
      partials: [
        [1, 1, 1],
        [2, 0.12, 0.5]
      ],
      env: { attack: 0.003, decay: 1, curve: 5 }
    },
    {
      type: 'tone',
      freq: 146.83,
      at: 0.6,
      gain: -1,
      fm: { ratio: 1, index: { from: 1.4, to: 0.15, time: 1.3 } },
      partials: [
        [1, 1, 1],
        [2, 0.12, 0.5]
      ],
      env: { attack: 0.003, decay: 2.6, curve: 5 }
    },
    {
      type: 'tone',
      freq: 220,
      at: 0.612,
      gain: -2.5,
      fm: { ratio: 1, index: { from: 1.4, to: 0.15, time: 1.3 } },
      partials: [
        [1, 1, 1],
        [2, 0.12, 0.5]
      ],
      env: { attack: 0.003, decay: 2.6, curve: 5 }
    },
    {
      type: 'tone',
      freq: 293.66,
      at: 0.624,
      gain: -4,
      fm: { ratio: 1, index: { from: 1.4, to: 0.15, time: 1.3 } },
      partials: [
        [1, 1, 1],
        [2, 0.12, 0.5]
      ],
      env: { attack: 0.003, decay: 2.6, curve: 5 }
    },
    {
      type: 'tone',
      freq: 369.99,
      at: 0.636,
      gain: -5.5,
      fm: { ratio: 1, index: { from: 1.4, to: 0.15, time: 1.3 } },
      partials: [
        [1, 1, 1],
        [2, 0.12, 0.5]
      ],
      env: { attack: 0.003, decay: 2.6, curve: 5 }
    },
    {
      type: 'tone',
      freq: 440,
      at: 0.648,
      gain: -7,
      fm: { ratio: 1, index: { from: 1.4, to: 0.15, time: 1.3 } },
      partials: [
        [1, 1, 1],
        [2, 0.12, 0.5]
      ],
      env: { attack: 0.003, decay: 2.6, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      voices: 3,
      detune: 8,
      freq: 146.83,
      at: 0.6,
      gain: -12,
      filter: { type: 'lowpass', freq: 1500, q: 0.6 },
      env: { attack: 0.4, rise: 1.6, decay: 2.4, curve: 3 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      voices: 3,
      detune: 8,
      freq: 220,
      at: 0.6,
      gain: -14,
      filter: { type: 'lowpass', freq: 1500, q: 0.6 },
      env: { attack: 0.4, rise: 1.6, decay: 2.4, curve: 3 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      voices: 3,
      detune: 8,
      freq: 293.66,
      at: 0.6,
      gain: -16,
      filter: { type: 'lowpass', freq: 1500, q: 0.6 },
      env: { attack: 0.4, rise: 1.6, decay: 2.4, curve: 3 }
    }
  ]
};

export default finale;
