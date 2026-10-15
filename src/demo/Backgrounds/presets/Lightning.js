export const SHAPE = {
  bolts: 1,
  spread: 0.6,
  branches: 0.5,
  xOffset: 0,
  angle: 0,
  size: 1,
  thickness: 1,
  glow: 1,
  intensity: 1,
  speed: 1,
  flicker: 0.6,
  fade: 0
};

export const PRESETS = {
  bolt: { ...SHAPE },
  storm: { ...SHAPE, bolts: 3, spread: 0.8, branches: 0.8, flicker: 0.85, glow: 0.9 },
  arc: { ...SHAPE, angle: 90, branches: 0.2, speed: 2.2, size: 1.3, glow: 0.75, flicker: 0.9 },
  calm: { ...SHAPE, branches: 0.25, speed: 0.45, flicker: 0.15, glow: 1.35, fade: 0.4 },
  fine: { ...SHAPE, size: 1.8, thickness: 0.7, glow: 0.65, branches: 1, xOffset: 0.35 }
};

export const PRESET_OPTIONS = [
  { value: 'bolt', label: 'Bolt' },
  { value: 'storm', label: 'Storm' },
  { value: 'arc', label: 'Arc' },
  { value: 'calm', label: 'Calm' },
  { value: 'fine', label: 'Fine' }
];

export const presetProps = (value, { defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(SHAPE).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value]
  };
};
