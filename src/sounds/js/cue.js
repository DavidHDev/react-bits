const cue = {
  duration: 1.2,
  seed: 56,
  loudness: -17.5,
  lowpass: 6500,
  reverb: { mix: 0.18, decay: 0.9, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 587.33,
      at: 0,
      gain: 0,
      fm: { ratio: 1, index: { from: 1.4, to: 0.15, time: 0.25 } },
      partials: [
        [1, 1, 1],
        [2, 0.12, 0.5]
      ],
      env: { attack: 0.003, decay: 0.5, curve: 5 }
    },
    {
      type: 'tone',
      freq: 739.99,
      at: 0.11,
      gain: -1,
      fm: { ratio: 1, index: { from: 1.4, to: 0.15, time: 0.275 } },
      partials: [
        [1, 1, 1],
        [2, 0.12, 0.5]
      ],
      env: { attack: 0.003, decay: 0.55, curve: 5 }
    },
    {
      type: 'tone',
      freq: 880,
      at: 0.22,
      gain: -2,
      fm: { ratio: 1, index: { from: 1.4, to: 0.15, time: 0.4 } },
      partials: [
        [1, 1, 1],
        [2, 0.12, 0.5]
      ],
      env: { attack: 0.003, decay: 0.8, curve: 5 }
    }
  ]
};

export default cue;
