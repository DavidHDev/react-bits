import type { Recipe } from './react-bits-sound';

const glow: Recipe = {
  duration: 3,
  seed: 103,
  loudness: -16,
  lowpass: 8000,
  highpass: 40,
  width: 0.8,
  reverb: { mix: 0.3, decay: 2.4, predelay: 0.02, damp: 4500 },
  layers: [
    {
      type: 'tone',
      wave: 'triangle',
      voices: 3,
      detune: 8,
      freq: { from: 293.66, to: 311.1328, time: 2.6, curve: 0.8 },
      gain: -6,
      filter: { type: 'lowpass', freq: { from: 400, to: 2600, time: 2.4 }, q: 0.6 },
      env: { attack: 2.2, rise: 1.5, decay: 0.6, curve: 4 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      voices: 3,
      detune: 8,
      freq: { from: 369.99, to: 392.0044, time: 2.6, curve: 0.8 },
      gain: -8,
      filter: { type: 'lowpass', freq: { from: 400, to: 2600, time: 2.4 }, q: 0.6 },
      env: { attack: 2.2, rise: 1.5, decay: 0.6, curve: 4 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      voices: 3,
      detune: 8,
      freq: { from: 440, to: 466.18, time: 2.6, curve: 0.8 },
      gain: -10,
      filter: { type: 'lowpass', freq: { from: 400, to: 2600, time: 2.4 }, q: 0.6 },
      env: { attack: 2.2, rise: 1.5, decay: 0.6, curve: 4 }
    },
    {
      type: 'noise',
      color: 'pink',
      gain: -16,
      filter: { type: 'lowpass', freq: { from: 600, to: 3000, time: 2.4 }, q: 0.5 },
      env: { attack: 2.2, rise: 2, decay: 0.4, curve: 3 }
    }
  ]
};

export default glow;
