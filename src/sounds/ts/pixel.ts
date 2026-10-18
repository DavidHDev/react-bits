import type { Recipe } from './react-bits-sound';

const pixel: Recipe = {
  duration: 0.4,
  seed: 318,
  loudness: -19,
  lowpass: 6000,
  reverb: { mix: 0.08, decay: 0.3, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      harmonics: [1, 0, 0.33, 0, 0.2],
      freq: 523.25,
      at: 0,
      gain: 0,
      env: { attack: 0.002, hold: 0.03, decay: 0.012, curve: 5 }
    },
    {
      type: 'tone',
      harmonics: [1, 0, 0.33, 0, 0.2],
      freq: 659.26,
      at: 0.045,
      gain: -1,
      env: { attack: 0.002, hold: 0.03, decay: 0.012, curve: 5 }
    },
    {
      type: 'tone',
      harmonics: [1, 0, 0.33, 0, 0.2],
      freq: 783.99,
      at: 0.09,
      gain: -2,
      env: { attack: 0.002, hold: 0.03, decay: 0.012, curve: 5 }
    },
    {
      type: 'tone',
      harmonics: [1, 0, 0.33, 0, 0.2],
      freq: 1046.5,
      at: 0.135,
      gain: -3,
      env: { attack: 0.002, hold: 0.03, decay: 0.18, curve: 5 }
    }
  ]
};

export default pixel;
