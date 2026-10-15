export const BASE = {
  color: '#3ef09a',
  mode: 'sweep',
  speed: 1,
  trail: 0.35,
  scale: 0.9,
  ringCount: 6,
  spokeCount: 12,
  ticks: true,
  targets: 6,
  clutter: 0.35,
  glow: 1,
  tilt: 0,
  centerX: 0.5,
  centerY: 0.5
};

export const DEFAULT_PROPS = {
  preset: 'radar',
  ...BASE,
  brightness: 1,
  gridOpacity: 1,
  lineWidth: 1,
  grain: 0.03,
  fade: 0,
  opacity: 1,
  mouseInteraction: true,
  intro: true,
  lightMode: false
};

export const PRESETS = {
  radar: BASE,
  horizon: { ...BASE, tilt: 64, centerY: 0.92, scale: 1.7, clutter: 0.45 },
  sonar: { ...BASE, mode: 'pulse', color: '#3ed6f0', clutter: 0.3 },
  amber: { ...BASE, color: '#ffb547', clutter: 0.6, targets: 9 },
  mono: { ...BASE, color: '#ffffff', clutter: 0, targets: 3 }
};

export const LIGHT_COLORS = {
  radar: '#0a9f5f',
  horizon: '#0a9f5f',
  sonar: '#0891b2',
  amber: '#d97706',
  mono: '#27272a'
};

export const PRESET_OPTIONS = [
  { value: 'radar', label: 'Radar' },
  { value: 'horizon', label: 'Horizon' },
  { value: 'sonar', label: 'Sonar' },
  { value: 'amber', label: 'Amber' },
  { value: 'mono', label: 'Mono' }
];

export const presetProps = (value, { light = false, defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(name => [name, defaults[name]]));
  const tone = light ? { color: LIGHT_COLORS[value] } : {};
  return {
    ...base,
    ...PRESETS[value],
    ...tone
  };
};
