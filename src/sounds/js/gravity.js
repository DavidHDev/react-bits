const gravity = {
  duration: 1.7,
  seed: 307,
  loudness: -14.5,
  lowpass: 4000,
  highpass: 25,
  drive: 0.2,
  reverb: { mix: 0.2, decay: 1.4, predelay: 0.01, damp: 2500 },
  layers: [
    {
      type: 'tone',
      wave: 'sawtooth',
      voices: 3,
      detune: 10,
      freq: { from: 400, to: 50, time: 1.2, curve: 1.6 },
      filter: { type: 'lowpass', freq: { from: 3000, to: 250, time: 1.2 }, q: 0.8 },
      gain: -4,
      env: { attack: 0.02, hold: 1, decay: 0.2, curve: 3 }
    },
    {
      type: 'tone',
      freq: { from: 70, to: 38, time: 0.3, curve: 3 },
      at: 1.18,
      gain: 0,
      env: { attack: 0.004, decay: 0.5, curve: 5 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 1.18,
      gain: -8,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 600, q: 0.6 },
        { type: 'lowpass', freq: 1560, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.03, curve: 6 }
    }
  ]
};

export default gravity;
