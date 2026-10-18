export const WHITE = ['#ffffff', '#ffffff', '#ffffff', '#ffffff'];
export const INK = ['#09090b', '#1c1c21', '#2a2a31', '#09090b'];
export const NIGHT = ['#0d0d10', '#1f1f25', '#000000', '#000000'];
export const COAL = ['#111114', '#1f1f25', '#000000', '#000000'];
export const VOID = ['#050506', '#151518', '#000000', '#000000'];
export const GRAPHITE = ['#1c1c20', '#28282e', '#2a2a31', '#1c1c20'];
export const DARK_STUDIO = ['#121215', '#18181c', '#ffffff', '#ffffff'];

export const white = (extra = {}) => ({ kind: 'solid', colors: WHITE, ...extra });
export const solid = (colors, extra = {}) => ({ kind: 'solid', colors, ...extra });
export const spotlight = (colors, extra = {}) => ({
  kind: 'spotlight',
  colors,
  spot: 0.3,
  spotCenter: [0.5, 0.6],
  spotSize: 0.52,
  ...extra
});
export const studio = (colors = DARK_STUDIO, extra = {}) => ({ kind: 'studio', colors, light: 0.5, ...extra });

export const DESK_CARD = { type: 'card', finish: 'clean', radius: 0.05, viewport: '16:10' };
export const APP_CARD = { type: 'card', finish: 'clean', radius: 0.42, viewport: '9:19.5', scale: 0.24 };

const SCROLLS = [0, 0.5, 1, 0.25, 0.75];

export const screen = (i, base = {}) => ({ ...base, pick: i, scroll: SCROLLS[i % SCROLLS.length] });

const round = value => Math.round(value * 1000) / 1000;

export function ring({ n, radius, make, y = 0 }) {
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * 360;
    const a = (angle * Math.PI) / 180;
    return { ...make(i), x: round(Math.sin(a) * radius), y, z: round(Math.cos(a) * radius), ry: round(angle) };
  });
}

export function wheel({ n, radius, make }) {
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * 360;
    const a = (angle * Math.PI) / 180;
    return { ...make(i), x: 0, y: round(Math.sin(a) * radius), z: round(Math.cos(a) * radius), rx: round(-angle) };
  });
}

export function helix({ n, radius, perTurn, rise, make }) {
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / perTurn) * 360;
    const a = (angle * Math.PI) / 180;
    return {
      ...make(i),
      x: round(Math.sin(a) * radius),
      y: round((i - (n - 1) / 2) * (rise / perTurn)),
      z: round(Math.cos(a) * radius),
      ry: round(angle)
    };
  });
}

export function globe({ n, radius, make }) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: n }, (_, i) => {
    const y = 1 - (2 * (i + 0.5)) / n;
    const r = Math.sqrt(1 - y * y);
    const t = i * golden;
    const x = Math.cos(t) * r;
    const z = Math.sin(t) * r;
    return {
      ...make(i),
      x: round(x * radius),
      y: round(y * radius),
      z: round(z * radius),
      rx: round((-Math.asin(y) * 180) / Math.PI),
      ry: round((Math.atan2(x, z) * 180) / Math.PI)
    };
  });
}

export function rows({ rows: count, cols, w, h, gap, make, offset = 0.5 }) {
  const out = [];
  for (let r = 0; r < count; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      out.push({
        ...make(r * cols + c, r, c),
        x: round((c - (cols - 1) / 2) * (w + gap) + (r % 2 ? (w + gap) * offset : 0)),
        y: round(((count - 1) / 2 - r) * (h + gap)),
        z: 0,
        lane: r,
        laneSpacing: round(w + gap)
      });
    }
  }
  return out;
}

export function columns({ cols, count, w, h, gap, make, offset = 0.5 }) {
  const out = [];
  for (let c = 0; c < cols; c += 1) {
    for (let r = 0; r < count; r += 1) {
      out.push({
        ...make(c * count + r, c, r),
        x: round((c - (cols - 1) / 2) * (w + gap)),
        y: round(((count - 1) / 2 - r) * (h + gap) + (c % 2 ? (h + gap) * offset : 0)),
        z: 0,
        lane: c,
        laneSpacing: round(h + gap)
      });
    }
  }
  return out;
}

export function tunnel({ length, w, h, gap, make, width, height }) {
  const out = [];
  let i = 0;
  const half = h / 2 + 0.02;
  const walls = [
    { x: -width / 2, y: 0, ry: 90, rx: 0, rz: 0 },
    { x: width / 2, y: 0, ry: -90, rx: 0, rz: 0 },
    { x: -half, y: -height / 2, ry: 0, rx: -90, rz: 90 },
    { x: half, y: -height / 2, ry: 0, rx: -90, rz: 90 },
    { x: -half, y: height / 2, ry: 0, rx: 90, rz: 90 },
    { x: half, y: height / 2, ry: 0, rx: 90, rz: 90 }
  ];
  walls.forEach((wall, side) => {
    for (let k = 0; k < length; k += 1) {
      out.push({
        ...make(i, side, k),
        x: round(wall.x),
        y: round(wall.y),
        z: round(-k * (w + gap)),
        rx: wall.rx,
        ry: wall.ry,
        rz: wall.rz,
        lane: 0,
        laneDir: 1,
        laneSpacing: round(w + gap)
      });
      i += 1;
    }
  });
  return out;
}

export function grid({ rows: count, cols, w, h, gap, make }) {
  const out = [];
  for (let r = 0; r < count; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      out.push({
        ...make(r * cols + c, r, c),
        x: round((c - (cols - 1) / 2) * (w + gap)),
        y: round(((count - 1) / 2 - r) * (h + gap)),
        z: 0
      });
    }
  }
  return out;
}

export const stackOf = (n, make) => Array.from({ length: n }, (_, i) => ({ ...make(i), x: 0, y: 0, z: 0 }));

export const lineup = (n, gap, make) =>
  Array.from({ length: n }, (_, i) => ({ ...make(i), x: round((i - (n - 1) / 2) * gap) }));
