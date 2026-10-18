const coin = {
  duration: 0.45,
  seed: 251,
  loudness: -18.5,
  lowpass: 7000,
  reverb: { mix: 0.1, decay: 0.4, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 987.77,
      harmonics: [1, 0, 0.18, 0, 0.06],
      filter: { type: 'lowpass', freq: 4500, q: 0.6 },
      env: { attack: 0.002, hold: 0.04, decay: 0.03, curve: 5 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 0.06,
      harmonics: [1, 0, 0.18, 0, 0.06],
      filter: { type: 'lowpass', freq: 5000, q: 0.6 },
      env: { attack: 0.002, decay: 0.35, curve: 5 }
    }
  ]
};

export default coin;
