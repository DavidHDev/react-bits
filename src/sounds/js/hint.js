const hint = {
  duration: 0.5,
  seed: 47,
  loudness: -19,
  lowpass: 7000,
  reverb: { mix: 0.16, decay: 0.6, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 783.99,
      fm: { ratio: 2, index: { from: 0.6, to: 0, time: 0.2 } },
      env: { attack: 0.012, decay: 0.38, curve: 5 }
    },
    {
      type: 'noise',
      color: 'pink',
      gain: -24,
      filter: { type: 'bandpass', freq: 2400, q: 0.8 },
      env: { attack: 0.02, decay: 0.12, curve: 4 }
    }
  ]
};

export default hint;
