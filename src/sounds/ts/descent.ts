import type { Recipe } from './react-bits-sound';

const descent: Recipe = {
  duration: 2.6,
  seed: 302,
  loudness: -16,
  lowpass: 8000,
  highpass: 40,
  width: 0.7,
  reverb: { mix: 0.25, decay: 1.8, predelay: 0.01, damp: 4000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      filter: { type: 'lowpass', freq: { from: 8000, to: 250, time: 2.4, curve: 2 }, q: 0.7 },
      env: { attack: 0.05, decay: 2.4, curve: 3 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: { from: 587.33, to: 146.83, time: 2.2, curve: 2 },
      gain: -12,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.05, decay: 2.2, curve: 3 }
    }
  ]
};

export default descent;
