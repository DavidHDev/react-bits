const skip = {
  duration: 0.16,
  seed: 246,
  loudness: -21,
  lowpass: 5500,
  highpass: 300,
  reverb: { mix: 0.05, decay: 0.2, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: 0,
      filter: { type: 'bandpass', freq: { from: 700, to: 1400, time: 0.055, curve: 2 }, q: 1 },
      env: { attack: 0.02, rise: 1.5, decay: 0.035, curve: 5 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.06,
      gain: -1,
      filter: { type: 'bandpass', freq: { from: 850, to: 1700, time: 0.06, curve: 2 }, q: 1 },
      env: { attack: 0.02, rise: 1.5, decay: 0.04, curve: 5 }
    },
    {
      type: 'tone',
      freq: 987.77,
      at: 0.06,
      gain: -14,
      env: { attack: 0.002, decay: 0.04, curve: 6 }
    }
  ]
};

export default skip;
