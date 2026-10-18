import type { Recipe } from './react-bits-sound';

const plunge: Recipe = {
  duration: 2,
  seed: 301,
  loudness: -14,
  lowpass: 2500,
  highpass: 20,
  drive: 0.12,
  reverb: { mix: 0.2, decay: 1.8, predelay: 0.01, damp: 2500 },
  layers: [
    {
      type: 'tone',
      freq: { from: 110, to: 32, time: 1.4, curve: 3 },
      at: 0,
      gain: 0,
      env: { attack: 0.004, decay: 1.8, curve: 4 }
    },
    {
      type: 'noise',
      color: 'brown',
      gain: -10,
      filter: { type: 'lowpass', freq: { from: 600, to: 120, time: 1.2 }, q: 0.6 },
      env: { attack: 0.005, decay: 1.2, curve: 4 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -14,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 900, q: 0.6 },
        { type: 'lowpass', freq: 2340, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.02, curve: 6 }
    }
  ]
};

export default plunge;
