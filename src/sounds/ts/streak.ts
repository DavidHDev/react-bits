import type { Recipe } from './react-bits-sound';

const streak: Recipe = {
  duration: 0.6,
  seed: 256,
  loudness: -18,
  lowpass: 7000,
  reverb: { mix: 0.12, decay: 0.5, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 587.33,
      at: 0,
      gain: -2,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.08, curve: 6 }
    },
    {
      type: 'tone',
      freq: 659.26,
      at: 0.045,
      gain: -2,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.08, curve: 6 }
    },
    {
      type: 'tone',
      freq: 739.99,
      at: 0.09,
      gain: -2,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.08, curve: 6 }
    },
    {
      type: 'tone',
      freq: 880,
      at: 0.135,
      gain: -2,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.08, curve: 6 }
    },
    {
      type: 'tone',
      freq: 987.77,
      at: 0.18,
      gain: -2,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.08, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1174.66,
      at: 0.225,
      gain: 0,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.35, curve: 6 }
    }
  ]
};

export default streak;
