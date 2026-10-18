const wipe = {
  duration: 0.55,
  seed: 136,
  loudness: -18,
  lowpass: 7000,
  highpass: 120,
  reverb: { mix: 0.15, decay: 0.7, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 300, to: 1200, time: 0.5, curve: 1.5 },
      pan: { from: -0.6, to: 0.6, time: 0.5 },
      env: { attack: 0.2, rise: 1.4, decay: 0.3, curve: 4 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: { from: 600, to: 2400, time: 0.5, curve: 1.5 },
      gain: -14,
      pan: { from: -0.6, to: 0.6, time: 0.5 },
      filter: { type: 'lowpass', freq: 3000, q: 0.6 },
      env: { attack: 0.2, rise: 1.4, decay: 0.3, curve: 4 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -8,
      pan: { from: -0.6, to: 0.6, time: 0.5 },
      filter: { type: 'bandpass', freq: { from: 600, to: 2400, time: 0.5, curve: 2 }, q: 0.8 },
      env: { attack: 0.2, rise: 1.5, decay: 0.3, curve: 4 }
    }
  ]
};

export default wipe;
