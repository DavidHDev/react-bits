import type { Recipe } from './react-bits-sound';

const stroke: Recipe = {
  duration: 0.36,
  seed: 146,
  loudness: -19,
  lowpass: 6000,
  highpass: 500,
  reverb: { mix: 0.06, decay: 0.3, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      tremolo: { rate: 45, depth: 0.35 },
      pan: { from: -0.3, to: 0.3, time: 0.3 },
      filter: { type: 'bandpass', freq: { from: 1100, to: 1500, time: 0.3 }, q: 0.9 },
      env: { attack: 0.03, hold: 0.18, decay: 0.12, curve: 4 }
    },
    {
      type: 'noise',
      color: 'crackle',
      gain: 1,
      filter: { type: 'bandpass', freq: 1800, q: 0.7 },
      env: { attack: 0.03, hold: 0.18, decay: 0.12, curve: 4 }
    }
  ]
};

export default stroke;
