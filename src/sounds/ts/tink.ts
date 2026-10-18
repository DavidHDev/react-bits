import type { Recipe } from './react-bits-sound';

const tink: Recipe = {
  duration: 0.08,
  seed: 18,
  loudness: -22,
  lowpass: 8500,
  reverb: { mix: 0.08, decay: 0.25, predelay: 0.01, damp: 7000 },
  layers: [
    {
      type: 'tone',
      freq: 1760,
      partials: [
        [1, 1, 1],
        [2.32, 0.14, 0.45],
        [4.25, 0.04, 0.25]
      ],
      env: { attack: 0.0012, decay: 0.045, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -26,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 3000, q: 1.2 },
        { type: 'lowpass', freq: 7800, q: 0.5 }
      ],
      env: { attack: 0.0006, decay: 0.002, curve: 6 }
    }
  ]
};

export default tink;
