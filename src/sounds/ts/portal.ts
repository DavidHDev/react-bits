import type { Recipe } from './react-bits-sound';

const portal: Recipe = {
  duration: 1.9,
  seed: 139,
  loudness: -17,
  lowpass: 3500,
  highpass: 60,
  width: 0.8,
  reverb: { mix: 0.4, decay: 2.2, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: {
        points: [
          [0, 200],
          [0.9, 700],
          [1.8, 300]
        ]
      },
      fm: {
        ratio: 1.5,
        index: {
          points: [
            [0, 0.5],
            [0.9, 1.5],
            [1.8, 0.5]
          ]
        }
      },
      vibrato: { rate: 6, depth: 40 },
      gain: -6,
      filter: { type: 'lowpass', freq: 3000, q: 0.6 },
      env: { attack: 0.8, rise: 1.6, decay: 1, curve: 3 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: 0,
      filter: {
        type: 'bandpass',
        freq: {
          points: [
            [0, 300],
            [0.9, 1500],
            [1.9, 400]
          ]
        },
        q: 1.2
      },
      env: { attack: 0.9, rise: 1.5, decay: 1, curve: 4 },
      tremolo: { rate: 9, depth: 0.5 },
      pan: {
        points: [
          [0, -0.6],
          [0.4, 0.6],
          [0.8, -0.6],
          [1.2, 0.6],
          [1.6, -0.6]
        ]
      }
    }
  ]
};

export default portal;
