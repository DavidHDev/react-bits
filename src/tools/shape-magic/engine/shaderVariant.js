import { PRIMITIVE_INDEX } from './primitives.js';

export const MAX_LAYERS = 10;

export const markLayers = mark => (mark?.layers || []).filter(layer => layer.visible !== false).slice(0, MAX_LAYERS);

export const shaderVariant = (scene = {}, style = {}) => {
  const a = markLayers(scene.a);
  const b = markLayers(scene.b);
  const layers = [...a, ...b];
  const types = [
    ...new Set(
      layers
        .filter(layer => layer.type !== 'text' && layer.type !== 'image')
        .map(layer => PRIMITIVE_INDEX[layer.type] ?? 0)
    )
  ].sort((left, right) => left - right);
  return {
    capacity: Math.max(1, a.length, b.length),
    types,
    morph: Boolean(scene.b),
    patterns: layers.some(layer => layer.pattern && layer.pattern !== 'none'),
    radialCopies: layers.some(layer => !['row', 'column'].includes(layer.layout) && Math.round(layer.repeat ?? 1) > 1),
    linearCopies: layers.some(layer => ['row', 'column'].includes(layer.layout) && Math.round(layer.repeat ?? 1) > 1),
    shadow: Boolean(style.shadow?.on && (style.shadow.opacity ?? 0.35) > 0),
    bevel: Boolean(style.gloss?.on)
  };
};

export const variantKey = variant =>
  `${variant.capacity}:${variant.types.join(',')}:${[variant.morph, variant.patterns, variant.radialCopies, variant.linearCopies, variant.shadow, variant.bevel].map(Number).join('')}`;
