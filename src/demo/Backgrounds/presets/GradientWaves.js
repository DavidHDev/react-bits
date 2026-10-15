export const LOOK = {
  horizonColor: '#5227FF',
  waveColor: '#FF9FFC',
  crestColor: '#FFFFFF',
  lightMode: false,
  speed: 0.4,
  amplitude: 2.5,
  waveScale: 0.6,
  waveRatio: 0.9,
  swell: 35,
  turbulence: 20,
  tilt: 64,
  zoom: 1,
  height: 5.5,
  fogDepth: 15,
  relief: 1,
  lightAngle: 120,
  sheen: 0,
  brightness: 1,
  opacity: 1,
  grain: 0.2
};

export const PRESETS = {
  dusk: {},
  ocean: {
    horizonColor: '#1e3a8a',
    waveColor: '#38bdf8',
    crestColor: '#e0f2fe',
    speed: 0.5,
    amplitude: 1.8,
    waveScale: 0.9,
    swell: 25,
    turbulence: 28,
    lightAngle: 150
  },
  dune: {
    horizonColor: '#7c2d12',
    waveColor: '#fb923c',
    crestColor: '#fef3c7',
    speed: 0.2,
    amplitude: 3.2,
    waveScale: 0.45,
    waveRatio: 0.6,
    swell: 40,
    turbulence: 12,
    lightAngle: 60
  },
  silk: {
    horizonColor: '#27272a',
    waveColor: '#a1a1aa',
    crestColor: '#ffffff',
    speed: 0.25,
    amplitude: 2.2,
    waveScale: 0.5,
    swell: 30,
    turbulence: 16,
    lightAngle: 130
  },
  aurora: {
    horizonColor: '#064e3b',
    waveColor: '#34d399',
    crestColor: '#d1fae5',
    speed: 0.35,
    amplitude: 2.6,
    waveScale: 0.7,
    swell: 38,
    turbulence: 24,
    fogDepth: 12,
    lightAngle: 170
  }
};

export const LIGHT_SWAP = {
  dusk: { lightMode: true, horizonColor: '#8b5cf6', waveColor: '#e879f9', crestColor: '#f5d0fe' },
  ocean: { lightMode: true, horizonColor: '#2563eb', waveColor: '#38bdf8', crestColor: '#e0f2fe' },
  dune: { lightMode: true, horizonColor: '#c2410c', waveColor: '#fb923c', crestColor: '#ffedd5' },
  silk: { lightMode: true, horizonColor: '#3f3f46', waveColor: '#a1a1aa', crestColor: '#f4f4f5' },
  aurora: { lightMode: true, horizonColor: '#047857', waveColor: '#34d399', crestColor: '#d1fae5' }
};

export const PRESET_OPTIONS = [
  { value: 'dusk', label: 'Dusk' },
  { value: 'ocean', label: 'Ocean' },
  { value: 'dune', label: 'Dune' },
  { value: 'silk', label: 'Silk' },
  { value: 'aurora', label: 'Aurora' }
];

export const presetProps = (value, { light = false } = {}) => {
  return {
    ...LOOK,
    ...PRESETS[value],
    ...(light ? LIGHT_SWAP[value] : null)
  };
};
