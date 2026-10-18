const appear = {
  duration: 0.2,
  seed: 332,
  loudness: -18,
  lowpass: 7000,
  reverb: { mix: 0.1, decay: 0.35, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 380, to: 798, time: 0.054, curve: 1.6 },
      at: 0,
      gain: 0,
      env: { attack: 0.002, decay: 0.06, curve: 5 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -18,
      filter: { type: 'bandpass', freq: { from: 900, to: 1800, time: 0.062, curve: 2 }, q: 0.9 },
      env: { attack: 0.012, rise: 1.5, decay: 0.05, curve: 4 }
    }
  ]
};

export default appear;
