import { hexToRgb } from '../engine/assets';

const SHADER = `
uniform float uMode;
uniform float uShape;
uniform float uCell;
uniform float uAngle;
uniform float uScale;
uniform vec3 uPaper;
uniform vec3 uInk;
uniform vec3 uAccent;
uniform float uContrast;
uniform float uBrightness;
uniform float uRough;
uniform float uShift;
uniform vec2 uDrift;
uniform float uTexels;

const vec3 CYAN = vec3(0.0, 0.64, 0.93);
const vec3 MAGENTA = vec3(0.92, 0.07, 0.56);
const vec3 YELLOW = vec3(1.0, 0.91, 0.0);
const vec3 KEY = vec3(0.11, 0.1, 0.12);
const vec3 RED = vec3(1.0, 0.16, 0.12);
const vec3 GREEN = vec3(0.12, 1.0, 0.3);
const vec3 BLUE = vec3(0.16, 0.32, 1.0);

vec3 photo(vec2 p, float lod) {
  vec2 uv = clamp(p / uResolution, 0.0, 1.0);
  return textureLod(uInput, uv, lod).rgb;
}

float grade(float v) {
  return clamp((v - 0.5) * uContrast + 0.5 + uBrightness, 0.0, 1.0);
}

vec3 gradeColor(vec3 c) {
  return vec3(grade(c.r), grade(c.g), grade(c.b));
}

vec3 tone(vec3 c) {
  return pow(max(c, 0.0), vec3(1.5));
}

float press(float t) {
  t = clamp(t, 0.0, 1.0);
  return smoothstep(0.0, 0.04, t) * (0.05 + t * 0.89);
}

float plate(float t) {
  t = clamp(t, 0.0, 1.0);
  return smoothstep(0.0, 0.03, t) * (0.02 + t * 0.92);
}

vec3 decode(vec3 c) {
  return pow(max(c, 0.0), vec3(2.2));
}

vec4 separate(vec3 color) {
  vec3 target = clamp(tone(gradeColor(color)) / max(tone(uPaper), vec3(0.02)), 0.0, 1.0);
  vec3 absorbC = 1.0 - decode(CYAN);
  vec3 absorbM = 1.0 - decode(MAGENTA);
  vec3 absorbY = 1.0 - decode(YELLOW);
  float bright = pow(max(max(target.r, target.g), target.b), 0.4545);
  float key = pow(clamp(1.0 - bright / 0.62, 0.0, 1.0), 1.4) * 0.95;
  vec3 rest = clamp(target / max(1.0 - key * (1.0 - decode(KEY)), vec3(0.03)), 0.0, 1.0);
  vec3 a = 1.0 - rest;
  for (int i = 0; i < 3; i++) {
    vec3 tc = 1.0 - a.x * absorbC;
    vec3 tm = 1.0 - a.y * absorbM;
    vec3 ty = 1.0 - a.z * absorbY;
    mat3 slope = mat3(-absorbC * tm * ty, -absorbM * tc * ty, -absorbY * tc * tm);
    if (abs(determinant(slope)) < 1e-6) break;
    a = clamp(a - inverse(slope) * (tc * tm * ty - rest), 0.0, 1.0);
  }
  return vec4(a, key);
}

vec3 emit(vec3 color) {
  vec3 target = max(tone(gradeColor(color)) - tone(uPaper), 0.0);
  mat3 lights = mat3(decode(RED), decode(GREEN), decode(BLUE));
  return clamp(inverse(lights) * target, 0.0, 1.0);
}

float metric(vec2 f) {
  if (uShape < 0.5) return length(f);
  if (uShape < 1.5) return length(f * vec2(0.8, 1.15));
  if (uShape < 2.5) return max(abs(f.x), abs(f.y));
  if (uShape < 3.5) return abs(f.x) + abs(f.y);
  if (uShape < 4.5) return abs(f.y);
  return min(abs(f.x), abs(f.y));
}

float reach(float t) {
  t = clamp(t, 0.0, 1.0);
  if (uShape < 0.5) return t < 0.785 ? sqrt(t / 3.14159) : mix(0.5, 0.72, (t - 0.785) / 0.215);
  if (uShape < 1.5) return t < 0.7 ? sqrt(t * 0.92 / 3.14159) : mix(0.4497, 0.72, (t - 0.7) / 0.3);
  if (uShape < 2.5) return 0.5 * sqrt(t) + 0.02 * t;
  if (uShape < 3.5) return t < 0.5 ? sqrt(t * 0.5) : 1.0 - sqrt((1.0 - t) * 0.5);
  if (uShape < 4.5) return 0.52 * t;
  return (1.0 - sqrt(1.0 - t)) * 0.5 + 0.02 * t;
}

vec2 center(vec2 p, float angle) {
  vec2 q = rotation(angle) * p / uCell;
  vec2 c = floor(q) + 0.5;
  if (uShape > 3.5 && uShape < 4.5) c.x = q.x;
  return rotation(-angle) * c * uCell;
}

float dots(vec2 p, float angle, float t, float seed) {
  vec2 q = rotation(angle) * p / uCell;
  float d = metric(fract(q) - 0.5);
  d += (valueNoise(p * 0.42 / max(uUnit, 0.25) + seed * 17.0) - 0.5) * uRough * 0.18;
  float r = reach(t) * uScale;
  float w = max(fwidth(d), 0.0001) * 0.75;
  return smoothstep(r + w, r - w, d) * clamp(r / (w * 2.0), 0.0, 1.0);
}

float coverage(vec3 image) {
  float shade = dot(tone(gradeColor(image)), LUMA);
  float paper = dot(tone(uPaper), LUMA);
  float span = dot(tone(uInk), LUMA) - paper;
  float t = abs(span) < 0.02 ? 1.0 - shade : (shade - paper) / span;
  return press(t);
}

void main() {
  vec2 p = vUv * uResolution + uDrift;
  float lod = log2(max(uCell * uTexels, 1.0));
  float base = uAngle;
  vec2 drift = vec2(uShift, uShift * -0.6);
  vec3 print = uPaper;

  if (uMode < 0.5) {
    float k = dots(p, base, coverage(photo(center(p, base) - uDrift, lod)), 0.0);
    print = mix(uPaper, uInk, k);
  } else if (uMode < 1.5) {
    float second = base + 0.5236;
    float tA = coverage(photo(center(p, base) - uDrift, lod));
    float tB = coverage(photo(center(p + drift, second) - drift - uDrift, lod));
    float kA = dots(p, base, pow(tA, 1.9), 0.0);
    float kB = dots(p + drift, second, clamp(tB * 1.3, 0.0, 1.0) * 0.8, 1.0);
    if (dot(uPaper, LUMA) > 0.5) {
      print = uPaper * mix(vec3(1.0), uAccent, kB) * mix(vec3(1.0), uInk, kA);
    } else {
      print = min(uPaper + uAccent * kB + uInk * kA, vec3(1.0));
    }
  } else if (uMode < 2.5) {
    float ac = base - 0.5236;
    float am = base + 0.5236;
    float ay = base - 0.7854;
    vec3 sc = photo(center(p + drift, ac) - drift - uDrift, lod);
    vec3 sm = photo(center(p - drift, am) + drift - uDrift, lod);
    vec3 sy = photo(center(p + drift.yx, ay) - drift.yx - uDrift, lod);
    vec3 sk = photo(center(p, base) - uDrift, lod);
    float kc = dots(p + drift, ac, plate(separate(sc).x), 1.0);
    float km = dots(p - drift, am, plate(separate(sm).y), 2.0);
    float ky = dots(p + drift.yx, ay, plate(separate(sy).z), 3.0);
    float kk = dots(p, base, plate(separate(sk).w), 4.0);
    print = uPaper;
    print *= mix(vec3(1.0), CYAN, kc);
    print *= mix(vec3(1.0), MAGENTA, km);
    print *= mix(vec3(1.0), YELLOW, ky);
    print *= mix(vec3(1.0), KEY, kk);
  } else {
    float ar = base - 0.5236;
    float ag = base + 0.5236;
    vec3 sr = photo(center(p + drift, ar) - drift - uDrift, lod);
    vec3 sg = photo(center(p - drift, ag) + drift - uDrift, lod);
    vec3 sb = photo(center(p, base) - uDrift, lod);
    float kr = dots(p + drift, ar, plate(emit(sr).x), 1.0);
    float kg = dots(p - drift, ag, plate(emit(sg).y), 2.0);
    float kb = dots(p, base, plate(emit(sb).z), 3.0);
    print = min(uPaper + RED * kr + GREEN * kg + BLUE * kb, vec3(1.0));
  }

  outColor = vec4(print, 1.0);
}`;

const MODES = { mono: 0, duotone: 1, cmyk: 2, rgb: 3 };
const SHAPES = { dot: 0, ellipse: 1, square: 2, diamond: 3, line: 4, cross: 5 };

export default {
  id: 'halftone',
  name: 'Halftone',
  category: 'print',
  description: 'Print screens of dots or lines, from one ink to full CMYK.',
  animated: true,
  animates: params => params.motion > 0,
  params: [
    {
      key: 'mode',
      label: 'Inks',
      type: 'select',
      default: 'cmyk',
      options: [
        { value: 'cmyk', label: 'CMYK' },
        { value: 'mono', label: 'One ink' },
        { value: 'duotone', label: 'Two inks' },
        { value: 'rgb', label: 'Light (RGB)' }
      ]
    },
    {
      key: 'shape',
      label: 'Shape',
      type: 'select',
      default: 'dot',
      options: [
        { value: 'dot', label: 'Dot' },
        { value: 'ellipse', label: 'Ellipse' },
        { value: 'square', label: 'Square' },
        { value: 'diamond', label: 'Diamond' },
        { value: 'line', label: 'Line' },
        { value: 'cross', label: 'Cross' }
      ]
    },
    { key: 'size', label: 'Size', type: 'number', min: 2, max: 40, step: 0.5, default: 8 },
    { key: 'angle', label: 'Angle', type: 'number', min: 0, max: 90, step: 1, default: 15 },
    { key: 'paper', label: 'Paper', type: 'color', default: '#f3eee4' },
    {
      key: 'ink',
      label: 'Ink',
      type: 'color',
      default: '#17151a',
      when: params => params.mode === 'mono' || params.mode === 'duotone'
    },
    {
      key: 'accent',
      label: 'Second ink',
      type: 'color',
      default: '#ff5a36',
      when: params => params.mode === 'duotone'
    },
    { key: 'gain', label: 'Dot gain', type: 'number', min: 0.6, max: 1.6, step: 0.01, default: 1 },
    { key: 'contrast', label: 'Contrast', type: 'number', min: 0.5, max: 2, step: 0.01, default: 1.1 },
    { key: 'brightness', label: 'Brightness', type: 'number', min: -0.4, max: 0.4, step: 0.01, default: 0 },
    { key: 'rough', label: 'Ink texture', type: 'number', min: 0, max: 1, step: 0.01, default: 0.3 },
    { key: 'misregister', label: 'Misregister', type: 'number', min: 0, max: 1, step: 0.01, default: 0.15 },
    { key: 'motion', label: 'Drift', type: 'number', min: 0, max: 2, step: 0.01, default: 0 }
  ],
  render(ctx, input, params) {
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const cell = Math.max(2, params.size * ctx.unit);
    const drift = params.motion * ctx.time;
    return ctx.pass('halftone', SHADER, {
      input: source,
      uniforms: {
        uMode: MODES[params.mode] ?? 2,
        uShape: SHAPES[params.shape] ?? 0,
        uCell: cell,
        uAngle: ((params.angle + drift * 3) * Math.PI) / 180,
        uScale: params.gain,
        uPaper: hexToRgb(params.paper),
        uInk: hexToRgb(params.ink),
        uAccent: hexToRgb(params.accent),
        uContrast: params.contrast,
        uBrightness: params.brightness,
        uRough: params.rough,
        uShift: params.misregister * cell * 0.35,
        uDrift: [drift * cell * 0.6, drift * cell * 0.25],
        uTexels: 1
      }
    });
  }
};
