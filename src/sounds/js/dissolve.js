const dissolve = {
  duration: 1.6,
  seed: 138,
  loudness: -19,
  lowpass: 9000,
  highpass: 300,
  width: 0.8,
  reverb: { mix: 0.4, decay: 1.8, predelay: 0.01, damp: 7000 },
  layers: [
    {
      type: 'tone',
      freq: 739.99,
      at: 1.233,
      gain: -16.5117,
      pan: 0.1097,
      env: { attack: 0.02, decay: 0.1479, curve: 4 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 0.6861,
      gain: -10.8819,
      pan: 0.4019,
      env: { attack: 0.02, decay: 0.1336, curve: 4 }
    },
    {
      type: 'tone',
      freq: 739.99,
      at: 0.2569,
      gain: -17.4895,
      pan: -0.0061,
      env: { attack: 0.02, decay: 0.082, curve: 4 }
    },
    {
      type: 'tone',
      freq: 880,
      at: 1.0192,
      gain: -10.6838,
      pan: -0.0941,
      env: { attack: 0.02, decay: 0.0786, curve: 4 }
    },
    {
      type: 'tone',
      freq: 1479.98,
      at: 0.0924,
      gain: -11.0321,
      pan: 0.3329,
      env: { attack: 0.02, decay: 0.1374, curve: 4 }
    },
    {
      type: 'tone',
      freq: 1174.66,
      at: 0.2994,
      gain: -17.9917,
      pan: 0.7025,
      env: { attack: 0.02, decay: 0.116, curve: 4 }
    },
    {
      type: 'tone',
      freq: 987.77,
      at: 1.1587,
      gain: -11.291,
      pan: 0.5463,
      env: { attack: 0.02, decay: 0.0807, curve: 4 }
    },
    {
      type: 'tone',
      freq: 1174.66,
      at: 1.1701,
      gain: -17.5907,
      pan: -0.3759,
      env: { attack: 0.02, decay: 0.0822, curve: 4 }
    },
    {
      type: 'tone',
      freq: 987.77,
      at: 1.0026,
      gain: -12.1927,
      pan: 0.0744,
      env: { attack: 0.02, decay: 0.1392, curve: 4 }
    },
    {
      type: 'tone',
      freq: 880,
      at: 0.3246,
      gain: -17.2456,
      pan: -0.1775,
      env: { attack: 0.02, decay: 0.092, curve: 4 }
    },
    {
      type: 'tone',
      freq: 739.99,
      at: 0.2713,
      gain: -16.4048,
      pan: 0.5584,
      env: { attack: 0.02, decay: 0.077, curve: 4 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 0.4219,
      gain: -16.3444,
      pan: 0.1993,
      env: { attack: 0.02, decay: 0.0661, curve: 4 }
    },
    {
      type: 'tone',
      freq: 587.33,
      at: 1.0028,
      gain: -10.8418,
      pan: 0.201,
      env: { attack: 0.02, decay: 0.0864, curve: 4 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 1.2488,
      gain: -13.1784,
      pan: -0.6462,
      env: { attack: 0.02, decay: 0.0653, curve: 4 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 1.2211,
      gain: -14.3077,
      pan: 0.4474,
      env: { attack: 0.02, decay: 0.1448, curve: 4 }
    },
    {
      type: 'tone',
      freq: 739.99,
      at: 0.5009,
      gain: -15.9551,
      pan: 0.46,
      env: { attack: 0.02, decay: 0.1189, curve: 4 }
    },
    {
      type: 'tone',
      freq: 587.33,
      at: 0.2742,
      gain: -13.1501,
      pan: 0.0068,
      env: { attack: 0.02, decay: 0.08, curve: 4 }
    },
    {
      type: 'tone',
      freq: 1174.66,
      at: 0.9079,
      gain: -17.8302,
      pan: 0.481,
      env: { attack: 0.02, decay: 0.1199, curve: 4 }
    },
    {
      type: 'tone',
      freq: 587.33,
      at: 1.1648,
      gain: -17.2676,
      pan: 0.5008,
      env: { attack: 0.02, decay: 0.0989, curve: 4 }
    },
    {
      type: 'tone',
      freq: 1479.98,
      at: 0.8083,
      gain: -14.4157,
      pan: -0.1062,
      env: { attack: 0.02, decay: 0.0924, curve: 4 }
    },
    {
      type: 'tone',
      freq: 1479.98,
      at: 0.7205,
      gain: -13.7314,
      pan: 0.3476,
      env: { attack: 0.02, decay: 0.0599, curve: 4 }
    },
    {
      type: 'tone',
      freq: 880,
      at: 0.7709,
      gain: -15.648,
      pan: -0.1374,
      env: { attack: 0.02, decay: 0.0775, curve: 4 }
    },
    {
      type: 'tone',
      freq: 1760,
      at: 1.3,
      gain: -17.0085,
      pan: -0.3653,
      env: { attack: 0.02, decay: 0.0554, curve: 4 }
    },
    {
      type: 'tone',
      freq: 1760,
      at: 1.2673,
      gain: -16.3581,
      pan: -0.5708,
      env: { attack: 0.02, decay: 0.0585, curve: 4 }
    },
    {
      type: 'tone',
      freq: 587.33,
      at: 0.2253,
      gain: -14.3883,
      pan: -0.5268,
      env: { attack: 0.02, decay: 0.1342, curve: 4 }
    },
    {
      type: 'tone',
      freq: 1174.66,
      at: 1.125,
      gain: -10.8956,
      pan: 0.6239,
      env: { attack: 0.02, decay: 0.0777, curve: 4 }
    },
    {
      type: 'noise',
      color: 'pink',
      gain: -20,
      filter: { type: 'bandpass', freq: 3000, q: 0.5 },
      env: { attack: 0.6, rise: 1.5, decay: 0.9, curve: 3 }
    }
  ]
};

export default dissolve;
