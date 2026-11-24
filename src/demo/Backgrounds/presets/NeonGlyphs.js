export const LOOK = {
  colors: ['#a6f3fa', '#ea6fe0', '#6fd6f7', '#d351b6', '#5aaef0'],
  characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+=<>?!',
  cellSize: 16,
  depth: 12,
  tilt: 25,
  turn: 0,
  rotation: 0,
  perspective: 60,
  sway: 0.5,
  speed: 0.15,
  density: 0.1,
  trails: 0.25,
  glow: 0.75,
  flicker: 0.5,
  scramble: 0.5,
  brightness: 1
};

export const DEFAULT_PROPS = {
  preset: 'angle',
  ...LOOK,
  fade: 0.75,
  aberration: 0.5,
  variation: 0,
  opacity: 1,
  intro: true,
  mouseInteraction: true,
  burstOnClick: true,
  lightMode: false
};

export const PRESETS = {
  angle: {},
  flat: { tilt: 0, sway: 0.3 },
  floor: { tilt: 60, turn: 0, perspective: 70 },
  wall: { tilt: 0, turn: 40, perspective: 64 },
  swarm: { depth: 18, cellSize: 12, density: 0.2 },
  drift: { turn: -18, cellSize: 26, density: 0.06, speed: 0.3, sway: 0.8 }
};

export const LIGHT_SWAP = {
  angle: {},
  flat: {},
  floor: {},
  wall: {},
  swarm: {},
  drift: {}
};

export const PRESET_OPTIONS = [
  { value: 'angle', label: 'Angle' },
  { value: 'flat', label: 'Flat' },
  { value: 'floor', label: 'Floor' },
  { value: 'wall', label: 'Wall' },
  { value: 'swarm', label: 'Swarm' },
  { value: 'drift', label: 'Drift' }
];

export const presetProps = (value, { light = false, defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(LOOK).map(key => [key, defaults[key] ?? LOOK[key]]));
  return {
    ...base,
    ...PRESETS[value],
    ...(light ? LIGHT_SWAP[value] : null)
  };
};
