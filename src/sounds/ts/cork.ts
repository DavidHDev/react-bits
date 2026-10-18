import type { Recipe } from './react-bits-sound';

const cork: Recipe = {
  duration: 0.6,
  seed: 341,
  loudness: -16,
  lowpass: 8000,
  highpass: 60,
  reverb: { mix: 0.12, decay: 0.5, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 900, to: 350, time: 0.012, curve: 3 },
      env: { attack: 0.002, decay: 0.03, curve: 5 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -4,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 700, q: 0.6 },
        { type: 'lowpass', freq: 1820, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.012, curve: 6 }
    },
    {
      type: 'noise',
      color: 'crackle',
      at: 0.02,
      gain: 2,
      filter: [
        { type: 'highpass', freq: 3000, q: 0.5 },
        { type: 'lowpass', freq: 8000, q: 0.5 }
      ],
      env: { attack: 0.01, decay: 0.5, curve: 4 }
    }
  ]
};

export default cork;
