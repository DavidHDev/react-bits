const retreat = {
  duration: 0.2,
  seed: 202,
  loudness: -20,
  lowpass: 7000,
  reverb: { mix: 0.08, decay: 0.3, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 880,
      at: 0,
      gain: 0,
      partials: [
        [1, 1, 1],
        [2, 0.048, 0.55],
        [3, 0.012, 0.35]
      ],
      env: { attack: 0.004, decay: 0.06, curve: 6 }
    },
    {
      type: 'tone',
      freq: 587.33,
      at: 0.055,
      gain: 0,
      partials: [
        [1, 1, 1],
        [2, 0.048, 0.55],
        [3, 0.012, 0.35]
      ],
      env: { attack: 0.004, decay: 0.1, curve: 6 }
    }
  ]
};

export default retreat;
