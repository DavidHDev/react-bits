export const DEFAULT_PROPS = {
  preset: 'gallery',
  content: 'photos',
  rows: 4,
  aspectRatio: 1.33,
  gap: 16,
  radius: 14,
  angle: -12,
  tilt: 0,
  speed: 24,
  direction: 'alternate',
  parallax: 0.5,
  spotlight: 0.6,
  dim: 0.35,
  fade: 0.5,
  grayscale: false
};

export const PRESETS = {
  gallery: {},
  showcase: { tilt: 50, angle: -28, rows: 6, speed: 30, dim: 0.2, fade: 0.35 },
  mono: { grayscale: true, dim: 0.45, spotlight: 0.35 },
  posters: { aspectRatio: 0.75, rows: 3, angle: -6, gap: 12, radius: 8 },
  calm: { speed: 10, parallax: 0.2, dim: 0.6, fade: 0.75, spotlight: 0.4 },
  rush: { speed: 110, direction: 'left', angle: 0, rows: 5, parallax: 0, radius: 10 },
  words: { content: 'words', aspectRatio: 2.2, rows: 6, gap: 12, radius: 999, angle: -8, dim: 0.25 }
};

export const PRESET_OPTIONS = [
  { value: 'gallery', label: 'Gallery' },
  { value: 'showcase', label: 'Showcase' },
  { value: 'mono', label: 'Mono' },
  { value: 'posters', label: 'Posters' },
  { value: 'calm', label: 'Calm' },
  { value: 'rush', label: 'Rush' },
  { value: 'words', label: 'Words' }
];

export const presetProps = (value, { defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(key => [key, defaults[key]]));
  return {
    ...base,
    ...PRESETS[value]
  };
};
