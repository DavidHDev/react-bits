const ellipsis = {
  duration: 0.26,
  seed: 233,
  loudness: -23,
  lowpass: 7000,
  reverb: { mix: 0.1, decay: 0.3, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 1174.66,
      at: 0,
      gain: 0,
      env: { attack: 0.003, decay: 0.03, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 0.09,
      gain: -1.5,
      env: { attack: 0.003, decay: 0.03, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1174.66,
      at: 0.18,
      gain: -3,
      env: { attack: 0.003, decay: 0.03, curve: 6 }
    }
  ]
};

export default ellipsis;
