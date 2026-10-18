import type { Recipe } from './react-bits-sound';

const sprout: Recipe = {
  duration: 0.3,
  seed: 345,
  loudness: -18,
  lowpass: 6000,
  reverb: { mix: 0.1, decay: 0.35, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 400, to: 840, time: 0.054, curve: 1.6 },
      at: 0,
      gain: 0,
      env: { attack: 0.002, decay: 0.06, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 600, to: 900, time: 0.05, curve: 2 },
      at: 0.04,
      vibrato: { rate: 18, depth: 50 },
      gain: -6,
      env: { attack: 0.005, decay: 0.18, curve: 4 }
    }
  ]
};

export default sprout;
