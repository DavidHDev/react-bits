import type { Recipe } from './react-bits-sound';

const throttle: Recipe = {
  duration: 4.1,
  seed: 106,
  loudness: -15,
  lowpass: 6000,
  highpass: 35,
  reverb: { mix: 0.18, decay: 1.2, predelay: 0.01, damp: 4000 },
  layers: [
    {
      type: 'tone',
      wave: 'triangle',
      freq: 146.83,
      at: 0,
      gain: -9,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 73.42,
      at: 0,
      gain: -10,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 156.2245,
      at: 0.34,
      gain: -8.4632,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 78.1176,
      at: 0.34,
      gain: -9.5526,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 165.1923,
      at: 0.646,
      gain: -7.98,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 82.6018,
      at: 0.646,
      gain: -9.15,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 173.7027,
      at: 0.9214,
      gain: -7.5452,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 86.8573,
      at: 0.9214,
      gain: -8.7876,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 181.7363,
      at: 1.1693,
      gain: -7.1538,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 90.8743,
      at: 1.1693,
      gain: -8.4615,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 189.2837,
      at: 1.3923,
      gain: -6.8016,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 94.6483,
      at: 1.3923,
      gain: -8.168,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 196.344,
      at: 1.5931,
      gain: -6.4846,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 98.1787,
      at: 1.5931,
      gain: -7.9038,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 202.9232,
      at: 1.7738,
      gain: -6.1993,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 101.4685,
      at: 1.7738,
      gain: -7.6661,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 209.0327,
      at: 1.9364,
      gain: -5.9425,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 104.5235,
      at: 1.9364,
      gain: -7.4521,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 214.6884,
      at: 2.0828,
      gain: -5.7114,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 107.3515,
      at: 2.0828,
      gain: -7.2595,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 219.9092,
      at: 2.2145,
      gain: -5.5034,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 109.9621,
      at: 2.2145,
      gain: -7.0862,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 224.7164,
      at: 2.333,
      gain: -5.3162,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 112.3659,
      at: 2.333,
      gain: -6.9302,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 229.1327,
      at: 2.4397,
      gain: -5.1478,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 114.5742,
      at: 2.4397,
      gain: -6.7898,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 233.1815,
      at: 2.5358,
      gain: -4.9962,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 116.5987,
      at: 2.5358,
      gain: -6.6635,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 236.8866,
      at: 2.6222,
      gain: -4.8597,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 118.4514,
      at: 2.6222,
      gain: -6.5498,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 240.2714,
      at: 2.7,
      gain: -4.7369,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 120.1439,
      at: 2.7,
      gain: -6.4474,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 243.3592,
      at: 2.77,
      gain: -4.6264,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 121.6879,
      at: 2.77,
      gain: -6.3553,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 246.172,
      at: 2.833,
      gain: -4.5269,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 123.0944,
      at: 2.833,
      gain: -6.2724,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 248.7314,
      at: 2.8897,
      gain: -4.4374,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 124.3741,
      at: 2.8897,
      gain: -6.1978,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 251.0575,
      at: 2.9407,
      gain: -4.3568,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 125.5373,
      at: 2.9407,
      gain: -6.1306,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 253.3577,
      at: 2.9907,
      gain: -4.2778,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 126.6875,
      at: 2.9907,
      gain: -6.0649,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 255.679,
      at: 3.0407,
      gain: -4.1989,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 127.8482,
      at: 3.0407,
      gain: -5.9991,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 258.0216,
      at: 3.0907,
      gain: -4.1199,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 129.0196,
      at: 3.0907,
      gain: -5.9333,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 260.3856,
      at: 3.1407,
      gain: -4.041,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 130.2017,
      at: 3.1407,
      gain: -5.8675,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 262.7712,
      at: 3.1907,
      gain: -3.962,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 131.3946,
      at: 3.1907,
      gain: -5.8017,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 265.1788,
      at: 3.2407,
      gain: -3.8831,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 132.5984,
      at: 3.2407,
      gain: -5.7359,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 267.6084,
      at: 3.2907,
      gain: -3.8041,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 133.8133,
      at: 3.2907,
      gain: -5.6701,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 270.0602,
      at: 3.3407,
      gain: -3.7252,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 135.0393,
      at: 3.3407,
      gain: -5.6043,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 272.5345,
      at: 3.3907,
      gain: -3.6462,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 136.2765,
      at: 3.3907,
      gain: -5.5385,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 275.0315,
      at: 3.4407,
      gain: -3.5673,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 137.5251,
      at: 3.4407,
      gain: -5.4727,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 277.5514,
      at: 3.4907,
      gain: -3.4884,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 138.7851,
      at: 3.4907,
      gain: -5.407,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 280.0943,
      at: 3.5407,
      gain: -3.4094,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 140.0567,
      at: 3.5407,
      gain: -5.3412,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 282.6606,
      at: 3.5907,
      gain: -3.3305,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 141.3399,
      at: 3.5907,
      gain: -5.2754,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 285.2503,
      at: 3.6407,
      gain: -3.2515,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 142.6349,
      at: 3.6407,
      gain: -5.2096,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 287.8638,
      at: 3.6907,
      gain: -3.1726,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 143.9417,
      at: 3.6907,
      gain: -5.1438,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'tone',
      wave: 'triangle',
      freq: 290.5012,
      at: 3.7407,
      gain: -3.0936,
      filter: { type: 'lowpass', freq: 1800, q: 0.6 },
      env: { attack: 0.004, decay: 0.09, curve: 5 }
    },
    {
      type: 'tone',
      freq: 145.2605,
      at: 3.7407,
      gain: -5.078,
      env: { attack: 0.004, decay: 0.11, curve: 5 }
    },
    {
      type: 'noise',
      color: 'pink',
      gain: -10,
      filter: { type: 'lowpass', freq: { from: 300, to: 5000, time: 3.9, curve: 0.7 }, q: 0.6 },
      env: { attack: 3.8, rise: 2.2, decay: 0.08, curve: 3 }
    }
  ]
};

export default throttle;
