const stalk = {
  duration: 4,
  seed: 364,
  loudness: -15.5,
  lowpass: 600,
  highpass: 25,
  reverb: { mix: 0.15, decay: 1, predelay: 0.01, damp: 1500 },
  layers: [
    {
      type: 'tone',
      wave: 'triangle',
      freq: 73.42,
      tremolo: { rate: 2, depth: 0.9 },
      filter: { type: 'lowpass', freq: 300, q: 0.7 },
      env: { attack: 0.3, hold: 3.2, decay: 0.5, curve: 3 }
    },
    {
      type: 'tone',
      freq: 36.71,
      tremolo: { rate: 2, depth: 0.9 },
      gain: -4,
      env: { attack: 0.3, hold: 3.2, decay: 0.5, curve: 3 }
    }
  ]
};

export default stalk;
