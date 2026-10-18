const release = {
  duration: 0.35,
  seed: 84,
  loudness: -19,
  lowpass: 7500,
  reverb: { mix: 0.1, decay: 0.4, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -12,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1300, q: 0.8 },
        { type: 'lowpass', freq: 3380, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.006, curve: 6 }
    },
    {
      type: 'tone',
      freq: { from: 620, to: 560, time: 0.01, curve: 3 },
      at: 0,
      gain: -8,
      env: { attack: 0.0015, decay: 0.03, curve: 6 }
    },
    {
      type: 'tone',
      freq: { from: 587.33, to: 880, time: 0.12, curve: 2 },
      at: 0.04,
      gain: -6,
      env: { attack: 0.03, decay: 0.2, curve: 4 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.04,
      gain: -22,
      filter: { type: 'bandpass', freq: { from: 1200, to: 3000, time: 0.17, curve: 2 }, q: 0.8 },
      env: { attack: 0.05, rise: 1.5, decay: 0.12, curve: 4 }
    }
  ]
};

export default release;
