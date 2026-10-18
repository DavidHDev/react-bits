const summit = {
  duration: 1.4,
  seed: 226,
  loudness: -17,
  lowpass: 8500,
  reverb: { mix: 0.2, decay: 1.1, predelay: 0.01, damp: 6500 },
  layers: [
    {
      type: 'tone',
      freq: 587.33,
      at: 0,
      gain: -3,
      partials: [
        [1, 1, 1],
        [2, 0.2, 0.55],
        [3, 0.08, 0.35],
        [4, 0.035, 0.22],
        [5, 0.015, 0.15]
      ],
      env: { attack: 0.0015, decay: 0.15, curve: 6 }
    },
    {
      type: 'tone',
      freq: 659.26,
      at: 0.04,
      gain: -3,
      partials: [
        [1, 1, 1],
        [2, 0.2, 0.55],
        [3, 0.08, 0.35],
        [4, 0.035, 0.22],
        [5, 0.015, 0.15]
      ],
      env: { attack: 0.0015, decay: 0.15, curve: 6 }
    },
    {
      type: 'tone',
      freq: 739.99,
      at: 0.08,
      gain: -3,
      partials: [
        [1, 1, 1],
        [2, 0.2, 0.55],
        [3, 0.08, 0.35],
        [4, 0.035, 0.22],
        [5, 0.015, 0.15]
      ],
      env: { attack: 0.0015, decay: 0.15, curve: 6 }
    },
    {
      type: 'tone',
      freq: 880,
      at: 0.12,
      gain: -3,
      partials: [
        [1, 1, 1],
        [2, 0.2, 0.55],
        [3, 0.08, 0.35],
        [4, 0.035, 0.22],
        [5, 0.015, 0.15]
      ],
      env: { attack: 0.0015, decay: 0.15, curve: 6 }
    },
    {
      type: 'tone',
      freq: 987.77,
      at: 0.16,
      gain: -3,
      partials: [
        [1, 1, 1],
        [2, 0.2, 0.55],
        [3, 0.08, 0.35],
        [4, 0.035, 0.22],
        [5, 0.015, 0.15]
      ],
      env: { attack: 0.0015, decay: 0.15, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1174.66,
      at: 0.2,
      gain: 0,
      partials: [
        [1, 1, 1],
        [2, 0.08, 0.55],
        [3, 0.02, 0.35]
      ],
      env: { attack: 0.004, decay: 1, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1760,
      at: 0.21,
      gain: -6,
      partials: [
        [1, 1, 1],
        [2, 0.048, 0.55],
        [3, 0.012, 0.35]
      ],
      env: { attack: 0.004, decay: 0.8, curve: 6 }
    },
    {
      type: 'tone',
      freq: 739.99,
      at: 0.22,
      gain: -8,
      partials: [
        [1, 1, 1],
        [2, 0.048, 0.55],
        [3, 0.012, 0.35]
      ],
      env: { attack: 0.004, decay: 0.9, curve: 6 }
    }
  ]
};

export default summit;
