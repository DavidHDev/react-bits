import type { Recipe } from './react-bits-sound';

const snap: Recipe = {
  duration: 0.1,
  seed: 213,
  loudness: -20.5,
  lowpass: 7500,
  reverb: { mix: 0.05, decay: 0.18, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 500, to: 1400, time: 0.025, curve: 0.6 },
      gain: -18,
      env: { attack: 0.02, rise: 2, decay: 0.006, curve: 5 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.024,
      gain: -9,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1900, q: 1.2 },
        { type: 'lowpass', freq: 4940, q: 0.5 }
      ],
      env: { attack: 0.0006, decay: 0.004, curve: 6 }
    },
    {
      type: 'tone',
      freq: { from: 1500, to: 1200, time: 0.006, curve: 3 },
      at: 0.024,
      gain: -12,
      env: { attack: 0.001, decay: 0.02, curve: 6 }
    },
    {
      type: 'tone',
      freq: 659.26,
      at: 0.024,
      gain: -10,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.04, curve: 6 }
    }
  ]
};

export default snap;
