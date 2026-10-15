export const LOOK = {
  gradientColors: ['#FF9FFC', '#5227FF'],
  angle: 20,
  noise: 0.3,
  blindCount: 16,
  blindMinWidth: 60,
  spotlightRadius: 0.5,
  spotlightSoftness: 1,
  spotlightOpacity: 1,
  shineDirection: 'left',
  lightColor: '#ffffff',
  shine: 0.4,
  relief: 0.5,
  glow: 0.4,
  sway: 0.35,
  speed: 1,
  hoverTilt: 0.6,
  perspective: 0,
  gradientSpeed: 0,
  distortAmount: 0,
  mirrorGradient: false,
  mouseDampening: 0.15,
  clickEffect: 'ripple',
  idle: 'drift'
};

export const PRESETS = {
  satin: {},
  classic: { shine: 0, relief: 0, glow: 0, sway: 0, hoverTilt: 0, clickEffect: 'none', idle: 'stay' },
  noir: {
    gradientColors: ['#f4f4f5', '#71717a'],
    angle: -14,
    blindCount: 14,
    spotlightRadius: 0.62,
    spotlightSoftness: 1.3,
    lightColor: '#ffe4c4',
    shine: 0.8,
    relief: 0.75,
    noise: 0.4
  },
  sunset: { gradientColors: ['#ffb347', '#ff6b3d', '#c2185b'], angle: 32, spotlightRadius: 0.6, lightColor: '#ffd8b0' },
  lagoon: { gradientColors: ['#5eead4', '#0ea5e9', '#1e3a8a'], angle: -24, lightColor: '#e0f2fe' },
  venetian: { angle: 0, blindCount: 40, blindMinWidth: 18, spotlightRadius: 0.55, shine: 0.7, relief: 0.6 },
  perspective: { angle: 0, blindCount: 22, blindMinWidth: 20, perspective: 0.7, shine: 0.6 },
  drift: { gradientColors: ['#ff9ffc', '#5227ff', '#22d3ee'], gradientSpeed: 1.5, distortAmount: 12 }
};

export const LIGHT_SWAP = {
  satin: { gradientColors: ['#be185d', '#5b21b6'] },
  classic: { gradientColors: ['#be185d', '#5b21b6'] },
  noir: { gradientColors: ['#3f3f46', '#a1a1aa'], lightColor: '#ffffff' },
  sunset: { gradientColors: ['#ea580c', '#dc2626', '#9d174d'] },
  lagoon: { gradientColors: ['#0d9488', '#0284c7', '#1e3a8a'] },
  venetian: { gradientColors: ['#be185d', '#5b21b6'] },
  perspective: { gradientColors: ['#be185d', '#5b21b6'] },
  drift: { gradientColors: ['#be185d', '#5b21b6', '#0891b2'] }
};

export const PRESET_OPTIONS = [
  { value: 'satin', label: 'Satin' },
  { value: 'classic', label: 'Classic' },
  { value: 'noir', label: 'Noir' },
  { value: 'sunset', label: 'Sunset' },
  { value: 'lagoon', label: 'Lagoon' },
  { value: 'venetian', label: 'Venetian' },
  { value: 'perspective', label: 'Perspective' },
  { value: 'drift', label: 'Drift' }
];

export const presetProps = (value, { light = false, defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value],
    ...(light ? LIGHT_SWAP[value] : null)
  };
};
