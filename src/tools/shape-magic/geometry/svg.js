import { traceField, contourArea } from './trace.js';
import { fitContours } from './fit.js';

const RAD = Math.PI / 180;
const clamp01 = v => Math.min(1, Math.max(0, v));

export function formatNumber(value, precision = 2) {
  const scale = 10 ** precision;
  const rounded = Math.round(value * scale) / scale;
  let text = rounded.toFixed(precision);
  if (text.includes('.')) text = text.replace(/0+$/, '').replace(/\.$/, '');
  if (text === '-0') return '0';
  if (text.startsWith('0.')) return text.slice(1);
  if (text.startsWith('-0.')) return `-${text.slice(2)}`;
  return text;
}

const joinNumbers = values => {
  let out = '';
  for (const value of values) out += out && !value.startsWith('-') ? ` ${value}` : value;
  return out;
};

export function mapContours(fitted, transform) {
  return fitted.map(contour => ({
    start: transform(contour.start),
    segments: contour.segments.map(seg =>
      seg.type === 'C'
        ? { type: 'C', c1: transform(seg.c1), c2: transform(seg.c2), p: transform(seg.p) }
        : { type: 'L', p: transform(seg.p) }
    )
  }));
}

export function toPathData(fitted, { transform = p => p, precision = 2 } = {}) {
  const scale = 10 ** precision;
  const snap = p => {
    const q = transform(p);
    return [Math.round(q[0] * scale) / scale, Math.round(q[1] * scale) / scale];
  };
  const num = v => formatNumber(v, precision);
  const delta = (a, b) => num(Math.round((a - b) * scale) / scale);
  const pick = (abs, rel) => (rel.length < abs.length ? rel : abs);
  const parts = [];
  let origin = null;
  for (const contour of fitted) {
    if (!contour.segments.length) continue;
    const start = snap(contour.start);
    const segments = contour.segments.map(seg =>
      seg.type === 'C'
        ? { type: 'C', c1: snap(seg.c1), c2: snap(seg.c2), p: snap(seg.p) }
        : { type: 'L', p: snap(seg.p) }
    );
    const last = segments[segments.length - 1];
    if (last.type === 'L' && last.p[0] === start[0] && last.p[1] === start[1]) segments.pop();
    const abs = `M${joinNumbers([num(start[0]), num(start[1])])}`;
    parts.push(origin ? pick(abs, `m${joinNumbers([delta(start[0], origin[0]), delta(start[1], origin[1])])}`) : abs);
    let cur = start;
    let prevC2 = null;
    for (const seg of segments) {
      const [x, y] = seg.p;
      if (seg.type === 'L') {
        if (x === cur[0] && y === cur[1]) continue;
        const options = [];
        if (y === cur[1]) options.push(`H${num(x)}`, `h${delta(x, cur[0])}`);
        else if (x === cur[0]) options.push(`V${num(y)}`, `v${delta(y, cur[1])}`);
        else options.push(`L${joinNumbers([num(x), num(y)])}`, `l${joinNumbers([delta(x, cur[0]), delta(y, cur[1])])}`);
        parts.push(options.reduce((best, option) => (option.length < best.length ? option : best)));
        prevC2 = null;
      } else {
        const { c1, c2 } = seg;
        if (x === cur[0] && y === cur[1] && c1[0] === x && c1[1] === y && c2[0] === x && c2[1] === y) continue;
        const smooth =
          prevC2 &&
          Math.round((2 * cur[0] - prevC2[0]) * scale) === Math.round(c1[0] * scale) &&
          Math.round((2 * cur[1] - prevC2[1]) * scale) === Math.round(c1[1] * scale);
        const absPoints = smooth ? [c2, seg.p] : [c1, c2, seg.p];
        const absText = (smooth ? 'S' : 'C') + joinNumbers(absPoints.flatMap(p => [num(p[0]), num(p[1])]));
        const relText =
          (smooth ? 's' : 'c') + joinNumbers(absPoints.flatMap(p => [delta(p[0], cur[0]), delta(p[1], cur[1])]));
        parts.push(pick(absText, relText));
        prevC2 = c2;
      }
      cur = seg.p;
    }
    parts.push('Z');
    origin = start;
  }
  return parts.join('');
}

export function fieldToPath(field, options = {}) {
  const { tolerance = 0.5, cornerAngle = 140, level = 0, precision = 2, minArea = 1 } = options;
  const [width, height] = options.viewBox || [field.width, field.height];
  const sx = width / field.width;
  const sy = height / field.height;
  const contours = traceField(field, { level }).filter(points => Math.abs(contourArea(points)) >= minArea);
  const fitted = fitContours(contours, { tolerance, cornerAngle });
  const mapped = mapContours(fitted, p => [p[0] * sx, p[1] * sy]);
  const d = toPathData(mapped, { precision });
  const segments = mapped.reduce((sum, contour) => sum + contour.segments.length, 0);
  return { d, contours: mapped, segments, width, height };
}

export function parseColor(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim().toLowerCase();
  const hex = text.match(/^#([0-9a-f]{3,8})$/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) h = [...h].map(c => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    const channel = i => parseInt(h.slice(i, i + 2), 16) / 255;
    return [channel(0), channel(2), channel(4), h.length === 8 ? channel(6) : 1];
  }
  const fn = text.match(/^rgba?\(([^)]+)\)$/);
  if (fn) {
    const parts = fn[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const read = (part, max) => (part.endsWith('%') ? parseFloat(part) / 100 : parseFloat(part) / max);
    const rgba = [read(parts[0], 255), read(parts[1], 255), read(parts[2], 255), parts[3] ? read(parts[3], 1) : 1];
    return rgba.every(Number.isFinite) ? rgba.map(clamp01) : null;
  }
  return null;
}

const toHex = rgb =>
  `#${rgb
    .slice(0, 3)
    .map(c =>
      Math.round(clamp01(c) * 255)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`;

const mixLinear = (a, b, t) => {
  const rgb = [0, 1, 2].map(i => ((1 - t) * a[i] ** 2.2 + t * b[i] ** 2.2) ** (1 / 2.2));
  return [...rgb, a[3] + (b[3] - a[3]) * t];
};

function gradientStops(colors) {
  const parsed = colors.map(parseColor);
  if (parsed.some(c => !c)) return colors.map((color, i) => ({ offset: i / (colors.length - 1), color, opacity: 1 }));
  const pieces = parsed.length - 1;
  const at = t => {
    const u = Math.min(pieces - 1e-9, Math.max(0, t * pieces));
    const i = Math.floor(u);
    return mixLinear(parsed[i], parsed[i + 1], u - i);
  };
  const quantize = c => [...c.slice(0, 3).map(v => Math.round(clamp01(v) * 255) / 255), c[3]];
  const offsets = [0];
  const refine = (t0, t1, depth) => {
    const a = quantize(at(t0));
    const b = quantize(at(t1));
    let err = 0;
    for (const f of [0.25, 0.5, 0.75]) {
      const truth = at(t0 + (t1 - t0) * f);
      for (let i = 0; i < 4; i++) err = Math.max(err, Math.abs(a[i] + (b[i] - a[i]) * f - truth[i]) * 255);
    }
    if (err <= 1.5 || depth >= 5) return;
    const mid = (t0 + t1) / 2;
    refine(t0, mid, depth + 1);
    offsets.push(mid);
    refine(mid, t1, depth + 1);
  };
  for (let i = 0; i < pieces; i++) {
    refine(i / pieces, (i + 1) / pieces, 0);
    offsets.push((i + 1) / pieces);
  }
  return offsets.map(offset => {
    const c = at(offset);
    return { offset, color: toHex(c), opacity: Math.round(c[3] * 1000) / 1000 };
  });
}

const paintColor = value => {
  const c = parseColor(value);
  if (!c) return { color: value || 'none', opacity: 1 };
  return { color: toHex(c), opacity: Math.round(c[3] * 1000) / 1000 };
};

function gradientNode(id, spec, width, height) {
  const unit = Math.min(width, height) / 2;
  const cx = width / 2;
  const cy = height / 2;
  const extent = Math.max(spec.extent ?? 1, 0.05) * unit;
  const three = spec.stops === 3 || (spec.stops == null && spec.color3 != null);
  const colors = three
    ? [spec.color1 ?? '#ffffff', spec.color2 ?? spec.color1 ?? '#ffffff', spec.color3 ?? spec.color2 ?? '#ffffff']
    : [spec.color1 ?? '#ffffff', spec.color2 ?? spec.color1 ?? '#ffffff'];
  const children = gradientStops(colors).map(stop => {
    const attrs = [];
    if (stop.offset > 0) attrs.push(['offset', formatNumber(stop.offset, 4)]);
    attrs.push(['stop-color', stop.color]);
    if (stop.opacity < 1) attrs.push(['stop-opacity', formatNumber(stop.opacity, 3)]);
    return { tag: 'stop', attrs };
  });
  const n = v => formatNumber(v, 2);
  if (spec.kind === 'radial') {
    return {
      tag: 'radialGradient',
      attrs: [
        ['id', id],
        ['cx', n(cx)],
        ['cy', n(cy)],
        ['r', n(extent)],
        ['gradientUnits', 'userSpaceOnUse']
      ],
      children
    };
  }
  const angle = (spec.angle ?? 0) * RAD;
  const dx = Math.sin(angle) * extent;
  const dy = -Math.cos(angle) * extent;
  return {
    tag: 'linearGradient',
    attrs: [
      ['id', id],
      ['x1', n(cx - dx)],
      ['y1', n(cy - dy)],
      ['x2', n(cx + dx)],
      ['y2', n(cy + dy)],
      ['gradientUnits', 'userSpaceOnUse']
    ],
    children
  };
}

function paint(spec, id, width, height, defs) {
  if (spec == null) return { value: '#ffffff', opacity: 1 };
  if (typeof spec === 'string') {
    const c = paintColor(spec);
    return { value: c.color, opacity: c.opacity };
  }
  const kind = spec.kind ?? 'solid';
  if (kind === 'none') return { value: 'none', opacity: 1 };
  if (kind === 'linear' || kind === 'radial') {
    defs.push(gradientNode(id, spec, width, height));
    return { value: `url(#${id})`, opacity: 1 };
  }
  const c = paintColor(spec.color1 ?? '#ffffff');
  return { value: c.color, opacity: c.opacity };
}

const slug = name =>
  String(name)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'mark';

export function svgTree({ d, width, height, fill, background, outline, fillRule, id = 'mark' }) {
  const prefix = slug(id);
  const defs = [];
  const children = [];
  const bg = typeof background === 'string' ? { kind: 'color', color1: background } : background;
  if (bg && bg.kind && bg.kind !== 'none') {
    const spec = bg.kind === 'linear' ? { ...bg, angle: bg.angle ?? 180 } : { kind: 'solid', color1: bg.color1 };
    const p = paint(spec, `${prefix}-background`, width, height, defs);
    const attrs = [
      ['width', formatNumber(width)],
      ['height', formatNumber(height)],
      ['fill', p.value]
    ];
    if (p.opacity < 1) attrs.push(['fill-opacity', formatNumber(p.opacity, 3)]);
    children.push({ tag: 'rect', attrs });
  }
  const unit = Math.min(width, height) / 2;
  const fillSpec = fill ?? '#ffffff';
  const filled = paint(fillSpec, `${prefix}-fill`, width, height, defs);
  const attrs = [['d', d]];
  const stroke = outline && (outline.on ?? true) && (outline.width ?? 1) > 0 ? outline : null;
  const strokePaint = stroke ? paintColor(stroke.color ?? '#000000') : null;
  const empty = filled.value === 'none';
  if (stroke && empty && stroke.mode !== 'center') {
    attrs.push(['fill', strokePaint.color]);
    if (strokePaint.opacity < 1) attrs.push(['fill-opacity', formatNumber(strokePaint.opacity, 3)]);
  } else {
    attrs.push(['fill', filled.value]);
    if (filled.opacity < 1) attrs.push(['fill-opacity', formatNumber(filled.opacity, 3)]);
  }
  if (fillRule && fillRule !== 'nonzero') attrs.push(['fill-rule', fillRule]);
  if (stroke) {
    const w = (stroke.width ?? unit * 0.04) * (stroke.mode === 'center' ? 1 : 2);
    attrs.push(['stroke', strokePaint.color]);
    if (strokePaint.opacity < 1) attrs.push(['stroke-opacity', formatNumber(strokePaint.opacity, 3)]);
    attrs.push(['stroke-width', formatNumber(w)], ['stroke-linejoin', 'round']);
    if (!empty) attrs.push(['paint-order', 'stroke']);
  }
  children.push({ tag: 'path', attrs });
  const root = [
    ['xmlns', 'http://www.w3.org/2000/svg'],
    ['width', formatNumber(width)],
    ['height', formatNumber(height)],
    ['viewBox', `0 0 ${formatNumber(width)} ${formatNumber(height)}`]
  ];
  return {
    tag: 'svg',
    attrs: root,
    children: defs.length ? [{ tag: 'defs', attrs: [], children: defs }, ...children] : children
  };
}

const escapeAttr = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function serialize(node, depth) {
  const pad = '  '.repeat(depth);
  const attrs = node.attrs.map(([k, v]) => ` ${k}="${escapeAttr(v)}"`).join('');
  if (!node.children || !node.children.length) return `${pad}<${node.tag}${attrs}/>`;
  const inner = node.children.map(child => serialize(child, depth + 1)).join('\n');
  return `${pad}<${node.tag}${attrs}>\n${inner}\n${pad}</${node.tag}>`;
}

export function buildSVG(parts) {
  return `${serialize(svgTree(parts), 0)}\n`;
}

const JSX_NAMES = {
  'stop-color': 'stopColor',
  'stop-opacity': 'stopOpacity',
  'fill-rule': 'fillRule',
  'fill-opacity': 'fillOpacity',
  'stroke-width': 'strokeWidth',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-opacity': 'strokeOpacity',
  'paint-order': 'paintOrder'
};

function serializeJSX(node, depth, extra = []) {
  const pad = '  '.repeat(depth);
  const attrs = [...node.attrs.map(([k, v]) => `${JSX_NAMES[k] || k}="${escapeAttr(v)}"`), ...extra];
  const open = `${pad}<${node.tag}`;
  const single = `${open}${attrs.map(a => ` ${a}`).join('')}`;
  const inline = single.length <= 120 && !attrs.some(a => a.length > 80);
  const head = inline ? single : `${open}\n${attrs.map(a => `${pad}  ${a}`).join('\n')}\n${pad}`;
  if (!node.children || !node.children.length) return `${head}${inline ? ' ' : ''}/>`;
  const inner = node.children.map(child => serializeJSX(child, depth + 1)).join('\n');
  return `${head}>\n${inner}\n${pad}</${node.tag}>`;
}

const componentName = name => {
  const words = String(name).match(/[A-Za-z0-9]+/g) || ['Mark'];
  const joined = words.map(w => w[0].toUpperCase() + w.slice(1)).join('');
  return /^[A-Z]/.test(joined) ? joined : `Mark${joined}`;
};

export function toReactComponent(svgParts, { name = 'Mark' } = {}) {
  const component = componentName(name);
  const tree = svgTree({ ...svgParts, id: svgParts.id ?? component });
  const body = serializeJSX(tree, 2, ['className={className}', '{...props}']);
  return `export default function ${component}({ className, ...props }) {\n  return (\n${body}\n  );\n}\n`;
}
