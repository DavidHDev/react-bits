import type { Recipe } from './react-bits-sound';

const check: Recipe = {
  duration: 0.1,
  seed: 33,
  loudness: -20,
  lowpass: 7000,
  reverb: { mix: 0.06, decay: 0.2, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 783.99,
      at: 0,
      gain: 0,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.055, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -20,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1600, q: 0.8 },
        { type: 'lowpass', freq: 4160, q: 0.5 }
      ],
      env: { attack: 0.0008, decay: 0.004, curve: 6 }
    }
  ]
};

export default check;
