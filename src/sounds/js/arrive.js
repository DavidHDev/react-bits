const arrive = {
  duration: 1.3,
  seed: 55,
  loudness: -17.5,
  lowpass: 7000,
  reverb: { mix: 0.2, decay: 1, predelay: 0.01, damp: 5500 },
  layers: [
    {
      type: 'tone',
      freq: 783.99,
      at: 0,
      gain: 0,
      partials: [
        [1, 1, 1],
        [4, 0.09, 0.35],
        [10, 0.012, 0.12]
      ],
      tremolo: { rate: 5.5, depth: 0.28 },
      env: { attack: 0.003, decay: 0.6, curve: 5 }
    },
    {
      type: 'tone',
      freq: 587.33,
      at: 0.2,
      gain: 0,
      partials: [
        [1, 1, 1],
        [4, 0.09, 0.35],
        [10, 0.012, 0.12]
      ],
      tremolo: { rate: 5.5, depth: 0.28 },
      env: { attack: 0.003, decay: 0.9, curve: 5 }
    }
  ]
};

export default arrive;
