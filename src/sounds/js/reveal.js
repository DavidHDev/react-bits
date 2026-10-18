const reveal = {
  duration: 3.4,
  seed: 142,
  loudness: -15,
  lowpass: 8500,
  highpass: 30,
  drive: 0.08,
  width: 0.8,
  reverb: { mix: 0.3, decay: 2.6, predelay: 0.02, damp: 5000 },
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
    {
      type: 'tone',
      freq: 293.66,
      at: 1.12,
      gain: -4,
      partials: [
        [1, 1, 1],
        [2, 0.08, 0.55],
        [3, 0.02, 0.35]
      ],
      env: { attack: 0.004, decay: 2.05, curve: 6 }
    },
    {
      type: 'tone',
      freq: 440,
      at: 1.132,
      gain: -5.5,
      partials: [
        [1, 1, 1],
        [2, 0.08, 0.55],
        [3, 0.02, 0.35]
      ],
      env: { attack: 0.004, decay: 2.1, curve: 6 }
    },
    {
      type: 'tone',
      freq: 587.33,
      at: 1.144,
      gain: -7,
      partials: [
        [1, 1, 1],
        [2, 0.08, 0.55],
        [3, 0.02, 0.35]
      ],
      env: { attack: 0.004, decay: 2.15, curve: 6 }
    },
    {
      type: 'tone',
      freq: 739.99,
      at: 1.156,
      gain: -8.5,
      partials: [
        [1, 1, 1],
        [2, 0.08, 0.55],
        [3, 0.02, 0.35]
      ],
      env: { attack: 0.004, decay: 2.2, curve: 6 }
    }
  ]
};

export default reveal;
