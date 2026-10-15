export const LOOK = {
  colors: ['#5227FF', '#FF9FFC', '#B497CF'],
  colorMode: 'conic',
  colorSpeed: 0.05,
  particleShape: 'capsule',
  count: 1500,
  particleSize: 0.9,
  particleVariance: 1,
  magnetRadius: 9,
  ringRadius: 7,
  fieldStrength: 10,
  waveAmplitude: 1,
  waveCount: 3,
  waveSpeed: 0.4,
  rotationSpeed: 0,
  pulseSpeed: 3,
  depthFactor: 1,
  ambient: 0.25,
  lerpSpeed: 0.05
};

export const PRESETS = {
  magnet: {},
  spectrum: {
    colors: ['#4285F4', '#9B72CB', '#D96570', '#F9AB00'],
    colorSpeed: 0.08,
    count: 2000,
    magnetRadius: 11
  },
  orbit: {
    colors: ['#7dd3fc', '#e0f2fe', '#38bdf8'],
    rotationSpeed: 1.2,
    fieldStrength: 25,
    waveAmplitude: 0.6
  },
  bloom: {
    colors: ['#FF9FFC', '#ffd6a5', '#fda4af'],
    colorMode: 'radial',
    waveAmplitude: 6,
    waveCount: 5
  },
  stardust: {
    colors: ['#ffffff', '#c7d2fe'],
    particleShape: 'sphere',
    count: 2600,
    particleSize: 0.7,
    depthFactor: 2.5,
    ambient: 0.45,
    rotationSpeed: 0.3
  },
  confetti: {
    colors: ['#5227FF', '#FF9FFC', '#ffd166', '#06d6a0'],
    colorMode: 'random',
    particleShape: 'box',
    count: 900,
    particleSize: 1.3
  }
};

export const PRESET_OPTIONS = [
  { value: 'magnet', label: 'Magnet' },
  { value: 'spectrum', label: 'Spectrum' },
  { value: 'orbit', label: 'Orbit' },
  { value: 'bloom', label: 'Bloom' },
  { value: 'stardust', label: 'Stardust' },
  { value: 'confetti', label: 'Confetti' }
];

export const presetProps = (value, { defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value]
  };
};
