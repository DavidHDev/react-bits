import type { Recipe } from './react-bits-sound';

const tickertape: Recipe = {
  duration: 0.7,
  seed: 333,
  loudness: -19,
  lowpass: 7000,
  reverb: { mix: 0.06, decay: 0.2, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 1165.3576,
      at: 0,
      gain: -1.1971,
      pan: -0.1884,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.015, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1177.7768,
      at: 0.045,
      gain: -0.4681,
      pan: -0.0044,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.015, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1171.338,
      at: 0.09,
      gain: -1.3614,
      pan: -0.2283,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.015, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1166.7032,
      at: 0.135,
      gain: -1.2823,
      pan: -0.0808,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.015, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1181.3638,
      at: 0.18,
      gain: -0.8802,
      pan: 0.0712,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.015, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1176.4993,
      at: 0.225,
      gain: -0.3297,
      pan: -0.1426,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.015, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1180.634,
      at: 0.27,
      gain: -0.6651,
      pan: -0.0689,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.015, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1184.2899,
      at: 0.315,
      gain: -1.0264,
      pan: 0.0602,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.015, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1168.1292,
      at: 0.36,
      gain: -0.3922,
      pan: -0.0385,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.015, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1180.0111,
      at: 0.405,
      gain: -0.7982,
      pan: 0.085,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.015, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1173.2525,
      at: 0.45,
      gain: -1.8261,
      pan: -0.1982,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.015, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1175.8161,
      at: 0.495,
      gain: -0.9979,
      pan: -0.107,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.015, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1179.2274,
      at: 0.54,
      gain: -1.4499,
      pan: -0.0503,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.015, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1173.3448,
      at: 0.585,
      gain: -0.3942,
      pan: 0.1112,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.015, curve: 6 }
    }
  ]
};

export default tickertape;
