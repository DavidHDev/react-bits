import type { Recipe } from './react-bits-sound';

const uplift: Recipe = {
  duration: 3,
  seed: 354,
  loudness: -16,
  lowpass: 8000,
  highpass: 50,
  width: 0.8,
  reverb: { mix: 0.3, decay: 2.2, predelay: 0.01, damp: 6000 },
  layers: [
    {
      type: 'tone',
      wave: 'triangle',
      voices: 3,
      detune: 8,
      freq: 293.66,
      at: 0,
      gain: -4,
      filter: { type: 'lowpass', freq: 3500, q: 0.6 },
      env: { attack: 1.2, rise: 1.6, hold: 0.6, decay: 1.2, curve: 3 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      voices: 3,
      detune: 8,
      freq: 369.99,
      at: 0,
      gain: -5.5,
      filter: { type: 'lowpass', freq: 3500, q: 0.6 },
      env: { attack: 1.2, rise: 1.6, hold: 0.6, decay: 1.2, curve: 3 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      voices: 3,
      detune: 8,
      freq: 440,
      at: 0,
      gain: -7,
      filter: { type: 'lowpass', freq: 3500, q: 0.6 },
      env: { attack: 1.2, rise: 1.6, hold: 0.6, decay: 1.2, curve: 3 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      voices: 3,
      detune: 8,
      freq: 659.26,
      at: 0,
      gain: -8.5,
      filter: { type: 'lowpass', freq: 3500, q: 0.6 },
      env: { attack: 1.2, rise: 1.6, hold: 0.6, decay: 1.2, curve: 3 }
    },
    {
      type: 'tone',
      freq: 1760,
      at: 1.0101,
      gain: -19.8948,
      pan: -0.5361,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.4728, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1174.66,
      at: 1.1533,
      gain: -17.9999,
      pan: -0.2496,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.3259, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1760,
      at: 1.2887,
      gain: -14.2381,
      pan: -0.4448,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.5161, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 1.3772,
      gain: -19.8332,
      pan: 0.2133,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.5466, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1760,
      at: 1.4931,
      gain: -16.6482,
      pan: 0.4719,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.396, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 1.6335,
      gain: -17.0178,
      pan: 0.2156,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.4811, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1760,
      at: 1.736,
      gain: -19.2885,
      pan: -0.4111,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.5092, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1479.98,
      at: 1.8574,
      gain: -17.9019,
      pan: 0.345,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.5052, curve: 6 }
    },
    {
      type: 'tone',
      freq: 880,
      at: 1.9767,
      gain: -18.6279,
      pan: -0.6802,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.3411, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 2.114,
      gain: -16.5047,
      pan: 0.2404,
      partials: [
        [1, 1, 1],
        [2.76, 0.036, 0.4],
        [5.4, 0.009, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.5256, curve: 6 }
    }
  ]
};

export default uplift;
