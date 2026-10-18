import type { Recipe } from './react-bits-sound';

const dread: Recipe = {
  duration: 5,
  seed: 366,
  loudness: -17,
  lowpass: 2500,
  highpass: 30,
  width: 0.9,
  reverb: { mix: 0.35, decay: 2.8, predelay: 0.01, damp: 2000, lowcut: 150 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      filter: {
        type: 'lowpass',
        freq: {
          points: [
            [0, 200],
            [2.5, 1500],
            [5, 200]
          ]
        },
        q: 0.8
      },
      env: { attack: 2.5, rise: 1.5, decay: 2.3, curve: 3 }
    },
    {
      type: 'tone',
      wave: 'sawtooth',
      voices: 3,
      detune: 10,
      freq: 73.42,
      gain: -6,
      filter: { type: 'lowpass', freq: 350, q: 0.7 },
      env: { attack: 2.5, rise: 1.5, decay: 2.3, curve: 3 }
    },
    {
      type: 'tone',
      freq: { from: 36.71, to: 36.71, time: 2.7, curve: 3 },
      at: 0,
      gain: -6,
      env: { attack: 2.5, decay: 4.5, curve: 3 }
    }
  ]
};

export default dread;
