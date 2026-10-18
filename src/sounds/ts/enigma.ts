import type { Recipe } from './react-bits-sound';

const enigma: Recipe = {
  duration: 2.6,
  seed: 355,
  loudness: -16.5,
  lowpass: 6500,
  highpass: 50,
  reverb: { mix: 0.35, decay: 2.4, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 587.33,
      at: 0,
      gain: 0,
      partials: [
        [1, 1, 1],
        [4, 0.09, 0.35],
        [10, 0.012, 0.12]
      ],
      tremolo: { rate: 5.5, depth: 0.28 },
      env: { attack: 0.003, decay: 2, curve: 5 }
    },
    {
      type: 'tone',
      freq: 830.61,
      at: 0.02,
      gain: -2,
      partials: [
        [1, 1, 1],
        [4, 0.09, 0.35],
        [10, 0.012, 0.12]
      ],
      tremolo: { rate: 5.5, depth: 0.28 },
      env: { attack: 0.003, decay: 1.9, curve: 5 }
    },
    {
      type: 'tone',
      freq: 1046.5,
      at: 0.04,
      gain: -4,
      partials: [
        [1, 1, 1],
        [4, 0.09, 0.35],
        [10, 0.012, 0.12]
      ],
      tremolo: { rate: 5.5, depth: 0.28 },
      env: { attack: 0.003, decay: 1.8, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 73.42,
      gain: -10,
      filter: { type: 'lowpass', freq: 400, q: 0.6 },
      env: { attack: 0.3, decay: 2, curve: 3 }
    }
  ]
};

export default enigma;
