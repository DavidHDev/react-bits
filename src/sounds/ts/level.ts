import type { Recipe } from './react-bits-sound';

const level: Recipe = {
  duration: 0.06,
  seed: 247,
  loudness: -22,
  lowpass: 8000,
  reverb: { mix: 0.05, decay: 0.15, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 1174.66,
      partials: [
        [1, 1, 1],
        [2.76, 0.06, 0.4]
      ],
      env: { attack: 0.0015, decay: 0.03, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -20,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1800, q: 1.2 },
        { type: 'lowpass', freq: 4680, q: 0.5 }
      ],
      env: { attack: 0.0007, decay: 0.003, curve: 6 }
    }
  ]
};

export default level;
