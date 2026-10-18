import type { Recipe } from './react-bits-sound';

const spark: Recipe = {
  duration: 0.3,
  seed: 144,
  loudness: -18,
  lowpass: 6000,
  highpass: 400,
  reverb: { mix: 0.1, decay: 0.4, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      at: 0.0297,
      gain: -12.1052,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1300.92, q: 1.2 },
        { type: 'lowpass', freq: 3382.392, q: 0.5 }
      ],
      env: { attack: 0.0004, decay: 0.002, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.0714,
      gain: -12.015,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1461.0492, q: 1.2 },
        { type: 'lowpass', freq: 3798.72792, q: 0.5 }
      ],
      env: { attack: 0.0004, decay: 0.002, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.0113,
      gain: -15.3431,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1380.2965, q: 1.2 },
        { type: 'lowpass', freq: 3588.7709, q: 0.5 }
      ],
      env: { attack: 0.0004, decay: 0.002, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.0559,
      gain: -13.4129,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1486.3554, q: 1.2 },
        { type: 'lowpass', freq: 3864.52404, q: 0.5 }
      ],
      env: { attack: 0.0004, decay: 0.002, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.0504,
      gain: -10.1314,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1706.1047, q: 1.2 },
        { type: 'lowpass', freq: 4435.87222, q: 0.5 }
      ],
      env: { attack: 0.0004, decay: 0.002, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.028,
      gain: -15.1217,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1343.0313, q: 1.2 },
        { type: 'lowpass', freq: 3491.88138, q: 0.5 }
      ],
      env: { attack: 0.0004, decay: 0.002, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.0153,
      gain: -15.2619,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1353.1828, q: 1.2 },
        { type: 'lowpass', freq: 3518.27528, q: 0.5 }
      ],
      env: { attack: 0.0004, decay: 0.002, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.0066,
      gain: -15.6698,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 2112.8854, q: 1.2 },
        { type: 'lowpass', freq: 5493.50204, q: 0.5 }
      ],
      env: { attack: 0.0004, decay: 0.002, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.0057,
      gain: -16.8003,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1285.9335, q: 1.2 },
        { type: 'lowpass', freq: 3343.4271, q: 0.5 }
      ],
      env: { attack: 0.0004, decay: 0.002, curve: 6 }
    },
    {
      type: 'tone',
      freq: { from: 2200, to: 900, time: 0.05, curve: 3 },
      gain: -12,
      env: { attack: 0.001, decay: 0.04, curve: 5 }
    }
  ]
};

export default spark;
