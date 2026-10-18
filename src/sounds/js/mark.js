const mark = {
  duration: 0.18,
  seed: 221,
  loudness: -20,
  lowpass: 7500,
  reverb: { mix: 0.08, decay: 0.3, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 1174.66,
      at: 0,
      gain: 0,
      partials: [
        [1, 1, 1],
        [2, 0.24, 0.55],
        [3, 0.096, 0.35],
        [4, 0.042, 0.22],
        [5, 0.018, 0.15]
      ],
      env: { attack: 0.0015, decay: 0.12, curve: 6 }
    }
  ]
};

export default mark;
