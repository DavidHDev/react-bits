const snow = {
  duration: 0.5,
  seed: 312,
  loudness: -20,
  lowpass: 4500,
  highpass: 500,
  reverb: { mix: 0.05, decay: 0.3, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      tremolo: { rate: 35, depth: 0.4 },
      filter: { type: 'bandpass', freq: 1200, q: 0.5 },
      env: { attack: 0.01, decay: 0.45, curve: 3 }
    },
    {
      type: 'noise',
      color: 'crackle',
      gain: 4,
      filter: { type: 'highpass', freq: 1500, q: 0.5 },
      env: { attack: 0.01, decay: 0.45, curve: 3 }
    }
  ]
};

export default snow;
