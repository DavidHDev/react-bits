const deep = {
  duration: 9.5,
  seed: 326,
  loudness: -21,
  lowpass: 1200,
  highpass: 30,
  width: 0.8,
  reverb: { mix: 0.35, decay: 2.5, predelay: 0.01, damp: 1200 },
  layers: [
    {
      type: 'noise',
      color: 'brown',
      filter: { type: 'lowpass', freq: 350, q: 0.6 },
      env: { attack: 2, hold: 5.5, decay: 2, curve: 3 }
    },
    {
      type: 'tone',
      freq: 73.42,
      vibrato: { rate: 0.3, depth: 30 },
      gain: -6,
      env: { attack: 2, hold: 5.5, decay: 2, curve: 3 }
    },
    {
      type: 'tone',
      freq: { from: 476.9639, to: 858.535, time: 0.054, curve: 1.6 },
      at: 2.0765,
      gain: -7.7333,
      pan: 0.4057,
      env: { attack: 0.002, decay: 0.06, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 282.5305, to: 508.5549, time: 0.054, curve: 1.6 },
      at: 2.9999,
      gain: -10.4939,
      pan: -0.4438,
      env: { attack: 0.002, decay: 0.06, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 475.6521, to: 856.1738, time: 0.054, curve: 1.6 },
      at: 4.4554,
      gain: -7.4289,
      pan: 0.2073,
      env: { attack: 0.002, decay: 0.06, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 538.52, to: 969.336, time: 0.054, curve: 1.6 },
      at: 5.2898,
      gain: -9.0101,
      pan: -0.4318,
      env: { attack: 0.002, decay: 0.06, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 430.8754, to: 775.5757, time: 0.054, curve: 1.6 },
      at: 6.6522,
      gain: -10.8621,
      pan: -0.0698,
      env: { attack: 0.002, decay: 0.06, curve: 5 }
    },
    {
      type: 'tone',
      freq: { from: 495.5835, to: 892.0503, time: 0.054, curve: 1.6 },
      at: 7.8999,
      gain: -11.3879,
      pan: 0.3074,
      env: { attack: 0.002, decay: 0.06, curve: 5 }
    }
  ]
};

export default deep;
