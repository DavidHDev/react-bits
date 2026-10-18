const calm = {
  duration: 9.5,
  seed: 322,
  loudness: -21,
  lowpass: 2500,
  highpass: 40,
  width: 0.8,
  reverb: { mix: 0.3, decay: 2.6, predelay: 0.01, damp: 3500 },
  layers: [
    {
      type: 'tone',
      wave: 'triangle',
      voices: 3,
      detune: 7,
      freq: 146.83,
      at: 0,
      gain: -2,
      filter: { type: 'lowpass', freq: 900, q: 0.6 },
      env: { attack: 2.5, rise: 1.6, hold: 5, decay: 2, curve: 3 },
      tremolo: { rate: 0.2, depth: 0.25 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      voices: 3,
      detune: 7,
      freq: 220,
      at: 0,
      gain: -4,
      filter: { type: 'lowpass', freq: 900, q: 0.6 },
      env: { attack: 2.5, rise: 1.6, hold: 5, decay: 2, curve: 3 },
      tremolo: { rate: 0.2, depth: 0.25 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      voices: 3,
      detune: 7,
      freq: 293.66,
      at: 0,
      gain: -6,
      filter: { type: 'lowpass', freq: 900, q: 0.6 },
      env: { attack: 2.5, rise: 1.6, hold: 5, decay: 2, curve: 3 },
      tremolo: { rate: 0.2, depth: 0.25 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      voices: 3,
      detune: 7,
      freq: 369.99,
      at: 0,
      gain: -8,
      filter: { type: 'lowpass', freq: 900, q: 0.6 },
      env: { attack: 2.5, rise: 1.6, hold: 5, decay: 2, curve: 3 },
      tremolo: { rate: 0.2, depth: 0.25 }
    }
  ]
};

export default calm;
