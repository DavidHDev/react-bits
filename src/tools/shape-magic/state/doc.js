import { PRIMITIVES_BY_ID, defaultShapeParams } from '../engine/primitives';

let counter = 0;

export const nextId = () => {
  counter += 1;
  return `layer-${Date.now().toString(36)}-${counter}`;
};

export const OPS = [
  { value: 'add', label: 'Add' },
  { value: 'merge', label: 'Merge' },
  { value: 'cut', label: 'Cut' },
  { value: 'keep', label: 'Keep' },
  { value: 'exclude', label: 'Exclude' }
];

export const RATIOS = [
  { value: '1:1', label: 'Square', w: 1, h: 1 },
  { value: '4:3', label: '4:3', w: 4, h: 3 },
  { value: '16:9', label: '16:9', w: 16, h: 9 },
  { value: '3:4', label: '3:4', w: 3, h: 4 },
  { value: '9:16', label: '9:16', w: 9, h: 16 }
];

export const FONTS = [
  { value: 'Geist', label: 'Geist', weights: [400, 500, 600, 700, 800, 900] },
  {
    value: 'Inter',
    label: 'Inter',
    google: 'Inter:wght@400;500;600;700;800;900',
    weights: [400, 500, 600, 700, 800, 900]
  },
  {
    value: 'Space Grotesk',
    label: 'Space Grotesk',
    google: 'Space+Grotesk:wght@400;500;600;700',
    weights: [400, 500, 600, 700]
  },
  { value: 'Syne', label: 'Syne', google: 'Syne:wght@400;500;600;700;800', weights: [400, 500, 600, 700, 800] },
  {
    value: 'Bricolage Grotesque',
    label: 'Bricolage Grotesque',
    google: 'Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800',
    weights: [400, 600, 800]
  },
  { value: 'Unbounded', label: 'Unbounded', google: 'Unbounded:wght@400;600;800;900', weights: [400, 600, 800, 900] },
  { value: 'Archivo Black', label: 'Archivo Black', google: 'Archivo+Black', weights: [400] },
  {
    value: 'Fraunces',
    label: 'Fraunces',
    google: 'Fraunces:opsz,wght@9..144,400;9..144,600;9..144,800',
    weights: [400, 600, 800]
  },
  { value: 'DM Serif Display', label: 'DM Serif Display', google: 'DM+Serif+Display', weights: [400] },
  { value: 'Instrument Serif', label: 'Instrument Serif', google: 'Instrument+Serif', weights: [400] },
  { value: 'Sora', label: 'Sora', google: 'Sora:wght@400;600;800', weights: [400, 600, 800] },
  { value: 'Geist Mono', label: 'Geist Mono', weights: [400, 500, 600, 700, 800] }
];

export const LAYER_DEFAULTS = {
  x: 0,
  y: 0,
  size: 0.7,
  rotation: 0,
  op: 'add',
  outline: 0,
  round: 0,
  repeat: 1,
  spin: 0,
  mirror: false,
  visible: true
};

export const MERGE_SMOOTH = 0.12;

export const smoothFor = layer => layer.smooth ?? (layer.op === 'merge' ? MERGE_SMOOTH : 0);

export const createLayer = (type, overrides = {}) => {
  const { params, ...rest } = overrides;
  return {
    id: nextId(),
    type,
    ...LAYER_DEFAULTS,
    ...rest,
    params: { ...defaultShapeParams(type), ...(params || {}) }
  };
};

export const createTextLayer = (value = 'Mark', overrides = {}) => {
  const { text, ...rest } = overrides;
  return createLayer('text', {
    size: 0.85,
    ...rest,
    text: { value, font: 'Geist', weight: 800, tracking: -0.02, ...(text || {}) }
  });
};

export const createImageLayer = (image, overrides = {}) =>
  createLayer('image', { size: 0.85, ...overrides, image: { name: image.name, src: image.src, key: image.key } });

export const isMaskLayer = layer => layer.type === 'text' || layer.type === 'image';

export const layerName = layer => {
  if (layer.name) return layer.name;
  if (layer.type === 'text') return layer.text?.value ? `“${layer.text.value}”` : 'Text';
  if (layer.type === 'image') return layer.image?.name || 'Logo';
  return PRIMITIVES_BY_ID[layer.type]?.name || layer.type;
};

export const maskKey = layer => {
  if (layer.type === 'text') {
    const t = layer.text || {};
    return `text:${t.value}|${t.font}|${t.weight}|${t.tracking}`;
  }
  if (layer.type === 'image') return `image:${layer.image?.key || layer.image?.src}`;
  return null;
};

export const DEFAULT_FILL = {
  kind: 'linear',
  color1: '#ffffff',
  color2: '#cbcbd3',
  color3: '#8d8d99',
  stops: 2,
  angle: 160,
  extent: 1
};

export const DEFAULT_EFFECTS = {
  outline: { on: false, width: 0.03, color: '#ffffff', mode: 'outside' },
  shadow: { on: false, opacity: 0.35, blur: 0.1, x: 0, y: 0.06, color: '#000000' },
  glow: { on: false, intensity: 0.7, radius: 0.12, color: '#ffffff' },
  gloss: { on: false, strength: 0.25, angle: 225, bevel: 0.4, bend: 2.5 }
};

export const DEFAULT_ARTBOARD = {
  ratio: '1:1',
  background: { kind: 'none', color1: '#120f17', color2: '#2a2238', angle: 180, extent: 1 }
};

export const DEFAULT_MORPH = { on: false, target: null, duration: 1.6, hold: 0.8, ease: 'smooth' };

export const cloneLayers = layers => layers.map(layer => ({ ...layer, id: nextId(), params: { ...layer.params } }));

export const INK = { dark: '#f2f2f2', light: '#141414' };

export const inkFill = light => ({ kind: 'solid', color1: light ? INK.light : INK.dark, ink: true });

export const createDoc = (preset = {}, { light = false } = {}) => ({
  version: 1,
  name: preset.name || 'Untitled mark',
  preset: preset.id || null,
  artboard: {
    ...DEFAULT_ARTBOARD,
    ...(preset.artboard || {}),
    background: { ...DEFAULT_ARTBOARD.background, ...(preset.artboard?.background || {}) }
  },
  mark: {
    scale: preset.mark?.scale ?? 1,
    rotation: preset.mark?.rotation ?? 0,
    x: 0,
    y: 0,
    layers: (preset.mark?.layers || [{ type: 'star' }]).map(layer =>
      layer.type === 'text'
        ? createTextLayer(layer.text?.value, layer)
        : layer.type === 'image'
          ? createImageLayer(layer.image, layer)
          : createLayer(layer.type, layer)
    )
  },
  fill: preset.ink ? { ...DEFAULT_FILL, ...inkFill(light) } : { ...DEFAULT_FILL, ...(preset.fill || {}) },
  effects: Object.fromEntries(
    Object.entries(DEFAULT_EFFECTS).map(([key, value]) => [key, { ...value, ...(preset.effects?.[key] || {}) }])
  ),
  material: preset.material || { id: 'flat', props: {} },
  morph: { ...DEFAULT_MORPH }
});

export const ratioOf = artboard => RATIOS.find(item => item.value === artboard.ratio) || RATIOS[0];
