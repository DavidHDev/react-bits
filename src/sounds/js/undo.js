const undo = {
  duration: 0.16,
  seed: 48,
  loudness: -20,
  lowpass: 6500,
  reverb: { mix: 0.08, decay: 0.25, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 880, to: 587.33, time: 0.09, curve: 2 },
      env: { attack: 0.03, rise: 2, decay: 0.06, curve: 4 }
    },
    {
      type: 'noise',
      color: 'pink',
      gain: -16,
      filter: { type: 'bandpass', freq: { from: 2400, to: 1100, time: 0.1 }, q: 0.9 },
      env: { attack: 0.05, rise: 2, decay: 0.03, curve: 4 }
    }
  ]
};

export default undo;
