import type { Recipe } from './react-bits-sound';

const countdown: Recipe = {
  duration: 2.2,
  seed: 368,
  loudness: -16.5,
  lowpass: 7000,
  reverb: { mix: 0.12, decay: 0.6, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 880,
      at: 0,
      partials: [
        [1, 1, 1],
        [2, 0.1, 0.6]
      ],
      env: { attack: 0.004, hold: 0.06, decay: 0.12, curve: 5 }
    },
    {
      type: 'tone',
      freq: 880,
      at: 0.6,
      partials: [
        [1, 1, 1],
        [2, 0.1, 0.6]
      ],
      env: { attack: 0.004, hold: 0.06, decay: 0.12, curve: 5 }
    },
    {
      type: 'tone',
      freq: 880,
      at: 1.2,
      partials: [
        [1, 1, 1],
        [2, 0.1, 0.6]
      ],
      env: { attack: 0.004, hold: 0.06, decay: 0.12, curve: 5 }
    },
    {
      type: 'tone',
      freq: 1760,
      at: 1.8,
      partials: [
        [1, 1, 1],
        [2, 0.1, 0.6]
      ],
      env: { attack: 0.004, hold: 0.15, decay: 0.5, curve: 5 }
    }
  ]
};

export default countdown;
