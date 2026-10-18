import type { Recipe } from './react-bits-sound';

const shutter: Recipe = {
  duration: 0.14,
  seed: 245,
  loudness: -19,
  lowpass: 7000,
  reverb: { mix: 0.06, decay: 0.2, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -6,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 2000, q: 0.9 },
        { type: 'lowpass', freq: 5200, q: 0.5 }
      ],
      env: { attack: 0.0006, decay: 0.006, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -10,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 900, q: 0.7 },
        { type: 'lowpass', freq: 2340, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.015, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.008,
      gain: -22,
      filter: { type: 'bandpass', freq: 1800, q: 1 },
      env: { attack: 0.004, decay: 0.03, curve: 5 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.07,
      gain: -8,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1600, q: 0.8 },
        { type: 'lowpass', freq: 4160, q: 0.5 }
      ],
      env: { attack: 0.0006, decay: 0.006, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.07,
      gain: -12,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 700, q: 0.8 },
        { type: 'lowpass', freq: 1820, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.012, curve: 6 }
    }
  ]
};

export default shutter;
