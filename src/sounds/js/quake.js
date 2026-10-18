const quake = {
  duration: 2.6,
  seed: 304,
  loudness: -14.5,
  lowpass: 1200,
  highpass: 22,
  drive: 0.15,
  width: 0.8,
  reverb: { mix: 0.25, decay: 2.4, predelay: 0.01, damp: 1800 },
  layers: [
    {
      type: 'noise',
      color: 'brown',
      tremolo: { rate: 6, depth: 0.6 },
      filter: { type: 'lowpass', freq: { from: 260, to: 90, time: 2.4 }, q: 0.7 },
      env: { attack: 0.08, decay: 2.4, curve: 3 }
    },
    {
      type: 'tone',
      freq: { from: 50, to: 30, time: 2, curve: 3 },
      at: 0,
      gain: -2,
      env: { attack: 0.05, decay: 2.3, curve: 3 }
    }
  ]
};

export default quake;
