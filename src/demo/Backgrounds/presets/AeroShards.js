export const LOOK = {
  shardColor: '#896ABD',
  accentColor: '#A855F7',
  lightMode: false,
  placement: 'full',
  material: 'glass',
  markers: 'plus',
  count: 1300,
  shardSize: 1,
  spread: 1,
  twist: 1,
  billow: 1,
  speed: 1,
  scale: 1,
  depthOfField: 0.75,
  glow: 0.35,
  grain: 0.06,
  vignette: 0.3
};

export const PRESETS = {
  amethyst: {},
  glacier: {
    shardColor: '#9cc9ff',
    accentColor: '#38bdf8',
    material: 'glass',
    placement: 'right',
    spread: 1.2,
    speed: 0.8
  },
  copper: {
    shardColor: '#e3a17a',
    accentColor: '#f97316',
    material: 'chrome',
    markers: 'dots',
    twist: 1.3,
    speed: 0.9
  },
  graphite: {
    shardColor: '#a1a1aa',
    accentColor: '#e4e4e7',
    material: 'chrome',
    glow: 0.25,
    billow: 0.7
  },
  halo: {
    shardColor: '#b4a6f0',
    accentColor: '#818cf8',
    placement: 'center',
    twist: 1.4,
    count: 1500
  }
};

export const LIGHT_SWAP = {
  amethyst: { lightMode: true, shardColor: '#7c5cbf', accentColor: '#a855f7' },
  glacier: { lightMode: true, shardColor: '#3b82f6', accentColor: '#0ea5e9' },
  copper: { lightMode: true, shardColor: '#c2410c', accentColor: '#f97316' },
  graphite: { lightMode: true, shardColor: '#3f3f46', accentColor: '#71717a' },
  halo: { lightMode: true, shardColor: '#6d5bd0', accentColor: '#6366f1' }
};

export const PRESET_OPTIONS = [
  { value: 'amethyst', label: 'Amethyst' },
  { value: 'glacier', label: 'Glacier' },
  { value: 'copper', label: 'Copper' },
  { value: 'graphite', label: 'Graphite' },
  { value: 'halo', label: 'Halo' }
];

export const presetProps = (value, { light = false } = {}) => {
  return {
    ...LOOK,
    ...PRESETS[value],
    ...(light ? LIGHT_SWAP[value] : null)
  };
};
