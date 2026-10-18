const squeak = {
  duration: 0.3,
  seed: 346,
  loudness: -19,
  lowpass: 4000,
  reverb: { mix: 0.08, decay: 0.3, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: {
        points: [
          [0, 900],
          [0.08, 1400],
          [0.2, 1050]
        ]
      },
      vibrato: { rate: 9, depth: 40 },
      partials: [
        [1, 1, 1],
        [2, 0.15, 0.5]
      ],
      env: { attack: 0.02, decay: 0.22, curve: 4 }
    }
  ]
};

export default squeak;
