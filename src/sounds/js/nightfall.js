const nightfall = {
  duration: 0.45,
  seed: 35,
  loudness: -19.5,
  lowpass: 4500,
  reverb: { mix: 0.18, decay: 0.6, predelay: 0.01, damp: 3500 },
  layers: [
    {
      type: 'tone',
      freq: 739.99,
      at: 0,
      gain: 0,
      partials: [
        [1, 1, 1],
        [2, 0.04, 0.55],
        [3, 0.01, 0.35]
      ],
      env: { attack: 0.004, decay: 0.16, curve: 6 }
    },
    {
      type: 'tone',
      freq: 493.88,
      at: 0.07,
      gain: -1,
      partials: [
        [1, 1, 1],
        [2, 0.04, 0.55],
        [3, 0.01, 0.35]
      ],
      env: { attack: 0.004, decay: 0.3, curve: 6 }
    }
  ]
};

export default nightfall;
