export const LOOK = {
  color: '#c755f7',
  backgroundColor: '#120f17',
  lightMode: false,
  mask: 'aperture',
  speed: 0.5,
  variation: 0,
  waveAmplitude: 0.3,
  waveFrequency: 2.5,
  levels: 3,
  columns: 80,
  persistence: 0.4,
  curvature: 0.25,
  corners: 0,
  scanlineStrength: 0.6,
  scanlineFrequency: 200,
  maskStrength: 0.3,
  bloom: 1.5,
  bloomRadius: 1,
  rgbShift: 0.003,
  noise: 0.1,
  flicker: 0.15,
  interference: 0.2,
  vignette: 0.3,
  brightness: 1
};

export const PRESETS = {
  ultraviolet: {},
  amber: {
    color: '#ffb000',
    mask: 'none',
    speed: 0.35,
    waveFrequency: 3.2,
    levels: 4,
    columns: 112,
    persistence: 0.8,
    curvature: 0.35,
    scanlineStrength: 0.75,
    scanlineFrequency: 260,
    bloom: 1.8,
    rgbShift: 0,
    noise: 0.06,
    flicker: 0.1,
    interference: 0.1,
    vignette: 0.45
  },
  oscilloscope: {
    color: '#3dff7a',
    mask: 'none',
    speed: 0.4,
    waveAmplitude: 0.45,
    levels: 2,
    columns: 64,
    persistence: 0.9,
    curvature: 0.3,
    scanlineStrength: 0.7,
    scanlineFrequency: 220,
    bloom: 2.2,
    bloomRadius: 1.4,
    rgbShift: 0,
    noise: 0.08,
    flicker: 0.1,
    interference: 0.15,
    vignette: 0.4
  },
  arcade: {
    color: '#e8ecff',
    mask: 'shadow',
    speed: 0.6,
    levels: 5,
    columns: 96,
    persistence: 0.25,
    curvature: 0.5,
    corners: 0.7,
    scanlineStrength: 0.55,
    scanlineFrequency: 240,
    maskStrength: 0.55,
    bloom: 1.3,
    rgbShift: 0.004,
    vignette: 0.5
  },
  interference: {
    color: '#ff4d6d',
    speed: 0.7,
    waveFrequency: 2,
    columns: 60,
    persistence: 0.5,
    curvature: 0.4,
    scanlineStrength: 0.7,
    scanlineFrequency: 160,
    rgbShift: 0.01,
    noise: 0.24,
    flicker: 0.6,
    interference: 0.9,
    vignette: 0.4
  }
};

export const LIGHT_SWAP = {
  ultraviolet: { lightMode: true, color: '#7c3aed', backgroundColor: '#ffffff', bloom: 0.6, noise: 0.05 },
  amber: { lightMode: true, color: '#b45309', backgroundColor: '#ffffff', bloom: 0.7, noise: 0.04 },
  oscilloscope: { lightMode: true, color: '#15803d', backgroundColor: '#ffffff', bloom: 0.8, noise: 0.05 },
  arcade: { lightMode: true, color: '#3f3f46', backgroundColor: '#ffffff', bloom: 0.5, noise: 0.05 },
  interference: { lightMode: true, color: '#be123c', backgroundColor: '#ffffff', bloom: 0.6, noise: 0.12 }
};

export const PRESET_OPTIONS = [
  { value: 'ultraviolet', label: 'Ultraviolet' },
  { value: 'amber', label: 'Amber' },
  { value: 'oscilloscope', label: 'Oscilloscope' },
  { value: 'arcade', label: 'Arcade' },
  { value: 'interference', label: 'Interference' }
];

export const presetProps = (value, { light = false } = {}) => {
  return {
    ...LOOK,
    ...PRESETS[value],
    ...(light ? LIGHT_SWAP[value] : null)
  };
};
