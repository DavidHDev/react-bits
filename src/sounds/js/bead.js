const bead = {
  duration: 0.22,
  seed: 21,
  loudness: -20,
  lowpass: 9000,
  reverb: { mix: 0.12, decay: 0.45, predelay: 0.01, damp: 6000 },
  layers: [
    {
      type: 'tone',
      freq: 880,
      at: 0,
      gain: 0,
      partials: [
        [1, 1, 1],
        [2.76, 0.108, 0.4],
        [5.4, 0.027, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.17, curve: 6 }
    }
  ]
};

export default bead;
