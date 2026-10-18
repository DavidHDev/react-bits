const twin = {
  duration: 0.65,
  seed: 127,
  loudness: -16.5,
  lowpass: 6000,
  highpass: 80,
  reverb: { mix: 0.1, decay: 0.6, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: 0,
      pan: { from: -0.6, to: 0.2, time: 0.33 },
      filter: {
        type: 'bandpass',
        freq: {
          points: [
            [0, 500],
            [0.15, 1300],
            [0.33, 600]
          ]
        },
        q: 0.85
      },
      env: { attack: 0.15, rise: 1.5, decay: 0.18, curve: 4 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.26,
      gain: 0,
      pan: { from: -0.2, to: 0.6, time: 0.34 },
      filter: {
        type: 'bandpass',
        freq: {
          points: [
            [0, 550],
            [0.14, 1400],
            [0.34, 650]
          ]
        },
        q: 0.85
      },
      env: { attack: 0.14, rise: 1.5, decay: 0.2, curve: 4 }
    }
  ]
};

export default twin;
