const plug = {
  duration: 0.55,
  seed: 85,
  loudness: -18.5,
  lowpass: 7000,
  reverb: { mix: 0.12, decay: 0.5, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      wave: 'triangle',
      freq: { from: 180, to: 150, time: 0.02, curve: 3 },
      at: 0,
      gain: 0,
      env: { attack: 0.003, decay: 0.05, curve: 6 },
      filter: { type: 'lowpass', freq: 800, q: 0.6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -12,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 800, q: 0.7 },
        { type: 'lowpass', freq: 2080, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.012, curve: 6 }
    },
    {
      type: 'tone',
      freq: 880,
      at: 0.09,
      gain: -6,
      partials: [
        [1, 1, 1],
        [2, 0.064, 0.55],
        [3, 0.016, 0.35]
      ],
      env: { attack: 0.004, decay: 0.18, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1174.66,
      at: 0.16,
      gain: -6,
      partials: [
        [1, 1, 1],
        [2, 0.064, 0.55],
        [3, 0.016, 0.35]
      ],
      env: { attack: 0.004, decay: 0.3, curve: 6 }
    }
  ]
};

export default plug;
