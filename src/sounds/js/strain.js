const strain = {
  duration: 4.1,
  seed: 109,
  loudness: -16,
  lowpass: 4000,
  highpass: 60,
  width: 0.8,
  reverb: { mix: 0.3, decay: 2, predelay: 0.01, damp: 4500 },
  layers: [
    {
      type: 'tone',
      wave: 'sawtooth',
      voices: 5,
      detune: 14,
      freq: { from: 220, to: 293.66, time: 4, curve: 0.8 },
      vibrato: { rate: 5.2, depth: 12 },
      filter: { type: 'lowpass', freq: { from: 500, to: 2600, time: 4, curve: 0.7 }, q: 0.9 },
      gain: -6,
      env: { attack: 3.6, rise: 2, decay: 0.25, curve: 3 }
    },
    {
      type: 'tone',
      wave: 'sawtooth',
      voices: 4,
      detune: 12,
      freq: { from: 329.63, to: 440, time: 4, curve: 0.8 },
      vibrato: { rate: 5.6, depth: 14 },
      filter: { type: 'lowpass', freq: { from: 600, to: 3000, time: 4, curve: 0.7 }, q: 0.9 },
      gain: -9,
      env: { attack: 3.7, rise: 2, decay: 0.25, curve: 3 }
    },
    {
      type: 'tone',
      freq: { from: 880, to: 1174.66, time: 4, curve: 0.8 },
      tremolo: { rate: 7, depth: 0.35 },
      gain: -18,
      env: { attack: 3.6, rise: 2, decay: 0.2, curve: 3 }
    },
    {
      type: 'noise',
      color: 'pink',
      gain: -20,
      filter: { type: 'bandpass', freq: { from: 800, to: 2600, time: 4 }, q: 0.7 },
      env: { attack: 3.7, rise: 2, decay: 0.2, curve: 3 }
    }
  ]
};

export default strain;
