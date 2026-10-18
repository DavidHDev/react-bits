import type { Recipe } from './react-bits-sound';

const stardust: Recipe = {
  duration: 1.8,
  seed: 141,
  loudness: -18,
  lowpass: 8000,
  highpass: 400,
  width: 0.7,
  reverb: { mix: 0.35, decay: 1.8, predelay: 0.01, damp: 6500 },
  layers: [
    {
      type: 'tone',
      freq: 1046.5,
      at: 0.0219,
      gain: -14.5874,
      pan: 0.0101,
      partials: [
        [1, 1, 1],
        [2.76, 0.05, 0.35]
      ],
      env: { attack: 0.0174, decay: 0.3864, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1174.66,
      at: 0.0798,
      gain: -11.5649,
      pan: 0.1228,
      partials: [
        [1, 1, 1],
        [2.76, 0.05, 0.35]
      ],
      env: { attack: 0.0178, decay: 0.5263, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1760,
      at: 0.1838,
      gain: -12.0228,
      pan: 0.3517,
      partials: [
        [1, 1, 1],
        [2.76, 0.05, 0.35]
      ],
      env: { attack: 0.0189, decay: 0.3602, curve: 6 }
    },
    {
      type: 'tone',
      freq: 880,
      at: 0.2851,
      gain: -11.6225,
      pan: -0.3872,
      partials: [
        [1, 1, 1],
        [2.76, 0.05, 0.35]
      ],
      env: { attack: 0.013, decay: 0.3631, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1046.5,
      at: 0.3713,
      gain: -13.715,
      pan: -0.0991,
      partials: [
        [1, 1, 1],
        [2.76, 0.05, 0.35]
      ],
      env: { attack: 0.0165, decay: 0.4476, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1174.66,
      at: 0.5157,
      gain: -12.2489,
      pan: 0.4961,
      partials: [
        [1, 1, 1],
        [2.76, 0.05, 0.35]
      ],
      env: { attack: 0.0126, decay: 0.498, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1046.5,
      at: 0.6233,
      gain: -17.0964,
      pan: -0.6669,
      partials: [
        [1, 1, 1],
        [2.76, 0.05, 0.35]
      ],
      env: { attack: 0.02, decay: 0.3303, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 0.7365,
      gain: -17.1522,
      pan: -0.0364,
      partials: [
        [1, 1, 1],
        [2.76, 0.05, 0.35]
      ],
      env: { attack: 0.0177, decay: 0.4837, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1046.5,
      at: 0.8794,
      gain: -18.5495,
      pan: 0.6905,
      partials: [
        [1, 1, 1],
        [2.76, 0.05, 0.35]
      ],
      env: { attack: 0.0127, decay: 0.41, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1046.5,
      at: 1,
      gain: -19.0983,
      pan: 0.2567,
      partials: [
        [1, 1, 1],
        [2.76, 0.05, 0.35]
      ],
      env: { attack: 0.0171, decay: 0.3607, curve: 6 }
    }
  ]
};

export default stardust;
