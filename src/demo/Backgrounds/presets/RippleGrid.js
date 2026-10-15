export const SHAPE = {
  variant: 'lines',
  cellSize: 48,
  lineWidth: 1,
  glow: 0.6,
  rippleStrength: 1,
  rippleSpeed: 1,
  rippleSize: 1,
  autoRipple: 'center',
  rippleInterval: 2.6,
  tilt: 0,
  rotation: 0,
  fade: 0.5
};

export const DEFAULT_PROPS = {
  preset: 'pulse',
  color: '#ffffff',
  ...SHAPE,
  opacity: 1,
  mouseInteraction: true,
  clickRipple: true,
  intro: true,
  lightMode: false
};

export const PRESETS = {
  pulse: { ...SHAPE },
  floor: { ...SHAPE, tilt: 62, cellSize: 56, autoRipple: 'random', rippleInterval: 1.6, fade: 0.35 },
  dots: { ...SHAPE, variant: 'dots', cellSize: 32, glow: 0.4 },
  cross: { ...SHAPE, variant: 'cross', cellSize: 56, lineWidth: 1.5 },
  calm: { ...SHAPE, autoRipple: 'none', rippleStrength: 0.8, glow: 0.4 }
};

export const PRESET_OPTIONS = [
  { value: 'pulse', label: 'Pulse' },
  { value: 'floor', label: 'Floor' },
  { value: 'dots', label: 'Dots' },
  { value: 'cross', label: 'Cross' },
  { value: 'calm', label: 'Calm' }
];

export const presetProps = (value, { defaults = {}, props = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value],
    color: props.color
  };
};
