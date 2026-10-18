const second = {
  duration: 0.05,
  seed: 225,
  loudness: -22,
  lowpass: 7000,
  highpass: 600,
  reverb: { mix: 0.04, decay: 0.15, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -6,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 2400, q: 1.1 },
        { type: 'lowpass', freq: 6240, q: 0.5 }
      ],
      env: { attack: 0.0006, decay: 0.003, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 0,
      gain: -6,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.02, curve: 6 }
    }
  ]
};

export default second;
