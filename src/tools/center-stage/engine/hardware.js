import { Builder, PART, arc, fan, latheRows, roundedOutline, sweep } from './phone';

export const LAPTOP = {
  id: 'laptop',
  w: 312.6,
  d: 221.2,
  base: { t: 10.4, corner: 10.5, exponent: 2.5, top: 1.15, bottom: 3.4 },
  lid: {
    t: 4.8,
    h: 221.2,
    corner: 10.5,
    exponent: 2.5,
    glassInset: 1.25,
    glassEdge: 0.4,
    glassDrop: 0.05,
    lip: 1.25,
    back: 1.35,
    bezelSide: 5.6,
    bezelTop: 5.6,
    bezelBottom: 19.9,
    screenTop: 4.9,
    screenBottom: 0.9,
    notch: [31, 6.4, 2.6]
  },
  hinge: { radius: 3.5, inset: 36 },
  keyboard: { unit: 18.55, gap: 2.35, back: 9.4, corner: 1.75, rise: 0.72, edge: 0.3, frame: 0.85 },
  trackpad: { w: 140, h: 82, gap: 9.5, corner: 7.5 },
  grille: { inset: 4.4, hole: 0.34, pitch: 1.42 },
  feet: { inset: 24, radius: 6.5, height: 1.3 }
};

export const DISPLAY = {
  id: 'display',
  w: 623,
  h: 361.4,
  t: 21,
  corner: 13,
  exponent: 2.4,
  glassInset: 1.1,
  glassEdge: 0.45,
  glassDrop: 0.05,
  lip: 1.3,
  back: 4.5,
  bezel: 12.6,
  screenCorner: 3.2,
  stand: { width: 152, thickness: 9.5, corner: 3.2, attach: -40, drop: 105, lean: 15, foot: 140, bend: 30 }
};

const U = 1;

export const KEY_ROWS = [
  [['esc', 1.5], ...Array.from({ length: 12 }, (_, i) => [`F${i + 1}`, U]), ['', U, 'touch']],
  [
    ['`', U, '~'],
    ['1', U, '!'],
    ['2', U, '@'],
    ['3', U, '#'],
    ['4', U, '$'],
    ['5', U, '%'],
    ['6', U, '^'],
    ['7', U, '&'],
    ['8', U, '*'],
    ['9', U, '('],
    ['0', U, ')'],
    ['-', U, '_'],
    ['=', U, '+'],
    ['delete', 1.5, 'right']
  ],
  [
    ['tab', 1.5, 'left'],
    ...'QWERTYUIOP'.split('').map(char => [char, U]),
    ['[', U, '{'],
    [']', U, '}'],
    ['\\', U, '|']
  ],
  [
    ['caps lock', 1.75, 'left'],
    ...'ASDFGHJKL'.split('').map(char => [char, U]),
    [';', U, ':'],
    ["'", U, '"'],
    ['return', 1.75, 'right']
  ],
  [
    ['shift', 2.25, 'left'],
    ...'ZXCVBNM'.split('').map(char => [char, U]),
    [',', U, '<'],
    ['.', U, '>'],
    ['/', U, '?'],
    ['shift', 2.25, 'right']
  ],
  [
    ['fn', U, 'globe'],
    ['control', U, 'mod', '⌃'],
    ['option', U, 'mod', '⌥'],
    ['command', 1.25, 'mod', '⌘'],
    ['', 5],
    ['command', 1.25, 'mod', '⌘'],
    ['option', U, 'mod', '⌥'],
    ['◀', U, 'arrow-low'],
    ['▲', U, 'arrow-high'],
    ['▶', U, 'arrow-low']
  ]
];

export function keyboardKeys(s = LAPTOP) {
  const K = s.keyboard;
  const width = 14.5 * K.unit;
  const left = -width / 2;
  const top = s.d / 2 - K.back;
  const keys = [];
  KEY_ROWS.forEach((row, r) => {
    let x = left;
    const rowTop = top - r * K.unit;
    row.forEach(([label, size, kind, glyph]) => {
      const w = size * K.unit;
      const cx = x + w / 2;
      const cy = rowTop - K.unit / 2;
      const capW = w - K.gap;
      const capH = K.unit - K.gap;
      if (kind === 'arrow-high') {
        const half = (capH - K.gap * 0.5) / 2;
        keys.push({ label: '▲', kind: 'arrow', cx, cy: cy + half / 2 + K.gap * 0.25, w: capW, h: half });
        keys.push({ label: '▼', kind: 'arrow', cx, cy: cy - half / 2 - K.gap * 0.25, w: capW, h: half });
      } else if (kind === 'arrow-low') {
        const half = (capH - K.gap * 0.5) / 2;
        keys.push({ label, kind: 'arrow', cx, cy: cy - half / 2 - K.gap * 0.25, w: capW, h: half });
      } else {
        keys.push({ label, kind: kind || 'char', glyph, cx, cy, w: capW, h: capH, size });
      }
      x += w;
    });
  });
  return { keys, rect: [left, top - KEY_ROWS.length * K.unit, width, KEY_ROWS.length * K.unit] };
}

function slab(b, outline, spec, front, back) {
  const half = spec.t / 2;
  const segments = [];
  if (front === 'glass') {
    const gi = -spec.glassInset;
    const rg = spec.glassEdge;
    const glass = arc([gi, half - rg], rg, Math.PI / 2, 0, 8, PART.rim);
    const meet = gi + rg;
    const zMeet = half - rg - spec.glassDrop;
    glass.push({ o: meet, z: zMeet, no: 1, nz: 0, part: PART.rim });
    const theta = Math.acos(Math.min(1, Math.max(-1, 1 + meet / spec.lip)));
    const flatTop = zMeet - spec.lip * Math.sin(theta);
    const frame = arc([-spec.lip, flatTop], spec.lip, theta, 0, 12, PART.metal);
    const flatBottom = -half + spec.back;
    frame.push({ o: 0, z: flatBottom, no: 1, nz: 0, part: PART.metal });
    const backArc = arc([-spec.back, flatBottom], spec.back, 0, -Math.PI / 2, 12, PART.metal);
    segments.push(glass, [...frame, ...backArc.slice(1)]);
    sweep(b, outline, segments);
    fan(b, outline, gi, half, [0, 0, 1], PART.front, [0, 0]);
    fan(b, outline, -spec.back, -half, [0, 0, -1], back, [0, 0]);
    return;
  }
  const topR = spec.top;
  const bottomR = spec.bottom;
  const upper = arc([-topR, half - topR], topR, Math.PI / 2, 0, 10, PART.metal);
  upper.push({ o: 0, z: -half + bottomR, no: 1, nz: 0, part: PART.metal });
  const lower = arc([-bottomR, -half + bottomR], bottomR, 0, -Math.PI / 2, 12, PART.metal);
  sweep(b, outline, [[...upper, ...lower.slice(1)]]);
  fan(b, outline, -topR, half, [0, 0, 1], front, [0, 0]);
  fan(b, outline, -bottomR, -half, [0, 0, -1], back, [0, 0]);
}

function keycap(b, key, top, s) {
  const K = s.keyboard;
  const corner = { r: Math.min(K.corner, key.h * 0.3), n: 2.6 };
  const ring = roundedOutline(key.w, key.h, [corner, corner, corner, corner], 8, [key.cx, key.cy]);
  const well = roundedOutline(
    key.w + K.frame * 2,
    key.h + K.frame * 2,
    [
      { r: corner.r + K.frame, n: 2.4 },
      { r: corner.r + K.frame, n: 2.4 },
      { r: corner.r + K.frame, n: 2.4 },
      { r: corner.r + K.frame, n: 2.4 }
    ],
    8,
    [key.cx, key.cy]
  );
  fan(b, well, 0, top + 0.012, [0, 0, 1], PART.gap, [key.cx, key.cy]);
  const wall = [
    { o: 0, z: top - 0.2, no: 1, nz: 0, part: PART.keycap },
    { o: 0, z: top + K.rise - K.edge, no: 1, nz: 0, part: PART.keycap }
  ];
  const edge = arc([-K.edge, top + K.rise - K.edge], K.edge, 0, Math.PI / 2, 5, PART.keycap);
  sweep(b, ring, [[...wall, ...edge.slice(1)]]);
  fan(b, ring, -K.edge, top + K.rise, [0, 0, 1], PART.keytop, [key.cx, key.cy]);
}

function cylinderX(b, x0, x1, y, z, radius, part, steps = 40) {
  const ring0 = [];
  const ring1 = [];
  for (let i = 0; i < steps; i += 1) {
    const a = (i / steps) * Math.PI * 2;
    const c = Math.cos(a);
    const sn = Math.sin(a);
    ring0.push(b.vertex([x0, y + c * radius, z + sn * radius], [0, c, sn], [0, i / steps], part));
    ring1.push(b.vertex([x1, y + c * radius, z + sn * radius], [0, c, sn], [1, i / steps], part));
  }
  for (let i = 0; i < steps; i += 1) {
    const j = (i + 1) % steps;
    b.quad(ring0[i], ring1[i], ring1[j], ring0[j]);
  }
  [
    [x0, -1, ring0],
    [x1, 1, ring1]
  ].forEach(([x, sign]) => {
    const center = b.vertex([x, y, z], [sign, 0, 0], [0.5, 0.5], part);
    const cap = [];
    for (let i = 0; i < steps; i += 1) {
      const a = (i / steps) * Math.PI * 2;
      cap.push(b.vertex([x, y + Math.cos(a) * radius, z + Math.sin(a) * radius], [sign, 0, 0], [0, 0], part));
    }
    for (let i = 0; i < steps; i += 1) b.tri(center, cap[i], cap[(i + 1) % steps]);
  });
}

export function laptopGeometry(s = LAPTOP) {
  const corner = { r: s.base.corner, n: s.base.exponent };
  const baseOutline = roundedOutline(s.w, s.d, [corner, corner, corner, corner], 32);
  const base = new Builder();
  slab(base, baseOutline, s.base, PART.deck, PART.back);
  const top = s.base.t / 2;
  const { keys } = keyboardKeys(s);
  keys.forEach(key => keycap(base, key, top, s));
  const F = s.feet;
  [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1]
  ].forEach(([sx, sy]) => {
    const center = [sx * (s.w / 2 - F.inset), sy * (s.d / 2 - F.inset)];
    const rows = [
      { r: F.radius, h: -0.4, nr: 1, nh: 0, part: PART.dark },
      { r: F.radius, h: F.height - 0.5, nr: 1, nh: 0, part: PART.dark }
    ];
    for (let i = 1; i <= 5; i += 1) {
      const a = (i / 5) * (Math.PI / 2);
      rows.push({
        r: F.radius - 0.5 + 0.5 * Math.cos(a),
        h: F.height - 0.5 + 0.5 * Math.sin(a),
        nr: Math.cos(a),
        nh: Math.sin(a),
        part: PART.dark
      });
    }
    latheRows(base, center, -top, rows, 28);
    const cap = roundedOutline(
      (F.radius - 0.5) * 2,
      (F.radius - 0.5) * 2,
      Array(4).fill({ r: F.radius - 0.5, n: 2 }),
      7,
      center
    );
    fan(base, cap, 0, -top - F.height, [0, 0, -1], PART.dark, center);
  });

  const L = s.lid;
  const lidCorner = { r: L.corner, n: L.exponent };
  const lidOutline = roundedOutline(s.w, L.h, [lidCorner, lidCorner, lidCorner, lidCorner], 32);
  const lid = new Builder();
  slab(lid, lidOutline, L, 'glass', PART.back);

  const hinge = new Builder();
  cylinderX(hinge, -s.w / 2 + s.hinge.inset, s.w / 2 - s.hinge.inset, 0, 0, s.hinge.radius, PART.dark);
  return { base: base.build(), lid: lid.build(), hinge: hinge.build() };
}

function sweepPath(b, path, section, part) {
  const rings = path.map(point => {
    const ids = section.points.map(([u, v], i) => {
      const [nu, nv] = section.normals[i];
      const position = [u, point.p[0] + point.n[0] * v, point.p[1] + point.n[1] * v];
      const normal = [nu, point.n[0] * nv, point.n[1] * nv];
      const l = Math.hypot(normal[0], normal[1], normal[2]) || 1;
      return b.vertex(position, [normal[0] / l, normal[1] / l, normal[2] / l], [0, 0], part);
    });
    return ids;
  });
  for (let r = 1; r < rings.length; r += 1) {
    const a = rings[r - 1];
    const c = rings[r];
    for (let i = 0; i < a.length; i += 1) {
      const j = (i + 1) % a.length;
      b.quad(a[i], c[i], c[j], a[j]);
    }
  }
  [0, path.length - 1].forEach(index => {
    const point = path[index];
    const sign = index === 0 ? -1 : 1;
    const normal = [0, point.t[0] * sign, point.t[1] * sign];
    const center = b.vertex([0, point.p[0], point.p[1]], normal, [0, 0], part);
    const ids = section.points.map(([u, v]) =>
      b.vertex([u, point.p[0] + point.n[0] * v, point.p[1] + point.n[1] * v], normal, [0, 0], part)
    );
    for (let i = 0; i < ids.length; i += 1) b.tri(center, ids[i], ids[(i + 1) % ids.length]);
  });
}

export function standPath(s = DISPLAY) {
  const st = s.stand;
  const th = st.thickness;
  const phi = (st.lean * Math.PI) / 180;
  const p0 = { y: st.attach, z: -s.t / 2 - th / 2 - 0.4 };
  const floorY = -s.h / 2 - st.drop;
  const R = st.bend;
  const cy = floorY + th / 2 + R;
  const by = cy + R * Math.sin(phi);
  const length = (p0.y - by) / Math.cos(phi);
  const bz = p0.z - length * Math.sin(phi);
  const cz = bz + R * Math.cos(phi);
  const out = [];
  const neckT = [-Math.cos(phi), -Math.sin(phi)];
  const neckN = [Math.sin(phi), -Math.cos(phi)];
  for (let i = 0; i <= 10; i += 1) {
    const t = (i / 10) * length;
    out.push({ p: [p0.y + neckT[0] * t, p0.z + neckT[1] * t], t: neckT, n: neckN });
  }
  const a0 = Math.PI - phi;
  const a1 = Math.PI * 1.5;
  for (let i = 1; i <= 18; i += 1) {
    const a = a0 + (a1 - a0) * (i / 18);
    out.push({
      p: [cy + R * Math.sin(a), cz + R * Math.cos(a)],
      t: [Math.cos(a), -Math.sin(a)],
      n: [Math.sin(a), Math.cos(a)]
    });
  }
  for (let i = 1; i <= 8; i += 1) {
    out.push({ p: [cy - R, cz + (st.foot * i) / 8], t: [0, 1], n: [-1, 0] });
  }
  return { points: out, floorY, front: cz + st.foot, back: bz - th };
}

export function displayGeometry(s = DISPLAY) {
  const corner = { r: s.corner, n: s.exponent };
  const outline = roundedOutline(s.w, s.h, [corner, corner, corner, corner], 36);
  const panel = new Builder();
  slab(panel, outline, s, 'glass', PART.back);
  const st = s.stand;
  const section = roundedOutline(st.width, st.thickness, Array(4).fill({ r: st.corner, n: 2.2 }), 6);
  const stand = new Builder();
  sweepPath(stand, standPath(s).points, section, PART.metal);
  return { panel: panel.build(), stand: stand.build() };
}

export function drawLegends(s = LAPTOP, pixelsPerMm = 10) {
  const { keys, rect } = keyboardKeys(s);
  const [left, bottom, width, height] = rect;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * pixelsPerMm);
  canvas.height = Math.round(height * pixelsPerMm);
  const ctx = canvas.getContext('2d');
  const font = '-apple-system, BlinkMacSystemFont, "SF Pro Text", Geist, system-ui, sans-serif';
  const px = value => value * pixelsPerMm;
  const toX = x => px(x - left);
  const toY = y => px(bottom + height - y);
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  keys.forEach(key => {
    const x0 = toX(key.cx - key.w / 2);
    const y0 = toY(key.cy + key.h / 2);
    const w = px(key.w);
    const h = px(key.h);
    const cx = toX(key.cx);
    const cy = toY(key.cy);
    if (key.kind === 'touch' || key.label === '') return;
    if (key.kind === 'char') {
      ctx.textAlign = 'center';
      if (key.glyph) {
        ctx.font = `400 ${px(3.1)}px ${font}`;
        ctx.fillText(key.glyph, cx, y0 + h * 0.3);
        ctx.fillText(key.label, cx, y0 + h * 0.68);
      } else {
        ctx.font = `400 ${px(key.label.length > 1 ? 2.3 : 3.6)}px ${font}`;
        ctx.fillText(key.label, cx, key.label.length > 1 ? y0 + h * 0.74 : cy);
      }
      return;
    }
    if (key.kind === 'arrow') {
      ctx.textAlign = 'center';
      ctx.font = `400 ${px(2.1)}px ${font}`;
      ctx.fillText(key.label, cx, cy);
      return;
    }
    ctx.font = `400 ${px(2.15)}px ${font}`;
    const pad = px(1.6);
    if (key.kind === 'mod') {
      ctx.textAlign = key.label === 'command' && key.cx > 0 ? 'left' : key.cx > 0 ? 'left' : 'right';
      const anchor = ctx.textAlign === 'left' ? x0 + pad : x0 + w - pad;
      ctx.fillText(key.label, anchor, y0 + h - pad * 1.2);
      ctx.font = `400 ${px(2.9)}px ${font}`;
      ctx.fillText(key.glyph, anchor, y0 + pad * 2.1);
      return;
    }
    if (key.kind === 'globe') {
      ctx.textAlign = 'left';
      ctx.fillText('fn', x0 + pad, y0 + pad * 2.1);
      ctx.beginPath();
      ctx.arc(x0 + w - pad * 2.4, y0 + h - pad * 2.4, px(1.35), 0, Math.PI * 2);
      ctx.lineWidth = px(0.22);
      ctx.strokeStyle = '#fff';
      ctx.stroke();
      return;
    }
    ctx.textAlign = key.kind === 'right' ? 'right' : 'left';
    ctx.fillText(key.label, key.kind === 'right' ? x0 + w - pad : x0 + pad, y0 + h - pad * 1.2);
  });
  return { canvas, rect };
}
