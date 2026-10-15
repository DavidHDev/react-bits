export const FEEL = {
  shape: 'circle',
  dotSize: 5,
  gap: 18,
  proximity: 140,
  strength: 1,
  bounce: 0.6,
  tension: 0.4,
  returnDuration: 0.8,
  shockRadius: 320,
  shockStrength: 5,
  swell: 0.8,
  stretch: 0.5,
  glow: 0.5,
  fade: 0
};

export const PRESETS = {
  jelly: { ...FEEL },
  streak: { ...FEEL, tension: 0, bounce: 0.25, returnDuration: 0.6, stretch: 1.4, swell: 0.4, strength: 1.3 },
  pixel: { ...FEEL, shape: 'square', dotSize: 6, gap: 14, bounce: 0.7, tension: 0.3, glow: 0.2, stretch: 0.4 },
  dense: { ...FEEL, dotSize: 3, gap: 10, proximity: 170, tension: 0.55, swell: 1.2, glow: 0.6 },
  calm: { ...FEEL, strength: 0.5, bounce: 0.3, returnDuration: 1.4, swell: 0.4, stretch: 0.2, glow: 0.25, fade: 0.5 }
};

export const PRESET_OPTIONS = [
  { value: 'jelly', label: 'Jelly' },
  { value: 'streak', label: 'Streak' },
  { value: 'pixel', label: 'Pixel' },
  { value: 'dense', label: 'Dense' },
  { value: 'calm', label: 'Calm' }
];

export const presetProps = (value, { defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(FEEL).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value]
  };
};
