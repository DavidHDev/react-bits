const puff = {
  duration: 0.09,
  seed: 15,
  loudness: -21,
  lowpass: 4200,
  highpass: 260,
  reverb: { mix: 0.06, decay: 0.2, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      filter: { type: 'bandpass', freq: { from: 1300, to: 800, time: 0.05 }, q: 0.7 },
      env: { attack: 0.004, decay: 0.05, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 340, to: 280, time: 0.03, curve: 3 },
      at: 0,
      gain: -16,
      env: { attack: 0.003, decay: 0.035, curve: 6 }
    }
  ]
};

export default puff;
