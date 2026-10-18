const notch = {
  duration: 0.06,
  seed: 22,
  loudness: -21,
  lowpass: 7000,
  reverb: { mix: 0.04, decay: 0.14, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 920, to: 780, time: 0.006, curve: 3 },
      at: 0,
      gain: 0,
      env: { attack: 0.0012, decay: 0.022, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -14,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1350, q: 1 },
        { type: 'lowpass', freq: 3510, q: 0.5 }
      ],
      env: { attack: 0.0012, decay: 0.006, curve: 6 }
    },
    {
      type: 'tone',
      freq: { from: 380, to: 360, time: 0.025, curve: 3 },
      at: 0,
      gain: -17,
      env: { attack: 0.0015, decay: 0.02, curve: 6 }
    }
  ]
};

export default notch;
