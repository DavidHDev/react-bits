import { hexToRgb } from '../engine/assets';
import { imageStats } from '../engine/stats';

const LUMA_TABLE = [
  16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56, 14, 17, 22, 29, 51,
  87, 80, 62, 18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113, 92, 49, 64, 78, 87, 103, 121, 120, 101,
  72, 92, 95, 98, 112, 100, 103, 99
];

const CHROMA_TABLE = [
  17, 18, 24, 47, 99, 99, 99, 99, 18, 21, 26, 66, 99, 99, 99, 99, 24, 26, 56, 99, 99, 99, 99, 99, 47, 66, 99, 99, 99,
  99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99,
  99, 99, 99, 99, 99, 99
];

const SAMPLE = `
uniform float uCell;
uniform vec2 uImage;
uniform float uLod;

vec3 tap(vec2 p) {
  return textureLod(uInput, vec2(p.x / uImage.x, 1.0 - p.y / uImage.y), uLod).rgb;
}

void main() {
  vec2 center = (floor(gl_FragCoord.xy) + 0.5) * uCell;
  float q = uCell * 0.25;
  vec3 c = (tap(center + vec2(-q, -q)) + tap(center + vec2(q, -q)) + tap(center + vec2(-q, q)) + tap(center + vec2(q, q))) * 0.25;
  outColor = vec4(
    dot(c, vec3(0.299, 0.587, 0.114)) - 0.5,
    dot(c, vec3(-0.168736, -0.331264, 0.5)),
    dot(c, vec3(0.5, -0.418688, -0.081312)),
    1.0
  );
}`;

const ROWS = `
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  int u = p.x % 8;
  int start = p.x - u;
  vec3 sum = vec3(0.0);
  for (int x = 0; x < 8; x++) {
    sum += texelFetch(uInput, ivec2(start + x, p.y), 0).rgb * cos(float((2 * x + 1) * u) * PI / 16.0);
  }
  outColor = vec4(sum, 1.0);
}`;

const QUANTIZE = `
uniform vec4 uLumaSteps[16];
uniform vec4 uChromaSteps[16];

void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  int u = p.x % 8;
  int v = p.y % 8;
  int start = p.y - v;
  vec3 sum = vec3(0.0);
  for (int y = 0; y < 8; y++) {
    sum += texelFetch(uInput, ivec2(p.x, start + y), 0).rgb * cos(float((2 * y + 1) * v) * PI / 16.0);
  }
  float cu = u == 0 ? 0.70710678 : 1.0;
  float cv = v == 0 ? 0.70710678 : 1.0;
  vec3 coefficient = sum * 0.25 * cu * cv;
  int index = v * 8 + u;
  float lumaStep = uLumaSteps[index / 4][index % 4];
  float chromaStep = uChromaSteps[index / 4][index % 4];
  vec3 q = vec3(lumaStep, chromaStep, chromaStep);
  vec3 kept = floor(coefficient / q + 0.5) * q;
  outColor = vec4(kept * cu * cv, 1.0);
}`;

const INVERSE_COLUMNS = `
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  int y = p.y % 8;
  int start = p.y - y;
  vec3 sum = vec3(0.0);
  for (int v = 0; v < 8; v++) {
    sum += texelFetch(uInput, ivec2(p.x, start + v), 0).rgb * cos(float((2 * y + 1) * v) * PI / 16.0);
  }
  outColor = vec4(sum, 1.0);
}`;

const ERROR = `
uniform sampler2D uSamples;

vec3 toRgb(vec3 c) {
  float y = c.x + 0.5;
  return vec3(y + 1.402 * c.z, y - 0.344136 * c.y - 0.714136 * c.z, y + 1.772 * c.y);
}

void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  int x = p.x % 8;
  int start = p.x - x;
  vec3 sum = vec3(0.0);
  for (int u = 0; u < 8; u++) {
    sum += texelFetch(uInput, ivec2(start + u, p.y), 0).rgb * cos(float((2 * x + 1) * u) * PI / 16.0);
  }
  vec3 rebuilt = clamp(toRgb(sum * 0.25), 0.0, 1.0);
  vec3 original = clamp(toRgb(texelFetch(uSamples, p, 0).rgb), 0.0, 1.0);
  outColor = vec4(abs(original - rebuilt), 1.0);
}`;

const COMPOSITE = `
uniform sampler2D uError;
uniform sampler2D uStats;
uniform float uStatsTop;
uniform vec2 uErrorScale;
uniform vec2 uErrorTexel;
uniform float uSoften;
uniform float uDetail;
uniform vec3 uPalette[6];
uniform float uMode;
uniform float uIntensity;
uniform float uBackground;
uniform float uBlock;
uniform float uGrid;
uniform float uLine;
uniform vec4 uRegions[4];
uniform float uGains[4];
uniform float uRegionCount;
uniform float uMarkers;
uniform float uScan;

vec3 paletteAt(float t) {
  float x = clamp(t, 0.0, 1.0) * 5.0;
  float index = floor(x);
  float f = x - index;
  vec3 a = uPalette[0];
  vec3 b = uPalette[0];
  for (int i = 0; i < 6; i++) {
    if (float(i) == index) a = uPalette[i];
    if (float(i) == min(index + 1.0, 5.0)) b = uPalette[i];
  }
  return mix(a, b, f);
}

float bracket(vec2 p, vec4 r, float arm, float w) {
  vec2 mid = (r.xy + r.zw) * 0.5;
  vec2 corner = vec2(p.x < mid.x ? r.x : r.z, p.y < mid.y ? r.y : r.w);
  vec2 inward = vec2(p.x < mid.x ? 1.0 : -1.0, p.y < mid.y ? 1.0 : -1.0);
  vec2 q = (p - corner) * inward;
  float dh = length(vec2(q.x - clamp(q.x, 0.0, arm), q.y));
  float dv = length(vec2(q.x, q.y - clamp(q.y, 0.0, arm)));
  return smoothstep(w * 0.5 + 0.75, w * 0.5 - 0.75, min(dh, dv));
}

float errorAt(vec2 uv, float lod) {
  return luma(textureLod(uError, uv, lod).rgb);
}

void main() {
  vec2 p = vUv * uResolution;
  vec2 top = vec2(p.x, uResolution.y - p.y);
  vec2 euv = top * uErrorScale;
  vec3 color = texture(uInput, vUv).rgb;
  vec3 crisp = textureLod(uError, euv, 0.0).rgb;
  vec2 o = uErrorTexel * exp2(uSoften) * 0.5;
  float soft = errorAt(euv + vec2(-o.x, -o.y), uSoften) + errorAt(euv + vec2(o.x, -o.y), uSoften);
  soft = (soft + errorAt(euv + vec2(-o.x, o.y), uSoften) + errorAt(euv + vec2(o.x, o.y), uSoften)) * 0.25;
  float mean = textureLod(uStats, vec2(0.5), uStatsTop).r + 0.0015;
  float gain = 1.0;
  float cold = 0.0;
  for (int i = 0; i < 4; i++) {
    if (float(i) >= uRegionCount) break;
    vec4 r = uRegions[i] * uResolution.xyxy;
    if (p.x > r.x && p.x < r.z && p.y > r.y && p.y < r.w) {
      gain = uGains[i];
      cold = step(gain, 0.999);
    }
  }
  float boost = 1.0;
  float sweep = 0.0;
  if (uScan > -1.5) {
    float d = (vUv.y - uScan) * uResolution.y / max(uResolution.x, uResolution.y);
    sweep = exp(-d * d * 4000.0);
    boost += sweep * 1.5 + step(0.0, d) * exp(-d * 7.0) * 0.8;
  }
  float level = mix(soft, luma(crisp), uDetail) / mean * gain * boost;
  float t = 1.0 - exp(-pow(max(level - 0.4, 0.0) * 0.6 * uIntensity, 1.5));
  float l = luma(color);
  vec3 glow;
  if (uMode < 0.5) {
    glow = paletteAt(t * (0.3 + 1.1 * l));
  } else if (uMode < 1.5) {
    vec3 vivid = clamp(mix(vec3(l), color, 1.6), 0.0, 1.0);
    glow = clamp(vivid * (0.7 + 1.6 * t), 0.0, 1.0) * t;
  } else {
    glow = clamp(crisp / mean * gain * boost * 0.16 * uIntensity, 0.0, 1.0);
  }
  vec3 base = color * uBackground * (1.0 - cold * 0.45);
  vec3 outc = 1.0 - (1.0 - base) * (1.0 - glow);
  vec3 ink = uMode < 0.5 ? paletteAt(0.72) : vec3(0.85);
  if (uGrid > 0.5) {
    vec2 g = abs(fract(top / uBlock - 0.5) - 0.5) * uBlock;
    float line = smoothstep(uLine * 0.4 + 0.5, uLine * 0.4 - 0.5, min(g.x, g.y));
    outc = mix(outc, ink, line * 0.2);
  }
  if (uMarkers > 0.5) {
    for (int i = 0; i < 4; i++) {
      if (float(i) >= uRegionCount) break;
      vec4 r = uRegions[i] * uResolution.xyxy;
      float arm = min(r.z - r.x, r.w - r.y) * 0.18;
      outc = mix(outc, vec3(0.88), bracket(p, r, arm, uLine) * 0.9);
    }
  }
  outc = mix(outc, ink, sweep * 0.5);
  outColor = vec4(outc, 1.0);
}`;

const PALETTES = {
  heat: ['#000000', '#3a0a06', '#b3200e', '#f2661c', '#ffc23d', '#fff6dc'],
  ice: ['#000000', '#06142e', '#0f4a9c', '#1aa3e8', '#8fe3ff', '#f2fdff'],
  toxic: ['#000000', '#07200c', '#0f6b2a', '#36c24a', '#c8f25a', '#f8ffe0'],
  mono: ['#000000', '#262626', '#5c5c5c', '#9a9a9a', '#d4d4d4', '#ffffff']
};

const MODES = { picture: 1, raw: 2 };

const steps = (table, quality) => {
  const q = Math.min(Math.max(quality, 1), 100);
  const scale = q < 50 ? 5000 / q : 200 - q * 2;
  const values = table.map(base => Math.min(Math.max(Math.floor((scale * base + 50) / 100), 1), 255) / 255);
  return Array.from({ length: 16 }, (_, index) => values.slice(index * 4, index * 4 + 4));
};

const random = seed => {
  let s = (Math.floor(seed) * 2654435761 + 1013904223) >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const overlaps = (a, b) => a[0] < b[2] + 0.04 && a[2] > b[0] - 0.04 && a[1] < b[3] + 0.04 && a[3] > b[1] - 0.04;

const regionsFor = (count, variation) => {
  const next = random(variation + 11);
  const regions = [];
  for (let attempt = 0; attempt < 200 && regions.length < count; attempt += 1) {
    const w = 0.16 + next() * 0.2;
    const h = 0.28 + next() * 0.34;
    const x = 0.06 + next() * (0.88 - w);
    const y = 0.06 + next() * (0.88 - h);
    const box = [x, y, x + w, y + h];
    if (!regions.some(region => overlaps(box, region))) regions.push(box);
  }
  return regions;
};

export default {
  id: 'forensics',
  name: 'Forensics',
  category: 'glitch',
  description: 'Error level analysis: JPEG re-save errors glow as heat over a darkened picture.',
  animated: true,
  animates: params => params.scan > 0,
  params: [
    {
      key: 'palette',
      label: 'Palette',
      type: 'select',
      default: 'heat',
      options: [
        { value: 'heat', label: 'Heat' },
        { value: 'ice', label: 'Ice' },
        { value: 'toxic', label: 'Toxic' },
        { value: 'mono', label: 'Mono' },
        { value: 'picture', label: 'Picture colors' },
        { value: 'raw', label: 'Raw error' }
      ]
    },
    { key: 'intensity', label: 'Intensity', type: 'number', min: 0, max: 3, step: 0.01, default: 1 },
    { key: 'detail', label: 'Detail', type: 'number', min: 0, max: 1, step: 0.01, default: 0.35 },
    { key: 'quality', label: 'Re-save quality', type: 'number', min: 10, max: 98, step: 1, default: 80 },
    { key: 'size', label: 'Block size', type: 'number', min: 3, max: 40, step: 0.5, default: 8 },
    { key: 'background', label: 'Photo brightness', type: 'number', min: 0, max: 1, step: 0.01, default: 0.12 },
    { key: 'regions', label: 'Suspect regions', type: 'number', min: 0, max: 4, step: 1, default: 2 },
    { key: 'markers', label: 'Markers', type: 'boolean', default: true },
    { key: 'grid', label: 'Block grid', type: 'boolean', default: false },
    { key: 'scan', label: 'Scan speed', type: 'number', min: 0, max: 2, step: 0.01, default: 0 },
    { key: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 3 }
  ],
  render(ctx, input, params) {
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const block = Math.max(8, params.size * ctx.unit);
    const cell = block / 8;
    const cols = Math.ceil(ctx.width / block) * 8;
    const rows = Math.ceil(ctx.height / block) * 8;
    const samples = ctx.pass('forensics-sample', SAMPLE, {
      input: source,
      size: [cols, rows],
      uniforms: { uCell: cell, uImage: [ctx.width, ctx.height], uLod: Math.log2(Math.max(cell * 0.5, 1)) }
    });
    const frequencies = ctx.pass('forensics-rows', ROWS, { input: samples, size: [cols, rows] });
    const coefficients = ctx.pass('forensics-quantize', QUANTIZE, {
      input: frequencies,
      size: [cols, rows],
      uniforms: { uLumaSteps: steps(LUMA_TABLE, params.quality), uChromaSteps: steps(CHROMA_TABLE, params.quality) }
    });
    ctx.release(frequencies);
    const partial = ctx.pass('forensics-inverse', INVERSE_COLUMNS, { input: coefficients, size: [cols, rows] });
    ctx.release(coefficients);
    const error = ctx.pass('forensics-error', ERROR, {
      input: partial,
      size: [cols, rows],
      textures: { uSamples: samples }
    });
    ctx.release(partial);
    ctx.release(samples);
    const stats = imageStats(ctx, error);
    ctx.mipmap(error);
    const colors = (PALETTES[params.palette] || PALETTES.heat).map(hexToRgb);
    const regions = regionsFor(Math.round(params.regions), params.variation);
    const count = regions.length;
    while (regions.length < 4) regions.push([0, 0, 0, 0]);
    const gains = [2.4, 0.3, 1.8, 0.45];
    const scan = params.scan > 0 ? 1.1 - ((ctx.time * params.scan * 0.2) % 1) * 1.4 : -2;
    const output = ctx.pass('forensics-composite', COMPOSITE, {
      input,
      textures: { uError: error, uStats: stats.target },
      uniforms: {
        uStatsTop: stats.top,
        uErrorScale: [1 / (cols * cell), 1 / (rows * cell)],
        uErrorTexel: [1 / cols, 1 / rows],
        uSoften: Math.log2(Math.max(1, (3 * ctx.unit) / cell)),
        uDetail: params.detail,
        uPalette: colors,
        uMode: MODES[params.palette] ?? 0,
        uIntensity: params.intensity,
        uBackground: params.background,
        uBlock: block,
        uGrid: params.grid ? 1 : 0,
        uLine: Math.max(1, 1.5 * ctx.unit),
        uRegions: regions.map(r => [r[0], 1 - r[3], r[2], 1 - r[1]]),
        uGains: gains,
        uRegionCount: count,
        uMarkers: params.markers ? 1 : 0,
        uScan: scan
      }
    });
    ctx.release(error);
    ctx.release(stats.target);
    return output;
  }
};
