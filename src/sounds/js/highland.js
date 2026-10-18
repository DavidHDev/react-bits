const highland = {
  duration: 9.5,
  seed: 325,
  loudness: -21,
  lowpass: 5000,
  highpass: 60,
  width: 1,
  reverb: { mix: 0.2, decay: 1.5, predelay: 0.01, damp: 4000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      pan: {
        points: [
          [0, -0.4],
          [3, 0.3],
          [6, -0.2],
          [9.5, 0.4]
        ]
      },
      filter: {
        type: 'bandpass',
        freq: {
          points: [
            [0, 350],
            [2, 900],
            [3.8, 420],
            [5.6, 1100],
            [7.5, 380],
            [9.5, 700]
          ]
        },
        q: 1.4
      },
      env: { attack: 1.5, hold: 6.5, decay: 1.5, curve: 3 }
    },
    {
      type: 'noise',
      color: 'brown',
      gain: -4,
      tremolo: { rate: 0.3, depth: 0.5 },
      filter: { type: 'lowpass', freq: 300, q: 0.6 },
      env: { attack: 1.5, hold: 6.5, decay: 1.5, curve: 3 }
    }
  ]
};

export default highland;
