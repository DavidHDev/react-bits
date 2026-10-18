const glide = {
  duration: 0.16,
  seed: 64,
  loudness: -20,
  lowpass: 7000,
  highpass: 200,
  reverb: { mix: 0.06, decay: 0.25, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      filter: { type: 'bandpass', freq: { from: 1000, to: 1800, time: 0.1, curve: 2 }, q: 0.9 },
      env: { attack: 0.04, rise: 1.5, decay: 0.08, curve: 4 }
    },
    {
      type: 'tone',
      freq: { from: 600, to: 680, time: 0.03, curve: 3 },
      at: 0.03,
      gain: -8,
      env: { attack: 0.004, decay: 0.06, curve: 6 }
    }
  ]
};

export default glide;
