const heartbeat = {
  duration: 3.2,
  seed: 361,
  loudness: -15,
  lowpass: 600,
  highpass: 25,
  reverb: { mix: 0.1, decay: 0.6, predelay: 0.01, damp: 1500 },
  layers: [
    {
      type: 'tone',
      freq: { from: 70, to: 50, time: 0.08, curve: 3 },
      at: 0,
      gain: 0,
      env: { attack: 0.004, decay: 0.18, curve: 5 }
    },
    { type: 'tone', freq: 120, at: 0, gain: -8, env: { attack: 0.004, decay: 0.1, curve: 5 } },
    {
      type: 'tone',
      freq: { from: 62, to: 46, time: 0.1, curve: 3 },
      at: 0.24,
      gain: -2,
      env: { attack: 0.004, decay: 0.22, curve: 5 }
    },
    {
      type: 'tone',
      freq: 105,
      at: 0.24,
      gain: -10,
      env: { attack: 0.004, decay: 0.12, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 70, to: 50, time: 0.08, curve: 3 },
      at: 1,
      gain: 0,
      env: { attack: 0.004, decay: 0.18, curve: 5 }
    },
    { type: 'tone', freq: 120, at: 1, gain: -8, env: { attack: 0.004, decay: 0.1, curve: 5 } },
    {
      type: 'tone',
      freq: { from: 62, to: 46, time: 0.1, curve: 3 },
      at: 1.24,
      gain: -2,
      env: { attack: 0.004, decay: 0.22, curve: 5 }
    },
    {
      type: 'tone',
      freq: 105,
      at: 1.24,
      gain: -10,
      env: { attack: 0.004, decay: 0.12, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 70, to: 50, time: 0.08, curve: 3 },
      at: 2,
      gain: 0,
      env: { attack: 0.004, decay: 0.18, curve: 5 }
    },
    { type: 'tone', freq: 120, at: 2, gain: -8, env: { attack: 0.004, decay: 0.1, curve: 5 } },
    {
      type: 'tone',
      freq: { from: 62, to: 46, time: 0.1, curve: 3 },
      at: 2.24,
      gain: -2,
      env: { attack: 0.004, decay: 0.22, curve: 5 }
    },
    {
      type: 'tone',
      freq: 105,
      at: 2.24,
      gain: -10,
      env: { attack: 0.004, decay: 0.12, curve: 5 }
    }
  ]
};

export default heartbeat;
