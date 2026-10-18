import type { Recipe } from './react-bits-sound';

const whip: Recipe = {
  duration: 0.3,
  seed: 125,
  loudness: -16.5,
  lowpass: 6500,
  highpass: 120,
  reverb: { mix: 0.08, decay: 0.4, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: 0,
      pan: { from: -0.4, to: 0.5, time: 0.24 },
      filter: {
        type: 'bandpass',
        freq: {
          points: [
            [0, 700],
            [0.12, 1800],
            [0.24, 1500]
          ]
        },
        q: 0.9
      },
      env: { attack: 0.12, rise: 2.2, decay: 0.12, curve: 4 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -8,
      filter: {
        type: 'bandpass',
        freq: {
          points: [
            [0, 300],
            [0.12, 900],
            [0.22, 400]
          ]
        },
        q: 0.7
      },
      env: { attack: 0.12, rise: 2.2, decay: 0.1, curve: 4 }
    }
  ]
};

export default whip;
