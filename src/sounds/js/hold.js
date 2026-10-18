const hold = {
  duration: 0.2,
  seed: 242,
  loudness: -20,
  lowpass: 4500,
  reverb: { mix: 0.06, decay: 0.22, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      wave: 'sawtooth',
      freq: { from: 440, to: 250, time: 0.12, curve: 2 },
      filter: { type: 'lowpass', freq: { from: 1400, to: 600, time: 0.12 }, q: 0.7 },
      env: { attack: 0.004, decay: 0.13, curve: 4 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.11,
      gain: -18,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 900, q: 0.8 },
        { type: 'lowpass', freq: 2340, q: 0.5 }
      ],
      env: { attack: 0.001, decay: 0.008, curve: 6 }
    }
  ]
};

export default hold;
