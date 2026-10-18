import type { Recipe } from './react-bits-sound';

const zap: Recipe = {
  duration: 0.25,
  seed: 317,
  loudness: -18,
  lowpass: 7000,
  highpass: 120,
  reverb: { mix: 0.08, decay: 0.35, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 1600, to: 160, time: 0.18, curve: 2 },
      fm: { ratio: 1.41, index: 2 },
      env: { attack: 0.002, decay: 0.2, curve: 4 }
    },
    {
      type: 'noise',
      color: 'crackle',
      gain: 6,
      filter: { type: 'bandpass', freq: 2000, q: 0.6 },
      env: { attack: 0.002, decay: 0.15, curve: 4 }
    }
  ]
};

export default zap;
