export const LOOK = {
  colors: ['#3847ff', '#7c84ff', '#c7cbff'],
  shape: 'lens',
  thickness: 30,
  length: 1.4,
  spread: 18,
  stiffness: 0.5,
  bounce: 0.5,
  wave: 0,
  softness: 0,
  opacity: 1,
  fade: false
};

export const PRESETS = {
  layers: LOOK,
  solo: { ...LOOK, colors: ['#3847ff'], length: 1 },
  comet: {
    ...LOOK,
    colors: ['#3847ff', '#5d67ff', '#8890ff', '#b6bbff'],
    shape: 'comet',
    thickness: 26,
    length: 2.2,
    spread: 14,
    fade: true
  },
  glow: { ...LOOK, thickness: 36, length: 2.4, softness: 0.8, fade: true },
  streamers: {
    ...LOOK,
    colors: ['#1f2be0', '#3847ff', '#6670ff', '#959cff', '#c7cbff'],
    shape: 'even',
    thickness: 10,
    length: 2.4,
    spread: 14,
    bounce: 0.7,
    wave: 0.5
  }
};

export const PRESET_OPTIONS = [
  { value: 'layers', label: 'Layers' },
  { value: 'solo', label: 'Solo' },
  { value: 'comet', label: 'Comet' },
  { value: 'glow', label: 'Glow' },
  { value: 'streamers', label: 'Streamers' }
];

export const presetProps = (value, { defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value]
  };
};
