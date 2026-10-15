export const LOOK = {
  cableColor: '#ffffff',
  pulseColor: '#ffffff',
  tunnelColor: '#ffffff',
  tunnelOpacity: 0,
  speed: 0.1,
  flowDirection: 'inward',
  pulseSpeed: 2,
  pulseLength: 0.28,
  pulseBlend: 0.6,
  pulseWidth: 1,
  pulseDensity: 0.5,
  cableCount: 56,
  thickness: 0.35,
  rimWidth: 0.15,
  waviness: 0.3,
  sway: 0.5,
  bend: 0.4,
  glow: 1
};

export const DEFAULT_PROPS = {
  preset: 'studio',
  ...LOOK,
  size: 1,
  fadeNear: 0.5,
  fadeFar: 2,
  brightness: 1,
  colorVariance: true,
  grain: false,
  mouseInteraction: true,
  mouseStrength: 0.1,
  clickSurge: true,
  intro: true,
  lightMode: false
};

export const PRESETS = {
  studio: { ...LOOK },
  ember: { ...LOOK, pulseColor: '#ffb070', cableColor: '#ffd2a8' },
  glacier: { ...LOOK, pulseColor: '#8fc8ff', cableColor: '#cfe6ff' },
  warp: {
    ...LOOK,
    flowDirection: 'outward',
    pulseSpeed: 3,
    pulseLength: 0.45,
    pulseDensity: 0.65,
    waviness: 0.05,
    sway: 0.2,
    bend: 0.2
  },
  calm: { ...LOOK, speed: 0.06, pulseDensity: 0.3, pulseLength: 0.4, sway: 0.8 },
  dense: { ...LOOK, cableCount: 110, thickness: 0.2, pulseDensity: 0.6, pulseWidth: 0.8 },
  halo: { ...LOOK, tunnelOpacity: 0.35, tunnelColor: '#9ab8ff', pulseColor: '#cfe0ff', cableColor: '#cfe0ff' }
};

export const PRESET_OPTIONS = [
  { value: 'studio', label: 'Studio' },
  { value: 'ember', label: 'Ember' },
  { value: 'glacier', label: 'Glacier' },
  { value: 'warp', label: 'Warp' },
  { value: 'calm', label: 'Calm' },
  { value: 'dense', label: 'Dense' },
  { value: 'halo', label: 'Halo' }
];

export const presetProps = (value, { defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value]
  };
};
