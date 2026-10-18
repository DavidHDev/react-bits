const chime = {
  duration: 1.5,
  seed: 51,
  loudness: -17,
  lowpass: 8000,
  reverb: { mix: 0.2, decay: 1.1, predelay: 0.01, damp: 6000 },
  layers: [
    {
      type: 'tone',
      freq: 659.26,
      at: 0,
      gain: 0,
      pan: -0.15,
      partials: [
        [1, 1, 1],
        [2, 0.16, 0.55],
        [3, 0.04, 0.35]
      ],
      env: { attack: 0.004, decay: 0.8, curve: 6 }
    },
    {
      type: 'tone',
      freq: 830.61,
      at: 0.11,
      gain: 0,
      pan: 0.1,
      partials: [
        [1, 1, 1],
        [2, 0.16, 0.55],
        [3, 0.04, 0.35]
      ],
      env: { attack: 0.004, decay: 0.9, curve: 6 }
    },
    {
      type: 'tone',
      freq: 987.77,
      at: 0.22,
      gain: 0,
      partials: [
        [1, 1, 1],
        [2, 0.16, 0.55],
        [3, 0.04, 0.35]
      ],
      env: { attack: 0.004, decay: 1.2, curve: 6 }
    }
  ]
};

export default chime;
