import type { Recipe } from './react-bits-sound';

const verdict: Recipe = {
  duration: 2.8,
  seed: 353,
  loudness: -15,
  lowpass: 3500,
  highpass: 30,
  width: 0.8,
  drive: 0.1,
  reverb: { mix: 0.35, decay: 2.8, predelay: 0.02, damp: 3000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 70, to: 35, time: 0.6, curve: 3 },
      at: 0,
      gain: 0,
      env: { attack: 0.004, decay: 1.6, curve: 5 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -8,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 700, q: 0.6 },
        { type: 'lowpass', freq: 1820, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.03, curve: 6 }
    },
    {
      type: 'tone',
      wave: 'sawtooth',
      voices: 3,
      detune: 10,
      freq: 146.83,
      at: 0,
      gain: -4,
      filter: { type: 'lowpass', freq: 1200, q: 0.6 },
      env: { attack: 0.02, rise: 1, decay: 2.4, curve: 4 }
    },
    {
      type: 'tone',
      wave: 'sawtooth',
      voices: 3,
      detune: 10,
      freq: 174.61,
      at: 0,
      gain: -5.5,
      filter: { type: 'lowpass', freq: 1200, q: 0.6 },
      env: { attack: 0.02, rise: 1, decay: 2.4, curve: 4 }
    },
    {
      type: 'tone',
      wave: 'sawtooth',
      voices: 3,
      detune: 10,
      freq: 220,
      at: 0,
      gain: -7,
      filter: { type: 'lowpass', freq: 1200, q: 0.6 },
      env: { attack: 0.02, rise: 1, decay: 2.4, curve: 4 }
    },
    {
      type: 'tone',
      wave: 'sawtooth',
      voices: 3,
      detune: 10,
      freq: 293.66,
      at: 0,
      gain: -8.5,
      filter: { type: 'lowpass', freq: 1200, q: 0.6 },
      env: { attack: 0.02, rise: 1, decay: 2.4, curve: 4 }
    }
  ]
};

export default verdict;
