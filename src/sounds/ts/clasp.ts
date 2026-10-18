import type { Recipe } from './react-bits-sound';

const clasp: Recipe = {
  duration: 0.12,
  seed: 31,
  loudness: -19,
  lowpass: 7000,
  reverb: { mix: 0.06, decay: 0.22, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 500, to: 420, time: 0.012, curve: 3 },
      at: 0,
      gain: 0,
      env: { attack: 0.0015, decay: 0.028, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -17,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1100, q: 0.8 },
        { type: 'lowpass', freq: 2860, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.006, curve: 6 }
    },
    {
      type: 'tone',
      freq: { from: 700, to: 610, time: 0.012, curve: 3 },
      at: 0.045,
      gain: 0,
      env: { attack: 0.0015, decay: 0.035, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.045,
      gain: -19,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1450, q: 0.8 },
        { type: 'lowpass', freq: 3770, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.006, curve: 6 }
    }
  ]
};

export default clasp;
