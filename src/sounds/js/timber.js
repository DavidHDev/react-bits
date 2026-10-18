const timber = {
  duration: 0.6,
  seed: 117,
  loudness: -14.5,
  lowpass: 5000,
  highpass: 40,
  reverb: { mix: 0.1, decay: 0.6, predelay: 0.01, damp: 3500 },
  layers: [
    {
      type: 'tone',
      freq: 98,
      at: 0,
      gain: 0,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.22, curve: 6 }
    },
    {
      type: 'tone',
      freq: { from: 160, to: 110, time: 0.05, curve: 3 },
      gain: -4,
      env: { attack: 0.002, decay: 0.12, curve: 5 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -6,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 900, q: 0.6 },
        { type: 'lowpass', freq: 2340, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.02, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -16,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 2400, q: 0.8 },
        { type: 'lowpass', freq: 6240, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.006, curve: 6 }
    }
  ]
};

export default timber;
