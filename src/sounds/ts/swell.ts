import type { Recipe } from './react-bits-sound';

const swell: Recipe = {
  duration: 2.4,
  seed: 108,
  loudness: -16,
  lowpass: 7000,
  highpass: 200,
  width: 0.7,
  reverse: true,
  reverb: { mix: 0.3, decay: 1.6, predelay: 0.01, damp: 6000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      filter: [
        { type: 'highpass', freq: 1200, q: 0.5 },
        { type: 'lowpass', freq: 6500, q: 0.5 }
      ],
      gain: -4,
      env: { attack: 0.002, decay: 2.2, curve: 4 }
    },
    {
      type: 'tone',
      freq: 420,
      partials: [
        [1, 0.5, 1],
        [2.83, 0.6, 0.9],
        [5.11, 0.4, 0.8],
        [7.3, 0.25, 0.7],
        [11.2, 0.12, 0.6]
      ],
      gain: -16,
      env: { attack: 0.002, decay: 2, curve: 4 }
    },
    {
      type: 'noise',
      color: 'pink',
      gain: -8,
      filter: { type: 'bandpass', freq: 1200, q: 0.6 },
      env: { attack: 0.002, decay: 1.2, curve: 4 }
    }
  ]
};

export default swell;
