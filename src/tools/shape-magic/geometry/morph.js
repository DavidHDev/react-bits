import { formatNumber } from './svg.js';

const SAMPLES = 32;
const mod1 = v => v - Math.floor(v);
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

function cubicPoint(c, t) {
  const s = 1 - t;
  const a = s * s * s;
  const b = 3 * s * s * t;
  const d = 3 * s * t * t;
  const e = t * t * t;
  return [a * c[0][0] + b * c[1][0] + d * c[2][0] + e * c[3][0], a * c[0][1] + b * c[1][1] + d * c[2][1] + e * c[3][1]];
}

function splitCubic(c, t) {
  const ab = lerp(c[0], c[1], t);
  const bc = lerp(c[1], c[2], t);
  const cd = lerp(c[2], c[3], t);
  const abc = lerp(ab, bc, t);
  const bcd = lerp(bc, cd, t);
  const m = lerp(abc, bcd, t);
  return [
    [c[0], ab, abc, m],
    [m, bcd, cd, c[3]]
  ];
}

function toCubics(contour) {
  const out = [];
  let p0 = contour.start;
  for (const seg of contour.segments) {
    out.push(
      seg.type === 'C' ? [p0, seg.c1, seg.c2, seg.p] : [p0, lerp(p0, seg.p, 1 / 3), lerp(p0, seg.p, 2 / 3), seg.p]
    );
    p0 = seg.p;
  }
  const s = contour.start;
  if (Math.hypot(p0[0] - s[0], p0[1] - s[1]) > 1e-9) out.push([p0, lerp(p0, s, 1 / 3), lerp(p0, s, 2 / 3), s]);
  return out;
}

function measure(cubics) {
  const tables = [];
  const starts = [];
  let total = 0;
  for (const c of cubics) {
    const table = new Float64Array(SAMPLES + 1);
    let prev = c[0];
    for (let k = 1; k <= SAMPLES; k++) {
      const p = cubicPoint(c, k / SAMPLES);
      table[k] = table[k - 1] + Math.hypot(p[0] - prev[0], p[1] - prev[1]);
      prev = p;
    }
    starts.push(total);
    tables.push(table);
    total += table[SAMPLES];
  }
  return { cubics, tables, starts, total };
}

function locate(shape, u) {
  const target = mod1(u) * shape.total;
  let lo = 0;
  let hi = shape.cubics.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (shape.starts[mid] <= target) lo = mid;
    else hi = mid - 1;
  }
  const table = shape.tables[lo];
  const local = target - shape.starts[lo];
  let k = 0;
  while (k < SAMPLES - 1 && table[k + 1] < local) k++;
  const span = table[k + 1] - table[k];
  const t = span > 0 ? (k + Math.min(1, Math.max(0, (local - table[k]) / span))) / SAMPLES : k / SAMPLES;
  return { index: lo, t };
}

const pointAt = (shape, u) => {
  const { index, t } = locate(shape, u);
  return cubicPoint(shape.cubics[index], t);
};

const nodePositions = shape => shape.starts.map(s => (shape.total > 0 ? s / shape.total : 0));

function signedArea(cubics) {
  let area = 0;
  for (const c of cubics) {
    let prev = c[0];
    for (let k = 1; k <= 16; k++) {
      const p = cubicPoint(c, k / 16);
      area += prev[0] * p[1] - p[0] * prev[1];
      prev = p;
    }
  }
  return area / 2;
}

function polygon(cubics) {
  const out = [];
  for (const c of cubics) for (let k = 0; k < 16; k++) out.push(cubicPoint(c, k / 16));
  return out;
}

function centroid(cubics) {
  const pts = polygon(cubics);
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    const cross = p[0] * q[1] - q[0] * p[1];
    a += cross;
    cx += (p[0] + q[0]) * cross;
    cy += (p[1] + q[1]) * cross;
  }
  if (Math.abs(a) < 1e-9) return pts[0];
  return [cx / (3 * a), cy / (3 * a)];
}

function winding(polygons, x, y) {
  let w = 0;
  for (const pts of polygons) {
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      if (a[1] <= y) {
        if (b[1] > y && (b[0] - a[0]) * (y - a[1]) - (x - a[0]) * (b[1] - a[1]) > 0) w++;
      } else if (b[1] <= y && (b[0] - a[0]) * (y - a[1]) - (x - a[0]) * (b[1] - a[1]) < 0) w--;
    }
  }
  return w;
}

function nearest(polygons, x, y) {
  let best = [x, y];
  let dist = Infinity;
  for (const pts of polygons) {
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const l2 = dx * dx + dy * dy;
      const t = l2 > 0 ? Math.min(1, Math.max(0, ((x - a[0]) * dx + (y - a[1]) * dy) / l2)) : 0;
      const px = a[0] + dx * t;
      const py = a[1] + dy * t;
      const d = Math.hypot(px - x, py - y);
      if (d < dist) {
        dist = d;
        best = [px, py];
      }
    }
  }
  return best;
}

function bestShift(a, b) {
  const M = 96;
  const pa = [];
  const pb = [];
  for (let i = 0; i < M; i++) {
    pa.push(pointAt(a, i / M));
    pb.push(pointAt(b, i / M));
  }
  const cost = shift => {
    let sum = 0;
    for (let i = 0; i < M; i++) {
      const q = pointAt(b, i / M + shift);
      const p = pa[i];
      sum += (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
    }
    return sum;
  };
  let best = 0;
  let bestCost = Infinity;
  for (let j = 0; j < M; j++) {
    let sum = 0;
    for (let i = 0; i < M; i++) {
      const p = pa[i];
      const q = pb[(i + j) % M];
      sum += (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
    }
    if (sum < bestCost) {
      bestCost = sum;
      best = j / M;
    }
  }
  let step = 0.5 / M;
  for (let it = 0; it < 8; it++) {
    const left = cost(best - step);
    const right = cost(best + step);
    if (left < bestCost && left <= right) {
      bestCost = left;
      best -= step;
    } else if (right < bestCost) {
      bestCost = right;
      best += step;
    } else step /= 2;
  }
  return mod1(best);
}

function correspondence(a, b, shift, minimum) {
  const eps = 1.5 / Math.max(a.total, b.total, 1);
  const pairs = [];
  for (const u of nodePositions(a)) pairs.push({ a: u, b: mod1(u + shift), from: 'a' });
  for (const u of nodePositions(b)) pairs.push({ a: mod1(u - shift), b: u, from: 'b' });
  pairs.sort((p, q) => p.a - q.a);
  const merged = [];
  for (const p of pairs) {
    const last = merged[merged.length - 1];
    if (last && last.from !== p.from && last.from !== 'ab' && p.a - last.a < eps) {
      merged[merged.length - 1] =
        last.from === 'a' ? { a: last.a, b: p.b, from: 'ab' } : { a: p.a, b: last.b, from: 'ab' };
    } else merged.push(p);
  }
  if (merged.length > 1) {
    const first = merged[0];
    const last = merged[merged.length - 1];
    if (first.from !== last.from && first.from !== 'ab' && last.from !== 'ab' && first.a + 1 - last.a < eps) {
      merged[0] = first.from === 'a' ? { a: first.a, b: last.b, from: 'ab' } : { a: last.a, b: first.b, from: 'ab' };
      merged.pop();
    }
  }
  const gap = (i, key) => mod1(merged[(i + 1) % merged.length][key] - merged[i][key]) || 1;
  while (merged.length < minimum) {
    let widest = 0;
    let size = -1;
    for (let i = 0; i < merged.length; i++) {
      const g = gap(i, 'a') + gap(i, 'b');
      if (g > size) {
        size = g;
        widest = i;
      }
    }
    const p = merged[widest];
    merged.splice(widest + 1, 0, {
      a: mod1(p.a + gap(widest, 'a') / 2),
      b: mod1(p.b + gap(widest, 'b') / 2),
      from: 'mid'
    });
  }
  return merged;
}

function splitAt(shape, positions) {
  const cuts = shape.cubics.map(() => []);
  const starts = [];
  for (const u of positions) {
    const { index, t } = locate(shape, u);
    if (t < 1e-6) starts.push({ index, t: 0 });
    else if (t > 1 - 1e-6) starts.push({ index: (index + 1) % shape.cubics.length, t: 0 });
    else {
      cuts[index].push(t);
      starts.push({ index, t });
    }
  }
  const pieces = [];
  shape.cubics.forEach((c, index) => {
    const ts = [...new Set(cuts[index])].sort((p, q) => p - q);
    let rest = c;
    let done = 0;
    for (const t of ts) {
      const local = (t - done) / (1 - done);
      const [head, tail] = splitCubic(rest, local);
      pieces.push({ index, t: done, cubic: head });
      rest = tail;
      done = t;
    }
    pieces.push({ index, t: done, cubic: rest });
  });
  const first = starts[0];
  const at = pieces.findIndex(p => p.index === first.index && Math.abs(p.t - first.t) < 1e-9);
  return [...pieces.slice(at), ...pieces.slice(0, at)].map(p => p.cubic);
}

function reverse(cubics) {
  return cubics
    .slice()
    .reverse()
    .map(c => [c[3], c[2], c[1], c[0]]);
}

function pathData(contours, transform, precision) {
  const num = v => formatNumber(v, precision);
  const pt = p => {
    const q = transform(p);
    return `${num(q[0])} ${num(q[1])}`;
  };
  return contours
    .map(cubics => `M${pt(cubics[0][0])}${cubics.map(c => `C${pt(c[1])} ${pt(c[2])} ${pt(c[3])}`).join('')}Z`)
    .join('');
}

function prepare(fitted) {
  return fitted
    .map(contour => {
      const cubics = toCubics(contour);
      return { cubics, area: signedArea(cubics), shape: measure(cubics) };
    })
    .filter(c => c.shape.total > 1e-9);
}

export function morphPaths(fittedA, fittedB, { segments = 'auto', precision = 2, transform = p => p } = {}) {
  const A = prepare(fittedA);
  const B = prepare(fittedB);
  const minimum = segments === 'auto' ? 0 : Math.max(1, Math.round(segments));
  const polysA = A.map(c => polygon(c.cubics));
  const polysB = B.map(c => polygon(c.cubics));
  const pairs = [];
  const used = new Set();
  for (const sign of [1, -1]) {
    const as = A.filter(c => Math.sign(c.area) === sign).sort((p, q) => Math.abs(q.area) - Math.abs(p.area));
    const bs = B.filter(c => Math.sign(c.area) === sign).sort((p, q) => Math.abs(q.area) - Math.abs(p.area));
    as.forEach((a, i) => {
      const b = bs[i];
      if (b) used.add(b);
      pairs.push({ a, b: b || null });
    });
    bs.slice(as.length).forEach(b => pairs.push({ a: null, b }));
  }
  const from = [];
  const to = [];
  const counts = [];
  for (const { a, b } of pairs) {
    if (a && b) {
      const bCubics = Math.sign(a.area) === Math.sign(b.area) ? b.cubics : reverse(b.cubics);
      const shapeB = bCubics === b.cubics ? b.shape : measure(bCubics);
      const shift = bestShift(a.shape, shapeB);
      const match = correspondence(a.shape, shapeB, shift, minimum);
      const pa = splitAt(
        a.shape,
        match.map(m => m.a)
      );
      const pb = splitAt(
        shapeB,
        match.map(m => m.b)
      );
      from.push(pa);
      to.push(pb);
      counts.push(pa.length);
      continue;
    }
    const solo = a || b;
    const others = a ? polysB : polysA;
    let target = centroid(solo.cubics);
    if (!winding(others, target[0], target[1]) && others.length) target = nearest(others, target[0], target[1]);
    const nodes = nodePositions(solo.shape);
    const positions = nodes.slice();
    while (positions.length < Math.max(minimum, 4)) {
      let widest = 0;
      let size = -1;
      for (let i = 0; i < positions.length; i++) {
        const g = mod1(positions[(i + 1) % positions.length] - positions[i]) || 1;
        if (g > size) {
          size = g;
          widest = i;
        }
      }
      positions.splice(widest + 1, 0, mod1(positions[widest] + size / 2));
    }
    const pieces = splitAt(solo.shape, positions);
    const point = pieces.map(() => [target, target, target, target]);
    from.push(a ? pieces : point);
    to.push(a ? point : pieces);
    counts.push(pieces.length);
  }
  return { from: pathData(from, transform, precision), to: pathData(to, transform, precision), segments: counts };
}
