const ping = {
  duration: 1.2,
  seed: 53,
  loudness: -17,
  lowpass: 8000,
  reverb: { mix: 0.2, decay: 1.2, predelay: 0.01, damp: 6000 },
  layers: [
    {
      type: 'tone',
      freq: 880,
      at: 0,
      gain: 0,
      partials: [
        [1, 1, 1],
        [2, 0.128, 0.55],
        [3, 0.032, 0.35]
      ],
      env: { attack: 0.004, decay: 1.1, curve: 6 }
    }
  ]
};

export default ping;
