import type { Recipe } from './react-bits-sound';

const aurora: Recipe = {
  duration: 3.4,
  seed: 107,
  loudness: -16,
  lowpass: 9500,
  highpass: 200,
  width: 0.8,
  reverb: { mix: 0.35, decay: 2.4, predelay: 0.01, damp: 7000 },
  layers: [
    {
      type: 'tone',
      freq: 739.99,
      at: 0,
      gain: -18.0916,
      pan: 0.0072,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.3394, curve: 6 }
    },
    {
      type: 'tone',
      freq: 880,
      at: 0.2987,
      gain: -16.1903,
      pan: 0.5894,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.3339, curve: 6 }
    },
    {
      type: 'tone',
      freq: 587.33,
      at: 0.4852,
      gain: -15.5421,
      pan: 0.1001,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.3339, curve: 6 }
    },
    {
      type: 'tone',
      freq: 880,
      at: 0.6444,
      gain: -15.2751,
      pan: -0.3063,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.3762, curve: 6 }
    },
    {
      type: 'tone',
      freq: 587.33,
      at: 0.7881,
      gain: -15.3802,
      pan: -0.2621,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.4273, curve: 6 }
    },
    {
      type: 'tone',
      freq: 739.99,
      at: 0.9214,
      gain: -14.9475,
      pan: 0.1423,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.4573, curve: 6 }
    },
    {
      type: 'tone',
      freq: 739.99,
      at: 1.0468,
      gain: -14.89,
      pan: -0.2229,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.2704, curve: 6 }
    },
    {
      type: 'tone',
      freq: 987.77,
      at: 1.1661,
      gain: -15.5516,
      pan: 0.5063,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.4522, curve: 6 }
    },
    {
      type: 'tone',
      freq: 987.77,
      at: 1.2804,
      gain: -16.351,
      pan: -0.6656,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.3523, curve: 6 }
    },
    {
      type: 'tone',
      freq: 987.77,
      at: 1.3904,
      gain: -13.3427,
      pan: 0.3303,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.4743, curve: 6 }
    },
    {
      type: 'tone',
      freq: 739.99,
      at: 1.4968,
      gain: -13.7301,
      pan: 0.1243,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.3743, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1174.66,
      at: 1.6001,
      gain: -13.8373,
      pan: -0.5232,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.3895, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1174.66,
      at: 1.7006,
      gain: -13.268,
      pan: -0.3837,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.4792, curve: 6 }
    },
    {
      type: 'tone',
      freq: 987.77,
      at: 1.7986,
      gain: -12.8047,
      pan: 0.1544,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.4502, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 1.8943,
      gain: -13.8992,
      pan: -0.4595,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.4893, curve: 6 }
    },
    {
      type: 'tone',
      freq: 880,
      at: 1.9881,
      gain: -13.4153,
      pan: -0.4341,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.4241, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1174.66,
      at: 2.0799,
      gain: -13.951,
      pan: 0.017,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.3489, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 2.1701,
      gain: -11.2508,
      pan: 0.0626,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.4166, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 2.2587,
      gain: -11.5909,
      pan: -0.5821,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.4146, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 2.3458,
      gain: -10.8537,
      pan: -0.5442,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.3766, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1174.66,
      at: 2.4316,
      gain: -11.4808,
      pan: 0.4744,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.4721, curve: 6 }
    },
    {
      type: 'tone',
      freq: 987.77,
      at: 2.5161,
      gain: -12.6363,
      pan: -0.0568,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.4668, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1479.98,
      at: 2.5993,
      gain: -10.9264,
      pan: -0.0155,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.2785, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1174.66,
      at: 2.6815,
      gain: -9.4558,
      pan: 0.3227,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.455, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1479.98,
      at: 2.7626,
      gain: -11.5035,
      pan: 0.3882,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.3009, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 2.8427,
      gain: -11.0248,
      pan: 0.377,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.3926, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1479.98,
      at: 2.9218,
      gain: -8.6218,
      pan: 0.1169,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.4721, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1479.98,
      at: 3,
      gain: -10.4593,
      pan: -0.0209,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.452, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      gain: -14,
      filter: [
        { type: 'highpass', freq: 2000, q: 0.5 },
        { type: 'lowpass', freq: { from: 3000, to: 8000, time: 3 }, q: 0.5 }
      ],
      env: { attack: 2.8, rise: 2, decay: 0.3, curve: 3 }
    },
    {
      type: 'tone',
      wave: 'sine',
      voices: 2,
      detune: 6,
      freq: 587.33,
      at: 0,
      gain: -12,
      filter: { type: 'lowpass', freq: 6000, q: 0.6 },
      env: { attack: 2.6, rise: 1.6, decay: 0.5, curve: 3 }
    },
    {
      type: 'tone',
      wave: 'sine',
      voices: 2,
      detune: 6,
      freq: 880,
      at: 0,
      gain: -14,
      filter: { type: 'lowpass', freq: 6000, q: 0.6 },
      env: { attack: 2.6, rise: 1.6, decay: 0.5, curve: 3 }
    },
    {
      type: 'tone',
      wave: 'sine',
      voices: 2,
      detune: 6,
      freq: 1479.98,
      at: 0,
      gain: -16,
      filter: { type: 'lowpass', freq: 6000, q: 0.6 },
      env: { attack: 2.6, rise: 1.6, decay: 0.5, curve: 3 }
    }
  ]
};

export default aurora;
