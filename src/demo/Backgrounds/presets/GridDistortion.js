export const DEFAULT_PROPS = {
  preset: 'classic',
  imageSrc: '/assets/demo/night-landscape.webp',
  grid: 15,
  radius: 0.18,
  strength: 0.15,
  relaxation: 0.96,
  mode: 'drag',
  softness: 0,
  chroma: 0,
  idle: 0.3,
  clickRipple: true,
  intro: true
};

export const PRESETS = {
  classic: {},
  liquid: { softness: 1, grid: 24, strength: 0.25, relaxation: 0.95 },
  glitch: { grid: 32, radius: 0.12, strength: 0.3, relaxation: 0.9, chroma: 0.6 },
  swirl: { mode: 'swirl', grid: 20, radius: 0.28, strength: 0.25, softness: 0.5 },
  tiles: { grid: 8, radius: 0.3, strength: 0.3, relaxation: 0.97 }
};

export const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'liquid', label: 'Liquid' },
  { value: 'glitch', label: 'Glitch' },
  { value: 'swirl', label: 'Swirl' },
  { value: 'tiles', label: 'Tiles' }
];

export const presetProps = (value, { defaults = {}, props = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(key => [key, defaults[key]]));
  return {
    ...base,
    ...PRESETS[value],
    imageSrc: props.imageSrc
  };
};
