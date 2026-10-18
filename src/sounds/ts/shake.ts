import type { Recipe } from './react-bits-sound';

const shake: Recipe = {
  duration: 0.2,
  seed: 46,
  loudness: -19,
  lowpass: 3000,
  reverb: { mix: 0.06, decay: 0.25, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      wave: 'triangle',
      freq: { from: 260, to: 220, time: 0.02, curve: 3 },
      at: 0,
      gain: 0,
      env: { attack: 0.003, decay: 0.04, curve: 6 },
      filter: { type: 'lowpass', freq: 900, q: 0.6 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: { from: 242, to: 202, time: 0.02, curve: 3 },
      at: 0.055,
      gain: -2,
      env: { attack: 0.003, decay: 0.04, curve: 6 },
      filter: { type: 'lowpass', freq: 900, q: 0.6 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: { from: 224, to: 184, time: 0.02, curve: 3 },
      at: 0.11,
      gain: -4,
      env: { attack: 0.003, decay: 0.04, curve: 6 },
      filter: { type: 'lowpass', freq: 900, q: 0.6 }
    }
  ]
};

export default shake;
