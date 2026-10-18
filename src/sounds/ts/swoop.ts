import type { Recipe } from './react-bits-sound';

const swoop: Recipe = {
  duration: 0.75,
  seed: 124,
  loudness: -16,
  lowpass: 6000,
  highpass: 60,
  reverb: { mix: 0.12, decay: 0.7, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: 0,
      pan: { from: -0.7, to: 0.7, time: 0.65 },
      filter: {
        type: 'bandpass',
        freq: {
          points: [
            [0, 300],
            [0.3, 1500],
            [0.68, 400]
          ]
        },
        q: 0.8
      },
      env: { attack: 0.3, rise: 1.5, decay: 0.38, curve: 4 }
    },
    {
      type: 'tone',
      freq: {
        points: [
          [0, 180],
          [0.3, 560],
          [0.68, 220]
        ]
      },
      gain: -10,
      pan: { from: -0.5, to: 0.5, time: 0.65 },
      env: { attack: 0.28, rise: 1.6, decay: 0.38, curve: 4 }
    },
    {
      type: 'noise',
      color: 'brown',
      gain: -8,
      filter: { type: 'lowpass', freq: 300, q: 0.6 },
      env: { attack: 0.3, rise: 1.6, decay: 0.35, curve: 4 }
    }
  ]
};

export default swoop;
