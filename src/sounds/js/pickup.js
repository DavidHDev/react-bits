const pickup = {
  duration: 0.22,
  seed: 211,
  loudness: -20,
  lowpass: 7000,
  reverb: { mix: 0.08, decay: 0.3, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 659.26,
      at: 0,
      gain: -4,
      partials: [
        [1, 1, 1],
        [2, 0.2, 0.55],
        [3, 0.08, 0.35],
        [4, 0.035, 0.22],
        [5, 0.015, 0.15]
      ],
      env: { attack: 0.0015, decay: 0.12, curve: 6 }
    },
    {
      type: 'tone',
      freq: { from: 440, to: 659.26, time: 0.08, curve: 2 },
      gain: -10,
      env: { attack: 0.02, decay: 0.1, curve: 4 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -22,
      filter: { type: 'bandpass', freq: { from: 800, to: 1800, time: 0.09, curve: 2 }, q: 0.8 },
      env: { attack: 0.03, rise: 1.5, decay: 0.06, curve: 4 }
    }
  ]
};

export default pickup;
