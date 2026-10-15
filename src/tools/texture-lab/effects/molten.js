import { hexToRgb } from '../engine/assets';
import { gaussianBlur } from '../engine/blur';
import { imageStats } from '../engine/stats';

const ALLOYS = {
  iron: ['#090202', '#2a0806', '#5c160c', '#9a3418', '#cf5a2a', '#f39a3f', '#ffd77a', '#fffbe0'],
  gold: ['#0a0503', '#2b1205', '#5e300b', '#9a5c16', '#d18f27', '#f2bd45', '#ffe48c', '#fffcea'],
  copper: ['#0a0303', '#2c0a09', '#621a14', '#a03224', '#d6563a', '#f58a62', '#ffc3a6', '#fff4ec']
};

const TEMPERATURE = `
uniform sampler2D uStats;
uniform float uStatsTop;
uniform vec2 uUnits;
uniform float uHeat;
uniform float uCrust;
uniform float uFlow;
uniform float uSize;
uniform float uClock;
uniform vec3 uRamp[8];

float noise2(vec2 p) {
  return valueNoise(p) * 0.6 + valueNoise(rotation(0.8) * p * 2.03 + 17.0) * 0.28 + valueNoise(rotation(1.9) * p * 4.1 + 31.0) * 0.12;
}

vec2 flowOffset(vec2 q) {
  vec2 a = vec2(noise2(q / (uSize * 2.2) + vec2(uClock * 0.09, -uClock * 0.05)), noise2(q / (uSize * 2.2) + vec2(5.2 - uClock * 0.07, 1.3 + uClock * 0.06)));
  return (a - 0.5) * uSize * 1.6 * uFlow;
}

float level(float l) {
  vec2 moments = textureLod(uStats, vec2(0.5), uStatsTop).rg;
  float spread = max(sqrt(max(moments.y - moments.x * moments.x, 0.0)), 0.08);
  return clamp((l - moments.x) / (spread * 3.8) + 0.5, 0.0, 1.0);
}

vec3 ramp(float t) {
  float x = clamp(t, 0.0, 1.0) * 7.0;
  float i = floor(x);
  float f = smoothstep(0.0, 1.0, x - i);
  vec3 a = uRamp[0];
  vec3 b = uRamp[0];
  for (int k = 0; k < 8; k++) {
    if (float(k) == i) a = uRamp[k];
    if (float(k) == min(i + 1.0, 7.0)) b = uRamp[k];
  }
  return mix(a, b, f);
}

vec4 heatAt(vec2 uv, float lod) {
  vec2 q = uv * uUnits;
  vec2 warped = uv + flowOffset(q) / uUnits;
  float l = luma(textureLod(uInput, clamp(warped, 0.0, 1.0), lod).rgb);
  float tone = mix(level(l), smoothstep(0.0, 0.85, l), 0.45);
  float t = tone * 0.9 + (uHeat - 0.5) * 0.7 + 0.05;
  vec2 drift = vec2(uClock * 0.035, -uClock * 0.05);
  vec2 cq = (q + flowOffset(q * 1.7) * 0.6) / uSize + drift;
  float mottle = noise2(cq + 3.0) * 0.62 + noise2(cq * 2.7 + 11.0) * 0.26 + valueNoise(cq * 7.3 + 23.0) * 0.12;
  float cool = smoothstep(0.75, 0.25, t);
  float c = mottle + cool * 0.3 - 0.2;
  float live = smoothstep(0.18, 0.42, t);
  float crust = smoothstep(0.5, 0.6, c) * uCrust * live;
  float seam = (smoothstep(0.43, 0.5, c) - smoothstep(0.5, 0.6, c)) * uCrust * live;
  return vec4(t, crust, max(seam, 0.0), tone);
}
`;

const EMIT = `
${TEMPERATURE}
void main() {
  vec4 h = heatAt(vUv, 1.5);
  float t = h.x - h.y * 0.35;
  vec3 hot = ramp(t) * smoothstep(0.4, 0.9, t);
  outColor = vec4(hot, t);
}`;

const SHADE = `
${TEMPERATURE}
uniform sampler2D uEmit;
uniform sampler2D uGlow;
uniform vec2 uEmitSize;
uniform float uGrain;
uniform float uGlowAmount;
uniform float uShine;

vec4 bspline(sampler2D tex, vec2 uv, vec2 size) {
  vec2 p = uv * size - 0.5;
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 f2 = f * f;
  vec2 f3 = f2 * f;
  vec2 w0 = (1.0 - 3.0 * f + 3.0 * f2 - f3) / 6.0;
  vec2 w1 = (4.0 - 6.0 * f2 + 3.0 * f3) / 6.0;
  vec2 w2 = (1.0 + 3.0 * f + 3.0 * f2 - 3.0 * f3) / 6.0;
  vec2 w3 = f3 / 6.0;
  vec2 g0 = w0 + w1;
  vec2 g1 = w2 + w3;
  vec2 h0 = (i - 0.5 + w1 / g0) / size;
  vec2 h1 = (i + 1.5 + w3 / g1) / size;
  return g0.y * (g0.x * texture(tex, vec2(h0.x, h0.y)) + g1.x * texture(tex, vec2(h1.x, h0.y)))
    + g1.y * (g0.x * texture(tex, vec2(h0.x, h1.y)) + g1.x * texture(tex, vec2(h1.x, h1.y)));
}

void main() {
  vec4 h = heatAt(vUv, 0.0);
  vec2 q = vUv * uUnits;
  vec2 g = q + flowOffset(q) * 0.5;
  float speck = valueNoise(g * 0.42) * 0.5 + valueNoise(g * 0.95 + 9.0) * 0.3 + valueNoise(g * 2.1 + 5.0) * 0.2;
  float pits = smoothstep(0.6, 0.8, valueNoise(g * 0.22 + 21.0) * 0.5 + speck * 0.5);
  float t = h.x;
  t -= h.y * (0.3 + 0.2 * speck);
  t += (speck - 0.5) * uGrain * 0.3 - pits * uGrain * 0.18 * smoothstep(0.3, 0.8, t);
  t += h.z * 0.12;
  vec3 color = ramp(t);
  color = mix(color, color * vec3(0.6, 0.52, 0.5), h.y * 0.3);

  vec2 texel = 1.0 / uEmitSize;
  float hl = bspline(uEmit, vUv - vec2(texel.x, 0.0), uEmitSize).a;
  float hr = bspline(uEmit, vUv + vec2(texel.x, 0.0), uEmitSize).a;
  float hd = bspline(uEmit, vUv - vec2(0.0, texel.y), uEmitSize).a;
  float hu = bspline(uEmit, vUv + vec2(0.0, texel.y), uEmitSize).a;
  vec2 slope = vec2(hr - hl, hu - hd) * 0.5 / (texel * uUnits) * 24.0;
  slope /= 1.0 + length(slope) * 0.3;
  vec3 n = normalize(vec3(-slope, 1.0));
  vec3 light = normalize(vec3(-0.5, 0.6, 0.62));
  vec3 halfway = normalize(light + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(n, halfway), 0.0), 14.0) - pow(halfway.z, 14.0);
  float dim = pow(max(dot(n, halfway), 0.0), 2.0) - pow(halfway.z, 2.0);
  float sheen = max(spec, 0.0) * uShine * (1.0 - h.y * 0.6);
  color *= 1.0 + min(dim, 0.0) * uShine * 1.2;
  color += ramp(clamp(t + 0.4, 0.0, 1.0)) * sheen * 1.4;

  vec3 glow = texture(uGlow, vUv).rgb;
  color = 1.0 - (1.0 - color) * exp(-glow * uGlowAmount * 4.5);
  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;

export default {
  id: 'molten',
  name: 'Molten metal',
  category: 'material',
  description: 'The picture poured in glowing liquid alloy, from white-hot to a cooling crust.',
  animated: true,
  animates: params => params.speed > 0,
  params: [
    {
      key: 'alloy',
      label: 'Alloy',
      type: 'select',
      default: 'iron',
      options: [
        { value: 'iron', label: 'Iron' },
        { value: 'gold', label: 'Gold' },
        { value: 'copper', label: 'Copper' }
      ]
    },
    { key: 'heat', label: 'Heat', type: 'number', min: 0, max: 1, step: 0.01, default: 0.42 },
    { key: 'crust', label: 'Crust', type: 'number', min: 0, max: 1, step: 0.01, default: 0.45 },
    { key: 'size', label: 'Crust size', type: 'number', min: 0, max: 1, step: 0.01, default: 0.22 },
    { key: 'grain', label: 'Grain', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'glow', label: 'Glow', type: 'number', min: 0, max: 1, step: 0.01, default: 0.35 },
    { key: 'shine', label: 'Shine', type: 'number', min: 0, max: 1, step: 0.01, default: 0.4 },
    { key: 'flow', label: 'Flow', type: 'number', min: 0, max: 1, step: 0.01, default: 0.4 },
    { key: 'speed', label: 'Speed', type: 'number', min: 0, max: 2, step: 0.01, default: 0.3 }
  ],
  render(ctx, input, params) {
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const stats = imageStats(ctx, source);
    const ramp = (ALLOYS[params.alloy] || ALLOYS.iron).map(hexToRgb);
    const shared = {
      uStatsTop: stats.top,
      uUnits: [ctx.width / ctx.unit, ctx.height / ctx.unit],
      uHeat: params.heat,
      uCrust: params.crust,
      uFlow: params.flow,
      uSize: 14 + 70 * params.size,
      uClock: ctx.time * params.speed * 2,
      uRamp: ramp
    };
    const emit = ctx.pass('molten-emit', EMIT, {
      input: source,
      target: ctx.target(Math.max(8, ctx.width / 2), Math.max(8, ctx.height / 2)),
      textures: { uStats: stats.target },
      uniforms: shared
    });
    const glow = gaussianBlur(ctx, emit, 16 * ctx.unit, { maxSigma: 4 });
    const output = ctx.pass('molten', SHADE, {
      input: source,
      textures: { uStats: stats.target, uEmit: emit, uGlow: glow },
      uniforms: {
        ...shared,
        uEmitSize: [emit.width, emit.height],
        uGrain: params.grain,
        uGlowAmount: params.glow,
        uShine: params.shine
      }
    });
    ctx.release(emit);
    ctx.release(glow);
    ctx.release(stats.target);
    return output;
  }
};
