export const LOOK = {
  colors: ['#ffffff'],
  material: 'satin',
  count: 200,
  minSize: 0.5,
  maxSize: 1,
  gravity: 0,
  friction: 0.9975,
  wallBounce: 0.95,
  bounce: 0.85,
  depth: 2,
  drift: 0.4,
  cursorSize: 1,
  lightColor: '#ffffff',
  lightIntensity: 1,
  exposure: 1,
  shadows: 0.6
};

export const PRESETS = {
  float: {},
  pit: { colors: ['#5227ff'], gravity: 0.6, drift: 0, count: 260 },
  clay: { material: 'matte', colors: ['#e8b4a0'], gravity: 0.6, drift: 0, shadows: 0.75 },
  gloss: { material: 'gloss', colors: ['#18181b', '#ff5b2e'] },
  frosted: { material: 'frosted', colors: ['#c7d2fe'], gravity: 0, drift: 0.5, count: 150 },
  metal: { material: 'metal', colors: ['#d4d4d8'], gravity: 0.6, drift: 0 },
  sprinkles: { colors: ['#ffffff', '#5227ff'], count: 900, minSize: 0.26, maxSize: 0.46, gravity: 0.6, drift: 0 },
  zero: { colors: ['#ff5b2e'], gravity: 0, drift: 0, friction: 1, bounce: 1, wallBounce: 1 }
};

export const LIGHT_SWAP = {
  float: { colors: ['#18181b'] },
  frosted: { colors: ['#a5b4fc'] },
  sprinkles: { colors: ['#18181b', '#5227ff'] }
};

export const PRESET_OPTIONS = [
  { value: 'float', label: 'Float' },
  { value: 'pit', label: 'Pit' },
  { value: 'clay', label: 'Clay' },
  { value: 'gloss', label: 'Gloss' },
  { value: 'frosted', label: 'Frosted' },
  { value: 'metal', label: 'Metal' },
  { value: 'sprinkles', label: 'Sprinkles' },
  { value: 'zero', label: 'Zero G' }
];

export const presetProps = (value, { light = false, defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value],
    ...(light ? LIGHT_SWAP[value] : null)
  };
};
