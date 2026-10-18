import type { Recipe } from './react-bits-sound';

const pass: Recipe = {
  duration: 0.7,
  seed: 122,
  loudness: -17,
  lowpass: 5500,
  highpass: 80,
  reverb: { mix: 0.1, decay: 0.6, predelay: 0.01, damp: 4500 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      pan: { from: -0.6, to: 0.6, time: 0.6 },
      filter: {
        type: 'bandpass',
        freq: {
          points: [
            [0, 560],
            [0.3, 1450],
            [0.65, 640]
          ]
        },
        q: 0.85
      },
      env: { attack: 0.28, rise: 1.8, decay: 0.34, curve: 4 }
    }
  ]
};

export default pass;
