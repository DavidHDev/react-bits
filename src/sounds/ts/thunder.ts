import type { Recipe } from './react-bits-sound';

const thunder: Recipe = {
  duration: 3.8,
  seed: 114,
  loudness: -14,
  lowpass: 3000,
  highpass: 25,
  drive: 0.1,
  width: 0.8,
  reverb: { mix: 0.35, decay: 3.5, predelay: 0.02, damp: 2000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 62, to: 30, time: 1.2, curve: 3 },
      at: 0,
      gain: 0,
      env: { attack: 0.004, decay: 2.6, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 140, to: 70, time: 0.4, curve: 3 },
      gain: -2,
      env: { attack: 0.004, decay: 0.7, curve: 5 }
    },
    {
      type: 'noise',
      color: 'brown',
      gain: -2,
      tremolo: { rate: 7, depth: 0.45 },
      filter: { type: 'lowpass', freq: { from: 500, to: 120, time: 3 }, q: 0.6 },
      env: { attack: 0.01, decay: 3.4, curve: 3 }
    },
    {
      type: 'noise',
      color: 'pink',
      gain: -8,
      filter: { type: 'lowpass', freq: { from: 1800, to: 300, time: 0.3 }, q: 0.6 },
      env: { attack: 0.003, decay: 0.25, curve: 5 }
    }
  ]
};

export default thunder;
