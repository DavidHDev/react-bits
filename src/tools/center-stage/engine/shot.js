import { buildScene, normalizeDoc } from './scene';
import { drawCaption, drawTextBlock, ensureFont } from './text';
import { typePlacement } from './renderer';
import { clamp, hexToRgb, luminance } from './math';

const backgroundTone = doc => {
  const bg = doc.background || {};
  if (bg.kind === 'transparent') return 0.12;
  if (bg.kind === 'image' || bg.kind === 'backdrop' || bg.kind === 'ambient' || bg.kind === 'reactbits')
    return luminance(hexToRgb(bg.colors?.[0] || '#000000')) * 0.5 + 0.1;
  const colors = (bg.colors || ['#000000']).map(hexToRgb);
  const weights = bg.kind === 'studio' ? [1, 0.6] : bg.kind === 'gradient' || bg.kind === 'mesh' ? [1, 1, 1] : [1];
  let total = 0;
  let sum = 0;
  weights.forEach((weight, index) => {
    if (!colors[index]) return;
    sum += luminance(colors[index]) * weight;
    total += weight;
  });
  return total ? sum / total : 0;
};

export const isLightShot = doc => backgroundTone(doc) > 0.5;

export const autoInk = doc => (isLightShot(doc) ? '#111114' : '#ffffff');

export async function prepareShot(input) {
  const doc = normalizeDoc(input);
  const jobs = [];
  if (doc.type?.text) jobs.push(ensureFont(doc.type.font, doc.type.weight));
  if (doc.caption?.title || doc.caption?.subtitle) {
    jobs.push(ensureFont(doc.caption.font || 'Geist', 620));
    jobs.push(ensureFont(doc.caption.font || 'Geist', 440));
  }
  await Promise.all(jobs);
}

export class TextCache {
  constructor(limit = 6) {
    this.limit = limit;
    this.blocks = new Map();
    this.captions = new Map();
  }

  remember(map, key, make) {
    if (map.has(key)) {
      const value = map.get(key);
      map.delete(key);
      map.set(key, value);
      return value;
    }
    const value = make();
    map.set(key, value);
    if (map.size > this.limit) map.delete(map.keys().next().value);
    return value;
  }

  block(typeDoc, color, pixelHeight) {
    const key = JSON.stringify([
      typeDoc.text,
      typeDoc.font,
      typeDoc.weight,
      typeDoc.tracking,
      typeDoc.leading,
      typeDoc.style,
      color,
      pixelHeight
    ]);
    return { key, block: this.remember(this.blocks, key, () => drawTextBlock({ ...typeDoc, color, pixelHeight })) };
  }

  caption(options) {
    const key = JSON.stringify(options);
    return { key, canvas: this.remember(this.captions, key, () => drawCaption(options)) };
  }
}

export function renderShot(renderer, input, media, { width, height, time = 0, seed, cache, preview = false }) {
  const doc = normalizeDoc(input);
  const scene = buildScene(doc, media, { width, height, time, preview });
  const ink = autoInk(doc);
  let type = null;
  if (doc.type?.text && cache) {
    const color = doc.type.color === 'auto' || !doc.type.color ? ink : doc.type.color;
    const pixelHeight = Math.round(clamp(height * 0.3 * clamp(doc.type.size ?? 0.8, 0.2, 1.4), 48, 1400) / 8) * 8;
    const { key, block } = cache.block(doc.type, color, pixelHeight);
    if (block) {
      const place = typePlacement(scene, doc.type, block);
      type = {
        canvas: block.canvas,
        key,
        model: place.model,
        depth: place.depth,
        opacity: clamp(doc.type.opacity ?? 1, 0, 1)
      };
    }
  }
  let overlay = null;
  const caption = doc.caption;
  if ((caption?.title || caption?.subtitle) && cache) {
    const color = caption.color === 'auto' || !caption.color ? ink : caption.color;
    const muted =
      ink === '#ffffff' && (caption.color === 'auto' || !caption.color) ? 'rgba(255,255,255,0.62)' : `${color}a0`;
    const { key, canvas } = cache.caption({
      width,
      height,
      title: caption.title,
      subtitle: caption.subtitle,
      position: caption.position,
      align: caption.align,
      color,
      muted,
      font: caption.font || 'Geist',
      size: caption.size ?? 1
    });
    if (canvas) overlay = { canvas, key };
  }
  renderer.render(scene, { type, overlay, seed });
  return scene;
}
