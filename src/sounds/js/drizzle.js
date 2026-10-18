const drizzle = {
  duration: 9.5,
  seed: 323,
  loudness: -22,
  lowpass: 7000,
  highpass: 150,
  width: 1,
  reverb: { mix: 0.2, decay: 1.2, predelay: 0.01, damp: 6000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      filter: { type: 'lowpass', freq: 2400, q: 0.5 },
      env: { attack: 1.5, hold: 6.5, decay: 1.5, curve: 3 }
    },
    {
      type: 'noise',
      color: 'crackle',
      gain: 3,
      filter: [
        { type: 'bandpass', freq: 2600, q: 0.6 },
        { type: 'lowpass', freq: 4500, q: 0.5 }
      ],
      env: { attack: 1.5, hold: 6.5, decay: 1.5, curve: 3 }
    },
    {
      type: 'tone',
      freq: { from: 3595.7059, to: 4674.4177, time: 0.0072, curve: 1.6 },
      at: 4.3505,
      gain: -17.2887,
      pan: 0.5126,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 2989.4585, to: 3886.2961, time: 0.0072, curve: 1.6 },
      at: 8.2986,
      gain: -20.8876,
      pan: -0.168,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 2498.3793, to: 3247.8931, time: 0.0072, curve: 1.6 },
      at: 7.7288,
      gain: -18.1638,
      pan: -0.0425,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 2679.5056, to: 3483.3573, time: 0.0072, curve: 1.6 },
      at: 4.5946,
      gain: -18.4946,
      pan: -0.4008,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 2035.0339, to: 2645.5441, time: 0.0072, curve: 1.6 },
      at: 6.0138,
      gain: -17.4176,
      pan: 0.3435,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 3714.4293, to: 4828.7581, time: 0.0072, curve: 1.6 },
      at: 1.3827,
      gain: -12.0176,
      pan: 0.0203,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 2824.1073, to: 3671.3395, time: 0.0072, curve: 1.6 },
      at: 2.5837,
      gain: -15.3423,
      pan: -0.6042,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 2035.1567, to: 2645.7037, time: 0.0072, curve: 1.6 },
      at: 0.9627,
      gain: -12.4013,
      pan: -0.3346,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 2433.677, to: 3163.7801, time: 0.0072, curve: 1.6 },
      at: 4.252,
      gain: -16.545,
      pan: -0.0143,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 3066.1873, to: 3986.0435, time: 0.0072, curve: 1.6 },
      at: 6.5011,
      gain: -16.4045,
      pan: 0.4444,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 2332.8759, to: 3032.7387, time: 0.0072, curve: 1.6 },
      at: 4.5955,
      gain: -21.8001,
      pan: -0.0423,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 2599.2944, to: 3379.0827, time: 0.0072, curve: 1.6 },
      at: 4.6422,
      gain: -18.702,
      pan: 0.6712,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 3355.7806, to: 4362.5148, time: 0.0072, curve: 1.6 },
      at: 6.6473,
      gain: -19.0972,
      pan: 0.7209,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 2720.1446, to: 3536.188, time: 0.0072, curve: 1.6 },
      at: 6.4071,
      gain: -14.2054,
      pan: -0.1559,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 3540.8347, to: 4603.0851, time: 0.0072, curve: 1.6 },
      at: 1.8042,
      gain: -19.434,
      pan: 0.7327,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 2424.9396, to: 3152.4215, time: 0.0072, curve: 1.6 },
      at: 7.5969,
      gain: -15.9513,
      pan: 0.2427,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 3294.4369, to: 4282.768, time: 0.0072, curve: 1.6 },
      at: 1.1711,
      gain: -19.2993,
      pan: -0.6404,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 3349.7302, to: 4354.6493, time: 0.0072, curve: 1.6 },
      at: 8.5831,
      gain: -14.9997,
      pan: 0.6592,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 2074.3977, to: 2696.717, time: 0.0072, curve: 1.6 },
      at: 0.8956,
      gain: -12.0767,
      pan: 0.7576,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 2709.4066, to: 3522.2286, time: 0.0072, curve: 1.6 },
      at: 1.6239,
      gain: -21.281,
      pan: 0.7136,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 3513.2166, to: 4567.1816, time: 0.0072, curve: 1.6 },
      at: 8.4628,
      gain: -20.1087,
      pan: 0.7208,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 3719.7466, to: 4835.6706, time: 0.0072, curve: 1.6 },
      at: 2.7677,
      gain: -17.5834,
      pan: 0.2204,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 3547.8159, to: 4612.1607, time: 0.0072, curve: 1.6 },
      at: 1.3187,
      gain: -13.5605,
      pan: 0.0997,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 2879.4339, to: 3743.2641, time: 0.0072, curve: 1.6 },
      at: 7.9658,
      gain: -20.6147,
      pan: 0.3322,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 2503.6113, to: 3254.6947, time: 0.0072, curve: 1.6 },
      at: 5.1288,
      gain: -16.4763,
      pan: 0.1233,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 3094.4237, to: 4022.7508, time: 0.0072, curve: 1.6 },
      at: 8.2984,
      gain: -17.4368,
      pan: 0.522,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 2509.7468, to: 3262.6708, time: 0.0072, curve: 1.6 },
      at: 7.4931,
      gain: -17.2001,
      pan: -0.2014,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 2463.408, to: 3202.4304, time: 0.0072, curve: 1.6 },
      at: 0.8331,
      gain: -21.2856,
      pan: -0.8546,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 2236.8811, to: 2907.9454, time: 0.0072, curve: 1.6 },
      at: 7.2873,
      gain: -13.1125,
      pan: 0.679,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 1890.261, to: 2457.3393, time: 0.0072, curve: 1.6 },
      at: 6.0333,
      gain: -15.2696,
      pan: -0.508,
      env: { attack: 0.002, decay: 0.008, curve: 5 }
    }
  ]
};

export default drizzle;
