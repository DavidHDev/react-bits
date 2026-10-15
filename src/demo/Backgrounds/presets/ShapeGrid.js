export const LOOK = {
  shape: 'square',
  direction: 'diagonal',
  lineColor: '#2a2734',
  hoverColor: '#ffffff',
  hoverFillColor: '#ffffff',
  fillOpacity: 0.15,
  rainbow: false,
  cellSize: 40,
  lineWidth: 1,
  speed: 0.5,
  tiltX: 0,
  tiltY: 0,
  radius: 1.5,
  trail: 0.6,
  glow: 0.35,
  twinkle: 0,
  fade: 1,
  clickCascade: true,
  intro: true
};

export const PRESETS = {
  classic: { look: LOOK, light: { lineColor: '#e4e4e7', hoverColor: '#18181b', hoverFillColor: '#18181b' } },
  tiles: {
    look: {
      ...LOOK,
      shape: 'tile',
      direction: 'up',
      speed: 0.3,
      hoverColor: '#7c8cff',
      hoverFillColor: '#7c8cff',
      twinkle: 0.6,
      trail: 0.9
    },
    light: { lineColor: '#e4e4e7', hoverColor: '#3847ff', hoverFillColor: '#3847ff' }
  },
  hive: {
    look: {
      ...LOOK,
      shape: 'hexagon',
      direction: 'up',
      speed: 0.35,
      hoverColor: '#2dd4bf',
      hoverFillColor: '#2dd4bf',
      radius: 2,
      trail: 0.9
    },
    light: { lineColor: '#e4e4e7', hoverColor: '#0d9488', hoverFillColor: '#0d9488' }
  },
  shards: {
    look: { ...LOOK, shape: 'triangle', direction: 'left', speed: 0.4, cellSize: 46, radius: 1.8 },
    light: { lineColor: '#e4e4e7', hoverColor: '#18181b', hoverFillColor: '#18181b' }
  },
  lattice: {
    look: {
      ...LOOK,
      shape: 'diamond',
      direction: 'right',
      speed: 0.4,
      hoverColor: '#f5a524',
      hoverFillColor: '#f5a524',
      glow: 0.5
    },
    light: { lineColor: '#e4e4e7', hoverColor: '#c2410c', hoverFillColor: '#c2410c' }
  },
  rings: {
    look: {
      ...LOOK,
      shape: 'circle',
      direction: 'down',
      speed: 0.3,
      cellSize: 36,
      hoverColor: '#ff7ab6',
      hoverFillColor: '#ff7ab6',
      radius: 1.8
    },
    light: { lineColor: '#e4e4e7', hoverColor: '#db2777', hoverFillColor: '#db2777' }
  },
  markers: {
    look: {
      ...LOOK,
      shape: 'cross',
      direction: 'none',
      lineColor: '#3b3747',
      cellSize: 34,
      radius: 3,
      trail: 1.2,
      glow: 0.2
    },
    light: { lineColor: '#d4d4d8', hoverColor: '#18181b', hoverFillColor: '#18181b' }
  },
  dots: {
    look: {
      ...LOOK,
      shape: 'dot',
      speed: 0.25,
      lineColor: '#3b3747',
      cellSize: 26,
      radius: 3.2,
      trail: 1,
      glow: 0.5,
      twinkle: 0.3
    },
    light: { lineColor: '#c9c9d1', hoverColor: '#18181b', hoverFillColor: '#18181b' }
  },
  horizon: {
    look: {
      ...LOOK,
      direction: 'down',
      speed: 0.6,
      tiltX: 58,
      cellSize: 44,
      radius: 2,
      trail: 0.9,
      glow: 0.45
    },
    light: { lineColor: '#e4e4e7', hoverColor: '#18181b', hoverFillColor: '#18181b' }
  },
  prism: {
    look: {
      ...LOOK,
      shape: 'tile',
      direction: 'up',
      speed: 0.3,
      rainbow: true,
      tiltX: 28,
      tiltY: -22,
      radius: 2.2,
      trail: 1.2,
      glow: 0.5
    },
    light: { lineColor: '#e4e4e7', hoverColor: '#18181b', hoverFillColor: '#18181b' }
  }
};

export const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'tiles', label: 'Tiles' },
  { value: 'hive', label: 'Hive' },
  { value: 'shards', label: 'Shards' },
  { value: 'lattice', label: 'Lattice' },
  { value: 'rings', label: 'Rings' },
  { value: 'markers', label: 'Markers' },
  { value: 'dots', label: 'Dots' },
  { value: 'horizon', label: 'Horizon' },
  { value: 'prism', label: 'Prism' }
];

export const presetProps = (value, { defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value].look
  };
};
