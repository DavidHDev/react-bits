import type { Recipe } from './react-bits-sound';

const nudge: Recipe = {
  duration: 0.3,
  seed: 44,
  loudness: -19,
  lowpass: 6500,
  reverb: { mix: 0.1, decay: 0.35, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 659.26,
      at: 0,
      gain: 0,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.09, curve: 6 }
    },
    {
      type: 'tone',
      freq: 659.26,
      at: 0.11,
      gain: 0,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.12, curve: 6 }
    }
  ]
};

export default nudge;
