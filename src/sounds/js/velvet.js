const velvet = {
  duration: 1.9,
  seed: 111,
  loudness: -14,
  lowpass: 5000,
  highpass: 28,
  drive: 0.12,
  reverb: { mix: 0.22, decay: 2.2, predelay: 0.015, damp: 2600 },
  layers: [
    {
      type: 'tone',
      freq: { from: 78, to: 42, time: 0.55, curve: 3 },
      env: { attack: 0.004, decay: 1.7, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 190, to: 112, time: 0.3, curve: 3 },
      gain: 1,
      env: { attack: 0.004, decay: 0.45, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 380, to: 226, time: 0.2, curve: 3 },
      gain: -12,
      env: { attack: 0.004, decay: 0.18, curve: 5 }
    },
    {
      type: 'noise',
      color: 'pink',
      gain: -5,
      filter: { type: 'lowpass', freq: { from: 1100, to: 300, time: 0.12 }, q: 0.6 },
      env: { attack: 0.003, decay: 0.1, curve: 5 }
    },
    {
      type: 'noise',
      color: 'brown',
      gain: -4,
      filter: { type: 'lowpass', freq: { from: 420, to: 120, time: 0.2 }, q: 0.6 },
      env: { attack: 0.003, decay: 0.25, curve: 5 }
    },
    {
      type: 'noise',
      color: 'pink',
      gain: -22,
      filter: { type: 'bandpass', freq: 900, q: 0.6 },
      env: { attack: 0.002, decay: 0.06, curve: 5 }
    }
  ]
};

export default velvet;
