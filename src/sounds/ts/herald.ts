import type { Recipe } from './react-bits-sound';

const herald: Recipe = {
  duration: 1.7,
  seed: 351,
  loudness: -16,
  lowpass: 5000,
  highpass: 60,
  width: 0.7,
  reverb: { mix: 0.25, decay: 1.4, predelay: 0.01, damp: 4500 },
  layers: [
    {
      type: 'tone',
      wave: 'sawtooth',
      voices: 3,
      detune: 8,
      freq: 587.33,
      at: 0,
      gain: 0,
      filter: {
        type: 'lowpass',
        freq: {
          points: [
            [0, 500],
            [0.05, 2400],
            [0.17, 900]
          ]
        },
        q: 0.7
      },
      env: { attack: 0.025, hold: 0.08, decay: 0.08, curve: 4 }
    },
    {
      type: 'tone',
      wave: 'sawtooth',
      voices: 3,
      detune: 8,
      freq: 880,
      at: 0.18,
      gain: 0,
      filter: {
        type: 'lowpass',
        freq: {
          points: [
            [0, 500],
            [0.05, 2400],
            [0.17, 900]
          ]
        },
        q: 0.7
      },
      env: { attack: 0.025, hold: 0.08, decay: 0.08, curve: 4 }
    },
    {
      type: 'tone',
      wave: 'sawtooth',
      voices: 3,
      detune: 8,
      freq: 1174.66,
      at: 0.38,
      gain: 0,
      filter: {
        type: 'lowpass',
        freq: {
          points: [
            [0, 500],
            [0.05, 2400],
            [0.9, 900]
          ]
        },
        q: 0.7
      },
      env: { attack: 0.025, hold: 0.5, decay: 0.7, curve: 4 }
    },
    {
      type: 'tone',
      wave: 'sawtooth',
      voices: 3,
      detune: 8,
      freq: 739.99,
      at: 0.38,
      gain: -4,
      filter: {
        type: 'lowpass',
        freq: {
          points: [
            [0, 500],
            [0.05, 2400],
            [0.9, 900]
          ]
        },
        q: 0.7
      },
      env: { attack: 0.025, hold: 0.5, decay: 0.7, curve: 4 }
    },
    {
      type: 'tone',
      wave: 'sawtooth',
      voices: 3,
      detune: 8,
      freq: 440,
      at: 0.38,
      gain: -6,
      filter: {
        type: 'lowpass',
        freq: {
          points: [
            [0, 500],
            [0.05, 2400],
            [0.9, 900]
          ]
        },
        q: 0.7
      },
      env: { attack: 0.025, hold: 0.5, decay: 0.7, curve: 4 }
    },
    {
      type: 'tone',
      freq: { from: 73.42, to: 73.42, time: 0.48, curve: 3 },
      at: 0.38,
      gain: -8,
      env: { attack: 0.02, decay: 0.8, curve: 5 }
    }
  ]
};

export default herald;
