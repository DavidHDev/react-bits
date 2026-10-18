const dawn = {
  duration: 0.9,
  seed: 81,
  loudness: -17,
  lowpass: 7000,
  reverb: { mix: 0.22, decay: 1, predelay: 0.01, damp: 5500 },
  layers: [
    {
      type: 'tone',
      wave: 'triangle',
      freq: { from: 392, to: 523.25, time: 0.3, curve: 2 },
      filter: { type: 'lowpass', freq: { from: 900, to: 4500, time: 0.35 }, q: 0.6 },
      env: { attack: 0.12, rise: 1.4, decay: 0.6, curve: 4 }
    },
    {
      type: 'tone',
      freq: { from: 587.33, to: 783.99, time: 0.3, curve: 2 },
      gain: -9,
      env: { attack: 0.14, rise: 1.4, decay: 0.55, curve: 4 }
    },
    {
      type: 'tone',
      freq: 1046.5,
      at: 0.18,
      gain: -20,
      env: { attack: 0.08, decay: 0.5, curve: 5 }
    }
  ]
};

export default dawn;
