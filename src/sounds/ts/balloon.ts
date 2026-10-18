import type { Recipe } from './react-bits-sound';

const balloon: Recipe = {
  duration: 0.3,
  seed: 344,
  loudness: -16,
  lowpass: 3500,
  highpass: 50,
  reverb: { mix: 0.12, decay: 0.45, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      filter: { type: 'lowpass', freq: 2500, q: 0.6 },
      env: { attack: 0.001, decay: 0.04, curve: 6 }
    },
    {
      type: 'tone',
      freq: { from: 140, to: 90, time: 0.03, curve: 3 },
      at: 0,
      gain: 0,
      env: { attack: 0.004, decay: 0.08, curve: 5 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.02,
      gain: -12,
      tremolo: { rate: 30, depth: 0.7 },
      filter: { type: 'bandpass', freq: 600, q: 0.8 },
      env: { attack: 0.005, decay: 0.12, curve: 4 }
    }
  ]
};

export default balloon;
