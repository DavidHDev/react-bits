export const LOOK = {
  topColor: '#5227FF',
  bottomColor: '#FF9FFC',
  intensity: 1,
  glowAmount: 0.002,
  bloom: 0.5,
  pillarWidth: 3,
  pillarHeight: 0.4,
  pillarRotation: 25,
  twist: 0.4,
  detail: 4,
  rotationSpeed: 0.3,
  flow: 1,
  noiseIntensity: 0.5
};

export const PRESETS = {
  aurora: LOOK,
  ice: {
    ...LOOK,
    topColor: '#22d3ee',
    bottomColor: '#e0f2fe',
    pillarWidth: 2.5,
    pillarRotation: -15,
    twist: 0.6,
    bloom: 0.6
  },
  ember: {
    ...LOOK,
    topColor: '#ff4d1a',
    bottomColor: '#ffd166',
    pillarRotation: 10,
    flow: 1.6,
    intensity: 1.1
  },
  spectre: {
    ...LOOK,
    topColor: '#c9c9d6',
    bottomColor: '#ffffff',
    pillarWidth: 2,
    pillarRotation: 0,
    glowAmount: 0.0018,
    bloom: 0.35
  },
  twister: {
    ...LOOK,
    topColor: '#10b981',
    bottomColor: '#d9f99d',
    pillarHeight: 0.8,
    twist: 1.05,
    rotationSpeed: 0.55,
    pillarRotation: -30
  },
  beam: {
    ...LOOK,
    topColor: '#3b5bff',
    bottomColor: '#e0e7ff',
    pillarWidth: 1.4,
    pillarRotation: 0,
    glowAmount: 0.0011,
    intensity: 1.15,
    detail: 3,
    bloom: 0.7
  }
};

export const PRESET_OPTIONS = [
  { value: 'aurora', label: 'Aurora' },
  { value: 'ice', label: 'Ice' },
  { value: 'ember', label: 'Ember' },
  { value: 'spectre', label: 'Spectre' },
  { value: 'twister', label: 'Twister' },
  { value: 'beam', label: 'Beam' }
];

export const presetProps = (value, { defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value]
  };
};
