import type { Recipe } from './react-bits-sound';

const banner: Recipe = {
  duration: 0.7,
  seed: 336,
  loudness: -18,
  lowpass: 7000,
  highpass: 120,
  reverb: { mix: 0.12, decay: 0.5, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: 0,
      pan: { from: -0.6, to: 0.2, time: 0.3 },
      filter: {
        type: 'bandpass',
        freq: {
          points: [
            [0, 500],
            [0.18, 1500],
            [0.3, 900]
          ]
        },
        q: 0.8
      },
      env: { attack: 0.18, rise: 1.5, decay: 0.12, curve: 4 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.3,
      gain: -10,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1500, q: 0.8 },
        { type: 'lowpass', freq: 3900, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.006, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1174.66,
      at: 0.3,
      gain: -8,
      partials: [
        [1, 1, 1],
        [2, 0.048, 0.55],
        [3, 0.012, 0.35]
      ],
      env: { attack: 0.004, decay: 0.3, curve: 6 }
    }
  ]
};

export default banner;
