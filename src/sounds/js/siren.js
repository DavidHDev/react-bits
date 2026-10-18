const siren = {
  duration: 4,
  seed: 367,
  loudness: -18,
  lowpass: 1800,
  highpass: 150,
  width: 0.8,
  reverb: { mix: 0.5, decay: 2.5, predelay: 0.04, damp: 2000 },
  layers: [
    {
      type: 'tone',
      freq: 587.33,
      vibrato: { rate: 0.45, depth: 350 },
      partials: [
        [1, 1, 1],
        [2, 0.2, 1],
        [3, 0.08, 1]
      ],
      env: { attack: 1.2, hold: 1.4, decay: 1.3, curve: 3 }
    }
  ]
};

export default siren;
