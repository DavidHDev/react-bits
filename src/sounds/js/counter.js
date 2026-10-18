const counter = {
  duration: 1.2,
  seed: 335,
  loudness: -18.5,
  lowpass: 7000,
  reverb: { mix: 0.06, decay: 0.25, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 588.4894,
      at: 0,
      gain: -1.0238,
      pan: -0.245,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.02, curve: 6 }
    },
    {
      type: 'tone',
      freq: 627.4388,
      at: 0.075,
      gain: -1.9546,
      pan: 0.1673,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.02, curve: 6 }
    },
    {
      type: 'tone',
      freq: 664.5819,
      at: 0.1455,
      gain: -1.0567,
      pan: -0.2107,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.02, curve: 6 }
    },
    {
      type: 'tone',
      freq: 700.2807,
      at: 0.2118,
      gain: -0.9144,
      pan: 0.0303,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.02, curve: 6 }
    },
    {
      type: 'tone',
      freq: 742.4781,
      at: 0.2741,
      gain: -0.4784,
      pan: -0.1611,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.02, curve: 6 }
    },
    {
      type: 'tone',
      freq: 787.774,
      at: 0.3326,
      gain: -0.1255,
      pan: -0.1709,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.02, curve: 6 }
    },
    {
      type: 'tone',
      freq: 831.893,
      at: 0.3877,
      gain: -1.87,
      pan: -0.1173,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.02, curve: 6 }
    },
    {
      type: 'tone',
      freq: 888.1743,
      at: 0.4394,
      gain: -0.3468,
      pan: -0.1413,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.02, curve: 6 }
    },
    {
      type: 'tone',
      freq: 935.0067,
      at: 0.488,
      gain: -1.7688,
      pan: -0.2253,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.02, curve: 6 }
    },
    {
      type: 'tone',
      freq: 985.158,
      at: 0.5338,
      gain: -1.7132,
      pan: 0.2438,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.02, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1051.6755,
      at: 0.5767,
      gain: -0.3689,
      pan: -0.136,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.02, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1104.5815,
      at: 0.6171,
      gain: -0.5137,
      pan: -0.035,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.02, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1179.6691,
      at: 0.6551,
      gain: -1.3124,
      pan: 0.2365,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.02, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1249.1676,
      at: 0.6908,
      gain: -0.1987,
      pan: -0.1915,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.02, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1313.4026,
      at: 0.7243,
      gain: -0.2412,
      pan: -0.1602,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.02, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1407.2013,
      at: 0.7559,
      gain: -1.4748,
      pan: 0.1208,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.02, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1465.7952,
      at: 0.7855,
      gain: -0.9353,
      pan: 0.062,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.02, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1556.6966,
      at: 0.8134,
      gain: -0.9182,
      pan: -0.0627,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.02, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1648.5991,
      at: 0.8396,
      gain: -0.1455,
      pan: 0.2253,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.02, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1766.422,
      at: 0.8642,
      gain: -0.4181,
      pan: 0.0606,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.02, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1760,
      at: 0.9,
      gain: -6,
      partials: [
        [1, 1, 1],
        [2, 0.064, 0.55],
        [3, 0.016, 0.35]
      ],
      env: { attack: 0.004, decay: 0.3, curve: 6 }
    }
  ]
};

export default counter;
