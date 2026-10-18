import type { Recipe } from './react-bits-sound';

const burble: Recipe = {
  duration: 0.9,
  seed: 347,
  loudness: -18,
  lowpass: 5000,
  highpass: 150,
  reverb: { mix: 0.15, decay: 0.6, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 298.0217, to: 536.4391, time: 0.045, curve: 1.6 },
      at: 0.0295,
      gain: -0.871,
      pan: 0.0566,
      env: { attack: 0.002, decay: 0.05, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 334.0204, to: 601.2367, time: 0.045, curve: 1.6 },
      at: 0.0998,
      gain: -1.0414,
      pan: -0.3739,
      env: { attack: 0.002, decay: 0.05, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 425.5039, to: 765.907, time: 0.045, curve: 1.6 },
      at: 0.203,
      gain: -3.074,
      pan: 0.302,
      env: { attack: 0.002, decay: 0.05, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 493.5488, to: 888.3878, time: 0.045, curve: 1.6 },
      at: 0.2825,
      gain: -3.7123,
      pan: 0.3719,
      env: { attack: 0.002, decay: 0.05, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 584.7093, to: 1052.4767, time: 0.045, curve: 1.6 },
      at: 0.3638,
      gain: -2.924,
      pan: 0.0923,
      env: { attack: 0.002, decay: 0.05, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 664.7525, to: 1196.5545, time: 0.045, curve: 1.6 },
      at: 0.4532,
      gain: -3.3878,
      pan: -0.3615,
      env: { attack: 0.002, decay: 0.05, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 738.7544, to: 1329.7579, time: 0.045, curve: 1.6 },
      at: 0.5643,
      gain: -5.2702,
      pan: 0.3376,
      env: { attack: 0.002, decay: 0.05, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 926.5723, to: 1667.8301, time: 0.045, curve: 1.6 },
      at: 0.6545,
      gain: -5.1202,
      pan: -0.1351,
      env: { attack: 0.002, decay: 0.05, curve: 5 }
    }
  ]
};

export default burble;
