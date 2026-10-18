import type { Recipe } from './react-bits-sound';

const roll: Recipe = {
  duration: 0.18,
  seed: 241,
  loudness: -20,
  lowpass: 5000,
  reverb: { mix: 0.06, decay: 0.22, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      wave: 'sawtooth',
      freq: { from: 220, to: 440, time: 0.08, curve: 2 },
      filter: { type: 'lowpass', freq: 1400, q: 0.7 },
      env: { attack: 0.03, rise: 1.5, decay: 0.08, curve: 4 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -16,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1200, q: 0.8 },
        { type: 'lowpass', freq: 3120, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.006, curve: 6 }
    }
  ]
};

export default roll;
