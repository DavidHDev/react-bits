import { clamp } from './math';
import {
  PHONE,
  PHONE_COLORS,
  PHONE_MM,
  PHONE_POINTS,
  PHONE_STATUS,
  TABLET,
  TABLET_COLORS,
  TABLET_LANDSCAPE,
  phoneFinish
} from './phone';
import { DISPLAY, LAPTOP, standPath } from './hardware';

export const DEVICE_TYPES = [
  { value: 'card', label: 'Card' },
  { value: 'browser', label: 'Browser' },
  { value: 'window', label: 'Window' },
  { value: 'phone', label: 'Phone' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'laptop', label: 'Laptop' },
  { value: 'monitor', label: 'Display' }
];

export const FINISHES = {
  card: [
    { value: 'clean', label: 'Clean' },
    { value: 'edge', label: 'Edge' },
    { value: 'glass', label: 'Glass' }
  ],
  browser: [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' }
  ],
  window: [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' }
  ],
  phone: PHONE_COLORS.map(({ value, label }) => ({ value, label })),
  tablet: TABLET_COLORS.map(({ value, label }) => ({ value, label })),
  laptop: TABLET_COLORS.map(({ value, label }) => ({ value, label })),
  monitor: TABLET_COLORS.map(({ value, label }) => ({ value, label }))
};

export const VIEWPORT_ASPECTS = [
  { value: 'auto', label: 'Match media' },
  { value: '16:10', label: '16:10' },
  { value: '16:9', label: '16:9' },
  { value: '4:3', label: '4:3' },
  { value: '3:2', label: '3:2' },
  { value: '1:1', label: 'Square' },
  { value: '4:5', label: '4:5 portrait' },
  { value: '3:4', label: '3:4 portrait' },
  { value: '9:16', label: '9:16 story' },
  { value: '9:19.5', label: 'Phone screen' }
];

const ratio = value => {
  const [a, b] = String(value).split(':').map(Number);
  return a && b ? a / b : 16 / 10;
};

export function viewportAspect(device, mediaAspect) {
  if (device.viewport && device.viewport !== 'auto') return ratio(device.viewport);
  if (!mediaAspect) return 16 / 10;
  const page = device.type === 'browser' || device.type === 'window' ? 1 : 0.62;
  if (mediaAspect < page) return 16 / 10;
  return clamp(mediaAspect, 0.62, 2.6);
}

const hardwareFinish = device => ({
  finish: phoneFinish({ ...device, finish: device.finish === 'space' ? 'black' : device.finish }),
  metal: device.metal || 'satin',
  glass: clamp(device.glass ?? 0.2, 0, 1),
  glassFinish: device.glassFinish || 'glossy',
  glow: clamp(device.glow ?? 1, 0.2, 1.6)
});

export function deviceLayout(device, mediaAspect) {
  const type = device.type || 'card';
  const finish = device.finish;
  if (type === 'phone' || type === 'tablet') {
    const s = type === 'phone' ? PHONE : device.orientation === 'portrait' ? TABLET : TABLET_LANDSCAPE;
    const k = PHONE_MM;
    const islandSize = type === 'phone' ? s.islands[device.island || 'pill'] || null : null;
    const screenAspect = (s.w - s.bezel * 2) / (s.h - s.bezel * 2);
    const status = type === 'phone' && device.statusBar !== false;
    const top = status ? PHONE_STATUS / PHONE_POINTS[1] : 0;
    return {
      type,
      spec: s,
      body: { w: s.w * k, h: s.h * k, radius: s.corner * k, squircle: true, thickness: s.t * k },
      screen: {
        x: s.bezel * k,
        y: s.bezel * k,
        w: (s.w - s.bezel * 2) * k,
        h: (s.h - s.bezel * 2) * k,
        radius: s.screenCorner * k
      },
      screenAspect,
      contentAspect: screenAspect / (1 - top),
      chrome:
        type === 'phone'
          ? { status, top, safari: Boolean(device.browserBar), url: (device.url ?? 'reactbits.dev').trim() }
          : null,
      back: (s.plateau.rise + s.lens.rise) * k,
      landscape: s.w > s.h,
      phone: {
        finish: phoneFinish(device),
        metal: device.metal || 'satin',
        glass: clamp(device.glass ?? 0.5, 0, 1),
        glassFinish: device.glassFinish || 'glossy',
        island: islandSize,
        glow: clamp(device.glow ?? 1, 0.2, 1.6)
      }
    };
  }
  if (type === 'laptop') {
    const s = LAPTOP;
    const k = PHONE_MM;
    const L = s.lid;
    const screenW = s.w - L.bezelSide * 2;
    const screenH = L.h - L.bezelTop - L.bezelBottom;
    return {
      type,
      spec: s,
      body: { w: s.w * k, h: L.h * k, radius: L.corner * k, squircle: true, thickness: L.t * k },
      screen: { x: L.bezelSide * k, y: L.bezelTop * k, w: screenW * k, h: screenH * k, radius: L.screenTop * k },
      screenAspect: screenW / screenH,
      base: { w: s.w * k, h: s.d * k, radius: s.base.corner * k, thickness: s.base.t * k },
      hinge: { y: (L.t / 2) * k, z: -1.4 * k, gap: 1.4 * k, inset: (L.t / 2) * k },
      open: clamp(device.open ?? 108, 0, 140),
      hardware: hardwareFinish(device, 'laptop')
    };
  }
  if (type === 'monitor') {
    const s = DISPLAY;
    const k = PHONE_MM;
    const screenW = s.w - s.bezel * 2;
    const screenH = s.h - s.bezel * 2;
    const path = standPath(s);
    return {
      type,
      spec: s,
      body: { w: s.w * k, h: s.h * k, radius: s.corner * k, squircle: true, thickness: s.t * k },
      screen: { x: s.bezel * k, y: s.bezel * k, w: screenW * k, h: screenH * k, radius: s.screenCorner * k },
      screenAspect: screenW / screenH,
      standBounds: { floor: path.floorY * k, front: path.front * k, back: path.back * k, width: s.stand.width * k },
      hardware: hardwareFinish(device, 'monitor')
    };
  }
  const aspect = viewportAspect(device, mediaAspect);
  const w = 3.2;
  if (type === 'browser' || type === 'window') {
    const dark = finish === 'dark';
    const px = w / 1216;
    const pad = 4 * px;
    const bar = 36 * px;
    const viewH = w / aspect;
    return {
      type,
      parts: ['slab'],
      body: { w: w + pad * 2, h: viewH + bar + pad * 2, radius: 16.8 * px, squircle: false, thickness: 0.02 },
      screen: { x: pad, y: pad + bar, w, h: viewH, radius: 12.8 * px },
      screenAspect: aspect,
      bodyColor: dark ? [0.082, 0.082, 0.086] : [0.961, 0.961, 0.961],
      band: dark ? [0.13, 0.13, 0.14] : [0.89, 0.89, 0.9],
      metal: 0.05,
      gloss: 0.3,
      chrome: { px, pad, bar },
      dark,
      glassy: false
    };
  }
  const radius = clamp(device.radius ?? 0.045, 0, 0.4);
  const glass = finish === 'glass';
  const pad = glass ? 0.07 : 0;
  const viewH = w / aspect;
  return {
    type: 'card',
    parts: ['slab'],
    body: {
      w: w + pad * 2,
      h: viewH + pad * 2,
      radius: radius + pad * 0.85,
      squircle: false,
      thickness: glass ? 0.03 : 0.007
    },
    screen: { x: pad, y: pad, w, h: viewH, radius },
    screenAspect: aspect,
    bodyColor: glass ? [0.9, 0.9, 0.92] : [0.06, 0.06, 0.07],
    band: glass ? [0.85, 0.86, 0.88] : [0.14, 0.14, 0.15],
    metal: glass ? 0.2 : 0.05,
    gloss: glass ? 0.5 : 0.2,
    edge: finish === 'edge',
    glass,
    glassy: glass
  };
}

const superCorner = (t, n = 4) => {
  const c = Math.cos(t);
  const s = Math.sin(t);
  return [Math.sign(c) * Math.pow(Math.abs(c), 2 / n), Math.sign(s) * Math.pow(Math.abs(s), 2 / n)];
};

export function outline(w, h, radius, squircle, segments = 18) {
  const points = [];
  const normals = [];
  const r = Math.min(radius, w / 2, h / 2);
  const corners = [
    [w / 2 - r, h / 2 - r, 0],
    [-w / 2 + r, h / 2 - r, Math.PI / 2],
    [-w / 2 + r, -h / 2 + r, Math.PI],
    [w / 2 - r, -h / 2 + r, Math.PI * 1.5]
  ];
  corners.forEach(([cx, cy, start]) => {
    for (let i = 0; i <= segments; i += 1) {
      const t = start + (i / segments) * (Math.PI / 2);
      let x;
      let y;
      let nx;
      let ny;
      if (squircle) {
        const [sx, sy] = superCorner(t);
        x = cx + sx * r;
        y = cy + sy * r;
        const gx = Math.sign(sx) * Math.pow(Math.abs(sx), 3);
        const gy = Math.sign(sy) * Math.pow(Math.abs(sy), 3);
        const l = Math.hypot(gx, gy) || 1;
        nx = gx / l;
        ny = gy / l;
      } else {
        nx = Math.cos(t);
        ny = Math.sin(t);
        x = cx + nx * r;
        y = cy + ny * r;
      }
      points.push([x, y]);
      normals.push([nx, ny]);
    }
  });
  return { points, normals };
}

export function slabGeometry(body, { rings = 7, edgeRound = 0.65 } = {}) {
  const { w, h, radius, squircle, thickness } = body;
  const half = thickness / 2;
  const front = {
    position: new Float32Array([-w / 2, -h / 2, half, w / 2, -h / 2, half, w / 2, h / 2, half, -w / 2, h / 2, half]),
    normal: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]),
    uv: new Float32Array([0, 1, 1, 1, 1, 0, 0, 0]),
    index: new Uint16Array([0, 1, 2, 0, 2, 3])
  };
  const back = {
    position: new Float32Array([
      w / 2,
      -h / 2,
      -half,
      -w / 2,
      -h / 2,
      -half,
      -w / 2,
      h / 2,
      -half,
      w / 2,
      h / 2,
      -half
    ]),
    normal: new Float32Array([0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1]),
    uv: new Float32Array([1, 1, 0, 1, 0, 0, 1, 0]),
    index: new Uint16Array([0, 1, 2, 0, 2, 3])
  };
  const { points, normals } = outline(w, h, radius, squircle);
  const count = points.length;
  const position = [];
  const normal = [];
  const uv = [];
  for (let ring = 0; ring < rings; ring += 1) {
    const f = ring / (rings - 1);
    const z = half - f * thickness;
    const theta = (0.5 - f) * Math.PI * edgeRound;
    const nz = Math.sin(theta);
    const nr = Math.cos(theta);
    for (let i = 0; i < count; i += 1) {
      const [x, y] = points[i];
      const [nx, ny] = normals[i];
      position.push(x, y, z);
      normal.push(nx * nr, ny * nr, nz);
      uv.push(i / count, f);
    }
  }
  const index = [];
  for (let ring = 0; ring < rings - 1; ring += 1) {
    for (let i = 0; i < count; i += 1) {
      const a = ring * count + i;
      const b = ring * count + ((i + 1) % count);
      const c = (ring + 1) * count + i;
      const d = (ring + 1) * count + ((i + 1) % count);
      index.push(a, c, b, b, c, d);
    }
  }
  const band = {
    position: new Float32Array(position),
    normal: new Float32Array(normal),
    uv: new Float32Array(uv),
    index: count * rings > 65535 ? new Uint32Array(index) : new Uint16Array(index)
  };
  return { front, back, band };
}

const rgb = (c, a = 1) => `rgba(${Math.round(c[0] * 255)}, ${Math.round(c[1] * 255)}, ${Math.round(c[2] * 255)}, ${a})`;

const roundRectPath = (ctx, x, y, w, h, r) => {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
};

function drawLock(ctx, x, y, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size * 0.14;
  const bodyW = size * 0.72;
  const bodyH = size * 0.54;
  roundRectPath(ctx, x - bodyW / 2, y - bodyH * 0.2, bodyW, bodyH, size * 0.12);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y - bodyH * 0.2, bodyW * 0.32, Math.PI, 0);
  ctx.stroke();
  ctx.restore();
}

export function drawArt(layout, device, scale) {
  const { w, h } = layout.body;
  const width = Math.max(4, Math.round(w * scale));
  const height = Math.max(4, Math.round(h * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const s = width / w;
  const screen = layout.screen;
  const hole = () => {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000';
    roundRectPath(ctx, screen.x * s, screen.y * s, screen.w * s, screen.h * s, screen.radius * s);
    ctx.fill();
    ctx.restore();
  };

  if (layout.type === 'browser' || layout.type === 'window') {
    const dark = layout.dark;
    const { px: unit, pad, bar } = layout.chrome;
    const p = unit * s;
    const border = dark ? '#222224' : '#e4e4e6';
    const frame = rgb(layout.bodyColor);
    roundRectPath(ctx, 0, 0, width, height, layout.body.radius * s);
    ctx.fillStyle = frame;
    ctx.fill();
    const barTop = pad * s;
    const barMid = barTop + (bar * s) / 2;
    const lights =
      device.lights === 'color'
        ? ['#ff5f57', '#febc2e', '#28c840']
        : dark
          ? ['#262628', '#262628', '#262628']
          : ['#e2e2e4', '#e2e2e4', '#e2e2e4'];
    lights.forEach((color, i) => {
      ctx.beginPath();
      ctx.arc(pad * s + 12 * p + 5 * p + i * 16 * p, barMid, 5 * p, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      if (device.lights === 'color') {
        ctx.lineWidth = Math.max(1, 0.6 * p);
        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
        ctx.stroke();
      }
    });
    const label = layout.type === 'browser' ? (device.url ?? 'reactbits.dev').trim() : (device.title ?? '').trim();
    if (label) {
      const fontSize = 11 * p;
      ctx.font = `500 ${fontSize}px Geist, "Geist Fallback", system-ui, sans-serif`;
      ctx.textBaseline = 'middle';
      const measured = ctx.measureText(label).width;
      if (layout.type === 'browser') {
        const lock = 10 * p;
        const pillH = 24 * p;
        const pillW = measured + lock + 6 * p + 28 * p;
        const x0 = width / 2 - pillW / 2;
        roundRectPath(ctx, x0, barMid - pillH / 2, pillW, pillH, pillH / 2);
        ctx.fillStyle = dark ? '#0e0e0f' : '#fdfdfd';
        ctx.fill();
        ctx.lineWidth = Math.max(1, p);
        ctx.strokeStyle = border;
        ctx.stroke();
        const muted = dark ? '#a1a1a6' : '#6e6e73';
        drawLock(ctx, x0 + 14 * p + lock / 2, barMid + lock * 0.08, lock, muted);
        ctx.fillStyle = muted;
        ctx.fillText(label, x0 + 14 * p + lock + 6 * p, barMid + fontSize * 0.04);
      } else {
        ctx.fillStyle = dark ? '#a1a1a6' : '#6e6e73';
        ctx.textAlign = 'center';
        ctx.fillText(label, width / 2, barMid + fontSize * 0.04);
        ctx.textAlign = 'left';
      }
    }
    hole();
    const screen = layout.screen;
    ctx.save();
    ctx.lineWidth = Math.max(1, p);
    ctx.strokeStyle = border;
    roundRectPath(
      ctx,
      screen.x * s - 0.5 * p,
      screen.y * s - 0.5 * p,
      screen.w * s + p,
      screen.h * s + p,
      screen.radius * s + 0.5 * p
    );
    ctx.stroke();
    roundRectPath(ctx, 0.5 * p, 0.5 * p, width - p, height - p, layout.body.radius * s - 0.5 * p);
    ctx.stroke();
    ctx.restore();
    return canvas;
  }

  if (layout.type === 'card') {
    if (layout.glass) {
      ctx.fillStyle = 'rgba(255,255,255,0.0)';
      ctx.fillRect(0, 0, width, height);
      const g = ctx.createLinearGradient(0, 0, width, height);
      g.addColorStop(0, 'rgba(255,255,255,0.34)');
      g.addColorStop(1, 'rgba(255,255,255,0.16)');
      roundRectPath(ctx, 0, 0, width, height, layout.body.radius * s);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.lineWidth = Math.max(1, 0.004 * s);
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      roundRectPath(
        ctx,
        ctx.lineWidth / 2,
        ctx.lineWidth / 2,
        width - ctx.lineWidth,
        height - ctx.lineWidth,
        layout.body.radius * s
      );
      ctx.stroke();
      hole();
      return canvas;
    }
    if (layout.edge) {
      ctx.lineWidth = Math.max(1, 0.0035 * s);
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      roundRectPath(
        ctx,
        ctx.lineWidth / 2,
        ctx.lineWidth / 2,
        width - ctx.lineWidth,
        height - ctx.lineWidth,
        layout.body.radius * s
      );
      ctx.stroke();
      return canvas;
    }
    return null;
  }

  ctx.fillStyle = rgb(layout.bodyColor);
  roundRectPath(ctx, 0, 0, width, height, layout.body.radius * s);
  ctx.fill();
  hole();
  return canvas;
}

export function mediaTransform(
  screenAspect,
  mediaAspect,
  { fit = 'cover', alignX = 0.5, alignY = 0, scroll = null } = {}
) {
  if (!mediaAspect) return [1, 1, 0, 0];
  if (fit === 'contain') {
    if (mediaAspect > screenAspect) {
      const sy = mediaAspect / screenAspect;
      return [1, sy, 0, -(sy - 1) / 2];
    }
    const sx = screenAspect / mediaAspect;
    return [sx, 1, -(sx - 1) / 2, 0];
  }
  if (mediaAspect > screenAspect) {
    const fx = screenAspect / mediaAspect;
    return [fx, 1, alignX * (1 - fx), 0];
  }
  const fy = mediaAspect / screenAspect;
  const y = scroll === null || scroll === undefined ? alignY : scroll;
  return [1, fy, 0, clamp(y, 0, 1) * (1 - fy)];
}
