const tab = {
  duration: 0.07,
  seed: 203,
  loudness: -21,
  lowpass: 7000,
  highpass: 400,
  reverb: { mix: 0.05, decay: 0.15, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: 0,
      filter: { type: 'bandpass', freq: { from: 1400, to: 2000, time: 0.02, curve: 2 }, q: 1.2 },
      env: { attack: 0.002, rise: 1.5, decay: 0.018, curve: 5 }
    },
    {
      type: 'tone',
      freq: 987.77,
      at: 0,
      gain: -10,
      env: { attack: 0.002, decay: 0.04, curve: 6 }
    }
  ]
};

export default tab;
