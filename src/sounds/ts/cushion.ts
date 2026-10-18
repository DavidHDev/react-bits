import type { Recipe } from './react-bits-sound';

const cushion: Recipe = {
  duration: 0.6,
  seed: 112,
  loudness: -15,
  lowpass: 2800,
  highpass: 30,
  reverb: { mix: 0.12, decay: 0.8, predelay: 0.01, damp: 2000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 98, to: 56, time: 0.14, curve: 3 },
      env: { attack: 0.003, decay: 0.45, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 210, to: 130, time: 0.08, curve: 3 },
      gain: 2,
      env: { attack: 0.003, decay: 0.14, curve: 5 }
    },
    {
      type: 'noise',
      color: 'pink',
      gain: -6,
      filter: { type: 'lowpass', freq: { from: 900, to: 250, time: 0.08 }, q: 0.6 },
      env: { attack: 0.002, decay: 0.08, curve: 5 }
    }
  ]
};

export default cushion;
