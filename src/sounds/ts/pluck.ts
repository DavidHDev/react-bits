import type { Recipe } from './react-bits-sound';

const pluck: Recipe = {
  duration: 0.32,
  seed: 24,
  loudness: -19,
  lowpass: 6500,
  reverb: { mix: 0.1, decay: 0.4, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 587.33,
      at: 0,
      gain: 0,
      partials: [
        [1, 1, 1],
        [2, 0.32, 0.55],
        [3, 0.128, 0.35],
        [4, 0.056, 0.22],
        [5, 0.024, 0.15]
      ],
      env: { attack: 0.0015, decay: 0.28, curve: 6 }
    }
  ]
};

export default pluck;
