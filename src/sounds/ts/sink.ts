import type { Recipe } from './react-bits-sound';

const sink: Recipe = {
  duration: 1.4,
  seed: 303,
  loudness: -15,
  lowpass: 1500,
  highpass: 22,
  reverb: { mix: 0.15, decay: 1.2, predelay: 0.01, damp: 2000 },
  layers: [
    {
      type: 'tone',
      wave: 'triangle',
      freq: { from: 73.42, to: 36.71, time: 1.1, curve: 2 },
      filter: { type: 'lowpass', freq: 400, q: 0.6 },
      env: { attack: 0.01, decay: 1.3, curve: 3 }
    },
    {
      type: 'tone',
      freq: { from: 36.71, to: 18.35, time: 1.1, curve: 3 },
      at: 0,
      gain: -4,
      env: { attack: 0.01, decay: 1.3, curve: 3 }
    }
  ]
};

export default sink;
