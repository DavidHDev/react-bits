import type { Recipe } from './react-bits-sound';

const huddle: Recipe = {
  duration: 1.4,
  seed: 237,
  loudness: -17.5,
  lowpass: 6500,
  reverb: { mix: 0.2, decay: 0.9, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 293.66,
      at: 0,
      gain: 0,
      fm: { ratio: 1, index: { from: 1.4, to: 0.15, time: 0.4 } },
      partials: [
        [1, 1, 1],
        [2, 0.12, 0.5]
      ],
      env: { attack: 0.003, decay: 0.8, curve: 5 }
    },
    {
      type: 'tone',
      freq: 440,
      at: 0.07,
      gain: -1.5,
      fm: { ratio: 1, index: { from: 1.4, to: 0.15, time: 0.4 } },
      partials: [
        [1, 1, 1],
        [2, 0.12, 0.5]
      ],
      env: { attack: 0.003, decay: 0.8, curve: 5 }
    },
    {
      type: 'tone',
      freq: 587.33,
      at: 0.14,
      gain: -3,
      fm: { ratio: 1, index: { from: 1.4, to: 0.15, time: 0.4 } },
      partials: [
        [1, 1, 1],
        [2, 0.12, 0.5]
      ],
      env: { attack: 0.003, decay: 0.8, curve: 5 }
    },
    {
      type: 'tone',
      freq: 739.99,
      at: 0.21,
      gain: -4.5,
      fm: { ratio: 1, index: { from: 1.4, to: 0.15, time: 0.4 } },
      partials: [
        [1, 1, 1],
        [2, 0.12, 0.5]
      ],
      env: { attack: 0.003, decay: 0.8, curve: 5 }
    }
  ]
};

export default huddle;
