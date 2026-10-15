export const LOOK = {
  color: '#B497CF',
  accentColor: '#B497CF',
  variant: 'square',
  pixelSize: 3,
  patternScale: 2,
  patternDensity: 1,
  pixelSizeJitter: 0,
  softness: 0.6,
  smoothing: 1,
  glow: 0.4,
  twinkle: 0.25,
  speed: 0.5,
  drift: 0.2,
  driftAngle: 30,
  hoverEffect: 'reveal',
  hoverRadius: 140,
  enableRipples: true,
  rippleSpeed: 0.3,
  rippleThickness: 0.1,
  rippleIntensityScale: 1,
  autoRipple: 0,
  edgeFade: 0.25,
  tiltX: 0,
  tiltY: 0
};

export const PRESETS = {
  blast: {},
  classic: {
    softness: 0,
    smoothing: 0,
    glow: 0,
    twinkle: 0,
    drift: 0,
    hoverEffect: 'none'
  },
  mono: {
    color: '#71717A',
    accentColor: '#F4F4F5',
    pixelSize: 2,
    patternScale: 2.6,
    patternDensity: 1.1,
    glow: 0.3,
    hoverEffect: 'grow'
  },
  ember: {
    color: '#9A3412',
    accentColor: '#FDBA74',
    patternScale: 1.6,
    patternDensity: 1.15,
    glow: 0.6,
    twinkle: 0.4,
    drift: 0.35,
    driftAngle: 90
  },
  dots: {
    color: '#7DD3FC',
    accentColor: '#E0F2FE',
    variant: 'circle',
    pixelSize: 7,
    pixelSizeJitter: 0.5,
    patternScale: 2.4,
    patternDensity: 1.25,
    softness: 1,
    glow: 0.3
  },
  stars: {
    color: '#A1A1AA',
    accentColor: '#FDE68A',
    variant: 'cross',
    pixelSize: 6,
    pixelSizeJitter: 0.6,
    patternScale: 3,
    patternDensity: 1.1,
    twinkle: 0.75,
    glow: 0.2,
    speed: 0.3,
    hoverEffect: 'grow'
  },
  horizon: {
    pixelSize: 3,
    patternDensity: 1.1,
    drift: 0.6,
    driftAngle: 90,
    edgeFade: 0.15,
    tiltX: 58
  },
  storm: {
    color: '#818CF8',
    accentColor: '#E0E7FF',
    patternScale: 2.4,
    speed: 1,
    glow: 0.5,
    autoRipple: 1.6,
    rippleSpeed: 0.45,
    rippleIntensityScale: 1.4,
    hoverEffect: 'grow'
  }
};

export const LIGHT_SWAP = {
  blast: { color: '#6D28D9', accentColor: '#6D28D9' },
  classic: { color: '#6D28D9', accentColor: '#6D28D9' },
  mono: { color: '#A1A1AA', accentColor: '#18181B' },
  ember: { color: '#FDBA74', accentColor: '#C2410C' },
  dots: { color: '#38BDF8', accentColor: '#0369A1' },
  stars: { color: '#A1A1AA', accentColor: '#D97706' },
  horizon: { color: '#6D28D9', accentColor: '#6D28D9' },
  storm: { color: '#818CF8', accentColor: '#3730A3' }
};

export const PRESET_OPTIONS = [
  { value: 'blast', label: 'Blast' },
  { value: 'classic', label: 'Classic' },
  { value: 'mono', label: 'Mono' },
  { value: 'ember', label: 'Ember' },
  { value: 'dots', label: 'Dots' },
  { value: 'stars', label: 'Stars' },
  { value: 'horizon', label: 'Horizon' },
  { value: 'storm', label: 'Storm' }
];

export const presetProps = (value, { light = false } = {}) => {
  return {
    ...LOOK,
    ...PRESETS[value],
    ...(light ? LIGHT_SWAP[value] : null)
  };
};
