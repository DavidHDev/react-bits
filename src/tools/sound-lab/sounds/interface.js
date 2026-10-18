import {
  blip,
  bell,
  bubble,
  chord,
  fmbell,
  glass,
  hz,
  keys,
  knock,
  pluck,
  room,
  round,
  scatter,
  sweep,
  tine,
  vibe,
  wood
} from './kit.js';
import { KEYCAP, THOCK } from './samples.js';

export const INTERFACE = [
  {
    id: 'pebble',
    name: 'Pebble',
    category: 'tap',
    description: 'A soft, rounded tap for primary buttons.',
    tags: 'click button press primary tap',
    recipe: {
      duration: 0.16,
      seed: 11,
      loudness: -18,
      lowpass: 7000,
      ...room(0.08, 0.3),
      layers: [
        blip(560, 380, { decay: 0.075, glide: 0.028 }),
        blip(1120, 820, { gain: -19, decay: 0.03, glide: 0.02 }),
        knock(1150, { gain: -21, decay: 0.007 })
      ]
    }
  },
  {
    id: 'felt',
    name: 'Felt',
    category: 'tap',
    description: 'A muted, padded press for quiet buttons.',
    tags: 'click button soft secondary muted',
    recipe: {
      duration: 0.14,
      seed: 12,
      loudness: -19,
      lowpass: 3800,
      ...room(0.05, 0.22, { damp: 3500 }),
      layers: [
        {
          ...blip(250, 175, { decay: 0.07, glide: 0.04, attack: 0.003, wave: 'triangle' }),
          filter: { type: 'lowpass', freq: 800, q: 0.6 }
        },
        knock(620, { gain: -12, decay: 0.022, attack: 0.002, q: 0.7 })
      ]
    }
  },
  {
    id: 'nib',
    name: 'Nib',
    category: 'tap',
    description: 'A tiny, gentle tick for small controls.',
    tags: 'tick click small stepper icon',
    recipe: {
      duration: 0.08,
      seed: 13,
      loudness: -21,
      lowpass: 8000,
      ...room(0.06, 0.18),
      layers: [
        blip(1240, 980, { decay: 0.028, glide: 0.008, attack: 0.0015 }),
        blip(620, 560, { gain: -15, decay: 0.02, glide: 0.006, attack: 0.0015 })
      ]
    }
  },
  {
    id: 'dew',
    name: 'Dew',
    category: 'tap',
    description: 'A round, liquid pop that lifts as it lands.',
    tags: 'drop water bubble pop tap',
    recipe: {
      duration: 0.18,
      seed: 14,
      loudness: -19,
      lowpass: 6500,
      ...room(0.1, 0.32),
      layers: [
        {
          type: 'tone',
          freq: { from: 380, to: 820, time: 0.045, curve: 2 },
          env: { attack: 0.003, decay: 0.07, curve: 5 }
        },
        {
          type: 'tone',
          freq: { from: 190, to: 410, time: 0.045, curve: 2 },
          gain: -17,
          env: { attack: 0.003, decay: 0.045, curve: 5 }
        }
      ]
    }
  },
  {
    id: 'bead',
    name: 'Bead',
    category: 'select',
    description: 'A small, glassy ping for picking an item.',
    tags: 'select chip pick choose glass',
    recipe: {
      duration: 0.22,
      seed: 21,
      loudness: -20,
      lowpass: 9000,
      ...room(0.12, 0.45, { damp: 6000 }),
      layers: [glass(hz(81), { decay: 0.17, bright: 0.9 })]
    }
  },
  {
    id: 'notch',
    name: 'Notch',
    category: 'select',
    description: 'A soft detent for steppers, sliders and tabs.',
    tags: 'detent tick slider stepper segmented tab',
    recipe: {
      duration: 0.06,
      seed: 22,
      loudness: -21,
      lowpass: 7000,
      ...room(0.04, 0.14),
      layers: [
        blip(920, 780, { decay: 0.022, glide: 0.006, attack: 0.0012 }),
        knock(1350, { gain: -14, decay: 0.006, attack: 0.0012, q: 1 }),
        blip(380, 360, { gain: -17, decay: 0.02 })
      ]
    }
  },
  {
    id: 'halo',
    name: 'Halo',
    category: 'select',
    description: 'A warm confirm for choosing a card.',
    tags: 'select card choose highlight soft',
    recipe: {
      duration: 0.36,
      seed: 23,
      loudness: -19,
      lowpass: 7500,
      ...room(0.18, 0.6, { damp: 5500 }),
      layers: [
        {
          type: 'tone',
          freq: { from: hz(76), to: hz(76) * 1.03, time: 0.08 },
          fm: { ratio: 2, index: { from: 0.35, to: 0, time: 0.12 } },
          env: { attack: 0.006, decay: 0.26, curve: 5 }
        },
        { type: 'tone', freq: hz(83), at: 0.014, gain: -17, env: { attack: 0.006, decay: 0.16, curve: 5 } }
      ]
    }
  },
  {
    id: 'clasp',
    name: 'Clasp',
    category: 'toggle',
    description: 'A soft two step click that turns a switch on.',
    tags: 'toggle switch on enable',
    recipe: {
      duration: 0.12,
      seed: 31,
      loudness: -19,
      lowpass: 7000,
      ...room(0.06, 0.22),
      layers: [
        blip(500, 420, { decay: 0.028, glide: 0.012 }),
        knock(1100, { gain: -17, decay: 0.006 }),
        blip(700, 610, { at: 0.045, decay: 0.035, glide: 0.012 }),
        knock(1450, { at: 0.045, gain: -19, decay: 0.006 })
      ]
    }
  },
  {
    id: 'unclasp',
    name: 'Unclasp',
    category: 'toggle',
    description: 'The matching release that turns it off.',
    tags: 'toggle switch off disable',
    recipe: {
      duration: 0.12,
      seed: 32,
      loudness: -19,
      lowpass: 7000,
      ...room(0.06, 0.22),
      layers: [
        blip(680, 600, { decay: 0.026, glide: 0.012 }),
        knock(1400, { gain: -18, decay: 0.006 }),
        blip(470, 390, { at: 0.045, decay: 0.035, glide: 0.014 }),
        knock(1000, { at: 0.045, gain: -17, decay: 0.006 })
      ]
    }
  },
  {
    id: 'check',
    name: 'Check',
    category: 'toggle',
    description: 'A light wooden tock for checkboxes.',
    tags: 'checkbox check tick select',
    recipe: {
      duration: 0.1,
      seed: 33,
      loudness: -20,
      lowpass: 7000,
      ...room(0.06, 0.2),
      layers: [wood(hz(79), { decay: 0.055 }), knock(1600, { gain: -20, decay: 0.004, attack: 0.0008 })]
    }
  },
  {
    id: 'bloom',
    name: 'Bloom',
    category: 'feedback',
    description: 'Two warm notes that rise into a success.',
    tags: 'success done complete confirm positive',
    recipe: {
      duration: 0.95,
      seed: 41,
      loudness: -17,
      lowpass: 7500,
      ...room(0.16, 0.8, { damp: 5500 }),
      layers: [
        bell(hz(74), { decay: 0.5 }),
        bell(hz(81), { at: 0.09, decay: 0.75 }),
        bell(hz(93), { at: 0.09, gain: -22, decay: 0.4, bright: 0.5 })
      ]
    }
  },
  {
    id: 'crest',
    name: 'Crest',
    category: 'feedback',
    description: 'A brighter four note lift for bigger wins.',
    tags: 'success achievement celebrate win level up',
    recipe: {
      duration: 1.15,
      seed: 42,
      loudness: -17,
      lowpass: 8000,
      ...room(0.2, 0.95, { damp: 6000 }),
      layers: [
        bell(hz(74), { decay: 0.4 }),
        bell(hz(78), { at: 0.075, decay: 0.45 }),
        bell(hz(81), { at: 0.15, decay: 0.6 }),
        bell(hz(86), { at: 0.225, decay: 0.85, gain: -3 })
      ]
    }
  },
  {
    id: 'shrug',
    name: 'Shrug',
    category: 'feedback',
    description: 'A gentle falling pair that says not quite.',
    tags: 'error fail invalid wrong negative',
    recipe: {
      duration: 0.55,
      seed: 43,
      loudness: -18,
      lowpass: 5500,
      ...room(0.12, 0.5, { damp: 4500 }),
      layers: [
        bell(hz(76), { decay: 0.22, attack: 0.006, bright: 0.6 }),
        bell(hz(72), { at: 0.12, decay: 0.32, attack: 0.006, bright: 0.6 })
      ]
    }
  },
  {
    id: 'nudge',
    name: 'Nudge',
    category: 'feedback',
    description: 'A soft double tap that asks for attention.',
    tags: 'warning attention alert caution',
    recipe: {
      duration: 0.3,
      seed: 44,
      loudness: -19,
      lowpass: 6500,
      ...room(0.1, 0.35),
      layers: [wood(hz(76), { decay: 0.09 }), wood(hz(76), { at: 0.11, decay: 0.12 })]
    }
  },
  {
    id: 'chime',
    name: 'Chime',
    category: 'notify',
    description: 'Three soft bells for a new notification.',
    tags: 'notification alert bell message incoming',
    recipe: {
      duration: 1.5,
      seed: 51,
      loudness: -17,
      lowpass: 8000,
      ...room(0.2, 1.1, { damp: 6000 }),
      layers: [
        bell(hz(76), { decay: 0.8, pan: -0.15 }),
        bell(hz(80), { at: 0.11, decay: 0.9, pan: 0.1 }),
        bell(hz(83), { at: 0.22, decay: 1.2 })
      ]
    }
  },
  {
    id: 'lantern',
    name: 'Lantern',
    category: 'notify',
    description: 'A mellow wooden pair for calm reminders.',
    tags: 'reminder notification calm marimba',
    recipe: {
      duration: 0.9,
      seed: 52,
      loudness: -17,
      lowpass: 6000,
      ...room(0.14, 0.7, { damp: 5000 }),
      layers: [wood(hz(69), { decay: 0.45 }), wood(hz(74), { at: 0.16, decay: 0.55 })]
    }
  },
  {
    id: 'ping',
    name: 'Ping',
    category: 'notify',
    description: 'One clear bell with a quiet tail.',
    tags: 'notification bell single alert',
    recipe: {
      duration: 1.2,
      seed: 53,
      loudness: -17,
      lowpass: 8000,
      ...room(0.2, 1.2, { damp: 6000 }),
      layers: [bell(hz(81), { decay: 1.1, bright: 0.8 })]
    }
  },
  {
    id: 'ripple',
    name: 'Ripple',
    category: 'notify',
    description: 'Two round blips for an incoming message.',
    tags: 'message chat incoming notification',
    recipe: {
      duration: 0.3,
      seed: 54,
      loudness: -18,
      lowpass: 7000,
      ...room(0.12, 0.45),
      layers: [
        {
          type: 'tone',
          freq: { from: 560, to: 700, time: 0.03, curve: 2 },
          env: { attack: 0.003, decay: 0.08, curve: 5 }
        },
        {
          type: 'tone',
          freq: { from: 720, to: 900, time: 0.03, curve: 2 },
          at: 0.095,
          env: { attack: 0.003, decay: 0.09, curve: 5 }
        }
      ]
    }
  },
  {
    id: 'swish',
    name: 'Swish',
    category: 'motion',
    description: 'A short, airy swipe for sliding panels.',
    tags: 'swipe slide carousel panel transition',
    recipe: {
      duration: 0.24,
      seed: 61,
      loudness: -19,
      lowpass: 6000,
      highpass: 180,
      ...room(0.08, 0.3),
      layers: [
        {
          type: 'noise',
          color: 'pink',
          pan: { from: -0.4, to: 0.4, time: 0.22 },
          filter: { type: 'bandpass', freq: { from: 650, to: 1700, time: 0.2, curve: 2 }, q: 0.9 },
          env: { attack: 0.07, rise: 1.6, decay: 0.15, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'breeze',
    name: 'Breeze',
    category: 'motion',
    description: 'A soft rise for opening a sheet or modal.',
    tags: 'open modal sheet drawer expand',
    recipe: {
      duration: 0.48,
      seed: 62,
      loudness: -19,
      lowpass: 6000,
      highpass: 150,
      ...room(0.12, 0.5),
      layers: [
        {
          type: 'noise',
          color: 'pink',
          filter: { type: 'bandpass', freq: { from: 500, to: 1600, time: 0.36, curve: 2 }, q: 0.8 },
          env: { attack: 0.22, rise: 1.8, decay: 0.2, curve: 4 }
        },
        {
          type: 'tone',
          freq: { from: 330, to: 440, time: 0.3, curve: 2 },
          gain: -15,
          env: { attack: 0.16, rise: 1.6, decay: 0.2, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'sweep',
    name: 'Sweep',
    category: 'motion',
    description: 'A falling breath for closing and dismissing.',
    tags: 'close dismiss collapse hide',
    recipe: {
      duration: 0.42,
      seed: 63,
      loudness: -19,
      lowpass: 5500,
      highpass: 150,
      ...room(0.1, 0.45),
      layers: [
        {
          type: 'noise',
          color: 'pink',
          filter: { type: 'bandpass', freq: { from: 1600, to: 450, time: 0.32, curve: 2 }, q: 0.8 },
          env: { attack: 0.03, rise: 1.2, decay: 0.33, curve: 4 }
        },
        {
          type: 'tone',
          freq: { from: 440, to: 300, time: 0.26, curve: 2 },
          gain: -16,
          env: { attack: 0.02, decay: 0.24, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'glide',
    name: 'Glide',
    category: 'motion',
    description: 'A smooth, rounded slide for tab changes.',
    tags: 'tab segmented switch page navigation',
    recipe: {
      duration: 0.16,
      seed: 64,
      loudness: -20,
      lowpass: 7000,
      highpass: 200,
      ...room(0.06, 0.25),
      layers: [
        {
          type: 'noise',
          color: 'pink',
          filter: { type: 'bandpass', freq: { from: 1000, to: 1800, time: 0.1, curve: 2 }, q: 0.9 },
          env: { attack: 0.04, rise: 1.5, decay: 0.08, curve: 4 }
        },
        blip(600, 680, { at: 0.03, gain: -8, decay: 0.06, glide: 0.03, attack: 0.004 })
      ]
    }
  },
  {
    id: 'keycap',
    name: 'Keycap',
    category: 'type',
    description: 'Real laptop key presses, a different take on every keystroke.',
    tags: 'keyboard typing key input laptop recorded real',
    recipe: {
      duration: 0.1,
      seed: 71,
      loudness: -24,
      highpass: 160,
      lowpass: 9500,
      ...room(0.04, 0.15),
      layers: [{ type: 'sample', ...KEYCAP, env: { attack: 0.0012, hold: 0.07, decay: 0.02, curve: 4 } }]
    }
  },
  {
    id: 'chiclet',
    name: 'Chiclet',
    category: 'type',
    description: 'Light, low-profile key taps like a modern laptop.',
    tags: 'keyboard typing key laptop chiclet light soft recorded real',
    recipe: {
      duration: 0.08,
      seed: 73,
      loudness: -25,
      highpass: 300,
      lowpass: 6500,
      ...room(0.03, 0.12),
      layers: [{ type: 'sample', ...KEYCAP, pitch: 2, env: { attack: 0.0016, hold: 0.03, decay: 0.025, curve: 5 } }]
    }
  },
  {
    id: 'thock',
    name: 'Thock',
    category: 'type',
    description: 'Deeper real key presses with a rounded, muted body.',
    tags: 'keyboard typing key input deep recorded real',
    recipe: {
      duration: 0.11,
      seed: 72,
      loudness: -22.5,
      highpass: 110,
      lowpass: 6500,
      ...room(0.05, 0.18),
      layers: [{ type: 'sample', ...THOCK, env: { attack: 0.002, hold: 0.08, decay: 0.02, curve: 4 } }]
    }
  },
  {
    id: 'dawn',
    name: 'Dawn',
    category: 'system',
    description: 'A rising glow for power on and connect.',
    tags: 'power on connect start wake',
    recipe: {
      duration: 0.9,
      seed: 81,
      loudness: -17,
      lowpass: 7000,
      ...room(0.22, 1, { damp: 5500 }),
      layers: [
        {
          type: 'tone',
          wave: 'triangle',
          freq: { from: hz(67), to: hz(72), time: 0.3, curve: 2 },
          filter: { type: 'lowpass', freq: { from: 900, to: 4500, time: 0.35 }, q: 0.6 },
          env: { attack: 0.12, rise: 1.4, decay: 0.6, curve: 4 }
        },
        {
          type: 'tone',
          freq: { from: hz(74), to: hz(79), time: 0.3, curve: 2 },
          gain: -9,
          env: { attack: 0.14, rise: 1.4, decay: 0.55, curve: 4 }
        },
        { type: 'tone', freq: hz(84), at: 0.18, gain: -20, env: { attack: 0.08, decay: 0.5, curve: 5 } }
      ]
    }
  },
  {
    id: 'dusk',
    name: 'Dusk',
    category: 'system',
    description: 'A falling fade for power off and disconnect.',
    tags: 'power off disconnect stop sleep',
    recipe: {
      duration: 0.85,
      seed: 82,
      loudness: -18,
      lowpass: 6000,
      ...room(0.2, 0.9, { damp: 5000 }),
      layers: [
        {
          type: 'tone',
          wave: 'triangle',
          freq: { from: hz(72), to: hz(67), time: 0.4, curve: 2 },
          filter: { type: 'lowpass', freq: { from: 4500, to: 800, time: 0.5 }, q: 0.6 },
          env: { attack: 0.02, decay: 0.7, curve: 4 }
        },
        {
          type: 'tone',
          freq: { from: hz(79), to: hz(74), time: 0.4, curve: 2 },
          gain: -10,
          env: { attack: 0.02, decay: 0.55, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'seal',
    name: 'Seal',
    category: 'system',
    description: 'A soft, settled click for save and lock.',
    tags: 'save lock done confirm',
    recipe: {
      duration: 0.14,
      seed: 83,
      loudness: -19,
      lowpass: 6500,
      ...room(0.06, 0.25),
      layers: [
        knock(1000, { gain: -8, decay: 0.01 }),
        blip(300, 220, { gain: -4, decay: 0.05, glide: 0.02 }),
        wood(hz(79), { at: 0.014, gain: -16, decay: 0.03 })
      ]
    }
  },
  {
    id: 'puff',
    name: 'Puff',
    category: 'tap',
    description: 'A breathy, toneless tap for minimal interfaces.',
    tags: 'tap click soft air breath minimal',
    recipe: {
      duration: 0.09,
      seed: 15,
      loudness: -21,
      lowpass: 4200,
      highpass: 260,
      ...room(0.06, 0.2),
      layers: [
        {
          type: 'noise',
          color: 'pink',
          filter: { type: 'bandpass', freq: { from: 1300, to: 800, time: 0.05 }, q: 0.7 },
          env: { attack: 0.004, decay: 0.05, curve: 5 }
        },
        blip(340, 280, { gain: -16, decay: 0.035, glide: 0.03, attack: 0.003 })
      ]
    }
  },
  {
    id: 'plush',
    name: 'Plush',
    category: 'tap',
    description: 'A cushioned press that springs back, for cards and large buttons.',
    tags: 'tap press card large soft cushion',
    recipe: {
      duration: 0.15,
      seed: 16,
      loudness: -19,
      lowpass: 3200,
      ...room(0.06, 0.25, { damp: 3000 }),
      layers: [
        {
          ...blip(290, 220, { decay: 0.06, glide: 0.03, attack: 0.004, wave: 'triangle' }),
          filter: { type: 'lowpass', freq: 1100, q: 0.6 }
        },
        knock(600, { gain: -15, decay: 0.02, attack: 0.003, q: 0.6 }),
        {
          ...blip(330, 400, { at: 0.075, gain: -10, decay: 0.05, glide: 0.04, attack: 0.006, wave: 'triangle' }),
          filter: { type: 'lowpass', freq: 1400, q: 0.6 }
        }
      ]
    }
  },
  {
    id: 'boop',
    name: 'Boop',
    category: 'tap',
    description: 'A playful, rubbery pop for friendly buttons.',
    tags: 'tap pop playful fun rubber cute',
    recipe: {
      duration: 0.12,
      seed: 17,
      loudness: -19,
      lowpass: 6000,
      ...room(0.06, 0.22),
      layers: [
        {
          type: 'tone',
          freq: {
            points: [
              [0, 420],
              [0.018, 640],
              [0.07, 520]
            ]
          },
          env: { attack: 0.003, decay: 0.08, curve: 5 }
        },
        {
          type: 'tone',
          freq: {
            points: [
              [0, 840],
              [0.018, 1280],
              [0.07, 1040]
            ]
          },
          gain: -18,
          env: { attack: 0.003, decay: 0.04, curve: 5 }
        }
      ]
    }
  },
  {
    id: 'tink',
    name: 'Tink',
    category: 'tap',
    description: 'A tiny metallic tap for links and icons.',
    tags: 'tap link icon metal small tick',
    recipe: {
      duration: 0.08,
      seed: 18,
      loudness: -22,
      lowpass: 8500,
      ...room(0.08, 0.25, { damp: 7000 }),
      layers: [
        {
          type: 'tone',
          freq: hz(93),
          partials: [
            [1, 1, 1],
            [2.32, 0.14, 0.45],
            [4.25, 0.04, 0.25]
          ],
          env: { attack: 0.0012, decay: 0.045, curve: 6 }
        },
        knock(3000, { gain: -26, decay: 0.002, attack: 0.0006, q: 1.2 })
      ]
    }
  },
  {
    id: 'pluck',
    name: 'Pluck',
    category: 'select',
    description: 'A soft string pluck for picking from a list.',
    tags: 'select list option pick string pluck',
    recipe: {
      duration: 0.32,
      seed: 24,
      loudness: -19,
      lowpass: 6500,
      ...room(0.1, 0.4),
      layers: [pluck(hz(74), { decay: 0.28, bright: 0.8 })]
    }
  },
  {
    id: 'dot',
    name: 'Dot',
    category: 'select',
    description: 'A pure, minimal tone for radio buttons.',
    tags: 'select radio option minimal pure tone',
    recipe: {
      duration: 0.1,
      seed: 25,
      loudness: -21,
      lowpass: 7000,
      ...room(0.08, 0.25),
      layers: [
        {
          type: 'tone',
          freq: { from: round(hz(81) * 0.985), to: hz(81), time: 0.015 },
          env: { attack: 0.002, decay: 0.07, curve: 5 }
        }
      ]
    }
  },
  {
    id: 'petal',
    name: 'Petal',
    category: 'select',
    description: 'Two light notes for picking a swatch or card.',
    tags: 'select swatch color card pick light',
    recipe: {
      duration: 0.2,
      seed: 26,
      loudness: -20,
      lowpass: 8000,
      ...room(0.12, 0.35, { damp: 6500 }),
      layers: [
        bell(hz(86), { decay: 0.09, bright: 0.4 }),
        bell(hz(93), { at: 0.035, decay: 0.12, bright: 0.3, gain: -4 })
      ]
    }
  },
  {
    id: 'marble',
    name: 'Marble',
    category: 'select',
    description: 'A smooth glassy click for carousels and pickers.',
    tags: 'select carousel picker glass click',
    recipe: {
      duration: 0.12,
      seed: 27,
      loudness: -20,
      lowpass: 8500,
      ...room(0.08, 0.3, { damp: 7000 }),
      layers: [
        glass(hz(86), { decay: 0.07, bright: 0.7 }),
        blip(1900, 1500, { gain: -14, decay: 0.012, glide: 0.02, attack: 0.001 }),
        knock(2400, { gain: -22, decay: 0.003, attack: 0.0007, q: 1.4 })
      ]
    }
  },
  {
    id: 'daylight',
    name: 'Daylight',
    category: 'toggle',
    description: 'A bright little rise for switching to light mode.',
    tags: 'toggle theme light mode sun bright',
    recipe: {
      duration: 0.38,
      seed: 34,
      loudness: -19,
      lowpass: 9000,
      ...room(0.16, 0.5, { damp: 7000 }),
      layers: [
        bell(hz(81), { decay: 0.14, bright: 0.5 }),
        bell(hz(86), { at: 0.06, decay: 0.24, bright: 0.5, gain: -2 }),
        {
          type: 'noise',
          color: 'pink',
          gain: -26,
          filter: [
            { type: 'highpass', freq: 3000, q: 0.5 },
            { type: 'lowpass', freq: 8000, q: 0.5 }
          ],
          env: { attack: 0.06, decay: 0.15, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'nightfall',
    name: 'Nightfall',
    category: 'toggle',
    description: 'A soft settle for switching to dark mode.',
    tags: 'toggle theme dark mode moon night',
    recipe: {
      duration: 0.45,
      seed: 35,
      loudness: -19.5,
      lowpass: 4500,
      ...room(0.18, 0.6, { damp: 3500 }),
      layers: [
        bell(hz(78), { decay: 0.16, bright: 0.25 }),
        bell(hz(71), { at: 0.07, decay: 0.3, bright: 0.25, gain: -1 })
      ]
    }
  },
  {
    id: 'rocker',
    name: 'Rocker',
    category: 'toggle',
    description: 'A sturdy two-part click for big switches.',
    tags: 'toggle switch rocker physical sturdy',
    recipe: {
      duration: 0.1,
      seed: 36,
      loudness: -19.5,
      lowpass: 6000,
      ...room(0.05, 0.2),
      layers: [
        knock(700, { gain: -9, decay: 0.012, attack: 0.0015, q: 0.7 }),
        {
          ...blip(240, 190, { gain: -6, decay: 0.03, glide: 0.012, attack: 0.002, wave: 'triangle' }),
          filter: { type: 'lowpass', freq: 1200, q: 0.6 }
        },
        knock(1500, { at: 0.032, gain: -12, decay: 0.006, attack: 0.001, q: 0.9 }),
        blip(820, 720, { at: 0.032, gain: -14, decay: 0.02, glide: 0.01, attack: 0.0015 })
      ]
    }
  },
  {
    id: 'spring',
    name: 'Spring',
    category: 'toggle',
    description: 'A playful springy wobble for fun toggles.',
    tags: 'toggle playful spring boing wobble fun',
    recipe: {
      duration: 0.3,
      seed: 37,
      loudness: -19,
      lowpass: 5000,
      ...room(0.08, 0.3),
      layers: [
        {
          type: 'tone',
          freq: { from: 330, to: 520, time: 0.06, curve: 2 },
          vibrato: { rate: 22, depth: 70 },
          env: { attack: 0.003, decay: 0.22, curve: 4 }
        },
        {
          type: 'tone',
          wave: 'triangle',
          freq: { from: 165, to: 260, time: 0.06, curve: 2 },
          vibrato: { rate: 22, depth: 70 },
          gain: -12,
          filter: { type: 'lowpass', freq: 1200, q: 0.6 },
          env: { attack: 0.003, decay: 0.18, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'settle',
    name: 'Settle',
    category: 'feedback',
    description: 'A single warm note that quietly says done.',
    tags: 'success done complete minimal confirm',
    recipe: {
      duration: 0.7,
      seed: 45,
      loudness: -18.5,
      lowpass: 7000,
      ...room(0.16, 0.7, { damp: 5500 }),
      layers: [
        bell(hz(74), { decay: 0.5, bright: 0.45 }),
        { type: 'tone', freq: hz(62), gain: -16, env: { attack: 0.01, decay: 0.35, curve: 5 } },
        bell(hz(81), { at: 0.004, gain: -20, decay: 0.3, bright: 0.2 })
      ]
    }
  },
  {
    id: 'shake',
    name: 'Shake',
    category: 'feedback',
    description: 'A quick muted shake for invalid input.',
    tags: 'error invalid wrong deny shake input',
    recipe: {
      duration: 0.2,
      seed: 46,
      loudness: -19,
      lowpass: 3000,
      ...room(0.06, 0.25),
      layers: [0, 0.055, 0.11].map((at, index) => ({
        ...blip(260 - index * 18, 220 - index * 18, {
          at,
          decay: 0.04,
          glide: 0.02,
          attack: 0.003,
          wave: 'triangle',
          gain: -index * 2
        }),
        filter: { type: 'lowpass', freq: 900, q: 0.6 }
      }))
    }
  },
  {
    id: 'hint',
    name: 'Hint',
    category: 'feedback',
    description: 'A neutral, airy tone for tips and info.',
    tags: 'info tip hint neutral help',
    recipe: {
      duration: 0.5,
      seed: 47,
      loudness: -19,
      lowpass: 7000,
      ...room(0.16, 0.6),
      layers: [
        {
          type: 'tone',
          freq: hz(79),
          fm: { ratio: 2, index: { from: 0.6, to: 0, time: 0.2 } },
          env: { attack: 0.012, decay: 0.38, curve: 5 }
        },
        {
          type: 'noise',
          color: 'pink',
          gain: -24,
          filter: { type: 'bandpass', freq: 2400, q: 0.8 },
          env: { attack: 0.02, decay: 0.12, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'undo',
    name: 'Undo',
    category: 'feedback',
    description: 'A soft rewind for undo and revert.',
    tags: 'undo revert back rewind cancel',
    recipe: {
      duration: 0.16,
      seed: 48,
      loudness: -20,
      lowpass: 6500,
      ...room(0.08, 0.25),
      layers: [
        {
          type: 'tone',
          freq: { from: hz(81), to: hz(74), time: 0.09, curve: 2 },
          env: { attack: 0.03, rise: 2, decay: 0.06, curve: 4 }
        },
        {
          type: 'noise',
          color: 'pink',
          gain: -16,
          filter: { type: 'bandpass', freq: { from: 2400, to: 1100, time: 0.1 }, q: 0.9 },
          env: { attack: 0.05, rise: 2, decay: 0.03, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'arrive',
    name: 'Arrive',
    category: 'notify',
    description: 'A soft vibraphone two-tone for someone joining.',
    tags: 'notification join arrive doorbell visitor',
    recipe: {
      duration: 1.3,
      seed: 55,
      loudness: -17.5,
      lowpass: 7000,
      ...room(0.2, 1, { damp: 5500 }),
      layers: [vibe(hz(79), { decay: 0.6 }), vibe(hz(74), { at: 0.2, decay: 0.9 })]
    }
  },
  {
    id: 'cue',
    name: 'Cue',
    category: 'notify',
    description: 'A gentle three-note rise for upcoming events.',
    tags: 'notification reminder event calendar upcoming',
    recipe: {
      duration: 1.2,
      seed: 56,
      loudness: -17.5,
      lowpass: 6500,
      ...room(0.18, 0.9, { damp: 5000 }),
      layers: [
        keys(hz(74), { decay: 0.5 }),
        keys(hz(78), { at: 0.11, decay: 0.55, gain: -1 }),
        keys(hz(81), { at: 0.22, decay: 0.8, gain: -2 })
      ]
    }
  },
  {
    id: 'signal',
    name: 'Signal',
    category: 'notify',
    description: 'A clear repeating pulse for time-sensitive alerts.',
    tags: 'alert urgent timer alarm notification pulse',
    recipe: {
      duration: 0.8,
      seed: 57,
      loudness: -17,
      lowpass: 8000,
      ...room(0.14, 0.5),
      layers: [
        bell(hz(81), { decay: 0.1, bright: 0.6 }),
        bell(hz(88), { at: 0.09, decay: 0.12, bright: 0.6, gain: -1 }),
        bell(hz(81), { at: 0.36, decay: 0.1, bright: 0.6, gain: -1 }),
        bell(hz(88), { at: 0.45, decay: 0.2, bright: 0.6, gain: -2 })
      ]
    }
  },
  {
    id: 'tine',
    name: 'Tine',
    category: 'notify',
    description: 'A plucked kalimba pair for friendly notifications.',
    tags: 'notification kalimba friendly soft pluck',
    recipe: {
      duration: 1.2,
      seed: 58,
      loudness: -17.5,
      lowpass: 7500,
      ...room(0.18, 0.8),
      layers: [tine(hz(74), { decay: 0.7 }), tine(hz(81), { at: 0.13, decay: 0.9 })]
    }
  },
  {
    id: 'flick',
    name: 'Flick',
    category: 'motion',
    description: 'A very short flick for swipe to dismiss.',
    tags: 'swipe dismiss flick fast gesture',
    recipe: {
      duration: 0.1,
      seed: 65,
      loudness: -21,
      lowpass: 6000,
      highpass: 300,
      ...room(0.05, 0.2),
      layers: [
        sweep({
          from: 700,
          to: 1500,
          attack: 0.025,
          decay: 0.05,
          q: 1,
          pan: { from: -0.3, to: 0.5, time: 0.08 },
          rise: 1.4,
          curve: 5
        })
      ]
    }
  },
  {
    id: 'unfold',
    name: 'Unfold',
    category: 'motion',
    description: 'A soft flutter that opens up, for expanding sections.',
    tags: 'expand accordion open unfold reveal',
    recipe: {
      duration: 0.28,
      seed: 66,
      loudness: -20,
      lowpass: 5500,
      highpass: 180,
      ...room(0.08, 0.3),
      layers: [
        {
          ...sweep({ from: 700, to: 1500, attack: 0.08, decay: 0.12 }),
          tremolo: { rate: 38, depth: 0.5 }
        },
        {
          type: 'tone',
          freq: { from: hz(69), to: hz(74), time: 0.16, curve: 2 },
          gain: -12,
          env: { attack: 0.06, rise: 1.4, decay: 0.12, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'fold',
    name: 'Fold',
    category: 'motion',
    description: 'The matching flutter that tucks away, for collapsing.',
    tags: 'collapse accordion close fold hide',
    recipe: {
      duration: 0.26,
      seed: 67,
      loudness: -20,
      lowpass: 5500,
      highpass: 180,
      ...room(0.08, 0.3),
      layers: [
        {
          ...sweep({ from: 1500, to: 650, attack: 0.02, decay: 0.16, rise: 1 }),
          tremolo: { rate: 34, depth: 0.5 }
        },
        {
          type: 'tone',
          freq: { from: hz(74), to: hz(69), time: 0.14, curve: 2 },
          gain: -12,
          env: { attack: 0.015, decay: 0.15, curve: 4 }
        },
        knock(900, { at: 0.17, gain: -20, decay: 0.01, q: 0.7 })
      ]
    }
  },
  {
    id: 'drawer',
    name: 'Drawer',
    category: 'motion',
    description: 'A sliding glide that lands with a soft stop.',
    tags: 'drawer slide sidebar panel open stop',
    recipe: {
      duration: 0.3,
      seed: 68,
      loudness: -19.5,
      lowpass: 5000,
      highpass: 120,
      ...room(0.08, 0.3),
      layers: [
        sweep({ from: 450, to: 900, attack: 0.06, hold: 0.06, decay: 0.05, q: 0.9, rise: 1.3 }),
        wood(hz(55), { at: 0.17, decay: 0.06, gain: -4 }),
        knock(700, { at: 0.17, gain: -14, decay: 0.012, q: 0.6 })
      ]
    }
  },
  {
    id: 'enter',
    name: 'Enter',
    category: 'type',
    description: 'A real key press that lands with a soft confirm.',
    tags: 'enter return submit send keyboard key recorded',
    recipe: {
      duration: 0.22,
      seed: 74,
      loudness: -22,
      highpass: 110,
      lowpass: 7000,
      ...room(0.06, 0.25),
      layers: [
        { type: 'sample', ...THOCK, env: { attack: 0.002, hold: 0.08, decay: 0.02, curve: 4 } },
        wood(hz(69), { at: 0.035, gain: -14, decay: 0.12 })
      ]
    }
  },
  {
    id: 'erase',
    name: 'Erase',
    category: 'type',
    description: 'A softer key with a little sweep, for delete and backspace.',
    tags: 'delete backspace erase remove keyboard key recorded',
    recipe: {
      duration: 0.12,
      seed: 75,
      loudness: -24,
      highpass: 180,
      lowpass: 8000,
      ...room(0.04, 0.15),
      layers: [
        { type: 'sample', ...KEYCAP, pitch: -1, env: { attack: 0.0015, hold: 0.05, decay: 0.02, curve: 4 } },
        sweep({ from: 2200, to: 900, at: 0.01, gain: -16, attack: 0.01, decay: 0.035, q: 1, curve: 5 })
      ]
    }
  },
  {
    id: 'fill',
    name: 'Fill',
    category: 'type',
    description: 'A smooth rising tick for accepting a suggestion.',
    tags: 'autocomplete suggestion accept fill complete',
    recipe: {
      duration: 0.14,
      seed: 76,
      loudness: -21,
      lowpass: 8000,
      ...room(0.08, 0.25),
      layers: [
        {
          type: 'tone',
          freq: { from: hz(81), to: hz(86), time: 0.03, curve: 2 },
          partials: [
            [1, 1, 1],
            [2.76, 0.08, 0.4]
          ],
          env: { attack: 0.002, decay: 0.09, curve: 5 }
        },
        sweep({ from: 1500, to: 3200, gain: -24, attack: 0.01, decay: 0.03, q: 1, curve: 5 })
      ]
    }
  },
  {
    id: 'release',
    name: 'Release',
    category: 'system',
    description: 'A soft click that opens into air, for unlock.',
    tags: 'unlock open release unseal',
    recipe: {
      duration: 0.35,
      seed: 84,
      loudness: -19,
      lowpass: 7500,
      ...room(0.1, 0.4),
      layers: [
        knock(1300, { gain: -12, decay: 0.006, attack: 0.001 }),
        blip(620, 560, { gain: -8, decay: 0.03, glide: 0.01 }),
        {
          type: 'tone',
          freq: { from: hz(74), to: hz(81), time: 0.12, curve: 2 },
          at: 0.04,
          gain: -6,
          env: { attack: 0.03, decay: 0.2, curve: 4 }
        },
        sweep({ from: 1200, to: 3000, at: 0.04, gain: -22, attack: 0.05, decay: 0.12 })
      ]
    }
  },
  {
    id: 'plug',
    name: 'Plug',
    category: 'system',
    description: 'A rounded click and rise for connecting a device.',
    tags: 'connect plug device charge cable attach',
    recipe: {
      duration: 0.55,
      seed: 85,
      loudness: -18.5,
      lowpass: 7000,
      ...room(0.12, 0.5),
      layers: [
        {
          ...blip(180, 150, { decay: 0.05, glide: 0.02, attack: 0.003, wave: 'triangle' }),
          filter: { type: 'lowpass', freq: 800, q: 0.6 }
        },
        knock(800, { gain: -12, decay: 0.012, q: 0.7 }),
        bell(hz(81), { at: 0.09, decay: 0.18, bright: 0.4, gain: -6 }),
        bell(hz(86), { at: 0.16, decay: 0.3, bright: 0.4, gain: -6 })
      ]
    }
  },
  {
    id: 'unplug',
    name: 'Unplug',
    category: 'system',
    description: 'The matching fall and click for disconnecting.',
    tags: 'disconnect unplug device remove detach',
    recipe: {
      duration: 0.5,
      seed: 86,
      loudness: -18.5,
      lowpass: 6500,
      ...room(0.12, 0.5),
      layers: [
        bell(hz(86), { decay: 0.16, bright: 0.4, gain: -6 }),
        bell(hz(79), { at: 0.08, decay: 0.24, bright: 0.4, gain: -6 }),
        {
          ...blip(170, 140, { at: 0.16, decay: 0.05, glide: 0.02, attack: 0.003, wave: 'triangle' }),
          filter: { type: 'lowpass', freq: 800, q: 0.6 }
        },
        knock(700, { at: 0.16, gain: -13, decay: 0.012, q: 0.7 })
      ]
    }
  },
  {
    id: 'ember',
    name: 'Ember',
    category: 'system',
    description: 'A dim, flickering tone for low battery.',
    tags: 'battery low warning dim power',
    recipe: {
      duration: 0.65,
      seed: 87,
      loudness: -19,
      lowpass: 5000,
      ...room(0.12, 0.5, { damp: 3500 }),
      layers: [
        {
          type: 'tone',
          wave: 'triangle',
          freq: hz(69),
          tremolo: { rate: 9, depth: 0.5 },
          filter: { type: 'lowpass', freq: { from: 2400, to: 500, time: 0.5 }, q: 0.7 },
          env: { attack: 0.01, decay: 0.55, curve: 3 }
        },
        { type: 'tone', freq: hz(57), gain: -9, env: { attack: 0.01, decay: 0.5, curve: 4 } }
      ]
    }
  },
  {
    id: 'advance',
    name: 'Advance',
    category: 'navigate',
    description: 'A light step up for next and forward.',
    tags: 'next forward continue step navigation',
    recipe: {
      duration: 0.2,
      seed: 201,
      loudness: -20,
      lowpass: 7500,
      ...room(0.08, 0.3),
      layers: [bell(hz(74), { decay: 0.06, bright: 0.3 }), bell(hz(81), { at: 0.055, decay: 0.1, bright: 0.3 })]
    }
  },
  {
    id: 'retreat',
    name: 'Retreat',
    category: 'navigate',
    description: 'A light step down for back and previous.',
    tags: 'back previous return step navigation',
    recipe: {
      duration: 0.2,
      seed: 202,
      loudness: -20,
      lowpass: 7000,
      ...room(0.08, 0.3),
      layers: [bell(hz(81), { decay: 0.06, bright: 0.3 }), bell(hz(74), { at: 0.055, decay: 0.1, bright: 0.3 })]
    }
  },
  {
    id: 'tab',
    name: 'Tab',
    category: 'navigate',
    description: 'A crisp little flick for switching tabs.',
    tags: 'tab switch segment navigation flick',
    recipe: {
      duration: 0.07,
      seed: 203,
      loudness: -21,
      lowpass: 7000,
      highpass: 400,
      ...room(0.05, 0.15),
      layers: [
        sweep({ from: 1400, to: 2000, attack: 0.002, decay: 0.018, q: 1.2, curve: 5 }),
        blip(hz(83), hz(83), { decay: 0.04, attack: 0.002, gain: -10 })
      ]
    }
  },
  {
    id: 'leaf',
    name: 'Leaf',
    category: 'navigate',
    description: 'A soft paper turn for pages and steps.',
    tags: 'page turn paper book next swipe',
    recipe: {
      duration: 0.34,
      seed: 204,
      loudness: -20,
      lowpass: 3200,
      highpass: 250,
      ...room(0.08, 0.3),
      layers: [
        {
          ...sweep({
            from: 600,
            top: 1200,
            to: 500,
            attack: 0.07,
            decay: 0.2,
            q: 0.8,
            rise: 1.4,
            pan: { from: 0.3, to: -0.3, time: 0.28 }
          }),
          tremolo: { rate: 26, depth: 0.55 }
        },
        knock(600, { at: 0.2, gain: -16, decay: 0.03, attack: 0.004, q: 0.8 })
      ]
    }
  },
  {
    id: 'dive',
    name: 'Dive',
    category: 'navigate',
    description: 'A quick dip for drilling into a folder.',
    tags: 'open folder drill in zoom enter navigation',
    recipe: {
      duration: 0.2,
      seed: 205,
      loudness: -20,
      lowpass: 7000,
      ...room(0.08, 0.3),
      layers: [
        {
          type: 'tone',
          freq: { from: hz(86), to: hz(74), time: 0.12, curve: 2 },
          env: { attack: 0.01, decay: 0.14, curve: 4 }
        },
        sweep({ from: 2400, to: 900, gain: -16, attack: 0.02, decay: 0.1, q: 0.9 })
      ]
    }
  },
  {
    id: 'popover',
    name: 'Popover',
    category: 'navigate',
    description: 'A tiny lift for opening menus and popovers.',
    tags: 'menu popover dropdown open tooltip',
    recipe: {
      duration: 0.1,
      seed: 206,
      loudness: -21,
      lowpass: 7000,
      ...room(0.06, 0.2),
      layers: [
        bubble(320, { decay: 0.05, rise: 2.1 }),
        sweep({ from: 900, to: 1800, gain: -20, attack: 0.012, decay: 0.04, q: 0.9, curve: 5 })
      ]
    }
  },
  {
    id: 'pickup',
    name: 'Pickup',
    category: 'drag',
    description: 'A soft lift as an item is picked up.',
    tags: 'drag pick up lift grab start',
    recipe: {
      duration: 0.22,
      seed: 211,
      loudness: -20,
      lowpass: 7000,
      ...room(0.08, 0.3),
      layers: [
        pluck(hz(76), { decay: 0.12, bright: 0.5, gain: -4 }),
        {
          type: 'tone',
          freq: { from: hz(69), to: hz(76), time: 0.08, curve: 2 },
          gain: -10,
          env: { attack: 0.02, decay: 0.1, curve: 4 }
        },
        sweep({ from: 800, to: 1800, gain: -22, attack: 0.03, decay: 0.06 })
      ]
    }
  },
  {
    id: 'place',
    name: 'Place',
    category: 'drag',
    description: 'A gentle landing as an item is placed.',
    tags: 'drag drop place land put',
    recipe: {
      duration: 0.18,
      seed: 212,
      loudness: -19.5,
      lowpass: 5000,
      ...room(0.08, 0.3),
      layers: [
        wood(hz(62), { decay: 0.08 }),
        knock(700, { gain: -14, decay: 0.015, q: 0.7 }),
        {
          type: 'tone',
          freq: { from: hz(69), to: hz(64), time: 0.06 },
          gain: -12,
          env: { attack: 0.004, decay: 0.08, curve: 5 }
        }
      ]
    }
  },
  {
    id: 'snap',
    name: 'Snap',
    category: 'drag',
    description: 'A quick pull and crisp snap onto a grid or slot.',
    tags: 'snap magnet grid align slot drop',
    recipe: {
      duration: 0.1,
      seed: 213,
      loudness: -20.5,
      lowpass: 7500,
      ...room(0.05, 0.18),
      layers: [
        {
          type: 'tone',
          freq: { from: 500, to: 1400, time: 0.025, curve: 0.6 },
          gain: -18,
          env: { attack: 0.02, rise: 2, decay: 0.006, curve: 5 }
        },
        knock(1900, { at: 0.024, gain: -9, decay: 0.004, attack: 0.0006, q: 1.2 }),
        blip(1500, 1200, { at: 0.024, gain: -12, decay: 0.02, glide: 0.006, attack: 0.001 }),
        wood(hz(76), { at: 0.024, gain: -10, decay: 0.04 })
      ]
    }
  },
  {
    id: 'shuffle',
    name: 'Shuffle',
    category: 'drag',
    description: 'A light double slide for reordering items.',
    tags: 'reorder sort shuffle list move',
    recipe: {
      duration: 0.2,
      seed: 214,
      loudness: -21,
      lowpass: 4500,
      highpass: 300,
      ...room(0.06, 0.2),
      layers: [
        sweep({ from: 700, to: 1100, attack: 0.02, decay: 0.06, q: 0.9 }),
        sweep({ from: 850, to: 1300, at: 0.07, gain: -2, attack: 0.02, decay: 0.07, q: 0.9 }),
        knock(1100, { at: 0.14, gain: -18, decay: 0.008 })
      ]
    }
  },
  {
    id: 'hover',
    name: 'Hover',
    category: 'drag',
    description: 'A faint glow when a drop target is ready.',
    tags: 'hover target ready highlight drop zone',
    recipe: {
      duration: 0.26,
      seed: 215,
      loudness: -23,
      lowpass: 8000,
      ...room(0.15, 0.45),
      layers: [
        { type: 'tone', freq: hz(88), voices: 2, detune: 9, env: { attack: 0.04, decay: 0.16, curve: 4 } },
        { type: 'tone', freq: hz(81), gain: -8, env: { attack: 0.05, decay: 0.15, curve: 4 } }
      ]
    }
  },
  {
    id: 'rebound',
    name: 'Rebound',
    category: 'drag',
    description: 'A springy return when a drag is cancelled.',
    tags: 'cancel return bounce back drag elastic',
    recipe: {
      duration: 0.22,
      seed: 216,
      loudness: -20,
      lowpass: 5000,
      ...room(0.08, 0.25),
      layers: [
        {
          type: 'tone',
          freq: {
            points: [
              [0, 520],
              [0.05, 360],
              [0.12, 430]
            ]
          },
          vibrato: { rate: 16, depth: 40 },
          env: { attack: 0.004, decay: 0.16, curve: 4 }
        },
        sweep({ from: 1500, to: 700, gain: -18, attack: 0.01, decay: 0.07, q: 0.9 })
      ]
    }
  },
  {
    id: 'stack',
    name: 'Stack',
    category: 'drag',
    description: 'A soft cascade as items stack together.',
    tags: 'stack group collect pile merge',
    recipe: {
      duration: 0.18,
      seed: 217,
      loudness: -20,
      lowpass: 6500,
      ...room(0.06, 0.22),
      layers: [0, 0.035, 0.07].map((at, index) => wood(hz(81 - index * 5), { at, decay: 0.05, gain: -index * 2 }))
    }
  },
  {
    id: 'mark',
    name: 'Mark',
    category: 'progress',
    description: 'A soft plucked tick for each completed step.',
    tags: 'step complete progress tick checklist',
    recipe: {
      duration: 0.18,
      seed: 221,
      loudness: -20,
      lowpass: 7500,
      ...room(0.08, 0.3),
      layers: [pluck(hz(86), { decay: 0.12, bright: 0.6 })]
    }
  },
  {
    id: 'pulse',
    name: 'Pulse',
    category: 'progress',
    description: 'A calm, breathing pulse while something loads.',
    tags: 'loading waiting pulse breathing progress loop',
    recipe: {
      duration: 1.2,
      seed: 222,
      loudness: -21,
      lowpass: 4000,
      ...room(0.15, 0.6),
      layers: [
        {
          type: 'tone',
          wave: 'triangle',
          freq: hz(62),
          voices: 2,
          detune: 6,
          filter: { type: 'lowpass', freq: 1200, q: 0.6 },
          env: { attack: 0.45, rise: 1.5, decay: 0.6, curve: 3 }
        },
        { type: 'tone', freq: hz(69), gain: -8, env: { attack: 0.45, rise: 1.5, decay: 0.55, curve: 3 } }
      ]
    }
  },
  {
    id: 'uplink',
    name: 'Uplink',
    category: 'progress',
    description: 'A rising breath and bright ping when an upload finishes.',
    tags: 'upload complete sent done progress',
    recipe: {
      duration: 0.75,
      seed: 223,
      loudness: -18.5,
      lowpass: 7000,
      highpass: 150,
      ...room(0.16, 0.6, { damp: 6500 }),
      layers: [
        sweep({ from: 600, to: 2000, attack: 0.16, decay: 0.05, q: 0.8, rise: 1.8 }),
        fmbell(hz(86), { at: 0.17, decay: 0.5, ratio: 2, index: 0.8 })
      ]
    }
  },
  {
    id: 'downlink',
    name: 'Downlink',
    category: 'progress',
    description: 'A falling breath that lands softly when a download finishes.',
    tags: 'download complete received saved progress',
    recipe: {
      duration: 0.75,
      seed: 224,
      loudness: -18.5,
      lowpass: 7000,
      highpass: 120,
      ...room(0.16, 0.6, { damp: 5000 }),
      layers: [
        sweep({ from: 2600, to: 500, attack: 0.04, decay: 0.16, q: 0.8 }),
        wood(hz(62), { at: 0.17, decay: 0.3, gain: -2 }),
        bell(hz(74), { at: 0.17, decay: 0.45, bright: 0.3, gain: -6 })
      ]
    }
  },
  {
    id: 'second',
    name: 'Second',
    category: 'progress',
    description: 'A dry clock tick for countdowns and timers.',
    tags: 'clock tick timer countdown second',
    recipe: {
      duration: 0.05,
      seed: 225,
      loudness: -22,
      lowpass: 7000,
      highpass: 600,
      ...room(0.04, 0.15),
      layers: [knock(2400, { gain: -6, decay: 0.003, attack: 0.0006, q: 1.1 }), wood(hz(88), { decay: 0.02, gain: -6 })]
    }
  },
  {
    id: 'summit',
    name: 'Summit',
    category: 'progress',
    description: 'A quick climbing run that blooms when everything is complete.',
    tags: 'complete finish all done celebrate summit',
    recipe: {
      duration: 1.4,
      seed: 226,
      loudness: -17,
      lowpass: 8500,
      ...room(0.2, 1.1, { damp: 6500 }),
      layers: [
        ...[74, 76, 78, 81, 83].map((midi, index) =>
          pluck(hz(midi), { at: index * 0.04, decay: 0.15, bright: 0.5, gain: -3 })
        ),
        bell(hz(86), { at: 0.2, decay: 1, bright: 0.5 }),
        bell(hz(93), { at: 0.21, decay: 0.8, bright: 0.3, gain: -6 }),
        bell(hz(78), { at: 0.22, decay: 0.9, bright: 0.3, gain: -8 })
      ]
    }
  },
  {
    id: 'orbit',
    name: 'Orbit',
    category: 'progress',
    description: 'A circling shimmer for syncing.',
    tags: 'sync refresh update circle loop',
    recipe: {
      duration: 0.6,
      seed: 227,
      loudness: -20,
      lowpass: 8000,
      ...room(0.18, 0.6),
      layers: [
        {
          type: 'tone',
          freq: hz(81),
          pan: {
            points: [
              [0, -0.6],
              [0.15, 0.6],
              [0.3, -0.6],
              [0.45, 0.6]
            ]
          },
          tremolo: { rate: 6.5, depth: 0.4 },
          env: { attack: 0.08, decay: 0.4, curve: 4 }
        },
        {
          type: 'tone',
          freq: hz(88),
          gain: -6,
          pan: {
            points: [
              [0, 0.6],
              [0.15, -0.6],
              [0.3, 0.6],
              [0.45, -0.6]
            ]
          },
          tremolo: { rate: 6.5, depth: 0.4 },
          env: { attack: 0.1, decay: 0.38, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'dispatch',
    name: 'Dispatch',
    category: 'message',
    description: 'A quick airy lift for sending a message.',
    tags: 'send message sent chat outgoing',
    recipe: {
      duration: 0.24,
      seed: 231,
      loudness: -19.5,
      lowpass: 6500,
      highpass: 200,
      ...room(0.08, 0.3),
      layers: [
        sweep({ from: 600, to: 2200, attack: 0.04, decay: 0.1, q: 0.9, pan: { from: 0, to: 0.4, time: 0.15 } }),
        {
          type: 'tone',
          freq: { from: hz(74), to: hz(86), time: 0.12, curve: 2 },
          gain: -8,
          env: { attack: 0.03, decay: 0.12, curve: 4 }
        }
      ]
    }
  },
  {
    id: 'bubble',
    name: 'Bubble',
    category: 'message',
    description: 'Two round notes for a message in an open chat.',
    tags: 'message receive chat incoming bubble',
    recipe: {
      duration: 0.3,
      seed: 232,
      loudness: -19,
      lowpass: 6500,
      ...room(0.1, 0.35),
      layers: [
        {
          type: 'tone',
          freq: { from: round(hz(76) * 0.86), to: hz(76), time: 0.02, curve: 2 },
          partials: [
            [1, 1, 1],
            [2, 0.12, 0.5]
          ],
          env: { attack: 0.003, decay: 0.07, curve: 5 }
        },
        {
          type: 'tone',
          freq: { from: round(hz(83) * 0.86), to: hz(83), time: 0.02, curve: 2 },
          at: 0.085,
          partials: [
            [1, 1, 1],
            [2, 0.12, 0.5]
          ],
          env: { attack: 0.003, decay: 0.11, curve: 5 }
        }
      ]
    }
  },
  {
    id: 'ellipsis',
    name: 'Ellipsis',
    category: 'message',
    description: 'Three faint dots for someone typing.',
    tags: 'typing indicator dots chat waiting',
    recipe: {
      duration: 0.26,
      seed: 233,
      loudness: -23,
      lowpass: 7000,
      ...room(0.1, 0.3),
      layers: [86, 88, 86].map((midi, index) =>
        blip(hz(midi), hz(midi), { at: index * 0.09, decay: 0.03, attack: 0.003, gain: -index * 1.5 })
      )
    }
  },
  {
    id: 'wink',
    name: 'Wink',
    category: 'message',
    description: 'A bright little pop for adding a reaction.',
    tags: 'reaction emoji like react pop',
    recipe: {
      duration: 0.2,
      seed: 234,
      loudness: -20,
      lowpass: 8000,
      ...room(0.1, 0.35),
      layers: [bubble(520, { decay: 0.05 }), bell(hz(93), { at: 0.035, decay: 0.12, bright: 0.3, gain: -10 })]
    }
  },
  {
    id: 'callout',
    name: 'Callout',
    category: 'message',
    description: 'A clear rising pair when you are mentioned.',
    tags: 'mention tag at reply notification',
    recipe: {
      duration: 0.8,
      seed: 235,
      loudness: -17.5,
      lowpass: 8000,
      ...room(0.16, 0.6),
      layers: [
        fmbell(hz(79), { decay: 0.25, ratio: 1, index: 0.5 }),
        fmbell(hz(86), { at: 0.1, decay: 0.45, ratio: 1, index: 0.5 })
      ]
    }
  },
  {
    id: 'receipt',
    name: 'Receipt',
    category: 'message',
    description: 'Two tiny ticks for delivered and read.',
    tags: 'delivered read receipt seen check',
    recipe: {
      duration: 0.1,
      seed: 236,
      loudness: -23,
      lowpass: 8000,
      ...room(0.06, 0.2),
      layers: [
        glass(hz(93), { decay: 0.03, bright: 0.4 }),
        glass(hz(93), { at: 0.045, decay: 0.04, bright: 0.4, gain: -2 })
      ]
    }
  },
  {
    id: 'huddle',
    name: 'Huddle',
    category: 'message',
    description: 'A warm rising chord for joining a call.',
    tags: 'call join meeting voice huddle',
    recipe: {
      duration: 1.4,
      seed: 237,
      loudness: -17.5,
      lowpass: 6500,
      ...room(0.2, 0.9),
      layers: [62, 69, 74, 78].map((midi, index) =>
        keys(hz(midi), { at: index * 0.07, decay: 0.8, gain: -index * 1.5 })
      )
    }
  },
  {
    id: 'roll',
    name: 'Roll',
    category: 'media',
    description: 'A quick spin up for starting playback.',
    tags: 'play start playback media tape',
    recipe: {
      duration: 0.18,
      seed: 241,
      loudness: -20,
      lowpass: 5000,
      ...room(0.06, 0.22),
      layers: [
        {
          type: 'tone',
          wave: 'sawtooth',
          freq: { from: 220, to: 440, time: 0.08, curve: 2 },
          filter: { type: 'lowpass', freq: 1400, q: 0.7 },
          env: { attack: 0.03, rise: 1.5, decay: 0.08, curve: 4 }
        },
        knock(1200, { gain: -16, decay: 0.006 })
      ]
    }
  },
  {
    id: 'hold',
    name: 'Hold',
    category: 'media',
    description: 'A soft spin down for pausing playback.',
    tags: 'pause stop playback media tape',
    recipe: {
      duration: 0.2,
      seed: 242,
      loudness: -20,
      lowpass: 4500,
      ...room(0.06, 0.22),
      layers: [
        {
          type: 'tone',
          wave: 'sawtooth',
          freq: { from: 440, to: 250, time: 0.12, curve: 2 },
          filter: { type: 'lowpass', freq: { from: 1400, to: 600, time: 0.12 }, q: 0.7 },
          env: { attack: 0.004, decay: 0.13, curve: 4 }
        },
        knock(900, { at: 0.11, gain: -18, decay: 0.008 })
      ]
    }
  },
  {
    id: 'tally',
    name: 'Tally',
    category: 'media',
    description: 'A clear double beep when recording starts.',
    tags: 'record start recording camera beep',
    recipe: {
      duration: 0.25,
      seed: 243,
      loudness: -19,
      lowpass: 7000,
      ...room(0.08, 0.25),
      layers: [0, 0.11].map(at => ({
        type: 'tone',
        freq: hz(81),
        at,
        partials: [
          [1, 1, 1],
          [2, 0.1, 0.6]
        ],
        env: { attack: 0.005, hold: 0.04, decay: 0.05, curve: 5 }
      }))
    }
  },
  {
    id: 'wrap',
    name: 'Wrap',
    category: 'media',
    description: 'A falling pair of beeps when recording stops.',
    tags: 'record stop recording end beep',
    recipe: {
      duration: 0.3,
      seed: 244,
      loudness: -19,
      lowpass: 7000,
      ...room(0.08, 0.25),
      layers: [
        {
          type: 'tone',
          freq: hz(81),
          partials: [
            [1, 1, 1],
            [2, 0.1, 0.6]
          ],
          env: { attack: 0.005, hold: 0.04, decay: 0.05, curve: 5 }
        },
        {
          type: 'tone',
          freq: hz(74),
          at: 0.11,
          partials: [
            [1, 1, 1],
            [2, 0.1, 0.6]
          ],
          env: { attack: 0.005, hold: 0.05, decay: 0.09, curve: 5 }
        }
      ]
    }
  },
  {
    id: 'shutter',
    name: 'Shutter',
    category: 'media',
    description: 'A soft mechanical shutter for photos and screenshots.',
    tags: 'camera photo screenshot capture shutter',
    recipe: {
      duration: 0.14,
      seed: 245,
      loudness: -19,
      lowpass: 7000,
      ...room(0.06, 0.2),
      layers: [
        knock(2000, { gain: -6, decay: 0.006, attack: 0.0006, q: 0.9 }),
        knock(900, { gain: -10, decay: 0.015, q: 0.7 }),
        {
          type: 'noise',
          color: 'pink',
          at: 0.008,
          gain: -22,
          filter: { type: 'bandpass', freq: 1800, q: 1 },
          env: { attack: 0.004, decay: 0.03, curve: 5 }
        },
        knock(1600, { at: 0.07, gain: -8, decay: 0.006, attack: 0.0006 }),
        knock(700, { at: 0.07, gain: -12, decay: 0.012 })
      ]
    }
  },
  {
    id: 'skip',
    name: 'Skip',
    category: 'media',
    description: 'A quick double flick for skipping tracks.',
    tags: 'skip next track forward media',
    recipe: {
      duration: 0.16,
      seed: 246,
      loudness: -21,
      lowpass: 5500,
      highpass: 300,
      ...room(0.05, 0.2),
      layers: [
        sweep({ from: 700, to: 1400, attack: 0.02, decay: 0.035, q: 1, curve: 5 }),
        sweep({ from: 850, to: 1700, at: 0.06, gain: -1, attack: 0.02, decay: 0.04, q: 1, curve: 5 }),
        blip(hz(83), hz(83), { at: 0.06, decay: 0.04, attack: 0.002, gain: -14 })
      ]
    }
  },
  {
    id: 'level',
    name: 'Level',
    category: 'media',
    description: 'A tiny tuned detent for volume and value steps.',
    tags: 'volume level slider step knob',
    recipe: {
      duration: 0.06,
      seed: 247,
      loudness: -22,
      lowpass: 8000,
      ...room(0.05, 0.15),
      layers: [
        {
          type: 'tone',
          freq: hz(86),
          partials: [
            [1, 1, 1],
            [2.76, 0.06, 0.4]
          ],
          env: { attack: 0.0015, decay: 0.03, curve: 6 }
        },
        knock(1800, { gain: -20, decay: 0.003, attack: 0.0007, q: 1.2 })
      ]
    }
  },
  {
    id: 'coin',
    name: 'Coin',
    category: 'delight',
    description: 'A bright two-note coin for rewards.',
    tags: 'coin reward points game collect',
    recipe: {
      duration: 0.45,
      seed: 251,
      loudness: -18.5,
      lowpass: 7000,
      ...room(0.1, 0.4),
      layers: [
        {
          type: 'tone',
          freq: hz(83),
          harmonics: [1, 0, 0.18, 0, 0.06],
          filter: { type: 'lowpass', freq: 4500, q: 0.6 },
          env: { attack: 0.002, hold: 0.04, decay: 0.03, curve: 5 }
        },
        {
          type: 'tone',
          freq: hz(88),
          at: 0.06,
          harmonics: [1, 0, 0.18, 0, 0.06],
          filter: { type: 'lowpass', freq: 5000, q: 0.6 },
          env: { attack: 0.002, decay: 0.35, curve: 5 }
        }
      ]
    }
  },
  {
    id: 'glimmer',
    name: 'Glimmer',
    category: 'delight',
    description: 'A quick sparkle for small wins.',
    tags: 'sparkle win magic shine delight',
    recipe: {
      duration: 0.6,
      seed: 252,
      loudness: -19,
      lowpass: 9000,
      highpass: 400,
      width: 0.7,
      ...room(0.25, 0.8, { damp: 7000 }),
      layers: scatter(6, 252, (index, next) =>
        glass(hz([86, 88, 90, 93, 95, 98][Math.floor(next() * 6)]), {
          at: round(index * 0.045 + next() * 0.015),
          decay: round(0.12 + next() * 0.1),
          bright: 0.4,
          gain: round(-index * 1.2 - next() * 2),
          pan: round((next() * 2 - 1) * 0.6)
        })
      )
    }
  },
  {
    id: 'upgrade',
    name: 'Upgrade',
    category: 'delight',
    description: 'A rising power-up for leveling up.',
    tags: 'level up upgrade power game achievement',
    recipe: {
      duration: 0.9,
      seed: 253,
      loudness: -17.5,
      lowpass: 7000,
      ...room(0.16, 0.7, { damp: 6000 }),
      layers: [
        {
          type: 'tone',
          wave: 'sawtooth',
          voices: 2,
          detune: 8,
          freq: { from: hz(62), to: hz(74), time: 0.3, curve: 1.5 },
          filter: { type: 'lowpass', freq: { from: 600, to: 3200, time: 0.3 }, q: 0.8 },
          gain: -10,
          env: { attack: 0.03, decay: 0.32, curve: 3 }
        },
        bell(hz(86), { at: 0.3, decay: 0.5, bright: 0.6 }),
        bell(hz(93), { at: 0.36, decay: 0.45, bright: 0.4, gain: -5 }),
        sweep({ from: 1500, to: 6000, gain: -20, attack: 0.28, decay: 0.12 })
      ]
    }
  },
  {
    id: 'confetti',
    name: 'Confetti',
    category: 'delight',
    description: 'A soft pop and a shower of sparkles for celebrations.',
    tags: 'celebrate confetti party success pop',
    recipe: {
      duration: 1.1,
      seed: 254,
      loudness: -17.5,
      lowpass: 7000,
      width: 0.8,
      ...room(0.25, 0.9, { damp: 7000 }),
      layers: [
        { ...blip(900, 300, { decay: 0.03, glide: 0.015, attack: 0.001 }), gain: -2 },
        knock(1200, { gain: -8, decay: 0.012, q: 0.6 }),
        ...scatter(9, 254, (index, next) =>
          glass(hz([81, 83, 86, 88, 90, 93][Math.floor(next() * 6)]), {
            at: round(0.04 + Math.pow(next(), 1.6) * 0.6),
            decay: round(0.06 + next() * 0.12),
            bright: 0.2,
            gain: round(-9 - next() * 8),
            pan: round((next() * 2 - 1) * 0.8)
          })
        )
      ]
    }
  },
  {
    id: 'heart',
    name: 'Heart',
    category: 'delight',
    description: 'A warm double pulse for likes and favorites.',
    tags: 'like heart favorite love react',
    recipe: {
      duration: 0.3,
      seed: 255,
      loudness: -19,
      lowpass: 5500,
      ...room(0.1, 0.35),
      layers: [
        {
          type: 'tone',
          freq: { from: round(hz(76) * 0.9), to: hz(76), time: 0.025, curve: 2 },
          partials: [
            [1, 1, 1],
            [2, 0.2, 0.5]
          ],
          env: { attack: 0.004, decay: 0.07, curve: 5 }
        },
        {
          type: 'tone',
          freq: { from: round(hz(81) * 0.9), to: hz(81), time: 0.025, curve: 2 },
          at: 0.08,
          partials: [
            [1, 1, 1],
            [2, 0.2, 0.5]
          ],
          env: { attack: 0.004, decay: 0.14, curve: 5 }
        }
      ]
    }
  },
  {
    id: 'streak',
    name: 'Streak',
    category: 'delight',
    description: 'A quick wooden run for keeping a streak.',
    tags: 'streak combo run game daily',
    recipe: {
      duration: 0.6,
      seed: 256,
      loudness: -18,
      lowpass: 7000,
      ...room(0.12, 0.5),
      layers: [74, 76, 78, 81, 83, 86].map((midi, index) =>
        wood(hz(midi), { at: index * 0.045, decay: index === 5 ? 0.35 : 0.08, gain: index === 5 ? 0 : -2 })
      )
    }
  },
  {
    id: 'treasure',
    name: 'Treasure',
    category: 'delight',
    description: 'A warm thump that opens into a shimmering chord.',
    tags: 'unlock reward chest treasure prize',
    recipe: {
      duration: 1.6,
      seed: 257,
      loudness: -17,
      lowpass: 8000,
      width: 0.8,
      ...room(0.25, 1.2, { damp: 6000 }),
      layers: [
        wood(hz(50), { decay: 0.15, gain: -4 }),
        knock(500, { gain: -12, decay: 0.03, q: 0.6 }),
        ...scatter(7, 257, (index, next) =>
          glass(hz([81, 83, 86, 88, 90, 93, 95][index]), {
            at: round(0.08 + index * 0.05 + next() * 0.01),
            decay: round(0.2 + next() * 0.15),
            bright: 0.3,
            gain: round(-8 - next() * 4),
            pan: round((next() * 2 - 1) * 0.6)
          })
        ),
        ...chord([62, 66, 69, 76], { at: 0.42, decay: 1, gain: -8, bright: 0.3 })
      ]
    }
  }
];
