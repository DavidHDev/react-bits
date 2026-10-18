const backdraft = {
  duration: 1.3,
  seed: 130,
  loudness: -16,
  lowpass: 6000,
  highpass: 50,
  reverse: true,
  reverb: { mix: 0.2, decay: 1, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: 0,
      pan: { from: 0.6, to: -0.6, time: 1.2 },
      filter: { type: 'bandpass', freq: { from: 1600, to: 300, time: 1.21, curve: 2 }, q: 0.7 },
      env: { attack: 0.01, rise: 1, decay: 1.2, curve: 3 }
    },
    {
      type: 'noise',
      color: 'brown',
      gain: -6,
      filter: { type: 'lowpass', freq: 400, q: 0.6 },
      env: { attack: 0.01, decay: 1.1, curve: 3 }
    }
  ]
};

export default backdraft;
