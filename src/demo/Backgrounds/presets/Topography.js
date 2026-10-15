export const LOOK = {
  color: '#4f7cff',
  lineCount: 22,
  lineWidth: 1.2,
  majorLines: true,
  elevation: 1,
  foreground: 0.2,
  scale: 1,
  detail: 0.35,
  tilt: 32,
  speed: 0.25,
  direction: 'forward',
  morph: 0.2,
  glow: 0.6,
  depthOfField: 0.4,
  fog: 0.35,
  brightness: 1,
  hoverEffect: 'lift',
  clickEffect: 'pulse',
  markers: 'none',
  glitch: 0
};

export const PRESETS = {
  ridgeline: {},
  sonar: {
    color: '#2fe0c8',
    tilt: 24,
    lineCount: 26,
    glow: 1,
    depthOfField: 0.7,
    hoverEffect: 'light',
    markers: 'dots',
    glitch: 0.35
  },
  ember: { color: '#ff8a3d', lineCount: 32, elevation: 1.35, scale: 1.2, detail: 0.55, speed: 0.35, glow: 0.8 },
  atlas: {
    color: '#ffffff',
    tilt: 90,
    lineCount: 16,
    scale: 0.7,
    speed: 0.12,
    direction: 'right',
    glow: 0.3,
    depthOfField: 0,
    hoverEffect: 'trace',
    markers: 'plus'
  },
  alpenglow: { color: '#ff8fa3', elevation: 1.6, scale: 0.9, tilt: 24, lineCount: 24, fog: 0.5, clickEffect: 'peak' },
  dunes: {
    color: '#ffc46b',
    elevation: 0.5,
    scale: 1.8,
    lineCount: 34,
    detail: 0.15,
    direction: 'right',
    speed: 0.45,
    majorLines: false
  },
  mono: { color: '#d4d4d8', glow: 0.15, depthOfField: 0, majorLines: false, lineWidth: 1, brightness: 1.1 }
};

export const LIGHT_SWAP = {
  ridgeline: { color: '#2554d8' },
  sonar: { color: '#0f766e' },
  ember: { color: '#c2410c' },
  atlas: { color: '#18181b' },
  alpenglow: { color: '#be123c' },
  dunes: { color: '#a16207' },
  mono: { color: '#3f3f46' }
};

export const PRESET_OPTIONS = [
  { value: 'ridgeline', label: 'Ridgeline' },
  { value: 'sonar', label: 'Sonar' },
  { value: 'ember', label: 'Ember' },
  { value: 'atlas', label: 'Atlas' },
  { value: 'alpenglow', label: 'Alpenglow' },
  { value: 'dunes', label: 'Dunes' },
  { value: 'mono', label: 'Mono' }
];

export const presetProps = (value, { light = false, defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value],
    ...(light ? LIGHT_SWAP[value] : null)
  };
};
