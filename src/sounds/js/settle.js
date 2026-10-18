const settle = {
  duration: 0.7,
  seed: 45,
  loudness: -18.5,
  lowpass: 7000,
  reverb: { mix: 0.16, decay: 0.7, predelay: 0.01, damp: 5500 },
  layers: [
    {
      type: 'tone',
      freq: 587.33,
      at: 0,
      gain: 0,
      partials: [
        [1, 1, 1],
        [2, 0.072, 0.55],
        [3, 0.018, 0.35]
      ],
      env: { attack: 0.004, decay: 0.5, curve: 6 }
    },
    { type: 'tone', freq: 293.66, gain: -16, env: { attack: 0.01, decay: 0.35, curve: 5 } },
    {
      type: 'tone',
      freq: 880,
      at: 0.004,
      gain: -20,
      partials: [
        [1, 1, 1],
        [2, 0.032, 0.55],
        [3, 0.008, 0.35]
      ],
      env: { attack: 0.004, decay: 0.3, curve: 6 }
    }
  ]
};

export default settle;
