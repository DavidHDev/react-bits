const emblem = {
  duration: 2.6,
  seed: 352,
  loudness: -16.5,
  lowpass: 6000,
  reverb: { mix: 0.3, decay: 2.2, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 293.66,
      at: 0,
      gain: 0,
      partials: [
        [1, 1, 1],
        [2, 0.45, 0.6],
        [3, 0.22, 0.42],
        [4, 0.1, 0.3],
        [5, 0.05, 0.24],
        [6, 0.025, 0.2]
      ],
      env: { attack: 0.003, decay: 2.2, curve: 6 }
    },
    {
      type: 'tone',
      freq: 440,
      at: 0.015,
      gain: -2,
      partials: [
        [1, 1, 1],
        [2, 0.45, 0.6],
        [3, 0.22, 0.42],
        [4, 0.1, 0.3],
        [5, 0.05, 0.24],
        [6, 0.025, 0.2]
      ],
      env: { attack: 0.003, decay: 2, curve: 6 }
    },
    {
      type: 'tone',
      freq: 659.26,
      at: 0.03,
      gain: -4,
      partials: [
        [1, 1, 1],
        [2, 0.45, 0.6],
        [3, 0.22, 0.42],
        [4, 0.1, 0.3],
        [5, 0.05, 0.24],
        [6, 0.025, 0.2]
      ],
      env: { attack: 0.003, decay: 1.8, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -22,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1800, q: 0.8 },
        { type: 'lowpass', freq: 4680, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.004, curve: 6 }
    },
    {
      type: 'tone',
      freq: { from: 73.42, to: 73.42, time: 0.9, curve: 3 },
      at: 0,
      gain: -12,
      env: { attack: 0.01, decay: 1.5, curve: 5 }
    }
  ]
};

export default emblem;
