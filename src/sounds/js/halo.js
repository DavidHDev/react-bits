const halo = {
  duration: 0.36,
  seed: 23,
  loudness: -19,
  lowpass: 7500,
  reverb: { mix: 0.18, decay: 0.6, predelay: 0.01, damp: 5500 },
  layers: [
    {
      type: 'tone',
      freq: { from: 659.26, to: 679.0378, time: 0.08 },
      fm: { ratio: 2, index: { from: 0.35, to: 0, time: 0.12 } },
      env: { attack: 0.006, decay: 0.26, curve: 5 }
    },
    {
      type: 'tone',
      freq: 987.77,
      at: 0.014,
      gain: -17,
      env: { attack: 0.006, decay: 0.16, curve: 5 }
    }
  ]
};

export default halo;
