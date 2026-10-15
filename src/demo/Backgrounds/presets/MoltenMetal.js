export const LOOK = {
  colors: ['#5227FF', '#FF9FFC'],
  coreColor: '#FFFFFF',
  lightMode: false,
  speed: 0.35,
  scale: 4,
  detail: 3,
  glow: 1.6,
  thickness: 1,
  swirl: 1,
  turbulence: 0.2,
  haze: 0.75,
  brightness: 1.3,
  colorMode: 'molten',
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  grain: 0.05,
  opacity: 1
};

export const PRESETS = {
  classic: {},
  forge: {
    colors: ['#9a3412', '#fb923c'],
    coreColor: '#fff7ed',
    colorMode: 'ember',
    speed: 0.3,
    thickness: 1.1,
    haze: 0.8,
    grain: 0.06
  },
  mercury: {
    colors: ['#71717a', '#e4e4e7'],
    coreColor: '#ffffff',
    speed: 0.25,
    scale: 3.2,
    detail: 4,
    glow: 1.8,
    thickness: 0.9,
    turbulence: 0.24,
    haze: 0.6,
    brightness: 1.5,
    grain: 0.03
  },
  tide: {
    colors: ['#0e7490', '#5eead4'],
    coreColor: '#f0fdfa',
    colorMode: 'frost',
    speed: 0.3,
    scale: 4.5,
    detail: 4,
    glow: 1.5,
    swirl: 1.3,
    haze: 0.85
  },
  vortex: {
    scale: 2.6,
    detail: 5,
    glow: 1.5,
    swirl: 1.8,
    turbulence: 0.3
  }
};

export const LIGHT_SWAP = {
  classic: { lightMode: true, colors: ['#8b5cf6', '#c026d3'], coreColor: '#7e22ce' },
  forge: { lightMode: true, colors: ['#fb923c', '#ea580c'], coreColor: '#b91c1c', haze: 0.65 },
  mercury: { lightMode: true, colors: ['#a1a1aa', '#52525b'], coreColor: '#3f3f46', haze: 0.45, brightness: 1.3 },
  tide: { lightMode: true, colors: ['#2dd4bf', '#0d9488'], coreColor: '#115e59', haze: 0.7, glow: 1.3 },
  vortex: { lightMode: true, colors: ['#8b5cf6', '#c026d3'], coreColor: '#7e22ce', haze: 0.55, glow: 1.3 }
};

export const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'forge', label: 'Forge' },
  { value: 'mercury', label: 'Mercury' },
  { value: 'tide', label: 'Tide' },
  { value: 'vortex', label: 'Vortex' }
];

export const presetProps = (value, { light = false } = {}) => {
  return {
    ...LOOK,
    ...PRESETS[value],
    ...(light ? LIGHT_SWAP[value] : null)
  };
};
