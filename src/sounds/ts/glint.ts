import type { Recipe } from './react-bits-sound';

const glint: Recipe = {
  duration: 0.8,
  seed: 147,
  loudness: -18,
  lowpass: 10000,
  highpass: 500,
  reverb: { mix: 0.3, decay: 1.2, predelay: 0.01, damp: 8000 },
  layers: [
    {
      type: 'tone',
      freq: 1318.51,
      at: 0,
      gain: 0,
      fm: { ratio: 3.01, index: { from: 0.7, to: 0, time: 0.3 } },
      env: { attack: 0.002, decay: 0.5, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1975.53,
      at: 0.03,
      gain: -8,
      fm: { ratio: 2, index: { from: 0.5, to: 0, time: 0.21 } },
      env: { attack: 0.002, decay: 0.35, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -20,
      filter: { type: 'bandpass', freq: { from: 2500, to: 6000, time: 0.24, curve: 2 }, q: 0.6 },
      env: { attack: 0.04, rise: 1.5, decay: 0.2, curve: 4 }
    }
  ]
};

export default glint;
