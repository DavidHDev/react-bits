export const LOOK = {
  color1: '#5227FF',
  color2: '#FF9FFC',
  color3: '#FFFFFF',
  speed: 0.5,
  sweepSpeed: 0.25,
  sweepWidth: 1.6,
  trail: 0.5,
  reverse: false,
  scale: 1.5,
  frequency: 2,
  ripple: 0.22,
  bandDensity: 11,
  lineWidth: 1.2,
  glow: 0.6,
  scanDirection: 'vertical',
  colorSpread: 0.7,
  brightness: 1,
  vignette: 0.3
};

export const PRESETS = {
  scanner: {},
  phosphor: { color1: '#14532d', color2: '#4ade80', color3: '#ecfccb', trail: 0.9, ripple: 0.14, colorSpread: 0.2 },
  ember: { color1: '#7c2d12', color2: '#fb923c', color3: '#fff7ed', speed: 0.7, ripple: 0.32 },
  ice: { color1: '#1e3a8a', color2: '#60a5fa', color3: '#ffffff', scanDirection: 'diagonal', sweepSpeed: 0.3 },
  mono: { color1: '#3f3f46', color2: '#d4d4d8', color3: '#ffffff', colorSpread: 0 },
  dense: { bandDensity: 26, lineWidth: 0.8, glow: 0.4, ripple: 0.14, frequency: 1.6 },
  storm: { ripple: 0.6, frequency: 3, speed: 1.2, sweepSpeed: 0.6, sweepWidth: 1, colorSpread: 0.9 },
  calm: { speed: 0.22, sweepSpeed: 0.12, ripple: 0.12, trail: 0.95, glow: 0.8 }
};

export const LIGHT_SWAP = {
  scanner: { color1: '#5b21b6', color2: '#be185d', color3: '#18181b' },
  phosphor: { color1: '#166534', color2: '#16a34a', color3: '#052e16' },
  ember: { color1: '#9a3412', color2: '#ea580c', color3: '#431407' },
  ice: { color1: '#1e40af', color2: '#2563eb', color3: '#172554' },
  mono: { color1: '#a1a1aa', color2: '#52525b', color3: '#18181b' },
  dense: { color1: '#5b21b6', color2: '#be185d', color3: '#18181b' },
  storm: { color1: '#5b21b6', color2: '#be185d', color3: '#18181b' },
  calm: { color1: '#5b21b6', color2: '#be185d', color3: '#18181b' }
};

export const PRESET_OPTIONS = [
  { value: 'scanner', label: 'Scanner' },
  { value: 'phosphor', label: 'Phosphor' },
  { value: 'ember', label: 'Ember' },
  { value: 'ice', label: 'Ice' },
  { value: 'mono', label: 'Mono' },
  { value: 'dense', label: 'Dense' },
  { value: 'storm', label: 'Storm' },
  { value: 'calm', label: 'Calm' }
];

export const presetProps = (value, { light = false, defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value],
    ...(light ? LIGHT_SWAP[value] : null)
  };
};
