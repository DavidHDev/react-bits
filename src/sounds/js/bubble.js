const bubble = {
  duration: 0.3,
  seed: 232,
  loudness: -19,
  lowpass: 6500,
  reverb: { mix: 0.1, decay: 0.35, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 566.9636, to: 659.26, time: 0.02, curve: 2 },
      partials: [
        [1, 1, 1],
        [2, 0.12, 0.5]
      ],
      env: { attack: 0.003, decay: 0.07, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 849.4822, to: 987.77, time: 0.02, curve: 2 },
      at: 0.085,
      partials: [
        [1, 1, 1],
        [2, 0.12, 0.5]
      ],
      env: { attack: 0.003, decay: 0.11, curve: 5 }
    }
  ]
};

export default bubble;
