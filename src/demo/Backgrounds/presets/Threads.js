export const CLASSIC = {
  lineCount: 40,
  thickness: 1,
  softness: 1,
  amplitude: 1,
  distance: 0,
  waves: 1,
  speed: 1,
  split: 0.1,
  fray: 0.4,
  angle: 0,
  taper: 1,
  brightness: 1,
  parting: 0,
  enableMouseInteraction: true,
  fade: 0,
  opacity: 1,
  seed: 0
};

export const SILK = {
  ...CLASSIC,
  lineCount: 90,
  thickness: 0.6,
  softness: 1.3,
  amplitude: 1.7,
  distance: 0.4,
  waves: 1.05,
  speed: 0.6,
  split: 0.04,
  fray: 0.5,
  angle: 25,
  taper: 0.85,
  brightness: 1.4
};

export const DEFAULT_PROPS = {
  preset: 'silk',
  color: '#ffffff',
  accentColor: '',
  ...SILK
};

export const PRESETS = {
  classic: CLASSIC,
  silk: SILK,
  rope: {
    ...CLASSIC,
    lineCount: 24,
    thickness: 1.6,
    amplitude: 1.2,
    distance: 0.12,
    split: 0.3,
    fray: 0.15,
    waves: 1.3,
    taper: 0.4,
    brightness: 1.5
  },
  strands: {
    ...CLASSIC,
    lineCount: 14,
    thickness: 2.6,
    softness: 0.6,
    amplitude: 2.2,
    distance: 0.7,
    speed: 0.5,
    waves: 0.6,
    fray: 0.6,
    taper: 0.55,
    brightness: 1.3
  },
  contour: {
    ...CLASSIC,
    lineCount: 46,
    thickness: 0.9,
    softness: 0,
    amplitude: 0.9,
    distance: 1.7,
    split: 0,
    fray: 0.15,
    waves: 0.7,
    speed: 0.6,
    taper: 0,
    brightness: 1.25,
    opacity: 0.7,
    parting: 0.8,
    enableMouseInteraction: false
  },
  curtain: {
    ...CLASSIC,
    angle: 90,
    lineCount: 34,
    thickness: 1.2,
    softness: 0,
    amplitude: 0.45,
    distance: 1.75,
    split: 0,
    fray: 0.1,
    waves: 0.55,
    speed: 0.7,
    taper: 0,
    brightness: 1.3,
    opacity: 0.8,
    parting: 0.8,
    enableMouseInteraction: false
  }
};

export const PRESET_OPTIONS = [
  { value: 'silk', label: 'Silk' },
  { value: 'classic', label: 'Classic' },
  { value: 'rope', label: 'Rope' },
  { value: 'strands', label: 'Strands' },
  { value: 'contour', label: 'Contour' },
  { value: 'curtain', label: 'Curtain' }
];

export const presetProps = (value, { defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(key => [key, defaults[key]]));
  return {
    ...base,
    ...PRESETS[value]
  };
};
