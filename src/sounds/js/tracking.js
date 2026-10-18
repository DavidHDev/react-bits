const tracking = {
  duration: 1.2,
  seed: 315,
  loudness: -18,
  lowpass: 5000,
  highpass: 80,
  crush: 0.15,
  reverb: { mix: 0.12, decay: 0.6, predelay: 0.01, damp: 5000 },
  layers: [
    {
      type: 'tone',
      wave: 'triangle',
      freq: 293.66,
      vibrato: { rate: 1.3, depth: 45 },
      gain: 0,
      filter: { type: 'lowpass', freq: 2000, q: 0.6 },
      env: { attack: 0.02, hold: 0.8, decay: 0.3, curve: 4 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 369.99,
      vibrato: { rate: 1.3, depth: 45 },
      gain: -3,
      filter: { type: 'lowpass', freq: 2000, q: 0.6 },
      env: { attack: 0.02, hold: 0.8, decay: 0.3, curve: 4 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 440,
      vibrato: { rate: 1.3, depth: 45 },
      gain: -6,
      filter: { type: 'lowpass', freq: 2000, q: 0.6 },
      env: { attack: 0.02, hold: 0.8, decay: 0.3, curve: 4 }
    },
    {
      type: 'noise',
      color: 'pink',
      gain: -16,
      filter: { type: 'highpass', freq: 2500, q: 0.5 },
      env: { attack: 0.02, hold: 0.8, decay: 0.3, curve: 4 }
    },
    {
      type: 'noise',
      color: 'crackle',
      gain: 2,
      filter: { type: 'bandpass', freq: 3000, q: 0.6 },
      env: { attack: 0.02, hold: 0.8, decay: 0.3, curve: 4 }
    }
  ]
};

export default tracking;
