const dispatch = {
  duration: 0.24,
  seed: 231,
  loudness: -19.5,
  lowpass: 6500,
  highpass: 200,
  reverb: { mix: 0.08, decay: 0.3, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: 0,
      pan: { from: 0, to: 0.4, time: 0.15 },
      filter: { type: 'bandpass', freq: { from: 600, to: 2200, time: 0.14, curve: 2 }, q: 0.9 },
      env: { attack: 0.04, rise: 1.5, decay: 0.1, curve: 4 }
    },
    {
      type: 'tone',
      freq: { from: 587.33, to: 1174.66, time: 0.12, curve: 2 },
      gain: -8,
      env: { attack: 0.03, decay: 0.12, curve: 4 }
    }
  ]
};

export default dispatch;
