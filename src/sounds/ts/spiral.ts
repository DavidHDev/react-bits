import type { Recipe } from './react-bits-sound';

const spiral: Recipe = {
  duration: 5.2,
  seed: 105,
  loudness: -16,
  lowpass: 8000,
  highpass: 40,
  width: 0.6,
  reverb: { mix: 0.3, decay: 2.2, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 73.42, to: 146.84, time: 5, curve: 1 },
      gain: -12,
      env: { attack: 4.6, rise: 1.4, decay: 0.3, curve: 3 }
    },
    {
      type: 'tone',
      freq: { from: 146.84, to: 293.68, time: 5, curve: 1 },
      gain: -5,
      env: { attack: 0.5, hold: 4.2, decay: 0.3, curve: 3 }
    },
    {
      type: 'tone',
      freq: { from: 293.68, to: 587.36, time: 5, curve: 1 },
      gain: -2,
      env: { attack: 0.5, hold: 4.2, decay: 0.3, curve: 3 }
    },
    {
      type: 'tone',
      freq: { from: 587.36, to: 1174.72, time: 5, curve: 1 },
      gain: -5,
      env: { attack: 0.5, hold: 4.2, decay: 0.3, curve: 3 }
    },
    {
      type: 'tone',
      freq: { from: 1174.72, to: 2349.44, time: 5, curve: 1 },
      gain: -12,
      env: { attack: 0.5, hold: 0.6, decay: 4.2, curve: 2 }
    },
    {
      type: 'noise',
      color: 'pink',
      gain: -16,
      filter: { type: 'bandpass', freq: { from: 400, to: 3200, time: 5, curve: 1 }, q: 0.7 },
      env: { attack: 4.6, rise: 2, decay: 0.3, curve: 3 }
    }
  ]
};

export default spiral;
