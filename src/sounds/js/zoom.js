const zoom = {
  duration: 0.65,
  seed: 137,
  loudness: -15.5,
  lowpass: 7000,
  highpass: 35,
  reverb: { mix: 0.12, decay: 0.6, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 120, to: 900, time: 0.3, curve: 0.7 },
      env: { attack: 0.25, rise: 2, decay: 0.05, curve: 4 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: 0,
      filter: { type: 'bandpass', freq: { from: 400, to: 3500, time: 0.33, curve: 2 }, q: 0.7 },
      env: { attack: 0.28, rise: 2, decay: 0.05, curve: 4 }
    },
    {
      type: 'tone',
      freq: { from: 110, to: 55, time: 0.15, curve: 3 },
      at: 0.3,
      gain: -4,
      env: { attack: 0.004, decay: 0.25, curve: 5 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.3,
      gain: -10,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 800, q: 0.6 },
        { type: 'lowpass', freq: 2080, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.03, curve: 6 }
    }
  ]
};

export default zoom;
