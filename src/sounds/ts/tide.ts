import type { Recipe } from './react-bits-sound';

const tide: Recipe = {
  duration: 8.2,
  seed: 104,
  loudness: -15,
  lowpass: 9000,
  highpass: 28,
  width: 0.8,
  reverb: { mix: 0.3, decay: 3, predelay: 0.025, damp: 4000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      filter: { type: 'lowpass', freq: { from: 200, to: 6000, time: 8, curve: 0.6 }, q: 0.6 },
      env: { attack: 7.8, rise: 2.4, decay: 0.3, curve: 3 }
    },
    {
      type: 'tone',
      wave: 'sawtooth',
      voices: 4,
      detune: 10,
      freq: { from: 73.42, to: 110, time: 8, curve: 0.8 },
      gain: -8,
      filter: { type: 'lowpass', freq: { from: 250, to: 1500, time: 8 }, q: 0.7 },
      env: { attack: 7.6, rise: 2.2, decay: 0.35, curve: 3 }
    },
    {
      type: 'tone',
      freq: { from: 36.71, to: 55, time: 8, curve: 0.8 },
      gain: -10,
      env: { attack: 7.5, rise: 2, decay: 0.35, curve: 3 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      voices: 2,
      detune: 6,
      freq: { from: 293.66, to: 440, time: 8, curve: 0.8 },
      gain: -16,
      filter: { type: 'lowpass', freq: 2500, q: 0.6 },
      env: { attack: 7.6, rise: 2.2, decay: 0.3, curve: 3 }
    }
  ]
};

export default tide;
