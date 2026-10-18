import type { Recipe } from './react-bits-sound';

const focus: Recipe = {
  duration: 0.32,
  seed: 148,
  loudness: -19,
  lowpass: 8000,
  reverb: { mix: 0.06, decay: 0.25, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -10,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 3000, q: 1.5 },
        { type: 'lowpass', freq: 7800, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.003, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.06,
      gain: -12,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 3000, q: 1.5 },
        { type: 'lowpass', freq: 7800, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.003, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1760,
      at: 0.12,
      env: { attack: 0.003, hold: 0.03, decay: 0.04, curve: 5 }
    },
    {
      type: 'tone',
      freq: 1760,
      at: 0.2,
      env: { attack: 0.003, hold: 0.03, decay: 0.06, curve: 5 }
    }
  ]
};

export default focus;
