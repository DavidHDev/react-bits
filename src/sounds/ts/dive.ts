import type { Recipe } from './react-bits-sound';

const dive: Recipe = {
  duration: 0.2,
  seed: 205,
  loudness: -20,
  lowpass: 7000,
  reverb: { mix: 0.08, decay: 0.3, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 1174.66, to: 587.33, time: 0.12, curve: 2 },
      env: { attack: 0.01, decay: 0.14, curve: 4 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -16,
      filter: { type: 'bandpass', freq: { from: 2400, to: 900, time: 0.12, curve: 2 }, q: 0.9 },
      env: { attack: 0.02, rise: 1.5, decay: 0.1, curve: 4 }
    }
  ]
};

export default dive;
