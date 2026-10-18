import type { Recipe } from './react-bits-sound';

const unfold: Recipe = {
  duration: 0.28,
  seed: 66,
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
      filter: { type: 'bandpass', freq: { from: 700, to: 1500, time: 0.2, curve: 2 }, q: 0.8 },
      env: { attack: 0.08, rise: 1.5, decay: 0.12, curve: 4 },
      tremolo: { rate: 38, depth: 0.5 }
    },
    {
      type: 'tone',
      freq: { from: 440, to: 587.33, time: 0.16, curve: 2 },
      gain: -12,
      env: { attack: 0.06, rise: 1.4, decay: 0.12, curve: 4 }
    }
  ]
};

export default unfold;
