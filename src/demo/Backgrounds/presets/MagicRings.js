export const LOOK = {
  color: '#A855F7',
  colorTwo: '#6366F1',
  motion: 'pulse',
  ringCount: 6,
  speed: 1,
  lineThickness: 2,
  glow: 1,
  baseRadius: 0.35,
  radiusStep: 0.1,
  expansion: 0.1,
  taper: 1.5,
  rotation: 0,
  spin: 0,
  tilt: 0,
  dispersion: 0,
  grain: 0
};

export const PRESETS = {
  portal: {},
  halo: {
    color: '#ffffff',
    colorTwo: '#a1a1aa',
    motion: 'breathe',
    ringCount: 5,
    lineThickness: 1.5,
    glow: 0.6,
    taper: 1.25
  },
  ripple: { color: '#22d3ee', colorTwo: '#3b82f6', motion: 'ripple', ringCount: 7, radiusStep: 0.09 },
  prism: {
    color: '#ffffff',
    colorTwo: '#e0e7ff',
    motion: 'breathe',
    lineThickness: 1.5,
    glow: 0.6,
    dispersion: 0.6
  },
  gyro: { color: '#fcd34d', colorTwo: '#f97316', ringCount: 4, taper: 1.1, spin: 0.8, tilt: 60 },
  eclipse: {
    color: '#ffffff',
    colorTwo: '#fb923c',
    motion: 'breathe',
    ringCount: 3,
    lineThickness: 1.5,
    glow: 1.3,
    baseRadius: 0.3,
    radiusStep: 0.05,
    taper: 1
  }
};

export const PRESET_OPTIONS = [
  { value: 'portal', label: 'Portal' },
  { value: 'halo', label: 'Halo' },
  { value: 'ripple', label: 'Ripple' },
  { value: 'prism', label: 'Prism' },
  { value: 'gyro', label: 'Gyro' },
  { value: 'eclipse', label: 'Eclipse' }
];

export const LIGHT_SWAP = {
  portal: { color: '#7c3aed', colorTwo: '#4f46e5' },
  halo: { color: '#3f3f46', colorTwo: '#71717a' },
  ripple: { color: '#0891b2', colorTwo: '#2563eb' },
  prism: { color: '#3f3f46', colorTwo: '#52525b' },
  gyro: { color: '#d97706', colorTwo: '#ea580c' },
  eclipse: { color: '#3f3f46', colorTwo: '#c2410c' }
};

export const presetProps = (value, { light = false, defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value],
    ...(light ? LIGHT_SWAP[value] : null)
  };
};
