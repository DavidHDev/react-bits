export const SHAPE = {
  speed: 0.5,
  scale: 1,
  rotation: 0,
  flow: 1,
  warp: 0,
  variation: 0,
  sheen: 0,
  glow: 0.4
};

export const DEFAULT_PROPS = {
  preset: 'veil',
  color: '#6b12ff',
  ...SHAPE,
  brightness: 1,
  grain: 0.03,
  quality: 0.5,
  fade: 0,
  opacity: 1,
  mouseInteraction: true,
  mouseStrength: 1,
  intro: true,
  lightMode: false
};

export const PRESETS = {
  veil: { ...SHAPE, color: '#6b12ff' },
  ember: { ...SHAPE, color: '#ff4d1a', variation: 3 },
  jade: { ...SHAPE, color: '#10b981', variation: 7, rotation: 180, glow: 0.6 },
  silver: { ...SHAPE, color: '#b4b4c4', glow: 0.2 },
  storm: { ...SHAPE, color: '#3d5afe', speed: 1, flow: 2.2, warp: 0.6, variation: 5 }
};

export const PRESET_OPTIONS = [
  { value: 'veil', label: 'Veil' },
  { value: 'ember', label: 'Ember' },
  { value: 'jade', label: 'Jade' },
  { value: 'silver', label: 'Silver' },
  { value: 'storm', label: 'Storm' }
];

export const presetProps = (value, { defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value]
  };
};
