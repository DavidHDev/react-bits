const popover = {
  duration: 0.1,
  seed: 206,
  loudness: -21,
  lowpass: 7000,
  reverb: { mix: 0.06, decay: 0.2, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 320, to: 672, time: 0.045, curve: 1.6 },
      at: 0,
      gain: 0,
      env: { attack: 0.002, decay: 0.05, curve: 5 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -20,
      filter: { type: 'bandpass', freq: { from: 900, to: 1800, time: 0.052, curve: 2 }, q: 0.9 },
      env: { attack: 0.012, rise: 1.5, decay: 0.04, curve: 5 }
    }
  ]
};

export default popover;
