import type { Recipe } from './react-bits-sound';

const upswing: Recipe = {
  duration: 0.65,
  seed: 110,
  loudness: -16,
  lowpass: 7500,
  highpass: 80,
  reverb: { mix: 0.2, decay: 0.8, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      filter: { type: 'lowpass', freq: { from: 500, to: 6000, time: 0.55, curve: 0.7 }, q: 0.7 },
      env: { attack: 0.5, rise: 2, decay: 0.06, curve: 3 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: { from: 293.66, to: 587.33, time: 0.55, curve: 0.8 },
      gain: -10,
      filter: { type: 'lowpass', freq: 3000, q: 0.6 },
      env: { attack: 0.5, rise: 2, decay: 0.06, curve: 3 }
    }
  ]
};

export default upswing;
