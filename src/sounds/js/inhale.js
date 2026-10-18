const inhale = {
  duration: 1.7,
  seed: 131,
  loudness: -16,
  lowpass: 8000,
  width: 0.7,
  reverse: true,
  reverb: { mix: 0.45, decay: 1.6, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 440,
      at: 0,
      gain: 0,
      partials: [
        [1, 1, 1],
        [2, 0.096, 0.55],
        [3, 0.024, 0.35]
      ],
      env: { attack: 0.004, decay: 1.4, curve: 6 }
    },
    {
      type: 'tone',
      freq: 659.26,
      at: 0,
      gain: -3,
      partials: [
        [1, 1, 1],
        [2, 0.096, 0.55],
        [3, 0.024, 0.35]
      ],
      env: { attack: 0.004, decay: 1.3, curve: 6 }
    },
    {
      type: 'tone',
      freq: 880,
      at: 0,
      gain: -8,
      partials: [
        [1, 1, 1],
        [2, 0.08, 0.55],
        [3, 0.02, 0.35]
      ],
      env: { attack: 0.004, decay: 1.1, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      gain: -20,
      filter: { type: 'lowpass', freq: 3000, q: 0.5 },
      env: { attack: 0.01, decay: 1.2, curve: 4 }
    }
  ]
};

export default inhale;
