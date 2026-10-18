import type { Recipe } from './react-bits-sound';

const fold: Recipe = {
  duration: 0.26,
  seed: 67,
  loudness: -20,
  lowpass: 5500,
  highpass: 180,
  reverb: { mix: 0.08, decay: 0.3, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: 0,
      filter: { type: 'bandpass', freq: { from: 1500, to: 650, time: 0.18, curve: 2 }, q: 0.8 },
      env: { attack: 0.02, rise: 1, decay: 0.16, curve: 4 },
      tremolo: { rate: 34, depth: 0.5 }
    },
    {
      type: 'tone',
      freq: { from: 587.33, to: 440, time: 0.14, curve: 2 },
      gain: -12,
      env: { attack: 0.015, decay: 0.15, curve: 4 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.17,
      gain: -20,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 900, q: 0.7 },
        { type: 'lowpass', freq: 2340, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.01, curve: 6 }
    }
  ]
};

export default fold;
