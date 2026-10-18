import type { Recipe } from './react-bits-sound';

const braam: Recipe = {
  duration: 3,
  seed: 119,
  loudness: -14,
  lowpass: 3500,
  highpass: 28,
  drive: 0.25,
  width: 0.8,
  reverb: { mix: 0.3, decay: 3, predelay: 0.02, damp: 2500, lowcut: 150 },
  layers: [
    {
      type: 'tone',
      wave: 'sawtooth',
      voices: 6,
      detune: 14,
      freq: 73.42,
      gain: 0,
      filter: {
        type: 'lowpass',
        freq: {
          points: [
            [0, 300],
            [0.25, 1500],
            [2.4, 380]
          ]
        },
        q: 1
      },
      env: { attack: 0.05, hold: 0.4, decay: 2.2, curve: 3 }
    },
    {
      type: 'tone',
      wave: 'sawtooth',
      voices: 4,
      detune: 12,
      freq: 146.83,
      gain: -6,
      filter: {
        type: 'lowpass',
        freq: {
          points: [
            [0, 300],
            [0.25, 1500],
            [2.4, 380]
          ]
        },
        q: 1
      },
      env: { attack: 0.05, hold: 0.4, decay: 2.2, curve: 3 }
    },
    {
      type: 'tone',
      wave: 'sawtooth',
      voices: 3,
      detune: 10,
      freq: 220,
      gain: -10,
      filter: {
        type: 'lowpass',
        freq: {
          points: [
            [0, 300],
            [0.25, 1500],
            [2.4, 380]
          ]
        },
        q: 1
      },
      env: { attack: 0.05, hold: 0.4, decay: 2.2, curve: 3 }
    },
    {
      type: 'tone',
      freq: { from: 36.71, to: 36.71, time: 1.44, curve: 3 },
      at: 0,
      gain: -4,
      env: { attack: 0.03, decay: 2.4, curve: 5 }
    },
    {
      type: 'noise',
      color: 'pink',
      gain: -14,
      filter: { type: 'lowpass', freq: { from: 2000, to: 300, time: 0.3 }, q: 0.6 },
      env: { attack: 0.01, decay: 0.3, curve: 5 }
    }
  ]
};

export default braam;
