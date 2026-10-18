const wink = {
  duration: 0.2,
  seed: 234,
  loudness: -20,
  lowpass: 8000,
  reverb: { mix: 0.1, decay: 0.35, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 520, to: 1092, time: 0.045, curve: 1.6 },
      at: 0,
      gain: 0,
      env: { attack: 0.002, decay: 0.05, curve: 5 }
    },
    {
      type: 'tone',
      freq: 1760,
      at: 0.035,
      gain: -10,
      partials: [
        [1, 1, 1],
        [2, 0.048, 0.55],
        [3, 0.012, 0.35]
      ],
      env: { attack: 0.004, decay: 0.12, curve: 6 }
    }
  ]
};

export default wink;
