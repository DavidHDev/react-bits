import type { Recipe } from './react-bits-sound';

const swish: Recipe = {
  duration: 0.24,
  seed: 61,
  loudness: -19,
  lowpass: 6000,
  highpass: 180,
  reverb: { mix: 0.08, decay: 0.3, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      pan: { from: -0.4, to: 0.4, time: 0.22 },
      filter: { type: 'bandpass', freq: { from: 650, to: 1700, time: 0.2, curve: 2 }, q: 0.9 },
      env: { attack: 0.07, rise: 1.6, decay: 0.15, curve: 4 }
    }
  ]
};

export default swish;
