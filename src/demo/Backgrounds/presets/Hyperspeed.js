export const DEFAULT_PROPS = {
  preset: 'cyberpunk',
  tailColors: ['#d856bf', '#6750a2', '#c247ac'],
  headColors: ['#03b3c3', '#0e5ea5', '#324555'],
  poleColors: ['#03b3c3'],
  roadColor: '#08080a',
  lineColor: '#25252d',
  curve: 'winding',
  curvature: 1,
  speed: 1,
  boost: 3,
  fov: 90,
  boostFov: 130,
  lanes: 3,
  roadWidth: 10,
  medianWidth: 2,
  density: 40,
  trailLength: 1,
  lightSize: 1,
  poles: 20,
  dust: 100,
  glow: 0.6,
  reflections: 0.5,
  roadOpacity: 0.1,
  steer: 0.35,
  interactive: true
};

export const PRESETS = {
  cyberpunk: {},
  night: {
    tailColors: ['#ff2d55', '#ff5a36', '#e8174a'],
    headColors: ['#eef4ff', '#9cc8ff', '#ffffff'],
    poleColors: ['#ffb547']
  },
  akira: {
    curve: 'hills',
    roadWidth: 9,
    density: 50,
    poles: 50,
    tailColors: ['#ff102a', '#eb383e', '#ff102a'],
    headColors: ['#dadafa', '#bebae3', '#8f97e4'],
    poleColors: ['#dadafa']
  },
  golden: {
    curve: 'gentle',
    roadWidth: 9,
    density: 30,
    poles: 50,
    tailColors: ['#7d0d1b', '#a90519', '#ff102a'],
    headColors: ['#f1eece', '#e6e2b1', '#dfd98a'],
    poleColors: ['#f1eece']
  },
  split: {
    curve: 'racing',
    lanes: 2,
    medianWidth: 5,
    density: 70,
    poles: 50,
    tailColors: ['#ff5f73', '#e74d60', '#ff102a'],
    headColors: ['#a4e3e6', '#80d1d4', '#53c2c6'],
    poleColors: ['#a4e3e6']
  },
  highway: {
    roadWidth: 9,
    density: 50,
    poles: 50,
    tailColors: ['#dc5b20', '#dca320', '#dc2020'],
    headColors: ['#334bf7', '#e5e6ed', '#bfc6f3'],
    poleColors: ['#c5e8eb']
  },
  deep: {
    curve: 'deep',
    roadWidth: 18,
    density: 50,
    poles: 50,
    tailColors: ['#ff322f', '#a33010', '#a81508'],
    headColors: ['#fdfdf0', '#f3dea0', '#e2bb88'],
    poleColors: ['#fdfdf0']
  }
};

export const PRESET_OPTIONS = [
  { value: 'cyberpunk', label: 'Cyberpunk' },
  { value: 'night', label: 'Night Drive' },
  { value: 'akira', label: 'Akira' },
  { value: 'golden', label: 'Golden' },
  { value: 'split', label: 'Split' },
  { value: 'highway', label: 'Highway' },
  { value: 'deep', label: 'Deep' }
];

export const presetProps = (value, { defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(key => [key, defaults[key]]));
  return {
    ...base,
    ...PRESETS[value]
  };
};
