const distant = {
  duration: 1.6,
  seed: 120,
  loudness: -15,
  lowpass: 1200,
  highpass: 28,
  echo: { time: 0.34, feedback: 0.45, mix: 0.35, damp: 900 },
  reverb: { mix: 0.45, decay: 3.5, predelay: 0.04, damp: 1500, lowcut: 120 },
  layers: [
    {
      type: 'tone',
      freq: { from: 70, to: 40, time: 0.72, curve: 3 },
      at: 0,
      gain: 0,
      env: { attack: 0.004, decay: 1.2, curve: 5 }
    },
    {
      type: 'noise',
      color: 'brown',
      filter: { type: 'lowpass', freq: { from: 300, to: 100, time: 0.6 }, q: 0.6 },
      env: { attack: 0.005, decay: 0.8, curve: 4 }
    },
    {
      type: 'noise',
      color: 'pink',
      gain: -10,
      filter: { type: 'lowpass', freq: 700, q: 0.6 },
      env: { attack: 0.003, decay: 0.2, curve: 5 }
    }
  ]
};

export default distant;
