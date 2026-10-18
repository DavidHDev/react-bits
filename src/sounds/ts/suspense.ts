import type { Recipe } from './react-bits-sound';

const suspense: Recipe = {
  duration: 5,
  seed: 365,
  loudness: -18,
  lowpass: 6000,
  highpass: 40,
  width: 0.9,
  reverb: { mix: 0.35, decay: 2.6, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 1318.51,
      voices: 2,
      detune: 6,
      tremolo: { rate: 7, depth: 0.5 },
      gain: 0,
      pan: -0.3,
      env: { attack: 2, hold: 2, decay: 1, curve: 3 }
    },
    {
      type: 'tone',
      freq: 1396.91,
      voices: 2,
      detune: 6,
      tremolo: { rate: 7.6, depth: 0.5 },
      gain: -2,
      pan: 0.3,
      env: { attack: 2, hold: 2, decay: 1, curve: 3 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 73.42,
      gain: -12,
      filter: { type: 'lowpass', freq: 300, q: 0.6 },
      env: { attack: 2, hold: 2, decay: 1, curve: 3 }
    }
  ]
};

export default suspense;
