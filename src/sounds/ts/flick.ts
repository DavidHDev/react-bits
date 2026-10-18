import type { Recipe } from './react-bits-sound';

const flick: Recipe = {
  duration: 0.1,
  seed: 65,
  loudness: -21,
  lowpass: 6000,
  highpass: 300,
  reverb: { mix: 0.05, decay: 0.2, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: 0,
      pan: { from: -0.3, to: 0.5, time: 0.08 },
      filter: { type: 'bandpass', freq: { from: 700, to: 1500, time: 0.075, curve: 2 }, q: 1 },
      env: { attack: 0.025, rise: 1.4, decay: 0.05, curve: 5 }
    }
  ]
};

export default flick;
