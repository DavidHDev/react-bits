import type { Recipe } from './react-bits-sound';

const confetti: Recipe = {
  duration: 1.1,
  seed: 254,
  loudness: -17.5,
  lowpass: 7000,
  width: 0.8,
  reverb: { mix: 0.25, decay: 0.9, predelay: 0.01, damp: 7000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 900, to: 300, time: 0.015, curve: 3 },
      at: 0,
      gain: -2,
      env: { attack: 0.001, decay: 0.03, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -8,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1200, q: 0.6 },
        { type: 'lowpass', freq: 3120, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.012, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1760,
      at: 0.3618,
      gain: -10.8031,
      pan: 0.7314,
      partials: [
        [1, 1, 1],
        [2.76, 0.024, 0.4],
        [5.4, 0.006, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.1255, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 0.4546,
      gain: -14.9015,
      pan: -0.491,
      partials: [
        [1, 1, 1],
        [2.76, 0.024, 0.4],
        [5.4, 0.006, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.09, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1174.66,
      at: 0.3749,
      gain: -15.6516,
      pan: 0.0775,
      partials: [
        [1, 1, 1],
        [2.76, 0.024, 0.4],
        [5.4, 0.006, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.1615, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 0.5967,
      gain: -9.7022,
      pan: 0.7824,
      partials: [
        [1, 1, 1],
        [2.76, 0.024, 0.4],
        [5.4, 0.006, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.0885, curve: 6 }
    },
    {
      type: 'tone',
      freq: 987.77,
      at: 0.2201,
      gain: -12.6418,
      pan: -0.7262,
      partials: [
        [1, 1, 1],
        [2.76, 0.024, 0.4],
        [5.4, 0.006, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.1199, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1479.98,
      at: 0.5125,
      gain: -15.4933,
      pan: 0.4301,
      partials: [
        [1, 1, 1],
        [2.76, 0.024, 0.4],
        [5.4, 0.006, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.1499, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 0.533,
      gain: -12.5702,
      pan: -0.7265,
      partials: [
        [1, 1, 1],
        [2.76, 0.024, 0.4],
        [5.4, 0.006, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.0703, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1760,
      at: 0.2519,
      gain: -10.0146,
      pan: -0.5129,
      partials: [
        [1, 1, 1],
        [2.76, 0.024, 0.4],
        [5.4, 0.006, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.0633, curve: 6 }
    },
    {
      type: 'tone',
      freq: 880,
      at: 0.1756,
      gain: -12.8025,
      pan: -0.2189,
      partials: [
        [1, 1, 1],
        [2.76, 0.024, 0.4],
        [5.4, 0.006, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.1581, curve: 6 }
    }
  ]
};

export default confetti;
