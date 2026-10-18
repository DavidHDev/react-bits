const ember = {
  duration: 0.65,
  seed: 87,
  loudness: -19,
  lowpass: 5000,
  reverb: { mix: 0.12, decay: 0.5, predelay: 0.01, damp: 3500 },
  layers: [
    {
      type: 'tone',
      wave: 'triangle',
      freq: 440,
      tremolo: { rate: 9, depth: 0.5 },
      filter: { type: 'lowpass', freq: { from: 2400, to: 500, time: 0.5 }, q: 0.7 },
      env: { attack: 0.01, decay: 0.55, curve: 3 }
    },
    { type: 'tone', freq: 220, gain: -9, env: { attack: 0.01, decay: 0.5, curve: 4 } }
  ]
};

export default ember;
