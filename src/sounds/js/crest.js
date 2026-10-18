const crest = {
  duration: 1.15,
  seed: 42,
  loudness: -17,
  lowpass: 8000,
  reverb: { mix: 0.2, decay: 0.95, predelay: 0.01, damp: 6000 },
  layers: [
    {
      type: 'tone',
      freq: 587.33,
      at: 0,
      gain: 0,
      partials: [
        [1, 1, 1],
        [2, 0.16, 0.55],
        [3, 0.04, 0.35]
      ],
      env: { attack: 0.004, decay: 0.4, curve: 6 }
    },
    {
      type: 'tone',
      freq: 739.99,
      at: 0.075,
      gain: 0,
      partials: [
        [1, 1, 1],
        [2, 0.16, 0.55],
        [3, 0.04, 0.35]
      ],
      env: { attack: 0.004, decay: 0.45, curve: 6 }
    },
    {
      type: 'tone',
      freq: 880,
      at: 0.15,
      gain: 0,
      partials: [
        [1, 1, 1],
        [2, 0.16, 0.55],
        [3, 0.04, 0.35]
      ],
      env: { attack: 0.004, decay: 0.6, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1174.66,
      at: 0.225,
      gain: -3,
      partials: [
        [1, 1, 1],
        [2, 0.16, 0.55],
        [3, 0.04, 0.35]
      ],
      env: { attack: 0.004, decay: 0.85, curve: 6 }
    }
  ]
};

export default crest;
