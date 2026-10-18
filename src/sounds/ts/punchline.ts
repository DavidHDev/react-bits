import type { Recipe } from './react-bits-sound';

const punchline: Recipe = {
  duration: 1,
  seed: 357,
  loudness: -16,
  lowpass: 8000,
  highpass: 50,
  reverb: { mix: 0.15, decay: 0.7, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 180, to: 120, time: 0.06, curve: 3 },
      at: 0,
      gain: 0,
      env: { attack: 0.004, decay: 0.15, curve: 5 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -12,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 900, q: 0.7 },
        { type: 'lowpass', freq: 2340, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.01, curve: 6 }
    },
    {
      type: 'tone',
      freq: { from: 130, to: 90, time: 0.08, curve: 3 },
      at: 0.16,
      gain: 0,
      env: { attack: 0.004, decay: 0.2, curve: 5 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.16,
      gain: -12,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 700, q: 0.7 },
        { type: 'lowpass', freq: 1820, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.01, curve: 6 }
    },
    {
      type: 'noise',
      color: 'white',
      at: 0.34,
      gain: -10,
      filter: [
        { type: 'highpass', freq: 5000, q: 0.5 },
        { type: 'lowpass', freq: 9000, q: 0.5 }
      ],
      env: { attack: 0.002, decay: 0.4, curve: 5 }
    }
  ]
};

export default punchline;
