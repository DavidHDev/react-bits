import type { Recipe } from './react-bits-sound';

const stack: Recipe = {
  duration: 0.18,
  seed: 217,
  loudness: -20,
  lowpass: 6500,
  reverb: { mix: 0.06, decay: 0.22, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 880,
      at: 0,
      gain: 0,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.05, curve: 6 }
    },
    {
      type: 'tone',
      freq: 659.26,
      at: 0.035,
      gain: -2,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.05, curve: 6 }
    },
    {
      type: 'tone',
      freq: 493.88,
      at: 0.07,
      gain: -4,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.05, curve: 6 }
    }
  ]
};

export default stack;
