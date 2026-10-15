export const LOOK = {
  raysOrigin: 'top-center',
  raysColor: '#ffffff',
  raysSpeed: 1,
  lightSpread: 0.5,
  rayLength: 3,
  rayDensity: 1,
  tilt: 0,
  raySharpness: 0.35,
  glow: 0.6,
  haze: 0.25,
  atmosphere: 1,
  intensity: 1,
  fadeDistance: 1,
  saturation: 1,
  mouseInfluence: 0.1,
  noiseAmount: 0,
  distortion: 0,
  pulsating: false
};

export const PRESETS = {
  spotlight: {},
  sunbeam: {
    raysOrigin: 'top-left',
    tilt: -32,
    raysColor: '#FFD39A',
    lightSpread: 1,
    rayDensity: 1.3,
    glow: 0.9,
    haze: 0.45,
    atmosphere: 0,
    intensity: 1.3
  },
  stage: { lightSpread: 0.22, rayLength: 2.2, raySharpness: 0.15, glow: 1.1, haze: 0.6 },
  searchlight: { lightSpread: 0.16, raySharpness: 0.2, glow: 0.5, haze: 0.5, intensity: 1.2, mouseInfluence: 0.6 },
  cathedral: {
    raysOrigin: 'top-right',
    tilt: 25,
    lightSpread: 0.7,
    rayDensity: 1.8,
    raySharpness: 0.75,
    glow: 0.4,
    haze: 0.5,
    intensity: 1.2
  },
  underwater: {
    raysColor: '#7FE3FF',
    raysSpeed: 0.5,
    lightSpread: 1,
    rayDensity: 1.6,
    raySharpness: 0.5,
    haze: 0.5,
    atmosphere: 0.7,
    distortion: 0.12
  },
  horizon: {
    raysOrigin: 'bottom-center',
    raysColor: '#FFB070',
    lightSpread: 1.4,
    rayLength: 2,
    glow: 1,
    haze: 0.2,
    atmosphere: 0
  }
};

export const PRESET_OPTIONS = [
  { value: 'spotlight', label: 'Spotlight' },
  { value: 'sunbeam', label: 'Sunbeam' },
  { value: 'stage', label: 'Stage' },
  { value: 'searchlight', label: 'Searchlight' },
  { value: 'cathedral', label: 'Cathedral' },
  { value: 'underwater', label: 'Underwater' },
  { value: 'horizon', label: 'Horizon' }
];

export const presetProps = (value, { defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value]
  };
};
