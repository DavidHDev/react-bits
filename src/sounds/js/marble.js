const marble = {
  duration: 0.12,
  seed: 27,
  loudness: -20,
  lowpass: 8500,
  reverb: { mix: 0.08, decay: 0.3, predelay: 0.01, damp: 7000 },
  layers: [
    {
      type: 'tone',
      freq: 1174.66,
      at: 0,
      gain: 0,
      partials: [
        [1, 1, 1],
        [2.76, 0.084, 0.4],
        [5.4, 0.021, 0.22]
      ],
      env: { attack: 0.0025, decay: 0.07, curve: 6 }
    },
    {
      type: 'tone',
      freq: { from: 1900, to: 1500, time: 0.02, curve: 3 },
      at: 0,
      gain: -14,
      env: { attack: 0.001, decay: 0.012, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -22,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 2400, q: 1.4 },
        { type: 'lowpass', freq: 6240, q: 0.5 }
      ],
      env: { attack: 0.0007, decay: 0.003, curve: 6 }
    }
  ]
};

export default marble;
