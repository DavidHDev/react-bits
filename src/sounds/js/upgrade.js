const upgrade = {
  duration: 0.9,
  seed: 253,
  loudness: -17.5,
  lowpass: 7000,
  reverb: { mix: 0.16, decay: 0.7, predelay: 0.01, damp: 6000 },
  layers: [
    {
      type: 'tone',
      wave: 'sawtooth',
      voices: 2,
      detune: 8,
      freq: { from: 293.66, to: 587.33, time: 0.3, curve: 1.5 },
      filter: { type: 'lowpass', freq: { from: 600, to: 3200, time: 0.3 }, q: 0.8 },
      gain: -10,
      env: { attack: 0.03, decay: 0.32, curve: 3 }
    },
    {
      type: 'tone',
      freq: 1174.66,
      at: 0.3,
      gain: 0,
      partials: [
        [1, 1, 1],
        [2, 0.096, 0.55],
        [3, 0.024, 0.35]
      ],
      env: { attack: 0.004, decay: 0.5, curve: 6 }
    },
    {
      type: 'tone',
      freq: 1760,
      at: 0.36,
      gain: -5,
      partials: [
        [1, 1, 1],
        [2, 0.064, 0.55],
        [3, 0.016, 0.35]
      ],
      env: { attack: 0.004, decay: 0.45, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -20,
      filter: { type: 'bandpass', freq: { from: 1500, to: 6000, time: 0.4, curve: 2 }, q: 0.8 },
      env: { attack: 0.28, rise: 1.5, decay: 0.12, curve: 4 }
    }
  ]
};

export default upgrade;
