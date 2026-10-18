import type { Recipe } from './react-bits-sound';

const circuit: Recipe = {
  duration: 2.2,
  seed: 356,
  loudness: -16,
  lowpass: 7000,
  highpass: 40,
  width: 0.7,
  reverb: { mix: 0.25, decay: 1.8, predelay: 0.01, damp: 5500 },
  layers: [
    {
      type: 'tone',
      freq: 587.33,
      at: 0,
      gain: -2,
      fm: { ratio: 2, index: { from: 1, to: 0, time: 0.15 } },
      env: { attack: 0.002, decay: 0.25, curve: 6 }
    },
    {
      type: 'tone',
      freq: 880,
      at: 0.06,
      gain: -3,
      fm: { ratio: 2, index: { from: 1, to: 0, time: 0.15 } },
      env: { attack: 0.002, decay: 0.25, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1174.66,
      at: 0.12,
      gain: -4,
      fm: { ratio: 2, index: { from: 1, to: 0, time: 0.15 } },
      env: { attack: 0.002, decay: 0.25, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1479.98,
      at: 0.18,
      gain: -5,
      fm: { ratio: 2, index: { from: 1, to: 0, time: 0.15 } },
      env: { attack: 0.002, decay: 0.25, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1760,
      at: 0.24,
      gain: -6,
      fm: { ratio: 2, index: { from: 1, to: 0, time: 0.15 } },
      env: { attack: 0.002, decay: 0.25, curve: 6 }
    },
    {
      type: 'tone',
      freq: { from: 90, to: 45, time: 0.36, curve: 3 },
      at: 0.3,
      gain: 0,
      env: { attack: 0.004, decay: 0.6, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'sine',
      voices: 2,
      detune: 6,
      freq: 293.66,
      at: 0.3,
      gain: -6,
      filter: { type: 'lowpass', freq: 4000, q: 0.6 },
      env: { attack: 0.05, rise: 1, decay: 1.6, curve: 4 }
    },
    {
      type: 'tone',
      wave: 'sine',
      voices: 2,
      detune: 6,
      freq: 440,
      at: 0.3,
      gain: -8,
      filter: { type: 'lowpass', freq: 4000, q: 0.6 },
      env: { attack: 0.05, rise: 1, decay: 1.6, curve: 4 }
    },
    {
      type: 'tone',
      wave: 'sine',
      voices: 2,
      detune: 6,
      freq: 587.33,
      at: 0.3,
      gain: -10,
      filter: { type: 'lowpass', freq: 4000, q: 0.6 },
      env: { attack: 0.05, rise: 1, decay: 1.6, curve: 4 }
    },
    {
      type: 'tone',
      wave: 'sine',
      voices: 2,
      detune: 6,
      freq: 739.99,
      at: 0.3,
      gain: -12,
      filter: { type: 'lowpass', freq: 4000, q: 0.6 },
      env: { attack: 0.05, rise: 1, decay: 1.6, curve: 4 }
    }
  ]
};

export default circuit;
