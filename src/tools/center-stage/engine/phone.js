import { hexToRgb } from './math';

export const PHONE_MM = 1.553 / 150;

export const PHONE_COLORS = [
  { value: 'burgundy', label: 'Burgundy', hex: '#7d4a55' },
  { value: 'black', label: 'Space black', hex: '#3a3b3f' },
  { value: 'silver', label: 'Silver', hex: '#cfd0d3' },
  { value: 'glacier', label: 'Glacier', hex: '#a9b9cf' },
  { value: 'orange', label: 'Cosmic orange', hex: '#d4552e' },
  { value: 'blue', label: 'Deep blue', hex: '#30405c' },
  { value: 'natural', label: 'Natural', hex: '#aaa59b' },
  { value: 'red', label: 'Cherry', hex: '#a3182c' }
];

export const TABLET_COLORS = [
  { value: 'black', label: 'Space black', hex: '#3a3b3f' },
  { value: 'silver', label: 'Silver', hex: '#cfd0d3' }
];

export const PHONE_METALS = [
  { value: 'satin', label: 'Satin' },
  { value: 'brushed', label: 'Brushed' },
  { value: 'polished', label: 'Polished' }
];

export const PHONE_ISLANDS = [
  { value: 'pill', label: 'Pill' },
  { value: 'compact', label: 'Compact' },
  { value: 'none', label: 'None' }
];

export const PHONE = {
  id: 'phone',
  w: 71.9,
  h: 150,
  t: 8.75,
  corner: 13.8,
  exponent: 2.7,
  glassInset: 1.35,
  glassEdge: 0.45,
  glassDrop: 0.06,
  lip: 1.75,
  back: 1.6,
  bezel: 2.6,
  screenCorner: 11.2,
  plateau: { shape: 'band', bottom: 43.6, inset: 3.4, rise: 1.5, fillet: 0.5, edge: 1.12, corner: 4.6 },
  lens: { outer: 7.8, top: 6.6, glass: 5.55, rise: 1.75, bevel: 0.62, chamfer: 0.3, recess: 0.8 },
  lenses: [
    [21.45, 61.05],
    [21.45, 41.9],
    [3.15, 51.5]
  ],
  flash: [-22.45, 62, 3.2],
  mic: [-22.45, 51.7, 0.5],
  lidar: [-22.45, 41.3, 3.3],
  window: { gap: 5.2 },
  buttons: [
    { edge: 'left', at: 34, length: 7 },
    { edge: 'left', at: 48.3, length: 11 },
    { edge: 'left', at: 62.4, length: 11 },
    { edge: 'right', at: 55.5, length: 17.6 }
  ],
  button: { height: 2.6, radius: 1.15, protrude: 0.5, edge: 0.3 },
  control: { at: 97, length: 17.5, height: 3.3 },
  antenna: 15.7,
  port: 'bottom',
  islands: { pill: [16, 5.5], compact: [11.8, 5.5] }
};

export const PHONE_POINTS = [393, 852];
export const PHONE_STATUS = 59;

const TABLET_BUMP = { cx: 71.4, cy: 107.5, size: 19.6 };

export const TABLET = {
  id: 'tablet',
  w: 177.5,
  h: 249.7,
  t: 5.3,
  corner: 18.5,
  exponent: 2.6,
  glassInset: 0.95,
  glassEdge: 0.35,
  glassDrop: 0.05,
  lip: 1.05,
  back: 0.9,
  bezel: 8.2,
  screenCorner: 10.6,
  plateau: {
    shape: 'bump',
    cx: TABLET_BUMP.cx,
    cy: TABLET_BUMP.cy,
    w: TABLET_BUMP.size,
    h: TABLET_BUMP.size,
    corner: 6.4,
    rise: 1.0,
    fillet: 0.35,
    edge: 0.62
  },
  lens: { outer: 4.9, top: 4.15, glass: 3.5, rise: 1.0, bevel: 0.42, chamfer: 0.22, recess: 0.5 },
  lenses: [[TABLET_BUMP.cx + 4.3, TABLET_BUMP.cy + 4.3]],
  flash: [TABLET_BUMP.cx - 4.6, TABLET_BUMP.cy + 4.6, 1.75],
  mic: [TABLET_BUMP.cx - 4.6, TABLET_BUMP.cy - 4.6, 0.4],
  lidar: [TABLET_BUMP.cx + 4.4, TABLET_BUMP.cy - 4.6, 2.05],
  window: null,
  buttons: [
    { edge: 'top', at: 52, length: 18 },
    { edge: 'right', at: 30, length: 14 },
    { edge: 'right', at: 47, length: 14 }
  ],
  button: { height: 2.0, radius: 0.95, protrude: 0.42, edge: 0.24 },
  control: null,
  antenna: null,
  port: 'bottom',
  camera: { center: [177.5 / 2 - 4.1, 0], size: [2.3, 2.3] }
};

const rotatePoint = ([x, y, ...rest]) => [-y, x, ...rest];

const rotateButton = (button, s) => {
  if (button.edge === 'right') return { ...button, edge: 'top', at: button.at - s.h / 2 };
  if (button.edge === 'top') return { ...button, edge: 'left', at: s.w / 2 - button.at };
  if (button.edge === 'left') return { ...button, edge: 'bottom', at: button.at - s.h / 2 };
  return { ...button, edge: 'right', at: s.w / 2 - button.at };
};

export function landscape(s) {
  const p = s.plateau;
  const [cx, cy] = rotatePoint([p.cx, p.cy]);
  return {
    ...s,
    id: `${s.id}-landscape`,
    w: s.h,
    h: s.w,
    plateau: { ...p, cx, cy, w: p.h, h: p.w },
    lenses: s.lenses.map(rotatePoint),
    flash: rotatePoint(s.flash),
    mic: rotatePoint(s.mic),
    lidar: rotatePoint(s.lidar),
    buttons: s.buttons.map(button => rotateButton(button, s)),
    port: 'right',
    camera: s.camera
      ? { ...s.camera, center: rotatePoint(s.camera.center), size: [s.camera.size[1], s.camera.size[0]] }
      : null
  };
}

export const TABLET_LANDSCAPE = landscape(TABLET);

export const PART = {
  rim: 0,
  metal: 1,
  front: 2,
  back: 3,
  plateau: 4,
  polished: 5,
  lens: 6,
  well: 7,
  keycap: 8,
  keytop: 9,
  deck: 10,
  dark: 11,
  gap: 12
};

export const phoneFinish = device => {
  const named = PHONE_COLORS.find(item => item.value === device.finish) || PHONE_COLORS[1];
  const hex = device.color || named.hex;
  return { hex, rgb: hexToRgb(hex) };
};

const superCorner = (t, n) => {
  const x = Math.pow(Math.max(Math.cos(t), 0), 2 / n);
  const y = Math.pow(Math.max(Math.sin(t), 0), 2 / n);
  const gx = Math.pow(x, n - 1);
  const gy = Math.pow(y, n - 1);
  const l = Math.hypot(gx, gy) || 1;
  return { x, y, nx: gx / l, ny: gy / l };
};

const sampleCache = new Map();

function cornerSamples(n, count) {
  const key = `${n}|${count}`;
  if (sampleCache.has(key)) return sampleCache.get(key);
  const fine = 2048;
  const pts = [];
  for (let i = 0; i <= fine; i += 1) pts.push(superCorner((i / fine) * (Math.PI / 2), n));
  const lengths = [0];
  for (let i = 1; i <= fine; i += 1)
    lengths.push(lengths[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = lengths[fine];
  const out = [];
  let j = 0;
  for (let k = 0; k <= count; k += 1) {
    const target = (k / count) * total;
    while (j < fine - 1 && lengths[j + 1] < target) j += 1;
    const f = Math.min(1, Math.max(0, (target - lengths[j]) / Math.max(lengths[j + 1] - lengths[j], 1e-12)));
    const a = pts[j];
    const b = pts[j + 1];
    const nx = a.nx + (b.nx - a.nx) * f;
    const ny = a.ny + (b.ny - a.ny) * f;
    const l = Math.hypot(nx, ny) || 1;
    out.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, nx: nx / l, ny: ny / l });
  }
  out[0] = { x: 1, y: 0, nx: 1, ny: 0 };
  out[count] = { x: 0, y: 1, nx: 0, ny: 1 };
  sampleCache.set(key, out);
  return out;
}

export function roundedOutline(w, h, corners, perCorner = 40, center = [0, 0]) {
  const [tr, tl, bl, br] = corners;
  const spec = [
    { c: tr, cx: w / 2 - tr.r, cy: h / 2 - tr.r, sx: 1, sy: 1, reverse: false },
    { c: tl, cx: -w / 2 + tl.r, cy: h / 2 - tl.r, sx: -1, sy: 1, reverse: true },
    { c: bl, cx: -w / 2 + bl.r, cy: -h / 2 + bl.r, sx: -1, sy: -1, reverse: false },
    { c: br, cx: w / 2 - br.r, cy: -h / 2 + br.r, sx: 1, sy: -1, reverse: true }
  ];
  const points = [];
  const normals = [];
  spec.forEach(({ c, cx, cy, sx, sy, reverse }) => {
    const samples = cornerSamples(c.n, perCorner);
    for (let k = 0; k <= perCorner; k += 1) {
      const s = samples[reverse ? perCorner - k : k];
      points.push([center[0] + cx + sx * c.r * s.x, center[1] + cy + sy * c.r * s.y]);
      normals.push([sx * s.nx, sy * s.ny]);
    }
  });
  return { points, normals };
}

export function offsetOutline(ring, o) {
  return {
    points: ring.points.map(([x, y], i) => [x + ring.normals[i][0] * o, y + ring.normals[i][1] * o]),
    normals: ring.normals
  };
}

export class Builder {
  constructor() {
    this.position = [];
    this.normal = [];
    this.uv = [];
    this.part = [];
    this.index = [];
  }

  vertex(p, n, uv, part) {
    this.position.push(p[0], p[1], p[2]);
    this.normal.push(n[0], n[1], n[2]);
    this.uv.push(uv[0], uv[1]);
    this.part.push(part);
    return this.position.length / 3 - 1;
  }

  tri(a, b, c) {
    this.index.push(a, b, c);
  }

  quad(a, b, c, d) {
    this.index.push(a, b, c, a, c, d);
  }

  build() {
    const count = this.position.length / 3;
    return {
      position: new Float32Array(this.position),
      normal: new Float32Array(this.normal),
      uv: new Float32Array(this.uv),
      part: new Float32Array(this.part),
      index: count > 65535 ? new Uint32Array(this.index) : new Uint16Array(this.index)
    };
  }
}

const identityMap = { p: p => p, n: n => n };

export function sweep(b, ring, segments, map = identityMap) {
  const count = ring.points.length;
  segments.forEach(segment => {
    let previous = null;
    segment.forEach(pv => {
      const row = [];
      for (let i = 0; i < count; i += 1) {
        const [px, py] = ring.points[i];
        const [nx, ny] = ring.normals[i];
        const position = [px + nx * pv.o, py + ny * pv.o, pv.z];
        const normal = [nx * pv.no, ny * pv.no, pv.nz];
        row.push(b.vertex(map.p(position), map.n(normal), [i / count, pv.v ?? 0], pv.part));
      }
      if (previous) {
        for (let i = 0; i < count; i += 1) {
          const j = (i + 1) % count;
          b.quad(previous[i], row[i], row[j], previous[j]);
        }
      }
      previous = row;
    });
  });
}

export function fan(b, ring, o, z, normal, part, center, map = identityMap) {
  const count = ring.points.length;
  const c = b.vertex(map.p([center[0], center[1], z]), map.n(normal), [0.5, 0.5], part);
  const ids = ring.points.map(([px, py], i) => {
    const [nx, ny] = ring.normals[i];
    return b.vertex(map.p([px + nx * o, py + ny * o, z]), map.n(normal), [i / count, 1], part);
  });
  for (let i = 0; i < count; i += 1) b.tri(c, ids[i], ids[(i + 1) % count]);
}

export const arc = (center, radius, from, to, steps, part, flip = false) => {
  const out = [];
  for (let i = 0; i <= steps; i += 1) {
    const a = from + (to - from) * (i / steps);
    const c = Math.cos(a);
    const s = Math.sin(a);
    out.push({ o: center[0] + radius * c, z: center[1] + radius * s, no: flip ? -c : c, nz: flip ? -s : s, part });
  }
  return out;
};

export function phoneFrame(s = PHONE) {
  const half = s.t / 2;
  const meet = -s.glassInset + s.glassEdge;
  const zMeet = half - s.glassEdge - s.glassDrop;
  const theta = Math.acos(1 + meet / s.lip);
  const flatTop = zMeet - s.lip * Math.sin(theta);
  const flatBottom = -half + s.back;
  return { meet, zMeet, theta, flatTop, flatBottom, mid: (flatTop + flatBottom) / 2 };
}

function bandSegments(s) {
  const half = s.t / 2;
  const f = phoneFrame(s);
  const gi = -s.glassInset;
  const rg = s.glassEdge;
  const glass = arc([gi, half - rg], rg, Math.PI / 2, 0, 10, PART.rim);
  glass.push({ o: f.meet, z: f.zMeet, no: 1, nz: 0, part: PART.rim });
  const frame = arc([-s.lip, f.flatTop], s.lip, f.theta, 0, 18, PART.metal);
  frame.push({ o: 0, z: f.flatBottom, no: 1, nz: 0, part: PART.metal });
  const backArc = arc([-s.back, f.flatBottom], s.back, 0, -Math.PI / 2, 16, PART.metal);
  return [glass, [...frame, ...backArc.slice(1)]];
}

function plateauSegments(s) {
  const half = s.t / 2;
  const p = s.plateau;
  const base = -half;
  const top = base - p.rise;
  const fillet = arc([p.fillet, base - p.fillet], p.fillet, Math.PI / 2, Math.PI, 8, PART.metal, true);
  const wall = { o: 0, z: top + p.edge, no: 1, nz: 0, part: PART.metal };
  const edge = arc([-p.edge, top + p.edge], p.edge, 0, -Math.PI / 2, 14, PART.metal);
  fillet[0].z = base - 0.004;
  return [[...fillet, wall, ...edge.slice(1)]];
}

export function latheRows(b, center, z0, rows, steps) {
  let previous = null;
  rows.forEach(row => {
    const ids = [];
    for (let i = 0; i < steps; i += 1) {
      const a = (i / steps) * Math.PI * 2;
      const c = Math.cos(a);
      const sn = Math.sin(a);
      ids.push(
        b.vertex(
          [center[0] + row.r * c, center[1] + row.r * sn, z0 - row.h],
          [row.nr * c, row.nr * sn, -row.nh],
          [c * row.r, sn * row.r],
          row.part
        )
      );
    }
    if (previous && !row.crease) {
      for (let i = 0; i < steps; i += 1) {
        const j = (i + 1) % steps;
        b.quad(previous[i], ids[i], ids[j], previous[j]);
      }
    }
    previous = ids;
  });
}

function lensGeometry(b, s, center, z0) {
  const L = s.lens;
  const steps = 96;
  const rows = [];
  rows.push({ r: L.outer, h: -0.3, nr: 1, nh: 0, part: PART.metal });
  rows.push({ r: L.outer, h: L.rise - L.bevel - 0.12, nr: 1, nh: 0, part: PART.metal });
  rows.push({ r: L.outer, h: L.rise - L.bevel - 0.12, nr: 1, nh: 0, part: PART.polished, crease: true });
  rows.push({ r: L.outer, h: L.rise - L.bevel, nr: 1, nh: 0, part: PART.polished });
  for (let i = 1; i <= 10; i += 1) {
    const a = (i / 10) * (Math.PI / 2);
    rows.push({
      r: L.outer - L.bevel + L.bevel * Math.cos(a),
      h: L.rise - L.bevel + L.bevel * Math.sin(a),
      nr: Math.cos(a),
      nh: Math.sin(a),
      part: PART.polished
    });
  }
  rows.push({ r: L.outer - L.bevel, h: L.rise, nr: 0, nh: 1, part: PART.metal, crease: true });
  rows.push({ r: L.top + L.chamfer, h: L.rise, nr: 0, nh: 1, part: PART.metal });
  rows.push({ r: L.top + L.chamfer, h: L.rise, nr: 0, nh: 1, part: PART.polished, crease: true });
  for (let i = 1; i <= 8; i += 1) {
    const a = (Math.PI / 2) * (i / 8);
    rows.push({
      r: L.top + L.chamfer - L.chamfer * Math.sin(a),
      h: L.rise - L.chamfer + L.chamfer * Math.cos(a),
      nr: -Math.sin(a),
      nh: Math.cos(a),
      part: PART.polished
    });
  }
  const wellTop = L.rise - L.chamfer;
  const slope = Math.atan2(L.top - L.glass, wellTop - L.recess);
  rows.push({ r: L.top, h: wellTop, nr: -Math.cos(slope), nh: Math.sin(slope), part: PART.well, crease: true });
  rows.push({ r: L.glass, h: L.recess, nr: -Math.cos(slope), nh: Math.sin(slope), part: PART.well });
  latheRows(b, center, z0, rows, steps);
  const glassZ = z0 - L.recess;
  const c = b.vertex([center[0], center[1], glassZ], [0, 0, -1], [0, 0], PART.lens);
  const ids = [];
  for (let i = 0; i < steps; i += 1) {
    const a = (i / steps) * Math.PI * 2;
    ids.push(
      b.vertex(
        [center[0] + L.glass * Math.cos(a), center[1] + L.glass * Math.sin(a), glassZ],
        [0, 0, -1],
        [Math.cos(a), Math.sin(a)],
        PART.lens
      )
    );
  }
  for (let i = 0; i < steps; i += 1) b.tri(c, ids[i], ids[(i + 1) % steps]);
}

function buttonGeometry(b, s, button) {
  const B = s.button;
  const f = phoneFrame(s);
  const ring = roundedOutline(button.length, B.height, Array(4).fill({ r: B.radius, n: 2 }), 12);
  const vertical = button.edge === 'left' || button.edge === 'right';
  const sign = button.edge === 'right' || button.edge === 'top' ? 1 : -1;
  const map = vertical
    ? {
        p: ([u, v, w]) => [sign * (s.w / 2 + w), s.h / 2 - button.at + u, f.mid + v],
        n: ([u, v, w]) => [sign * w, u, v]
      }
    : {
        p: ([u, v, w]) => [button.at + u, sign * (s.h / 2 + w), f.mid + v],
        n: ([u, v, w]) => [u, sign * w, v]
      };
  const wall = [
    { o: 0, z: -0.3, no: 1, nz: 0, part: PART.metal },
    { o: 0, z: B.protrude - B.edge - 0.05, no: 1, nz: 0, part: PART.metal }
  ];
  const edgeRows = arc([-B.edge, B.protrude - B.edge], B.edge, 0, Math.PI / 2, 8, PART.polished);
  const wallEnd = { ...edgeRows[0], z: B.protrude - B.edge - 0.05, part: PART.polished };
  sweep(b, ring, [wall, [wallEnd, ...edgeRows]], map);
  fan(b, ring, -B.edge, B.protrude, [0, 0, 1], PART.metal, [0, 0], map);
}

export function phoneGeometry(s = PHONE) {
  const half = s.t / 2;
  const corner = { r: s.corner, n: s.exponent };
  const outline = roundedOutline(s.w, s.h, [corner, corner, corner, corner], 48);
  const body = new Builder();
  sweep(body, outline, bandSegments(s));
  fan(body, outline, -s.glassInset, half, [0, 0, 1], PART.front, [0, 0]);
  fan(body, outline, -s.back, -half, [0, 0, -1], PART.back, [0, 0]);

  const p = s.plateau;
  const plateau = new Builder();
  const ring = plateauOutline(s);
  sweep(plateau, ring.outline, plateauSegments(s));
  fan(plateau, ring.outline, -p.edge, -half - p.rise, [0, 0, -1], PART.plateau, ring.center);

  const details = new Builder();
  s.lenses.forEach(([x, y]) => lensGeometry(details, s, [x, y], -half - p.rise));
  s.buttons.forEach(button => buttonGeometry(details, s, button));

  return { body: body.build(), plateau: plateau.build(), details: details.build() };
}

export function plateauOutline(s = PHONE) {
  const p = s.plateau;
  if (p.shape === 'bump') {
    const corner = { r: p.corner, n: s.exponent };
    const center = [p.cx, p.cy];
    return {
      outline: roundedOutline(p.w, p.h, [corner, corner, corner, corner], 28, center),
      center,
      w: p.w,
      h: p.h,
      r: p.corner,
      low: p.corner
    };
  }
  const w = s.w - p.inset * 2;
  const top = s.h / 2 - p.inset;
  const bottom = s.h / 2 - p.bottom;
  const h = top - bottom;
  const r = s.corner - p.inset;
  const corner = { r, n: s.exponent };
  const low = { r: p.corner, n: 2 };
  const center = [0, (top + bottom) / 2];
  return { outline: roundedOutline(w, h, [corner, corner, low, low], 44, center), center, w, h, r, low: p.corner };
}

export function windowShape(s = PHONE) {
  if (!s.window) return null;
  const p = s.plateau;
  const halfW = s.w / 2 - p.inset;
  const top = s.h / 2 - p.bottom - s.window.gap;
  const bottom = -s.h / 2 + p.inset;
  return {
    center: [0, (top + bottom) / 2],
    half: [halfW, (top - bottom) / 2],
    top: p.corner,
    bottom: s.corner - p.inset
  };
}
