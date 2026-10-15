export const CLASSIC_COLORS = ['#9c43fe', '#4cc2e9', '#101499'];

export const LOOK = {
  size: 1,
  glow: 1,
  bleed: 1,
  wobble: 1,
  highlight: 1,
  trail: 1,
  tiltX: 0,
  tiltY: 0,
  speed: 1
};

export const DEFAULT_PROPS = {
  preset: 'classic',
  colors: CLASSIC_COLORS,
  hue: 0,
  ...LOOK,
  hoverIntensity: 1,
  backgroundColor: '#000000',
  rotateOnHover: true,
  forceHoverState: false,
  followCursor: true,
  clickPulse: true,
  intro: true
};

export const PRESETS = {
  classic: { ...LOOK, colors: CLASSIC_COLORS },
  ember: { ...LOOK, hue: 0, colors: ['#ff6a3d', '#ffc35c', '#4a1206'], glow: 1.2 },
  mint: { ...LOOK, hue: 0, colors: ['#2ee6b0', '#8be9ff', '#063b3a'], wobble: 1.5, speed: 0.8 },
  mono: { ...LOOK, hue: 0, colors: ['#ffffff', '#8d8d99', '#17171c'], highlight: 1.2 },
  halo: { ...LOOK, colors: CLASSIC_COLORS, tiltX: 62, size: 1.35, glow: 1.4, trail: 2, wobble: 0.5, speed: 0.7 },
  comet: { ...LOOK, colors: CLASSIC_COLORS, trail: 2.6, highlight: 1.6, speed: 1.4 }
};

export const LIGHT_COLORS = { mono: ['#18181b', '#71717a', '#d4d4d8'] };

export const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'ember', label: 'Ember' },
  { value: 'mint', label: 'Mint' },
  { value: 'mono', label: 'Mono' },
  { value: 'halo', label: 'Halo' },
  { value: 'comet', label: 'Comet' }
];

export const presetProps = (value, { light = false, defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(name => [name, defaults[name]]));
  const colors = light && LIGHT_COLORS[value] ? LIGHT_COLORS[value] : PRESETS[value].colors;
  return {
    ...base,
    ...PRESETS[value],
    colors
  };
};
