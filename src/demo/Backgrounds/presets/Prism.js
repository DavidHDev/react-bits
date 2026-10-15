export const LOOK = {
  colors: [],
  animationType: 'rotate',
  timeScale: 0.5,
  glow: 1,
  scale: 3.6,
  height: 3.5,
  baseWidth: 5.5,
  hueShift: 0,
  colorFrequency: 1,
  saturation: 1.5,
  noise: 0
};

export const DEFAULT_PROPS = {
  preset: 'classic',
  ...LOOK,
  interactive: true,
  hoverStrength: 2,
  inertia: 0.05,
  intro: true,
  resolution: 0.5,
  lightMode: false
};

export const PRESETS = {
  classic: { ...LOOK },
  mono: { ...LOOK, colors: ['#ffffff', '#a1a1aa'], saturation: 1, glow: 0.8 },
  ember: { ...LOOK, colors: ['#ff4d1a', '#ff8a3d', '#ffc078'], saturation: 1.15, glow: 0.85 },
  lagoon: { ...LOOK, colors: ['#2dd4bf', '#0ea5e9', '#a7f3d0'], saturation: 1.2, glow: 0.9, colorFrequency: 1.4 },
  spire: { ...LOOK, height: 6, baseWidth: 3.4, scale: 3.2, glow: 1.5, colorFrequency: 1.8 },
  dune: { ...LOOK, height: 2.2, baseWidth: 9, scale: 2.8, glow: 0.4, timeScale: 0.3, colorFrequency: 1.2 },
  tumble: { ...LOOK, animationType: '3drotate', timeScale: 0.6, scale: 3 },
  hover: { ...LOOK, animationType: 'hover', colorFrequency: 1.3 }
};

export const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'mono', label: 'Mono' },
  { value: 'ember', label: 'Ember' },
  { value: 'lagoon', label: 'Lagoon' },
  { value: 'spire', label: 'Spire' },
  { value: 'dune', label: 'Dune' },
  { value: 'tumble', label: 'Tumble' },
  { value: 'hover', label: 'Hover' }
];

export const presetProps = (value, { defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value]
  };
};
