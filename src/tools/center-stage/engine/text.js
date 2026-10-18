export const FONTS = [
  { value: 'Geist', label: 'Geist', stack: 'Geist, "Geist Fallback", system-ui, sans-serif' },
  { value: 'Geist Mono', label: 'Geist Mono', stack: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace' },
  { value: 'serif', label: 'Serif', stack: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif' },
  { value: 'system', label: 'System', stack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }
];

export const fontStack = value => FONTS.find(font => font.value === value)?.stack || FONTS[0].stack;

const loaded = new Set();

export async function ensureFont(family, weight) {
  if (typeof document === 'undefined' || !document.fonts) return;
  const key = `${family}|${weight}`;
  if (loaded.has(key)) return;
  try {
    if (family === 'Geist' || family === 'Geist Mono') await document.fonts.load(`${weight} 64px "${family}"`);
    loaded.add(key);
  } catch {
    loaded.add(key);
  }
}

export function measureLines(ctx, lines, tracking) {
  return lines.map(line => {
    const chars = [...line];
    const base = ctx.measureText(line).width;
    return base + Math.max(0, chars.length - 1) * tracking;
  });
}

export function drawTextBlock({
  text,
  font = 'Geist',
  weight = 640,
  tracking = -0.05,
  leading = 0.92,
  color = '#ffffff',
  style = 'fill',
  align = 'center',
  pixelHeight = 220,
  stroke = 0.022
}) {
  const lines = String(text || '')
    .split('\n')
    .map(line => line.trimEnd())
    .filter((line, index, all) => line || index < all.length - 1);
  if (!lines.length) return null;
  const size = Math.max(8, Math.round(pixelHeight));
  const probe = document.createElement('canvas').getContext('2d');
  const family = fontStack(font);
  probe.font = `${weight} ${size}px ${family}`;
  const track = tracking * size;
  const widths = measureLines(probe, lines, track);
  const lineHeight = size * leading;
  const metrics = probe.measureText('Hg');
  const ascent = metrics.actualBoundingBoxAscent || size * 0.75;
  const descent = metrics.actualBoundingBoxDescent || size * 0.2;
  const pad = Math.ceil(size * 0.12 + (style === 'outline' ? size * stroke : 0));
  const width = Math.ceil(Math.max(...widths) + pad * 2);
  const height = Math.ceil(ascent + descent + lineHeight * (lines.length - 1) + pad * 2);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(2, width);
  canvas.height = Math.max(2, height);
  const ctx = canvas.getContext('2d');
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.textBaseline = 'alphabetic';
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${track}px`;
  const hasSpacing = 'letterSpacing' in ctx;
  lines.forEach((line, index) => {
    const lineWidth = widths[index];
    let x = pad;
    if (align === 'center') x = (width - lineWidth) / 2;
    else if (align === 'right') x = width - pad - lineWidth;
    const y = pad + ascent + index * lineHeight;
    const draw = (fn, value, at) => {
      if (hasSpacing) {
        fn.call(ctx, value, at, y);
        return;
      }
      let cursor = at;
      [...value].forEach(char => {
        fn.call(ctx, char, cursor, y);
        cursor += ctx.measureText(char).width + track;
      });
    };
    ctx.fillStyle = color;
    draw(ctx.fillText, line, x);
  });
  if (style === 'outline') outlineCanvas(canvas, Math.max(0.75, (size * stroke) / 2), color);
  return { canvas, width: canvas.width, height: canvas.height, size, pad, ascent, lines: lines.length };
}

const OUTLINE_STEPS = 40;

function outlineCanvas(canvas, radius, color) {
  const { width, height } = canvas;
  const make = () => {
    const layer = document.createElement('canvas');
    layer.width = width;
    layer.height = height;
    return layer;
  };
  const outer = make();
  const inner = make();
  const outerCtx = outer.getContext('2d');
  const innerCtx = inner.getContext('2d');
  outerCtx.drawImage(canvas, 0, 0);
  innerCtx.drawImage(canvas, 0, 0);
  innerCtx.globalCompositeOperation = 'destination-in';
  for (let i = 0; i < OUTLINE_STEPS; i += 1) {
    const angle = (i / OUTLINE_STEPS) * Math.PI * 2;
    const dx = Math.cos(angle) * radius;
    const dy = Math.sin(angle) * radius;
    outerCtx.drawImage(canvas, dx, dy);
    innerCtx.drawImage(canvas, dx, dy);
  }
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(outer, 0, 0);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.drawImage(inner, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';
}

export function drawCaption({
  width,
  height,
  title,
  subtitle,
  position = 'top',
  align = 'center',
  color = '#ffffff',
  muted = 'rgba(255,255,255,0.62)',
  font = 'Geist',
  size = 1
}) {
  if (!title && !subtitle) return null;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const base = Math.min(width, height);
  const titleSize = base * 0.062 * size;
  const subSize = base * 0.027 * size;
  const family = fontStack(font);
  const margin = Math.max(width, height) * 0.06;
  const gap = subSize * 0.8;
  const block = (title ? titleSize * 1.05 : 0) + (title && subtitle ? gap : 0) + (subtitle ? subSize * 1.35 : 0);
  let y = position === 'bottom' ? height - margin - block : margin;
  const x = align === 'left' ? margin : align === 'right' ? width - margin : width / 2;
  ctx.textAlign = align === 'left' ? 'left' : align === 'right' ? 'right' : 'center';
  ctx.textBaseline = 'top';
  if (title) {
    ctx.font = `620 ${titleSize}px ${family}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${-titleSize * 0.035}px`;
    ctx.fillStyle = color;
    ctx.fillText(title, x, y);
    y += titleSize * 1.05 + (subtitle ? gap : 0);
  }
  if (subtitle) {
    ctx.font = `440 ${subSize}px ${family}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${-subSize * 0.01}px`;
    ctx.fillStyle = muted;
    ctx.fillText(subtitle, x, y);
  }
  return canvas;
}

export function captionSpace(caption, height, width) {
  if (!caption || (!caption.title && !caption.subtitle)) return { top: 0, bottom: 0 };
  const base = Math.min(width, height);
  const size = caption.size || 1;
  const block =
    (caption.title ? base * 0.062 * size * 1.05 : 0) +
    (caption.title && caption.subtitle ? base * 0.027 * size * 0.8 : 0) +
    (caption.subtitle ? base * 0.027 * size * 1.35 : 0);
  const space = (block + Math.max(width, height) * 0.06 * 1.35) / height;
  return caption.position === 'bottom' ? { top: 0, bottom: space } : { top: space, bottom: 0 };
}
