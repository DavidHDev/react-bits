export const LOOK = {
  scanColor: '#7dd3fc',
  cells: 8,
  lineThickness: 1,
  lineStyle: 'solid',
  depth: 3,
  depthFade: 0.6,
  shading: 0.7,
  reflection: 0.35,
  points: true,
  scanDirection: 'forward',
  scanDuration: 2.4,
  scanDelay: 1.6,
  scanWidth: 1,
  trail: 0.5,
  glow: 0.6
};

export const DEFAULT_PROPS = {
  preset: 'scan',
  linesColor: '#4d4757',
  ...LOOK,
  parallax: 1,
  autoScan: true,
  interactive: true,
  clickEffect: 'ping',
  enableWebcam: false,
  showPreview: true,
  intro: true,
  lightMode: false
};

export const PRESETS = {
  scan: { ...LOOK },
  laser: { ...LOOK, scanColor: '#ff453a', scanWidth: 0.6, trail: 0.3, glow: 0.5, points: false, reflection: 0.55 },
  lidar: { ...LOOK, scanColor: '#5eead4', cells: 6, trail: 0.9, scanDuration: 3.2, scanDelay: 0.8 },
  blueprint: {
    ...LOOK,
    linesColor: '#5b6b8c',
    scanColor: '#f4f4f5',
    cells: 10,
    lineStyle: 'dashed',
    shading: 0.4,
    points: false
  },
  deep: { ...LOOK, cells: 10, depth: 8, trail: 0.7, scanDuration: 4 },
  wire: { ...LOOK, linesColor: '#5c5666', scanColor: '#fbbf24', shading: 0, reflection: 0, points: false, glow: 0.35 },
  pulse: {
    ...LOOK,
    scanColor: '#bef264',
    depth: 2.2,
    scanDirection: 'pingpong',
    scanDuration: 1.2,
    scanDelay: 0.2,
    trail: 0.25
  }
};

export const LIGHT_SWAP = {
  scan: { scanColor: '#0284c7' },
  laser: { scanColor: '#e5332a' },
  lidar: { scanColor: '#0d9488' },
  blueprint: { linesColor: '#94a3b8', scanColor: '#18181b' },
  deep: { scanColor: '#0284c7' },
  wire: { linesColor: '#a1a1aa', scanColor: '#d97706' },
  pulse: { scanColor: '#65a30d' }
};

export const PRESET_OPTIONS = [
  { value: 'scan', label: 'Scan' },
  { value: 'laser', label: 'Laser' },
  { value: 'lidar', label: 'LiDAR' },
  { value: 'blueprint', label: 'Blueprint' },
  { value: 'deep', label: 'Deep' },
  { value: 'wire', label: 'Wire' },
  { value: 'pulse', label: 'Pulse' }
];

export const presetProps = (value, { light = false, defaults = {} } = {}) => {
  const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value],
    ...(light ? LIGHT_SWAP[value] : null)
  };
};
