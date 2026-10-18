const treasure = {
  duration: 1.6,
  seed: 257,
  loudness: -17,
  lowpass: 8000,
  width: 0.8,
  reverb: { mix: 0.25, decay: 1.2, predelay: 0.01, damp: 6000 },
  layers: [
    {
      type: 'tone',
      freq: 146.83,
      at: 0,
      gain: -4,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.15, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -12,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 500, q: 0.6 },
        { type: 'lowpass', freq: 1300, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.03, curve: 6 }
    },
    {
      type: 'tone',
      freq: 880,
      at: 0.0823,
      gain: -10.1486,
      pan: -0.4951,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.2451, curve: 6 }
    },
    {
      type: 'tone',
      freq: 987.77,
      at: 0.1315,
      gain: -9.0048,
      pan: 0.251,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.2697, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1174.66,
      at: 0.1818,
      gain: -11.1075,
      pan: 0.0575,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.312, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 0.2397,
      gain: -10.7341,
      pan: 0.4943,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.2942, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1479.98,
      at: 0.2805,
      gain: -9.4953,
      pan: 0.3592,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.2546, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1760,
      at: 0.3372,
      gain: -11.0017,
      pan: -0.4931,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.2641, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1975.53,
      at: 0.3813,
      gain: -11.7376,
      pan: -0.2567,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.2479, curve: 6 }
    },
    {
      type: 'tone',
      freq: 293.66,
      at: 0.42,
      gain: -8,
      partials: [
        [1, 1, 1],
        [2, 0.048, 0.55],
        [3, 0.012, 0.35]
      ],
      env: { attack: 0.004, decay: 1, curve: 6 }
    },
    {
      type: 'tone',
      freq: 369.99,
      at: 0.432,
      gain: -9.5,
      partials: [
        [1, 1, 1],
        [2, 0.048, 0.55],
        [3, 0.012, 0.35]
      ],
      env: { attack: 0.004, decay: 1.05, curve: 6 }
    },
    {
      type: 'tone',
      freq: 440,
      at: 0.444,
      gain: -11,
      partials: [
        [1, 1, 1],
        [2, 0.048, 0.55],
        [3, 0.012, 0.35]
      ],
      env: { attack: 0.004, decay: 1.1, curve: 6 }
    },
    {
      type: 'tone',
      freq: 659.26,
      at: 0.456,
      gain: -12.5,
      partials: [
        [1, 1, 1],
        [2, 0.048, 0.55],
        [3, 0.012, 0.35]
      ],
      env: { attack: 0.004, decay: 1.15, curve: 6 }
    }
  ]
};

export default treasure;
