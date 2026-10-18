const tine = {
  duration: 1.2,
  seed: 58,
  loudness: -17.5,
  lowpass: 7500,
  reverb: { mix: 0.18, decay: 0.8, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 587.33,
      at: 0,
      gain: 0,
      partials: [
        [1, 1, 1],
        [5.95, 0.14, 0.1],
        [11.6, 0.03, 0.05]
      ],
      env: { attack: 0.002, decay: 0.7, curve: 6 }
    },
    {
      type: 'tone',
      freq: 880,
      at: 0.13,
      gain: 0,
      partials: [
        [1, 1, 1],
        [5.95, 0.14, 0.1],
        [11.6, 0.03, 0.05]
      ],
      env: { attack: 0.002, decay: 0.9, curve: 6 }
    }
  ]
};

export default tine;
