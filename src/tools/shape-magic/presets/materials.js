import { BACKGROUNDS } from '../../../tools/background-studio/backgrounds';
import { PROCEDURAL_BY_ID, PROCEDURAL_GROUPS } from '../materials';

export const MATERIAL_GROUPS = [
  { id: 'metal', label: 'Liquid metal' },
  ...PROCEDURAL_GROUPS.map(group => ({ id: group.id, label: group.label })),
  { id: 'backgrounds', label: 'Background fills' },
  { id: 'fills', label: 'Fills' }
];

const fill = (id, name, values, effects) => ({
  id: `fill:${id}`,
  group: 'fills',
  kind: 'flat',
  name,
  fill: values,
  effects
});

export const FILLS = [
  fill('cloud', 'Cloud', { kind: 'linear', color1: '#ffffff', color2: '#cbcbd3', angle: 180 }),
  fill('ink', 'Ink', { kind: 'solid', color1: '#151218' }),
  fill('cobalt', 'Cobalt', { kind: 'solid', color1: '#2f6bff' }),
  fill('dusk', 'Dusk', {
    kind: 'linear',
    color1: '#ffd29a',
    color2: '#ff5d8f',
    color3: '#c2367a',
    stops: 3,
    angle: 150
  }),
  fill('ocean', 'Ocean', { kind: 'linear', color1: '#a4f3ff', color2: '#1d6bff', angle: 170 }),
  fill('mint', 'Mint', { kind: 'radial', color1: '#e9fff5', color2: '#2ccf91', extent: 1.1 }),
  fill('ember', 'Ember', { kind: 'linear', color1: '#ffe08a', color2: '#ff4b2b', angle: 180 }),
  fill('candy', 'Candy', {
    kind: 'conic',
    color1: '#ff8ad8',
    color2: '#8fd3ff',
    color3: '#ff8ad8',
    stops: 3,
    angle: 0
  }),
  fill('chalk', 'Chalk', { kind: 'solid', color1: '#f2efe8' }),
  fill('lime', 'Lime', { kind: 'linear', color1: '#f2ff9a', color2: '#4cd964', angle: 135 }),
  fill(
    'satin',
    'Satin',
    { kind: 'linear', color1: '#f6f6f8', color2: '#8d8d99', angle: 200 },
    { gloss: { on: true, strength: 0.6, angle: 225, bevel: 0.1 } }
  ),
  fill(
    'neon',
    'Glow',
    { kind: 'solid', color1: '#d9fbff' },
    { glow: { on: true, intensity: 0.85, radius: 0.1, color: '#28e6ff' } }
  )
];

const METAL_LOOK = {
  color: '#ffffff',
  density: 2,
  softness: 0.1,
  dispersion: 0.3,
  distortion: 0.07,
  edgeBend: 0.6,
  angle: 70,
  speed: 1,
  mouseTilt: 0.5
};

const metal = (id, name, props) => ({
  id: `metal:${id}`,
  group: 'metal',
  kind: 'metal',
  name,
  props: { ...METAL_LOOK, ...props }
});

export const METALS = [
  metal('chrome', 'Chrome', {}),
  metal('liquid', 'Liquid', { edgeBend: 0.92, distortion: 0.22, density: 2.6, dispersion: 0.45 }),
  metal('noir', 'Noir', {
    color: '#b4b4ba',
    softness: 0.6,
    density: 1.6,
    dispersion: 0,
    distortion: 0.05,
    edgeBend: 0.5,
    angle: 90
  }),
  metal('gold', 'Gold', { color: '#f2c46b', dispersion: 0.15 }),
  metal('prism', 'Spectrum', {
    color: '#9cc4ff',
    softness: 0.8,
    density: 6,
    dispersion: 1,
    distortion: 0.4,
    edgeBend: 0.4,
    angle: 0
  }),
  metal('brushed', 'Mist', { softness: 1, density: 2.5, dispersion: 0, distortion: 0, edgeBend: 0.5, angle: 100 })
];

export const METAL_DEFINITIONS = [
  { name: 'color', label: 'Color', type: 'color', default: '#ffffff' },
  { name: 'density', label: 'Density', type: 'number', min: 0.5, max: 8, step: 0.1, default: 2 },
  { name: 'softness', label: 'Softness', type: 'number', min: 0, max: 1, step: 0.01, default: 0.1 },
  { name: 'dispersion', label: 'Dispersion', type: 'number', min: 0, max: 1, step: 0.01, default: 0.3 },
  { name: 'distortion', label: 'Distortion', type: 'number', min: 0, max: 1, step: 0.01, default: 0.07 },
  { name: 'edgeBend', label: 'Edge bend', type: 'number', min: 0, max: 1, step: 0.01, default: 0.6 },
  { name: 'angle', label: 'Angle', type: 'number', min: 0, max: 360, step: 1, default: 70 },
  { name: 'speed', label: 'Speed', type: 'number', min: 0, max: 3, step: 0.05, default: 1 },
  { name: 'mouseTilt', label: 'Mouse tilt', type: 'number', min: 0, max: 1.5, step: 0.05, default: 0.5 }
];

const NOT_MATERIALS = new Set([
  'grid-distortion',
  'grid-motion',
  'image-trail',
  'ribbons',
  'laser-flow',
  'splash-cursor',
  'click-spark',
  'magic-rings',
  'ghost-cursor'
]);

export const BACKGROUND_FILLS = BACKGROUNDS.filter(entry => !NOT_MATERIALS.has(entry.id)).map(entry => ({
  id: `bg:${entry.id}`,
  group: 'backgrounds',
  kind: 'background',
  name: entry.label,
  background: entry.id,
  entry
}));

export const PROCEDURAL_MATERIALS = PROCEDURAL_GROUPS.flatMap(group =>
  group.ids.map(id => ({
    id: `fx:${id}`,
    group: group.id,
    kind: 'procedural',
    name: PROCEDURAL_BY_ID[id].name,
    def: PROCEDURAL_BY_ID[id]
  }))
);

export const MATERIALS = [...METALS, ...PROCEDURAL_MATERIALS, ...BACKGROUND_FILLS, ...FILLS];

export const MATERIALS_BY_ID = Object.fromEntries(MATERIALS.map(material => [material.id, material]));

export const backgroundDefaults = entry => Object.fromEntries(entry.props.map(item => [item.name, item.default]));

export const backgroundValues = material => ({
  ...backgroundDefaults(material.entry),
  ...(material.lookProps || {}),
  ...material.props
});

export const materialFor = doc => {
  const id = doc.material?.id || 'flat';
  if (id === 'flat') return { kind: 'flat' };
  if (id === 'metal') return { kind: 'metal', props: doc.material.props || {} };
  if (id.startsWith('fx:')) {
    const def = PROCEDURAL_BY_ID[id.slice(3)];
    return def ? { kind: 'procedural', def, props: doc.material.props || {} } : { kind: 'flat' };
  }
  const entry = MATERIALS_BY_ID[id]?.entry;
  return entry
    ? {
        kind: 'background',
        entry,
        props: doc.material.props || {},
        look: doc.material.look || null,
        lookProps: doc.material.lookProps || null
      }
    : { kind: 'flat' };
};
