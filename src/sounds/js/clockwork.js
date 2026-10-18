const clockwork = {
  duration: 4.2,
  seed: 362,
  loudness: -17,
  lowpass: 7000,
  highpass: 300,
  reverb: { mix: 0.15, decay: 0.8, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 1318.51,
      at: 0,
      gain: 0,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.03, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -10,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 2400, q: 1.1 },
        { type: 'lowpass', freq: 6240, q: 0.5 }
      ],
      env: { attack: 0.0006, decay: 0.003, curve: 6 }
    },
    {
      type: 'tone',
      freq: 880,
      at: 0.5,
      gain: -2,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.03, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.5,
      gain: -10,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1800, q: 1.1 },
        { type: 'lowpass', freq: 4680, q: 0.5 }
      ],
      env: { attack: 0.0006, decay: 0.003, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 1,
      gain: 0,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.03, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 1,
      gain: -10,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 2400, q: 1.1 },
        { type: 'lowpass', freq: 6240, q: 0.5 }
      ],
      env: { attack: 0.0006, decay: 0.003, curve: 6 }
    },
    {
      type: 'tone',
      freq: 880,
      at: 1.5,
      gain: -2,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.03, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 1.5,
      gain: -10,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1800, q: 1.1 },
        { type: 'lowpass', freq: 4680, q: 0.5 }
      ],
      env: { attack: 0.0006, decay: 0.003, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 2,
      gain: 0,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.03, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 2,
      gain: -10,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 2400, q: 1.1 },
        { type: 'lowpass', freq: 6240, q: 0.5 }
      ],
      env: { attack: 0.0006, decay: 0.003, curve: 6 }
    },
    {
      type: 'tone',
      freq: 880,
      at: 2.5,
      gain: -2,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.03, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 2.5,
      gain: -10,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1800, q: 1.1 },
        { type: 'lowpass', freq: 4680, q: 0.5 }
      ],
      env: { attack: 0.0006, decay: 0.003, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1318.51,
      at: 3,
      gain: 0,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.03, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 3,
      gain: -10,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 2400, q: 1.1 },
        { type: 'lowpass', freq: 6240, q: 0.5 }
      ],
      env: { attack: 0.0006, decay: 0.003, curve: 6 }
    },
    {
      type: 'tone',
      freq: 880,
      at: 3.5,
      gain: -2,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.03, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 3.5,
      gain: -10,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 1800, q: 1.1 },
        { type: 'lowpass', freq: 4680, q: 0.5 }
      ],
      env: { attack: 0.0006, decay: 0.003, curve: 6 }
    }
  ]
};

export default clockwork;
