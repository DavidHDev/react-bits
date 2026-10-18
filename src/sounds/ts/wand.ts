import type { Recipe } from './react-bits-sound';

const wand: Recipe = {
  duration: 1.3,
  seed: 145,
  loudness: -17,
  lowpass: 9500,
  highpass: 200,
  width: 0.8,
  reverb: { mix: 0.35, decay: 1.6, predelay: 0.01, damp: 7500 },
  layers: [
    {
      type: 'tone',
      freq: 587.33,
      at: 0,
      gain: -4,
      pan: -0.3,
      partials: [
        [1, 1, 1],
        [2.76, 0.048, 0.4],
        [5.4, 0.012, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.3, curve: 6 }
    },
    {
      type: 'tone',
      freq: 739.99,
      at: 0.05,
      gain: -4.8,
      pan: 0.3,
      partials: [
        [1, 1, 1],
        [2.76, 0.048, 0.4],
        [5.4, 0.012, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.35, curve: 6 }
    },
    {
      type: 'tone',
      freq: 880,
      at: 0.1,
      gain: -5.6,
      pan: -0.3,
      partials: [
        [1, 1, 1],
        [2.76, 0.048, 0.4],
        [5.4, 0.012, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.4, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1174.66,
      at: 0.15,
      gain: -6.4,
      pan: 0.3,
      partials: [
        [1, 1, 1],
        [2.76, 0.048, 0.4],
        [5.4, 0.012, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.45, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1479.98,
      at: 0.2,
      gain: -7.2,
      pan: -0.3,
      partials: [
        [1, 1, 1],
        [2.76, 0.048, 0.4],
        [5.4, 0.012, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.5, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1760,
      at: 0.25,
      gain: -8,
      pan: 0.3,
      partials: [
        [1, 1, 1],
        [2.76, 0.048, 0.4],
        [5.4, 0.012, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.55, curve: 6 }
    },
    {
      type: 'tone',
      freq: 2349.32,
      at: 0.3,
      gain: -8.8,
      pan: -0.3,
      partials: [
        [1, 1, 1],
        [2.76, 0.048, 0.4],
        [5.4, 0.012, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.6, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -18,
      filter: { type: 'bandpass', freq: { from: 2000, to: 7000, time: 0.9, curve: 2 }, q: 0.5 },
      env: { attack: 0.3, rise: 1.5, decay: 0.6, curve: 4 }
    }
  ]
};

export default wand;
