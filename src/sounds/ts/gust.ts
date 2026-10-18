import type { Recipe } from './react-bits-sound';

const gust: Recipe = {
  duration: 1.3,
  seed: 121,
  loudness: -16,
  lowpass: 7000,
  highpass: 60,
  reverb: { mix: 0.14, decay: 1, predelay: 0.01, damp: 4500 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      pan: { from: -0.75, to: 0.75, time: 1.15 },
      filter: {
        type: 'bandpass',
        freq: {
          points: [
            [0, 360],
            [0.6, 1300],
            [1.2, 450]
          ]
        },
        q: 0.8
      },
      env: { attack: 0.55, rise: 1.6, decay: 0.65, curve: 4 }
    },
    {
      type: 'noise',
      color: 'brown',
      gain: -10,
      pan: { from: -0.4, to: 0.4, time: 1.15 },
      filter: { type: 'lowpass', freq: 320, q: 0.6 },
      env: { attack: 0.55, rise: 1.6, decay: 0.6, curve: 4 }
    }
  ]
};

export default gust;
