const leaf = {
  duration: 0.34,
  seed: 204,
  loudness: -20,
  lowpass: 3200,
  highpass: 250,
  reverb: { mix: 0.08, decay: 0.3, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: 0,
      pan: { from: 0.3, to: -0.3, time: 0.28 },
      filter: {
        type: 'bandpass',
        freq: {
          points: [
            [0, 600],
            [0.07, 1200],
            [0.27, 500]
          ]
        },
        q: 0.8
      },
      env: { attack: 0.07, rise: 1.4, decay: 0.2, curve: 4 },
      tremolo: { rate: 26, depth: 0.55 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0.2,
      gain: -16,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 600, q: 0.8 },
        { type: 'lowpass', freq: 1560, q: 0.5 }
      ],
      env: { attack: 0.004, decay: 0.03, curve: 6 }
    }
  ]
};

export default leaf;
