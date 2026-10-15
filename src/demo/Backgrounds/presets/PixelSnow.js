export const SNOWFALL = {
  variant: 'snowflake',
  density: 0.5,
  speed: 1,
  wind: 0.25,
  sway: 0.5,
  flakeSize: 1,
  pixelSize: 3,
  glow: 0.8,
  twinkle: 0.35,
  accumulate: false
};

export const DEFAULT_PROPS = {
  preset: 'snowfall',
  color: '#ffffff',
  ...SNOWFALL,
  depth: 0.6,
  brightness: 1,
  fade: 0,
  opacity: 1,
  mouseInteraction: true,
  intro: true,
  lightMode: false
};

export const PRESETS = {
  snowfall: SNOWFALL,
  calm: { ...SNOWFALL, density: 0.3, speed: 0.55, wind: 0, sway: 0.9, flakeSize: 1.3 },
  blizzard: { ...SNOWFALL, density: 1, speed: 2.2, wind: 1.4, sway: 0.2, flakeSize: 0.8, twinkle: 0.15 },
  drift: { ...SNOWFALL, density: 0.6, accumulate: true },
  retro: { ...SNOWFALL, variant: 'square', pixelSize: 5, glow: 0.3, twinkle: 0, sway: 0.3 }
};

export const PRESET_OPTIONS = [
  { value: 'snowfall', label: 'Snowfall' },
  { value: 'calm', label: 'Calm' },
  { value: 'blizzard', label: 'Blizzard' },
  { value: 'drift', label: 'Drift' },
  { value: 'retro', label: 'Retro' }
];

export const presetProps = (value, { defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value]
  };
};
