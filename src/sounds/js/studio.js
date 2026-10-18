const studio = {
  duration: 9.5,
  seed: 324,
  loudness: -30,
  lowpass: 1500,
  highpass: 40,
  width: 0.8,
  layers: [
    {
      type: 'noise',
      color: 'brown',
      filter: { type: 'lowpass', freq: 800, q: 0.5 },
      env: { attack: 1, hold: 7.5, decay: 1, curve: 3 }
    },
    {
      type: 'noise',
      color: 'pink',
      gain: -10,
      filter: { type: 'lowpass', freq: 1500, q: 0.5 },
      env: { attack: 1, hold: 7.5, decay: 1, curve: 3 }
    }
  ]
};

export default studio;
