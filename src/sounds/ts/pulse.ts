import type { Recipe } from './react-bits-sound';

const pulse: Recipe = {
  duration: 1.2,
  seed: 222,
  loudness: -21,
  lowpass: 4000,
  reverb: { mix: 0.15, decay: 0.6, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      wave: 'triangle',
      freq: 293.66,
      voices: 2,
      detune: 6,
      filter: { type: 'lowpass', freq: 1200, q: 0.6 },
      env: { attack: 0.45, rise: 1.5, decay: 0.6, curve: 3 }
    },
    {
      type: 'tone',
      freq: 440,
      gain: -8,
      env: { attack: 0.45, rise: 1.5, decay: 0.55, curve: 3 }
    }
  ]
};

export default pulse;
