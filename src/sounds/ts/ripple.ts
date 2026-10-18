import type { Recipe } from './react-bits-sound';

const ripple: Recipe = {
  duration: 0.3,
  seed: 54,
  loudness: -18,
  lowpass: 7000,
  reverb: { mix: 0.12, decay: 0.45, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 560, to: 700, time: 0.03, curve: 2 },
      env: { attack: 0.003, decay: 0.08, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 720, to: 900, time: 0.03, curve: 2 },
      at: 0.095,
      env: { attack: 0.003, decay: 0.09, curve: 5 }
    }
  ]
};

export default ripple;
