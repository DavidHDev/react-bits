const unplug = {
  duration: 0.5,
  seed: 86,
  loudness: -18.5,
  lowpass: 6500,
  reverb: { mix: 0.12, decay: 0.5, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 1174.66,
      at: 0,
      gain: -6,
      partials: [
        [1, 1, 1],
        [2, 0.064, 0.55],
        [3, 0.016, 0.35]
      ],
      env: { attack: 0.004, decay: 0.16, curve: 6 }
    },
    {
      type: 'tone',
      freq: 783.99,
      at: 0.08,
      gain: -6,
      partials: [
        [1, 1, 1],
        [2, 0.064, 0.55],
        [3, 0.016, 0.35]
      ],
      env: { attack: 0.004, decay: 0.24, curve: 6 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: { from: 170, to: 140, time: 0.02, curve: 3 },
      at: 0.16,
      gain: 0,
      env: { attack: 0.003, decay: 0.05, curve: 6 },
      filter: { type: 'lowpass', freq: 800, q: 0.6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.16,
      gain: -13,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 700, q: 0.7 },
        { type: 'lowpass', freq: 1820, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.012, curve: 6 }
    }
  ]
};

export default unplug;
