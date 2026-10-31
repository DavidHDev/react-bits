const NS = 'http://www.w3.org/2000/svg';
const RES = 6;
const BOX = { x: -3, y: -5, w: 31, h: 31 };
const GW = BOX.w * RES;
const GH = BOX.h * RES;
const INF = 1e20;
const PIVOT = [12.75, 11.5];
const SPIN = 40;
const INFLATE = 1.3;
const STEM_BASE = [12.8, 1.6];
const BODY_RGB = [247, 115, 27];
const STEM_RGB = [90, 127, 46];
const LOBES = [
  [4.15, 11.65, 3.6, 7.4, '#e35d12'],
  [21.35, 11.65, 3.6, 7.4, '#e35d12'],
  [7.45, 11.35, 5.6, 9.2, '#f06b17'],
  [18.05, 11.35, 5.6, 9.2, '#f06b17'],
  [12.75, 11.15, 5.5, 9.8, '#ff7f24']
];
const STEM_PATH = 'M11.45 2.5C11.5 0.8 12.1 -0.9 13.35 -2.55L15.15 -1.85C14.25 -0.5 13.95 1 14.05 2.5Z';

const clamp01 = x => Math.min(1, Math.max(0, x));
const smoothstep = (a, b, x) => {
  const k = clamp01((x - a) / (b - a));
  return k * k * (3 - 2 * k);
};
const inOutCubic = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const outQuad = x => 1 - (1 - x) * (1 - x);
const toLinear = v => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const toSrgb = c => Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055));

const edt1d = (f, n, d, v, z) => {
  let k = 0;
  v[0] = 0;
  z[0] = -INF;
  z[1] = INF;
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = INF;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
};

const edt2d = grid => {
  const size = Math.max(GW, GH);
  const f = new Float64Array(size);
  const d = new Float64Array(size);
  const v = new Int32Array(size);
  const z = new Float64Array(size + 1);
  for (let x = 0; x < GW; x++) {
    for (let y = 0; y < GH; y++) f[y] = grid[y * GW + x];
    edt1d(f, GH, d, v, z);
    for (let y = 0; y < GH; y++) grid[y * GW + x] = d[y];
  }
  for (let y = 0; y < GH; y++) {
    const row = y * GW;
    for (let x = 0; x < GW; x++) f[x] = grid[row + x];
    edt1d(f, GW, d, v, z);
    for (let x = 0; x < GW; x++) grid[row + x] = d[x];
  }
};

const distanceField = draw => {
  const canvas = document.createElement('canvas');
  canvas.width = GW;
  canvas.height = GH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.setTransform(RES, 0, 0, RES, -BOX.x * RES, -BOX.y * RES);
  ctx.fillStyle = '#fff';
  draw(ctx);
  const alpha = ctx.getImageData(0, 0, GW, GH).data;
  const n = GW * GH;
  const outside = new Float64Array(n);
  const inside = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const isIn = alpha[i * 4 + 3] > 127;
    outside[i] = isIn ? 0 : INF;
    inside[i] = isIn ? INF : 0;
  }
  edt2d(outside);
  edt2d(inside);
  const field = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = alpha[i * 4 + 3];
    const px = a > 0 && a < 255 ? 0.5 - a / 255 : a > 127 ? 0.5 - Math.sqrt(inside[i]) : Math.sqrt(outside[i]) - 0.5;
    field[i] = px / RES;
  }
  return field;
};

const blur = field => {
  const kernel = [0.0702, 0.1311, 0.1907, 0.216, 0.1907, 0.1311, 0.0702];
  const tmp = new Float32Array(field.length);
  const out = new Float32Array(field.length);
  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      let sum = 0;
      for (let k = -3; k <= 3; k++) sum += field[y * GW + Math.min(GW - 1, Math.max(0, x + k))] * kernel[k + 3];
      tmp[y * GW + x] = sum;
    }
  }
  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      let sum = 0;
      for (let k = -3; k <= 3; k++) sum += tmp[Math.min(GH - 1, Math.max(0, y + k)) * GW + x] * kernel[k + 3];
      out[y * GW + x] = sum;
    }
  }
  return out;
};

const sample = (field, x, y) => {
  const gx = (x - BOX.x) * RES - 0.5;
  const gy = (y - BOX.y) * RES - 0.5;
  const i = Math.floor(gx);
  const j = Math.floor(gy);
  const fx = gx - i;
  const fy = gy - j;
  const i0 = Math.min(GW - 1, Math.max(0, i));
  const i1 = Math.min(GW - 1, Math.max(0, i + 1));
  const j0 = Math.min(GH - 1, Math.max(0, j)) * GW;
  const j1 = Math.min(GH - 1, Math.max(0, j + 1)) * GW;
  const top = field[j0 + i0] + (field[j0 + i1] - field[j0 + i0]) * fx;
  const bottom = field[j1 + i0] + (field[j1 + i1] - field[j1 + i0]) * fx;
  return top + (bottom - top) * fy;
};

const toUnits = (gx, gy) => `${(BOX.x + (gx + 0.5) / RES).toFixed(2)} ${(BOX.y + (gy + 0.5) / RES).toFixed(2)}`;

const trace = f => {
  const adj = new Map();
  const pos = new Map();
  const link = (a, b) => {
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a).push(b);
    adj.get(b).push(a);
  };
  const across = (i, j) => {
    const key = j * GW + i;
    if (!pos.has(key)) {
      const v1 = f[j * GW + i];
      const k = v1 / (v1 - f[j * GW + i + 1]);
      pos.set(key, [i + k, j]);
    }
    return key;
  };
  const down = (i, j) => {
    const key = GW * GH + j * GW + i;
    if (!pos.has(key)) {
      const v1 = f[j * GW + i];
      const k = v1 / (v1 - f[(j + 1) * GW + i]);
      pos.set(key, [i, j + k]);
    }
    return key;
  };
  for (let j = 0; j < GH - 1; j++) {
    for (let i = 0; i < GW - 1; i++) {
      const a = f[j * GW + i];
      const b = f[j * GW + i + 1];
      const c = f[(j + 1) * GW + i + 1];
      const d = f[(j + 1) * GW + i];
      const code = (a < 0 ? 8 : 0) | (b < 0 ? 4 : 0) | (c < 0 ? 2 : 0) | (d < 0 ? 1 : 0);
      if (code === 0 || code === 15) continue;
      const center = a + b + c + d < 0;
      switch (code) {
        case 1:
        case 14:
          link(down(i, j), across(i, j + 1));
          break;
        case 2:
        case 13:
          link(across(i, j + 1), down(i + 1, j));
          break;
        case 3:
        case 12:
          link(down(i, j), down(i + 1, j));
          break;
        case 4:
        case 11:
          link(across(i, j), down(i + 1, j));
          break;
        case 6:
        case 9:
          link(across(i, j), across(i, j + 1));
          break;
        case 7:
        case 8:
          link(down(i, j), across(i, j));
          break;
        case 5:
          if (center) {
            link(down(i, j), across(i, j));
            link(across(i, j + 1), down(i + 1, j));
          } else {
            link(across(i, j), down(i + 1, j));
            link(down(i, j), across(i, j + 1));
          }
          break;
        default:
          if (center) {
            link(across(i, j), down(i + 1, j));
            link(down(i, j), across(i, j + 1));
          } else {
            link(down(i, j), across(i, j));
            link(across(i, j + 1), down(i + 1, j));
          }
      }
    }
  }
  const seen = new Set();
  let d = '';
  for (const start of adj.keys()) {
    if (seen.has(start)) continue;
    const points = [];
    let prev = -1;
    let cur = start;
    while (cur !== undefined && !seen.has(cur)) {
      seen.add(cur);
      points.push(pos.get(cur));
      const [first, second] = adj.get(cur);
      const next = first !== prev ? first : second;
      prev = cur;
      cur = next;
    }
    if (points.length > 2) d += `M${points.map(([x, y]) => toUnits(x, y)).join('L')}Z`;
  }
  return d;
};

const parseRgb = value => {
  const m = String(value).match(/[\d.]+/g);
  return m ? m.slice(0, 3).map(Number) : [255, 255, 255];
};

const mixRgb = (a, b, k) =>
  `rgb(${a.map((v, i) => toSrgb(toLinear(v) + (toLinear(b[i]) - toLinear(v)) * k)).join(', ')})`;

const bounds = d => {
  const nums = d.match(/-?\d*\.?\d+(?:e-?\d+)?/g).map(Number);
  const xs = nums.filter((_, i) => i % 2 === 0);
  const ys = nums.filter((_, i) => i % 2 === 1);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
};

export const createPumpkinMorph = (svg, atom) => {
  const parts = atom.getAttribute('d').split(/(?=M)/);
  const nucleusPath = parts.pop();
  const nucleus = bounds(nucleusPath);
  const atomBody = blur(distanceField(ctx => ctx.fill(new Path2D(parts.join('')))));
  const atomNucleus = blur(distanceField(ctx => ctx.fill(new Path2D(nucleusPath))));
  const pumpkinBody = blur(
    distanceField(ctx => {
      const path = new Path2D();
      LOBES.forEach(([cx, cy, rx, ry]) => {
        path.moveTo(cx + rx, cy);
        path.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      });
      ctx.fill(path);
    })
  );
  const pumpkinStem = blur(distanceField(ctx => ctx.fill(new Path2D(STEM_PATH))));
  const bodyField = new Float32Array(GW * GH);
  const stemField = new Float32Array(GW * GH);

  const group = document.createElementNS(NS, 'g');
  const body = document.createElementNS(NS, 'path');
  const stem = document.createElementNS(NS, 'path');
  const detail = document.createElementNS(NS, 'g');
  body.setAttribute('fill-rule', 'evenodd');
  stem.setAttribute('fill-rule', 'evenodd');
  LOBES.forEach(([cx, cy, rx, ry, color]) => {
    const lobe = document.createElementNS(NS, 'ellipse');
    lobe.setAttribute('cx', cx);
    lobe.setAttribute('cy', cy);
    lobe.setAttribute('rx', rx);
    lobe.setAttribute('ry', ry);
    lobe.style.fill = color;
    detail.appendChild(lobe);
  });
  const stemDetail = document.createElementNS(NS, 'path');
  stemDetail.setAttribute('d', STEM_PATH);
  stemDetail.style.fill = `rgb(${STEM_RGB.join(', ')})`;
  detail.appendChild(stemDetail);
  group.append(body, stem, detail);
  group.style.display = 'none';
  group.style.pointerEvents = 'none';
  atom.after(group);
  const overflow = svg.style.overflow;
  svg.style.overflow = 'visible';

  let base = parseRgb(getComputedStyle(atom).fill);
  let t = 0;
  let from = 0;
  let to = 0;
  let startAt = 0;
  let duration = 0;
  let raf = 0;

  const render = value => {
    const active = value > 0.0005;
    atom.style.opacity = active ? '0' : '';
    group.style.display = active ? '' : 'none';
    if (!active) return;
    const kBody = inOutCubic(clamp01((value - 0.04) / 0.8));
    const kOut = smoothstep(0, 0.7, kBody);
    const swell = INFLATE * Math.pow(Math.sin(Math.PI * clamp01(value / 0.75)), 1.2);
    const travel = inOutCubic(clamp01(value / 0.55));
    const kStem = smoothstep(0.3, 0.85, value);
    const ox = (STEM_BASE[0] - nucleus[0]) * travel;
    const oy = (STEM_BASE[1] - nucleus[1]) * travel;
    const angle = (SPIN * Math.PI * inOutCubic(clamp01(value / 0.8))) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    for (let j = 0; j < GH; j++) {
      const y = BOX.y + (j + 0.5) / RES;
      for (let i = 0; i < GW; i++) {
        const idx = j * GW + i;
        const x = BOX.x + (i + 0.5) / RES;
        const dx = x - PIVOT[0];
        const dy = y - PIVOT[1];
        const spun = angle
          ? sample(atomBody, PIVOT[0] + dx * cos + dy * sin, PIVOT[1] - dx * sin + dy * cos)
          : atomBody[idx];
        const target = pumpkinBody[idx];
        const reach = target > 0 ? Math.min(1, target / 1.5) : 0;
        const k = kBody + (kOut - kBody) * reach;
        bodyField[idx] = spun + (target - spun) * k - swell;
        const moved = sample(atomNucleus, x - ox, y - oy);
        stemField[idx] = moved + (pumpkinStem[idx] - moved) * kStem;
      }
    }
    body.setAttribute('d', trace(bodyField));
    stem.setAttribute('d', trace(stemField));
    const kColor = smoothstep(0.02, 0.38, value);
    body.style.fill = mixRgb(base, BODY_RGB, kColor);
    stem.style.fill = mixRgb(base, STEM_RGB, kColor);
    const settled = value > 0.999;
    body.style.display = settled ? 'none' : '';
    stem.style.display = settled ? 'none' : '';
    stemDetail.style.display = settled ? '' : 'none';
    detail.style.opacity = smoothstep(0.7, 0.95, value);
    const scale = 1 - 0.07 * Math.sin(Math.PI * value);
    group.setAttribute(
      'transform',
      `translate(${PIVOT[0]} ${PIVOT[1]}) scale(${scale.toFixed(4)}) translate(${-PIVOT[0]} ${-PIVOT[1]})`
    );
  };

  const step = now => {
    const k = duration > 0 ? Math.min(1, (now - startAt) / duration) : 1;
    t = from + (to - from) * outQuad(k);
    render(t);
    raf = k < 1 ? requestAnimationFrame(step) : 0;
  };

  const go = (target, ms) => {
    base = parseRgb(getComputedStyle(atom).fill);
    from = t;
    to = target;
    startAt = performance.now();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    duration = reduced ? 0 : ms * Math.abs(target - from);
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(step);
  };

  return {
    enter: () => go(1, 650),
    leave: () => go(0, 500),
    set: value => {
      cancelAnimationFrame(raf);
      base = parseRgb(getComputedStyle(atom).fill);
      t = value;
      render(t);
    },
    destroy: () => {
      cancelAnimationFrame(raf);
      group.remove();
      atom.style.opacity = '';
      svg.style.overflow = overflow;
    }
  };
};
