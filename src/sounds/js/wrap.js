const wrap = {
  duration: 0.3,
  seed: 244,
  loudness: -19,
  lowpass: 7000,
  reverb: { mix: 0.08, decay: 0.25, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 880,
      partials: [
        [1, 1, 1],
        [2, 0.1, 0.6]
      ],
      env: { attack: 0.005, hold: 0.04, decay: 0.05, curve: 5 }
    },
    {
      type: 'tone',
      freq: 587.33,
      at: 0.11,
      partials: [
        [1, 1, 1],
        [2, 0.1, 0.6]
      ],
      env: { attack: 0.005, hold: 0.05, decay: 0.09, curve: 5 }
    }
  ]
};

export default wrap;
