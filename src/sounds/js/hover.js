const hover = {
  duration: 0.26,
  seed: 215,
  loudness: -23,
  lowpass: 8000,
  reverb: { mix: 0.15, decay: 0.45, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      freq: 1318.51,
      voices: 2,
      detune: 9,
      env: { attack: 0.04, decay: 0.16, curve: 4 }
    },
    { type: 'tone', freq: 880, gain: -8, env: { attack: 0.05, decay: 0.15, curve: 4 } }
  ]
};

export default hover;
