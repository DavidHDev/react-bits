const fall = {
  duration: 2,
  seed: 305,
  loudness: -16.5,
  lowpass: 7000,
  highpass: 40,
  reverb: { mix: 0.25, decay: 1.6, predelay: 0.01, damp: 4500 },
  layers: [
    {
      type: 'tone',
      freq: { from: 1174.66, to: 146.83, time: 1.8, curve: 1.5 },
      env: { attack: 0.03, decay: 1.8, curve: 3 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: { from: 587.33, to: 73.42, time: 1.8, curve: 1.5 },
      gain: -10,
      filter: { type: 'lowpass', freq: 1500, q: 0.6 },
      env: { attack: 0.03, decay: 1.8, curve: 3 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -12,
      filter: { type: 'bandpass', freq: { from: 3000, to: 400, time: 1.65, curve: 2 }, q: 0.7 },
      env: { attack: 0.05, rise: 1, decay: 1.6, curve: 3 }
    }
  ]
};

export default fall;
