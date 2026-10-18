import type { Recipe } from './react-bits-sound';

const signal: Recipe = {
  duration: 0.8,
  seed: 57,
  loudness: -17,
  lowpass: 8000,
  reverb: { mix: 0.14, decay: 0.5, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 880,
      at: 0,
      gain: 0,
      partials: [
        [1, 1, 1],
        [2, 0.096, 0.55],
        [3, 0.024, 0.35]
      ],
      env: { attack: 0.004, decay: 0.1, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 0.09,
      gain: -1,
      partials: [
        [1, 1, 1],
        [2, 0.096, 0.55],
        [3, 0.024, 0.35]
      ],
      env: { attack: 0.004, decay: 0.12, curve: 6 }
    },
    {
      type: 'tone',
      freq: 880,
      at: 0.36,
      gain: -1,
      partials: [
        [1, 1, 1],
        [2, 0.096, 0.55],
        [3, 0.024, 0.35]
      ],
      env: { attack: 0.004, decay: 0.1, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 0.45,
      gain: -2,
      partials: [
        [1, 1, 1],
        [2, 0.096, 0.55],
        [3, 0.024, 0.35]
      ],
      env: { attack: 0.004, decay: 0.2, curve: 6 }
    }
  ]
};

export default signal;
