import type { Recipe } from './react-bits-sound';

const boop: Recipe = {
  duration: 0.12,
  seed: 17,
  loudness: -19,
  lowpass: 6000,
  reverb: { mix: 0.06, decay: 0.22, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: {
        points: [
          [0, 420],
          [0.018, 640],
          [0.07, 520]
        ]
      },
      env: { attack: 0.003, decay: 0.08, curve: 5 }
    },
    {
      type: 'tone',
      freq: {
        points: [
          [0, 840],
          [0.018, 1280],
          [0.07, 1040]
        ]
      },
      gain: -18,
      env: { attack: 0.003, decay: 0.04, curve: 5 }
    }
  ]
};

export default boop;
