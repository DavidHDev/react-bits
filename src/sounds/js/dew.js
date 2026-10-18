const dew = {
  duration: 0.18,
  seed: 14,
  loudness: -19,
  lowpass: 6500,
  reverb: { mix: 0.1, decay: 0.32, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 380, to: 820, time: 0.045, curve: 2 },
      env: { attack: 0.003, decay: 0.07, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 190, to: 410, time: 0.045, curve: 2 },
      gain: -17,
      env: { attack: 0.003, decay: 0.045, curve: 5 }
    }
  ]
};

export default dew;
