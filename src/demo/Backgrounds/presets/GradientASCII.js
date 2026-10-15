export const LOOK = {
  colors: ['#1e3fd8', '#f6f8ff', '#a5d8ff', '#38bdf8'],
  shape: 'horizon',
  characters: ' =+xX0S8#@',
  cellSize: 18,
  density: 0.8,
  glyphOpacity: 0.85,
  glow: 0.2,
  depthOfField: 0,
  flicker: 0.2,
  softness: 0.5,
  scale: 1,
  flow: 0.5,
  speed: 1,
  gradientOpacity: 0.9,
  grain: 0.08
};

export const PRESETS = {
  atmosphere: {},
  lagoon: { shape: 'pinch', colors: ['#0d9488', '#5eead4', '#f0fdfa'], characters: ' .:-=+*#%@', cellSize: 16 },
  rose: { shape: 'rise', colors: ['#9f1239', '#f43f5e', '#fda4af', '#fff1f2'], cellSize: 22 },
  corona: { shape: 'eclipse', colors: ['#78350f', '#f59e0b', '#fffbeb'], characters: ' 01', cellSize: 15 }
};

export const LIGHT_SWAP = {
  atmosphere: { colors: ['#4f8ff7', '#e8f0ff', '#b4d0ff', '#7cb4fb'] },
  lagoon: { colors: ['#99f6e4', '#5eead4', '#2dd4bf'] },
  rose: { colors: ['#fecdd3', '#fda4af', '#fb7185', '#f43f5e'] },
  corona: { colors: ['#fde68a', '#fcd34d', '#f59e0b'] }
};

export const PRESET_OPTIONS = [
  { value: 'atmosphere', label: 'Atmosphere' },
  { value: 'lagoon', label: 'Lagoon' },
  { value: 'rose', label: 'Rose' },
  { value: 'corona', label: 'Corona' }
];

export const presetProps = (value, { light = false, defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value],
    ...(light ? LIGHT_SWAP[value] : null)
  };
};
