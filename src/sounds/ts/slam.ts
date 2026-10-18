import type { Recipe } from './react-bits-sound';

const slam: Recipe = {
  duration: 0.6,
  seed: 115,
  loudness: -13.5,
  lowpass: 6000,
  highpass: 30,
  drive: 0.2,
  reverb: { mix: 0.12, decay: 0.7, predelay: 0.01, damp: 3000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 95, to: 48, time: 0.15, curve: 3 },
      at: 0,
      gain: 0,
      env: { attack: 0.004, decay: 0.45, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 210, to: 120, time: 0.06, curve: 3 },
      env: { attack: 0.002, decay: 0.16, curve: 5 }
    },
    {
      type: 'noise',
      color: 'pink',
      gain: -4,
      filter: { type: 'lowpass', freq: { from: 3500, to: 600, time: 0.06 }, q: 0.6 },
      env: { attack: 0.001, decay: 0.05, curve: 5 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -12,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1200, q: 0.6 },
        { type: 'lowpass', freq: 3120, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.012, curve: 6 }
    }
  ]
};

export default slam;
