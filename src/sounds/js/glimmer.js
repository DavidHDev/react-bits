const glimmer = {
  duration: 0.6,
  seed: 252,
  loudness: -19,
  lowpass: 9000,
  highpass: 400,
  width: 0.7,
  reverb: { mix: 0.25, decay: 0.8, predelay: 0.01, damp: 7000 },
  layers: [
    {
      type: 'tone',
      freq: 1975.53,
      at: 0.0094,
      gain: -1.7232,
      pan: 0.0473,
      partials: [
        [1, 1, 1],
        [2.76, 0.048, 0.4],
        [5.4, 0.012, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.1972, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1760,
      at: 0.051,
      gain: -2.1416,
      pan: 0.4804,
      partials: [
        [1, 1, 1],
        [2.76, 0.048, 0.4],
        [5.4, 0.012, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.1935, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 0.1032,
      gain: -3.7591,
      pan: -0.282,
      partials: [
        [1, 1, 1],
        [2.76, 0.048, 0.4],
        [5.4, 0.012, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.1274, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 0.1421,
      gain: -5.1606,
      pan: -0.4566,
      partials: [
        [1, 1, 1],
        [2.76, 0.048, 0.4],
        [5.4, 0.012, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.189, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1479.98,
      at: 0.1849,
      gain: -6.3813,
      pan: 0.5774,
      partials: [
        [1, 1, 1],
        [2.76, 0.048, 0.4],
        [5.4, 0.012, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.2167, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1975.53,
      at: 0.2324,
      gain: -7.3901,
      pan: 0.1312,
      partials: [
        [1, 1, 1],
        [2.76, 0.048, 0.4],
        [5.4, 0.012, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.1965, curve: 6 }
    }
  ]
};

export default glimmer;
