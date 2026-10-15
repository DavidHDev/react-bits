export const LOOK = {
  colors: ['#ffffff', '#ffffff', '#ffffff'],
  brightness: 1,
  scale: 1.6,
  spikeHeight: 1,
  sharpness: 2.5,
  tilt: 48,
  turbulence: 1,
  fluidity: 0.5,
  speed: 0.5,
  magnetism: 1,
  variation: 0,
  flowDirection: 'down',
  mouseStrength: 1,
  mouseRadius: 0.22
};

export const DEFAULT_PROPS = {
  preset: 'studio',
  ...LOOK,
  mouseInteraction: true,
  clickPulse: true,
  intro: true,
  lightMode: false
};

export const PRESETS = {
  studio: { ...LOOK },
  ember: { ...LOOK, colors: ['#ffd2a1', '#ff8a4c', '#ff6a3d'], brightness: 1.1 },
  frost: { ...LOOK, colors: ['#dff1ff', '#6cb6ff', '#8fb0ff'] },
  calm: { ...LOOK, magnetism: 0.8, speed: 0.3, spikeHeight: 0.85 },
  storm: { ...LOOK, magnetism: 1.5, speed: 0.9, turbulence: 1.6, spikeHeight: 1.15 },
  peaks: { ...LOOK, sharpness: 4, spikeHeight: 1.4, fluidity: 0.85 },
  horizon: { ...LOOK, tilt: 64, spikeHeight: 1.1 }
};

export const PRESET_OPTIONS = [
  { value: 'studio', label: 'Studio' },
  { value: 'ember', label: 'Ember' },
  { value: 'frost', label: 'Frost' },
  { value: 'calm', label: 'Calm' },
  { value: 'storm', label: 'Storm' },
  { value: 'peaks', label: 'Peaks' },
  { value: 'horizon', label: 'Horizon' }
];

export const presetProps = (value, { defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value]
  };
};
