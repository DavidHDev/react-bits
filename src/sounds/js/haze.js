const haze = {
  duration: 2.8,
  seed: 113,
  loudness: -15,
  lowpass: 6500,
  highpass: 26,
  width: 0.8,
  reverb: { mix: 0.35, decay: 3, predelay: 0.02, damp: 3000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 64, to: 38, time: 0.8, curve: 3 },
      env: { attack: 0.006, decay: 2.5, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 170, to: 104, time: 0.5, curve: 3 },
      gain: 0,
      env: { attack: 0.006, decay: 0.75, curve: 5 }
    },
    {
      type: 'noise',
      color: 'pink',
      gain: -15,
      filter: { type: 'lowpass', freq: { from: 700, to: 200, time: 0.3 }, q: 0.6 },
      env: { attack: 0.005, decay: 0.35, curve: 5 }
    },
    {
      type: 'noise',
      color: 'brown',
      gain: -8,
      filter: { type: 'lowpass', freq: { from: 260, to: 90, time: 0.4 }, q: 0.6 },
      env: { attack: 0.004, decay: 0.5, curve: 5 }
    },
    {
      type: 'noise',
      color: 'pink',
      gain: -24,
      filter: [
        { type: 'highpass', freq: 1800, q: 0.5 },
        { type: 'lowpass', freq: 6000, q: 0.5 }
      ],
      env: { attack: 0.08, decay: 2.4, curve: 4 }
    }
  ]
};

export default haze;
