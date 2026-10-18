import type { Recipe } from './react-bits-sound';

const plush: Recipe = {
  duration: 0.15,
  seed: 16,
  loudness: -19,
  lowpass: 3200,
  reverb: { mix: 0.06, decay: 0.25, predelay: 0.01, damp: 3000 },
  layers: [
    {
      type: 'tone',
      wave: 'triangle',
      freq: { from: 290, to: 220, time: 0.03, curve: 3 },
      at: 0,
      gain: 0,
      env: { attack: 0.004, decay: 0.06, curve: 6 },
      filter: { type: 'lowpass', freq: 1100, q: 0.6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -15,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 600, q: 0.6 },
        { type: 'lowpass', freq: 1560, q: 0.5 }
      ],
      env: { attack: 0.003, decay: 0.02, curve: 6 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: { from: 330, to: 400, time: 0.04, curve: 3 },
      at: 0.075,
      gain: -10,
      env: { attack: 0.006, decay: 0.05, curve: 6 },
      filter: { type: 'lowpass', freq: 1400, q: 0.6 }
    }
  ]
};

export default plush;
