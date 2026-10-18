const slowdown = {
  duration: 1.15,
  seed: 135,
  loudness: -16,
  lowpass: 5000,
  highpass: 30,
  reverb: { mix: 0.1, decay: 0.5, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      wave: 'sawtooth',
      voices: 2,
      detune: 6,
      freq: { from: 146.83, to: 17.6196, time: 0.95, curve: 0.55 },
      gain: -4,
      filter: { type: 'lowpass', freq: { from: 2400, to: 200, time: 0.95 }, q: 0.7 },
      env: { attack: 0.01, hold: 0.8, decay: 0.2, curve: 3 }
    },
    {
      type: 'tone',
      wave: 'sawtooth',
      voices: 2,
      detune: 6,
      freq: { from: 220, to: 26.4, time: 0.95, curve: 0.55 },
      gain: -7,
      filter: { type: 'lowpass', freq: { from: 2400, to: 200, time: 0.95 }, q: 0.7 },
      env: { attack: 0.01, hold: 0.8, decay: 0.2, curve: 3 }
    },
    {
      type: 'tone',
      wave: 'sawtooth',
      voices: 2,
      detune: 6,
      freq: { from: 293.66, to: 35.2392, time: 0.95, curve: 0.55 },
      gain: -10,
      filter: { type: 'lowpass', freq: { from: 2400, to: 200, time: 0.95 }, q: 0.7 },
      env: { attack: 0.01, hold: 0.8, decay: 0.2, curve: 3 }
    },
    {
      type: 'noise',
      color: 'pink',
      gain: -16,
      filter: { type: 'lowpass', freq: { from: 3000, to: 200, time: 0.9 }, q: 0.6 },
      env: { attack: 0.01, hold: 0.7, decay: 0.25, curve: 3 }
    }
  ]
};

export default slowdown;
