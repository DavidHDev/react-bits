const daylight = {
  duration: 0.38,
  seed: 34,
  loudness: -19,
  lowpass: 9000,
  reverb: { mix: 0.16, decay: 0.5, predelay: 0.01, damp: 7000 },
  layers: [
    {
      type: 'tone',
      freq: 880,
      at: 0,
      gain: 0,
      partials: [
        [1, 1, 1],
        [2, 0.08, 0.55],
        [3, 0.02, 0.35]
      ],
      env: { attack: 0.004, decay: 0.14, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1174.66,
      at: 0.06,
      gain: -2,
      partials: [
        [1, 1, 1],
        [2, 0.08, 0.55],
        [3, 0.02, 0.35]
      ],
      env: { attack: 0.004, decay: 0.24, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      gain: -26,
      filter: [
        { type: 'highpass', freq: 3000, q: 0.5 },
        { type: 'lowpass', freq: 8000, q: 0.5 }
      ],
      env: { attack: 0.06, decay: 0.15, curve: 4 }
    }
  ]
};

export default daylight;
