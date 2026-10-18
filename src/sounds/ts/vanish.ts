import type { Recipe } from './react-bits-sound';

const vanish: Recipe = {
  duration: 0.6,
  seed: 338,
  loudness: -19,
  lowpass: 8000,
  highpass: 300,
  reverb: { mix: 0.2, decay: 0.8, predelay: 0.01, damp: 7000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: 0,
      filter: { type: 'bandpass', freq: { from: 1500, to: 3500, time: 0.53, curve: 2 }, q: 0.7 },
      env: { attack: 0.08, rise: 1.2, decay: 0.45, curve: 4 }
    },
    {
      type: 'tone',
      freq: { from: 880, to: 1318.51, time: 0.4, curve: 2 },
      gain: -10,
      env: { attack: 0.06, decay: 0.45, curve: 4 }
    }
  ]
};

export default vanish;
