import { hexToRgb } from '../engine/assets';

const DETAIL = `
uniform vec2 uCell;
uniform vec2 uImage;
uniform float uLod;

void main() {
  vec2 center = (floor(gl_FragCoord.xy) + 0.5) * uCell;
  float l[36];
  vec3 sum = vec3(0.0);
  vec3 squares = vec3(0.0);
  for (int y = 0; y < 6; y++) {
    for (int x = 0; x < 6; x++) {
      vec2 p = center + (vec2(float(x), float(y)) - 2.5) * 0.25 * uCell;
      vec3 c = textureLod(uInput, clamp(p / uImage, 0.0, 1.0), uLod).rgb;
      l[y * 6 + x] = dot(c, vec3(0.3, 0.55, 0.15));
      if (x > 0 && x < 5 && y > 0 && y < 5) {
        sum += c;
        squares += c * c;
      }
    }
  }
  vec3 mean = sum / 16.0;
  vec3 variance = max(squares / 16.0 - mean * mean, 0.0);
  float spread = sqrt(variance.r + variance.g + variance.b);
  vec2 offset = vec2(0.0);
  float total = 0.0;
  float peak = 0.0;
  for (int y = 1; y < 5; y++) {
    for (int x = 1; x < 5; x++) {
      float gx = l[y * 6 + x + 1] - l[y * 6 + x - 1];
      float gy = l[(y + 1) * 6 + x] - l[(y - 1) * 6 + x];
      float g = gx * gx + gy * gy;
      float w = g * g + 1e-12;
      offset += (vec2(float(x), float(y)) - 2.5) * 0.25 * w;
      total += w;
      peak = max(peak, g);
    }
  }
  offset /= total;
  outColor = vec4(clamp(spread * 2.2, 0.0, 1.0), clamp(sqrt(sqrt(peak)) * 2.0, 0.0, 1.0), offset + 0.5);
}`;

const GEOMETRY = `
uniform sampler2D uTris;
uniform float uTriRow;
uniform vec4 uBounds;

int texelOf(int t, int k) {
  return t * 5 + k;
}

vec4 fetchTri(int t, int k) {
  int index = texelOf(t, k);
  int row = int(uTriRow);
  return texelFetch(uTris, ivec2(index % row, index / row), 0);
}

vec2 unpack(vec4 v) {
  vec4 b = floor(v * 255.0 + 0.5);
  return vec2(b.r * 256.0 + b.g, b.b * 256.0 + b.a);
}

vec2 vertexOf(int t, int k) {
  return unpack(fetchTri(t, k)) / 65535.0 * uBounds.zw + uBounds.xy;
}

int neighborOf(int t, int k) {
  vec2 pair = unpack(fetchTri(t, 3 + k / 2));
  float n = k == 1 ? pair.y : pair.x;
  return n > 65534.5 ? -1 : int(n);
}

float edgeFn(vec2 a, vec2 b, vec2 p) {
  vec2 ab = b - a;
  vec2 ap = p - a;
  return ab.x * ap.y - ab.y * ap.x;
}
`;

const COLORS = `
${GEOMETRY}
uniform vec2 uImage;
uniform float uCount;
uniform float uColorRow;
uniform float uRelief;
uniform float uDepth;
uniform vec3 uLight;
uniform float uSaturation;
uniform float uContrast;

vec3 photo(vec2 p, float lod) {
  return textureLod(uInput, clamp(p / uImage, 0.0, 1.0), lod).rgb;
}

void main() {
  int t = int(gl_FragCoord.x) + int(gl_FragCoord.y) * int(uColorRow);
  if (t >= int(uCount)) {
    outColor = vec4(0.0);
    return;
  }
  vec2 a = vertexOf(t, 0);
  vec2 b = vertexOf(t, 1);
  vec2 c = vertexOf(t, 2);
  vec2 m = (a + b + c) / 3.0;
  float area = abs(edgeFn(a, b, m) + edgeFn(b, c, m) + edgeFn(c, a, m)) * 0.5;
  float lod = log2(max(sqrt(area) * 0.2, 1.0));
  vec3 color = photo(m, lod) * 0.55;
  color += photo(mix(m, a, 0.5), lod) * 0.15;
  color += photo(mix(m, b, 0.5), lod) * 0.15;
  color += photo(mix(m, c, 0.5), lod) * 0.15;

  float vlod = lod + 1.0;
  float ha = luma(photo(a, vlod)) * uDepth;
  float hb = luma(photo(b, vlod)) * uDepth;
  float hc = luma(photo(c, vlod)) * uDepth;
  vec3 n = cross(vec3(b - a, hb - ha), vec3(c - a, hc - ha));
  n = normalize(n * sign(n.z + 1e-9));
  float lit = dot(n, uLight) / max(uLight.z, 1e-3);
  float shade = clamp(mix(1.0, lit, uRelief * 1.6), 0.25, 1.6);
  color *= shade;

  float l = luma(color);
  color = mix(vec3(l), color, uSaturation);
  color = (color - 0.5) * uContrast + 0.5;
  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;

const DRAW = `
${GEOMETRY}
uniform sampler2D uBins;
uniform sampler2D uColors;
uniform vec2 uBinGrid;
uniform float uBinSize;
uniform float uColorRow;
uniform float uEdges;
uniform float uEdgeWidth;
uniform vec3 uEdgeColor;

vec3 colorOf(int t) {
  int row = int(uColorRow);
  return texelFetch(uColors, ivec2(t % row, t / row), 0).rgb;
}

void main() {
  vec2 p = gl_FragCoord.xy;
  ivec2 bin = ivec2(min(floor(p / uBinSize), uBinGrid - 1.0));
  vec2 seed = unpack(texelFetch(uBins, bin, 0));
  int t = int(seed.x);
  vec2 a = vec2(0.0);
  vec2 b = vec2(0.0);
  vec2 c = vec2(0.0);
  vec3 e = vec3(0.0);
  for (int i = 0; i < 48; i++) {
    a = vertexOf(t, 0);
    b = vertexOf(t, 1);
    c = vertexOf(t, 2);
    e = vec3(edgeFn(a, b, p), edgeFn(b, c, p), edgeFn(c, a, p));
    if (min(e.x, min(e.y, e.z)) >= 0.0) break;
    int k = e.x < e.y ? (e.x < e.z ? 0 : 2) : (e.y < e.z ? 1 : 2);
    int next = neighborOf(t, k);
    if (next < 0) break;
    t = next;
  }
  vec3 d = e / vec3(length(b - a), length(c - b), length(a - c));
  vec3 own = colorOf(t);
  vec3 color = own;
  vec3 w = clamp(0.5 - d, 0.0, 0.5);
  float total = w.x + w.y + w.z;
  if (total > 0.0) {
    vec3 mixed = own * max(1.0 - total, 0.0);
    for (int k = 0; k < 3; k++) {
      if (w[k] <= 0.0) continue;
      int n = neighborOf(t, k);
      mixed += (n < 0 ? own : colorOf(n)) * w[k];
    }
    color = mixed / max(1.0, total);
  }
  float edge = min(d.x, min(d.y, d.z));
  float line = 1.0 - smoothstep(uEdgeWidth - 0.6, uEdgeWidth + 0.6, edge);
  color = mix(color, uEdgeColor, line * uEdges);
  outColor = vec4(color, 1.0);
}`;

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const TRI_ROW = 1000;
const COLOR_ROW = 256;

function hash(x, y, seed) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function triangulate(coords, n, out) {
  const ids = out.ids;
  const dists = out.dists;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < n; i += 1) {
    const x = coords[2 * i];
    const y = coords[2 * i + 1];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    ids[i] = i;
  }
  const cx0 = (minX + maxX) / 2;
  const cy0 = (minY + maxY) / 2;
  let i0 = 0;
  let best = Infinity;
  for (let i = 0; i < n; i += 1) {
    const d = (coords[2 * i] - cx0) ** 2 + (coords[2 * i + 1] - cy0) ** 2;
    if (d < best) {
      i0 = i;
      best = d;
    }
  }
  const x0 = coords[2 * i0];
  const y0 = coords[2 * i0 + 1];
  let i1 = -1;
  best = Infinity;
  for (let i = 0; i < n; i += 1) {
    if (i === i0) continue;
    const d = (coords[2 * i] - x0) ** 2 + (coords[2 * i + 1] - y0) ** 2;
    if (d < best && d > 0) {
      i1 = i;
      best = d;
    }
  }
  if (i1 < 0) return 0;
  let x1 = coords[2 * i1];
  let y1 = coords[2 * i1 + 1];
  let i2 = -1;
  best = Infinity;
  for (let i = 0; i < n; i += 1) {
    if (i === i0 || i === i1) continue;
    const r = circumradius(x0, y0, x1, y1, coords[2 * i], coords[2 * i + 1]);
    if (r < best) {
      i2 = i;
      best = r;
    }
  }
  if (i2 < 0 || best === Infinity) return 0;
  let x2 = coords[2 * i2];
  let y2 = coords[2 * i2 + 1];
  if (cross(x0, y0, x1, y1, x2, y2) < 0) {
    const i = i1;
    const x = x1;
    const y = y1;
    i1 = i2;
    x1 = x2;
    y1 = y2;
    i2 = i;
    x2 = x;
    y2 = y;
  }
  const center = circumcenter(x0, y0, x1, y1, x2, y2);
  const ccx = center[0];
  const ccy = center[1];
  for (let i = 0; i < n; i += 1) dists[i] = (coords[2 * i] - ccx) ** 2 + (coords[2 * i + 1] - ccy) ** 2;
  sortIds(ids, dists, 0, n - 1);

  const hashSize = Math.max(1, Math.ceil(Math.sqrt(n)));
  const hullPrev = out.hullPrev;
  const hullNext = out.hullNext;
  const hullTri = out.hullTri;
  const hullHash = new Int32Array(hashSize).fill(-1);
  const triangles = out.triangles;
  const halfedges = out.halfedges;
  const stack = out.stack;
  let length = 0;
  let hullStart = i0;

  const key = (x, y) => Math.floor(pseudoAngle(x - ccx, y - ccy) * hashSize) % hashSize;

  const link = (a, b) => {
    halfedges[a] = b;
    if (b !== -1) halfedges[b] = a;
  };

  const add = (a, b, c, ha, hb, hc) => {
    const t = length;
    triangles[t] = a;
    triangles[t + 1] = b;
    triangles[t + 2] = c;
    link(t, ha);
    link(t + 1, hb);
    link(t + 2, hc);
    length += 3;
    return t;
  };

  const legalize = start => {
    let top = 0;
    let a = start;
    let result = start;
    for (;;) {
      const b = halfedges[a];
      const a0 = a - (a % 3);
      result = a0 + ((a + 2) % 3);
      if (b === -1) {
        if (top === 0) break;
        a = stack[--top];
        continue;
      }
      const b0 = b - (b % 3);
      const al = a0 + ((a + 1) % 3);
      const ar = a0 + ((a + 2) % 3);
      const bl = b0 + ((b + 2) % 3);
      const br = b0 + ((b + 1) % 3);
      const p0 = triangles[ar];
      const pr = triangles[a];
      const pl = triangles[al];
      const p1 = triangles[bl];
      const illegal = inCircle(
        coords[2 * pr],
        coords[2 * pr + 1],
        coords[2 * pl],
        coords[2 * pl + 1],
        coords[2 * p0],
        coords[2 * p0 + 1],
        coords[2 * p1],
        coords[2 * p1 + 1]
      );
      if (illegal) {
        triangles[a] = p1;
        triangles[b] = p0;
        const hbl = halfedges[bl];
        const har = halfedges[ar];
        if (hbl === -1) {
          let e = hullStart;
          do {
            if (hullTri[e] === bl) {
              hullTri[e] = a;
              break;
            }
            e = hullPrev[e];
          } while (e !== hullStart);
        }
        link(a, hbl);
        link(b, har);
        link(ar, bl);
        if (top < stack.length) stack[top++] = br;
      } else {
        if (top === 0) break;
        a = stack[--top];
      }
    }
    return result;
  };

  hullNext[i0] = hullPrev[i2] = i1;
  hullNext[i1] = hullPrev[i0] = i2;
  hullNext[i2] = hullPrev[i1] = i0;
  hullTri[i0] = 0;
  hullTri[i1] = 1;
  hullTri[i2] = 2;
  hullHash[key(x0, y0)] = i0;
  hullHash[key(x1, y1)] = i1;
  hullHash[key(x2, y2)] = i2;
  add(i0, i1, i2, -1, -1, -1);

  let xp = 0;
  let yp = 0;
  for (let k = 0; k < n; k += 1) {
    const i = ids[k];
    const x = coords[2 * i];
    const y = coords[2 * i + 1];
    if (k > 0 && Math.abs(x - xp) <= 1e-9 && Math.abs(y - yp) <= 1e-9) continue;
    xp = x;
    yp = y;
    if (i === i0 || i === i1 || i === i2) continue;

    let start = 0;
    const h = key(x, y);
    for (let j = 0; j < hashSize; j += 1) {
      start = hullHash[(h + j) % hashSize];
      if (start !== -1 && start !== hullNext[start]) break;
    }
    start = hullPrev[start];
    let e = start;
    let q = hullNext[e];
    while (cross(coords[2 * e], coords[2 * e + 1], coords[2 * q], coords[2 * q + 1], x, y) >= 0) {
      e = q;
      if (e === start) {
        e = -1;
        break;
      }
      q = hullNext[e];
    }
    if (e === -1) continue;

    let t = add(e, i, hullNext[e], -1, -1, hullTri[e]);
    hullTri[i] = legalize(t + 2);
    hullTri[e] = t;

    let m = hullNext[e];
    q = hullNext[m];
    while (cross(coords[2 * m], coords[2 * m + 1], coords[2 * q], coords[2 * q + 1], x, y) < 0) {
      t = add(m, i, q, hullTri[i], -1, hullTri[m]);
      hullTri[i] = legalize(t + 2);
      hullNext[m] = m;
      m = q;
      q = hullNext[m];
    }

    if (e === start) {
      q = hullPrev[e];
      while (cross(coords[2 * q], coords[2 * q + 1], coords[2 * e], coords[2 * e + 1], x, y) < 0) {
        t = add(q, i, e, -1, hullTri[e], hullTri[q]);
        legalize(t + 2);
        hullTri[q] = t;
        hullNext[e] = e;
        e = q;
        q = hullPrev[e];
      }
    }

    hullStart = hullPrev[i] = e;
    hullNext[e] = hullPrev[m] = i;
    hullNext[i] = m;
    hullHash[key(x, y)] = i;
    hullHash[key(coords[2 * e], coords[2 * e + 1])] = e;
  }
  return length / 3;
}

function cross(ax, ay, bx, by, cx, cy) {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

function pseudoAngle(dx, dy) {
  const p = dx / (Math.abs(dx) + Math.abs(dy) || 1);
  return (dy > 0 ? 3 - p : 1 + p) / 4;
}

function inCircle(ax, ay, bx, by, cx, cy, px, py) {
  const dx = ax - px;
  const dy = ay - py;
  const ex = bx - px;
  const ey = by - py;
  const fx = cx - px;
  const fy = cy - py;
  const ap = dx * dx + dy * dy;
  const bp = ex * ex + ey * ey;
  const cp = fx * fx + fy * fy;
  return dx * (ey * cp - bp * fy) - dy * (ex * cp - bp * fx) + ap * (ex * fy - ey * fx) > 0;
}

function circumradius(ax, ay, bx, by, cx, cy) {
  const dx = bx - ax;
  const dy = by - ay;
  const ex = cx - ax;
  const ey = cy - ay;
  const bl = dx * dx + dy * dy;
  const cl = ex * ex + ey * ey;
  const d = 0.5 / (dx * ey - dy * ex);
  const x = (ey * bl - dy * cl) * d;
  const y = (dx * cl - ex * bl) * d;
  const r = x * x + y * y;
  return Number.isFinite(r) ? r : Infinity;
}

function circumcenter(ax, ay, bx, by, cx, cy) {
  const dx = bx - ax;
  const dy = by - ay;
  const ex = cx - ax;
  const ey = cy - ay;
  const bl = dx * dx + dy * dy;
  const cl = ex * ex + ey * ey;
  const d = 0.5 / (dx * ey - dy * ex);
  return [ax + (ey * bl - dy * cl) * d, ay + (dx * cl - ex * bl) * d];
}

function sortIds(ids, dists, left, right) {
  while (right - left > 16) {
    const middle = (left + right) >> 1;
    swap(ids, middle, left + 1);
    if (dists[ids[left]] > dists[ids[right]]) swap(ids, left, right);
    if (dists[ids[left + 1]] > dists[ids[right]]) swap(ids, left + 1, right);
    if (dists[ids[left]] > dists[ids[left + 1]]) swap(ids, left, left + 1);
    let i = left + 1;
    let j = right;
    const pivot = ids[left + 1];
    const value = dists[pivot];
    for (;;) {
      do i += 1;
      while (dists[ids[i]] < value);
      do j -= 1;
      while (dists[ids[j]] > value);
      if (j < i) break;
      swap(ids, i, j);
    }
    ids[left + 1] = ids[j];
    ids[j] = pivot;
    if (right - i + 1 >= j - left) {
      sortIds(ids, dists, i, right);
      right = j - 1;
    } else {
      sortIds(ids, dists, left, j - 1);
      left = i;
    }
  }
  for (let i = left + 1; i <= right; i += 1) {
    const temp = ids[i];
    const value = dists[temp];
    let j = i - 1;
    while (j >= left && dists[ids[j]] > value) {
      ids[j + 1] = ids[j];
      j -= 1;
    }
    ids[j + 1] = temp;
  }
}

function swap(array, i, j) {
  const temp = array[i];
  array[i] = array[j];
  array[j] = temp;
}

function workspace(state, points) {
  if (state.work && state.work.capacity >= points) return state.work;
  const capacity = Math.ceil(points * 1.25) + 64;
  const max = Math.max(capacity * 2 - 5, 3) * 3;
  state.work = {
    capacity,
    coords: new Float64Array(capacity * 2),
    ids: new Uint32Array(capacity),
    dists: new Float64Array(capacity),
    hullPrev: new Uint32Array(capacity),
    hullNext: new Uint32Array(capacity),
    hullTri: new Uint32Array(capacity),
    triangles: new Uint32Array(max),
    halfedges: new Int32Array(max),
    stack: new Uint32Array(1024)
  };
  return state.work;
}

function upload(ctx, state, name, width, rows, data) {
  const gl = ctx.gl;
  const current = state[name];
  if (!current || current.width !== width || current.rows < rows) {
    if (current) gl.deleteTexture(current.texture);
    const capacity = Math.max(rows, Math.ceil((current?.rows || 0) * 1.5), 1);
    state[name] = {
      width,
      rows: capacity,
      texture: ctx.engine.createTexture(width, capacity, { float: false, filter: 'nearest' })
    };
  }
  gl.bindTexture(gl.TEXTURE_2D, state[name].texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, rows, gl.RGBA, gl.UNSIGNED_BYTE, data);
  return state[name];
}

function writePair(bytes, offset, a, b) {
  bytes[offset] = a >> 8;
  bytes[offset + 1] = a & 255;
  bytes[offset + 2] = b >> 8;
  bytes[offset + 3] = b & 255;
}

function build(ctx, state, params, detail, gw, gh, key) {
  const width = ctx.width;
  const height = ctx.height;
  const cw = width / gw;
  const ch = height / gh;
  const count = gw * gh;
  const histogram = new Uint32Array(256);
  for (let i = 0; i < count; i += 1) histogram[detail[i * 4]] += 1;
  let seen = 0;
  let p80 = 255;
  for (let v = 0; v < 256; v += 1) {
    seen += histogram[v];
    if (seen >= count * 0.8) {
      p80 = v;
      break;
    }
  }
  const norm = 1 / Math.max(p80, 10);
  const amount = Math.min(Math.max(params.detail, 0), 1);
  const jitter = Math.min(Math.max(params.jitter, 0), 1);
  const snap = Math.min(Math.max(params.snap, 0), 1);
  const seed = Math.round(params.variation) * 7919 + 13;
  const previous = state.accepted && state.accepted.length === count && state.acceptKey === key ? state.accepted : null;
  const accepted = new Uint8Array(count);
  const border = Math.ceil((gw + gh) * 2) + 8;
  const work = workspace(state, count + border);
  const coords = work.coords;
  let n = 0;
  const pad = 1;
  for (let j = 0; j < gh; j += 1) {
    for (let i = 0; i < gw; i += 1) {
      const index = j * gw + i;
      const order = BAYER[(j & 3) * 4 + (i & 3)];
      const rank = order === 0 ? 0.01 : (order + 0.5 + (hash(i, j, seed + 7) - 0.5) * 1.8 * jitter) / 16;
      const level = Math.min(detail[index * 4] * norm, 1);
      const ramp = Math.min(Math.max((level - 0.1) / 0.9, 0), 1);
      const adaptive = 0.0625 + 0.9375 * ramp * ramp * (3 - 2 * ramp);
      const density = 0.25 + (adaptive - 0.25) * amount;
      const margin = previous ? (previous[index] ? 0.035 : -0.035) : 0;
      if (rank >= density + margin) continue;
      accepted[index] = 1;
      const reach = order === 0 ? 1.7 : order < 4 ? 1.2 : 0.9;
      const edgeness = Math.min(Math.max((detail[index * 4 + 1] / 255 - 0.25) * 2.5, 0), 1) * snap;
      const loose = 1 - edgeness * 0.85;
      const sx = (detail[index * 4 + 2] / 255 - 0.5) * edgeness;
      const sy = (detail[index * 4 + 3] / 255 - 0.5) * edgeness;
      const jx = sx + (hash(i, j, seed) - 0.5) * reach * jitter * loose + (hash(i, j, seed + 3) - 0.5) * 0.002;
      const jy = sy + (hash(i, j, seed + 1) - 0.5) * reach * jitter * loose + (hash(i, j, seed + 5) - 0.5) * 0.002;
      coords[2 * n] = Math.min(Math.max((i + 0.5 + jx) * cw, pad), width - pad);
      coords[2 * n + 1] = Math.min(Math.max((j + 0.5 + jy) * ch, pad), height - pad);
      n += 1;
    }
  }
  state.accepted = accepted;
  state.acceptKey = key;
  const bulge = 2;
  const edge = (t, k) => 1 + 4 * k * t * (1 - t);
  for (let i = 0; i <= gw; i += 1) {
    const t = i / gw;
    const below = accepted[Math.min(i, gw - 1)] || accepted[Math.max(i - 1, 0)];
    const above = accepted[(gh - 1) * gw + Math.min(i, gw - 1)] || accepted[(gh - 1) * gw + Math.max(i - 1, 0)];
    if (i % 4 === 0 || i === gw || below) {
      coords[2 * n] = t * width;
      coords[2 * n + 1] = -edge(t, bulge);
      n += 1;
    }
    if (i % 4 === 0 || i === gw || above) {
      coords[2 * n] = t * width;
      coords[2 * n + 1] = height + edge(t, bulge);
      n += 1;
    }
  }
  for (let j = 1; j < gh; j += 1) {
    const t = j / gh;
    const left = accepted[j * gw] || accepted[(j - 1) * gw];
    const right = accepted[j * gw + gw - 1] || accepted[(j - 1) * gw + gw - 1];
    if (j % 4 === 0 || left) {
      coords[2 * n] = -edge(t, bulge);
      coords[2 * n + 1] = t * height;
      n += 1;
    }
    if (j % 4 === 0 || right) {
      coords[2 * n] = width + edge(t, bulge);
      coords[2 * n + 1] = t * height;
      n += 1;
    }
  }
  coords[2 * n] = -1;
  coords[2 * n + 1] = -1;
  coords[2 * n + 2] = width + 1;
  coords[2 * n + 3] = -1;
  coords[2 * n + 4] = -1;
  coords[2 * n + 5] = height + 1;
  coords[2 * n + 6] = width + 1;
  coords[2 * n + 7] = height + 1;
  n += 4;

  const triangles = triangulate(coords, n, work);
  const frame = [-8, -8, width + 16, height + 16];
  const rows = Math.max(1, Math.ceil((triangles * 5) / TRI_ROW));
  const bytes = new Uint8Array(TRI_ROW * rows * 4);
  const tri = work.triangles;
  const half = work.halfedges;
  const quant = new Uint16Array(n * 2);
  for (let i = 0; i < n; i += 1) {
    quant[2 * i] = Math.round(((coords[2 * i] - frame[0]) / frame[2]) * 65535);
    quant[2 * i + 1] = Math.round(((coords[2 * i + 1] - frame[1]) / frame[3]) * 65535);
  }
  for (let t = 0; t < triangles; t += 1) {
    const base = t * 20;
    for (let k = 0; k < 3; k += 1) {
      const v = tri[3 * t + k];
      writePair(bytes, base + k * 4, quant[2 * v], quant[2 * v + 1]);
    }
    const n0 = half[3 * t] < 0 ? 65535 : Math.floor(half[3 * t] / 3);
    const n1 = half[3 * t + 1] < 0 ? 65535 : Math.floor(half[3 * t + 1] / 3);
    const n2 = half[3 * t + 2] < 0 ? 65535 : Math.floor(half[3 * t + 2] / 3);
    writePair(bytes, base + 12, n0, n1);
    writePair(bytes, base + 16, n2, 65535);
  }

  const binSize = Math.max(cw, ch) * 2;
  const bw = Math.ceil(width / binSize);
  const bh = Math.ceil(height / binSize);
  const bins = new Uint8Array(bw * bh * 4);
  const decode = (v, axis) => (quant[2 * v + axis] / 65535) * frame[2 + axis] + frame[axis];
  for (let t = 0; t < triangles; t += 1) {
    const a = tri[3 * t];
    const b = tri[3 * t + 1];
    const c = tri[3 * t + 2];
    const ax = decode(a, 0);
    const ay = decode(a, 1);
    const bx = decode(b, 0);
    const by = decode(b, 1);
    const cx = decode(c, 0);
    const cy = decode(c, 1);
    const x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx) / binSize - 1));
    const x1 = Math.min(bw - 1, Math.ceil(Math.max(ax, bx, cx) / binSize));
    const y0 = Math.max(0, Math.floor(Math.min(ay, by, cy) / binSize - 1));
    const y1 = Math.min(bh - 1, Math.ceil(Math.max(ay, by, cy) / binSize));
    for (let y = y0; y <= y1; y += 1) {
      const py = Math.min((y + 0.5) * binSize, height - 0.5);
      for (let x = x0; x <= x1; x += 1) {
        const px = Math.min((x + 0.5) * binSize, width - 0.5);
        if (cross(ax, ay, bx, by, px, py) < 0) continue;
        if (cross(bx, by, cx, cy, px, py) < 0) continue;
        if (cross(cx, cy, ax, ay, px, py) < 0) continue;
        writePair(bins, (y * bw + x) * 4, t, 0);
      }
    }
  }
  upload(ctx, state, 'trisTexture', TRI_ROW, rows, bytes);
  upload(ctx, state, 'binTexture', bw, bh, bins);
  return { triangles, frame, binSize, bins: [bw, bh] };
}

export default {
  id: 'lowpoly',
  name: 'Low poly',
  category: 'geometric',
  description: 'Facets the picture into flat-shaded triangles that get smaller where the image has detail.',
  animated: true,
  animates: params => params.shimmer > 0 && params.relief > 0,
  params: [
    { key: 'size', label: 'Facet size', type: 'number', min: 12, max: 120, step: 1, default: 48 },
    { key: 'detail', label: 'Detail', type: 'number', min: 0, max: 1, step: 0.01, default: 0.8 },
    { key: 'jitter', label: 'Jitter', type: 'number', min: 0, max: 1, step: 0.01, default: 0.85 },
    { key: 'snap', label: 'Follow edges', type: 'number', min: 0, max: 1, step: 0.01, default: 0.8 },
    { key: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 0 },
    { key: 'relief', label: 'Facet shading', type: 'number', min: 0, max: 1, step: 0.01, default: 0.35 },
    { key: 'saturation', label: 'Saturation', type: 'number', min: 0, max: 2, step: 0.01, default: 1.15 },
    { key: 'contrast', label: 'Contrast', type: 'number', min: 0.5, max: 2, step: 0.01, default: 1.12 },
    { key: 'edges', label: 'Edges', type: 'number', min: 0, max: 1, step: 0.01, default: 0.12 },
    { key: 'edgeColor', label: 'Edge color', type: 'color', default: '#000000' },
    { key: 'shimmer', label: 'Shimmer', type: 'number', min: 0, max: 1, step: 0.01, default: 0 }
  ],
  render(ctx, input, params, state) {
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const fine = Math.max(4, params.size * 0.5 * ctx.unit);
    const gw = Math.max(4, Math.round(ctx.width / fine));
    const gh = Math.max(4, Math.round(ctx.height / fine));
    const cell = [ctx.width / gw, ctx.height / gh];
    const detailTarget = ctx.pass('lowpoly-detail', DETAIL, {
      input: source,
      target: ctx.target(gw, gh, { float: false, filter: 'nearest' }),
      uniforms: { uCell: cell, uImage: [ctx.width, ctx.height], uLod: Math.max(0, Math.log2(cell[0] * 0.25)) }
    });
    const gl = ctx.gl;
    if (!state.detail || state.detail.length !== gw * gh * 4) state.detail = new Uint8Array(gw * gh * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, detailTarget.fbo);
    gl.readPixels(0, 0, gw, gh, gl.RGBA, gl.UNSIGNED_BYTE, state.detail);
    ctx.release(detailTarget);

    const key = [ctx.width, ctx.height, gw, gh, params.detail, params.jitter, params.snap, params.variation].join(':');
    let same = state.mesh && state.meshKey === key && state.previous && state.previous.length === state.detail.length;
    if (same) {
      const a = state.detail;
      const b = state.previous;
      for (let i = 0; i < a.length; i += 1) {
        if (a[i] !== b[i]) {
          same = false;
          break;
        }
      }
    }
    if (!same) {
      state.mesh = build(ctx, state, params, state.detail, gw, gh, key);
      state.meshKey = key;
      state.previous = state.detail.slice();
    }
    const mesh = state.mesh;
    const angle = 2.3 + ctx.time * params.shimmer * 1.6;
    const light = [Math.cos(angle) * 0.62, Math.sin(angle) * 0.62, 0.78];
    const lightLength = Math.hypot(...light);
    const geometry = {
      uTriRow: TRI_ROW,
      uBounds: mesh.frame,
      uColorRow: COLOR_ROW
    };
    const colors = ctx.pass('lowpoly-colors', COLORS, {
      input: source,
      target: ctx.target(COLOR_ROW, Math.max(1, Math.ceil(mesh.triangles / COLOR_ROW)), { filter: 'nearest' }),
      textures: { uTris: state.trisTexture.texture },
      uniforms: {
        ...geometry,
        uImage: [ctx.width, ctx.height],
        uCount: mesh.triangles,
        uRelief: params.relief,
        uDepth: fine * 2.2,
        uLight: light.map(v => v / lightLength),
        uSaturation: params.saturation,
        uContrast: params.contrast
      }
    });
    const output = ctx.pass('lowpoly-draw', DRAW, {
      input,
      textures: { uTris: state.trisTexture.texture, uBins: state.binTexture.texture, uColors: colors },
      uniforms: {
        ...geometry,
        uBinGrid: mesh.bins,
        uBinSize: mesh.binSize,
        uEdges: params.edges,
        uEdgeWidth: Math.max(0.35, 0.6 * ctx.unit),
        uEdgeColor: hexToRgb(params.edgeColor)
      }
    });
    ctx.release(colors);
    return output;
  },
  dispose(gl, state) {
    if (state.trisTexture) gl.deleteTexture(state.trisTexture.texture);
    if (state.binTexture) gl.deleteTexture(state.binTexture.texture);
    state.trisTexture = null;
    state.binTexture = null;
    state.mesh = null;
  }
};
