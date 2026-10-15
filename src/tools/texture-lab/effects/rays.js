import { hexToRgb } from '../engine/assets';
import { STATS_GLSL, imageStats } from '../engine/stats';

const BRIGHT = `
${STATS_GLSL}
uniform vec2 uSpan;
uniform float uLod;
uniform float uLocalLod;
uniform vec2 uRing;
uniform float uThreshold;
uniform float uPoints;
uniform float uSpread;

vec3 grab(vec2 uv) {
  return textureLod(uInput, uv, uLod).rgb;
}

float weight(vec3 c) {
  vec2 moments = textureLod(uStats, vec2(0.5), uStatsTop).rg;
  float spread = sqrt(max(moments.y - moments.x * moments.x, 1e-5));
  float start = clamp(moments.x + uThreshold * spread, 0.4, 0.88);
  float k = clamp((luma(c) - start) / (1.0 - start), 0.0, 1.0);
  return k * k * k;
}

void main() {
  vec3 a = grab(vUv + uSpan * vec2(-0.25, -0.25));
  vec3 b = grab(vUv + uSpan * vec2(0.25, -0.25));
  vec3 c = grab(vUv + uSpan * vec2(-0.25, 0.25));
  vec3 d = grab(vUv + uSpan * vec2(0.25, 0.25));
  vec3 la = toLinear(a) * weight(a);
  vec3 lb = toLinear(b) * weight(b);
  vec3 lc = toLinear(c) * weight(c);
  vec3 ld = toLinear(d) * weight(d);
  vec3 glow = mix((la + lb + lc + ld) * 0.25, max(max(la, lb), max(lc, ld)), 0.5);
  float top = max(max(luma(a), luma(b)), max(luma(c), luma(d)));
  float ring = 0.0;
  for (int i = 0; i < 8; i++) {
    float turn = float(i) * 0.7853982;
    ring = max(ring, luma(textureLod(uInput, vUv + vec2(cos(turn), sin(turn)) * uRing, uLocalLod).rgb));
  }
  float point = smoothstep(0.04, 0.3, top - ring);
  vec3 emit = glow * (uSpread + uPoints * point);
  outColor = vec4(emit, luma(glow) + luma(emit) * 0.04);
}`;

const SHRINK = `
uniform vec2 uSpan;
void main() {
  vec4 sum = texture(uInput, vUv + uSpan * vec2(-0.5, -0.5));
  sum += texture(uInput, vUv + uSpan * vec2(0.5, -0.5));
  sum += texture(uInput, vUv + uSpan * vec2(-0.5, 0.5));
  sum += texture(uInput, vUv + uSpan * vec2(0.5, 0.5));
  vec3 hue = sum.rgb / max(max(sum.r, max(sum.g, sum.b)), 1e-5);
  outColor = vec4(hue * sum.a * 0.25, 1.0);
}`;

const STREAK = `
uniform sampler2D uAccum;
uniform vec2 uStep;
uniform float uDecay;
uniform float uBoth;
uniform float uFinal;
uniform float uScale;
uniform vec2 uLane;
uniform float uLaneUnit;
uniform float uShimmer;
uniform float uBeams;
uniform float uClock;

void main() {
  vec3 sum = texture(uInput, vUv).rgb;
  float w = 1.0;
  for (int s = 1; s < 4; s++) {
    w *= uDecay;
    vec2 o = uStep * float(s);
    sum += texture(uInput, vUv + o).rgb * w;
    if (uBoth > 0.5) sum += texture(uInput, vUv - o).rgb * w;
  }
  if (uFinal > 0.5) {
    float lane = dot(vUv * uResolution, uLane) / uLaneUnit;
    float flicker = valueNoise(vec2(lane * 0.45, uClock * 0.9)) * 0.6 + valueNoise(vec2(lane * 0.11 + 17.0, uClock * 0.4)) * 0.4;
    float gain = 1.0 + uShimmer * (flicker - 0.5) * 1.8;
    if (uBeams > 0.5) {
      float shaft = valueNoise(vec2(lane * 0.03, uClock * 0.2 + 5.0)) * 0.6 + valueNoise(vec2(lane * 0.08 + 3.0, -uClock * 0.3)) * 0.4;
      gain = (0.25 + smoothstep(0.3, 0.75, shaft) * 1.5) * (1.0 + uShimmer * (flicker - 0.5) * 0.6);
    }
    sum = sum * uScale * gain + texture(uAccum, vUv).rgb;
  }
  outColor = vec4(max(sum, 0.0), 1.0);
}`;

const BLUR = `
uniform vec2 uStep;
void main() {
  vec3 sum = texture(uInput, vUv).rgb * 0.227027;
  sum += (texture(uInput, vUv + uStep * 1.3846154).rgb + texture(uInput, vUv - uStep * 1.3846154).rgb) * 0.3162162;
  sum += (texture(uInput, vUv + uStep * 3.2307692).rgb + texture(uInput, vUv - uStep * 3.2307692).rgb) * 0.0702703;
  outColor = vec4(sum, 1.0);
}`;

const COMPOSITE = `
uniform sampler2D uStreak;
uniform sampler2D uShafts;
uniform sampler2D uHalo;
uniform sampler2D uBright;
uniform float uBrightTop;
uniform vec3 uTint;
uniform float uImageColor;
uniform float uIntensity;
uniform float uShaftAmount;
uniform float uGlow;

vec3 colorize(vec3 light) {
  float l = luma(light);
  vec3 hue = light / max(max(light.r, max(light.g, light.b)), 1e-4);
  vec3 own = mix(vec3(1.0), hue, 0.9) * l * 1.2;
  return mix(uTint * l, own * mix(vec3(1.0), uTint, 0.2), uImageColor);
}

void main() {
  vec3 base = toLinear(texture(uInput, vUv).rgb);
  float energy = textureLod(uBright, vec2(0.5), uBrightTop).a;
  float exposure = 1.0 / (0.2 + energy * 8.0);
  vec3 light = colorize(texture(uStreak, vUv).rgb) * uIntensity;
  light += colorize(texture(uShafts, vUv).rgb) * uShaftAmount;
  light += colorize(texture(uHalo, vUv).rgb) * uGlow;
  light *= min(exposure, 5.0);
  vec3 color = 1.0 - (1.0 - base) * exp(-light);
  outColor = vec4(toGamma(color), 1.0);
}`;

const BUFFER = 640;

function streakChains(ctx, source, { axes, both, base, lambda, shimmer, clock, perUnit, empty, beams = 0 }) {
  const w = source.width;
  const h = source.height;
  const passes = Math.max(2, Math.min(6, Math.ceil(Math.log(lambda * 4 + 1) / Math.log(4))));
  const share = 1 / Math.sqrt(axes);
  let accum = null;
  for (let k = 0; k < axes; k += 1) {
    const theta = base + (k * (both ? Math.PI : Math.PI * 2)) / axes;
    const dir = [-Math.cos(theta), -Math.sin(theta)];
    let norm = 1;
    for (let i = 0; i < passes; i += 1) {
      const a = Math.exp(-Math.pow(4, i) / lambda);
      norm *= 1 + (both ? 2 : 1) * (a + a * a + a * a * a);
    }
    let current = source;
    for (let i = 0; i < passes; i += 1) {
      const stride = Math.pow(4, i);
      const next = ctx.pass('rays-streak', STREAK, {
        input: current,
        target: ctx.target(w, h),
        textures: { uAccum: accum || empty },
        uniforms: {
          uStep: [(dir[0] * stride) / w, (dir[1] * stride) / h],
          uDecay: Math.exp(-stride / lambda),
          uBoth: both,
          uFinal: i === passes - 1,
          uScale: share / norm,
          uLane: [-dir[1], dir[0]],
          uLaneUnit: perUnit,
          uShimmer: shimmer,
          uBeams: beams,
          uClock: clock + k * 3.1
        }
      });
      if (current !== source) ctx.release(current);
      current = next;
    }
    if (accum) ctx.release(accum);
    accum = current;
  }
  return accum;
}

export default {
  id: 'rays',
  name: 'Rays',
  category: 'light',
  blend: 'normal',
  description: 'Light streaming from the brightest points as streaks, star bursts and shafts.',
  animated: true,
  preview: { params: { intensity: 1.6, shafts: 1 } },
  animates: params => params.shimmer > 0 && (params.intensity > 0 || params.shafts > 0),
  params: [
    { key: 'rays', label: 'Rays', type: 'number', min: 1, max: 8, step: 1, default: 2 },
    { key: 'length', label: 'Length', type: 'number', min: 0, max: 1, step: 0.01, default: 0.55 },
    { key: 'angle', label: 'Angle', type: 'number', min: 0, max: 360, step: 1, default: 0 },
    { key: 'threshold', label: 'Threshold', type: 'number', min: 0, max: 1, step: 0.01, default: 0.55 },
    { key: 'intensity', label: 'Streaks', type: 'number', min: 0, max: 3, step: 0.01, default: 1 },
    { key: 'spread', label: 'Spread', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'shafts', label: 'Light shafts', type: 'number', min: 0, max: 2, step: 0.01, default: 0.6 },
    { key: 'glow', label: 'Halo', type: 'number', min: 0, max: 2, step: 0.01, default: 0.5 },
    { key: 'tint', label: 'Color', type: 'color', default: '#a8d2ff' },
    { key: 'colorize', label: 'Image color', type: 'number', min: 0, max: 1, step: 0.01, default: 0.35 },
    { key: 'shimmer', label: 'Shimmer', type: 'number', min: 0, max: 1, step: 0.01, default: 0.45 }
  ],
  render(ctx, input, params) {
    if (params.intensity <= 0 && params.glow <= 0 && params.shafts <= 0) return input;
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const fit = Math.min(1, BUFFER / Math.max(ctx.width, ctx.height));
    const bw = Math.max(2, Math.round(ctx.width * fit));
    const bh = Math.max(2, Math.round(ctx.height * fit));
    const perUnit = Math.max(bw, bh) / 1000;
    const stats = imageStats(ctx, input);
    const bright = ctx.pass('rays-bright', BRIGHT, {
      input: source,
      target: ctx.target(bw, bh),
      textures: { uStats: stats.target },
      uniforms: {
        uStatsTop: stats.top,
        uSpan: [1 / bw, 1 / bh],
        uLod: Math.max(0, Math.log2(1 / fit) - 1),
        uLocalLod: Math.max(0, Math.log2(Math.max(1, 2 * ctx.unit))),
        uRing: [(7 * ctx.unit) / ctx.width, (7 * ctx.unit) / ctx.height],
        uThreshold: params.threshold * 3 - 0.4,
        uPoints: 24,
        uSpread: params.spread
      }
    });
    ctx.release(stats.target);
    const empty = ctx.shared('rays-empty', engine => ({
      texture: engine.createTexture(1, 1, { data: new Uint8Array([0, 0, 0, 255]) })
    }));

    const rays = Math.max(1, Math.min(8, Math.round(params.rays)));
    const both = rays % 2 === 0;
    const axes = both ? rays / 2 : rays;
    const lambda = Math.max(0.5, (4 + 380 * params.length * params.length) * perUnit);
    const clock = params.shimmer > 0 ? ctx.time * (0.3 + params.shimmer * 0.9) : 0;
    const streaks = streakChains(ctx, bright, {
      axes,
      both,
      base: (params.angle * Math.PI) / 180,
      lambda,
      shimmer: params.shimmer,
      clock,
      perUnit,
      empty
    });

    const sw = Math.max(2, Math.round(bw / 2));
    const sh = Math.max(2, Math.round(bh / 2));
    const low = ctx.pass('rays-shrink', SHRINK, {
      input: bright,
      target: ctx.target(sw, sh),
      uniforms: { uSpan: [1 / bw, 1 / bh] }
    });
    const shafts = streakChains(ctx, low, {
      axes,
      both,
      base: (params.angle * Math.PI) / 180,
      lambda: lambda * 0.55,
      shimmer: params.shimmer,
      clock,
      perUnit: perUnit / 2,
      empty,
      beams: 1
    });

    let halo = low;
    for (let i = 0; i < 2; i += 1) {
      const across = ctx.pass('rays-blur', BLUR, {
        input: halo,
        target: ctx.target(sw, sh),
        uniforms: { uStep: [1.5 / sw, 0] }
      });
      if (halo !== low) ctx.release(halo);
      halo = ctx.pass('rays-blur', BLUR, {
        input: across,
        target: ctx.target(sw, sh),
        uniforms: { uStep: [0, 1.5 / sh] }
      });
      ctx.release(across);
    }

    const output = ctx.pass('rays-composite', COMPOSITE, {
      input,
      textures: { uStreak: streaks, uShafts: shafts, uHalo: halo, uBright: ctx.mipmap(bright) },
      uniforms: {
        uBrightTop: Math.floor(Math.log2(Math.max(bw, bh))),
        uTint: hexToRgb(params.tint),
        uImageColor: params.colorize,
        uIntensity: params.intensity * 5,
        uShaftAmount: params.shafts * 3,
        uGlow: params.glow * 1.5
      }
    });
    [bright, low, streaks, shafts, halo].forEach(target => ctx.release(target));
    return output;
  }
};
