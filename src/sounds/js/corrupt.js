const corrupt = {
  duration: 0.6,
  seed: 316,
  loudness: -16.5,
  lowpass: 6000,
  highpass: 40,
  drive: 0.3,
  crush: 0.5,
  stutter: { slice: 0.04, chance: 0.6 },
  reverb: { mix: 0.08, decay: 0.4, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      harmonics: [1, 0, 0.33, 0, 0.2, 0, 0.14],
      freq: 73.42,
      env: { attack: 0.002, hold: 0.3, decay: 0.2, curve: 4 }
    },
    {
      type: 'noise',
      color: 'pink',
      gain: -6,
      filter: { type: 'bandpass', freq: 1500, q: 0.5 },
      env: { attack: 0.002, decay: 0.3, curve: 4 }
    }
  ]
};

export default corrupt;
