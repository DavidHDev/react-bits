const fizz = {
  duration: 0.7,
  seed: 342,
  loudness: -19,
  lowpass: 6000,
  highpass: 400,
  width: 0.8,
  reverb: { mix: 0.1, decay: 0.4, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 1264.1162, to: 1896.1743, time: 0.0168, curve: 1.6 },
      at: 0.2691,
      gain: -13.8692,
      pan: 0.6107,
      env: { attack: 0.002, decay: 0.0187, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 985.2812, to: 1477.9218, time: 0.0165, curve: 1.6 },
      at: 0.5354,
      gain: -12.0476,
      pan: -0.4066,
      env: { attack: 0.002, decay: 0.0183, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 1006.4261, to: 1509.6391, time: 0.0113, curve: 1.6 },
      at: 0.4509,
      gain: -11.2042,
      pan: 0.298,
      env: { attack: 0.002, decay: 0.0126, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 1437.3695, to: 2156.0543, time: 0.0189, curve: 1.6 },
      at: 0.1212,
      gain: -10.2798,
      pan: 0.1017,
      env: { attack: 0.002, decay: 0.021, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 906.1801, to: 1359.2702, time: 0.0133, curve: 1.6 },
      at: 0.5185,
      gain: -11.6838,
      pan: -0.3385,
      env: { attack: 0.002, decay: 0.0148, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 1299.5764, to: 1949.3646, time: 0.018, curve: 1.6 },
      at: 0.3132,
      gain: -10.0038,
      pan: 0.4315,
      env: { attack: 0.002, decay: 0.02, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 1182.1269, to: 1773.1903, time: 0.0133, curve: 1.6 },
      at: 0.1827,
      gain: -8.6302,
      pan: 0.0063,
      env: { attack: 0.002, decay: 0.0148, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 1118.7865, to: 1678.1797, time: 0.014, curve: 1.6 },
      at: 0.4205,
      gain: -10.9181,
      pan: -0.7364,
      env: { attack: 0.002, decay: 0.0155, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 1436.7764, to: 2155.1646, time: 0.0169, curve: 1.6 },
      at: 0.4487,
      gain: -13.6875,
      pan: -0.1161,
      env: { attack: 0.002, decay: 0.0188, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 1537.3168, to: 2305.9752, time: 0.0124, curve: 1.6 },
      at: 0.2395,
      gain: -13.2941,
      pan: 0.1792,
      env: { attack: 0.002, decay: 0.0138, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 1301.0691, to: 1951.6037, time: 0.0186, curve: 1.6 },
      at: 0.263,
      gain: -13.4388,
      pan: 0.0839,
      env: { attack: 0.002, decay: 0.0207, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 1252.0309, to: 1878.0464, time: 0.0112, curve: 1.6 },
      at: 0.5449,
      gain: -6.4333,
      pan: 0.1762,
      env: { attack: 0.002, decay: 0.0124, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 1281.405, to: 1922.1075, time: 0.014, curve: 1.6 },
      at: 0.5285,
      gain: -6.4079,
      pan: 0.1431,
      env: { attack: 0.002, decay: 0.0156, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 1098.6403, to: 1647.9605, time: 0.0132, curve: 1.6 },
      at: 0.0553,
      gain: -12.0912,
      pan: -0.3618,
      env: { attack: 0.002, decay: 0.0147, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 1406.0278, to: 2109.0417, time: 0.0191, curve: 1.6 },
      at: 0.4945,
      gain: -7.7192,
      pan: 0.1196,
      env: { attack: 0.002, decay: 0.0212, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 759.5434, to: 1139.3151, time: 0.0153, curve: 1.6 },
      at: 0.304,
      gain: -11.9005,
      pan: -0.4261,
      env: { attack: 0.002, decay: 0.017, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 1539.7674, to: 2309.6511, time: 0.0119, curve: 1.6 },
      at: 0.2544,
      gain: -6.4404,
      pan: 0.4921,
      env: { attack: 0.002, decay: 0.0132, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 1510.4312, to: 2265.6468, time: 0.0173, curve: 1.6 },
      at: 0.1491,
      gain: -13.0723,
      pan: -0.0458,
      env: { attack: 0.002, decay: 0.0192, curve: 5 }
    }
  ]
};

export default fizz;
