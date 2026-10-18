import type { Recipe } from './react-bits-sound';

const heart: Recipe = {
  duration: 0.3,
  seed: 255,
  loudness: -19,
  lowpass: 5500,
  reverb: { mix: 0.1, decay: 0.35, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 593.334, to: 659.26, time: 0.025, curve: 2 },
      partials: [
        [1, 1, 1],
        [2, 0.2, 0.5]
      ],
      env: { attack: 0.004, decay: 0.07, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 792, to: 880, time: 0.025, curve: 2 },
      at: 0.08,
      partials: [
        [1, 1, 1],
        [2, 0.2, 0.5]
      ],
      env: { attack: 0.004, decay: 0.14, curve: 5 }
    }
  ]
};

export default heart;
