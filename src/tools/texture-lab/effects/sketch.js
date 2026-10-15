import { hexToRgb } from '../engine/assets';
import { gaussianBlur } from '../engine/blur';
import { STATS_GLSL, imageStats } from '../engine/stats';

const TENSOR = `
vec3 tap(vec2 offset) {
  return texture(uInput, vUv + offset / uResolution).rgb;
}

void main() {
  float tl = luma(tap(vec2(-1.0, 1.0)));
  float tc = luma(tap(vec2(0.0, 1.0)));
  float tr = luma(tap(vec2(1.0, 1.0)));
  float ml = luma(tap(vec2(-1.0, 0.0)));
  float mr = luma(tap(vec2(1.0, 0.0)));
  float bl = luma(tap(vec2(-1.0, -1.0)));
  float bc = luma(tap(vec2(0.0, -1.0)));
  float br = luma(tap(vec2(1.0, -1.0)));
  float gx = (tr + 2.0 * mr + br - tl - 2.0 * ml - bl) * 0.25;
  float gy = (tl + 2.0 * tc + tr - bl - 2.0 * bc - br) * 0.25;
  outColor = vec4(gx * gx, gx * gy, gy * gy, 1.0);
}`;

const DOWN = `
uniform float uLod;

void main() {
  outColor = vec4(textureLod(uInput, vUv, uLod).rgb, 1.0);
}`;

const SMOOTH = `
uniform vec2 uStep;

void main() {
  vec3 sum = texture(uInput, vUv).rgb * 0.2270270270;
  sum += (texture(uInput, vUv + uStep * 1.3846153846).rgb + texture(uInput, vUv - uStep * 1.3846153846).rgb) * 0.3162162162;
  sum += (texture(uInput, vUv + uStep * 3.2307692308).rgb + texture(uInput, vUv - uStep * 3.2307692308).rgb) * 0.0702702703;
  outColor = vec4(sum, 1.0);
}`;

const COARSE = `
vec3 lab(vec2 offset) {
  return toOklab(texture(uInput, vUv + offset / uResolution).rgb) * vec3(1.0, 1.6, 1.6);
}

void main() {
  float h = 1.0;
  vec3 gx = (lab(vec2(h, 0.0)) - lab(vec2(-h, 0.0))) * 0.5;
  vec3 gy = (lab(vec2(0.0, h)) - lab(vec2(0.0, -h))) * 0.5;
  float e = dot(gx, gx);
  float f = dot(gx, gy);
  float g = dot(gy, gy);
  float root = sqrt(max((e - g) * (e - g) + 4.0 * f * f, 0.0));
  float major = 0.5 * (e + g + root);
  vec2 a = vec2(f, major - e);
  vec2 b = vec2(major - g, f);
  vec2 n = dot(a, a) > dot(b, b) ? a : b;
  n = dot(n, n) > 1e-14 ? normalize(n) : vec2(1.0, 0.0);
  float m = sqrt(major) * uUnit;
  outColor = vec4(n, m, 1.0);
}`;

const EDGES = `
uniform sampler2D uWide;
uniform sampler2D uCoarse;
uniform float uThreshold;
uniform float uGain;
uniform float uGate;
uniform vec2 uStep;

void main() {
  vec3 s = texture(uInput, vUv).rgb;
  vec3 w = texture(uWide, vUv).rgb;
  float d = luma(w) - luma(s);
  float fine = clamp((d - uThreshold) * uGain, 0.0, 1.0);

  vec3 c = texture(uCoarse, vUv).rgb;
  vec2 n = c.xy;
  float m0 = c.z;
  float mp = texture(uCoarse, vUv + n * uStep).z;
  float mn = texture(uCoarse, vUv - n * uStep).z;
  float d1 = (mp - mn) * 0.5;
  float d2 = mp + mn - 2.0 * m0;
  float x = d2 < 0.0 ? abs(d1 / d2) : 9.0;
  float line = 1.0 - smoothstep(0.3, 0.75, x);
  line *= smoothstep(uGate * 0.6, uGate * 6.0, m0);
  outColor = vec4(fine, line, 0.0, 1.0);
}`;

const FLOW_GLSL = `
vec3 orient(vec3 t) {
  float root = sqrt(max((t.x - t.z) * (t.x - t.z) + 4.0 * t.y * t.y, 0.0));
  float major = 0.5 * (t.x + t.z + root);
  float minor = 0.5 * (t.x + t.z - root);
  vec2 a = vec2(major - t.x, -t.y);
  vec2 b = vec2(-t.y, major - t.z);
  vec2 dir = dot(a, a) > dot(b, b) ? a : b;
  dir = dot(dir, dir) > 1e-14 ? normalize(dir) : vec2(1.0, 0.0);
  float coherence = (major - minor) / max(major + minor, 1e-7);
  return vec3(dir, coherence);
}
`;

const CONTOUR = `
uniform sampler2D uDir;
uniform sampler2D uCoarse;
uniform float uReach;
uniform float uCoarseReach;
uniform float uBoil;
uniform float uSeed;
${FLOW_GLSL}

float traceFine(vec2 uv, vec2 dir, vec2 texel) {
  float sum = 0.0;
  float total = 0.0;
  for (int i = -6; i <= 6; i++) {
    float k = float(i) / 6.0;
    float w = 1.0 - k * k * 0.7;
    sum += texture(uInput, uv + dir * k * uReach * texel).r * w;
    total += w;
  }
  return sum / total;
}

float traceCoarse(vec2 uv, vec2 dir, vec2 texel) {
  float sum = 0.0;
  float total = 0.0;
  for (int i = -5; i <= 5; i++) {
    float k = float(i) / 5.0;
    float w = 1.0 - k * k * 0.6;
    sum += texture(uInput, uv + dir * k * uCoarseReach * texel).g * w;
    total += w;
  }
  return sum / total;
}

void main() {
  vec2 texel = 1.0 / uResolution;
  vec2 p = vUv * uResolution / uUnit;
  vec2 uv = vUv;
  if (uBoil > 0.0) {
    vec2 n = vec2(valueNoise(p * 0.05 + uSeed), valueNoise(p * 0.05 + uSeed + 19.7)) - 0.5;
    uv += n * uBoil * 2.4 * uUnit * texel;
  }
  vec3 o = orient(texture(uDir, uv).rgb);
  vec2 dir = o.xy;
  float jitter = (valueNoise(p * 0.02 + 3.1 + uSeed * uBoil * 0.37) - 0.5) * 0.14;
  vec2 side = vec2(-dir.y, dir.x) * 0.4 * uUnit * texel;
  float a = traceFine(uv + side, rotation(jitter + 0.03) * dir, texel);
  float b = traceFine(uv - side, rotation(jitter - 0.045) * dir, texel);
  vec2 g = texture(uCoarse, uv).xy;
  vec2 tangent = vec2(-g.y, g.x);
  vec2 sideC = g * 0.35 * uUnit * texel;
  float ca = traceCoarse(uv + sideC, rotation(jitter * 0.4 + 0.015) * tangent, texel);
  float cb = traceCoarse(uv - sideC, rotation(jitter * 0.4 - 0.025) * tangent, texel);
  outColor = vec4(a, b, max(ca, cb * 0.85), 1.0);
}`;

const FINAL = `
${STATS_GLSL}
${FLOW_GLSL}
uniform sampler2D uContour;
uniform sampler2D uFlow;
uniform sampler2D uTone;
uniform sampler2D uSmudge;
uniform vec3 uPaper;
uniform vec3 uLead;
uniform float uMedium;
uniform float uOutline;
uniform float uShading;
uniform float uLength;
uniform float uSpacing;
uniform float uWidth;
uniform float uAngle;
uniform float uFollow;
uniform float uSmudgeAmount;
uniform float uGrain;
uniform float uBoil;
uniform float uSeed;
uniform float uRough;
uniform float uDepth;
uniform float uStrokeOpacity;

float hatch(vec2 p, float theta, float amount, float layer, float tilt) {
  vec2 q = rotation(theta) * p;
  float row = floor(q.y / uSpacing);
  float keep = 1.0;
  float aa = 0.7 / uUnit;
  float reach = smoothstep(0.0, 0.3, amount);
  float opacity = clamp(amount * 1.7, 0.0, 1.0);
  float width = uWidth * mix(0.7, 1.25, amount);
  for (int dy = -1; dy <= 1; dy++) {
    float r = row + float(dy);
    float shift = hash11(r * 0.731 + layer * 17.0) * uLength;
    float x = (q.x - shift) / uLength;
    float col = floor(x);
    float side = fract(x) < 0.5 ? -1.0 : 1.0;
    for (int k = 0; k < 2; k++) {
      float c = col + float(k) * side;
      vec2 cell = vec2(c, r) + layer * vec2(113.0, 57.0);
      float renew = uBoil > 0.0 ? step(hash12(cell + 71.3), uBoil) : 0.0;
      vec3 h = hash32(cell + renew * uSeed * vec2(17.31, 9.77));
      float vis = smoothstep(h.x - 0.12, h.x + 0.02, reach);
      if (vis <= 0.001) continue;
      vec3 g = fract(h.zxy * vec3(7.31, 13.7, 5.13) + h.yzx * 3.1);
      float len = uLength * (0.8 + 0.3 * h.y);
      vec2 center = vec2(shift + (c + 0.5 + (h.z - 0.5) * 0.25) * uLength, (r + 0.5 + (g.x - 0.5) * 0.3) * uSpacing);
      vec2 d = q - center;
      float turn = tilt + (g.y - 0.5) * 0.06;
      d = vec2(d.x + turn * d.y, d.y - turn * d.x);
      float u = d.x / len + 0.5;
      if (u < 0.0 || u > 1.0) continue;
      float bow = (g.z - 0.5) * 0.5 * uSpacing;
      float off = abs(d.y - bow * 4.0 * u * (1.0 - u));
      float pressure = mix(1.0, 0.4, pow(u, 1.4)) * smoothstep(0.0, 0.05, u) * smoothstep(1.0, 0.82, u);
      float w = width * (0.6 + 0.4 * pressure);
      float cov = 1.0 - smoothstep(w - aa, w + aa, off);
      keep *= 1.0 - cov * vis * opacity * mix(0.45, 1.0, pressure);
    }
  }
  return 1.0 - keep;
}

float hatchField(vec2 p, float theta, float amount, float layer) {
  float tilt = (valueNoise(p * 0.045 + layer * 7.0 + uSeed * uBoil * 0.13) - 0.5) * 0.26;
  float steps = 12.0;
  float x = theta / PI * steps;
  float i0 = floor(x);
  float f = smoothstep(0.35, 0.65, x - i0);
  float a = f < 0.999 ? hatch(p, i0 / steps * PI, amount, layer, tilt) : 0.0;
  float b = f > 0.001 ? hatch(p, (i0 + 1.0) / steps * PI, amount, layer, tilt) : 0.0;
  return mix(a, b, f);
}

float grainAt(vec2 p) {
  return valueNoise(p * 0.6) * 0.45 + valueNoise(p * 1.4 + 7.0) * 0.35 + valueNoise(p * 3.1 + 3.0) * 0.2;
}

void main() {
  vec2 p = vUv * uResolution / uUnit;
  vec3 source = texture(uTone, vUv).rgb;
  float lum = luma(source);
  float level = mix(lum, autoLevel(lum), 0.35);
  float tone = smoothstep(0.08, 0.92, 1.0 - level);
  bool colored = uMedium > 0.5 && uMedium < 1.5;

  vec3 vivid = clamp(mix(vec3(lum), source, 1.15), 0.0, 1.0);
  float amount = 1.0 - min(min(vivid.r, vivid.g), vivid.b);
  vec3 pigment = clamp(1.0 - (1.0 - vivid) / max(amount, 0.05), 0.0, 1.0);
  float drive = colored ? max(smoothstep(0.05, 0.85, amount), tone * 0.85) : tone;

  vec3 o = orient(texture(uFlow, vUv).rgb);
  vec2 baseDir = vec2(cos(uAngle), sin(uAngle));
  vec2 flowDir = o.xy;
  if (dot(flowDir, baseDir) < 0.0) flowDir = -flowDir;
  float follow = uFollow * smoothstep(0.08, 0.5, o.z);
  vec2 dir = normalize(mix(baseDir, flowDir, follow) + 1e-5);
  float theta = mod(atan(dir.y, dir.x), PI);

  float a1 = clamp(drive * 1.35, 0.0, 1.0) * uShading;
  float a2 = smoothstep(0.42, 0.95, tone) * uShading;
  float h1 = a1 > 0.003 ? hatchField(p, theta, a1, 0.0) : 0.0;
  float h2 = a2 > 0.003 ? hatchField(p, mod(theta + 1.1, PI), a2, 1.0) : 0.0;
  float a3 = smoothstep(0.72, 1.0, tone) * uShading;
  float h3 = a3 > 0.003 ? hatchField(p, mod(theta - 0.5, PI), a3, 2.0) : 0.0;
  float deep = smoothstep(0.82, 1.0, tone) * uShading;

  vec4 c = texture(uContour, vUv);
  float press = 0.6 + 0.4 * valueNoise(p * 0.06 + 11.0 + uSeed * uBoil * 0.71);
  float weight = uOutline;
  float fineA = smoothstep(0.17 - 0.07 * weight, 0.5 - 0.14 * weight, c.r);
  float fineB = smoothstep(0.19 - 0.07 * weight, 0.55 - 0.15 * weight, c.g);
  float coarse = smoothstep(0.08 - 0.03 * weight, 0.55 - 0.15 * weight, c.b);
  float line = 1.0 - (1.0 - fineA * press) * (1.0 - fineB * press * 0.65) * (1.0 - coarse * press * 0.7);
  line *= min(1.0, weight * 1.2);

  float soft = luma(texture(uSmudge, vUv).rgb);
  float softTone = smoothstep(0.08, 0.92, 1.0 - mix(soft, autoLevel(soft), 0.35));
  float fill = clamp(softTone * 1.15, 0.0, 1.0) * uShading;
  float smudge = smoothstep(0.45, 1.0, softTone) * uSmudgeAmount;

  float grain = grainAt(p);
  float tooth = mix(1.0, smoothstep(0.24 + uRough * 0.1, 0.62, grain + 0.08), uGrain);
  vec3 paper = uPaper * (1.0 - (grain - 0.5) * 0.1 * uGrain);
  float blend = uSmudgeAmount * 0.7;
  vec3 color;
  if (colored) {
    vec3 shadow = mix(pigment * 0.5, vec3(0.2, 0.2, 0.34), 0.3);
    vec3 ink = mix(pigment * 0.32, uLead, 0.45);
    float layer = mix(h1, clamp(drive * 1.15, 0.0, 1.0) * uShading * 0.85, blend);
    float cross = mix(1.0 - (1.0 - h2) * (1.0 - h3), a2 * 0.75, blend);
    color = paper;
    color *= 1.0 - layer * 0.92 * mix(tooth, 1.0, blend * 0.5) * (1.0 - pigment);
    color *= 1.0 - cross * 0.8 * tooth * (1.0 - shadow);
    color *= 1.0 - smudge * 0.3 * (1.0 - mix(pigment, shadow, 0.5));
    color *= 1.0 - line * 0.9 * mix(1.0, tooth, 0.5) * (1.0 - ink);
  } else {
    float strokes = 1.0 - (1.0 - h1) * (1.0 - h2) * (1.0 - h3) * (1.0 - deep * 0.45);
    strokes = mix(strokes, fill * 0.85, blend);
    float graphite = 1.0 - (1.0 - strokes * uStrokeOpacity * mix(tooth, 1.0, blend * 0.4)) * (1.0 - line * 0.92 * mix(1.0, tooth, 0.5));
    graphite = 1.0 - (1.0 - graphite) * (1.0 - smudge * uDepth * mix(1.0, grain + 0.35, uGrain * 0.6));
    color = mix(paper, uLead, graphite);
  }
  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;

function formFlow(ctx, input) {
  const scale = 250 / Math.max(ctx.width, ctx.height);
  const w = Math.max(2, Math.round(ctx.width * scale));
  const h = Math.max(2, Math.round(ctx.height * scale));
  const source = input.mipmapped ? input : ctx.mipmap(input);
  const form = ctx.pass('sketch-down', DOWN, {
    input: source,
    target: ctx.target(w, h),
    uniforms: { uLod: Math.max(0, Math.log2(1 / scale) - 0.5) }
  });
  const raw = ctx.pass('sketch-tensor', TENSOR, { input: form, target: ctx.target(w, h) });
  ctx.release(form);
  let current = raw;
  [
    [1.6 / w, 0],
    [0, 1.6 / h],
    [1.6 / w, 0],
    [0, 1.6 / h]
  ].forEach(step => {
    const next = ctx.pass('sketch-smooth', SMOOTH, {
      input: current,
      target: ctx.target(w, h),
      uniforms: { uStep: step }
    });
    ctx.release(current);
    current = next;
  });
  return current;
}

const MEDIA = {
  graphite: {
    id: 0,
    lead: [0.16, 0.16, 0.18],
    width: 0.55,
    spacing: 2.3,
    sigma: 0.75,
    smudge: 0,
    depth: 0.4,
    opacity: 0.85,
    rough: 0
  },
  colored: {
    id: 1,
    lead: [0.14, 0.13, 0.16],
    width: 0.6,
    spacing: 2.3,
    sigma: 0.75,
    smudge: 0,
    depth: 0.35,
    opacity: 0.9,
    rough: 0.3
  },
  charcoal: {
    id: 2,
    lead: [0.06, 0.055, 0.055],
    width: 1.3,
    spacing: 4.2,
    sigma: 1.5,
    smudge: 0.4,
    depth: 0.8,
    opacity: 0.75,
    rough: 1
  }
};

export default {
  id: 'sketch',
  name: 'Pencil',
  category: 'art',
  description: 'A graphite pencil drawing with traced outlines, hatching that follows the forms and paper grain.',
  preview: { zoom: 2 },
  animated: true,
  animates: params => params.boil > 0,
  params: [
    {
      key: 'medium',
      label: 'Medium',
      type: 'select',
      default: 'graphite',
      options: [
        { value: 'graphite', label: 'Graphite' },
        { value: 'colored', label: 'Colored pencil' },
        { value: 'charcoal', label: 'Charcoal' }
      ]
    },
    { key: 'outline', label: 'Outlines', type: 'number', min: 0, max: 1, step: 0.01, default: 0.8 },
    { key: 'detail', label: 'Detail', type: 'number', min: 0, max: 1, step: 0.01, default: 0.6 },
    { key: 'shading', label: 'Shading', type: 'number', min: 0, max: 1, step: 0.01, default: 0.85 },
    { key: 'length', label: 'Stroke length', type: 'number', min: 6, max: 50, step: 0.5, default: 22 },
    { key: 'angle', label: 'Hatch angle', type: 'number', min: 0, max: 180, step: 1, default: 55 },
    { key: 'follow', label: 'Follow forms', type: 'number', min: 0, max: 1, step: 0.01, default: 0.35 },
    { key: 'smudge', label: 'Smudge', type: 'number', min: 0, max: 1, step: 0.01, default: 0.35 },
    { key: 'grain', label: 'Paper grain', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'paper', label: 'Paper', type: 'color', default: '#f3f0e8' },
    { key: 'boil', label: 'Line boil', type: 'number', min: 0, max: 1, step: 0.01, default: 0 }
  ],
  render(ctx, input, params) {
    const unit = ctx.unit;
    const detail = params.detail;
    const medium = MEDIA[params.medium] || MEDIA.graphite;
    const sigma = Math.max(0.6, medium.sigma * unit);
    const small = gaussianBlur(ctx, input, sigma);
    const wide = gaussianBlur(ctx, input, sigma * 1.6, { maxSigma: 1.5 });
    const coarse = gaussianBlur(ctx, input, 6 * unit, { maxSigma: 3 });
    const gradient = ctx.pass('sketch-coarse', COARSE, {
      input: coarse,
      target: ctx.target(coarse.width, coarse.height)
    });
    ctx.release(coarse);
    const edges = ctx.pass('sketch-edges', EDGES, {
      input: small,
      textures: { uWide: wide, uCoarse: gradient },
      uniforms: {
        uThreshold: 0.006 + (1 - detail) * 0.03,
        uGain: 12 + detail * 14,
        uGate: 0.0014 + (1 - detail) * (1 - detail) * 0.01,
        uStep: [(1.2 * unit) / ctx.width, (1.2 * unit) / ctx.height]
      }
    });
    ctx.release(wide);
    const hw = Math.max(1, Math.round(ctx.width / 2));
    const hh = Math.max(1, Math.round(ctx.height / 2));
    const tensor = ctx.pass('sketch-tensor', TENSOR, { input: small, target: ctx.target(hw, hh) });
    const dir = gaussianBlur(ctx, tensor, 2.5 * unit, { maxSigma: 3 });
    ctx.release(tensor);
    const flow = formFlow(ctx, input);
    const seed = params.boil > 0 ? Math.floor(ctx.time * 8) % 1000 : 0;
    const contour = ctx.pass('sketch-contour', CONTOUR, {
      input: edges,
      textures: { uDir: dir, uCoarse: gradient },
      uniforms: { uReach: 9 * unit, uCoarseReach: 12 * unit, uBoil: params.boil, uSeed: seed * 1.731 }
    });
    ctx.release(gradient);
    ctx.release(edges);
    ctx.release(dir);
    const smudge = gaussianBlur(ctx, input, 5 * unit, { maxSigma: 2.5 });
    const stats = imageStats(ctx, input);
    const output = ctx.pass('sketch-final', FINAL, {
      input,
      textures: { uContour: contour, uFlow: flow, uTone: small, uSmudge: smudge, uStats: stats.target },
      uniforms: {
        uStatsTop: stats.top,
        uPaper: hexToRgb(params.paper),
        uLead: medium.lead,
        uMedium: medium.id,
        uRough: medium.rough,
        uDepth: medium.depth,
        uStrokeOpacity: medium.opacity,
        uOutline: params.outline,
        uShading: params.shading,
        uLength: params.length,
        uSpacing: medium.spacing,
        uWidth: medium.width,
        uAngle: (params.angle * Math.PI) / 180,
        uFollow: params.follow,
        uSmudgeAmount: Math.min(1, params.smudge + medium.smudge),
        uGrain: params.grain,
        uBoil: params.boil,
        uSeed: seed
      }
    });
    ctx.release(small);
    ctx.release(contour);
    ctx.release(flow);
    ctx.release(smudge);
    ctx.release(stats.target);
    return output;
  }
};
