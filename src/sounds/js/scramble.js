const scramble = {
  duration: 0.8,
  seed: 314,
  loudness: -18.5,
  lowpass: 6000,
  highpass: 150,
  crush: 0.25,
  reverb: { mix: 0.1, decay: 0.4, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 480.3426,
      fm: { ratio: 2.276, index: 1.4 },
      at: 0.0047,
      gain: -11.3652,
      pan: 0.1303,
      env: { attack: 0.002, hold: 0.01, decay: 0.012, curve: 5 }
    },
    {
      type: 'tone',
      freq: 1157.9322,
      fm: { ratio: 1.284, index: 1.4 },
      at: 0.0319,
      gain: -10.815,
      pan: -0.0648,
      env: { attack: 0.002, hold: 0.01, decay: 0.012, curve: 5 }
    },
    {
      type: 'tone',
      freq: 1013.1444,
      fm: { ratio: 2.6312, index: 1.4 },
      at: 0.0522,
      gain: -6.3615,
      pan: 0.4873,
      env: { attack: 0.002, hold: 0.01, decay: 0.012, curve: 5 }
    },
    {
      type: 'tone',
      freq: 416.9697,
      fm: { ratio: 1.1308, index: 1.4 },
      at: 0.0821,
      gain: -11.4342,
      pan: -0.3256,
      env: { attack: 0.002, hold: 0.01, decay: 0.012, curve: 5 }
    },
    {
      type: 'tone',
      freq: 292.9254,
      fm: { ratio: 1.367, index: 1.4 },
      at: 0.1086,
      gain: -5.544,
      pan: 0.1545,
      env: { attack: 0.002, hold: 0.01, decay: 0.012, curve: 5 }
    },
    {
      type: 'tone',
      freq: 304.5897,
      fm: { ratio: 2.4471, index: 1.4 },
      at: 0.1373,
      gain: -10.5008,
      pan: 0.1132,
      env: { attack: 0.002, hold: 0.01, decay: 0.012, curve: 5 }
    },
    {
      type: 'tone',
      freq: 834.774,
      fm: { ratio: 1.8025, index: 1.4 },
      at: 0.1573,
      gain: -6.2031,
      pan: 0.461,
      env: { attack: 0.002, hold: 0.01, decay: 0.012, curve: 5 }
    },
    {
      type: 'tone',
      freq: 847.8571,
      fm: { ratio: 2.4588, index: 1.4 },
      at: 0.1893,
      gain: -7.4703,
      pan: -0.2575,
      env: { attack: 0.002, hold: 0.01, decay: 0.012, curve: 5 }
    },
    {
      type: 'tone',
      freq: 1059.6822,
      fm: { ratio: 2.9824, index: 1.4 },
      at: 0.2146,
      gain: -5.6395,
      pan: 0.1373,
      env: { attack: 0.002, hold: 0.01, decay: 0.012, curve: 5 }
    },
    {
      type: 'tone',
      freq: 822.8369,
      fm: { ratio: 2.7902, index: 1.4 },
      at: 0.2388,
      gain: -9.2147,
      pan: 0.3488,
      env: { attack: 0.002, hold: 0.01, decay: 0.012, curve: 5 }
    },
    {
      type: 'tone',
      freq: 998.8685,
      fm: { ratio: 2.2185, index: 1.4 },
      at: 0.264,
      gain: -6.6188,
      pan: -0.1474,
      env: { attack: 0.002, hold: 0.01, decay: 0.012, curve: 5 }
    },
    {
      type: 'tone',
      freq: 610.9345,
      fm: { ratio: 2.4074, index: 1.4 },
      at: 0.2926,
      gain: -7.3763,
      pan: -0.3732,
      env: { attack: 0.002, hold: 0.01, decay: 0.012, curve: 5 }
    },
    {
      type: 'tone',
      freq: 829.9249,
      fm: { ratio: 2.773, index: 1.4 },
      at: 0.3195,
      gain: -10.9016,
      pan: 0.4483,
      env: { attack: 0.002, hold: 0.01, decay: 0.012, curve: 5 }
    },
    {
      type: 'tone',
      freq: 741.2947,
      fm: { ratio: 1.2771, index: 1.4 },
      at: 0.3392,
      gain: -4.2943,
      pan: 0.4142,
      env: { attack: 0.002, hold: 0.01, decay: 0.012, curve: 5 }
    },
    {
      type: 'tone',
      freq: 909.5883,
      fm: { ratio: 2.2011, index: 1.4 },
      at: 0.3693,
      gain: -10.4879,
      pan: -0.1044,
      env: { attack: 0.002, hold: 0.01, decay: 0.012, curve: 5 }
    },
    {
      type: 'tone',
      freq: 256.8448,
      fm: { ratio: 1.7604, index: 1.4 },
      at: 0.3979,
      gain: -6.3229,
      pan: 0.1316,
      env: { attack: 0.002, hold: 0.01, decay: 0.012, curve: 5 }
    },
    {
      type: 'tone',
      freq: 363.3048,
      fm: { ratio: 2.8708, index: 1.4 },
      at: 0.4214,
      gain: -5.1022,
      pan: 0.1635,
      env: { attack: 0.002, hold: 0.01, decay: 0.012, curve: 5 }
    },
    {
      type: 'tone',
      freq: 322.848,
      fm: { ratio: 1.3297, index: 1.4 },
      at: 0.4487,
      gain: -11.6311,
      pan: -0.3674,
      env: { attack: 0.002, hold: 0.01, decay: 0.012, curve: 5 }
    },
    {
      type: 'tone',
      freq: 746.5164,
      fm: { ratio: 1.0816, index: 1.4 },
      at: 0.4752,
      gain: -11.5188,
      pan: -0.5678,
      env: { attack: 0.002, hold: 0.01, decay: 0.012, curve: 5 }
    },
    {
      type: 'tone',
      freq: 276.449,
      fm: { ratio: 1.0129, index: 1.4 },
      at: 0.4987,
      gain: -4.5008,
      pan: 0.3925,
      env: { attack: 0.002, hold: 0.01, decay: 0.012, curve: 5 }
    },
    {
      type: 'tone',
      freq: 408.3524,
      fm: { ratio: 2.1238, index: 1.4 },
      at: 0.5241,
      gain: -11.0308,
      pan: 0.4162,
      env: { attack: 0.002, hold: 0.01, decay: 0.012, curve: 5 }
    },
    {
      type: 'tone',
      freq: 1109.2716,
      fm: { ratio: 2.664, index: 1.4 },
      at: 0.5513,
      gain: -8.2214,
      pan: -0.4008,
      env: { attack: 0.002, hold: 0.01, decay: 0.012, curve: 5 }
    },
    {
      type: 'tone',
      freq: 287.7236,
      fm: { ratio: 2.3228, index: 1.4 },
      at: 0.5793,
      gain: -7.266,
      pan: -0.3645,
      env: { attack: 0.002, hold: 0.01, decay: 0.012, curve: 5 }
    },
    {
      type: 'tone',
      freq: 1115.9943,
      fm: { ratio: 2.4537, index: 1.4 },
      at: 0.6017,
      gain: -6.6905,
      pan: 0.2425,
      env: { attack: 0.002, hold: 0.01, decay: 0.012, curve: 5 }
    },
    {
      type: 'tone',
      freq: 1149.6009,
      fm: { ratio: 1.497, index: 1.4 },
      at: 0.6247,
      gain: -7.9927,
      pan: 0.0083,
      env: { attack: 0.002, hold: 0.01, decay: 0.012, curve: 5 }
    },
    {
      type: 'tone',
      freq: 330.6357,
      fm: { ratio: 1.7131, index: 1.4 },
      at: 0.6512,
      gain: -5.187,
      pan: 0.4019,
      env: { attack: 0.002, hold: 0.01, decay: 0.012, curve: 5 }
    }
  ]
};

export default scramble;
