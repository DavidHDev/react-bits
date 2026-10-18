const breeze = {
  duration: 0.48,
  seed: 62,
  loudness: -19,
  lowpass: 6000,
  highpass: 150,
  reverb: { mix: 0.12, decay: 0.5, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      filter: { type: 'bandpass', freq: { from: 500, to: 1600, time: 0.36, curve: 2 }, q: 0.8 },
      env: { attack: 0.22, rise: 1.8, decay: 0.2, curve: 4 }
    },
    {
      type: 'tone',
      freq: { from: 330, to: 440, time: 0.3, curve: 2 },
      gain: -15,
      env: { attack: 0.16, rise: 1.6, decay: 0.2, curve: 4 }
    }
  ]
};

export default breeze;
