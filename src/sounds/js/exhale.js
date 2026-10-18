const exhale = {
  duration: 1.5,
  seed: 132,
  loudness: -17,
  lowpass: 5500,
  highpass: 60,
  reverb: { mix: 0.25, decay: 1.5, predelay: 0.01, damp: 4000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      filter: { type: 'bandpass', freq: { from: 1500, to: 420, time: 1.3, curve: 2 }, q: 0.6 },
      env: { attack: 0.03, decay: 1.3, curve: 3 }
    },
    {
      type: 'tone',
      freq: { from: 220, to: 164.81, time: 1, curve: 2 },
      gain: -14,
      env: { attack: 0.03, decay: 0.9, curve: 4 }
    }
  ]
};

export default exhale;
