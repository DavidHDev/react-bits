import { hexToRgb } from '../engine/assets';
import { gaussianBlur } from '../engine/blur';
import { imageStats } from '../engine/stats';

const BSPLINE = `
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
  vec4 a = texture(tex, vec2(h0.x, h0.y));
  vec4 b = texture(tex, vec2(h1.x, h0.y));
  vec4 c = texture(tex, vec2(h0.x, h1.y));
  vec4 d = texture(tex, vec2(h1.x, h1.y));
  return g0.y * (g0.x * a + g1.x * b) + g1.y * (g0.x * c + g1.x * d);
}
`;

const SLOPE = `
uniform sampler2D uCoarse;
uniform vec2 uCoarseSize;
uniform sampler2D uStats;
uniform float uStatsTop;
uniform float uDepth;
uniform float uSwell;
uniform float uInvert;
uniform float uTexelUnits;
${BSPLINE}
vec2 moments;

float level(float l) {
  float t = clamp((l - moments.x) / moments.y + 0.5, 0.0, 1.0);
  return mix(t, 1.0 - t, uInvert);
}

float heightAt(vec2 uv) {
  float fine = level(luma(texture(uInput, uv).rgb));
  float broad = level(luma(bspline(uCoarse, uv, uCoarseSize).rgb));
  return fine + broad * uSwell;
}

void main() {
  vec2 stats = textureLod(uStats, vec2(0.5), uStatsTop).rg;
  moments = vec2(stats.x, max(sqrt(max(stats.y - stats.x * stats.x, 0.0)), 0.09) * 3.6);
  vec2 t = 1.0 / uResolution;
  float hx = heightAt(vUv + vec2(t.x, 0.0)) - heightAt(vUv - vec2(t.x, 0.0));
  float hy = heightAt(vUv + vec2(0.0, t.y)) - heightAt(vUv - vec2(0.0, t.y));
  vec2 slope = vec2(hx, hy) * uDepth / (2.0 * uTexelUnits);
  float raw = luma(texture(uInput, vUv).rgb);
  outColor = vec4(slope, mix(raw, 1.0 - raw, uInvert), level(raw));
}`;

const SHADE = `
uniform sampler2D uSlope;
uniform vec2 uSlopeSize;
uniform float uEnv;
uniform vec3 uTint;
uniform vec3 uBackdrop;
uniform float uRough;
uniform float uLight;
uniform float uSpin;
uniform float uColor;
uniform float uTone;
${BSPLINE}
vec3 dirOf(float az, float el) {
  return vec3(cos(el) * cos(az), cos(el) * sin(az), sin(el));
}

float lobe(vec3 r, vec3 axis, float radius, float soft) {
  float angle = degrees(acos(clamp(dot(r, axis), -1.0, 1.0)));
  return 1.0 - smoothstep(radius - soft, radius + soft, angle);
}

float rise(float e, float at, float soft) {
  return smoothstep(at - soft, at + soft, e);
}

float span(float e, float lo, float hi, float soft) {
  return rise(e, lo, soft) * (1.0 - rise(e, hi, soft));
}

float studio(vec3 r, float s) {
  float e = degrees(asin(clamp(r.z, -1.0, 1.0)));
  float az = atan(r.y, r.x);
  float facing = cos(az - uLight);
  float peak = 1.0 / (1.0 + s * 0.06);
  float value = 0.0;
  if (uEnv < 0.5) {
    float side = cos(az - uLight + 2.2);
    value += rise(e, 79.0, s) * 0.2;
    value += span(e, 69.0, 77.0, s) * (0.58 + 0.52 * facing) * peak;
    value += span(e, 59.0, 66.0, s) * 0.03;
    value += span(e, 48.0, 57.0, s) * (0.2 + 1.0 * smoothstep(-0.3, 0.9, side)) * peak;
    value += span(e, 39.0, 46.0, s) * 0.04;
    value += span(e, 13.0, 37.0, s) * (0.3 + 0.26 * facing);
    value += span(e, 2.0, 10.0, s) * (1.3 + 0.6 * facing) * peak;
    value += (1.0 - rise(e, 1.0, s)) * 0.03;
    value += lobe(r, dirOf(uLight, radians(24.0)), 9.0, 3.0 + s) * 1.5 * peak;
    value += lobe(r, dirOf(uLight + 2.4, radians(46.0)), 8.0, 2.0 + s) * 1.3 * peak;
  } else if (uEnv < 1.5) {
    float sky = rise(e, 0.0, s);
    value += sky * mix(1.0, 0.14, smoothstep(0.0, 60.0, e));
    value += span(e, 0.0, 6.0, s) * 2.2 * peak;
    value += (1.0 - sky) * (0.02 + 0.08 * rise(-e, 50.0, 30.0));
    value += lobe(r, dirOf(uLight, radians(50.0)), 6.0, 1.5 + s) * 4.0 * peak;
  } else {
    value += rise(e, 80.0, s) * 0.16;
    value += span(e, 68.0, 77.0, s) * (1.0 + 0.4 * facing) * peak;
    value += span(e, 46.0, 55.0, s) * (0.9 + 0.5 * cos(az - uLight + 2.1)) * peak;
    value += span(e, 24.0, 32.0, s) * (1.3 + 0.6 * facing) * peak;
    value += span(e, 4.0, 10.0, s) * 1.8 * peak;
  }
  return max(value, 0.0);
}

void main() {
  vec4 s = bspline(uSlope, vUv, uSlopeSize);
  vec3 n = normalize(vec3(-s.xy, 1.0));
  vec3 r = vec3(2.0 * n.z * n.xy, 2.0 * n.z * n.z - 1.0);
  r.xy = rotation(uSpin) * r.xy;
  vec3 rx = dFdx(r);
  vec3 ry = dFdy(r);
  float footprint = degrees(sqrt(max(dot(rx, rx), dot(ry, ry))));
  float soft = 2.0 + uRough * 22.0 + footprint * 0.8;
  float env = studio(r, soft);
  float tone = clamp(s.z, 0.0, 1.0);
  float k = mix(1.0, pow(smoothstep(0.03, 0.6, tone), 1.25) * smoothstep(0.04, 0.5, s.w), uTone);
  float intensity = env * k * 1.8;
  vec3 image = textureLod(uInput, vUv, 1.5).rgb;
  vec3 hue = image / max(max(image.r, max(image.g, image.b)), 0.04);
  vec3 tint = toLinear(uTint) * mix(vec3(1.0), toLinear(hue), uColor);
  vec3 base = toLinear(uBackdrop);
  vec3 color = mix(base, tint, 1.0 - exp(-1.6 * intensity));
  float hot = max(intensity - 1.0, 0.0);
  color = mix(color, vec3(1.0), (1.0 - exp(-hot * 0.7)) * 0.7);
  outColor = vec4(toGamma(color), 1.0);
}`;

const ENVIRONMENTS = { studio: 0, horizon: 1, rings: 2 };

export default {
  id: 'chrome',
  name: 'Chrome',
  category: 'material',
  description: 'The picture cast in polished liquid chrome that reflects a slowly turning studio.',
  animated: true,
  animates: params => params.speed > 0,
  params: [
    {
      key: 'environment',
      label: 'Reflections',
      type: 'select',
      default: 'studio',
      options: [
        { value: 'studio', label: 'Studio' },
        { value: 'horizon', label: 'Horizon' },
        { value: 'rings', label: 'Ring lights' }
      ]
    },
    { key: 'tint', label: 'Tint', type: 'color', default: '#b8c8e6' },
    { key: 'backdrop', label: 'Backdrop', type: 'color', default: '#171e30' },
    { key: 'roughness', label: 'Roughness', type: 'number', min: 0, max: 1, step: 0.01, default: 0.2 },
    { key: 'depth', label: 'Depth', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'detail', label: 'Detail', type: 'number', min: 0, max: 1, step: 0.01, default: 0.45 },
    { key: 'tone', label: 'Tone', type: 'number', min: 0, max: 1, step: 0.01, default: 1 },
    { key: 'light', label: 'Light angle', type: 'number', min: 0, max: 360, step: 1, default: 135 },
    { key: 'color', label: 'Image color', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { key: 'invert', label: 'Invert', type: 'boolean', default: false },
    { key: 'speed', label: 'Speed', type: 'number', min: 0, max: 2, step: 0.01, default: 0.25 }
  ],
  render(ctx, input, params) {
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const fineSigma = (9 - 7.4 * params.detail) * ctx.unit;
    const fine = gaussianBlur(ctx, source, fineSigma, { maxSigma: 3 });
    const coarse = gaussianBlur(ctx, source, 30 * ctx.unit, { maxSigma: 6 });
    const stats = imageStats(ctx, source);
    const texelUnits = 1000 / Math.max(fine.width, fine.height);
    const slope = ctx.pass('chrome-slope', SLOPE, {
      input: fine,
      target: ctx.target(fine.width, fine.height),
      textures: { uCoarse: coarse, uStats: stats.target },
      uniforms: {
        uCoarseSize: [coarse.width, coarse.height],
        uStatsTop: stats.top,
        uDepth: 10 + 90 * params.depth,
        uSwell: 1.2,
        uInvert: params.invert ? 1 : 0,
        uTexelUnits: texelUnits
      }
    });
    ctx.release(fine);
    ctx.release(coarse);
    ctx.release(stats.target);
    const output = ctx.pass('chrome-shade', SHADE, {
      input: source,
      textures: { uSlope: slope },
      uniforms: {
        uSlopeSize: [slope.width, slope.height],
        uEnv: ENVIRONMENTS[params.environment] ?? 0,
        uTint: hexToRgb(params.tint),
        uBackdrop: hexToRgb(params.backdrop),
        uRough: params.roughness,
        uLight: (params.light * Math.PI) / 180,
        uSpin: ctx.time * params.speed * 0.35,
        uColor: params.color,
        uTone: params.tone
      }
    });
    ctx.release(slope);
    return output;
  }
};
