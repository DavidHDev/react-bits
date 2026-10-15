export const LOOK = {
  beamWidth: 140,
  rotation: 30,
  waveLength: 233,
  depth: 1,
  sharpness: 0.6,
  twist: 0,
  fillLight: 0.3,
  glow: 0.6
};

export const DEFAULT_PROPS = {
  preset: 'studio',
  color: '#ffffff',
  ...LOOK,
  speed: 1,
  brightness: 1.6,
  grain: 0.35,
  variation: 0,
  mouseInteraction: true,
  mouseStrength: 1,
  fade: 0,
  opacity: 1,
  intro: true,
  lightMode: false
};

export const PRESETS = {
  studio: { ...LOOK, color: '#ffffff' },
  ember: { ...LOOK, color: '#ff8a4c', rotation: 20, glow: 0.85, fillLight: 0.2 },
  glacier: { ...LOOK, color: '#8fd0ff', beamWidth: 90, rotation: 45, sharpness: 0.75, fillLight: 0.4 },
  chrome: { ...LOOK, sharpness: 0.8, depth: 1.2, fillLight: 0.9, glow: 0.4, rotation: 35 },
  dawn: { ...LOOK, color: '#ffd59a', rotation: -30, waveLength: 320, twist: 0.4, glow: 0.7 }
};

export const PRESET_OPTIONS = [
  { value: 'studio', label: 'Studio' },
  { value: 'ember', label: 'Ember' },
  { value: 'glacier', label: 'Glacier' },
  { value: 'chrome', label: 'Chrome' },
  { value: 'dawn', label: 'Dawn' }
];

export const presetProps = (value, { defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value]
  };
};
