import type { Recipe } from './react-bits-sound';

const seal: Recipe = {
  duration: 0.14,
  seed: 83,
  loudness: -19,
  lowpass: 6500,
  reverb: { mix: 0.06, decay: 0.25, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -8,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1000, q: 0.8 },
        { type: 'lowpass', freq: 2600, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.01, curve: 6 }
    },
    {
      type: 'tone',
      freq: { from: 300, to: 220, time: 0.02, curve: 3 },
      at: 0,
      gain: -4,
      env: { attack: 0.0015, decay: 0.05, curve: 6 }
    },
    {
      type: 'tone',
      freq: 783.99,
      at: 0.014,
      gain: -16,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.03, curve: 6 }
    }
  ]
};

export default seal;
