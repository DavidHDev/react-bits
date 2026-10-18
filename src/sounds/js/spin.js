const spin = {
  duration: 1.2,
  seed: 126,
  loudness: -16.5,
  lowpass: 6000,
  highpass: 80,
  reverb: { mix: 0.15, decay: 0.9, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: 0,
      filter: {
        type: 'bandpass',
        freq: {
          points: [
            [0, 400],
            [0.5, 1400],
            [1.1, 500]
          ]
        },
        q: 0.8
      },
      env: { attack: 0.5, rise: 1.5, decay: 0.6, curve: 4 },
      tremolo: { rate: 7, depth: 0.55 },
      pan: {
        points: [
          [0, -0.7],
          [0.2, 0.7],
          [0.4, -0.7],
          [0.6, 0.7],
          [0.8, -0.7],
          [1, 0.7]
        ]
      }
    },
    {
      type: 'tone',
      freq: {
        points: [
          [0, 220],
          [0.55, 440],
          [1.1, 260]
        ]
      },
      gain: -14,
      tremolo: { rate: 7, depth: 0.5 },
      env: { attack: 0.5, rise: 1.6, decay: 0.6, curve: 4 }
    }
  ]
};

export default spin;
