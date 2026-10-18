const lift = {
  duration: 1.35,
  seed: 102,
  loudness: -16,
  lowpass: 7000,
  highpass: 40,
  width: 0.7,
  reverb: { mix: 0.22, decay: 1.3, predelay: 0.01, damp: 4500 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      filter: { type: 'lowpass', freq: { from: 500, to: 4500, time: 1.15, curve: 0.8 }, q: 0.6 },
      env: { attack: 1.1, rise: 2, decay: 0.18, curve: 3 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      voices: 2,
      detune: 6,
      freq: { from: 329.63, to: 493.88, time: 1.1, curve: 0.7 },
      gain: -13,
      filter: { type: 'lowpass', freq: 2400, q: 0.6 },
      env: { attack: 1, rise: 1.8, decay: 0.2, curve: 3 }
    }
  ]
};

export default lift;
