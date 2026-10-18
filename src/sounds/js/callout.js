const callout = {
  duration: 0.8,
  seed: 235,
  loudness: -17.5,
  lowpass: 8000,
  reverb: { mix: 0.16, decay: 0.6, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 783.99,
      at: 0,
      gain: 0,
      fm: { ratio: 1, index: { from: 0.5, to: 0, time: 0.15 } },
      env: { attack: 0.002, decay: 0.25, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1174.66,
      at: 0.1,
      gain: 0,
      fm: { ratio: 1, index: { from: 0.5, to: 0, time: 0.27 } },
      env: { attack: 0.002, decay: 0.45, curve: 6 }
    }
  ]
};

export default callout;
