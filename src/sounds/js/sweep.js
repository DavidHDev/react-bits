const sweep = {
  duration: 0.42,
  seed: 63,
  loudness: -19,
  lowpass: 5500,
  highpass: 150,
  reverb: { mix: 0.1, decay: 0.45, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      filter: { type: 'bandpass', freq: { from: 1600, to: 450, time: 0.32, curve: 2 }, q: 0.8 },
      env: { attack: 0.03, rise: 1.2, decay: 0.33, curve: 4 }
    },
    {
      type: 'tone',
      freq: { from: 440, to: 300, time: 0.26, curve: 2 },
      gain: -16,
      env: { attack: 0.02, decay: 0.24, curve: 4 }
    }
  ]
};

export default sweep;
