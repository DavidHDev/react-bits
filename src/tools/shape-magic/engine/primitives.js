export const PRIMITIVES = [
  {
    id: 'circle',
    name: 'Circle',
    params: [{ key: 'stretch', label: 'Stretch', min: 0.3, max: 1, step: 0.01, default: 1 }],
    glsl: `float sd_circle(vec2 p, vec4 a, vec4 b) {
  float s = a.x;
  if (s > 0.999) return length(p) - 1.0;
  vec2 ab = vec2(1.0, s);
  vec2 q = abs(p);
  float best = 1e9;
  for (int k = 0; k < 2; k++) {
    float w = k == 0 ? atan(q.y, q.x * s) : 1.570796327;
    for (int i = 0; i < 6; i++) {
      vec2 cs = vec2(cos(w), sin(w));
      vec2 u = ab * cs;
      vec2 v = ab * vec2(-cs.y, cs.x);
      w = clamp(w + dot(q - u, v) / max(dot(q - u, u) + dot(v, v), 0.05), 0.0, 1.570796327);
    }
    best = min(best, length(q - ab * vec2(cos(w), sin(w))));
  }
  return dot(q / ab, q / ab) > 1.0 ? best : -best;
}`
  },
  {
    id: 'box',
    name: 'Box',
    params: [
      { key: 'width', label: 'Width', min: 0.04, max: 1, step: 0.01, default: 1 },
      { key: 'height', label: 'Height', min: 0.04, max: 1, step: 0.01, default: 1 },
      { key: 'roundness', label: 'Roundness', min: 0, max: 1, step: 0.01, default: 0.3 }
    ],
    glsl: `float sd_box(vec2 p, vec4 a, vec4 b) {
  vec2 h = vec2(a.x, a.y);
  float r = a.z * min(h.x, h.y);
  vec2 q = abs(p) - h + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}`
  },
  {
    id: 'polygon',
    name: 'Polygon',
    params: [
      { key: 'sides', label: 'Sides', min: 3, max: 12, step: 1, default: 6 },
      { key: 'roundness', label: 'Roundness', min: 0, max: 1, step: 0.01, default: 0.15 }
    ],
    glsl: `float sd_polygon(vec2 p, vec4 a, vec4 b) {
  float n = floor(a.x + 0.5);
  float rr = a.y * 0.45;
  float r = 1.0 - rr;
  float an = PI / n;
  vec2 acs = vec2(cos(an), sin(an));
  float bn = mod(atan(p.x, -p.y), 2.0 * an) - an;
  p = length(p) * vec2(cos(bn), abs(sin(bn)));
  p -= r * acs;
  p.y += clamp(-p.y, 0.0, r * acs.y);
  return length(p) * sign(p.x) - rr;
}`
  },
  {
    id: 'star',
    name: 'Star',
    params: [
      { key: 'points', label: 'Points', min: 3, max: 16, step: 1, default: 5 },
      { key: 'inner', label: 'Inner radius', min: 0.15, max: 0.95, step: 0.01, default: 0.48 },
      { key: 'roundness', label: 'Roundness', min: 0, max: 1, step: 0.01, default: 0.1 }
    ],
    glsl: `float sd_star(vec2 p, vec4 a, vec4 b) {
  float n = floor(a.x + 0.5);
  float rr = a.z * 0.25;
  float r = 1.0 - rr;
  float an = PI / n;
  float en = atan(sin(an), cos(an) - min(pow(clamp(a.y, 0.0, 1.0), 1.42), cos(an)));
  vec2 acs = vec2(cos(an), sin(an));
  vec2 ecs = vec2(cos(en), sin(en));
  float bn = mod(atan(p.x, -p.y), 2.0 * an) - an;
  p = length(p) * vec2(cos(bn), abs(sin(bn)));
  p -= r * acs;
  p += ecs * clamp(-dot(p, ecs), 0.0, r * acs.y / ecs.y);
  return length(p) * sign(p.x) - rr;
}`
  },
  {
    id: 'ring',
    name: 'Ring',
    params: [{ key: 'thickness', label: 'Thickness', min: 0.05, max: 0.95, step: 0.01, default: 0.36 }],
    glsl: `float sd_ring(vec2 p, vec4 a, vec4 b) {
  float t = a.x;
  return abs(length(p) - (1.0 - t * 0.5)) - t * 0.5;
}`
  },
  {
    id: 'blob',
    name: 'Blob',
    params: [
      { key: 'lobes', label: 'Lobes', min: 2, max: 9, step: 1, default: 3 },
      { key: 'wobble', label: 'Wobble', min: 0, max: 0.6, step: 0.01, default: 0.22 },
      { key: 'variation', label: 'Variation', min: 0, max: 100, step: 1, default: 0 }
    ],
    glsl: `vec3 blob_radius(float t, float n, float w, vec3 ph) {
  vec3 f = vec3(n, n + 1.0, 2.0 * n - 1.0);
  vec3 s = sin(f * t + ph);
  vec3 k = vec3(0.55, 0.3, 0.15) * w * 0.5;
  return vec3(1.0 - w * 0.55 + dot(k, s), dot(k * f, cos(f * t + ph)), -dot(k * f * f, s));
}

float sd_blob(vec2 p, vec4 a, vec4 b) {
  float n = floor(a.x + 0.5);
  float w = a.y;
  float s = a.z;
  vec3 ph = vec3(fract(sin(s * 12.9898 + 1.3) * 43758.5453), fract(sin(s * 78.233 + 4.1) * 43758.5453), fract(sin(s * 37.719 + 2.7) * 43758.5453)) * TAU;
  float t0 = atan(p.y, p.x);
  float lp = length(p);
  float r0 = blob_radius(t0, n, w, ph).x;
  float dr = abs(lp - r0);
  float win = lp > dr ? asin(dr / lp) : PI;
  int count = 21 + 3 * int(n);
  float mid = 0.5 * float(count - 1);
  float step = win / mid;
  vec2 best = vec2(dr * dr, t0);
  vec2 next = vec2(1e9, t0);
  for (int i = 0; i < count; i++) {
    float t = t0 + step * (float(i) - mid);
    vec2 e = p - blob_radius(t, n, w, ph).x * vec2(cos(t), sin(t));
    float dd = dot(e, e);
    bool far = abs(t - best.y) > 2.5 * step;
    if (dd < best.x) {
      if (far) next = best;
      best = vec2(dd, t);
    } else if (dd < next.x && far) {
      next = vec2(dd, t);
    }
  }
  float d2 = best.x;
  for (int k = 0; k < 2; k++) {
    if (k == 1 && next.x > 1e8) break;
    float t = k == 0 ? best.y : next.y;
    for (int j = 0; j < 5; j++) {
      vec3 r = blob_radius(t, n, w, ph);
      vec2 u = vec2(cos(t), sin(t));
      vec2 v = vec2(-u.y, u.x);
      vec2 dq = p - r.x * u;
      d2 = min(d2, dot(dq, dq));
      vec2 c1 = r.y * u + r.x * v;
      vec2 c2 = (r.z - r.x) * u + 2.0 * r.y * v;
      float g2 = max(dot(c1, c1) - dot(dq, c2), 0.25 * dot(c1, c1));
      t += clamp(dot(dq, c1) / g2, -step, step);
    }
  }
  float d = sqrt(d2);
  return lp > r0 ? d : -d;
}`
  },
  {
    id: 'triangle',
    name: 'Triangle',
    params: [
      { key: 'width', label: 'Width', min: 0.2, max: 1, step: 0.01, default: 0.58 },
      { key: 'roundness', label: 'Roundness', min: 0, max: 1, step: 0.01, default: 0.12 }
    ],
    glsl: `float triangle_iso(vec2 p, vec2 q) {
  p.x = abs(p.x);
  vec2 a = p - q * clamp(dot(p, q) / dot(q, q), 0.0, 1.0);
  vec2 b = p - q * vec2(clamp(p.x / q.x, 0.0, 1.0), 1.0);
  float s = -sign(q.y);
  vec2 d = min(vec2(dot(a, a), s * (p.x * q.y - p.y * q.x)), vec2(dot(b, b), s * (p.y - q.y)));
  return -sqrt(d.x) * sign(d.y);
}

float sd_triangle(vec2 p, vec4 a, vec4 b) {
  float k = clamp(a.x, 0.2, 1.0);
  float h = k <= 0.5 ? 2.0 : 1.0 / k;
  float w = h * k;
  float rin = w * h / (w + sqrt(w * w + h * h));
  float rr = clamp(a.y, 0.0, 1.0) * rin * 0.8;
  float s = (rin - rr) / rin;
  float cy = 0.5 * h - rin;
  vec2 apex = vec2(0.0, cy - s * (cy + 0.5 * h));
  return triangle_iso(p - apex, vec2(w, h) * s) - rr;
}`
  },
  {
    id: 'diamond',
    name: 'Diamond',
    params: [
      { key: 'width', label: 'Width', min: 0.2, max: 1, step: 0.01, default: 0.72 },
      { key: 'height', label: 'Height', min: 0.2, max: 1, step: 0.01, default: 1 },
      { key: 'roundness', label: 'Roundness', min: 0, max: 1, step: 0.01, default: 0.1 }
    ],
    glsl: `float sd_diamond(vec2 p, vec4 a, vec4 b) {
  vec2 r = vec2(a.x, a.y);
  float rr = clamp(a.z, 0.0, 1.0) * 0.6 * r.x * r.y / length(r);
  vec2 c = r - rr;
  vec2 q = abs(p);
  float h = clamp(((c.x - 2.0 * q.x) * c.x - (c.y - 2.0 * q.y) * c.y) / dot(c, c), -1.0, 1.0);
  float d = length(q - 0.5 * c * vec2(1.0 - h, 1.0 + h));
  return d * sign(q.x * c.y + q.y * c.x - c.x * c.y) - rr;
}`
  },
  {
    id: 'heart',
    name: 'Heart',
    params: [
      { key: 'width', label: 'Width', min: 0, max: 1, step: 0.01, default: 0.5 },
      { key: 'roundness', label: 'Roundness', min: 0, max: 1, step: 0.01, default: 0.15 }
    ],
    glsl: `float sd_heart(vec2 p, vec4 a, vec4 b) {
  float th = mix(0.6, 0.9708, clamp(a.x, 0.0, 1.0));
  float sn = sin(th);
  float cs = cos(th);
  float wd = 0.5 * (sn + sn / cs);
  float ht = (1.0 + cs * cs + sn) / (2.0 * cs);
  float rr = clamp(a.y, 0.0, 1.0) * 0.3;
  float l = min((1.0 - rr) / wd, (2.0 - 2.0 * rr) / ht);
  vec2 q = vec2(abs(p.x), 0.5 * ht * l - p.y);
  vec2 u = vec2(sn, cs);
  vec2 t = l * u;
  float r = 0.5 * l * sn / cs;
  if (dot(q - t, u) > 0.0) return length(q - t - r * vec2(-cs, sn)) - r - rr;
  float ds = length(q - u * clamp(dot(q, u), 0.0, l));
  float dn = length(q - vec2(0.0, l / cs));
  return min(ds, dn) * sign(q.x * cs - q.y * sn) - rr;
}`
  },
  {
    id: 'egg',
    name: 'Egg',
    params: [{ key: 'taper', label: 'Taper', min: 0, max: 1, step: 0.01, default: 0.5 }],
    glsl: `float sd_egg(vec2 p, vec4 a, vec4 b) {
  float f = 1.0 - 0.85 * clamp(a.x, 0.0, 1.0);
  float ra = min(1.0, 2.0 / (1.0 + 1.7320508 * (1.0 - f) + f));
  float rb = ra * f;
  float r = ra - rb;
  float top = 1.7320508 * r + rb;
  vec2 q = vec2(abs(p.x), 0.5 * (top - ra) - p.y);
  float d;
  if (q.y < 0.0) d = length(q) - r;
  else if (1.7320508 * (q.x + r) < q.y) d = length(q - vec2(0.0, 1.7320508 * r));
  else d = length(q + vec2(r, 0.0)) - 2.0 * r;
  return d - rb;
}`
  },
  {
    id: 'drop',
    name: 'Drop',
    params: [
      { key: 'length', label: 'Length', min: 0, max: 1, step: 0.01, default: 0.35 },
      { key: 'roundness', label: 'Roundness', min: 0, max: 1, step: 0.01, default: 0.1 }
    ],
    glsl: `float sd_drop(vec2 p, vec4 a, vec4 b) {
  float len = mix(1.1, 2.4, clamp(a.x, 0.0, 1.0));
  float tip = clamp(a.y, 0.0, 1.0) * 0.45;
  float r1 = min(1.0, 2.0 / (1.0 + len + tip));
  float r2 = r1 * tip;
  float h = r1 * len;
  vec2 q = vec2(abs(p.x), 0.5 * (h + r2 - r1) - p.y);
  float sb = (r1 - r2) / h;
  float ca = sqrt(1.0 - sb * sb);
  float k = dot(q, vec2(-sb, ca));
  if (k < 0.0) return length(q) - r1;
  if (k > ca * h) return length(q - vec2(0.0, h)) - r2;
  return dot(q, vec2(ca, sb)) - r1;
}`
  },
  {
    id: 'leaf',
    name: 'Leaf',
    params: [
      { key: 'width', label: 'Width', min: 0.15, max: 1, step: 0.01, default: 0.55 },
      { key: 'roundness', label: 'Roundness', min: 0, max: 1, step: 0.01, default: 0 }
    ],
    glsl: `float sd_leaf(vec2 p, vec4 a, vec4 b) {
  float k = clamp(a.x, 0.15, 1.0);
  float rr = clamp(a.y, 0.0, 1.0) * k * 0.6;
  float hb = 1.0 - rr;
  float kw = k - rr;
  float r = 0.5 * (kw + hb * hb / kw);
  float off = 0.5 * (hb * hb / kw - kw);
  vec2 q = abs(p);
  float d = (q.y - hb) * off > q.x * hb ? length(q - vec2(0.0, hb)) : length(q + vec2(off, 0.0)) - r;
  return d - rr;
}`
  },
  {
    id: 'moon',
    name: 'Moon',
    params: [
      { key: 'phase', label: 'Phase', min: 0, max: 1, step: 0.01, default: 0.45 },
      { key: 'roundness', label: 'Roundness', min: 0, max: 1, step: 0.01, default: 0.2 }
    ],
    glsl: `float sd_moon(vec2 p, vec4 a, vec4 b) {
  float dd = mix(0.25, 1.5, clamp(a.x, 0.0, 1.0));
  float rr = clamp(a.y, 0.0, 1.0) * 0.12;
  float ra = 1.0 - rr;
  float rb = 1.0 + rr;
  vec2 q = vec2(p.x + 0.5 * (0.5 * dd - 1.0), abs(p.y));
  float ca = (ra * ra - rb * rb + dd * dd) / (2.0 * dd);
  float cb = sqrt(max(ra * ra - ca * ca, 0.0));
  if (dd * (q.x * cb - q.y * ca) > dd * dd * max(cb - q.y, 0.0)) return length(q - vec2(ca, cb)) - rr;
  return max(length(q) - ra, rb - length(q - vec2(dd, 0.0))) - rr;
}`
  },
  {
    id: 'pie',
    name: 'Pie',
    params: [
      { key: 'sweep', label: 'Sweep', min: 10, max: 360, step: 1, default: 280 },
      { key: 'roundness', label: 'Roundness', min: 0, max: 1, step: 0.01, default: 0.15 }
    ],
    glsl: `float sd_pie(vec2 p, vec4 a, vec4 b) {
  float al = radians(clamp(a.x, 10.0, 360.0)) * 0.5;
  if (al > PI - 0.001) return length(p) - 1.0;
  float rr = clamp(a.y, 0.0, 1.0) * 0.2;
  float r = 1.0 - rr;
  vec2 q = vec2(abs(p.y), -p.x);
  vec2 c = vec2(sin(al), cos(al));
  float l = length(q) - r;
  float m = length(q - c * clamp(dot(q, c), 0.0, r));
  return max(l, m * sign(c.y * q.x - c.x * q.y)) - rr;
}`
  },
  {
    id: 'arc',
    name: 'Arc',
    params: [
      { key: 'sweep', label: 'Sweep', min: 10, max: 360, step: 1, default: 270 },
      { key: 'thickness', label: 'Thickness', min: 0.05, max: 0.9, step: 0.01, default: 0.32 },
      { key: 'roundness', label: 'Roundness', min: 0, max: 1, step: 0.01, default: 1 }
    ],
    glsl: `float sd_arc(vec2 p, vec4 a, vec4 b) {
  float al = radians(clamp(a.x, 10.0, 360.0)) * 0.5;
  float th = clamp(a.y, 0.05, 0.9);
  float r = 1.0 - 0.5 * th;
  vec2 q = vec2(abs(p.x), -p.y);
  if (al > PI - 0.001) return abs(length(q) - r) - 0.5 * th;
  float rr = clamp(a.z, 0.0, 1.0) * 0.5 * th;
  float an = max(al - rr / r, 0.0);
  float tt = th - 2.0 * rr;
  vec2 n = vec2(cos(an), sin(an));
  q = mat2(n.x, n.y, -n.y, n.x) * q;
  float cap = length(vec2(q.x, max(0.0, abs(r - q.y) - 0.5 * tt))) * sign(q.x);
  return max(abs(length(q) - r) - 0.5 * tt, cap) - rr;
}`
  },
  {
    id: 'cross',
    name: 'Cross',
    params: [
      { key: 'thickness', label: 'Thickness', min: 0.1, max: 1, step: 0.01, default: 0.6 },
      { key: 'roundness', label: 'Roundness', min: 0, max: 1, step: 0.01, default: 0.3 },
      { key: 'inner', label: 'Inner roundness', min: 0, max: 1, step: 0.01, default: 0.3 }
    ],
    glsl: `float sd_cross(vec2 p, vec4 a, vec4 b) {
  float w = 0.5 * clamp(a.x, 0.1, 1.0);
  float ro = clamp(a.y, 0.0, 1.0) * w;
  float ri = min(clamp(a.z, 0.0, 1.0) * w, 1.0 - w - ro);
  vec2 q = abs(p);
  if (q.y > q.x) q = q.yx;
  if (q.x < w + ri) return ri - length(q - vec2(w + ri));
  vec2 e = q - vec2(1.0, w) + ro;
  return length(max(e, 0.0)) + min(max(e.x, e.y), 0.0) - ro;
}`
  },
  {
    id: 'squircle',
    name: 'Squircle',
    params: [{ key: 'roundness', label: 'Roundness', min: 0, max: 1, step: 0.01, default: 0.5 }],
    glsl: `float squircle_x(float y, float n) {
  return pow(max(1.0 - pow(y, n), 0.0), 1.0 / n);
}

float squircle_solve(vec2 q, float n, float y, float yd) {
  for (int i = 0; i < 5; i++) {
    float yy = max(y, 1e-4);
    float x = squircle_x(yy, n);
    float r = yy / x;
    float x1 = -pow(r, n - 1.0);
    float x2 = -(n - 1.0) * pow(r, n - 2.0) / pow(x, n + 1.0);
    float g1 = -(q.x - x) * x1 - (q.y - yy);
    float g2 = x1 * x1 - (q.x - x) * x2 + 1.0;
    y = clamp(yy - g1 / max(g2, 0.25), 0.0, yd);
  }
  return y;
}

float sd_squircle(vec2 p, vec4 a, vec4 b) {
  float k = 1.0 - clamp(a.x, 0.0, 1.0);
  float n = 2.0 + 10.0 * k * k;
  vec2 q = abs(p);
  if (q.y > q.x) q = q.yx;
  float yd = pow(0.5, 1.0 / n);
  float s = pow(pow(q.x, n) + pow(q.y, n), 1.0 / n);
  float y1 = squircle_solve(q, n, clamp(q.y / max(s, 1e-4), 0.0, yd), yd);
  float y2 = squircle_solve(q, n, clamp(q.y, 0.0, yd), yd);
  float d1 = length(q - vec2(squircle_x(y1, n), y1));
  float d2 = length(q - vec2(squircle_x(y2, n), y2));
  return min(d1, d2) * sign(s - 1.0);
}`
  },
  {
    id: 'flower',
    name: 'Flower',
    params: [
      { key: 'petals', label: 'Petals', min: 3, max: 12, step: 1, default: 5 },
      { key: 'depth', label: 'Petal depth', min: 0, max: 1, step: 0.01, default: 0.7 },
      { key: 'roundness', label: 'Roundness', min: 0, max: 1, step: 0.01, default: 0.15 }
    ],
    glsl: `float sd_flower(vec2 p, vec4 a, vec4 b) {
  float n = floor(a.x + 0.5);
  float an = PI / n;
  float sn = sin(an);
  float cs = cos(an);
  float c = (0.985 - 0.885 * pow(1.0 - clamp(a.y, 0.0, 1.0), 2.5)) / (1.0 + sn);
  float rp = 1.0 - c;
  float rho = clamp(a.z, 0.0, 1.0) * 0.6 * rp;
  float bn = mod(atan(p.x, -p.y) + an, 2.0 * an) - an;
  vec2 q = length(p) * vec2(cos(bn), abs(sin(bn)));
  float rf = rp + rho;
  vec2 f = (c * cs + sqrt(rf * rf - c * c * sn * sn)) * vec2(cs, sn);
  vec2 dq = q - vec2(c, 0.0);
  vec2 df = f - vec2(c, 0.0);
  if (df.x * dq.y - df.y * dq.x < 0.0) return length(dq) - rp;
  return rho - length(q - f);
}`
  },
  {
    id: 'sun',
    name: 'Sun',
    params: [
      { key: 'rays', label: 'Rays', min: 3, max: 24, step: 1, default: 8 },
      { key: 'core', label: 'Core size', min: 0.1, max: 0.7, step: 0.01, default: 0.42 },
      { key: 'width', label: 'Ray width', min: 0, max: 1, step: 0.01, default: 0.5 },
      { key: 'gap', label: 'Gap', min: 0, max: 1, step: 0.01, default: 0.4 }
    ],
    glsl: `float sd_sun(vec2 p, vec4 a, vec4 b) {
  float n = floor(a.x + 0.5);
  float an = PI / n;
  float core = clamp(a.y, 0.1, 0.7);
  float rs = core + clamp(a.w, 0.0, 1.0) * 0.25;
  float w = min(mix(0.015, min(0.9 * an * rs, 0.16), clamp(a.z, 0.0, 1.0)), 0.5 * (1.0 - rs));
  float r1 = rs + w;
  float r2 = max(1.0 - w, r1);
  float bn = mod(atan(p.x, -p.y) + an, 2.0 * an) - an;
  vec2 q = length(p) * vec2(cos(bn), abs(sin(bn)));
  float ray = length(vec2(q.x - clamp(q.x, r1, r2), q.y)) - w;
  return min(length(p) - core, ray);
}`
  },
  {
    id: 'gear',
    name: 'Gear',
    params: [
      { key: 'teeth', label: 'Teeth', min: 5, max: 18, step: 1, default: 8 },
      { key: 'depth', label: 'Tooth depth', min: 0, max: 1, step: 0.01, default: 0.5 },
      { key: 'hole', label: 'Hole', min: 0, max: 1, step: 0.01, default: 0.5 },
      { key: 'roundness', label: 'Roundness', min: 0, max: 1, step: 0.01, default: 0.3 }
    ],
    glsl: `float gear_seg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
}

float sd_gear(vec2 p, vec4 a, vec4 b) {
  float n = floor(a.x + 0.5);
  float an = PI / n;
  float depth = mix(0.1, 0.32, clamp(a.y, 0.0, 1.0));
  float r0 = 1.0 - depth;
  float a0 = an * 0.58;
  float h1 = 0.68 * r0 * sin(a0);
  float rr = clamp(a.w, 0.0, 1.0) * 0.5 * min(h1, depth);
  float rh = clamp(a.z, 0.0, 1.0) * 0.55;
  vec2 f0 = r0 * vec2(cos(a0), sin(a0));
  vec2 f1 = vec2(sqrt(1.0 - h1 * h1), h1);
  vec2 tf = normalize(f1 - f0);
  vec2 nf = vec2(-tf.y, tf.x);
  float cf = dot(f0, nf) - rr;
  float o1 = 1.0 - rr;
  float o0 = r0 - rr;
  vec2 g0 = cf * nf + sqrt(o0 * o0 - cf * cf) * tf;
  vec2 g1 = cf * nf + sqrt(o1 * o1 - cf * cf) * tf;
  float bn = mod(atan(p.x, -p.y) + an, 2.0 * an) - an;
  float len = length(p);
  vec2 q = len * vec2(cos(bn), abs(sin(bn)));
  float ang = atan(q.y, q.x);
  float dt = ang <= atan(g1.y, g1.x) ? abs(len - o1) : length(q - g1);
  float dr = ang >= atan(g0.y, g0.x) ? abs(len - o0) : length(q - g0);
  float dist = min(min(dt, dr), gear_seg(q, g0, g1));
  bool inside = len < o0 || (len < o1 && dot(q, nf) < cf);
  float d = inside ? -dist : dist;
  if (rh > 0.001) d = max(d, rh + rr - len);
  return d - rr;
}`
  },
  {
    id: 'shield',
    name: 'Shield',
    params: [
      { key: 'width', label: 'Width', min: 0.5, max: 1, step: 0.01, default: 0.82 },
      { key: 'point', label: 'Point', min: 0, max: 1, step: 0.01, default: 0.5 },
      { key: 'roundness', label: 'Roundness', min: 0, max: 1, step: 0.01, default: 0.3 }
    ],
    glsl: `float sd_shield(vec2 p, vec4 a, vec4 b) {
  float w = clamp(a.x, 0.5, 1.0);
  float ys = mix(1.0 - w, -0.55, clamp(a.y, 0.0, 1.0));
  float big = (w * w + (1.0 - ys) * (1.0 - ys)) / (2.0 * w);
  float rr = clamp(a.z, 0.0, 1.0) * 0.25 * w;
  float wi = w - rr;
  float top = -1.0 + rr;
  float ri = big - rr;
  vec2 c = vec2(w - big, ys);
  vec2 q = vec2(abs(p.x), p.y);
  vec2 v = q - c;
  vec2 td = vec2(-c.x, sqrt(max(ri * ri - c.x * c.x, 0.0)));
  float dTop = length(q - vec2(clamp(q.x, 0.0, wi), top));
  float dSide = length(q - vec2(wi, clamp(q.y, top, ys)));
  bool onArc = v.y >= 0.0 && v.x * td.y - v.y * td.x >= 0.0;
  float dArc = onArc ? abs(length(v) - ri) : min(length(q - vec2(wi, ys)), length(q - vec2(0.0, ys + td.y)));
  bool inside = q.y <= ys ? q.y >= top && q.x <= wi : length(v) < ri;
  float dist = min(min(dTop, dSide), dArc);
  return (inside ? -dist : dist) - rr;
}`
  },
  {
    id: 'arrow',
    name: 'Arrow',
    params: [
      { key: 'head', label: 'Head size', min: 0, max: 1, step: 0.01, default: 0.5 },
      { key: 'shaft', label: 'Shaft width', min: 0, max: 1, step: 0.01, default: 0.4 },
      { key: 'roundness', label: 'Roundness', min: 0, max: 1, step: 0.01, default: 0.2 }
    ],
    glsl: `float arrow_seg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
}

float sd_arrow(vec2 p, vec4 a, vec4 b) {
  float hs = clamp(a.x, 0.0, 1.0);
  float hl = mix(0.6, 1.3, hs);
  float hw = mix(0.6, 1.0, hs);
  float sw = mix(0.1, 0.7, clamp(a.y, 0.0, 1.0)) * hw;
  float rr = clamp(a.z, 0.0, 1.0) * 0.5 * min(sw, 0.25);
  vec2 q = vec2(abs(p.x), p.y);
  float m = length(vec2(hl, hw));
  vec2 n1 = vec2(hl, -hw) / m;
  float c1 = hw / m - rr;
  float yb = -1.0 + hl - rr;
  float sx = sw - rr;
  float ye = 1.0 - rr;
  vec2 v0 = vec2(0.0, -c1 * m / hw);
  vec2 v1 = vec2((c1 * m + yb * hw) / hl, yb);
  vec2 v2 = vec2(sx, yb);
  vec2 v3 = vec2(sx, ye);
  vec2 v4 = vec2(0.0, ye);
  float dist = min(min(arrow_seg(q, v0, v1), arrow_seg(q, v1, v2)), min(arrow_seg(q, v2, v3), arrow_seg(q, v3, v4)));
  bool inside = (dot(q, n1) < c1 && q.y < yb) || (q.x < sx && q.y >= yb && q.y < ye);
  return (inside ? -dist : dist) - rr;
}`
  },
  {
    id: 'chevron',
    name: 'Chevron',
    params: [
      { key: 'angle', label: 'Angle', min: 40, max: 150, step: 1, default: 90 },
      { key: 'thickness', label: 'Thickness', min: 0.05, max: 0.8, step: 0.01, default: 0.36 },
      { key: 'roundness', label: 'Roundness', min: 0, max: 1, step: 0.01, default: 0.2 }
    ],
    glsl: `float chevron_seg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
}

float sd_chevron(vec2 p, vec4 a, vec4 b) {
  float be = radians(clamp(a.x, 40.0, 150.0)) * 0.5;
  float sb = sin(be);
  float cb = cos(be);
  float h = min(1.9, cb / sb);
  float t = min(clamp(a.y, 0.05, 0.8), 0.85 * h * sb);
  float rr = clamp(a.z, 0.0, 1.0) * 0.5 * t;
  vec2 n = vec2(cb, -sb);
  float ko = 0.5 * h * sb - rr;
  float ki = 0.5 * h * sb - t + rr;
  float ye = 0.5 * h - rr;
  vec2 q = vec2(abs(p.x), p.y);
  vec2 c0 = vec2(0.0, -ko / sb);
  vec2 c1 = vec2((ko + ye * sb) / cb, ye);
  vec2 c2 = vec2((ki + ye * sb) / cb, ye);
  vec2 c3 = vec2(0.0, -ki / sb);
  float dist = min(min(chevron_seg(q, c0, c1), chevron_seg(q, c1, c2)), chevron_seg(q, c2, c3));
  float k = dot(q, n);
  bool inside = k < ko && k > ki && q.y < ye;
  return (inside ? -dist : dist) - rr;
}`
  },
  {
    id: 'wave',
    name: 'Wave',
    params: [
      { key: 'waves', label: 'Waves', min: 0.5, max: 4, step: 0.5, default: 1.5 },
      { key: 'amplitude', label: 'Amplitude', min: 0, max: 1, step: 0.01, default: 0.7 },
      { key: 'thickness', label: 'Thickness', min: 0.04, max: 0.6, step: 0.01, default: 0.22 }
    ],
    glsl: `float sd_wave(vec2 p, vec4 a, vec4 b) {
  float th = clamp(a.z, 0.04, 0.6);
  float xe = 1.0 - 0.5 * th;
  float m = floor(2.0 * clamp(a.x, 0.5, 4.0) + 0.5);
  float len = 2.0 * xe / m;
  float amp = max(clamp(a.y, 0.0, 1.0) * 0.5 * len, 1e-4);
  float r = (0.25 * len * len + amp * amp) / (2.0 * amp);
  float i0 = clamp(floor((p.x + xe) / len), 0.0, m - 1.0);
  float best = 1e9;
  for (int j = -1; j <= 1; j++) {
    float i = clamp(i0 + float(j), 0.0, m - 1.0);
    float h = amp + (mod(i, 2.0) < 0.5 ? p.y : -p.y);
    float x = abs(p.x + xe - (i + 0.5) * len);
    float d = (r - amp) * x > 0.5 * len * (r - h) ? length(vec2(x - 0.5 * len, amp - h)) : abs(x * x + h * h - 2.0 * r * h) / (length(vec2(x, r - h)) + r);
    best = min(best, d);
  }
  return best - 0.5 * th;
}`
  },
  {
    id: 'spiral',
    name: 'Spiral',
    params: [
      { key: 'turns', label: 'Turns', min: 0.5, max: 6, step: 0.25, default: 2.5 },
      { key: 'thickness', label: 'Thickness', min: 0.1, max: 0.9, step: 0.01, default: 0.45 }
    ],
    glsl: `float sd_spiral(vec2 p, vec4 a, vec4 b) {
  float k = clamp(a.y, 0.1, 0.9);
  float th1 = PI + TAU * clamp(a.x, 0.5, 6.0);
  float rad = 1.0 / (1.0 + k * PI / th1);
  float sc = rad / th1;
  vec2 q = vec2(-p.x, p.y);
  float ph = atan(q.y, q.x);
  float k0 = clamp(floor((length(q) / sc - ph) / TAU + 0.5), ceil((PI - ph) / TAU), floor((th1 - ph) / TAU));
  float best = 1e9;
  for (int i = -1; i <= 1; i++) {
    float th = clamp(ph + TAU * (k0 + float(i)), PI, th1);
    for (int j = 0; j < 4; j++) {
      float cs = cos(th);
      float sn = sin(th);
      vec2 dq = q - sc * th * vec2(cs, sn);
      vec2 c1 = sc * vec2(cs - th * sn, sn + th * cs);
      vec2 c2 = sc * vec2(-2.0 * sn - th * cs, 2.0 * cs - th * sn);
      float g2 = max(dot(c1, c1) - dot(dq, c2), 0.25 * dot(c1, c1));
      th = clamp(th + clamp(dot(dq, c1) / g2, -0.6, 0.6), PI, th1);
    }
    best = min(best, length(q - sc * th * vec2(cos(th), sin(th))));
  }
  return best - k * PI * sc;
}`
  }
];

export const PRIMITIVE_INDEX = Object.fromEntries(PRIMITIVES.map((primitive, index) => [primitive.id, index]));

export const PRIMITIVES_BY_ID = Object.fromEntries(PRIMITIVES.map(primitive => [primitive.id, primitive]));

export const defaultShapeParams = id =>
  Object.fromEntries((PRIMITIVES_BY_ID[id]?.params || []).map(param => [param.key, param.default]));

export const primitiveSlots = (id, params = {}) => {
  const values = (PRIMITIVES_BY_ID[id]?.params || []).map(param => params[param.key] ?? param.default);
  while (values.length < 8) values.push(0);
  return [values.slice(0, 4), values.slice(4, 8)];
};
