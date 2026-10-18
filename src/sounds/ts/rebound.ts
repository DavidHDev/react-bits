import type { Recipe } from './react-bits-sound';

const rebound: Recipe = {
  duration: 0.22,
  seed: 216,
  loudness: -20,
  lowpass: 5000,
  reverb: { mix: 0.08, decay: 0.25, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: {
        points: [
          [0, 520],
          [0.05, 360],
          [0.12, 430]
        ]
      },
      vibrato: { rate: 16, depth: 40 },
      env: { attack: 0.004, decay: 0.16, curve: 4 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -18,
      filter: { type: 'bandpass', freq: { from: 1500, to: 700, time: 0.08, curve: 2 }, q: 0.9 },
      env: { attack: 0.01, rise: 1.5, decay: 0.07, curve: 4 }
    }
  ]
};

export default rebound;
