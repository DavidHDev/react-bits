export const MOTION = {
  speed: 1,
  speed1: 0.05,
  speed2: 0.05,
  dir2: 1,
  bend1: 1,
  bend2: 0.5,
  thickness: 0.3,
  glow: 1
};

export const DEFAULT_PROPS = {
  preset: 'plasma',
  colors: ['#A855F7', '#06B6D4'],
  ...MOTION,
  focalLength: 1.25,
  rotationDeg: 0,
  brightness: 1,
  core: 0.6,
  grain: 0.03,
  fade: 0,
  opacity: 1,
  quality: 1,
  mouseInteraction: true,
  intro: true,
  lightMode: false
};

export const PRESETS = {
  plasma: { ...MOTION, colors: ['#A855F7', '#06B6D4'] },
  ember: { ...MOTION, colors: ['#ff8a3d', '#ff2d6f'] },
  glacier: { ...MOTION, colors: ['#93c5fd', '#e0f2fe'], glow: 0.9 },
  mono: { ...MOTION, colors: ['#ffffff', '#a1a1aa'], glow: 0.6 },
  storm: { ...MOTION, colors: ['#A855F7', '#06B6D4'], speed: 1.8, bend1: 1.5, bend2: 1, thickness: 0.34, glow: 1.3 },
  calm: { ...MOTION, colors: ['#A855F7', '#06B6D4'], speed: 0.6, bend1: 0.7, bend2: 0.35, thickness: 0.24, glow: 0.8 }
};

export const LIGHT_COLORS = {
  plasma: { colors: ['#8B2CFF', '#00CFF5'] },
  ember: { colors: ['#ff7a00', '#e8175d'] },
  glacier: { colors: ['#1d4ed8', '#0891b2'] },
  mono: { colors: ['#27272a', '#71717a'] },
  storm: { colors: ['#8B2CFF', '#00CFF5'] },
  calm: { colors: ['#8B2CFF', '#00CFF5'] }
};

export const PRESET_OPTIONS = [
  { value: 'plasma', label: 'Plasma' },
  { value: 'ember', label: 'Ember' },
  { value: 'glacier', label: 'Glacier' },
  { value: 'mono', label: 'Mono' },
  { value: 'storm', label: 'Storm' },
  { value: 'calm', label: 'Calm' }
];

export const presetProps = (value, { light = false, defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(name => [name, defaults[name]]));
  const tone = light ? LIGHT_COLORS[value] : {};
  return {
    ...base,
    ...PRESETS[value],
    ...tone
  };
};
