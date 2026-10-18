const spring = {
  duration: 0.3,
  seed: 37,
  loudness: -19,
  lowpass: 5000,
  reverb: { mix: 0.08, decay: 0.3, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: { from: 330, to: 520, time: 0.06, curve: 2 },
      vibrato: { rate: 22, depth: 70 },
      env: { attack: 0.003, decay: 0.22, curve: 4 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: { from: 165, to: 260, time: 0.06, curve: 2 },
      vibrato: { rate: 22, depth: 70 },
      gain: -12,
      filter: { type: 'lowpass', freq: 1200, q: 0.6 },
      env: { attack: 0.003, decay: 0.18, curve: 4 }
    }
  ]
};

export default spring;
