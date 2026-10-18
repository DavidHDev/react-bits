const anvil = {
  duration: 2,
  seed: 116,
  loudness: -15,
  lowpass: 7000,
  highpass: 40,
  reverb: { mix: 0.25, decay: 1.8, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 196,
      partials: [
        [1, 1, 1],
        [2.76, 0.5, 0.8],
        [5.4, 0.25, 0.5],
        [8.93, 0.12, 0.35],
        [13.3, 0.05, 0.2]
      ],
      env: { attack: 0.002, decay: 1.6, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 110, to: 70, time: 0.18, curve: 3 },
      at: 0,
      gain: -6,
      env: { attack: 0.004, decay: 0.3, curve: 5 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -8,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1500, q: 0.7 },
        { type: 'lowpass', freq: 3900, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.01, curve: 6 }
    }
  ]
};

export default anvil;
