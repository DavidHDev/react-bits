export const DEFAULT_PROPS = {
  preset: 'classic',
  color: '#8099cc',
  hueShift: 0,
  saturation: 1,
  brightness: 1.5,
  contrast: 1,
  speed: 1,
  scale: 1,
  detail: 8,
  warp: 1,
  rotation: 0,
  mouseReact: true,
  amplitude: 0.1,
  stir: 0.5,
  sheen: 0.3,
  clickSwirl: true,
  grain: 0,
  fade: 0
};

export const PRESETS = {
  classic: {},
  pearl: { color: '#ffffff', saturation: 0.55, brightness: 1, contrast: 0.85, scale: 1.4 },
  chrome: { color: '#ffffff', saturation: 0, contrast: 2.2, brightness: 0.55, detail: 12 },
  graphite: { color: '#ffffff', saturation: 0, contrast: 3, brightness: 0.35, detail: 9, scale: 0.9 },
  oil: { color: '#ffffff', saturation: 1.4, brightness: 0.35, contrast: 2.2, detail: 12, scale: 1.3 }
};

export const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'pearl', label: 'Pearl' },
  { value: 'chrome', label: 'Chrome' },
  { value: 'graphite', label: 'Graphite' },
  { value: 'oil', label: 'Oil' }
];

export const presetProps = (value, { defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(key => [key, defaults[key]]));
  return {
    ...base,
    ...PRESETS[value]
  };
};
