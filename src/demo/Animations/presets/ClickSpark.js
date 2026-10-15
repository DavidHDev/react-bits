export const LOOK = {
  sparkColor: ['#ffffff'],
  shape: 'line',
  easing: 'ease-out',
  sparkCount: 8,
  sparkSize: 14,
  sparkWidth: 2,
  sparkRadius: 30,
  duration: 500,
  randomness: 0.2,
  gravity: 0,
  spread: 360,
  direction: 0,
  glow: 0,
  ring: false
};

export const PRESETS = {
  classic: {},
  comet: { shape: 'streak', sparkCount: 12, sparkSize: 16, sparkRadius: 44, duration: 650, glow: 0.5 },
  confetti: {
    shape: 'dot',
    sparkColor: ['#f43f5e', '#f59e0b', '#22c55e', '#3b82f6', '#14b8a6'],
    sparkCount: 16,
    sparkWidth: 2.5,
    sparkRadius: 52,
    duration: 900,
    randomness: 0.8,
    gravity: 0.5
  },
  sparkle: {
    shape: 'star',
    sparkColor: ['#fde68a', '#fbbf24', '#ffffff'],
    sparkCount: 6,
    sparkSize: 16,
    sparkRadius: 36,
    duration: 800,
    randomness: 0.6
  },
  fountain: {
    shape: 'streak',
    sparkColor: ['#7dd3fc', '#ffffff'],
    sparkCount: 12,
    sparkRadius: 70,
    duration: 900,
    randomness: 0.5,
    gravity: 1,
    spread: 80
  },
  pop: { shape: 'dot', sparkCount: 10, sparkWidth: 2.5, sparkRadius: 22, duration: 380, ring: true, easing: 'spring' }
};

export const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'comet', label: 'Comet' },
  { value: 'confetti', label: 'Confetti' },
  { value: 'sparkle', label: 'Sparkle' },
  { value: 'fountain', label: 'Fountain' },
  { value: 'pop', label: 'Pop' }
];

export const presetProps = (value, { defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value]
  };
};
