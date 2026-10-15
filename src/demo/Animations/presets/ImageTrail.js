export const LOOK = {
  size: 190,
  radius: 15,
  threshold: 80,
  lifetime: 0.4,
  appearScale: 1,
  zoom: 1,
  flash: 0,
  exitScale: 0.2,
  drift: 0,
  rotation: 0,
  sizeVariance: 0,
  alignToMotion: false,
  stack: 0,
  tilt: 0
};

export const PRESETS = {
  classic: {},
  pop: { appearScale: 0, zoom: 2.4, flash: 0.6 },
  drift: { appearScale: 0.1, alignToMotion: true, drift: 0.8, exitScale: 1, lifetime: 0.6 },
  stack: { stack: 7, rotation: 4, sizeVariance: 0.6, appearScale: 0.7, exitScale: 1.3 }
};

export const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'pop', label: 'Pop' },
  { value: 'drift', label: 'Drift' },
  { value: 'stack', label: 'Stack' }
];

export const presetProps = (value, { defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value]
  };
};
