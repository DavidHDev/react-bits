export const PALETTES = {
  none: [],
  stardust: ['#ffffff', '#ffd9a3', '#a8c8ff'],
  ice: ['#ffffff', '#bfe3ff', '#8fb8ff'],
  gold: ['#fff6e0', '#ffd27a', '#ffb35c'],
  rose: ['#ffffff', '#ffc9d4', '#ffd9b8']
};

export const LOOK = {
  starColors: PALETTES.none,
  hueShift: 140,
  saturation: 0,
  density: 1,
  glowIntensity: 0.3,
  starSize: 1,
  flareIntensity: 1,
  twinkleIntensity: 0.3,
  starSpeed: 0.5,
  speed: 1,
  rotationSpeed: 0.1,
  layers: 4,
  direction: 'forward',
  mouseRepulsion: true,
  repulsionStrength: 2
};

export const DEFAULT_PROPS = {
  preset: 'classic',
  ...LOOK,
  mouseInteraction: true,
  clickWarp: true,
  intro: true,
  lightMode: false
};

export const PRESETS = {
  classic: { ...LOOK },
  stardust: { ...LOOK, starColors: PALETTES.stardust, glowIntensity: 0.5, density: 1.4, twinkleIntensity: 0.6 },
  hyperdrive: { ...LOOK, starSpeed: 3, layers: 6, density: 1.2, glowIntensity: 0.4, mouseRepulsion: false },
  sparkle: { ...LOOK, flareIntensity: 3, glowIntensity: 0.45, twinkleIntensity: 0.7, density: 0.8 },
  drift: { ...LOOK, direction: 'backward', starSpeed: 0.3, rotationSpeed: 0.03, glowIntensity: 0.35 },
  cluster: { ...LOOK, starColors: PALETTES.gold, glowIntensity: 0.5, density: 1.6, twinkleIntensity: 0.4 }
};

export const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'stardust', label: 'Stardust' },
  { value: 'hyperdrive', label: 'Hyperdrive' },
  { value: 'sparkle', label: 'Sparkle' },
  { value: 'drift', label: 'Drift' },
  { value: 'cluster', label: 'Cluster' }
];

export const presetProps = (value, { defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value]
  };
};
