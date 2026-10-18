const crystal = {
  duration: 2.4,
  seed: 118,
  loudness: -15,
  lowpass: 9000,
  highpass: 40,
  width: 0.8,
  reverb: { mix: 0.35, decay: 2.4, predelay: 0.01, damp: 7000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 80, to: 50, time: 0.24, curve: 3 },
      at: 0,
      gain: -4,
      env: { attack: 0.004, decay: 0.4, curve: 5 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -10,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1000, q: 0.6 },
        { type: 'lowpass', freq: 2600, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.02, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1174.66,
      at: 0,
      gain: -2,
      pan: -0.3,
      partials: [
        [1, 1, 1],
        [2.76, 0.06, 0.4],
        [5.4, 0.015, 0.22]
      ],
      env: { attack: 0.0025, decay: 1.2, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1760,
      at: 0,
      gain: -5,
      pan: 0.3,
      partials: [
        [1, 1, 1],
        [2.76, 0.06, 0.4],
        [5.4, 0.015, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.95, curve: 6 }
    },
    {
      type: 'tone',
      freq: 2349.32,
      at: 0,
      gain: -8,
      pan: 0,
      partials: [
        [1, 1, 1],
        [2.76, 0.06, 0.4],
        [5.4, 0.015, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.7, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 0.3587,
      gain: -19.2912,
      pan: -0.5513,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.2002, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 0.6952,
      gain: -15.7768,
      pan: -0.7024,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.2672, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1567.98,
      at: 0.1192,
      gain: -15.5263,
      pan: -0.6366,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.4162, curve: 6 }
    },
    {
      type: 'tone',
      freq: 2349.32,
      at: 0.5445,
      gain: -14.37,
      pan: -0.2872,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.4473, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1760,
      at: 0.1987,
      gain: -16.2514,
      pan: 0.0997,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.2492, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1760,
      at: 0.6555,
      gain: -19.3035,
      pan: -0.2069,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.3619, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1975.53,
      at: 0.5697,
      gain: -19.5625,
      pan: 0.716,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.4896, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1760,
      at: 0.0883,
      gain: -15.4633,
      pan: -0.7786,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.3409, curve: 6 }
    }
  ]
};

export default crystal;
