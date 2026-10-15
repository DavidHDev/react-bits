import { hexToRgb } from '../engine/assets';

const PREFILTER = `
uniform vec2 uTexel;
uniform float uThreshold;
uniform float uKnee;

vec3 tap(vec2 uv) {
  return toLinear(texture(uInput, uv).rgb);
}

void main() {
  vec2 uv = vUv;
  vec3 a = tap(uv + uTexel * vec2(-1.0, -1.0));
  vec3 b = tap(uv + uTexel * vec2(1.0, -1.0));
  vec3 c = tap(uv + uTexel * vec2(-1.0, 1.0));
  vec3 d = tap(uv + uTexel * vec2(1.0, 1.0));
  vec3 color = (a + b + c + d) * 0.25;
  float bright = max(color.r, max(color.g, color.b));
  float soft = clamp(bright - uThreshold + uKnee, 0.0, 2.0 * uKnee);
  soft = soft * soft / (4.0 * uKnee + 1e-5);
  float contribution = max(soft, bright - uThreshold) / max(bright, 1e-5);
  outColor = vec4(color * contribution, 1.0);
}`;

const DOWN = `
uniform vec2 uTexel;

void main() {
  vec2 uv = vUv;
  vec2 t = uTexel;
  vec3 a = texture(uInput, uv + t * vec2(-2.0, 2.0)).rgb;
  vec3 b = texture(uInput, uv + t * vec2(0.0, 2.0)).rgb;
  vec3 c = texture(uInput, uv + t * vec2(2.0, 2.0)).rgb;
  vec3 d = texture(uInput, uv + t * vec2(-2.0, 0.0)).rgb;
  vec3 e = texture(uInput, uv).rgb;
  vec3 f = texture(uInput, uv + t * vec2(2.0, 0.0)).rgb;
  vec3 g = texture(uInput, uv + t * vec2(-2.0, -2.0)).rgb;
  vec3 h = texture(uInput, uv + t * vec2(0.0, -2.0)).rgb;
  vec3 i = texture(uInput, uv + t * vec2(2.0, -2.0)).rgb;
  vec3 j = texture(uInput, uv + t * vec2(-1.0, 1.0)).rgb;
  vec3 k = texture(uInput, uv + t * vec2(1.0, 1.0)).rgb;
  vec3 l = texture(uInput, uv + t * vec2(-1.0, -1.0)).rgb;
  vec3 m = texture(uInput, uv + t * vec2(1.0, -1.0)).rgb;
  vec3 color = e * 0.125 + (a + c + g + i) * 0.03125 + (b + d + f + h) * 0.0625 + (j + k + l + m) * 0.125;
  outColor = vec4(color, 1.0);
}`;

const UP = `
uniform sampler2D uLower;
uniform vec2 uTexel;
uniform float uSpread;

void main() {
  vec4 d = vec4(1.0, 1.0, -1.0, 0.0) * uTexel.xyxy;
  vec3 s = texture(uLower, vUv - d.xy).rgb;
  s += texture(uLower, vUv - d.wy).rgb * 2.0;
  s += texture(uLower, vUv - d.zy).rgb;
  s += texture(uLower, vUv + d.zw).rgb * 2.0;
  s += texture(uLower, vUv).rgb * 4.0;
  s += texture(uLower, vUv + d.xw).rgb * 2.0;
  s += texture(uLower, vUv + d.zy).rgb;
  s += texture(uLower, vUv + d.wy).rgb * 2.0;
  s += texture(uLower, vUv + d.xy).rgb;
  outColor = vec4(texture(uInput, vUv).rgb + s / 16.0 * uSpread, 1.0);
}`;

const COMPOSITE = `
uniform sampler2D uBloom;
uniform sampler2D uSmall;
uniform float uIntensity;
uniform vec3 uTint;
uniform float uLevels;

void main() {
  vec3 base = toLinear(texture(uInput, vUv).rgb);
  vec3 glow = texture(uBloom, vUv).rgb / max(uLevels * 0.55, 1.0);
  vec3 mean = texture(uSmall, vec2(0.25)).rgb + texture(uSmall, vec2(0.75, 0.25)).rgb;
  mean += texture(uSmall, vec2(0.25, 0.75)).rgb + texture(uSmall, vec2(0.75)).rgb;
  float energy = luma(mean * 0.25);
  glow *= uIntensity * 1.5 / (1.0 + energy * 5.0);
  vec3 color = 1.0 - (1.0 - base) * exp(-glow * uTint);
  outColor = vec4(toGamma(color), 1.0);
}`;

export default {
  id: 'bloom',
  name: 'Bloom',
  category: 'light',
  blend: 'normal',
  description: 'Soft glow around the brightest parts of the image.',
  animated: false,
  preview: { params: { threshold: 0.5, intensity: 1.5 } },
  params: [
    { key: 'threshold', label: 'Threshold', type: 'number', min: 0, max: 1, step: 0.01, default: 0.72 },
    { key: 'intensity', label: 'Intensity', type: 'number', min: 0, max: 4, step: 0.01, default: 0.65 },
    { key: 'radius', label: 'Radius', type: 'number', min: 0.2, max: 1, step: 0.01, default: 0.7 },
    { key: 'softness', label: 'Softness', type: 'number', min: 0.05, max: 1, step: 0.01, default: 0.5 },
    { key: 'tint', label: 'Tint', type: 'color', default: '#ffffff' }
  ],
  render(ctx, input, params) {
    const w = Math.max(2, Math.round(ctx.width / 2));
    const h = Math.max(2, Math.round(ctx.height / 2));
    const threshold = Math.pow(params.threshold, 2.2);
    const pre = ctx.pass('bloom-pre', PREFILTER, {
      input,
      target: ctx.target(w, h),
      uniforms: {
        uTexel: [1 / ctx.width, 1 / ctx.height],
        uThreshold: threshold,
        uKnee: Math.max(threshold * params.softness, 0.001)
      }
    });
    const chain = [pre];
    let current = pre;
    while (chain.length < 7 && Math.min(current.width, current.height) > 12) {
      const next = ctx.pass('bloom-down', DOWN, {
        input: current,
        target: ctx.target(Math.max(1, Math.round(current.width / 2)), Math.max(1, Math.round(current.height / 2))),
        uniforms: { uTexel: [1 / current.width, 1 / current.height] }
      });
      chain.push(next);
      current = next;
    }
    const smallest = chain[chain.length - 1];
    let lower = smallest;
    for (let index = chain.length - 2; index >= 0; index -= 1) {
      const level = chain[index];
      const up = ctx.pass('bloom-up', UP, {
        input: level,
        target: ctx.target(level.width, level.height),
        textures: { uLower: lower },
        uniforms: { uTexel: [1 / lower.width, 1 / lower.height], uSpread: params.radius }
      });
      if (!chain.includes(lower)) ctx.release(lower);
      lower = up;
    }
    const output = ctx.pass('bloom-composite', COMPOSITE, {
      input,
      textures: { uBloom: lower, uSmall: smallest },
      uniforms: { uIntensity: params.intensity, uTint: hexToRgb(params.tint), uLevels: chain.length }
    });
    chain.forEach(target => ctx.release(target));
    if (lower !== smallest) ctx.release(lower);
    return output;
  }
};
