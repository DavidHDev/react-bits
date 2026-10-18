const bitflip = {
  duration: 0.4,
  seed: 311,
  loudness: -18,
  lowpass: 6000,
  highpass: 100,
  crush: 0.35,
  stutter: { slice: 0.025, chance: 0.55 },
  layers: [
    {
      type: 'tone',
      harmonics: [1, 0, 0.33, 0, 0.2],
      freq: 440,
      env: { attack: 0.003, hold: 0.25, decay: 0.12, curve: 4 }
    },
    {
      type: 'tone',
      harmonics: [1, 0, 0.33, 0, 0.2],
      freq: 659.26,
      gain: -6,
      env: { attack: 0.003, hold: 0.25, decay: 0.12, curve: 4 }
    }
  ]
};

export default bitflip;
