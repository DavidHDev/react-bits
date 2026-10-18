const dot = {
  duration: 0.1,
  seed: 25,
  loudness: -21,
  lowpass: 7000,
  reverb: { mix: 0.08, decay: 0.25, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 866.8, to: 880, time: 0.015 },
      env: { attack: 0.002, decay: 0.07, curve: 5 }
    }
  ]
};

export default dot;
