const DEG = Math.PI / 180;
const HALF_PI = Math.PI / 2;

const mod = (i, n) => ((i % n) + n) % n;
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const wrapPi = a => a - Math.round(a / (2 * Math.PI)) * 2 * Math.PI;

function resample(points, spacing) {
  const m = points.length;
  const seg = new Float64Array(m);
  let total = 0;
  for (let i = 0; i < m; i++) {
    const a = points[i];
    const b = points[(i + 1) % m];
    seg[i] = Math.hypot(b[0] - a[0], b[1] - a[1]);
    total += seg[i];
  }
  const n = Math.max(24, Math.round(total / spacing));
  const h = total / n;
  const xs = new Float64Array(n);
  const ys = new Float64Array(n);
  let i = 0;
  let acc = 0;
  for (let k = 0; k < n; k++) {
    const s = k * h;
    while (i < m - 1 && acc + seg[i] <= s) {
      acc += seg[i];
      i++;
    }
    const a = points[i];
    const b = points[(i + 1) % m];
    const t = seg[i] > 0 ? clamp((s - acc) / seg[i], 0, 1) : 0;
    xs[k] = a[0] + (b[0] - a[0]) * t;
    ys[k] = a[1] + (b[1] - a[1]) * t;
  }
  return { xs, ys, n, h, total };
}

function turnProfile(xs, ys, n, w) {
  const turn = new Float64Array(n);
  for (let k = 0; k < n; k++) {
    const a = mod(k - w, n);
    const b = mod(k + w, n);
    const ax = xs[k] - xs[a];
    const ay = ys[k] - ys[a];
    const bx = xs[b] - xs[k];
    const by = ys[b] - ys[k];
    turn[k] = Math.atan2(Math.abs(ax * by - ay * bx), ax * bx + ay * by);
  }
  return turn;
}

function solve3(m, r) {
  const [a, b, c, d, e, f, g, h, i] = m;
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  if (Math.abs(det) < 1e-12) return null;
  return [
    (r[0] * (e * i - f * h) - b * (r[1] * i - f * r[2]) + c * (r[1] * h - e * r[2])) / det,
    (a * (r[1] * i - f * r[2]) - r[0] * (d * i - f * g) + c * (d * r[2] - r[1] * g)) / det,
    (a * (e * r[2] - r[1] * h) - b * (d * r[2] - r[1] * g) + r[0] * (d * h - e * g)) / det
  ];
}

function fitSide(xs, ys, n, start, count, step) {
  const ox = xs[mod(start, n)];
  const oy = ys[mod(start, n)];
  const last = mod(start + step * (count - 1), n);
  let ux = xs[last] - ox;
  let uy = ys[last] - oy;
  const len = Math.hypot(ux, uy);
  if (len < 1e-6) return null;
  ux /= len;
  uy /= len;
  let s0 = 0;
  let s1 = 0;
  let s2 = 0;
  let s3 = 0;
  let s4 = 0;
  let t0 = 0;
  let t1 = 0;
  let t2 = 0;
  for (let i = 0; i < count; i++) {
    const k = mod(start + step * i, n);
    const dx = xs[k] - ox;
    const dy = ys[k] - oy;
    const x = dx * ux + dy * uy;
    const y = dy * ux - dx * uy;
    const x2 = x * x;
    s0 += 1;
    s1 += x;
    s2 += x2;
    s3 += x2 * x;
    s4 += x2 * x2;
    t0 += y;
    t1 += x * y;
    t2 += x2 * y;
  }
  let a = 0;
  let b = 0;
  let c = 0;
  const quad = count >= 6 && len >= 3 ? solve3([s0, s1, s2, s1, s2, s3, s2, s3, s4], [t0, t1, t2]) : null;
  if (quad) [a, b, c] = quad;
  else {
    const det = s0 * s2 - s1 * s1;
    if (Math.abs(det) > 1e-12) {
      a = (t0 * s2 - t1 * s1) / det;
      b = (s0 * t1 - s1 * t0) / det;
    }
  }
  let res = 0;
  for (let i = 0; i < count; i++) {
    const k = mod(start + step * i, n);
    const dx = xs[k] - ox;
    const dy = ys[k] - oy;
    const x = dx * ux + dy * uy;
    const y = dy * ux - dx * uy;
    res = Math.max(res, Math.abs(y - (a + b * x + c * x * x)));
  }
  return { ox, oy, ux, uy, a, b, c, res, len };
}

const lineSide = (x, y, dx, dy) => ({ ox: x, oy: y, ux: dx, uy: dy, a: 0, b: 0, c: 0, res: 0, len: 1 });

function sidePoint(s, x) {
  const y = s.a + s.b * x + s.c * x * x;
  return [s.ox + x * s.ux - y * s.uy, s.oy + x * s.uy + y * s.ux];
}

function sideTangent(s, x) {
  const d = s.b + 2 * s.c * x;
  const tx = s.ux - d * s.uy;
  const ty = s.uy + d * s.ux;
  const l = Math.hypot(tx, ty);
  return [tx / l, ty / l];
}

function intersectLines(px, py, dx, dy, qx, qy, ex, ey) {
  const den = dx * ey - dy * ex;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((qx - px) * ey - (qy - py) * ex) / den;
  return [px + dx * t, py + dy * t];
}

function meetSides(A, B) {
  let xa = 0;
  let xb = 0;
  let hit = null;
  for (let it = 0; it < 10; it++) {
    const pa = sidePoint(A, xa);
    const ta = sideTangent(A, xa);
    const pb = sidePoint(B, xb);
    const tb = sideTangent(B, xb);
    hit = intersectLines(pa[0], pa[1], ta[0], ta[1], pb[0], pb[1], tb[0], tb[1]);
    if (!hit) return null;
    const na = (hit[0] - A.ox) * A.ux + (hit[1] - A.oy) * A.uy;
    const nb = (hit[0] - B.ox) * B.ux + (hit[1] - B.oy) * B.uy;
    if (Math.abs(na) > 40 || Math.abs(nb) > 40) return null;
    const done = Math.abs(na - xa) + Math.abs(nb - xb) < 1e-7;
    xa = na;
    xb = nb;
    if (done) break;
  }
  return { x: hit[0], y: hit[1], ta: sideTangent(A, xa), tb: sideTangent(B, xb), xa, xb };
}

function segmentDistance(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy;
  const t = l2 > 0 ? clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1) : 0;
  return Math.hypot(px - ax - dx * t, py - ay - dy * t);
}

function polyDistance(xs, ys, n, from, to, px, py) {
  let best = Infinity;
  for (let k = from; k < to; k++) {
    const a = mod(k, n);
    const b = mod(k + 1, n);
    best = Math.min(best, segmentDistance(px, py, xs[a], ys[a], xs[b], ys[b]));
  }
  return best;
}

function findCorners(Q, turn, w, opts) {
  const { xs, ys, n, h } = Q;
  const cornerTurn = Math.PI - opts.cornerAngle * DEG;
  const kinks = opts.noise <= NOISE_FLOOR;
  const candTurn = Math.min(Math.max(0.2, cornerTurn * 0.55), kinks ? KINK_TURN * 0.6 : Infinity);
  const sideLen = Math.max(3, Math.round(8 / h));
  const maxZone = Math.max(4, Math.round(10 / h));
  const found = [];
  for (let k = 0; k < n; k++) {
    const t = turn[k];
    if (t < candTurn) continue;
    let peak = true;
    for (let j = 1; j <= w && peak; j++) if (turn[mod(k - j, n)] > t || turn[mod(k + j, n)] >= t) peak = false;
    if (!peak) continue;
    const level = Math.max(candTurn * 0.5, t * 0.3);
    let zl = 0;
    while (zl < maxZone && turn[mod(k - zl - 1, n)] > level) zl++;
    let zr = 0;
    while (zr < maxZone && turn[mod(k + zr + 1, n)] > level) zr++;
    if (zl >= maxZone || zr >= maxZone) continue;
    const zs = k - zl - 1;
    const ze = k + zr + 1;
    let ca = 0;
    while (ca < sideLen && ca < n / 4 && turn[mod(zs - 1 - ca, n)] <= level) ca++;
    let cb = 0;
    while (cb < sideLen && cb < n / 4 && turn[mod(ze + 1 + cb, n)] <= level) cb++;
    if (ca < 2 || cb < 2) continue;
    const A = fitSide(xs, ys, n, zs - 1, ca, -1);
    const B = fitSide(xs, ys, n, ze + 1, cb, 1);
    const slack = 0.3 + 4 * opts.noise;
    if (!A || !B || A.res > slack || B.res > slack) continue;
    const meet = meetSides(A, B);
    if (!meet) continue;
    const angle = Math.acos(clamp(meet.ta[0] * meet.tb[0] + meet.ta[1] * meet.tb[1], -1, 1));
    const sharp = angle < opts.cornerAngle * DEG;
    if (!sharp && (!kinks || angle > Math.PI - KINK_TURN || A.res > 0.1 || B.res > 0.1)) continue;
    const dev = polyDistance(xs, ys, n, zs - 1, ze + 1, meet.x, meet.y);
    const allow = sharp
      ? Math.max(opts.tolerance, Math.min(4, 0.8 / Math.sin(Math.max(angle, 0.05) / 2))) + 3 * opts.noise
      : Math.min(0.25, opts.tolerance * 0.5);
    if (dev > allow) continue;
    const pa = sidePoint(A, 0);
    const pb = sidePoint(B, 0);
    let stray = 0;
    for (let q = zs; q <= ze; q++) {
      const x = xs[mod(q, n)];
      const y = ys[mod(q, n)];
      stray = Math.max(
        stray,
        Math.min(
          segmentDistance(x, y, pa[0], pa[1], meet.x, meet.y),
          segmentDistance(x, y, meet.x, meet.y, pb[0], pb[1])
        )
      );
    }
    if (stray > allow) continue;
    found.push({
      k,
      from: zs,
      to: ze,
      x: meet.x,
      y: meet.y,
      tin: [-meet.ta[0], -meet.ta[1]],
      tout: meet.tb,
      sideIn: A,
      sideOut: B,
      turn: t,
      corner: true
    });
  }
  if (found.length < 2) return found;
  const keep = [];
  for (const c of found) {
    const prev = keep[keep.length - 1];
    if (prev && c.from <= prev.to && Math.hypot(c.x - prev.x, c.y - prev.y) < 2) {
      if (c.turn > prev.turn) keep[keep.length - 1] = c;
    } else keep.push(c);
  }
  if (keep.length > 1) {
    const first = keep[0];
    const last = keep[keep.length - 1];
    if (first.from + n <= last.to && Math.hypot(first.x - last.x, first.y - last.y) < 2) {
      if (last.turn > first.turn) keep.shift();
      else keep.pop();
    }
  }
  return keep;
}

function pcaLine(xs, ys, n, b, e) {
  let mx = 0;
  let my = 0;
  const count = e - b + 1;
  for (let k = b; k <= e; k++) {
    mx += xs[mod(k, n)];
    my += ys[mod(k, n)];
  }
  mx /= count;
  my /= count;
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (let k = b; k <= e; k++) {
    const dx = xs[mod(k, n)] - mx;
    const dy = ys[mod(k, n)] - my;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }
  const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  let dx = Math.cos(ang);
  let dy = Math.sin(ang);
  const ex = xs[mod(e, n)] - xs[mod(b, n)];
  const ey = ys[mod(e, n)] - ys[mod(b, n)];
  if (dx * ex + dy * ey < 0) {
    dx = -dx;
    dy = -dy;
  }
  let dev = 0;
  let s0 = 0;
  let s1 = 0;
  let s2 = 0;
  let s3 = 0;
  let s4 = 0;
  let t0 = 0;
  let t1 = 0;
  let t2 = 0;
  for (let k = b; k <= e; k++) {
    const px = xs[mod(k, n)] - mx;
    const py = ys[mod(k, n)] - my;
    const x = px * dx + py * dy;
    const y = py * dx - px * dy;
    dev = Math.max(dev, Math.abs(y));
    const x2 = x * x;
    s0 += 1;
    s1 += x;
    s2 += x2;
    s3 += x2 * x;
    s4 += x2 * x2;
    t0 += y;
    t1 += x * y;
    t2 += x2 * y;
  }
  const q = count >= 6 ? solve3([s0, s1, s2, s1, s2, s3, s2, s3, s4], [t0, t1, t2]) : null;
  const length = Math.hypot(ex, ey);
  const sag = q ? Math.abs(q[2]) * length * length * 0.25 : 0;
  return { mx, my, dx, dy, dev, sag };
}

const lineDev = (L, x, y) => Math.abs((y - L.my) * L.dx - (x - L.mx) * L.dy);

function tangentPoint(xs, ys, n, h, L, ex, ey, idx, dir, limit) {
  const max = Math.round(8 / h);
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  let cnt = 0;
  for (let i = 1; i <= max; i++) {
    const k = idx + dir * i;
    if ((dir > 0 && k > limit) || (dir < 0 && k < limit)) break;
    const px = xs[mod(k, n)];
    const py = ys[mod(k, n)];
    const x = ((px - ex) * L.dx + (py - ey) * L.dy) * dir;
    const y = lineDev(L, px, py);
    if (y > 1.5) break;
    if (y < 0.012) continue;
    const r = Math.sqrt(y);
    sx += x;
    sy += r;
    sxx += x * x;
    sxy += x * r;
    cnt++;
  }
  if (cnt < 3) return 0;
  const den = cnt * sxx - sx * sx;
  if (den <= 1e-12) return 0;
  const slope = (cnt * sxy - sx * sy) / den;
  if (slope <= 1e-6) return 0;
  return sx / cnt - sy / cnt / slope;
}

function findLines(Q, turn, w, start, end, opts) {
  const { xs, ys, n, h } = Q;
  const lines = [];
  const noisy = opts.noise > NOISE_FLOOR;
  const flat = noisy ? Math.max(0.02, opts.noise * 0.4) : 0.02;
  const eps = opts.lineTolerance;
  const minLen = noisy ? Math.max(2 * w * h, 32) : 2 * w * h;
  const sagMax = noisy ? Math.max(0.03, opts.noise * 0.5) : Math.max(0.03, eps * 0.5);
  let floor = start - 1;
  let j = start + w;
  while (j <= end - w) {
    if (turn[mod(j, n)] >= flat) {
      j++;
      continue;
    }
    let r = j;
    while (r + 1 <= end - w && turn[mod(r + 1, n)] < flat) r++;
    const seed = pcaLine(xs, ys, n, j - w, r + w);
    if (seed.dev > eps) {
      j = r + 1;
      continue;
    }
    const low = Math.max(start, floor + 1);
    let b = Math.max(j - w, low);
    let e = r + w;
    while (e + 1 <= end && lineDev(seed, xs[mod(e + 1, n)], ys[mod(e + 1, n)]) <= eps) e++;
    while (b - 1 >= low && lineDev(seed, xs[mod(b - 1, n)], ys[mod(b - 1, n)]) <= eps) b--;
    const L = e - b >= 2 ? pcaLine(xs, ys, n, b, e) : null;
    if (L && (e - b) * h >= minLen && L.dev <= eps * 1.5 && L.sag <= sagMax) {
      const project = k => {
        const px = xs[mod(k, n)] - L.mx;
        const py = ys[mod(k, n)] - L.my;
        const s = px * L.dx + py * L.dy;
        return [L.mx + L.dx * s, L.my + L.dy * s];
      };
      let p0 = project(b);
      let p1 = project(e);
      let fb = b;
      let fe = e;
      const span = (e - b) * h;
      if (e < end) {
        const x = tangentPoint(xs, ys, n, h, L, p1[0], p1[1], e, 1, end);
        if (x < 0 && x > -span / 3) {
          p1 = [p1[0] + L.dx * x, p1[1] + L.dy * x];
          fe = e + x / h;
        }
      }
      if (b > start) {
        const x = tangentPoint(xs, ys, n, h, L, p0[0], p0[1], b, -1, start);
        if (x < 0 && x > -span / 3) {
          p0 = [p0[0] - L.dx * x, p0[1] - L.dy * x];
          fb = b - x / h;
        }
      }
      if ((fe - fb) * h >= minLen * 0.75) {
        lines.push({ b: fb, e: fe, p0, p1, dx: L.dx, dy: L.dy, atStart: b === start, atEnd: e === end });
        floor = e;
      }
    }
    j = Math.max(r, e) + 1;
  }
  return lines;
}

function gapFits(xs, ys, n, from, to, pts, tol) {
  for (let k = Math.floor(from) + 1; k < Math.ceil(to); k++) {
    const px = xs[mod(k, n)];
    const py = ys[mod(k, n)];
    let best = Infinity;
    for (let i = 0; i < pts.length - 1; i++) {
      best = Math.min(best, segmentDistance(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]));
    }
    if (best > tol) return false;
  }
  return true;
}

function bezierPoint(x0, y0, x1, y1, x2, y2, x3, y3, t) {
  const s = 1 - t;
  const a = s * s * s;
  const b = 3 * s * s * t;
  const c = 3 * s * t * t;
  const d = t * t * t;
  return [a * x0 + b * x1 + c * x2 + d * x3, a * y0 + b * y1 + c * y2 + d * y3];
}

function fitCubic(lx, ly, i0, i1, x0, y0, t0x, t0y, x3, y3, t3x, t3y, tol, stride = 1, polish = false) {
  const m = i1 >= i0 ? Math.floor((i1 - i0) / stride) + 1 : 0;
  const count = m + 2;
  const px = new Float64Array(count);
  const py = new Float64Array(count);
  const u = new Float64Array(count);
  px[0] = x0;
  py[0] = y0;
  for (let i = 0; i < m; i++) {
    px[i + 1] = lx[i0 + i * stride];
    py[i + 1] = ly[i0 + i * stride];
  }
  px[count - 1] = x3;
  py[count - 1] = y3;
  let acc = 0;
  for (let i = 1; i < count; i++) {
    acc += Math.hypot(px[i] - px[i - 1], py[i] - py[i - 1]);
    u[i] = acc;
  }
  const chord = Math.hypot(x3 - x0, y3 - y0);
  if (acc < 1e-9) return { c1x: x0, c1y: y0, c2x: x3, c2y: y3, err: 0, worst: -1, stride };
  for (let i = 1; i < count; i++) u[i] /= acc;
  const lo = Math.max(chord, acc) * 1e-3 + 1e-9;
  const hi = Math.max(chord, acc) * 2.5;
  let best = null;
  let last = Infinity;
  const rounds = polish ? 12 : 7;
  for (let iter = 0; iter < rounds; iter++) {
    let c11 = 0;
    let c12 = 0;
    let c22 = 0;
    let r1 = 0;
    let r2 = 0;
    for (let i = 1; i < count - 1; i++) {
      const t = u[i];
      const s = 1 - t;
      const b0 = s * s * s;
      const b1 = 3 * s * s * t;
      const b2 = 3 * s * t * t;
      const b3 = t * t * t;
      const ax = t0x * b1;
      const ay = t0y * b1;
      const bx = -t3x * b2;
      const by = -t3y * b2;
      const rx = px[i] - (x0 * (b0 + b1) + x3 * (b2 + b3));
      const ry = py[i] - (y0 * (b0 + b1) + y3 * (b2 + b3));
      c11 += ax * ax + ay * ay;
      c12 += ax * bx + ay * by;
      c22 += bx * bx + by * by;
      r1 += ax * rx + ay * ry;
      r2 += bx * rx + by * ry;
    }
    let a1 = acc / 3;
    let a2 = acc / 3;
    const det = c11 * c22 - c12 * c12;
    if (m >= 2 && det > 1e-12 * c11 * c22) {
      a1 = (r1 * c22 - r2 * c12) / det;
      a2 = (c11 * r2 - c12 * r1) / det;
      if (!(a1 > lo && a1 < hi) || !(a2 > lo && a2 < hi)) {
        if (a1 > lo && a1 < hi && c22 > 0) {
          a2 = clamp((r2 - c12 * a1) / c22, lo, hi);
        } else if (a2 > lo && a2 < hi && c11 > 0) {
          a1 = clamp((r1 - c12 * a2) / c11, lo, hi);
        } else {
          a1 = acc / 3;
          a2 = acc / 3;
        }
      }
    } else if (m === 1 && c11 + c22 > 0) {
      a1 = acc / 3;
      a2 = acc / 3;
    }
    const c1x = x0 + t0x * a1;
    const c1y = y0 + t0y * a1;
    const c2x = x3 - t3x * a2;
    const c2y = y3 - t3y * a2;
    let err = 0;
    let worst = -1;
    for (let i = 1; i < count - 1; i++) {
      const p = bezierPoint(x0, y0, c1x, c1y, c2x, c2y, x3, y3, u[i]);
      const d = Math.hypot(p[0] - px[i], p[1] - py[i]);
      if (d > err) {
        err = d;
        worst = i;
      }
    }
    for (let i = 0; i < count - 1; i++) {
      const p = bezierPoint(x0, y0, c1x, c1y, c2x, c2y, x3, y3, (u[i] + u[i + 1]) / 2);
      const d = segmentDistance(p[0], p[1], px[i], py[i], px[i + 1], py[i + 1]);
      if (d > err) {
        err = d;
        worst = i === 0 ? 1 : i;
      }
    }
    if (!best || err < best.err) {
      best = {
        c1x,
        c1y,
        c2x,
        c2y,
        err,
        worst: worst > 0 && worst < count - 1 ? i0 + (worst - 1) * stride : -1,
        stride
      };
    }
    if (m < 2 || (iter > 0 && err > tol * 12) || (iter > 2 && best.err > tol * 2)) break;
    if (err <= tol && (!polish || last - err < tol * 0.002)) break;
    last = err;
    for (let i = 1; i < count - 1; i++) {
      const t = u[i];
      const s = 1 - t;
      const bx = s * s * s * x0 + 3 * s * s * t * c1x + 3 * s * t * t * c2x + t * t * t * x3;
      const by = s * s * s * y0 + 3 * s * s * t * c1y + 3 * s * t * t * c2y + t * t * t * y3;
      const dx = 3 * (s * s * (c1x - x0) + 2 * s * t * (c2x - c1x) + t * t * (x3 - c2x));
      const dy = 3 * (s * s * (c1y - y0) + 2 * s * t * (c2y - c1y) + t * t * (y3 - c2y));
      const ddx = 6 * (s * (c2x - 2 * c1x + x0) + t * (x3 - 2 * c2x + c1x));
      const ddy = 6 * (s * (c2y - 2 * c1y + y0) + t * (y3 - 2 * c2y + c1y));
      const ex = bx - px[i];
      const ey = by - py[i];
      const num = ex * dx + ey * dy;
      const den = dx * dx + dy * dy + ex * ddx + ey * ddy;
      if (den > 1e-12) u[i] = clamp(t - num / den, 0, 1);
    }
  }
  return best;
}

function chordTangent(lx, ly, k, lo, hi, w) {
  const a = Math.max(lo, k - w);
  const b = Math.min(hi, k + w);
  const dx = lx[b] - lx[a];
  const dy = ly[b] - ly[a];
  const l = Math.hypot(dx, dy) || 1;
  return [dx / l, dy / l];
}

function fitMulti(ctx, i0, i1, x0, y0, t0, x3, y3, t3, depth = 0) {
  const { lx, ly, tol } = ctx;
  const r = fitCubic(lx, ly, i0, i1, x0, y0, t0[0], t0[1], x3, y3, t3[0], t3[1], tol, 1, true);
  if (r.err <= tol || i1 - i0 < 4 || depth > 14) return [{ ...r, x: x3, y: y3, i0, i1 }];
  const split = clamp(r.worst < 0 ? (i0 + i1) >> 1 : r.worst, i0 + 2, i1 - 2);
  const t = chordTangent(ctx.sx, ctx.sy, split, i0 - 1, i1 + 1, ctx.w);
  const sx = lx[split];
  const sy = ly[split];
  return [
    ...fitMulti(ctx, i0, split - 1, x0, y0, t0, sx, sy, t, depth + 1),
    ...fitMulti(ctx, split + 1, i1, sx, sy, t, x3, y3, t3, depth + 1)
  ];
}

function thetaProfile(lx, ly, count, closed, w) {
  const theta = new Float64Array(closed ? count + 1 : count);
  let prev = 0;
  for (let k = 0; k < count; k++) {
    const a = closed ? mod(k - w, count) : Math.max(0, k - w);
    const b = closed ? mod(k + w, count) : Math.min(count - 1, k + w);
    const raw = Math.atan2(ly[b] - ly[a], lx[b] - lx[a]);
    theta[k] = k === 0 ? raw : prev + wrapPi(raw - prev);
    prev = theta[k];
  }
  if (closed) theta[count] = theta[count - 1] + wrapPi(theta[0] - theta[count - 1]);
  return theta;
}

function interp(arr, pos, count, closed) {
  const k = Math.floor(pos);
  const f = pos - k;
  const a = closed ? mod(k, count) : clamp(k, 0, count - 1);
  const b = closed ? mod(k + 1, count) : clamp(k + 1, 0, count - 1);
  return arr[a] + (arr[b] - arr[a]) * f;
}

function findFeatures(lx, ly, arc, count, closed, h, theta) {
  const crossings = [];
  const pairs = closed ? count : count - 1;
  for (let k = 0; k < pairs; k++) {
    const a = theta[k];
    const b = theta[k + 1];
    if (a === b) continue;
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    for (let m = Math.ceil(lo / HALF_PI); m * HALF_PI <= hi; m++) {
      const level = m * HALF_PI;
      if (level === a) continue;
      crossings.push({ pos: k + (level - a) / (b - a), level: m });
    }
  }
  crossings.sort((p, q) => p.pos - q.pos);
  const gap = 3 / h;
  const taken = new Uint8Array(crossings.length);
  const feats = [];
  for (let i = 0; i < crossings.length; i++) {
    if (taken[i]) continue;
    const group = [crossings[i]];
    taken[i] = 1;
    let last = crossings[i].pos;
    for (let j = i + 1; j < crossings.length && crossings[j].pos - last <= gap; j++) {
      if (!taken[j] && crossings[j].level === crossings[i].level) {
        group.push(crossings[j]);
        taken[j] = 1;
        last = crossings[j].pos;
      }
    }
    if (group.length % 2 === 0) continue;
    const c = group[group.length >> 1];
    const ang = c.level * HALF_PI;
    feats.push({ pos: c.pos, tx: Math.round(Math.cos(ang)), ty: Math.round(Math.sin(ang)), bonus: 0.02, kind: 'x' });
  }
  const kap = new Float64Array(count);
  for (let k = 0; k < count; k++) {
    const a = closed ? k - 1 : Math.max(0, k - 1);
    const b = closed ? k + 1 : Math.min(count - 1, k + 1);
    const ta = closed ? theta[mod(a, count)] + (a < 0 ? theta[0] - theta[count] : 0) : theta[a];
    const tb = closed ? theta[mod(b, count)] + (b >= count ? theta[count] - theta[0] : 0) : theta[b];
    kap[k] = b > a ? (tb - ta) / ((b - a) * h) : 0;
  }
  const smooth = new Float64Array(count);
  const r = Math.max(1, Math.round(2 / h));
  for (let k = 0; k < count; k++) {
    let s = 0;
    let c = 0;
    for (let j = -r; j <= r; j++) {
      const q = closed ? mod(k + j, count) : k + j;
      if (q < 0 || q >= count) continue;
      s += kap[q];
      c++;
    }
    smooth[k] = s / c;
  }
  const dz = 0.0025;
  let first = -1;
  for (let k = 0; k < count; k++) {
    if (Math.abs(smooth[k]) > dz) {
      first = k;
      break;
    }
  }
  if (first >= 0) {
    let lastSign = Math.sign(smooth[first]);
    let lastIdx = first;
    const span = closed ? count : count - first;
    for (let i = 1; i <= span; i++) {
      const k = first + i;
      const v = smooth[closed ? mod(k, count) : k];
      if (!closed && k >= count) break;
      if (Math.abs(v) <= dz) continue;
      const s = Math.sign(v);
      if (s !== lastSign) {
        let z = (lastIdx + k) / 2;
        for (let q = lastIdx; q < k; q++) {
          const va = smooth[closed ? mod(q, count) : q];
          const vb = smooth[closed ? mod(q + 1, count) : q + 1];
          if (va * vb <= 0 && va !== vb) {
            z = q + va / (va - vb);
            break;
          }
        }
        const pos = closed ? mod(z, count) : z;
        const th = interp(theta, pos, closed ? count + 1 : count, false);
        feats.push({ pos, tx: Math.cos(th), ty: Math.sin(th), bonus: 0.01, kind: 'i' });
      }
      lastSign = s;
      lastIdx = k;
    }
  }
  feats.sort((p, q) => p.pos - q.pos);
  const minGap = 2;
  const total = closed ? arc[count] : arc[count - 1];
  const out = [];
  for (const f of feats) {
    f.s = interp(arc, f.pos, closed ? count + 1 : count, false);
    if (!closed && (f.s < minGap || f.s > total - minGap)) continue;
    const prev = out[out.length - 1];
    if (prev && f.s - prev.s < minGap) {
      if (f.bonus > prev.bonus) out[out.length - 1] = f;
      continue;
    }
    out.push(f);
  }
  if (closed && out.length > 1 && out[0].s + total - out[out.length - 1].s < minGap) {
    if (out[0].bonus >= out[out.length - 1].bonus) out.pop();
    else out.shift();
  }
  for (const f of out) {
    const k = Math.floor(f.pos);
    const fr = f.pos - k;
    const a = closed ? mod(k, count) : clamp(k, 0, count - 1);
    const b = closed ? mod(k + 1, count) : clamp(k + 1, 0, count - 1);
    f.x = lx[a] + (lx[b] - lx[a]) * fr;
    f.y = ly[a] + (ly[b] - ly[a]) * fr;
    f.theta = interp(theta, f.pos, closed ? count + 1 : count, false);
  }
  return out;
}

const FREE_TURN = 0.26;

function freeNodes(lx, ly, arc, theta, count, closed, feats, pieces = 1) {
  const out = [];
  const total = closed ? arc[count] : arc[count - 1];
  const last = closed ? count : count - 1;
  const step = clamp(total / Math.max(1, pieces) / 6, 12, 48);
  let acc = 0;
  let f = 0;
  for (let k = 1; k < last; k++) {
    acc += (arc[k] - arc[k - 1]) / step + Math.abs(theta[k] - theta[k - 1]) / FREE_TURN;
    if (acc < 1) continue;
    acc = 0;
    const s = arc[k];
    if (!closed && (s < 2 || s > total - 2)) continue;
    while (f < feats.length && feats[f].s < s - 2) f++;
    if (f < feats.length && Math.abs(feats[f].s - s) < 2) continue;
    const t = theta[k];
    out.push({ pos: k, s, x: lx[k], y: ly[k], tx: Math.cos(t), ty: Math.sin(t), theta: t, bonus: -0.1, kind: 'f' });
  }
  return out;
}

function solvePath(count, nodeAt, edge) {
  const cost = new Float64Array(count).fill(Infinity);
  const prev = new Int32Array(count).fill(-1);
  cost[0] = 0;
  for (let a = 0; a < count - 1; a++) {
    if (cost[a] === Infinity) continue;
    const na = nodeAt(a);
    let fails = 0;
    for (let b = a + 1; b < count; b++) {
      const nb = nodeAt(b);
      if (b > a + 1 && Math.abs(nb.theta - na.theta) > 3.5) break;
      const e = edge(a, b);
      if (e === Infinity) {
        if (++fails >= 3) break;
        continue;
      }
      fails = 0;
      const c = cost[a] + e - nb.bonus;
      if (c < cost[b]) {
        cost[b] = c;
        prev[b] = a;
      }
    }
  }
  if (cost[count - 1] === Infinity) return null;
  const path = [];
  for (let b = count - 1; b > 0; b = prev[b]) path.unshift(b);
  path.unshift(0);
  return { path, cost: cost[count - 1] };
}

function spanFit(ctx, a, b, fine, polish = fine) {
  const i0 = Math.floor(a.pos) + 1;
  const i1 = Math.ceil(b.pos) - 1;
  const span = i1 - i0 + 1;
  const stride = fine || span <= 160 ? 1 : Math.ceil(span / 120);
  return fitCubic(ctx.lx, ctx.ly, i0, i1, a.x, a.y, a.tx, a.ty, b.x, b.y, b.tx, b.ty, ctx.tol, stride, polish);
}

function spanMulti(ctx, a, b) {
  const i0 = Math.floor(a.pos) + 1;
  const i1 = Math.ceil(b.pos) - 1;
  return fitMulti(ctx, i0, i1, a.x, a.y, [a.tx, a.ty], b.x, b.y, [b.tx, b.ty]);
}

function makeGraph(ctx, nodeAt, keyOf, baseOf, maxOf) {
  const fits = new Map();
  const multis = new Map();
  const spans = new Map();
  const ok = (a, b) => {
    const key = keyOf(a, b);
    let r = fits.get(key);
    if (r === undefined) {
      let fit = spanFit(ctx, nodeAt(a), nodeAt(b), false);
      if (fit.stride > 1 && fit.err > ctx.tol * 0.8 && fit.err < ctx.tol * 1.25)
        fit = spanFit(ctx, nodeAt(a), nodeAt(b), true, false);
      r = fit.err <= ctx.tol ? fit.err : -1;
      fits.set(key, r);
    }
    return r >= 0;
  };
  const errOf = (a, b) => fits.get(keyOf(a, b));
  const adjacent = a => {
    const key = keyOf(a, a + 1);
    if (!multis.has(key)) multis.set(key, spanMulti(ctx, nodeAt(a), nodeAt(a + 1)).length);
    return multis.get(key) + 1e-3;
  };
  const edge = (a, b) => {
    if (ok(a, b)) return 1 + 1e-3 * Math.min(1, errOf(a, b) / ctx.tol);
    return b === a + 1 ? adjacent(a) : Infinity;
  };
  const fullReach = (a, limit, hint) => {
    const base = nodeAt(a).theta;
    const fine = b => Math.abs(nodeAt(b).theta - base) <= 3.5 && ok(a, b);
    if (limit <= a || !ok(a, a + 1)) return a;
    let good = a + 1;
    let bad = limit + 1;
    let step = 1;
    if (hint > good + 1 && hint <= limit) {
      if (fine(hint)) good = hint;
      else bad = hint;
    }
    while (good < limit && bad > limit) {
      const b = Math.min(limit, good + step);
      if (!fine(b)) {
        bad = b;
        break;
      }
      good = b;
      step *= 2;
    }
    while (bad - good > 1) {
      const mid = (good + bad) >> 1;
      if (fine(mid)) good = mid;
      else bad = mid;
    }
    return good;
  };
  const reach = (a, limit) => {
    const base = baseOf(a);
    let span = spans.get(base);
    if (span === undefined) {
      const near = spans.get(base - 1);
      span = fullReach(base, maxOf(base), near === undefined ? 0 : base - 1 + near) - base;
      spans.set(base, span);
    }
    return Math.min(a + span, limit);
  };
  return { edge, adjacent, reach };
}

function solveReach(count, nodeAt, graph) {
  const cost = new Float64Array(count).fill(Infinity);
  const prev = new Int32Array(count).fill(-1);
  cost[0] = 0;
  for (let a = 0; a < count - 1; a++) {
    if (cost[a] === Infinity) continue;
    const r = graph.reach(a, count - 1);
    if (r <= a) {
      const c = cost[a] + graph.adjacent(a) - nodeAt(a + 1).bonus;
      if (c < cost[a + 1]) {
        cost[a + 1] = c;
        prev[a + 1] = a;
      }
      continue;
    }
    for (let b = a + 1; b <= r; b++) {
      const c = cost[a] + 1 - nodeAt(b).bonus;
      if (c < cost[b]) {
        cost[b] = c;
        prev[b] = a;
      }
    }
  }
  if (cost[count - 1] === Infinity) return null;
  const path = [];
  for (let b = count - 1; b > 0; b = prev[b]) path.unshift(b);
  path.unshift(0);
  return { path, cost: cost[count - 1] };
}

function realize(ctx, path) {
  const segments = [];
  let multi = false;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const r = spanFit(ctx, a, b, true);
    if (r.err <= ctx.tol) segments.push({ ...r, x: b.x, y: b.y, i0: Math.floor(a.pos) + 1, i1: Math.ceil(b.pos) - 1 });
    else {
      multi = true;
      segments.push(...spanMulti(ctx, a, b));
    }
  }
  return { segments, multi, start: path[0] };
}

function planOpen(ctx, nodes, exhaustive) {
  const N = nodes.length;
  const nodeAt = i => nodes[i];
  const graph = makeGraph(
    ctx,
    nodeAt,
    (a, b) => a * N + b,
    a => a,
    () => N - 1
  );
  const solved = exhaustive ? solvePath(N, nodeAt, graph.edge) : solveReach(N, nodeAt, graph);
  return solved ? realize(ctx, solved.path.map(nodeAt)) : null;
}

function planClosed(ctx, nodes, starts, exhaustive) {
  const N = nodes.length;
  const shifted = nodes.map(f => ({ ...f, pos: f.pos + ctx.n, theta: f.theta + ctx.winding }));
  const unrolled = i => (i < N ? nodes[i] : i < 2 * N ? shifted[i - N] : null);
  const graph = makeGraph(
    ctx,
    unrolled,
    (a, b) => (a % N) * (N + 1) + (b - a),
    a => a % N,
    base => base + N
  );
  let best = null;
  for (const s of starts) {
    const local = k => unrolled(s + k);
    const view = {
      edge: (a, b) => graph.edge(s + a, s + b),
      adjacent: a => graph.adjacent(s + a),
      reach: (a, limit) => graph.reach(s + a, s + limit) - s
    };
    const solved = exhaustive ? solvePath(N + 1, local, view.edge) : solveReach(N + 1, local, view);
    if (solved && (!best || solved.cost < best.cost - 1e-9)) best = { ...solved, s };
  }
  return best
    ? realize(
        ctx,
        best.path.map(k => unrolled(best.s + k))
      )
    : null;
}

function better(first, second) {
  if (!second) return first;
  if (!first) return second;
  const a = first.segments.length;
  const b = second.segments.length;
  return (first.multi && b <= a) || b <= a - 2 ? second : first;
}

function absTurn(theta, count) {
  let sum = 0;
  for (let k = 1; k < count; k++) sum += Math.abs(theta[k] - theta[k - 1]);
  return sum;
}

const unit = (ax, ay, bx, by) => {
  const dx = bx - ax;
  const dy = by - ay;
  const l = Math.hypot(dx, dy);
  return l > 1e-9 ? [dx / l, dy / l] : null;
};

function mergeTwo(lx, ly, from, a, b, tol) {
  const t0 = unit(from[0], from[1], a.c1x, a.c1y) || unit(from[0], from[1], a.x, a.y);
  const t3 = unit(b.c2x, b.c2y, b.x, b.y) || unit(a.x, a.y, b.x, b.y);
  if (!t0 || !t3) return null;
  const r = fitCubic(lx, ly, a.i0, b.i1, from[0], from[1], t0[0], t0[1], b.x, b.y, t3[0], t3[1], tol, 1, true);
  return r.err <= tol ? { ...r, x: b.x, y: b.y, i0: a.i0, i1: b.i1 } : null;
}

function mergeRun(lx, ly, start, segments, tol) {
  const list = segments.slice();
  let j = 0;
  let from = start;
  while (j < list.length - 1) {
    const merged = mergeTwo(lx, ly, from, list[j], list[j + 1], tol);
    if (merged) list.splice(j, 2, merged);
    else {
      from = [list[j].x, list[j].y];
      j++;
    }
  }
  return list;
}

function fitRun(src, k0, k1, P0, t0, P3, t3, tol, noisy) {
  const { xs, ys, sxs, sys, n, h } = src;
  const m = Math.max(0, k1 - k0 + 1);
  const count = m + 2;
  const lx = new Float64Array(count);
  const ly = new Float64Array(count);
  const sx = noisy ? new Float64Array(count) : lx;
  const sy = noisy ? new Float64Array(count) : ly;
  lx[0] = sx[0] = P0[0];
  ly[0] = sy[0] = P0[1];
  for (let i = 0; i < m; i++) {
    const k = mod(k0 + i, n);
    lx[i + 1] = xs[k];
    ly[i + 1] = ys[k];
    sx[i + 1] = sxs[k];
    sy[i + 1] = sys[k];
  }
  lx[count - 1] = sx[count - 1] = P3[0];
  ly[count - 1] = sy[count - 1] = P3[1];
  const w = Math.max(1, Math.round((noisy ? 4 : 1.5) / h));
  const ctx = { lx, ly, sx, sy, tol, w };
  const single = fitCubic(lx, ly, 1, count - 2, P0[0], P0[1], t0[0], t0[1], P3[0], P3[1], t3[0], t3[1], tol, 1, true);
  if (single.err <= tol || m < 3) return [{ ...single, x: P3[0], y: P3[1] }];
  if (m < 6) return mergeRun(lx, ly, P0, fitMulti(ctx, 1, count - 2, P0[0], P0[1], t0, P3[0], P3[1], t3), tol);
  const arc = new Float64Array(count);
  for (let i = 1; i < count; i++) arc[i] = arc[i - 1] + Math.hypot(lx[i] - lx[i - 1], ly[i] - ly[i - 1]);
  const theta = thetaProfile(sx, sy, count, false, w);
  const feats = findFeatures(lx, ly, arc, count, false, h, theta);
  const head = { pos: 0, s: 0, x: P0[0], y: P0[1], tx: t0[0], ty: t0[1], bonus: 0, theta: theta[0] };
  const tail = {
    pos: count - 1,
    s: arc[count - 1],
    x: P3[0],
    y: P3[1],
    tx: t3[0],
    ty: t3[1],
    bonus: 0,
    theta: theta[count - 1]
  };
  let plan = planOpen(ctx, [head, ...feats, tail], true);
  if (!plan || plan.multi || plan.segments.length > Math.ceil(absTurn(theta, count) / HALF_PI) + 1) {
    const free = freeNodes(lx, ly, arc, theta, count, false, feats, plan ? plan.segments.length : 1);
    const nodes = [...feats, ...free].sort((a, b) => a.pos - b.pos);
    plan = better(plan, planOpen(ctx, [head, ...nodes, tail], false));
  }
  const segments = plan ? plan.segments : fitMulti(ctx, 1, count - 2, P0[0], P0[1], t0, P3[0], P3[1], t3);
  return mergeRun(lx, ly, P0, segments, tol);
}

function fitClosed(src, tol, noisy) {
  const { xs, ys, sxs, sys, n, h } = src;
  const w = Math.max(1, Math.round((noisy ? 4 : 1.5) / h));
  const theta = thetaProfile(sxs, sys, n, true, w);
  const arc = new Float64Array(n + 1);
  for (let i = 1; i <= n; i++) {
    const a = i - 1;
    const b = i % n;
    arc[i] = arc[i - 1] + Math.hypot(xs[b] - xs[a], ys[b] - ys[a]);
  }
  const lx = new Float64Array(3 * n + 1);
  const ly = new Float64Array(3 * n + 1);
  const sx = noisy ? new Float64Array(3 * n + 1) : lx;
  const sy = noisy ? new Float64Array(3 * n + 1) : ly;
  for (let i = 0; i <= 3 * n; i++) {
    lx[i] = xs[i % n];
    ly[i] = ys[i % n];
    sx[i] = sxs[i % n];
    sy[i] = sys[i % n];
  }
  const ctx = { lx, ly, sx, sy, tol, w, n, winding: theta[n] - theta[0] };
  const feats = findFeatures(xs, ys, arc, n, true, h, theta);
  let plan =
    feats.length >= 2
      ? planClosed(
          ctx,
          feats,
          feats.map((f, i) => i),
          true
        )
      : null;
  if (!plan || plan.multi || plan.segments.length > Math.ceil(absTurn(theta, n + 1) / HALF_PI) + 1) {
    const free = freeNodes(xs, ys, arc, theta, n, true, feats, plan ? plan.segments.length : 1);
    const nodes = [...feats, ...free].sort((a, b) => a.pos - b.pos);
    const starts = [];
    const every = Math.max(1, Math.round(free.length / 12));
    let k = 0;
    nodes.forEach((node, i) => {
      if (node.kind !== 'f' || k++ % every === 0) starts.push(i);
    });
    if (nodes.length >= 2) plan = better(plan, planClosed(ctx, nodes, starts, false));
  }
  if (!plan) return null;
  let start = [plan.start.x, plan.start.y];
  let segments = mergeRun(lx, ly, start, plan.segments, tol);
  if (segments.length > 2) {
    const last = segments[segments.length - 1];
    const first = segments[0];
    const from = [segments[segments.length - 2].x, segments[segments.length - 2].y];
    const merged = mergeTwo(lx, ly, from, last, { ...first, i0: first.i0 + n, i1: first.i1 + n }, tol);
    if (merged) {
      start = from;
      segments = [merged, ...segments.slice(1, -1)];
    }
  }
  return { start, segments };
}

function toSegment(r) {
  return { type: 'C', c1: [r.c1x, r.c1y], c2: [r.c2x, r.c2y], p: [r.x, r.y] };
}

function cleanup(start, segments, tol) {
  const straight = Math.min(0.03, tol * 0.1);
  let cur = start;
  const out = [];
  for (const seg of segments) {
    const p = seg.p;
    const len = Math.hypot(p[0] - cur[0], p[1] - cur[1]);
    if (seg.type === 'C') {
      const dx = p[0] - cur[0];
      const dy = p[1] - cur[1];
      if (len > 1e-9) {
        const ux = dx / len;
        const uy = dy / len;
        const off = c => Math.abs((c[1] - cur[1]) * ux - (c[0] - cur[0]) * uy);
        const along = c => ((c[0] - cur[0]) * ux + (c[1] - cur[1]) * uy) / len;
        if (
          off(seg.c1) <= straight &&
          off(seg.c2) <= straight &&
          along(seg.c1) >= -1e-6 &&
          along(seg.c2) <= 1 + 1e-6 &&
          along(seg.c1) <= 1 + 1e-6 &&
          along(seg.c2) >= -1e-6
        ) {
          out.push({ type: 'L', p });
          cur = p;
          continue;
        }
      } else if (
        Math.hypot(seg.c1[0] - cur[0], seg.c1[1] - cur[1]) + Math.hypot(seg.c2[0] - p[0], seg.c2[1] - p[1]) <
        1e-9
      ) {
        continue;
      }
      out.push(seg);
      cur = p;
      continue;
    }
    if (len < 1e-9) continue;
    out.push(seg);
    cur = p;
  }
  const merged = [];
  let prev = start;
  for (let i = 0; i < out.length; i++) {
    const seg = out[i];
    const last = merged[merged.length - 1];
    if (seg.type === 'L' && last && last.type === 'L') {
      const a = merged.length > 1 ? merged[merged.length - 2].p : start;
      const b = last.p;
      const c = seg.p;
      const len = Math.hypot(c[0] - a[0], c[1] - a[1]);
      if (len > 1e-9) {
        const off = Math.abs((b[1] - a[1]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[1] - a[1])) / len;
        const along = ((b[0] - a[0]) * (c[0] - a[0]) + (b[1] - a[1]) * (c[1] - a[1])) / (len * len);
        if (off <= straight && along > 0 && along < 1) {
          last.p = c;
          continue;
        }
      }
    }
    merged.push(seg);
    prev = seg.p;
  }
  if (merged.length > 2) {
    const first = merged[0];
    const last = merged[merged.length - 1];
    const a = merged[merged.length - 2].p;
    if (first.type === 'L' && last.type === 'L') {
      const c = first.p;
      const len = Math.hypot(c[0] - a[0], c[1] - a[1]);
      if (len > 1e-9) {
        const off = Math.abs((start[1] - a[1]) * (c[0] - a[0]) - (start[0] - a[0]) * (c[1] - a[1])) / len;
        const along = ((start[0] - a[0]) * (c[0] - a[0]) + (start[1] - a[1]) * (c[1] - a[1])) / (len * len);
        if (off <= straight && along > 0 && along < 1) {
          merged.pop();
          return { start: a, segments: merged, end: a };
        }
      }
    }
  }
  return { start, segments: merged, end: prev };
}

function rotateStart(start, segments) {
  if (!segments.length) return { start, segments };
  const nodes = [start, ...segments.map(s => s.p)];
  let best = 0;
  for (let i = 1; i < segments.length; i++) {
    const a = nodes[i];
    const b = nodes[best];
    if (a[1] < b[1] - 0.5 || (Math.abs(a[1] - b[1]) <= 0.5 && a[0] < b[0])) best = i;
  }
  if (best === 0) return { start, segments };
  return { start: nodes[best], segments: [...segments.slice(best), ...segments.slice(0, best)] };
}

function closeLoop(start, segments) {
  const last = segments[segments.length - 1];
  if (last) {
    last.p = start;
  }
  return segments;
}

const NOISE_FLOOR = 0.008;
const KINK_TURN = 10 * DEG;

function estimateNoise(xs, ys, n, h, turn) {
  const W = Math.max(3, Math.round(4 / h));
  if (n < 6 * W) return 0;
  const step = Math.max(1, Math.floor(n / 800));
  const values = [];
  for (let k = 0; k < n; k += step) {
    if (turn[k] > 0.35) continue;
    const a = mod(k - W, n);
    const b = mod(k + W, n);
    let ux = xs[b] - xs[a];
    let uy = ys[b] - ys[a];
    const len = Math.hypot(ux, uy);
    if (len < 1e-9) continue;
    ux /= len;
    uy /= len;
    let s0 = 0;
    let s1 = 0;
    let s2 = 0;
    let s3 = 0;
    let s4 = 0;
    let t0 = 0;
    let t1 = 0;
    let t2 = 0;
    for (let j = -W; j <= W; j++) {
      const q = mod(k + j, n);
      const dx = xs[q] - xs[k];
      const dy = ys[q] - ys[k];
      const x = dx * ux + dy * uy;
      const y = dy * ux - dx * uy;
      const x2 = x * x;
      s0 += 1;
      s1 += x;
      s2 += x2;
      s3 += x2 * x;
      s4 += x2 * x2;
      t0 += y;
      t1 += x * y;
      t2 += x2 * y;
    }
    const q = solve3([s0, s1, s2, s1, s2, s3, s2, s3, s4], [t0, t1, t2]);
    if (q) values.push(Math.abs(q[0]));
  }
  if (values.length < 8) return 0;
  values.sort((p, q) => p - q);
  return values[Math.floor(values.length * 0.9)];
}

function smoothRange(xs, ys, n, out, start, end, radius, weights) {
  const len = end - start + 1;
  if (len < 3) return;
  const px = new Float64Array(len);
  const py = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    px[i] = xs[mod(start + i, n)];
    py[i] = ys[mod(start + i, n)];
  }
  const at = (arr, i) => {
    if (i < 0) return 2 * arr[0] - arr[Math.min(len - 1, -i)];
    if (i >= len) return 2 * arr[len - 1] - arr[Math.max(0, 2 * (len - 1) - i)];
    return arr[i];
  };
  for (let i = 1; i < len - 1; i++) {
    let sx = 0;
    let sy = 0;
    let sw = 0;
    for (let j = -radius; j <= radius; j++) {
      const wgt = weights[j + radius];
      sx += at(px, i + j) * wgt;
      sy += at(py, i + j) * wgt;
      sw += wgt;
    }
    const k = mod(start + i, n);
    out.xs[k] = sx / sw;
    out.ys[k] = sy / sw;
  }
}

function smoothContour(Q, corners, sigma) {
  const { xs, ys, n, h } = Q;
  const s = sigma / h;
  const radius = Math.max(1, Math.ceil(s * 3));
  const weights = [];
  for (let j = -radius; j <= radius; j++) weights.push(Math.exp((-j * j) / (2 * s * s)));
  const out = { ...Q, xs: Float64Array.from(xs), ys: Float64Array.from(ys) };
  if (!corners.length) {
    for (let k = 0; k < n; k++) {
      let sx = 0;
      let sy = 0;
      let sw = 0;
      for (let j = -radius; j <= radius; j++) {
        const q = mod(k + j, n);
        const wgt = weights[j + radius];
        sx += xs[q] * wgt;
        sy += ys[q] * wgt;
        sw += wgt;
      }
      out.xs[k] = sx / sw;
      out.ys[k] = sy / sw;
    }
    return out;
  }
  for (let i = 0; i < corners.length; i++) {
    const c = corners[i];
    const next = corners[(i + 1) % corners.length];
    let end = next.from - 1;
    if (i === corners.length - 1) end += n;
    smoothRange(xs, ys, n, out, c.to + 1, end, radius, weights);
  }
  return out;
}

function fitContour(points, opts) {
  if (points.length < 3) return null;
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    total += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  if (total < 1e-6) return null;
  const Q = resample(points, clamp(total / 48, 0.2, 1));
  const { xs, ys, n, h } = Q;
  const tol = opts.tolerance;
  const w = Math.max(2, Math.round(2.5 / h));
  const rawTurn = turnProfile(xs, ys, n, w);
  const noise = total > 24 ? estimateNoise(xs, ys, n, h, rawTurn) : 0;
  const noisy = noise > NOISE_FLOOR;
  const local = {
    ...opts,
    noise,
    lineTolerance: noisy ? Math.max(opts.lineTolerance, noise * 2.5) : opts.lineTolerance
  };
  const corners = total > 12 ? findCorners(Q, rawTurn, w, local) : [];
  const S = noisy ? smoothContour(Q, corners, 1.5) : Q;
  const turn = noisy ? turnProfile(S.xs, S.ys, n, w) : rawTurn;
  const fitTol = noisy ? Math.min(tol * 1.4, tol + 2 * noise) : tol;
  const src = { xs, ys, sxs: S.xs, sys: S.ys, n, h };

  let anchors = [];
  if (corners.length) {
    for (let i = 0; i < corners.length; i++) {
      const c = corners[i];
      const next = corners[(i + 1) % corners.length];
      anchors.push({ ...c, line: false });
      const start = c.to + 1;
      let end = next.from - 1;
      if (i === corners.length - 1) end += n;
      if (end - start < 2 * w) continue;
      for (const L of findLines(S, turn, w, start, end, local)) {
        anchors.push({
          x: L.p0[0],
          y: L.p0[1],
          tin: [L.dx, L.dy],
          tout: [L.dx, L.dy],
          from: L.b,
          to: L.b,
          line: true,
          L,
          atStart: L.atStart
        });
        anchors.push({
          x: L.p1[0],
          y: L.p1[1],
          tin: [L.dx, L.dy],
          tout: [L.dx, L.dy],
          from: L.e,
          to: L.e,
          line: false,
          L,
          atEnd: L.atEnd,
          lineEnd: true
        });
      }
    }
  } else if (total > 12) {
    let start = 0;
    for (let k = 1; k < n; k++) if (turn[k] > turn[start]) start = k;
    for (const L of findLines(S, turn, w, start + 1, start + n - 1, local)) {
      anchors.push({
        x: L.p0[0],
        y: L.p0[1],
        tin: [L.dx, L.dy],
        tout: [L.dx, L.dy],
        from: L.b,
        to: L.b,
        line: true,
        L
      });
      anchors.push({
        x: L.p1[0],
        y: L.p1[1],
        tin: [L.dx, L.dy],
        tout: [L.dx, L.dy],
        from: L.e,
        to: L.e,
        line: false,
        L,
        lineEnd: true
      });
    }
  }

  if (!anchors.length) {
    const closed = fitClosed(src, fitTol, noisy);
    if (!closed) return null;
    const segments = closeLoop(closed.start, closed.segments.map(toSegment));
    const clean = cleanup(closed.start, segments, tol);
    const rotated = rotateStart(clean.start, clean.segments);
    return rotated;
  }

  anchors = mergeAnchors(anchors, Q, fitTol, noisy);

  const segments = [];
  const A = anchors.length;
  for (let i = 0; i < A; i++) {
    const a = anchors[i];
    const b = anchors[(i + 1) % A];
    if (a.line) {
      segments.push({ type: 'L', p: [b.x, b.y] });
      continue;
    }
    const k0 = Math.floor(a.to) + 1;
    const k1 = Math.ceil(b.from + (i === A - 1 ? n : 0)) - 1;
    const list = fitRun(src, k0, k1, [a.x, a.y], a.tout, [b.x, b.y], b.tin, fitTol, noisy);
    for (const r of list) segments.push(toSegment(r));
  }
  const start = [anchors[0].x, anchors[0].y];
  closeLoop(start, segments);
  const clean = cleanup(start, segments, tol);
  return rotateStart(clean.start, clean.segments);
}

function unrollAnchors(list, n) {
  if (!list.length) return list;
  const base = list[0].from;
  let prev = -Infinity;
  for (const a of list) {
    const span = Math.max(0, a.to - a.from);
    const from = Math.max(base + mod(a.from - base, n), prev);
    a.from = from;
    a.to = from + span;
    prev = a.to;
  }
  return list;
}

function mergeAnchors(anchors, Q, tol, noisy) {
  const { xs, ys, n } = Q;
  const list = unrollAnchors(anchors.slice(), n);
  const nextFrom = i => list[(i + 1) % list.length].from + (i + 1 >= list.length ? n : 0);
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 4 * list.length + 8) {
    changed = false;
    for (let i = 0; i < list.length && list.length > 1; i++) {
      const a = list[i];
      const b = list[(i + 1) % list.length];
      if (a.line || a === b) continue;
      if (a.corner && b.line && !b.corner) {
        const side = lineSide(b.x, b.y, b.L.dx, b.L.dy);
        const meet = meetSides(a.sideIn, side);
        if (
          meet &&
          gapFits(
            xs,
            ys,
            n,
            a.to,
            nextFrom(i),
            [
              [meet.x, meet.y],
              [b.x, b.y]
            ],
            tol
          )
        ) {
          a.x = meet.x;
          a.y = meet.y;
          a.tin = [-meet.ta[0], -meet.ta[1]];
          a.tout = [b.L.dx, b.L.dy];
          a.sideOut = side;
          a.line = true;
          list.splice((i + 1) % list.length, 1);
          changed = true;
          break;
        }
      }
      if (a.lineEnd && b.corner) {
        const side = lineSide(a.x, a.y, -a.L.dx, -a.L.dy);
        const meet = meetSides(side, b.sideOut);
        if (
          meet &&
          gapFits(
            xs,
            ys,
            n,
            a.to,
            nextFrom(i),
            [
              [a.x, a.y],
              [meet.x, meet.y]
            ],
            tol
          )
        ) {
          b.x = meet.x;
          b.y = meet.y;
          b.tin = [a.L.dx, a.L.dy];
          b.tout = meet.tb;
          b.sideIn = side;
          const idx = list.indexOf(a);
          list.splice(idx, 1);
          changed = true;
          break;
        }
      }
      if (a.lineEnd && b.line && !b.corner) {
        const d1x = a.L.dx;
        const d1y = a.L.dy;
        const d2x = b.L.dx;
        const d2y = b.L.dy;
        const cross = d1x * d2y - d1y * d2x;
        const to = nextFrom(i);
        if (Math.abs(cross) < Math.sin((noisy ? 3 : 0.5) * DEG) && d1x * d2x + d1y * d2y > 0) {
          if (
            gapFits(
              xs,
              ys,
              n,
              a.to,
              to,
              [
                [a.x, a.y],
                [b.x, b.y]
              ],
              tol
            )
          ) {
            const ia = list.indexOf(a);
            list.splice(ia, 1);
            const ib = list.indexOf(b);
            list.splice(ib, 1);
            changed = true;
            break;
          }
          continue;
        }
        const hit = intersectLines(a.x, a.y, d1x, d1y, b.x, b.y, d2x, d2y);
        if (!hit) continue;
        const ahead = (hit[0] - a.x) * d1x + (hit[1] - a.y) * d1y;
        const behind = (b.x - hit[0]) * d2x + (b.y - hit[1]) * d2y;
        if (ahead < -tol || behind < -tol) continue;
        if (!gapFits(xs, ys, n, a.to, to, [[a.x, a.y], hit, [b.x, b.y]], tol)) continue;
        const corner = {
          x: hit[0],
          y: hit[1],
          tin: [d1x, d1y],
          tout: [d2x, d2y],
          from: a.from,
          to: b.to,
          corner: true,
          line: true,
          sideIn: lineSide(hit[0], hit[1], -d1x, -d1y),
          sideOut: lineSide(hit[0], hit[1], d2x, d2y),
          L: b.L
        };
        const ia = list.indexOf(a);
        list.splice(ia, 1, corner);
        const ib = list.indexOf(b);
        list.splice(ib, 1);
        changed = true;
        break;
      }
    }
  }
  return list;
}

export function fitContours(contours, { tolerance = 0.5, cornerAngle = 140, lineTolerance } = {}) {
  const opts = { tolerance, cornerAngle, lineTolerance: lineTolerance ?? Math.min(0.06, tolerance * 0.15) };
  const out = [];
  for (const points of contours) {
    const fitted = fitContour(points, opts);
    if (fitted && fitted.segments.length) out.push(fitted);
  }
  return out;
}
