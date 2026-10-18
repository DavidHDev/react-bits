const signed = (value, unit = '') => `${value > 0 ? '+' : ''}${value}${unit}`;
const percent = value => signed(Math.round(value * 100), '%');

export const TUNE = [
  { key: 'pitch', label: 'Pitch', min: -12, max: 12, step: 0.5, fallback: 0, format: value => signed(value, ' st') },
  { key: 'tone', label: 'Tone', min: -1, max: 1, step: 0.01, fallback: 0, format: percent },
  {
    key: 'length',
    label: 'Length',
    min: 0.5,
    max: 2,
    step: 0.01,
    fallback: 1,
    format: value => `${value.toFixed(2)}×`
  },
  { key: 'space', label: 'Space', min: -1, max: 1, step: 0.01, fallback: 0, format: percent },
  { key: 'punch', label: 'Punch', min: -1, max: 1, step: 0.01, fallback: 0, format: percent }
];

export const PLAYBACK = [
  {
    key: 'variation',
    label: 'Variation',
    min: 0,
    max: 1,
    step: 0.01,
    fallback: 0,
    format: value => `${Math.round(value * 100)}%`
  },
  { key: 'volume', label: 'Volume', min: -24, max: 6, step: 0.5, fallback: 0, format: value => signed(value, ' dB') }
];

const share = value => `${Math.round(value * 100)}%`;

const frequency = value =>
  value >= 1000 ? `${Number((value / 1000).toFixed(value >= 10000 ? 0 : 1))} kHz` : `${Math.round(value)} Hz`;

export const EFFECTS = [
  {
    key: 'reverb',
    label: 'Reverb',
    hint: 'Room and air',
    controls: [
      { key: 'mix', label: 'Mix', min: 0, max: 1, step: 0.01, fallback: 0.25, format: share },
      {
        key: 'decay',
        label: 'Decay',
        min: 0.3,
        max: 6,
        step: 0.1,
        fallback: 1.4,
        format: value => `${value.toFixed(1)} s`
      },
      { key: 'tone', label: 'Tone', min: -1, max: 1, step: 0.01, fallback: 0, format: percent }
    ]
  },
  {
    key: 'echo',
    label: 'Echo',
    hint: 'Fading repeats',
    controls: [
      {
        key: 'time',
        label: 'Time',
        min: 0.03,
        max: 1,
        step: 0.01,
        fallback: 0.24,
        format: value => `${Math.round(value * 1000)} ms`
      },
      { key: 'feedback', label: 'Feedback', min: 0, max: 0.9, step: 0.01, fallback: 0.35, format: share },
      { key: 'mix', label: 'Mix', min: 0, max: 1, step: 0.01, fallback: 0.25, format: share },
      { key: 'tone', label: 'Tone', min: -1, max: 1, step: 0.01, fallback: 0, format: percent },
      { key: 'pingPong', label: 'Ping-pong', type: 'switch', fallback: false }
    ]
  },
  {
    key: 'filter',
    label: 'Filter',
    hint: 'Shape the tone',
    controls: [
      {
        key: 'type',
        label: 'Type',
        type: 'choice',
        fallback: 'lowpass',
        options: [
          { value: 'lowpass', label: 'Low', long: 'Low-pass' },
          { value: 'highpass', label: 'High', long: 'High-pass' },
          { value: 'bandpass', label: 'Band', long: 'Band-pass' }
        ]
      },
      { key: 'cutoff', label: 'Cutoff', scale: 'log', min: 80, max: 16000, fallback: 1000, format: frequency },
      { key: 'resonance', label: 'Resonance', min: 0, max: 1, step: 0.01, fallback: 0.4, format: share },
      { key: 'sweep', label: 'Sweep', min: -1, max: 1, step: 0.01, fallback: 0, format: percent }
    ]
  },
  {
    key: 'chorus',
    label: 'Chorus',
    hint: 'Lush, wide shimmer',
    controls: [
      { key: 'mix', label: 'Mix', min: 0, max: 1, step: 0.01, fallback: 0.5, format: share },
      {
        key: 'rate',
        label: 'Rate',
        min: 0.1,
        max: 4,
        step: 0.05,
        fallback: 0.9,
        format: value => `${value.toFixed(2)} Hz`
      },
      { key: 'depth', label: 'Depth', min: 0, max: 1, step: 0.01, fallback: 0.5, format: share }
    ]
  },
  {
    key: 'lofi',
    label: 'Lo-fi',
    hint: 'Crunchy retro grit',
    controls: [
      { key: 'bits', label: 'Bits', min: 2, max: 12, step: 1, fallback: 5, format: value => `${value}-bit` },
      { key: 'rate', label: 'Rate', scale: 'log', min: 1000, max: 24000, fallback: 6000, format: frequency },
      { key: 'mix', label: 'Mix', min: 0, max: 1, step: 0.01, fallback: 0.7, format: share }
    ]
  }
];

export const EFFECT_KEYS = EFFECTS.map(effect => effect.key);

export const effectDefaults = effect =>
  Object.fromEntries(effect.controls.map(control => [control.key, control.fallback]));
