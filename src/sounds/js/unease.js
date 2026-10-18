const unease = {
  duration: 6,
  seed: 363,
  loudness: -17,
  lowpass: 2500,
  highpass: 30,
  width: 0.9,
  reverb: { mix: 0.35, decay: 3, predelay: 0.01, damp: 2500 },
  layers: [
    {
      type: 'tone',
      wave: 'sawtooth',
      voices: 2,
      detune: 8,
      freq: 73.42,
      gain: 0,
      filter: { type: 'lowpass', freq: 300, q: 0.7 },
      env: { attack: 3, hold: 0.5, decay: 2.5, curve: 3 }
    },
    {
      type: 'tone',
      wave: 'sawtooth',
      voices: 2,
      detune: 8,
      freq: 77.78,
      gain: -2,
      filter: { type: 'lowpass', freq: 300, q: 0.7 },
      env: { attack: 3, hold: 0.5, decay: 2.5, curve: 3 }
    },
    {
      type: 'tone',
      freq: 587.33,
      tremolo: { rate: 4.5, depth: 0.5 },
      gain: -18,
      env: { attack: 3, hold: 0.5, decay: 2.5, curve: 3 }
    },
    {
      type: 'tone',
      freq: 622.25,
      tremolo: { rate: 5.5, depth: 0.5 },
      gain: -20,
      env: { attack: 3, hold: 0.5, decay: 2.5, curve: 3 }
    },
    {
      type: 'noise',
      color: 'brown',
      gain: -10,
      filter: { type: 'lowpass', freq: 250, q: 0.6 },
      env: { attack: 3, hold: 0.5, decay: 2.5, curve: 3 }
    }
  ]
};

export default unease;
