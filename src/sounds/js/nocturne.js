const nocturne = {
  duration: 9.5,
  seed: 327,
  loudness: -21,
  lowpass: 6000,
  highpass: 40,
  width: 0.9,
  reverb: { mix: 0.3, decay: 2.4, predelay: 0.01, damp: 3500 },
  layers: [
    {
      type: 'tone',
      wave: 'sawtooth',
      voices: 3,
      detune: 9,
      freq: 73.42,
      at: 0,
      gain: -2,
      filter: { type: 'lowpass', freq: 450, q: 0.6 },
      env: { attack: 2.5, rise: 1.6, hold: 5, decay: 2, curve: 3 }
    },
    {
      type: 'tone',
      wave: 'sawtooth',
      voices: 3,
      detune: 9,
      freq: 110,
      at: 0,
      gain: -5,
      filter: { type: 'lowpass', freq: 450, q: 0.6 },
      env: { attack: 2.5, rise: 1.6, hold: 5, decay: 2, curve: 3 }
    },
    {
      type: 'tone',
      wave: 'sawtooth',
      voices: 3,
      detune: 9,
      freq: 146.83,
      at: 0,
      gain: -8,
      filter: { type: 'lowpass', freq: 450, q: 0.6 },
      env: { attack: 2.5, rise: 1.6, hold: 5, decay: 2, curve: 3 }
    },
    {
      type: 'tone',
      freq: 3997.857,
      at: 1.1927,
      gain: -25.2768,
      pan: 0.1111,
      tremolo: { rate: 38, depth: 0.9 },
      env: { attack: 0.02, hold: 0.1, decay: 0.05, curve: 4 }
    },
    {
      type: 'tone',
      freq: 4440.6691,
      at: 1.9986,
      gain: -24.0223,
      pan: -0.7539,
      tremolo: { rate: 38, depth: 0.9 },
      env: { attack: 0.02, hold: 0.1, decay: 0.05, curve: 4 }
    },
    {
      type: 'tone',
      freq: 4034.0892,
      at: 2.6098,
      gain: -28.1215,
      pan: -0.4444,
      tremolo: { rate: 38, depth: 0.9 },
      env: { attack: 0.02, hold: 0.1, decay: 0.05, curve: 4 }
    },
    {
      type: 'tone',
      freq: 3946.8109,
      at: 3.4982,
      gain: -28.0884,
      pan: -0.6409,
      tremolo: { rate: 38, depth: 0.9 },
      env: { attack: 0.02, hold: 0.1, decay: 0.05, curve: 4 }
    },
    {
      type: 'tone',
      freq: 4470.3593,
      at: 4.1518,
      gain: -27.4477,
      pan: 0.5516,
      tremolo: { rate: 38, depth: 0.9 },
      env: { attack: 0.02, hold: 0.1, decay: 0.05, curve: 4 }
    },
    {
      type: 'tone',
      freq: 3888.71,
      at: 4.968,
      gain: -25.2435,
      pan: -0.0467,
      tremolo: { rate: 38, depth: 0.9 },
      env: { attack: 0.02, hold: 0.1, decay: 0.05, curve: 4 }
    },
    {
      type: 'tone',
      freq: 3824.7807,
      at: 5.5883,
      gain: -25.2964,
      pan: -0.5547,
      tremolo: { rate: 38, depth: 0.9 },
      env: { attack: 0.02, hold: 0.1, decay: 0.05, curve: 4 }
    },
    {
      type: 'tone',
      freq: 4487.513,
      at: 6.2756,
      gain: -28.8114,
      pan: 0.1451,
      tremolo: { rate: 38, depth: 0.9 },
      env: { attack: 0.02, hold: 0.1, decay: 0.05, curve: 4 }
    },
    {
      type: 'tone',
      freq: 4173.6029,
      at: 7.1468,
      gain: -25.9918,
      pan: 0.7608,
      tremolo: { rate: 38, depth: 0.9 },
      env: { attack: 0.02, hold: 0.1, decay: 0.05, curve: 4 }
    },
    {
      type: 'tone',
      freq: 4133.667,
      at: 7.9843,
      gain: -27.354,
      pan: -0.4337,
      tremolo: { rate: 38, depth: 0.9 },
      env: { attack: 0.02, hold: 0.1, decay: 0.05, curve: 4 }
    }
  ]
};

export default nocturne;
