import { hexToRgb } from '../engine/assets';
import { STATS_GLSL, imageStats } from '../engine/stats';

const GRID = `
uniform vec2 uCell;
uniform vec2 uOrigin;
uniform vec2 uOffset;
uniform float uBond;
`;

const AVERAGE = `
${GRID}
uniform vec2 uImage;
uniform float uHex;

void main() {
  vec2 c = floor(gl_FragCoord.xy) - uOffset;
  vec2 center;
  vec2 extent;
  if (uHex > 0.5) {
    center = uOrigin + uCell.x * vec2(c.x + 0.5 * mod(c.y, 2.0), 0.8660254 * c.y);
    extent = vec2(uCell.x * 0.9);
  } else {
    center = uOrigin + (c + vec2(0.5 + uBond * mod(c.y, 2.0), 0.5)) * uCell;
    extent = uCell;
  }
  float lod = log2(max(min(extent.x, extent.y) * 0.25, 1.0));
  vec3 sum = vec3(0.0);
  for (int y = 0; y < 4; y++) {
    for (int x = 0; x < 4; x++) {
      vec2 o = (vec2(float(x), float(y)) + 0.5) * 0.25 - 0.5;
      sum += textureLod(uInput, clamp((center + o * extent) / uImage, 0.0, 1.0), lod).rgb;
    }
  }
  outColor = vec4(sum / 16.0, 1.0);
}`;

const PROCESS = `
${STATS_GLSL}
uniform float uMode;
uniform vec3 uPalette[64];
uniform vec3 uLab[64];
uniform float uCount;
uniform float uLevels;
uniform float uDither;
uniform float uOutline;
uniform float uBoost;
uniform float uJitter;
uniform float uMono;
uniform vec3 uTint;
uniform float uSharp;
uniform float uChroma;

float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}

float bayer4(vec2 a) {
  return bayer2(0.5 * a) * 0.25 + bayer2(a);
}

vec3 fetchCell(vec2 c) {
  return texelFetch(uInput, ivec2(clamp(c, vec2(0.0), uResolution - 1.0)), 0).rgb;
}

vec3 nearest(vec3 color, float t) {
  vec3 w = vec3(1.0, uChroma, uChroma);
  vec3 lab = toOklab(color) * w;
  float best = 1e9;
  float second = 1e9;
  int ia = 0;
  int ib = 0;
  for (int i = 0; i < 64; i++) {
    if (float(i) >= uCount) break;
    vec3 d = lab - uLab[i] * w;
    float e = dot(d, d);
    if (e < best) {
      second = best;
      ib = ia;
      best = e;
      ia = i;
    } else if (e < second) {
      second = e;
      ib = i;
    }
  }
  if (uCount < 1.5) return uPalette[ia];
  vec3 a = uLab[ia] * w;
  vec3 ab = uLab[ib] * w - a;
  float f = clamp(dot(lab - a, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
  return f > t ? uPalette[ib] : uPalette[ia];
}

vec3 boost(vec3 c, float amount) {
  float l = luma(c);
  c = mix(vec3(l), c, 1.0 + 0.35 * amount);
  c = (c - 0.5) * (1.0 + 0.12 * amount) + 0.5;
  return clamp(c, 0.0, 1.0);
}

vec3 quantize(vec3 c, float t) {
  if (uLevels > 0.5) {
    float steps = max(uLevels - 1.0, 1.0);
    return clamp(floor(c * steps + t) / steps, 0.0, 1.0);
  }
  if (uCount > 0.5) return nearest(c, t);
  return c;
}

vec3 darker(vec3 c) {
  vec3 hsv = rgb2hsv(c);
  hsv.z *= 0.45;
  hsv.y = min(1.0, hsv.y * 1.2 + 0.1);
  return hsv2rgb(hsv);
}

void main() {
  vec2 cell = floor(gl_FragCoord.xy);
  vec3 c = fetchCell(cell);
  vec3 result = c;
  if (uMode < 0.5) {
    vec3 around = fetchCell(cell + vec2(1.0, 0.0)) + fetchCell(cell - vec2(1.0, 0.0));
    around += fetchCell(cell + vec2(0.0, 1.0)) + fetchCell(cell - vec2(0.0, 1.0));
    vec3 crisp = clamp(c + (c - around * 0.25) * uSharp, 0.0, 1.0);
    vec3 graded = boost(crisp, uBoost);
    float t = 0.5 + (bayer4(cell) + 0.03125 - 0.5) * uDither;
    result = quantize(graded, t);
    if (uOutline > 0.5) {
      float l0 = toOklab(c).x;
      float l1 = toOklab(fetchCell(cell + vec2(1.0, 0.0))).x;
      float l2 = toOklab(fetchCell(cell - vec2(1.0, 0.0))).x;
      float l3 = toOklab(fetchCell(cell + vec2(0.0, 1.0))).x;
      float l4 = toOklab(fetchCell(cell - vec2(0.0, 1.0))).x;
      float rise = max(max(l1, l2), max(l3, l4)) - l0;
      if (rise > 0.08) {
        vec3 line = uOutline < 1.5 ? darker(result) : vec3(0.05, 0.045, 0.06);
        result = (uLevels > 0.5 || uCount > 0.5) ? quantize(line, 0.5) : line;
      }
    }
  } else if (uMode < 1.5) {
    vec3 vivid = clamp(mix(vec3(luma(c)), c, 1.15), 0.0, 1.0);
    result = pow(vivid, vec3(1.1)) * 1.12;
    if (uMono > 0.5) {
      float v = mix(luma(c), autoLevel(luma(c)), 0.7);
      result = uTint * pow(clamp(v, 0.0, 1.0), 1.6) * 1.35;
    }
  } else if (uMode > 2.5 && uMode < 3.5) {
    vec3 h = hash32(cell * 1.31 + 7.0);
    vec3 hsv = rgb2hsv(boost(c, uBoost));
    hsv.z *= 1.0 + (h.x - 0.5) * 0.32 * uJitter;
    hsv.y = clamp(hsv.y * (1.0 + (h.y - 0.5) * 0.5 * uJitter), 0.0, 1.0);
    hsv.x = fract(hsv.x + (h.z - 0.5) * 0.04 * uJitter);
    result = hsv2rgb(hsv);
  } else if (uMode > 3.5) {
    vec3 graded = boost(c, uBoost);
    float t = 0.5 + (bayer4(cell) + 0.03125 - 0.5) * uDither;
    result = quantize(graded, t);
  }
  outColor = vec4(result, 1.0);
}`;

const SQUARE = `
${GRID}
uniform sampler2D uCells;
uniform float uGap;
uniform float uGlow;
uniform vec3 uBackground;

void main() {
  vec2 p = vUv * uResolution;
  vec2 q = (p - uOrigin) / uCell;
  vec2 c = floor(q);
  vec3 color = texelFetch(uCells, ivec2(c + uOffset), 0).rgb;
  if (uGap <= 0.0 && uGlow <= 0.0) {
    outColor = vec4(color, 1.0);
    return;
  }
  vec2 local = q - c - 0.5;
  float d = max(abs(local.x), abs(local.y));
  float edge = 0.5 - uGap * 0.5;
  float aa = 0.75 / uCell.x;
  float mask = uGap > 0.0 ? 1.0 - smoothstep(edge - aa, edge + aa, d) : 1.0;
  float halo = exp(-max(d - edge, 0.0) * mix(26.0, 5.0, uGlow)) * uGlow * (1.0 - mask);
  vec3 lit = color * (1.0 + uGlow * 0.25 * (1.0 - smoothstep(0.0, edge, d)));
  outColor = vec4(mix(uBackground + color * halo, lit, mask), 1.0);
}`;

const HEX = `
${GRID}
uniform sampler2D uCells;
uniform float uGap;
uniform float uGlow;
uniform vec3 uBackground;

vec2 hexCell(vec2 p) {
  vec2 r = vec2(1.0, 1.7320508);
  vec2 h = r * 0.5;
  vec2 a = mod(p, r) - h;
  vec2 b = mod(p - h, r) - h;
  return dot(a, a) < dot(b, b) ? a : b;
}

void main() {
  vec2 p = vUv * uResolution;
  vec2 q = (p - uOrigin) / uCell.x;
  vec2 g = hexCell(q);
  vec2 center = q - g;
  float j = floor(center.y / 0.8660254 + 0.5);
  float i = floor(center.x - 0.5 * mod(j, 2.0) + 0.5);
  vec3 color = texelFetch(uCells, ivec2(vec2(i, j) + uOffset), 0).rgb;
  if (uGap <= 0.0 && uGlow <= 0.0) {
    outColor = vec4(color, 1.0);
    return;
  }
  float d = max(dot(abs(g), vec2(0.5, 0.8660254)), abs(g.x));
  float edge = 0.5 - uGap * 0.5;
  float aa = 0.75 / uCell.x;
  float mask = uGap > 0.0 ? 1.0 - smoothstep(edge - aa, edge + aa, d) : 1.0;
  float halo = exp(-max(d - edge, 0.0) * mix(26.0, 5.0, uGlow)) * uGlow * (1.0 - mask);
  vec3 lit = color * (1.0 + uGlow * 0.25 * (1.0 - smoothstep(0.0, edge, d)));
  outColor = vec4(mix(uBackground + color * halo, lit, mask), 1.0);
}`;

const SHADING = `
const vec3 LIGHT = vec3(-0.48, 0.56, 0.675);

float sdBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

vec2 sdBoxGrad(vec2 p, vec2 b, float r) {
  vec2 w = abs(p) - b + r;
  vec2 s = vec2(p.x < 0.0 ? -1.0 : 1.0, p.y < 0.0 ? -1.0 : 1.0);
  vec2 g = max(w.x, w.y) > 0.0 ? normalize(max(w, 0.0)) : (w.x > w.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0));
  return s * g;
}

float lambert(vec3 n) {
  return dot(n, LIGHT) / LIGHT.z;
}

float gloss(vec3 n, float power) {
  vec3 h = normalize(LIGHT + vec3(0.0, 0.0, 1.0));
  return pow(max(dot(n, h), 0.0), power);
}
`;

const MOSAIC = `
${GRID}
${SHADING}
uniform sampler2D uCells;
uniform vec3 uGrout;
uniform float uGroutWidth;
uniform float uBevel;
uniform float uIrregular;
uniform float uJitter;

void main() {
  vec2 p = vUv * uResolution;
  vec2 q = (p - uOrigin) / uCell;
  float row = floor(q.y);
  q.x -= uBond * mod(row, 2.0);
  vec2 c = vec2(floor(q.x), row);
  vec2 local = (fract(q) - 0.5) * uCell;
  vec3 color = texelFetch(uCells, ivec2(c + uOffset), 0).rgb;

  vec4 h = vec4(hash32(c + 3.7), hash12(c * 1.7 + 11.0));
  float angle = (h.x - 0.5) * 0.2 * uIrregular;
  vec2 shift = (h.yz - 0.5) * min(uCell.x, uCell.y) * 0.07 * uIrregular;
  vec2 halfSize = max(uCell * 0.5 - uGroutWidth * 0.5, vec2(0.5));
  float cs = abs(cos(angle));
  float sn = abs(sin(angle));
  vec2 bound = vec2(halfSize.x * cs + halfSize.y * sn, halfSize.x * sn + halfSize.y * cs);
  vec2 room = uCell * 0.5 - abs(shift) - uGroutWidth * 0.2 * uIrregular;
  vec2 fit = room / max(bound, vec2(1e-3));
  halfSize *= clamp(min(fit.x, fit.y), 0.5, 1.0) * (1.0 - h.w * 0.06 * uIrregular);

  mat2 spin = rotation(angle);
  vec2 lp = spin * (local - shift);
  float radius = min(halfSize.x, halfSize.y) * mix(0.12, 0.3, uIrregular);
  float sd = sdBox(lp, halfSize, radius);
  vec2 grad = sdBoxGrad(lp, halfSize, radius) * spin;

  float inside = -sd;
  float width = max(min(halfSize.x, halfSize.y) * 0.42, 1.0);
  float tilt = 1.0 - smoothstep(0.0, width, inside);
  tilt *= tilt;
  vec3 n = normalize(vec3(grad * tilt * 1.4 * uBevel, 1.0));
  float shade = 1.0 + (lambert(n) - 1.0) * 0.5;
  vec2 tone = (h.zx - 0.5) * 2.0;
  float glaze = 1.0 + dot(lp / max(halfSize, vec2(1.0)), tone) * 0.05 * uJitter;
  vec3 tile = color * shade * glaze;
  tile += gloss(n, 40.0) * 0.2 * uBevel * smoothstep(0.0, 1.0, tilt);
  tile *= 1.0 - 0.18 * uBevel * smoothstep(1.5, -0.5, inside);

  float occlusion = smoothstep(-0.5, max(uGroutWidth * 0.6, 1.0), sd);
  vec3 grout = uGrout * mix(0.62, 1.0, occlusion);
  float mask = clamp(0.5 - sd, 0.0, 1.0);
  outColor = vec4(clamp(mix(grout, tile, mask), 0.0, 1.0), 1.0);
}`;

const BRICK = `
${GRID}
${SHADING}
uniform sampler2D uCells;
uniform float uPiece;
uniform float uRelief;
uniform vec3 uBackground;

void main() {
  vec2 p = vUv * uResolution;
  vec2 q = (p - uOrigin) / uCell;
  vec2 c = floor(q);
  vec2 l = q - c - 0.5;
  vec3 color = texelFetch(uCells, ivec2(c + uOffset), 0).rgb;
  float px = 1.0 / uCell.x;
  float relief = uRelief;

  float seam = max(0.012, px * 0.5);
  float plateSd;
  vec2 plateGrad;
  if (uPiece > 0.5 && uPiece < 1.5) {
    float r = 0.5 - seam;
    plateSd = length(l) - r;
    plateGrad = normalize(l + 1e-5);
  } else {
    plateSd = sdBox(l, vec2(0.5 - seam), 0.05);
    plateGrad = sdBoxGrad(l, vec2(0.5 - seam), 0.05);
  }
  float edgeTilt = 1.0 - smoothstep(0.0, 0.07, -plateSd);
  vec3 n = normalize(vec3(plateGrad * edgeTilt * 1.6 * relief, 1.0));
  vec3 plastic = color * (1.0 + (lambert(n) - 1.0) * 0.5);
  plastic += gloss(n, 24.0) * 0.18 * relief;

  if (uPiece < 1.5) {
    float r = 0.3;
    float d = length(l);
    vec2 sh = l - vec2(0.075, -0.085) * (0.4 + relief);
    float shadow = 1.0 - smoothstep(r - 0.06, r + 0.1, length(sh));
    plastic *= 1.0 - shadow * 0.42 * relief * smoothstep(r - px, r + px, d);
    float rim = smoothstep(r - 0.09, r, d);
    vec2 dir = l / max(d, 1e-4);
    vec3 sn = normalize(vec3(dir * rim * 1.7 * relief, 1.0));
    vec3 stud = color * (1.0 + (lambert(sn) - 1.0) * 0.55) * (1.0 + 0.05 * relief);
    stud += gloss(sn, 18.0) * 0.4 * relief;
    float ring = smoothstep(r - 0.12, r - 0.05, d) * (1.0 - smoothstep(r - 0.05, r - 0.01, d));
    stud *= 1.0 - ring * 0.06 * relief;
    float studMask = 1.0 - smoothstep(r - px, r + px, d);
    plastic = mix(plastic, stud, studMask);
  } else {
    plastic *= 1.0 + (l.y - l.x) * 0.08 * relief;
    plastic += gloss(normalize(vec3(-l * 0.5, 1.0)), 60.0) * 0.08 * relief;
  }

  vec3 gap = uPiece > 0.5 && uPiece < 1.5 ? uBackground : color * (1.0 - 0.3 * relief);
  float mask = clamp(0.5 - plateSd / px, 0.0, 1.0);
  outColor = vec4(clamp(mix(gap, plastic, mask), 0.0, 1.0), 1.0);
}`;

const LED = `
${GRID}
${SHADING}
uniform sampler2D uCells;
uniform vec2 uGrid;
uniform float uType;
uniform float uGap;
uniform float uGlow;
uniform vec3 uBackground;

vec3 cellAt(vec2 c) {
  return texelFetch(uCells, ivec2(clamp(c + uOffset, vec2(0.0), uGrid - 1.0)), 0).rgb;
}

vec3 softClip(vec3 x) {
  float m = max(max(x.r, x.g), x.b);
  if (m <= 0.8) return x;
  float t = 0.8 + 0.2 * (1.0 - exp(-(m - 0.8) * 5.0));
  return mix(x * (t / m), min(x, vec3(1.0)), 0.3);
}

vec3 lens(vec2 l, float r, float px, vec3 board, vec3 color, out float cover) {
  float d = length(l);
  cover = 1.0 - smoothstep(r - px, r + px, d);
  float dome = sqrt(max(1.0 - (d * d) / (r * r), 0.0));
  vec3 n = normalize(vec3(l / r * 0.85, dome + 0.2));
  vec3 body = board + vec3(0.028) * dome + gloss(n, 34.0) * 0.07;
  return body + color * (0.62 + 0.62 * dome * dome);
}

void main() {
  vec2 p = vUv * uResolution;
  vec2 q = (p - uOrigin) / uCell;
  vec2 c = floor(q);
  vec2 l = q - c - 0.5;
  float px = 1.0 / uCell.x;
  vec3 color = cellAt(c);
  float r = max(0.5 - uGap * 0.5, px);
  vec3 board = uBackground;
  vec3 result = board;
  float core = r;
  float reach = 1.0;
  float cover = 0.0;

  if (uType < 0.5) {
    vec3 lit = lens(l, r, px, board, color, cover);
    result = mix(board, lit, cover);
  } else if (uType < 1.5) {
    float s = r * 0.8;
    float housingSd = sdBox(l, vec2(min(r * 0.98 + 0.04, 0.5)), 0.03);
    float sd = sdBox(l, vec2(s), s * 0.3);
    cover = 1.0 - smoothstep(-px, px, sd);
    float frame = 1.0 - smoothstep(-px, px, housingSd);
    vec3 housing = mix(board, board * 1.5 + vec3(0.02), frame);
    float plateau = 0.86 + 0.24 * smoothstep(0.0, s * 0.9, -sd);
    vec3 emit = housing + vec3(0.02) + color * plateau;
    result = mix(housing, emit, cover);
    core = s;
  } else if (uType < 2.5) {
    float rs = r * 0.47;
    vec3 sum = board;
    for (int k = 0; k < 3; k++) {
      float a = float(k) * 2.0943951 + 2.6179939;
      vec2 o = l - vec2(cos(a), sin(a)) * r * 0.54;
      vec3 primary = k == 0 ? vec3(1.0, 0.12, 0.08) : (k == 1 ? vec3(0.1, 1.0, 0.3) : vec3(0.16, 0.3, 1.0));
      float level = k == 0 ? color.r : (k == 1 ? color.g : color.b);
      float m;
      vec3 lit = lens(o, rs, px, vec3(0.0), mix(primary * level * 3.0, color * 1.3, 0.22), m);
      sum = mix(sum, board + lit, m);
      cover += m;
    }
    result = sum;
    core = r * 0.8;
  } else {
    float rb = r * 0.88;
    float d = length(l);
    float socket = 1.0 - smoothstep(rb + 0.05 - px, rb + 0.05 + px, d);
    float socketRing = smoothstep(rb - px, rb + px, d) * socket;
    cover = 1.0 - smoothstep(rb - px, rb + px, d);
    float dome = sqrt(max(1.0 - (d * d) / (rb * rb), 0.0));
    float level = max(max(color.r, color.g), color.b);
    float filament = exp(-d * d / (rb * rb * 0.08));
    vec3 warm = mix(color, vec3(luma(color)) * vec3(1.2, 0.84, 0.48), 0.65);
    vec3 n = normalize(vec3(l / rb * 0.9, dome + 0.12));
    vec3 glass = board + vec3(0.075, 0.068, 0.06) * dome + gloss(n, 28.0) * 0.22;
    vec3 emit = warm * (0.5 + 0.7 * dome) + vec3(1.0, 0.92, 0.78) * filament * level * 0.7;
    float side = 0.5 + 0.5 * dot(normalize(l + 1e-5), normalize(LIGHT.xy));
    vec3 metal = board * 2.4 + vec3(0.035) + vec3(0.06) * side;
    result = mix(board, metal, socketRing);
    result = mix(result, glass + emit, cover);
    core = rb;
    reach = 1.35;
  }

  if (uGlow > 0.0) {
    float tight = mix(0.03, 0.11, uGlow) * reach;
    float soft = mix(0.08, 0.34, uGlow) * reach;
    vec3 halo = vec3(0.0);
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 o = vec2(float(x), float(y));
        float dist = max(length(l - o) - core, 0.0);
        halo += cellAt(c + o) * (0.55 * exp(-dist / tight) + 0.3 * exp(-dist * dist / (2.0 * soft * soft)));
      }
    }
    vec3 wide = textureLod(uCells, (q + uOffset) / uGrid, 1.5).rgb;
    result += (halo * 0.66 + wide * 0.3 * uGlow) * uGlow * (1.0 - cover * 0.35);
  }
  outColor = vec4(softClip(result), 1.0);
}`;

const SHAPES = { square: 0, round: 1, hex: 2, mosaic: 3, brick: 4 };
const SCALE = { square: 1, round: 1, hex: 1, mosaic: 1.8, brick: 1.8 };
const TILES = { square: [1, 1, 0], wide: [1.4, 0.7, 0], tall: [0.7, 1.4, 0], offset: [1.4, 0.7, 0.5] };
const PIECES = { plate: 0, round: 1, tile: 2 };
const LEDS = { round: 0, smd: 1, rgb: 2, bulb: 3 };
const OUTLINES = { none: 0, shaded: 1, black: 2 };

const PALETTES = {
  gameboy: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
  cga: ['#000000', '#55ffff', '#ff55ff', '#ffffff'],
  c64: [
    '#000000',
    '#ffffff',
    '#880000',
    '#aaffee',
    '#cc44cc',
    '#00cc55',
    '#0000aa',
    '#eeee77',
    '#dd8855',
    '#664400',
    '#ff7777',
    '#333333',
    '#777777',
    '#aaff66',
    '#0088ff',
    '#bbbbbb'
  ],
  nes: [
    '#7c7c7c',
    '#0000fc',
    '#0000bc',
    '#4428bc',
    '#940084',
    '#a80020',
    '#a81000',
    '#881400',
    '#503000',
    '#007800',
    '#006800',
    '#005800',
    '#004058',
    '#000000',
    '#bcbcbc',
    '#0078f8',
    '#0058f8',
    '#6844fc',
    '#d800cc',
    '#e40058',
    '#f83800',
    '#e45c10',
    '#ac7c00',
    '#00b800',
    '#00a800',
    '#00a844',
    '#008888',
    '#f8f8f8',
    '#3cbcfc',
    '#6888fc',
    '#9878f8',
    '#f878f8',
    '#f85898',
    '#f87858',
    '#fca044',
    '#f8b800',
    '#b8f818',
    '#58d854',
    '#58f898',
    '#00e8d8',
    '#787878',
    '#a4e4fc',
    '#b8b8f8',
    '#d8b8f8',
    '#f8b8f8',
    '#f8a4c0',
    '#f0d0b0',
    '#fce0a8',
    '#f8d878',
    '#d8f878',
    '#b8f8b8',
    '#b8f8d8',
    '#00fcfc',
    '#f8d8f8'
  ],
  pico8: [
    '#000000',
    '#1d2b53',
    '#7e2553',
    '#008751',
    '#ab5236',
    '#5f574f',
    '#c2c3c7',
    '#fff1e8',
    '#ff004d',
    '#ffa300',
    '#ffec27',
    '#00e436',
    '#29adff',
    '#83769c',
    '#ff77a8',
    '#ffccaa'
  ],
  sweetie16: [
    '#1a1c2c',
    '#5d275d',
    '#b13e53',
    '#ef7d57',
    '#ffcd75',
    '#a7f070',
    '#38b764',
    '#257179',
    '#29366f',
    '#3b5dc9',
    '#41a6f6',
    '#73eff7',
    '#f4f4f4',
    '#94b0c2',
    '#566c86',
    '#333c57'
  ],
  endesga32: [
    '#be4a2f',
    '#d77643',
    '#ead4aa',
    '#e4a672',
    '#b86f50',
    '#733e39',
    '#3e2731',
    '#a22633',
    '#e43b44',
    '#f77622',
    '#feae34',
    '#fee761',
    '#63c74d',
    '#3e8948',
    '#265c42',
    '#193c3e',
    '#124e89',
    '#0099db',
    '#2ce8f5',
    '#ffffff',
    '#c0cbdc',
    '#8b9bb4',
    '#5a6988',
    '#3a4466',
    '#262b44',
    '#181425',
    '#ff0044',
    '#68386c',
    '#b55088',
    '#f6757a',
    '#e8b796',
    '#c28569'
  ],
  resurrect64: [
    '#2e222f',
    '#3e3546',
    '#625565',
    '#966c6c',
    '#ab947a',
    '#694f62',
    '#7f708a',
    '#9babb2',
    '#c7dcd0',
    '#ffffff',
    '#6e2727',
    '#b33831',
    '#ea4f36',
    '#f57d4a',
    '#ae2334',
    '#e83b3b',
    '#fb6b1d',
    '#f79617',
    '#f9c22b',
    '#7a3045',
    '#9e4539',
    '#cd683d',
    '#e6904e',
    '#fbb954',
    '#4c3e24',
    '#676633',
    '#a2a947',
    '#d5e04b',
    '#fbff86',
    '#165a4c',
    '#239063',
    '#1ebc73',
    '#91db69',
    '#cddf6c',
    '#313638',
    '#374e4a',
    '#547e64',
    '#92a984',
    '#b2ba90',
    '#0b5e65',
    '#0b8a8f',
    '#0eaf9b',
    '#30e1b9',
    '#8ff8e2',
    '#323353',
    '#484a77',
    '#4d65b4',
    '#4d9be6',
    '#8fd3ff',
    '#45293f',
    '#6b3e75',
    '#905ea9',
    '#a884f3',
    '#eaaded',
    '#753c54',
    '#a24b6f',
    '#cf657f',
    '#ed8099',
    '#831c5d',
    '#c32454',
    '#f04f78',
    '#f68181',
    '#fca790',
    '#fdcbb0'
  ]
};

const BRICKS = [
  '#f2f3f2',
  '#a0a5a9',
  '#6c6e68',
  '#575857',
  '#1e2124',
  '#c91a09',
  '#720e0f',
  '#fe8a18',
  '#f8bb3d',
  '#f2cd37',
  '#fff03a',
  '#e4cd9e',
  '#958a73',
  '#f6d7b3',
  '#d09168',
  '#aa7d55',
  '#582a12',
  '#bbe90b',
  '#dfeea5',
  '#4b9f4a',
  '#237841',
  '#184632',
  '#a0bcac',
  '#36aebf',
  '#078bc9',
  '#9fc3e9',
  '#5a93db',
  '#0055bf',
  '#0a3463',
  '#6074a1',
  '#adc3c0',
  '#ff698f',
  '#e4adc8',
  '#c870a0',
  '#923978',
  '#ac78ba',
  '#3f3691',
  '#a95500'
];

const toOklab = rgb => {
  const linear = rgb.map(c => Math.max(c, 0) ** 2.2);
  const l = Math.cbrt(0.4122214708 * linear[0] + 0.5363325363 * linear[1] + 0.0514459929 * linear[2]);
  const m = Math.cbrt(0.2119034982 * linear[0] + 0.6806995451 * linear[1] + 0.1073969566 * linear[2]);
  const s = Math.cbrt(0.0883024619 * linear[0] + 0.2817188376 * linear[1] + 0.6299787005 * linear[2]);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  ];
};

const paletteUniforms = colors => {
  const rgb = colors.slice(0, 64).map(hexToRgb);
  const lab = rgb.map(toOklab);
  const count = rgb.length;
  while (rgb.length < 64) {
    rgb.push([0, 0, 0]);
    lab.push([0, 0, 0]);
  }
  return { uPalette: rgb, uLab: lab, uCount: count };
};

const isGrid = shape => shape === 'square' || shape === 'hex';

export default {
  id: 'pixel',
  name: 'Pixel',
  category: 'pixel',
  description: 'Pixel art, mosaic tiles, toy bricks, a honeycomb or a glowing LED sign.',
  animated: false,
  params: [
    {
      key: 'shape',
      label: 'Style',
      type: 'select',
      default: 'square',
      options: [
        { value: 'square', label: 'Pixel art' },
        { value: 'mosaic', label: 'Tiles' },
        { value: 'brick', label: 'Bricks' },
        { value: 'hex', label: 'Hexagons' },
        { value: 'round', label: 'LED' }
      ]
    },
    { key: 'size', label: 'Size', type: 'number', min: 2, max: 60, step: 0.5, default: 10 },
    {
      key: 'palette',
      label: 'Palette',
      type: 'select',
      default: 'resurrect64',
      options: [
        { value: 'none', label: 'Full color' },
        { value: 'levels', label: 'Levels' },
        { value: 'resurrect64', label: 'Resurrect 64' },
        { value: 'endesga32', label: 'Endesga 32' },
        { value: 'sweetie16', label: 'Sweetie 16' },
        { value: 'pico8', label: 'PICO-8' },
        { value: 'nes', label: 'NES' },
        { value: 'c64', label: 'C64' },
        { value: 'gameboy', label: 'Game Boy' },
        { value: 'cga', label: 'CGA' },
        { value: 'custom', label: 'Custom' }
      ],
      when: params => params.shape === 'square'
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'colors',
      min: 2,
      max: 16,
      default: ['#1a1c2c', '#3b5dc9', '#41a6f6', '#ef7d57', '#ffcd75', '#f4f4f4'],
      when: params => params.shape === 'square' && params.palette === 'custom'
    },
    {
      key: 'levels',
      label: 'Levels',
      type: 'number',
      min: 2,
      max: 8,
      step: 1,
      default: 4,
      when: params => params.shape === 'square' && params.palette === 'levels'
    },
    {
      key: 'dither',
      label: 'Dither',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0,
      when: params =>
        (params.shape === 'square' && params.palette !== 'none') ||
        (params.shape === 'brick' && params.brickColors !== 'photo')
    },
    {
      key: 'outline',
      label: 'Outline',
      type: 'select',
      default: 'none',
      options: [
        { value: 'none', label: 'None' },
        { value: 'shaded', label: 'Shaded' },
        { value: 'black', label: 'Black' }
      ],
      when: params => params.shape === 'square'
    },
    {
      key: 'tile',
      label: 'Tile shape',
      type: 'select',
      default: 'square',
      options: [
        { value: 'square', label: 'Square' },
        { value: 'wide', label: 'Wide' },
        { value: 'tall', label: 'Tall' },
        { value: 'offset', label: 'Offset rows' }
      ],
      when: params => params.shape === 'mosaic'
    },
    {
      key: 'grout',
      label: 'Grout',
      type: 'number',
      min: 0,
      max: 0.4,
      step: 0.01,
      default: 0.08,
      when: params => params.shape === 'mosaic'
    },
    {
      key: 'groutColor',
      label: 'Grout color',
      type: 'color',
      default: '#c9c4ba',
      when: params => params.shape === 'mosaic'
    },
    {
      key: 'bevel',
      label: 'Bevel',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.45,
      when: params => params.shape === 'mosaic'
    },
    {
      key: 'irregular',
      label: 'Hand laid',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.25,
      when: params => params.shape === 'mosaic'
    },
    {
      key: 'jitter',
      label: 'Color variation',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.35,
      when: params => params.shape === 'mosaic'
    },
    {
      key: 'piece',
      label: 'Piece',
      type: 'select',
      default: 'plate',
      options: [
        { value: 'plate', label: 'Studded' },
        { value: 'round', label: 'Round' },
        { value: 'tile', label: 'Flat' }
      ],
      when: params => params.shape === 'brick'
    },
    {
      key: 'brickColors',
      label: 'Colors',
      type: 'select',
      default: 'toy',
      options: [
        { value: 'toy', label: 'Brick palette' },
        { value: 'photo', label: 'Photo colors' }
      ],
      when: params => params.shape === 'brick'
    },
    {
      key: 'relief',
      label: 'Relief',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.6,
      when: params => params.shape === 'brick'
    },
    {
      key: 'led',
      label: 'Bulb',
      type: 'select',
      default: 'round',
      options: [
        { value: 'round', label: 'Round' },
        { value: 'smd', label: 'SMD' },
        { value: 'rgb', label: 'RGB' },
        { value: 'bulb', label: 'Marquee' }
      ],
      when: params => params.shape === 'round'
    },
    {
      key: 'mono',
      label: 'Single color',
      type: 'boolean',
      default: false,
      when: params => params.shape === 'round'
    },
    {
      key: 'ledColor',
      label: 'LED color',
      type: 'color',
      default: '#ffa23a',
      when: params => params.shape === 'round' && params.mono
    },
    {
      key: 'gap',
      label: 'Gap',
      type: 'number',
      min: 0,
      max: 0.8,
      step: 0.01,
      default: 0,
      when: params => isGrid(params.shape) || params.shape === 'round'
    },
    {
      key: 'glow',
      label: 'Glow',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0,
      when: params => params.shape === 'round' || (isGrid(params.shape) && params.gap > 0)
    },
    {
      key: 'background',
      label: 'Background',
      type: 'color',
      default: '#0a090d',
      when: params =>
        params.shape === 'round' ||
        (isGrid(params.shape) && params.gap > 0) ||
        (params.shape === 'brick' && params.piece === 'round')
    }
  ],
  render(ctx, input, params) {
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const shape = SHAPES[params.shape] === undefined ? 'square' : params.shape;
    const base = Math.max(1, (params.size ?? 10) * ctx.unit * SCALE[shape]);
    const hex = shape === 'hex';
    const tile = TILES[params.tile] || TILES.square;
    const cell = shape === 'mosaic' ? [base * tile[0], base * tile[1]] : hex ? [base, base * 0.8660254] : [base, base];
    const bond = shape === 'mosaic' ? tile[2] : 0;
    const origin = [ctx.width / 2, ctx.height / 2];
    const offset = [Math.ceil(ctx.width / (2 * cell[0])) + 2, Math.ceil(ctx.height / (2 * cell[1])) + 2];
    const grid = [offset[0] * 2 + 1, offset[1] * 2 + 1];
    const gridUniforms = { uCell: cell, uOrigin: origin, uOffset: offset, uBond: bond };

    const average = ctx.pass('pixel-average', AVERAGE, {
      input: source,
      target: ctx.target(grid[0], grid[1]),
      uniforms: {
        ...gridUniforms,
        uCell: hex ? [base, base] : cell,
        uImage: [ctx.width, ctx.height],
        uHex: hex ? 1 : 0
      }
    });

    let mode = 0;
    let palette = { uCount: 0 };
    let levels = 0;
    if (shape === 'square') {
      if (params.palette === 'levels') levels = params.levels ?? 4;
      else if (params.palette === 'custom')
        palette = paletteUniforms(params.colors?.length ? params.colors : ['#000000', '#ffffff']);
      else if (PALETTES[params.palette]) palette = paletteUniforms(PALETTES[params.palette]);
    } else if (shape === 'round') mode = 1;
    else if (shape === 'mosaic') mode = 3;
    else if (shape === 'brick') {
      mode = 4;
      if (params.brickColors !== 'photo') palette = paletteUniforms(BRICKS);
    }
    const quantized = levels > 0 || palette.uCount > 0;

    const stats = shape === 'round' && params.mono ? imageStats(ctx, input) : null;
    const cells = hex
      ? average
      : ctx.pass('pixel-cells', PROCESS, {
          input: average,
          target: ctx.target(grid[0], grid[1]),
          textures: stats ? { uStats: stats.target } : {},
          uniforms: {
            uStatsTop: stats ? stats.top : 0,
            uMode: mode,
            uPalette: palette.uPalette,
            uLab: palette.uLab,
            uCount: palette.uCount,
            uLevels: levels,
            uDither: quantized ? (params.dither ?? 0) : 0,
            uOutline: shape === 'square' ? (OUTLINES[params.outline] ?? 0) : 0,
            uBoost: shape === 'brick' ? 0.35 : quantized ? 0.7 : shape === 'mosaic' ? 0.6 : 0,
            uSharp: shape === 'square' ? 0.3 : 0,
            uChroma: shape === 'brick' ? 1.8 : 1,
            uJitter: params.jitter ?? 0.35,
            uMono: params.mono ? 1 : 0,
            uTint: hexToRgb(params.ledColor || '#ffa23a')
          }
        });
    if (!hex) ctx.release(average);
    if (stats) ctx.release(stats.target);

    const background = hexToRgb(params.background);
    let output;
    if (shape === 'mosaic') {
      output = ctx.pass('pixel-mosaic', MOSAIC, {
        input: source,
        textures: { uCells: cells },
        uniforms: {
          ...gridUniforms,
          uGrout: hexToRgb(params.groutColor || '#c9c4ba'),
          uGroutWidth: (params.grout ?? 0.08) * base,
          uBevel: params.bevel ?? 0.45,
          uIrregular: params.irregular ?? 0.25,
          uJitter: params.jitter ?? 0.35
        }
      });
    } else if (shape === 'brick') {
      output = ctx.pass('pixel-brick', BRICK, {
        input: source,
        textures: { uCells: cells },
        uniforms: {
          ...gridUniforms,
          uPiece: PIECES[params.piece] ?? 0,
          uRelief: params.relief ?? 0.6,
          uBackground: background
        }
      });
    } else if (shape === 'round') {
      ctx.mipmap(cells);
      output = ctx.pass('pixel-led', LED, {
        input: source,
        textures: { uCells: cells },
        uniforms: {
          ...gridUniforms,
          uGrid: grid,
          uType: LEDS[params.led] ?? 0,
          uGap: params.gap,
          uGlow: params.glow,
          uBackground: background
        }
      });
    } else {
      output = ctx.pass(hex ? 'pixel-hex' : 'pixel-square', hex ? HEX : SQUARE, {
        input: source,
        textures: { uCells: cells },
        uniforms: { ...gridUniforms, uGap: params.gap, uGlow: params.glow, uBackground: background }
      });
    }
    ctx.release(cells);
    return output;
  }
};
