const shuffle = {
  duration: 0.2,
  seed: 214,
  loudness: -21,
  lowpass: 4500,
  highpass: 300,
  reverb: { mix: 0.06, decay: 0.2, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: 0,
      filter: { type: 'bandpass', freq: { from: 700, to: 1100, time: 0.08, curve: 2 }, q: 0.9 },
      env: { attack: 0.02, rise: 1.5, decay: 0.06, curve: 4 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.07,
      gain: -2,
      filter: { type: 'bandpass', freq: { from: 850, to: 1300, time: 0.09, curve: 2 }, q: 0.9 },
      env: { attack: 0.02, rise: 1.5, decay: 0.07, curve: 4 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.14,
      gain: -18,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1100, q: 0.8 },
        { type: 'lowpass', freq: 2860, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.008, curve: 6 }
    }
  ]
};

export default shuffle;
