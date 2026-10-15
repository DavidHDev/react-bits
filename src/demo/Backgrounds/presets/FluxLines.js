export const LOOK = {
  colors: ['#ffffff', '#ffffff', '#ffffff'],
  speed: 0.5,
  scale: 1.6,
  turbulence: 1,
  fluidity: 0.1,
  rimWidth: 0.2,
  sharpness: 2.5,
  shimmer: 1.5,
  glow: 2,
  lineWidth: 1,
  flowDirection: 'down',
  mouseStrength: 1,
  mouseRadius: 0.35
};

export const DEFAULT_PROPS = {
  preset: 'classic',
  ...LOOK,
  mouseInteraction: true,
  clickSwirl: true,
  intro: true,
  lightMode: false
};

export const PRESETS = {
  classic: { ...LOOK },
  ember: { ...LOOK, colors: ['#ffd29a', '#ff8a4c', '#ffb36b'] },
  glacier: { ...LOOK, colors: ['#e3f3ff', '#7cc4ff', '#ffffff'] },
  calm: { ...LOOK, speed: 0.25, turbulence: 0.6, shimmer: 1, glow: 1.6 },
  storm: { ...LOOK, speed: 1.1, turbulence: 1.8, sharpness: 2, glow: 2.4 },
  filament: { ...LOOK, rimWidth: 0.12, sharpness: 1.6, glow: 2.4, lineWidth: 1.2, shimmer: 0.6 },
  dense: { ...LOOK, scale: 1, glow: 2.4, shimmer: 1.3 }
};

export const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'ember', label: 'Ember' },
  { value: 'glacier', label: 'Glacier' },
  { value: 'calm', label: 'Calm' },
  { value: 'storm', label: 'Storm' },
  { value: 'filament', label: 'Filament' },
  { value: 'dense', label: 'Dense' }
];

export const presetProps = (value, { defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value]
  };
};
