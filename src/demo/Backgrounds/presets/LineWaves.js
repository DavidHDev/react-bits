export const LOOK = {
  color1: '#ffffff',
  color2: '#ffffff',
  color3: '#ffffff',
  colorCycleSpeed: 1,
  speed: 0.3,
  lineCount: 72,
  lineWidth: 1.3,
  glow: 0.6,
  brightness: 1,
  highlight: 1,
  highlightWidth: 1,
  warpIntensity: 1,
  warpScale: 1,
  rotation: -33
};

export const PRESETS = {
  silk: {},
  gold: { color1: '#ffd9a0', color2: '#ffb45e', color3: '#fff0d6' },
  arctic: { color1: '#cfe9ff', color2: '#7cc0ff', color3: '#eef8ff' },
  aurora: { color1: '#8ff0d0', color2: '#7aa8ff', color3: '#5fd3e6' },
  engraving: { lineCount: 130, lineWidth: 0.8, glow: 0.25 },
  ribbon: { lineCount: 34, lineWidth: 3, glow: 0.9 },
  storm: { speed: 0.55, warpIntensity: 1.6, warpScale: 0.8 },
  calm: { speed: 0.15, warpIntensity: 0.6, highlightWidth: 1.8 }
};

export const PRESET_OPTIONS = [
  { value: 'silk', label: 'Silk' },
  { value: 'gold', label: 'Gold' },
  { value: 'arctic', label: 'Arctic' },
  { value: 'aurora', label: 'Aurora' },
  { value: 'engraving', label: 'Engraving' },
  { value: 'ribbon', label: 'Ribbon' },
  { value: 'storm', label: 'Storm' },
  { value: 'calm', label: 'Calm' }
];

export const presetProps = (value, { defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value]
  };
};
