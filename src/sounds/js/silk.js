const silk = {
  duration: 0.7,
  seed: 129,
  loudness: -18,
  lowpass: 6000,
  highpass: 400,
  reverb: { mix: 0.12, decay: 0.6, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: 0,
      pan: { from: 0.4, to: -0.4, time: 0.6 },
      filter: {
        type: 'bandpass',
        freq: {
          points: [
            [0, 1100],
            [0.25, 1500],
            [0.6, 1400]
          ]
        },
        q: 0.6
      },
      env: { attack: 0.25, rise: 1.4, decay: 0.35, curve: 4 }
    },
    {
      type: 'noise',
      color: 'pink',
      gain: -22,
      filter: [
        { type: 'highpass', freq: 3500, q: 0.5 },
        { type: 'lowpass', freq: 7000, q: 0.5 }
      ],
      env: { attack: 0.25, rise: 1.4, decay: 0.3, curve: 4 }
    }
  ]
};

export default silk;
