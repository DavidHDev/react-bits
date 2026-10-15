export const LOOK = {
  rayColor1: '#FFC46B',
  rayColor2: '#96c8ff',
  blend: 0.6,
  origin: 'top-right',
  speed: 2.5,
  intensity: 2,
  spread: 2,
  density: 5,
  sharpness: 0.5,
  tilt: 0,
  falloff: 1.6,
  glow: 1,
  saturation: 1,
  dust: 0
};

export const PRESETS = {
  sunbeam: {},
  dawn: { rayColor1: '#ff9a62', rayColor2: '#ff6b9d', blend: 0.5 },
  moonlight: { rayColor1: '#dbe4ff', rayColor2: '#7aa2ff', blend: 0.7, intensity: 1.6, speed: 1.5 },
  spotlight: {
    rayColor1: '#ffffff',
    rayColor2: '#e0e7ff',
    origin: 'top-left',
    spread: 1.2,
    density: 3,
    sharpness: 0.75,
    glow: 1.4
  },
  cathedral: { rayColor1: '#ffe2b0', rayColor2: '#ffd28a', spread: 2.6, density: 12, sharpness: 0.8, dust: 0.5 },
  horizon: { origin: 'left', rayColor1: '#ffb36b', rayColor2: '#8b9cff', spread: 2.4, falloff: 1.2 }
};

export const PRESET_OPTIONS = [
  { value: 'sunbeam', label: 'Sunbeam' },
  { value: 'dawn', label: 'Dawn' },
  { value: 'moonlight', label: 'Moonlight' },
  { value: 'spotlight', label: 'Spotlight' },
  { value: 'cathedral', label: 'Cathedral' },
  { value: 'horizon', label: 'Horizon' }
];

export const presetProps = (value, { defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value]
  };
};
