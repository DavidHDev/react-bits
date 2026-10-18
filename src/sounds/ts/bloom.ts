import type { Recipe } from './react-bits-sound';

const bloom: Recipe = {
  duration: 0.95,
  seed: 41,
  loudness: -17,
  lowpass: 7500,
  reverb: { mix: 0.16, decay: 0.8, predelay: 0.01, damp: 5500 },
  layers: [
    {
      type: 'tone',
      freq: 587.33,
      at: 0,
      gain: 0,
      partials: [
        [1, 1, 1],
        [2, 0.16, 0.55],
        [3, 0.04, 0.35]
      ],
      env: { attack: 0.004, decay: 0.5, curve: 6 }
    },
    {
      type: 'tone',
      freq: 880,
      at: 0.09,
      gain: 0,
      partials: [
        [1, 1, 1],
        [2, 0.16, 0.55],
        [3, 0.04, 0.35]
      ],
      env: { attack: 0.004, decay: 0.75, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1760,
      at: 0.09,
      gain: -22,
      partials: [
        [1, 1, 1],
        [2, 0.08, 0.55],
        [3, 0.02, 0.35]
      ],
      env: { attack: 0.004, decay: 0.4, curve: 6 }
    }
  ]
};

export default bloom;
