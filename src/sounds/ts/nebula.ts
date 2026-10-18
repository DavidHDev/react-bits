import type { Recipe } from './react-bits-sound';

const nebula: Recipe = {
  duration: 9.5,
  seed: 321,
  loudness: -21,
  lowpass: 7000,
  highpass: 60,
  width: 0.9,
  reverb: { mix: 0.4, decay: 3, predelay: 0.03, damp: 5000 },
  layers: [
    {
      type: 'tone',
      wave: 'sine',
      voices: 3,
      detune: 9,
      freq: 293.66,
      at: 0,
      gain: -4,
      filter: { type: 'lowpass', freq: 5000, q: 0.6 },
      env: { attack: 2.5, rise: 1.6, hold: 4.5, decay: 2.5, curve: 3 },
      vibrato: { rate: 0.2, depth: 8 }
    },
    {
      type: 'tone',
      wave: 'sine',
      voices: 3,
      detune: 9,
      freq: 440,
      at: 0,
      gain: -6.5,
      filter: { type: 'lowpass', freq: 5000, q: 0.6 },
      env: { attack: 2.5, rise: 1.6, hold: 4.5, decay: 2.5, curve: 3 },
      vibrato: { rate: 0.27, depth: 8 }
    },
    {
      type: 'tone',
      wave: 'sine',
      voices: 3,
      detune: 9,
      freq: 659.26,
      at: 0,
      gain: -9,
      filter: { type: 'lowpass', freq: 5000, q: 0.6 },
      env: { attack: 2.5, rise: 1.6, hold: 4.5, decay: 2.5, curve: 3 },
      vibrato: { rate: 0.34, depth: 8 }
    },
    {
      type: 'tone',
      wave: 'sine',
      voices: 3,
      detune: 9,
      freq: 739.99,
      at: 0,
      gain: -11.5,
      filter: { type: 'lowpass', freq: 5000, q: 0.6 },
      env: { attack: 2.5, rise: 1.6, hold: 4.5, decay: 2.5, curve: 3 },
      vibrato: { rate: 0.41, depth: 8 }
    },
    {
      type: 'noise',
      color: 'pink',
      gain: -14,
      filter: {
        type: 'bandpass',
        freq: {
          points: [
            [0, 2000],
            [3, 3500],
            [6, 2200],
            [9.5, 3200]
          ]
        },
        q: 1.2
      },
      env: { attack: 2.5, hold: 4.5, decay: 2.5, curve: 3 }
    }
  ]
};

export default nebula;
