export const LOOK = {
  color: '#b497cf',
  size: 80,
  trailLength: 50,
  inertia: 0.5,
  turbulence: 0.5,
  drift: 0.3,
  detail: 1,
  brightness: 1,
  bloomStrength: 0.6,
  bloomRadius: 1,
  grainIntensity: 0.05
};

export const PRESETS = {
  phantom: {},
  wraith: { color: '#7aa2ff', trailLength: 80, turbulence: 0.8, drift: 0.2, bloomStrength: 0.8 },
  ember: { color: '#ff8a3d', drift: 0.7, turbulence: 0.7, brightness: 1.2, bloomStrength: 0.9, size: 70 },
  mist: {
    color: '#e4e4e7',
    size: 110,
    trailLength: 90,
    inertia: 0.7,
    drift: 0.15,
    brightness: 0.75,
    bloomStrength: 0.3,
    grainIntensity: 0.08
  },
  ecto: { color: '#6ee7b7', turbulence: 1, size: 70, bloomStrength: 0.8 },
  wisp: { size: 45, trailLength: 30, inertia: 0.25, brightness: 1.3, bloomStrength: 0.8, detail: 0.8 }
};

export const PRESET_OPTIONS = [
  { value: 'phantom', label: 'Phantom' },
  { value: 'wraith', label: 'Wraith' },
  { value: 'ember', label: 'Ember' },
  { value: 'mist', label: 'Mist' },
  { value: 'ecto', label: 'Ecto' },
  { value: 'wisp', label: 'Wisp' }
];

export const LIGHT_SWAP = {
  phantom: { color: '#8b6fb3' },
  wraith: { color: '#3b5bdb' },
  ember: { color: '#ea580c' },
  mist: { color: '#52525b' },
  ecto: { color: '#059669' },
  wisp: { color: '#8b6fb3' }
};

export const presetProps = (value, { light = false, defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value],
    ...(light ? LIGHT_SWAP[value] : null)
  };
};
