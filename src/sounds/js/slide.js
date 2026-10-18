const slide = {
  duration: 0.45,
  seed: 334,
  loudness: -18,
  lowpass: 6500,
  highpass: 150,
  reverb: { mix: 0.1, decay: 0.4, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: 0,
      filter: { type: 'bandpass', freq: { from: 500, to: 1500, time: 0.33, curve: 2 }, q: 0.8 },
      env: { attack: 0.25, rise: 1.6, decay: 0.08, curve: 4 }
    },
    {
      type: 'tone',
      freq: { from: 440, to: 659.26, time: 0.3, curve: 2 },
      gain: -10,
      env: { attack: 0.25, rise: 1.6, decay: 0.08, curve: 4 }
    },
    {
      type: 'tone',
      freq: 659.26,
      at: 0.32,
      gain: -6,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.06, curve: 6 }
    }
  ]
};

export default slide;
