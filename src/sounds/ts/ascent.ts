import type { Recipe } from './react-bits-sound';

const ascent: Recipe = {
  duration: 4.1,
  seed: 101,
  loudness: -15,
  lowpass: 9000,
  highpass: 30,
  width: 0.7,
  reverb: { mix: 0.25, decay: 2.2, predelay: 0.02, damp: 4000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      filter: { type: 'lowpass', freq: { from: 300, to: 5200, time: 3.9, curve: 0.7 }, q: 0.6 },
      env: { attack: 3.8, rise: 2.2, decay: 0.25, curve: 3 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      voices: 3,
      detune: 7,
      freq: { from: 220, to: 329.63, time: 3.9, curve: 0.7 },
      gain: -9,
      filter: { type: 'lowpass', freq: { from: 500, to: 2600, time: 3.9 }, q: 0.6 },
      env: { attack: 3.7, rise: 2, decay: 0.3, curve: 3 }
    },
    {
      type: 'tone',
      freq: { from: 440, to: 659.26, time: 3.9, curve: 0.7 },
      gain: -18,
      env: { attack: 3.6, rise: 2, decay: 0.25, curve: 3 }
    },
    {
      type: 'tone',
      freq: { from: 52, to: 78, time: 3.9 },
      gain: -15,
      env: { attack: 3.5, rise: 2, decay: 0.3, curve: 3 }
    }
  ]
};

export default ascent;
