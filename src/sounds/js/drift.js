const drift = {
  duration: 2.3,
  seed: 123,
  loudness: -17,
  lowpass: 6000,
  highpass: 50,
  width: 0.8,
  reverb: { mix: 0.2, decay: 1.6, predelay: 0.01, damp: 4000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      pan: { from: -0.5, to: 0.5, time: 2.1 },
      filter: {
        type: 'bandpass',
        freq: {
          points: [
            [0, 300],
            [1.1, 1100],
            [2.2, 380]
          ]
        },
        q: 0.7
      },
      env: { attack: 1, rise: 1.4, decay: 1.2, curve: 3 }
    },
    {
      type: 'noise',
      color: 'brown',
      gain: -12,
      filter: { type: 'lowpass', freq: 260, q: 0.6 },
      env: { attack: 1, rise: 1.4, decay: 1.1, curve: 3 }
    }
  ]
};

export default drift;
