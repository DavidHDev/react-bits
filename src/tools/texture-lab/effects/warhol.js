import { hexToRgb } from '../engine/assets';
import { gaussianBlur } from '../engine/blur';
import { imageStats } from '../engine/stats';

const CDF = `
void main() {
  float t = floor(gl_FragCoord.x) / (uResolution.x - 1.0);
  float count = 0.0;
  for (int y = 0; y < 64; y++) {
    for (int x = 0; x < 64; x++) {
      count += step(texelFetch(uInput, ivec2(x, y), 0).r, t);
    }
  }
  outColor = vec4(count / 4096.0, 0.0, 0.0, 1.0);
}`;

const SHADER = `
uniform sampler2D uPlanes;
uniform sampler2D uKey;
uniform sampler2D uMid;
uniform sampler2D uCdf;
uniform vec2 uGrid;
uniform float uGutter;
uniform vec3 uWays[36];
uniform float uWayCount;
uniform float uTones;
uniform float uBrightness;
uniform float uInk;
uniform float uShift;
uniform float uTexture;
uniform vec3 uPaper;
uniform vec3 uKeyInk;
uniform float uVariation;
uniform float uCycle;
uniform float uSourceAspect;

float equalize(float l) {
  float cdf = texture(uCdf, vec2((clamp(l, 0.0, 1.0) * 63.0 + 0.5) / 64.0, 0.5)).r;
  return mix(l, cdf, 0.75);
}

vec3 wayColor(float way, float band) {
  vec3 c = uWays[0];
  for (int i = 0; i < 36; i++) {
    if (float(i) == way * 4.0 + band) c = uWays[i];
  }
  return c;
}

float pickBand(float index) {
  if (uTones < 2.5) return index < 0.5 ? 0.0 : 2.0;
  return index;
}

vec3 planeColor(float way, float x) {
  float w = max(fwidth(x), 1e-4);
  float a = floor(x - w * 0.5);
  float b = floor(x + w * 0.5);
  float top = uTones - 1.0;
  vec3 ca = wayColor(way, pickBand(clamp(a, 0.0, top)));
  if (a == b) return ca;
  vec3 cb = wayColor(way, pickBand(clamp(b, 0.0, top)));
  return mix(ca, cb, clamp((x + w * 0.5 - b) / w, 0.0, 1.0));
}

void main() {
  vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uResolution;
  vec2 cell = (uResolution - uGutter * (uGrid + 1.0)) / uGrid;
  vec2 idx = clamp(floor((px - uGutter * 0.5) / (cell + uGutter)), vec2(0.0), uGrid - 1.0);
  vec2 origin = uGutter + idx * (cell + uGutter);
  vec2 local = px - origin;
  vec2 inside2 = min(local, cell - local);
  float inside = uGutter > 0.0 ? clamp(min(inside2.x, inside2.y) + 0.5, 0.0, 1.0) : 1.0;

  float tile = idx.y * uGrid.x + idx.x;
  float way = mod(tile + floor(uCycle) + uVariation * 3.0, uWayCount);
  vec3 seed = hash32(idx + uVariation * 7.31 + 3.7);

  float cellAspect = cell.x / max(cell.y, 1.0);
  vec2 fit = cellAspect > uSourceAspect ? vec2(1.0, uSourceAspect / cellAspect) : vec2(cellAspect / uSourceAspect, 1.0);
  vec2 uv = (local / cell - 0.5) * fit + 0.5;
  uv.y = 1.0 - uv.y;
  vec2 perPx = fit / cell;
  vec2 shiftA = (seed.xy - 0.5) * uShift * perPx;
  vec2 shiftK = (hash22(idx + uVariation * 3.1 + 11.0) - 0.5) * uShift * 0.45 * perPx;

  vec2 p = px / max(uUnit, 0.2);
  float rough = (valueNoise(p * 0.9) - 0.5) * 0.7 + (valueNoise(p * 2.7 + 5.0) - 0.5) * 0.3;
  float tone = equalize(luma(texture(uPlanes, uv + shiftA * vec2(1.0, -1.0)).rgb)) + uBrightness;
  float x = clamp(tone, 0.0, 0.9999) * uTones + rough * 0.12 * uTexture;
  vec3 color = planeColor(way, x);

  float mottle = (valueNoise(p * 0.02 + seed.z * 50.0) - 0.5) * 0.7 + (valueNoise(p * 0.07 + 9.0) - 0.5) * 0.3;
  float streak = valueNoise(vec2(p.x * 0.004, p.y * 0.35) + seed.x * 20.0) - 0.5;
  float density = 1.0 - uTexture * (0.06 + 0.16 * mottle + 0.14 * streak);
  float pin = smoothstep(0.86, 0.95, valueNoise(p * 0.55 + 31.0)) * smoothstep(0.55, 0.9, valueNoise(p * 0.05 + 7.0));
  density *= 1.0 - pin * uTexture * 0.9;
  color = mix(uPaper, color, clamp(density, 0.0, 1.0));

  vec2 kuv = uv + shiftK * vec2(1.0, -1.0);
  vec3 keySample = texture(uKey, kuv).rgb;
  float kl = equalize(luma(keySample)) + uBrightness * 0.6;
  float speckle = (valueNoise(p * 0.85 + 17.0) - 0.5) * 0.7 + (hash12(floor(p * 1.3)) - 0.5) * 0.3;
  kl += speckle * 0.07 * (0.4 + uTexture);
  float kx = (kl - uInk * 0.42) / max(fwidth(kl), 1e-3) + rough * 2.0 * uTexture;
  float key = 1.0 - clamp(kx + 0.5, 0.0, 1.0);
  float detail = luma(texture(uMid, kuv).rgb) - luma(keySample);
  float lines = smoothstep(0.035, 0.08, detail) * smoothstep(0.0, 0.3, uInk);
  key = max(key, lines * 0.9) * step(0.001, uInk);
  float keyPin = smoothstep(0.8, 0.95, valueNoise(p * 0.8 + 61.0)) * uTexture;
  key *= 0.94 - keyPin * 0.5;
  color = mix(color, uKeyInk, key);

  color = mix(uPaper, color, inside);
  outColor = vec4(color, 1.0);
}`;

const WAYS = {
  marilyn: [
    ['#e8337d', '#1fb7c9', '#ffd84a', '#fff3e6'],
    ['#ff6b1a', '#e8337d', '#9be7ff', '#fffaf0'],
    ['#3a2a9e', '#ff5ca8', '#ffcf3d', '#fff8ee'],
    ['#0a8f7a', '#ffc21a', '#ff86c0', '#fefaf4'],
    ['#d4243c', '#ffa31a', '#5fd8e6', '#fff2f6'],
    ['#5a2bd1', '#3dd27a', '#ffe84d', '#ffffff'],
    ['#1e63d6', '#ff8a2a', '#fff07a', '#ffe9f2'],
    ['#9a1e62', '#ff5f9e', '#a8f2ff', '#fffbe0'],
    ['#f2552c', '#6d3cf0', '#ffd0ec', '#f4ffdb']
  ],
  electric: [
    ['#141218', '#ff2bd1', '#ffe500', '#00e1ff'],
    ['#141218', '#00e1ff', '#ff2bd1', '#fff95c'],
    ['#141218', '#39ff6a', '#ff3b3b', '#fff3a8'],
    ['#1a0f3d', '#ff3d8f', '#00f0d0', '#ffffff'],
    ['#0b1d4f', '#ffde00', '#ff4fd8', '#d7fbff'],
    ['#141218', '#ff6a00', '#00b4ff', '#fef6ff'],
    ['#2b0a3d', '#00ff9c', '#ffe600', '#ff8ad8'],
    ['#141218', '#b04bff', '#38ffe3', '#fffbe6'],
    ['#3d0014', '#ff2bd1', '#7dff3a', '#e8f8ff']
  ],
  candy: [
    ['#f47fb2', '#8fd9ff', '#fff089', '#fffdf7'],
    ['#9c8cff', '#ffb38a', '#b9ffd9', '#fffdf7'],
    ['#5ec8c0', '#ff9fc6', '#fff3a6', '#fffdf7'],
    ['#ff8f70', '#a5e1ff', '#ffe0f0', '#fffdf7'],
    ['#7a9cff', '#ffd36e', '#ffc2e0', '#fffdf7'],
    ['#e86fd0', '#9cf0c4', '#fff6b8', '#fffdf7'],
    ['#5fb0ff', '#ff9a9a', '#fff1c9', '#fffdf7'],
    ['#ffa64d', '#b59cff', '#c9fff1', '#fffdf7'],
    ['#4fd1a0', '#ff8cc6', '#e3f1ff', '#fffdf7']
  ],
  primary: [
    ['#1d3fbf', '#e8262b', '#ffd400', '#fffdf5'],
    ['#e8262b', '#1d3fbf', '#ffd400', '#fffdf5'],
    ['#141218', '#e8262b', '#ffd400', '#fffdf5'],
    ['#1d3fbf', '#ffd400', '#e8262b', '#fffdf5'],
    ['#e8262b', '#ffd400', '#1d3fbf', '#fffdf5'],
    ['#141218', '#1d3fbf', '#ffd400', '#fffdf5'],
    ['#ffd400', '#e8262b', '#1d3fbf', '#fffdf5'],
    ['#1d3fbf', '#fffdf5', '#e8262b', '#ffd400'],
    ['#e8262b', '#141218', '#ffd400', '#fffdf5']
  ]
};

const LAYOUTS = { '2x2': [2, 2], '3x3': [3, 3], strip: [4, 1], single: [1, 1] };

const customWays = colors => {
  const list = (colors || []).slice(0, 8);
  while (list.length < 2) list.push(list.length ? '#ffffff' : '#141218');
  return Array.from({ length: Math.min(9, list.length) }, (_, k) =>
    Array.from({ length: 4 }, (__, band) => list[(k + band) % list.length])
  );
};

export default {
  id: 'warhol',
  name: 'Pop art',
  category: 'print',
  blend: 'normal',
  description: 'The picture repeated in a grid of flat, high-contrast screen-print colorways.',
  preview: { zoom: 1 },
  animated: true,
  animates: params => params.cycle > 0,
  params: [
    {
      key: 'layout',
      label: 'Layout',
      type: 'select',
      default: '2x2',
      options: [
        { value: '2x2', label: '2 × 2' },
        { value: '3x3', label: '3 × 3' },
        { value: 'strip', label: 'Strip of four' },
        { value: 'single', label: 'Single' }
      ]
    },
    {
      key: 'colorway',
      label: 'Colorways',
      type: 'select',
      default: 'marilyn',
      options: [
        { value: 'marilyn', label: 'Marilyn' },
        { value: 'electric', label: 'Electric' },
        { value: 'candy', label: 'Candy' },
        { value: 'primary', label: 'Primary' },
        { value: 'custom', label: 'Custom' }
      ]
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'colors',
      min: 2,
      max: 8,
      default: ['#ff3d8b', '#1fb7c9', '#ffd84a', '#141218', '#fff4e6'],
      when: params => params.colorway === 'custom'
    },
    { key: 'tones', label: 'Tones', type: 'number', min: 2, max: 4, step: 1, default: 3 },
    { key: 'brightness', label: 'Brightness', type: 'number', min: -0.5, max: 0.5, step: 0.01, default: 0 },
    { key: 'ink', label: 'Black ink', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'simplify', label: 'Simplify', type: 'number', min: 0, max: 1, step: 0.01, default: 0.25 },
    { key: 'misregister', label: 'Misregistration', type: 'number', min: 0, max: 1, step: 0.01, default: 0.4 },
    { key: 'texture', label: 'Ink texture', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'gutter', label: 'Gutter', type: 'number', min: 0, max: 40, step: 0.5, default: 12 },
    { key: 'paper', label: 'Paper', type: 'color', default: '#f6f3ec' },
    { key: 'variation', label: 'Variation', type: 'number', min: 0, max: 12, step: 1, default: 0 },
    { key: 'cycle', label: 'Color swap', type: 'number', min: 0, max: 4, step: 0.05, default: 0 }
  ],
  render(ctx, input, params) {
    const unit = ctx.unit;
    let [cols, rows] = LAYOUTS[params.layout] || LAYOUTS['2x2'];
    if (params.layout === 'strip' && ctx.height > ctx.width) [cols, rows] = [rows, cols];
    const gutter = params.gutter * unit;
    const cellW = Math.max(1, (ctx.width - gutter * (cols + 1)) / cols);
    const cellH = Math.max(1, (ctx.height - gutter * (rows + 1)) / rows);
    const sourceAspect = ctx.width / ctx.height;
    const scale = Math.max(1, Math.min(ctx.width / cellW, ctx.height / cellH));
    const planes = gaussianBlur(ctx, input, Math.max(0.5, (0.6 + params.simplify * 9) * unit * scale));
    const key = gaussianBlur(ctx, input, Math.max(0.5, 0.7 * unit * scale));
    const mid = gaussianBlur(ctx, input, Math.max(0.8, 2.2 * unit * scale), { maxSigma: 2.5 });
    const stats = imageStats(ctx, input);
    const cdf = ctx.pass('warhol-cdf', CDF, { input: stats.target, target: ctx.target(64, 1) });
    ctx.release(stats.target);
    const ways = (params.colorway === 'custom' ? customWays(params.colors) : WAYS[params.colorway] || WAYS.marilyn)
      .slice(0, 9)
      .map(way => way.map(hexToRgb));
    const flat = ways.flat();
    while (flat.length < 36) flat.push(flat[flat.length - 1]);
    const output = ctx.pass('warhol', SHADER, {
      input,
      textures: { uPlanes: planes, uKey: key, uMid: mid, uCdf: cdf },
      uniforms: {
        uGrid: [cols, rows],
        uGutter: gutter,
        uWays: flat,
        uWayCount: ways.length,
        uTones: Math.round(params.tones),
        uBrightness: params.brightness * 0.5,
        uInk: params.ink,
        uShift: params.misregister * 16 * unit,
        uTexture: params.texture,
        uPaper: hexToRgb(params.paper),
        uKeyInk: [0.07, 0.065, 0.08],
        uVariation: Math.round(params.variation),
        uCycle: params.cycle > 0 ? ctx.time * params.cycle : 0,
        uSourceAspect: sourceAspect
      }
    });
    ctx.release(planes);
    ctx.release(key);
    ctx.release(mid);
    ctx.release(cdf);
    return output;
  }
};
