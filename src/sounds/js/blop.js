const blop = {
  duration: 0.12,
  seed: 343,
  loudness: -17,
  lowpass: 5000,
  reverb: { mix: 0.08, decay: 0.25, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 520, to: 260, time: 0.03, curve: 2 },
      partials: [
        [1, 1, 1],
        [2, 0.15, 0.5]
      ],
      env: { attack: 0.002, decay: 0.06, curve: 5 }
    }
  ]
};

export default blop;
