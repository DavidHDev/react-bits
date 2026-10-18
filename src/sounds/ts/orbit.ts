import type { Recipe } from './react-bits-sound';

const orbit: Recipe = {
  duration: 0.6,
  seed: 227,
  loudness: -20,
  lowpass: 8000,
  reverb: { mix: 0.18, decay: 0.6, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 880,
      pan: {
        points: [
          [0, -0.6],
          [0.15, 0.6],
          [0.3, -0.6],
          [0.45, 0.6]
        ]
      },
      tremolo: { rate: 6.5, depth: 0.4 },
      env: { attack: 0.08, decay: 0.4, curve: 4 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      gain: -6,
      pan: {
        points: [
          [0, 0.6],
          [0.15, -0.6],
          [0.3, 0.6],
          [0.45, -0.6]
        ]
      },
      tremolo: { rate: 6.5, depth: 0.4 },
      env: { attack: 0.1, decay: 0.38, curve: 4 }
    }
  ]
};

export default orbit;
