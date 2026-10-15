export const LOOK = {
  mode: 'orbit',
  shape: 'line',
  lineColor: '#efefef',
  accentColor: '',
  spacing: 30,
  lineWidth: 2,
  lineHeight: 18,
  baseAngle: -10,
  radius: 200,
  fade: 0.65,
  edgeFade: 0,
  stretch: 0.4,
  reach: 0,
  scatter: 0,
  inertia: 0.35,
  bounce: 0.3,
  ripple: 0.3,
  rainbow: false,
  tiltX: 0,
  tiltY: 0
};

export const PRESETS = {
  classic: {},
  compass: {
    mode: 'attract',
    shape: 'needle',
    accentColor: '#f43f5e',
    spacing: 56,
    lineHeight: 34,
    fade: 0.35,
    stretch: 0.2,
    bounce: 0.55
  },
  vortex: { mode: 'spiral', rainbow: true, ripple: 0.5 },
  dipole: { mode: 'dipole', spacing: 22, lineWidth: 1.5, lineHeight: 13, radius: 240, stretch: 0.5 },
  filings: {
    spacing: 16,
    lineWidth: 1.5,
    lineHeight: 9,
    reach: 150,
    scatter: 1,
    stretch: 0.35,
    fade: 0.45,
    inertia: 0.5,
    bounce: 0.2
  },
  arrows: { mode: 'attract', shape: 'arrow', spacing: 40, lineHeight: 24, stretch: 0.3 },
  horizon: { tiltX: 55, spacing: 26, lineHeight: 15, accentColor: '#38bdf8', radius: 160, edgeFade: 0.5 }
};

export const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'compass', label: 'Compass' },
  { value: 'vortex', label: 'Vortex' },
  { value: 'dipole', label: 'Dipole' },
  { value: 'filings', label: 'Filings' },
  { value: 'arrows', label: 'Arrows' },
  { value: 'horizon', label: 'Horizon' }
];

export const presetProps = (value, { defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value]
  };
};
