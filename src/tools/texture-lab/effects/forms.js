import { hexToRgb } from '../engine/assets';

const SHADER = `
uniform float uCell;
uniform float uShape;
uniform float uScale;
uniform float uFloor;
uniform float uContrast;
uniform float uPalette;
uniform vec3 uInk;
uniform vec3 uGround;
uniform float uOffset;
uniform float uSpin;
uniform float uSeed;
uniform float uLod;
uniform float uReach;

const vec3 RED = vec3(0.86, 0.2, 0.15);
const vec3 YELLOW = vec3(0.96, 0.74, 0.1);
const vec3 BLUE = vec3(0.1, 0.32, 0.66);
const vec3 BLACK = vec3(0.09, 0.09, 0.1);
const vec3 CREAM = vec3(0.94, 0.91, 0.85);

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float sdTriangle(vec2 p, float r) {
  const float k = 1.7320508;
  p.y += r * 0.18;
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}

float sdStar(vec2 p, float r, float rf) {
  const vec2 k1 = vec2(0.809016994375, -0.587785252292);
  const vec2 k2 = vec2(-k1.x, k1.y);
  p.y -= r * 0.08;
  p.x = abs(p.x);
  p -= 2.0 * max(dot(k1, p), 0.0) * k1;
  p -= 2.0 * max(dot(k2, p), 0.0) * k2;
  p.x = abs(p.x);
  p.y -= r;
  vec2 ba = rf * vec2(-k1.y, k1.x) - vec2(0.0, 1.0);
  float h = clamp(dot(p, ba) / dot(ba, ba), 0.0, r);
  return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
}

float sdSpokes(vec2 p, float r) {
  float d = 1e5;
  float t = max(r * 0.2, 0.035);
  for (int i = 0; i < 3; i++) {
    vec2 q = rotation(float(i) * PI / 3.0 + PI * 0.5) * p;
    d = min(d, sdBox(q, vec2(r, 0.0)) - t);
  }
  return d;
}

float shapeDistance(float kind, vec2 p, float r) {
  if (kind < 0.5) return length(p) - r;
  if (kind < 1.5) return sdBox(p, vec2(r * 0.86)) - r * 0.04;
  if (kind < 2.5) return sdTriangle(p, r * 1.12);
  if (kind < 3.5) {
    float t = r * 0.34;
    return min(sdBox(p, vec2(r, t)), sdBox(p, vec2(t, r)));
  }
  if (kind < 4.5) return sdStar(p, r * 1.08, 0.45);
  if (kind < 5.5) return sdSpokes(p, r);
  if (kind < 6.5) return abs(length(p) - r * 0.74) - r * 0.26;
  if (kind < 7.5) {
    vec2 q = p + vec2(0.0, r * 0.42);
    return max(length(q) - r * 1.1, -q.y);
  }
  vec2 q = p + vec2(r * 0.86);
  return max(length(q) - r * 1.72, sdBox(p, vec2(r * 0.86)));
}

vec3 bauhaus(vec3 c) {
  vec3 hsv = rgb2hsv(c);
  float dark = smoothstep(0.35, 0.65, luma(uGround));
  if (hsv.y < 0.2 || hsv.z < 0.12) return mix(CREAM, BLACK, dark);
  float h = hsv.x;
  float dr = min(abs(h - 0.02), abs(h - 1.02));
  float dy = abs(h - 0.14);
  float db = abs(h - 0.6);
  if (dr < dy && dr < db) return RED;
  return dy < db ? YELLOW : BLUE;
}

vec4 stamp(vec2 cell, vec2 rowShift, vec2 p) {
  vec2 center = (cell + 0.5 + rowShift) * uCell;
  vec2 uv = center / uResolution;
  if (uv.x < -0.02 || uv.y < -0.02 || uv.x > 1.02 || uv.y > 1.02) return vec4(0.0);
  vec3 image = textureLod(uInput, clamp(uv, 0.0, 1.0), uLod).rgb;
  float l = clamp((luma(image) - 0.5) * uContrast + 0.5, 0.0, 1.0);
  float dark = smoothstep(0.35, 0.65, luma(uGround));
  float tone = mix(l, 1.0 - l, dark);
  vec3 h = hash32(cell + uSeed * 13.7 + rowShift * 3.1);
  float kind = uShape;
  if (uShape > 8.5) {
    float pick = floor(h.x * 5.0);
    kind = pick < 0.5 ? 0.0 : pick < 1.5 ? 2.0 : pick < 2.5 ? 7.0 : pick < 3.5 ? 1.0 : 8.0;
  }
  float size = mix(uFloor, 1.0, pow(tone, 0.75)) * uScale * 0.5;
  float spin = floor(h.y * 4.0) * PI * 0.5 * step(8.5, uShape);
  spin += uSpin * (h.z * 2.0 - 1.0 + sign(h.z - 0.5) * 0.4);
  vec2 q = rotation(spin) * (p - center) / uCell;
  float d = shapeDistance(kind, q, size) * uCell;
  float cover = smoothstep(0.7, -0.7, d) * clamp(size * uCell / 0.8, 0.0, 1.0);
  vec3 color = uInk;
  if (uPalette < 0.5) {
    vec3 hsv = rgb2hsv(image);
    float value = mix(0.16 + 0.84 * pow(tone, 0.8), 0.9 - 0.72 * pow(tone, 0.9), dark);
    color = hsv2rgb(vec3(hsv.x, clamp(hsv.y * mix(0.5, 1.6, smoothstep(0.04, 0.45, tone)), 0.0, 1.0), value));
  } else if (uPalette < 1.5) {
    color = bauhaus(image);
  }
  return vec4(color, cover);
}

void main() {
  vec2 p = vUv * uResolution;
  vec3 color = uGround;
  float row = floor(p.y / uCell);
  for (int j = -1; j <= 1; j++) {
    float r = row + float(j);
    if (abs(float(j)) > uReach) continue;
    vec2 shift = vec2(uOffset * 0.5 * mod(r, 2.0), 0.0);
    float col = floor(p.x / uCell - shift.x);
    for (int i = -1; i <= 1; i++) {
      if (abs(float(i)) > uReach) continue;
      vec4 s = stamp(vec2(col + float(i), r), shift, p);
      color = mix(color, s.rgb, s.a);
    }
  }
  outColor = vec4(color, 1.0);
}`;

const SHAPES = {
  circle: 0,
  square: 1,
  triangle: 2,
  cross: 3,
  star: 4,
  asterisk: 5,
  ring: 6,
  half: 7,
  quarter: 8,
  mixed: 9
};
const PALETTES = { image: 0, bauhaus: 1, ink: 2 };

export default {
  id: 'forms',
  name: 'Forms',
  category: 'geometric',
  description: 'Bold geometric stamps on a grid, each sized by the tone beneath it, like a Bauhaus poster.',
  animated: true,
  preview: { zoom: 2 },
  animates: params => params.spin > 0,
  params: [
    {
      key: 'shape',
      label: 'Shape',
      type: 'select',
      default: 'mixed',
      options: [
        { value: 'mixed', label: 'Mixed' },
        { value: 'circle', label: 'Circle' },
        { value: 'square', label: 'Square' },
        { value: 'triangle', label: 'Triangle' },
        { value: 'cross', label: 'Cross' },
        { value: 'star', label: 'Star' },
        { value: 'asterisk', label: 'Asterisk' },
        { value: 'ring', label: 'Ring' },
        { value: 'half', label: 'Half circle' },
        { value: 'quarter', label: 'Quarter circle' }
      ]
    },
    {
      key: 'palette',
      label: 'Colors',
      type: 'select',
      default: 'image',
      options: [
        { value: 'image', label: 'From image' },
        { value: 'bauhaus', label: 'Bauhaus' },
        { value: 'ink', label: 'Single ink' }
      ]
    },
    { key: 'ink', label: 'Ink', type: 'color', default: '#f2ede4', when: params => params.palette === 'ink' },
    { key: 'background', label: 'Background', type: 'color', default: '#0d0c11' },
    { key: 'size', label: 'Grid size', type: 'number', min: 6, max: 80, step: 0.5, default: 26 },
    { key: 'scale', label: 'Stamp size', type: 'number', min: 0.3, max: 1.8, step: 0.01, default: 0.85 },
    { key: 'floor', label: 'Smallest stamp', type: 'number', min: 0, max: 1, step: 0.01, default: 0.2 },
    { key: 'contrast', label: 'Contrast', type: 'number', min: 0.5, max: 2.5, step: 0.01, default: 1.2 },
    {
      key: 'layout',
      label: 'Layout',
      type: 'select',
      default: 'grid',
      options: [
        { value: 'grid', label: 'Grid' },
        { value: 'offset', label: 'Offset rows' }
      ]
    },
    { key: 'spin', label: 'Spin', type: 'number', min: 0, max: 2, step: 0.01, default: 0 },
    { key: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 0 }
  ],
  render(ctx, input, params) {
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const cell = Math.max(3, params.size * ctx.unit);
    return ctx.pass('forms', SHADER, {
      input: source,
      uniforms: {
        uCell: cell,
        uShape: SHAPES[params.shape] ?? 9,
        uScale: params.scale,
        uFloor: params.floor,
        uContrast: params.contrast,
        uPalette: PALETTES[params.palette] ?? 0,
        uInk: hexToRgb(params.ink),
        uGround: hexToRgb(params.background),
        uOffset: params.layout === 'offset' ? 1 : 0,
        uSpin: ctx.time * params.spin * 0.8,
        uSeed: params.variation,
        uLod: Math.max(0, Math.log2(cell) - 0.5),
        uReach: params.scale > 0.8 || params.spin > 0 ? 1 : 0
      }
    });
  }
};
