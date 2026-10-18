import type { Recipe } from './react-bits-sound';

const downlink: Recipe = {
  duration: 0.75,
  seed: 224,
  loudness: -18.5,
  lowpass: 7000,
  highpass: 120,
  reverb: { mix: 0.16, decay: 0.6, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: 0,
      filter: { type: 'bandpass', freq: { from: 2600, to: 500, time: 0.2, curve: 2 }, q: 0.8 },
      env: { attack: 0.04, rise: 1.5, decay: 0.16, curve: 4 }
    },
    {
      type: 'tone',
      freq: 293.66,
      at: 0.17,
      gain: -2,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.3, curve: 6 }
    },
    {
      type: 'tone',
      freq: 587.33,
      at: 0.17,
      gain: -6,
      partials: [
        [1, 1, 1],
        [2, 0.048, 0.55],
        [3, 0.012, 0.35]
      ],
      env: { attack: 0.004, decay: 0.45, curve: 6 }
    }
  ]
};

export default downlink;
