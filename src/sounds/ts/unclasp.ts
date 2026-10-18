import type { Recipe } from './react-bits-sound';

const unclasp: Recipe = {
  duration: 0.12,
  seed: 32,
  loudness: -19,
  lowpass: 7000,
  reverb: { mix: 0.06, decay: 0.22, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 680, to: 600, time: 0.012, curve: 3 },
      at: 0,
      gain: 0,
      env: { attack: 0.0015, decay: 0.026, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -18,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1400, q: 0.8 },
        { type: 'lowpass', freq: 3640, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.006, curve: 6 }
    },
    {
      type: 'tone',
      freq: { from: 470, to: 390, time: 0.014, curve: 3 },
      at: 0.045,
      gain: 0,
      env: { attack: 0.0015, decay: 0.035, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.045,
      gain: -17,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1000, q: 0.8 },
        { type: 'lowpass', freq: 2600, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.006, curve: 6 }
    }
  ]
};

export default unclasp;
