const dip = {
  duration: 0.45,
  seed: 306,
  loudness: -15,
  lowpass: 3000,
  highpass: 30,
  reverb: { mix: 0.12, decay: 0.5, predelay: 0.01, damp: 2500 },
  layers: [
    {
      type: 'tone',
      freq: { from: 220, to: 60, time: 0.35, curve: 3 },
      at: 0,
      gain: 0,
      env: { attack: 0.004, decay: 0.4, curve: 4 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -10,
      filter: { type: 'bandpass', freq: { from: 1500, to: 300, time: 0.31, curve: 2 }, q: 0.7 },
      env: { attack: 0.01, rise: 1, decay: 0.3, curve: 4 }
    }
  ]
};

export default dip;
