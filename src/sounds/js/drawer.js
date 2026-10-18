const drawer = {
  duration: 0.3,
  seed: 68,
  loudness: -19.5,
  lowpass: 5000,
  highpass: 120,
  reverb: { mix: 0.08, decay: 0.3, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: 0,
      filter: { type: 'bandpass', freq: { from: 450, to: 900, time: 0.17, curve: 2 }, q: 0.9 },
      env: { attack: 0.06, rise: 1.3, hold: 0.06, decay: 0.05, curve: 4 }
    },
    {
      type: 'tone',
      freq: 196,
      at: 0.17,
      gain: -4,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.06, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.17,
      gain: -14,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 700, q: 0.6 },
        { type: 'lowpass', freq: 1820, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.012, curve: 6 }
    }
  ]
};

export default drawer;
