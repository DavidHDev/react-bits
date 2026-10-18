const pebble = {
  duration: 0.16,
  seed: 11,
  loudness: -18,
  lowpass: 7000,
  reverb: { mix: 0.08, decay: 0.3, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 560, to: 380, time: 0.028, curve: 3 },
      at: 0,
      gain: 0,
      env: { attack: 0.0015, decay: 0.075, curve: 6 }
    },
    {
      type: 'tone',
      freq: { from: 1120, to: 820, time: 0.02, curve: 3 },
      at: 0,
      gain: -19,
      env: { attack: 0.0015, decay: 0.03, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -21,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1150, q: 0.8 },
        { type: 'lowpass', freq: 2990, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.007, curve: 6 }
    }
  ]
};

export default pebble;
