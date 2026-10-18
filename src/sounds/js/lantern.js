const lantern = {
  duration: 0.9,
  seed: 52,
  loudness: -17,
  lowpass: 6000,
  reverb: { mix: 0.14, decay: 0.7, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 440,
      at: 0,
      gain: 0,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.45, curve: 6 }
    },
    {
      type: 'tone',
      freq: 587.33,
      at: 0.16,
      gain: 0,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.55, curve: 6 }
    }
  ]
};

export default lantern;
