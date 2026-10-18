import type { Recipe } from './react-bits-sound';

const fill: Recipe = {
  duration: 0.14,
  seed: 76,
  loudness: -21,
  lowpass: 8000,
  reverb: { mix: 0.08, decay: 0.25, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 880, to: 1174.66, time: 0.03, curve: 2 },
      partials: [
        [1, 1, 1],
        [2.76, 0.08, 0.4]
      ],
      env: { attack: 0.002, decay: 0.09, curve: 5 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -24,
      filter: { type: 'bandpass', freq: { from: 1500, to: 3200, time: 0.04, curve: 2 }, q: 1 },
      env: { attack: 0.01, rise: 1.5, decay: 0.03, curve: 5 }
    }
  ]
};

export default fill;
