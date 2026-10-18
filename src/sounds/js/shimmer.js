const shimmer = {
  duration: 1.7,
  seed: 133,
  loudness: -18,
  lowpass: 10000,
  highpass: 300,
  width: 0.8,
  reverb: { mix: 0.35, decay: 2, predelay: 0.015, damp: 7000 },
  layers: [
    {
      type: 'tone',
      freq: 1046.5,
      at: 0.0043,
      gain: -8,
      pan: -0.15,
      partials: [
        [1, 1, 1],
        [2, 0.06, 0.5]
      ],
      env: { attack: 0.03, decay: 0.9554, curve: 5 }
    },
    {
      type: 'tone',
      freq: 1174.66,
      at: 0.1079,
      gain: -9.6,
      pan: 0.23,
      partials: [
        [1, 1, 1],
        [2, 0.06, 0.5]
      ],
      env: { attack: 0.03, decay: 0.7716, curve: 5 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 0.1843,
      gain: -11.2,
      pan: -0.31,
      partials: [
        [1, 1, 1],
        [2, 0.06, 0.5]
      ],
      env: { attack: 0.03, decay: 0.7116, curve: 5 }
    },
    {
      type: 'tone',
      freq: 1567.98,
      at: 0.2896,
      gain: -12.8,
      pan: 0.39,
      partials: [
        [1, 1, 1],
        [2, 0.06, 0.5]
      ],
      env: { attack: 0.03, decay: 0.8305, curve: 5 }
    },
    {
      type: 'tone',
      freq: 1760,
      at: 0.3725,
      gain: -14.4,
      pan: -0.47,
      partials: [
        [1, 1, 1],
        [2, 0.06, 0.5]
      ],
      env: { attack: 0.03, decay: 0.8037, curve: 5 }
    },
    {
      type: 'tone',
      freq: 2093,
      at: 0.4611,
      gain: -16,
      pan: 0.55,
      partials: [
        [1, 1, 1],
        [2, 0.06, 0.5]
      ],
      env: { attack: 0.03, decay: 0.7717, curve: 5 }
    },
    {
      type: 'noise',
      color: 'pink',
      gain: -30,
      filter: [
        { type: 'highpass', freq: 5000, q: 0.5 },
        { type: 'lowpass', freq: 9000, q: 0.5 }
      ],
      env: { attack: 0.4, rise: 1.5, decay: 0.8, curve: 4 }
    }
  ]
};

export default shimmer;
