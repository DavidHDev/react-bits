const petal = {
  duration: 0.2,
  seed: 26,
  loudness: -20,
  lowpass: 8000,
  reverb: { mix: 0.12, decay: 0.35, predelay: 0.01, damp: 6500 },
  layers: [
    {
      type: 'tone',
      freq: 1174.66,
      at: 0,
      gain: 0,
      partials: [
        [1, 1, 1],
        [2, 0.064, 0.55],
        [3, 0.016, 0.35]
      ],
      env: { attack: 0.004, decay: 0.09, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1760,
      at: 0.035,
      gain: -4,
      partials: [
        [1, 1, 1],
        [2, 0.048, 0.55],
        [3, 0.012, 0.35]
      ],
      env: { attack: 0.004, decay: 0.12, curve: 6 }
    }
  ]
};

export default petal;
