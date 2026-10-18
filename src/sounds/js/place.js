const place = {
  duration: 0.18,
  seed: 212,
  loudness: -19.5,
  lowpass: 5000,
  reverb: { mix: 0.08, decay: 0.3, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 293.66,
      at: 0,
      gain: 0,
      partials: [
        [1, 1, 1],
        [3.93, 0.16, 0.25],
        [9.2, 0.025, 0.1]
      ],
      env: { attack: 0.002, decay: 0.08, curve: 6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -14,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 700, q: 0.7 },
        { type: 'lowpass', freq: 1820, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.015, curve: 6 }
    },
    {
      type: 'tone',
      freq: { from: 440, to: 329.63, time: 0.06 },
      gain: -12,
      env: { attack: 0.004, decay: 0.08, curve: 5 }
    }
  ]
};

export default place;
