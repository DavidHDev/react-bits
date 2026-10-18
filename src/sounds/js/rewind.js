const rewind = {
  duration: 1.05,
  seed: 134,
  loudness: -17,
  lowpass: 5000,
  highpass: 100,
  reverb: { mix: 0.08, decay: 0.4, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      wave: 'sawtooth',
      freq: { from: 180, to: 1600, time: 0.95, curve: 0.8 },
      tremolo: { rate: 28, depth: 0.6 },
      filter: { type: 'lowpass', freq: 2600, q: 0.8 },
      gain: -6,
      env: { attack: 0.05, hold: 0.8, decay: 0.12, curve: 4 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: { from: 260, to: 2200, time: 0.95, curve: 0.8 },
      vibrato: { rate: 13, depth: 60 },
      gain: -12,
      filter: { type: 'lowpass', freq: 3000, q: 0.6 },
      env: { attack: 0.05, hold: 0.8, decay: 0.12, curve: 4 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -10,
      filter: { type: 'bandpass', freq: { from: 500, to: 3000, time: 0.97, curve: 2 }, q: 0.6 },
      env: { attack: 0.05, rise: 1.5, hold: 0.8, decay: 0.12, curve: 4 }
    }
  ]
};

export default rewind;
