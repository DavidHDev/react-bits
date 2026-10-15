export const DEFAULT_PROPS = {
  preset: 'waterfall',
  color: '#3847ff',
  beamPosition: 0.6,
  intensity: 1.8,
  beamWidth: 1.5,
  flare: 1.5,
  spread: 1.5,
  spill: 1,
  fog: 0.2,
  dust: 1.6,
  streaks: 1.5,
  dots: 1,
  pulse: 1.5,
  speed: 1.5,
  seed: 3,
  mouseInteraction: true,
  revealRadius: 220,
  revealOpacity: 0.6,
  intro: true
};

export const PRESETS = {
  waterfall: {},
  twin: { beamPosition: 0.5 },
  floor: { beamPosition: 0.5 },
  ember: { color: '#ff5a1f', fog: 0.5 },
  glacier: { color: '#1fb6ff', beamPosition: 0.45 },
  quiet: { fog: 0, dust: 0, dots: 0, streaks: 0.6, beamWidth: 1, intensity: 1.2, pulse: 1 }
};

export const PRESET_OPTIONS = [
  { value: 'waterfall', label: 'Waterfall' },
  { value: 'twin', label: 'Twin Falls' },
  { value: 'floor', label: 'Floor' },
  { value: 'ember', label: 'Ember' },
  { value: 'glacier', label: 'Glacier' },
  { value: 'quiet', label: 'Quiet' }
];

export const presetProps = (value, { defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value]
  };
};
