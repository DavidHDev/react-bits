import type { Recipe } from './react-bits-sound';

const uplink: Recipe = {
  duration: 0.75,
  seed: 223,
  loudness: -18.5,
  lowpass: 7000,
  highpass: 150,
  reverb: { mix: 0.16, decay: 0.6, predelay: 0.01, damp: 6500 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: 0,
      filter: { type: 'bandpass', freq: { from: 600, to: 2000, time: 0.21, curve: 2 }, q: 0.8 },
      env: { attack: 0.16, rise: 1.8, decay: 0.05, curve: 4 }
    },
    {
      type: 'tone',
      freq: 1174.66,
      at: 0.17,
      gain: 0,
      fm: { ratio: 2, index: { from: 0.8, to: 0, time: 0.3 } },
      env: { attack: 0.002, decay: 0.5, curve: 6 }
    }
  ]
};

export default uplink;
