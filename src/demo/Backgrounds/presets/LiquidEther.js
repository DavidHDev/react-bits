export const LOOK = {
  colors: ['#5227FF', '#FF9FFC', '#B497CF'],
  intensity: 1,
  mouseForce: 20,
  cursorSize: 100,
  persistence: 0.75,
  viscosity: 0
};

export const PRESETS = {
  ether: {},
  lagoon: { colors: ['#0e7490', '#2dd4bf', '#ccfbf1'] },
  ember: { colors: ['#9a3412', '#f97316', '#fde68a'] },
  smoke: { colors: ['#3f3f46', '#a1a1aa', '#ffffff'] },
  ocean: { colors: ['#1e3a8a', '#3b82f6', '#bae6fd'] },
  syrup: { viscosity: 0.8, persistence: 0.9, cursorSize: 140, intensity: 1.2 }
};

export const PRESET_OPTIONS = [
  { value: 'ether', label: 'Ether' },
  { value: 'lagoon', label: 'Lagoon' },
  { value: 'ember', label: 'Ember' },
  { value: 'smoke', label: 'Smoke' },
  { value: 'ocean', label: 'Ocean' },
  { value: 'syrup', label: 'Syrup' }
];

export const presetProps = (value, { defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value]
  };
};
