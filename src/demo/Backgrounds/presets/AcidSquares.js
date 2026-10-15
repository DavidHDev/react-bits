export const LOOK = {
  accentColor: '#ff4fb8',
  secondaryColor: '#3b6bff',
  tileSize: 1,
  gap: 0.12,
  roundness: 0.25,
  softness: 0.5,
  bulge: 0.3,
  rotation: 35,
  gloss: 0.6,
  waves: 1,
  waveScale: 1,
  speed: 0.6,
  shape: 'square',
  pulse: 1,
  pulseSpeed: 0.45,
  pulseSpacing: 1,
  pulseWidth: 1,
  pulseOrigin: 'center',
  lighting: 'split',
  brightness: 1,
  tilt: 0.7,
  zoom: 1,
  grain: 0.12
};

export const DEFAULT_PROPS = {
  preset: 'neon',
  color: '#120f17',
  ...LOOK,
  depth: 10,
  fade: 0,
  opacity: 1,
  intro: true,
  mouseInteraction: true,
  hoverEffect: 'press',
  mouseStrength: 1,
  mouseRadius: 0.35,
  pulseOnClick: true,
  detail: 'medium',
  lightMode: false
};

export const PRESETS = {
  neon: {},
  acid: { accentColor: '#c6ff3d', secondaryColor: '#2b6cff', roundness: 0.12, softness: 0.35, gloss: 0.7 },
  graphite: {
    accentColor: '#ffffff',
    secondaryColor: '#8b93a7',
    lighting: 'backlit',
    gloss: 0.95,
    bulge: 0,
    softness: 0.25,
    roundness: 0.12,
    gap: 0.08,
    tilt: 0.85,
    waves: 0.8
  },
  pixel: {
    accentColor: '#7cf7ff',
    secondaryColor: '#8b5cf6',
    tilt: 0.05,
    tileSize: 0.45,
    gap: 0.16,
    roundness: 0.3,
    waves: 0.35,
    waveScale: 0.7,
    shape: 'round',
    pulse: 1.4,
    pulseWidth: 0.7,
    rotation: 0
  },
  cushion: {
    accentColor: '#ffb38a',
    secondaryColor: '#9c7bff',
    lighting: 'overhead',
    tileSize: 1.8,
    gap: 0.1,
    roundness: 0.65,
    softness: 1,
    bulge: 1,
    gloss: 0.3,
    speed: 0.35,
    waves: 0.7,
    waveScale: 1.6
  },
  ember: {
    accentColor: '#ff7a1a',
    secondaryColor: '#d61f45',
    waves: 1.25,
    waveScale: 0.8,
    tilt: 0.8,
    grain: 0.2,
    gloss: 0.55,
    rotation: 15
  },
  glacier: {
    accentColor: '#8ff3ff',
    secondaryColor: '#3355ff',
    lighting: 'overhead',
    rotation: 0,
    gap: 0.2,
    roundness: 0.2,
    pulseOrigin: 'random',
    shape: 'round',
    waves: 0.6
  }
};

export const LIGHT_SWAP = {
  neon: { accentColor: '#ec4899', secondaryColor: '#4f46e5' },
  acid: { accentColor: '#65a30d', secondaryColor: '#2563eb' },
  graphite: { accentColor: '#71717a', secondaryColor: '#a1a1aa' },
  pixel: { accentColor: '#0891b2', secondaryColor: '#7c3aed' },
  cushion: { accentColor: '#f97316', secondaryColor: '#8b5cf6' },
  ember: { accentColor: '#ea580c', secondaryColor: '#be123c' },
  glacier: { accentColor: '#0ea5e9', secondaryColor: '#4338ca' }
};

export const PRESET_OPTIONS = [
  { value: 'neon', label: 'Neon' },
  { value: 'acid', label: 'Acid' },
  { value: 'graphite', label: 'Graphite' },
  { value: 'pixel', label: 'Pixel' },
  { value: 'cushion', label: 'Cushion' },
  { value: 'ember', label: 'Ember' },
  { value: 'glacier', label: 'Glacier' }
];

export const presetProps = (value, { light = false, defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(LOOK).map(key => [key, defaults[key] ?? LOOK[key]]));
  return {
    ...base,
    ...PRESETS[value],
    ...(light ? LIGHT_SWAP[value] : null)
  };
};
