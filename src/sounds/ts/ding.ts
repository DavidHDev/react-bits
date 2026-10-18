import type { Recipe } from './react-bits-sound';

const ding: Recipe = {
  duration: 1.6,
  seed: 143,
  loudness: -16,
  lowpass: 8500,
  reverb: { mix: 0.25, decay: 1.4, predelay: 0.01, damp: 6500 },
  layers: [
    {
      type: 'tone',
      freq: 1318.51,
      at: 0,
      gain: 0,
      partials: [
        [1, 1, 1],
        [2, 0.128, 0.55],
        [3, 0.032, 0.35]
      ],
      env: { attack: 0.004, decay: 1.4, curve: 6 }
    },
    {
      type: 'tone',
      freq: 659.26,
      at: 0,
      gain: -14,
      partials: [
        [1, 1, 1],
        [2, 0.048, 0.55],
        [3, 0.012, 0.35]
      ],
      env: { attack: 0.004, decay: 1, curve: 6 }
    }
  ]
};

export default ding;
