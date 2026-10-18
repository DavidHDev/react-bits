import type { Recipe } from './react-bits-sound';

const dusk: Recipe = {
  duration: 0.85,
  seed: 82,
  loudness: -18,
  lowpass: 6000,
  reverb: { mix: 0.2, decay: 0.9, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      wave: 'triangle',
      freq: { from: 523.25, to: 392, time: 0.4, curve: 2 },
      filter: { type: 'lowpass', freq: { from: 4500, to: 800, time: 0.5 }, q: 0.6 },
      env: { attack: 0.02, decay: 0.7, curve: 4 }
    },
    {
      type: 'tone',
      freq: { from: 783.99, to: 587.33, time: 0.4, curve: 2 },
      gain: -10,
      env: { attack: 0.02, decay: 0.55, curve: 4 }
    }
  ]
};

export default dusk;
