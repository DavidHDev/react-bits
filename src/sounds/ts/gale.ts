import type { Recipe } from './react-bits-sound';

const gale: Recipe = {
  duration: 1.7,
  seed: 128,
  loudness: -15.5,
  lowpass: 5000,
  highpass: 30,
  width: 1,
  reverb: { mix: 0.18, decay: 1.2, predelay: 0.01, damp: 3500 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: 0,
      pan: { from: -0.5, to: 0.5, time: 1.5 },
      filter: {
        type: 'bandpass',
        freq: {
          points: [
            [0, 220],
            [0.7, 950],
            [1.55, 260]
          ]
        },
        q: 0.6
      },
      env: { attack: 0.7, rise: 1.5, decay: 0.85, curve: 4 }
    },
    {
      type: 'noise',
      color: 'brown',
      gain: -2,
      filter: {
        type: 'lowpass',
        freq: {
          points: [
            [0, 150],
            [0.7, 450],
            [1.55, 160]
          ]
        },
        q: 0.6
      },
      env: { attack: 0.7, rise: 1.5, decay: 0.85, curve: 3 }
    },
    {
      type: 'tone',
      freq: { from: 55, to: 45, time: 0.48, curve: 3 },
      at: 0.6,
      gain: -10,
      env: { attack: 0.15, decay: 0.8, curve: 5 }
    }
  ]
};

export default gale;
