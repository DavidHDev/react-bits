import { hexToRgb } from '../engine/assets';
import { gaussianBlur } from '../engine/blur';
import { abstractImage } from './paint';
import { STATS_GLSL, imageStats } from '../engine/stats';

const DOWN = `
uniform float uLod;

void main() {
  outColor = vec4(textureLod(uInput, vUv, uLod).rgb, 1.0);
}`;

const PALETTE_GLSL = `
${STATS_GLSL}
uniform vec3 uInks[12];
uniform float uInkCount;
uniform float uChroma;

vec3 prepare(vec3 c) {
  vec3 lab = toOklab(c);
  float l = luma(c);
  float shifted = autoLevel(l);
  lab.x = clamp(lab.x + (shifted - l) * 0.6, 0.0, 1.0);
  lab.yz *= uChroma;
  return lab;
}

vec4 nearest(vec3 lab) {
  float best = 1e9;
  float second = 1e9;
  float index = 0.0;
  for (int i = 0; i < 12; i++) {
    if (float(i) >= uInkCount) break;
    vec3 ink = toOklab(uInks[i]);
    vec3 d = lab - ink;
    float dist = d.x * d.x + dot(d.yz, d.yz) * 2.2;
    if (dist < best) {
      second = best;
      best = dist;
      index = float(i);
    } else if (dist < second) {
      second = dist;
    }
  }
  return vec4(index, best, second, 0.0);
}

vec3 inkAt(float index) {
  vec3 c = uInks[0];
  for (int i = 0; i < 12; i++) {
    if (float(i) == index) c = uInks[i];
  }
  return c;
}
`;

const QUANT = `
${PALETTE_GLSL}
void main() {
  vec2 t = 1.0 / uResolution;
  vec3 c = texture(uInput, vUv).rgb * 0.25;
  c += (texture(uInput, vUv + vec2(t.x, 0.0)).rgb + texture(uInput, vUv - vec2(t.x, 0.0)).rgb) * 0.125;
  c += (texture(uInput, vUv + vec2(0.0, t.y)).rgb + texture(uInput, vUv - vec2(0.0, t.y)).rgb) * 0.125;
  c += (texture(uInput, vUv + t).rgb + texture(uInput, vUv - t).rgb) * 0.0625;
  c += (texture(uInput, vUv + vec2(t.x, -t.y)).rgb + texture(uInput, vUv - vec2(t.x, -t.y)).rgb) * 0.0625;
  vec3 lab = prepare(c);
  vec4 n = nearest(lab);
  outColor = vec4(n.x, 0.0, 0.0, 1.0);
}`;

const MODE = `
${PALETTE_GLSL}
uniform sampler2D uPlanes;

float inkDistance(vec3 lab, float index) {
  vec3 d = lab - toOklab(inkAt(index));
  return sqrt(d.x * d.x + dot(d.yz, d.yz) * 2.2);
}

void main() {
  ivec2 size = textureSize(uInput, 0);
  ivec2 c = ivec2(gl_FragCoord.xy);
  float counts[12];
  for (int i = 0; i < 12; i++) counts[i] = 0.0;
  for (int y = -2; y <= 2; y++) {
    for (int x = -2; x <= 2; x++) {
      if (x * x + y * y > 5) continue;
      ivec2 q = clamp(c + ivec2(x, y), ivec2(0), size - 1);
      int index = int(texelFetch(uInput, q, 0).r + 0.5);
      counts[index] += x == 0 && y == 0 ? 1.5 : 1.0;
    }
  }
  float best = -1.0;
  float pick = 0.0;
  for (int i = 0; i < 12; i++) {
    if (counts[i] > best) {
      best = counts[i];
      pick = float(i);
    }
  }
  float own = texelFetch(uInput, c, 0).r;
  vec3 lab = prepare(texelFetch(uPlanes, c, 0).rgb);
  float support = counts[int(own + 0.5)];
  if (support > 3.4 && inkDistance(lab, pick) > inkDistance(lab, own) + 0.16) pick = own;
  outColor = vec4(pick, 0.0, 0.0, 1.0);
}`;

const DETAIL = `
uniform float uDetail;

vec3 lab(vec2 uv) {
  return toOklab(texture(uInput, uv).rgb) * vec3(1.0, 1.4, 1.4);
}

void main() {
  vec2 t = 1.0 / uResolution;
  float center = luma(texture(uInput, vUv).rgb);
  float around = 0.0;
  for (int i = 0; i < 8; i++) {
    float a = float(i) * 0.785398;
    around += luma(texture(uInput, vUv + vec2(cos(a), sin(a)) * t * 1.6).rgb);
  }
  around /= 8.0;
  float detail = smoothstep(0.03, 0.09, around - center) * uDetail;
  vec3 gx = lab(vUv + vec2(t.x, 0.0)) - lab(vUv - vec2(t.x, 0.0));
  vec3 gy = lab(vUv + vec2(0.0, t.y)) - lab(vUv - vec2(0.0, t.y));
  float edge = sqrt(dot(gx, gx) + dot(gy, gy)) * 0.5 * uUnit;
  outColor = vec4(detail, edge, 0.0, 1.0);
}`;

const SOFTEN = `
uniform vec2 uStep;

void main() {
  vec3 sum = texture(uInput, vUv).rgb * 0.4;
  sum += (texture(uInput, vUv + uStep).rgb + texture(uInput, vUv - uStep).rgb) * 0.3;
  outColor = vec4(sum, 1.0);
}`;

const PRINT = `
${PALETTE_GLSL}
uniform sampler2D uIndex;
uniform sampler2D uDetail;
uniform sampler2D uTone;
uniform vec3 uPaper;
uniform vec3 uSumi;
uniform vec3 uBandInk;
uniform float uLineAmount;
uniform float uWeight;
uniform float uBokashi;
uniform float uBand;
uniform float uGrain;
uniform float uWashi;
uniform float uSpeckle;

vec4 bspline(float f) {
  float g = 1.0 - f;
  return vec4(g * g * g, 4.0 - 6.0 * f * f + 3.0 * f * f * f, 4.0 - 6.0 * g * g + 3.0 * g * g * g, f * f * f) / 6.0;
}

vec4 vote(vec2 uv) {
  ivec2 size = textureSize(uIndex, 0);
  vec2 pos = uv * vec2(size) - 0.5;
  vec2 base = floor(pos);
  vec2 f = pos - base;
  vec4 wx = bspline(f.x);
  vec4 wy = bspline(f.y);
  float counts[12];
  for (int i = 0; i < 12; i++) counts[i] = 0.0;
  for (int y = 0; y < 4; y++) {
    for (int x = 0; x < 4; x++) {
      ivec2 q = clamp(ivec2(base) + ivec2(x - 1, y - 1), ivec2(0), size - 1);
      int index = int(texelFetch(uIndex, q, 0).r + 0.5);
      counts[index] += wx[x] * wy[y];
    }
  }
  float first = -1.0;
  float second = -1.0;
  float a = 0.0;
  float b = 0.0;
  for (int i = 0; i < 12; i++) {
    float c = counts[i];
    if (c > first) {
      second = first;
      b = a;
      first = c;
      a = float(i);
    } else if (c > second) {
      second = c;
      b = float(i);
    }
  }
  return vec4(a, b, first, max(second, 0.0));
}

vec3 inkOn(vec3 paper, vec3 ink, float density) {
  return paper * pow(clamp(ink / max(paper, vec3(0.02)), 0.002, 1.0), vec3(clamp(density, 0.0, 1.5)));
}

float woodGrain(vec2 p, float block) {
  vec2 q = p + vec2(block * 137.0, block * 59.0);
  float wander = fbm(q * vec2(0.0016, 0.0045)) * 15.0 + valueNoise(q * vec2(0.012, 0.03)) * 2.0;
  float y = q.y + wander;
  float spacing = 5.5 + 3.0 * valueNoise(vec2(q.x * 0.004, y * 0.02) + 4.0);
  float f = fract(y / spacing);
  float ring = pow(f, 5.0) * 0.8 + smoothstep(0.82, 1.0, f) * 0.4;
  float streak = valueNoise(vec2(q.x * 0.008, y * 0.45));
  float fine = valueNoise(vec2(q.x * 0.04, y * 1.8));
  return clamp(ring * 0.75 + (streak - 0.35) * 0.55 + (fine - 0.5) * 0.25, 0.0, 1.0);
}

float fibers(vec2 p) {
  float f = 0.0;
  for (int i = 0; i < 4; i++) {
    float a = float(i) * 1.7 + 0.3;
    vec2 q = rotation(a) * p;
    float bend = valueNoise(q * 0.05 + float(i) * 5.0) * 3.0;
    float n = valueNoise(vec2(q.x * 0.06, q.y * 0.8 + bend) + float(i) * 17.0);
    float strand = 1.0 - abs(n - 0.5) * 14.0;
    f += clamp(strand, 0.0, 1.0) * smoothstep(0.5, 0.8, valueNoise(q * 0.03 + float(i) * 9.0));
  }
  return clamp(f * 0.6, 0.0, 1.0);
}

void main() {
  vec2 p = vUv * uResolution / uUnit;
  vec2 wobble = vec2(valueNoise(p * 0.045), valueNoise(p * 0.045 + 13.0)) - 0.5;
  vec2 uv = vUv + wobble * 1.4 * uUnit / uResolution;

  vec4 v = vote(uv);
  vec3 inkA = inkAt(v.x);
  vec3 inkB = inkAt(v.y);
  float margin = v.z - v.w;
  float aa = max(fwidth(margin), 1e-4);
  float blend = clamp(0.5 + 0.5 * margin / aa, 0.0, 1.0);
  vec3 ink = mix(inkB, inkA, blend);
  float block = blend > 0.5 ? v.x : v.y;

  float tone = toOklab(texture(uTone, vUv).rgb).x;
  float inkL = toOklab(ink).x;
  float paperL = toOklab(uPaper).x;
  float lift = clamp((tone - inkL) / max(paperL - inkL, 0.05), -1.0, 1.0);
  float density = 1.0 - max(lift, 0.0) * uBokashi * 0.85 + min(lift, 0.0) * uBokashi * 0.15;

  float grain = woodGrain(p, block);
  density *= 1.0 - uGrain * 0.4 * grain;
  float speck = smoothstep(0.62, 0.86, valueNoise(p * 1.35 + block * 7.0)) * smoothstep(0.25, 0.75, valueNoise(p * 0.08 + 3.0));
  density *= 1.0 - uSpeckle * speck * 0.75;

  float fiber = fibers(p);
  float mottle = fbm(p * 0.012) - 0.5 + (valueNoise(p * 0.08) - 0.5) * 0.3;
  vec3 paper = uPaper * (1.0 + mottle * 0.14 * uWashi) * (1.0 + fiber * 0.05 * uWashi);
  density *= 1.0 - fiber * 0.14 * uWashi - mottle * 0.4 * uWashi;

  vec3 color = inkOn(paper, ink, density);

  float top = 1.0 - vUv.y;
  float band = (1.0 - smoothstep(0.0, 0.07 + 0.2 * uBand, top)) * uBand;
  band *= 1.0 - uGrain * 0.25 * woodGrain(p * 1.3, 11.0);
  color = inkOn(color, uBandInk, band * 0.95);

  vec3 la = toOklab(inkA);
  vec3 lb = toOklab(inkB);
  vec3 dl = la - lb;
  float contrast = smoothstep(0.04, 0.12, sqrt(dl.x * dl.x + dot(dl.yz, dl.yz) * 1.5));
  float cut = (valueNoise(p * 0.08 + 21.0) - 0.5) * 0.5 + (valueNoise(p * 0.5) - 0.5) * 0.15 + (valueNoise(p * 1.7 + 5.0) - 0.5) * 0.12;
  float width = 0.17 * uWeight * (1.0 + cut);
  float laa = fwidth(margin) * 0.8 + 1e-4;
  vec2 detailMap = texture(uDetail, uv).rg;
  float sharp = smoothstep(0.0035, 0.014, detailMap.g);
  float line = (1.0 - smoothstep(width - laa, width + laa, margin)) * contrast * sharp * step(0.001, v.w);
  float detail = detailMap.r;
  float dw = 0.2 + cut * 0.12;
  line = max(line, smoothstep(dw - 0.05, dw + 0.05, detail));
  line *= uLineAmount;
  float lineSpeck = smoothstep(0.7, 0.92, valueNoise(p * 0.9 + 41.0)) * uSpeckle * 0.5;
  line *= 1.0 - lineSpeck;
  line *= 1.0 - uGrain * 0.15 * grain;
  color = inkOn(color, uSumi, line * 0.97);

  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;

const PALETTES = {
  hiroshige: {
    inks: [
      '#efe5cf',
      '#262123',
      '#1f3f6e',
      '#5f8fb8',
      '#a9c3d3',
      '#c8553d',
      '#e2a08f',
      '#d6a446',
      '#5c8a5a',
      '#8b8580',
      '#6c6a86'
    ],
    band: '#1c3a66'
  },
  hokusai: {
    inks: ['#efe5cf', '#2a2627', '#1b3a63', '#3f6c98', '#8fb0c6', '#c9d6d8', '#cdbb98', '#e3cfa4', '#7d8a8c'],
    band: '#1b3a63'
  },
  autumn: {
    inks: ['#f1e2c4', '#231a1d', '#3a1d2e', '#6e2433', '#a63a35', '#d9783a', '#e6b562', '#6b6a3a', '#9a6a4f'],
    band: '#4a1f2c'
  },
  night: {
    inks: ['#e9dcbc', '#151418', '#1d2540', '#2f3f63', '#5b6a7d', '#9aa0a3', '#e3cf8a', '#4a3f5c'],
    band: '#141a33'
  }
};

export default {
  id: 'woodblock',
  name: 'Woodblock',
  category: 'print',
  description: 'A Japanese woodblock print with flat color planes, carved key lines, wood grain and soft gradients.',
  preview: { zoom: 1 },
  animated: false,
  params: [
    {
      key: 'palette',
      label: 'Palette',
      type: 'select',
      default: 'hiroshige',
      options: [
        { value: 'hiroshige', label: 'Hiroshige' },
        { value: 'hokusai', label: 'Prussian blue' },
        { value: 'autumn', label: 'Autumn' },
        { value: 'night', label: 'Night' }
      ]
    },
    { key: 'simplify', label: 'Simplify', type: 'number', min: 1, max: 12, step: 0.1, default: 5 },
    { key: 'lines', label: 'Key lines', type: 'number', min: 0, max: 1, step: 0.01, default: 0.9 },
    { key: 'weight', label: 'Line weight', type: 'number', min: 0.5, max: 4, step: 0.05, default: 2 },
    { key: 'detail', label: 'Detail lines', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'bokashi', label: 'Soft gradients', type: 'number', min: 0, max: 1, step: 0.01, default: 0.6 },
    { key: 'band', label: 'Sky band', type: 'number', min: 0, max: 1, step: 0.01, default: 0.45 },
    { key: 'grain', label: 'Wood grain', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'washi', label: 'Paper fibers', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'speckle', label: 'Ink speckle', type: 'number', min: 0, max: 1, step: 0.01, default: 0.35 },
    { key: 'paper', label: 'Paper', type: 'color', default: '#efe5cf' }
  ],
  render(ctx, input, params) {
    const palette = PALETTES[params.palette] || PALETTES.hiroshige;
    const inks = palette.inks.map(hexToRgb);
    inks[0] = hexToRgb(params.paper);
    const count = inks.length;
    while (inks.length < 12) inks.push(inks[inks.length - 1]);
    const longSide = Math.max(ctx.width, ctx.height);
    const texel = 0.6 + params.simplify * 0.2;
    const scale = Math.min(2, 1000 / texel / longSide);
    const ww = Math.max(2, Math.round(ctx.width * scale));
    const wh = Math.max(2, Math.round(ctx.height * scale));
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const small = ctx.pass('wood-down', DOWN, {
      input: source,
      target: ctx.target(ww, wh),
      uniforms: { uLod: Math.max(0, Math.log2(1 / scale) - 0.5) }
    });
    const work = { ...ctx, width: ww, height: wh, unit: Math.max(ww, wh) / 1000 };
    const { painted, tensor } = abstractImage(work, small, {
      radius: texel * 2.6,
      flow: 0.8,
      sharpness: 10
    });
    ctx.release(small);
    ctx.release(tensor);
    const stats = imageStats(ctx, input);
    const shared = {
      uStatsTop: stats.top,
      uInks: inks,
      uInkCount: count,
      uChroma: 1.25
    };
    const quant = ctx.pass('wood-quant', QUANT, {
      input: painted,
      target: ctx.target(painted.width, painted.height, { filter: 'nearest' }),
      textures: { uStats: stats.target },
      uniforms: shared
    });
    const cleaned = ctx.pass('wood-mode', MODE, {
      input: quant,
      target: ctx.target(painted.width, painted.height, { filter: 'nearest' }),
      textures: { uPlanes: painted, uStats: stats.target },
      uniforms: shared
    });
    ctx.release(quant);
    const index = ctx.pass('wood-mode', MODE, {
      input: cleaned,
      target: ctx.target(painted.width, painted.height, { filter: 'nearest' }),
      textures: { uPlanes: painted, uStats: stats.target },
      uniforms: shared
    });
    ctx.release(cleaned);
    const rawDetail = ctx.pass('wood-detail', DETAIL, {
      input: painted,
      target: ctx.target(painted.width, painted.height),
      uniforms: { uDetail: params.detail }
    });
    const across = ctx.pass('wood-soften', SOFTEN, {
      input: rawDetail,
      target: ctx.target(painted.width, painted.height),
      uniforms: { uStep: [1 / painted.width, 0] }
    });
    ctx.release(rawDetail);
    const detail = ctx.pass('wood-soften', SOFTEN, {
      input: across,
      target: ctx.target(painted.width, painted.height),
      uniforms: { uStep: [0, 1 / painted.height] }
    });
    ctx.release(across);
    const tone = gaussianBlur(ctx, input, 18 * ctx.unit, { maxSigma: 2.5 });
    const output = ctx.pass('wood-print', PRINT, {
      input,
      textures: { uIndex: index, uDetail: detail, uTone: tone, uStats: stats.target },
      uniforms: {
        ...shared,
        uPaper: hexToRgb(params.paper),
        uSumi: [0.13, 0.115, 0.12],
        uBandInk: hexToRgb(palette.band),
        uLineAmount: params.lines,
        uWeight: params.weight,
        uBokashi: params.bokashi,
        uBand: params.band,
        uGrain: params.grain,
        uWashi: params.washi,
        uSpeckle: params.speckle
      }
    });
    ctx.release(painted);
    ctx.release(index);
    ctx.release(detail);
    ctx.release(tone);
    ctx.release(stats.target);
    return output;
  }
};
