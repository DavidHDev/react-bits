import type { Recipe } from './react-bits-sound';

const stamp: Recipe = {
  duration: 0.45,
  seed: 337,
  loudness: -15,
  lowpass: 5000,
  highpass: 40,
  drive: 0.15,
  reverb: { mix: 0.08, decay: 0.35, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 150, to: 90, time: 0.05, curve: 3 },
      at: 0,
      gain: 0,
      env: { attack: 0.004, decay: 0.15, curve: 5 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -4,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 500, q: 0.6 },
        { type: 'lowpass', freq: 1300, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.04, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      gain: -8,
      filter: { type: 'lowpass', freq: 2000, q: 0.6 },
      env: { attack: 0.001, decay: 0.03, curve: 5 }
    }
  ]
};

export default stamp;
