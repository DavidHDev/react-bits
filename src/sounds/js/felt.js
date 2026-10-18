const felt = {
  duration: 0.14,
  seed: 12,
  loudness: -19,
  lowpass: 3800,
  reverb: { mix: 0.05, decay: 0.22, predelay: 0.01, damp: 3500 },
  layers: [
    {
      type: 'tone',
      wave: 'triangle',
      freq: { from: 250, to: 175, time: 0.04, curve: 3 },
      at: 0,
      gain: 0,
      env: { attack: 0.003, decay: 0.07, curve: 6 },
      filter: { type: 'lowpass', freq: 800, q: 0.6 }
    },
    {
      type: 'noise',
      color: 'pink',
      at: 0,
      gain: -12,
      punch: true,
      filter: [
        { type: 'bandpass', freq: 620, q: 0.7 },
        { type: 'lowpass', freq: 1612, q: 0.5 }
      ],
      env: { attack: 0.002, decay: 0.022, curve: 6 }
    }
  ]
};

export default felt;
