import type { Recipe } from './react-bits-sound';

const rocker: Recipe = {
  duration: 0.1,
  seed: 36,
  loudness: -19.5,
  lowpass: 6000,
  reverb: { mix: 0.05, decay: 0.2, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -9,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 700, q: 0.7 },
        { type: 'lowpass', freq: 1820, q: 0.5 }
      ],
      env: { attack: 0.0015, decay: 0.012, curve: 6 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: { from: 240, to: 190, time: 0.012, curve: 3 },
      at: 0,
      gain: -6,
      env: { attack: 0.002, decay: 0.03, curve: 6 },
      filter: { type: 'lowpass', freq: 1200, q: 0.6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.032,
      gain: -12,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1500, q: 0.9 },
        { type: 'lowpass', freq: 3900, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.006, curve: 6 }
    },
    {
      type: 'tone',
      freq: { from: 820, to: 720, time: 0.01, curve: 3 },
      at: 0.032,
      gain: -14,
      env: { attack: 0.0015, decay: 0.02, curve: 6 }
    }
  ]
};

export default rocker;
