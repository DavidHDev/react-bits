import { hexToRgb } from '../engine/assets';

const EXTRACT = `
uniform vec2 uTexel;
uniform float uThreshold;
uniform float uKnee;

vec3 tap(vec2 uv) {
  return toLinear(texture(uInput, uv).rgb);
}

void main() {
  vec3 c = tap(vUv + uTexel * vec2(-0.5, -0.5));
  c += tap(vUv + uTexel * vec2(0.5, -0.5));
  c += tap(vUv + uTexel * vec2(-0.5, 0.5));
  c += tap(vUv + uTexel * vec2(0.5, 0.5));
  c *= 0.25;
  float bright = max(c.r, max(c.g, c.b));
  float soft = clamp(bright - uThreshold + uKnee, 0.0, 2.0 * uKnee);
  soft = soft * soft / (4.0 * uKnee + 1e-5);
  float k = max(soft, bright - uThreshold) / max(bright, 1e-5);
  outColor = vec4(c * k, 1.0);
}`;

const SMEAR = `
uniform float uMode;
uniform vec2 uCenter;
uniform vec2 uDir;
uniform float uSpan;
uniform float uTotal;
uniform float uDecay;
uniform float uTurn;
uniform float uLinearize;
uniform float uSalt;

vec2 at(vec2 uv, float t) {
  if (uMode < 0.5) return uCenter + (uv - uCenter) * (1.0 - t);
  if (uMode < 1.5) {
    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 d = (uv - uCenter) * aspect;
    return uCenter + rotation(t * uTurn) * d / aspect;
  }
  return uv - uDir * t;
}

void main() {
  float jitter = hash12(gl_FragCoord.xy + uSalt);
  vec3 sum = vec3(0.0);
  float total = 0.0;
  for (int i = 0; i < 16; i++) {
    float t = (float(i) + jitter) / 16.0 * uSpan;
    float w = exp(-t / max(uTotal, 1e-4) * uDecay);
    vec3 c = texture(uInput, at(vUv, t)).rgb;
    if (uLinearize > 0.5) c = toLinear(c);
    sum += c * w;
    total += w;
  }
  outColor = vec4(sum / total, 1.0);
}`;

const DOWN = `
uniform vec2 uTexel;

void main() {
  vec2 t = uTexel;
  vec3 a = texture(uInput, vUv + t * vec2(-2.0, 2.0)).rgb;
  vec3 b = texture(uInput, vUv + t * vec2(0.0, 2.0)).rgb;
  vec3 c = texture(uInput, vUv + t * vec2(2.0, 2.0)).rgb;
  vec3 d = texture(uInput, vUv + t * vec2(-2.0, 0.0)).rgb;
  vec3 e = texture(uInput, vUv).rgb;
  vec3 f = texture(uInput, vUv + t * vec2(2.0, 0.0)).rgb;
  vec3 g = texture(uInput, vUv + t * vec2(-2.0, -2.0)).rgb;
  vec3 h = texture(uInput, vUv + t * vec2(0.0, -2.0)).rgb;
  vec3 i = texture(uInput, vUv + t * vec2(2.0, -2.0)).rgb;
  vec3 j = texture(uInput, vUv + t * vec2(-1.0, 1.0)).rgb;
  vec3 k = texture(uInput, vUv + t * vec2(1.0, 1.0)).rgb;
  vec3 l = texture(uInput, vUv + t * vec2(-1.0, -1.0)).rgb;
  vec3 m = texture(uInput, vUv + t * vec2(1.0, -1.0)).rgb;
  vec3 color = e * 0.125 + (a + c + g + i) * 0.03125 + (b + d + f + h) * 0.0625 + (j + k + l + m) * 0.125;
  outColor = vec4(color, 1.0);
}`;

const UP = `
uniform sampler2D uLower;
uniform vec2 uTexel;

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
  outColor = vec4(texture(uInput, vUv).rgb + s / 16.0, 1.0);
}`;

const COMPOSITE = `
uniform sampler2D uSmeared;
uniform sampler2D uLight;
uniform sampler2D uBloom;
uniform sampler2D uSmall;
uniform float uMode;
uniform vec2 uCenter;
uniform float uStrength;
uniform float uSmear;
uniform float uShadows;
uniform float uIntensity;
uniform float uLevels;
uniform vec3 uTint;

void main() {
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec3 sharp = toLinear(texture(uInput, vUv).rgb);
  vec3 soft = texture(uSmeared, vUv).rgb;
  float reach = uMode < 1.5 ? smoothstep(0.0, 0.25, length((vUv - uCenter) * aspect) * uStrength) : 1.0;
  vec3 base = mix(sharp, soft, uSmear * reach);
  float l = luma(base);
  base = mix(vec3(l), base, 1.0 + uShadows * 0.35);
  base = clamp(max(base, 0.0) * min(pow(max(l, 1e-4) / 0.4, uShadows * 1.4), 1.0), 0.0, 1.0);
  vec3 streak = texture(uLight, vUv).rgb;
  vec3 bloom = texture(uBloom, vUv).rgb / max(uLevels, 1.0);
  vec3 mean = texture(uSmall, vec2(0.25)).rgb + texture(uSmall, vec2(0.75, 0.25)).rgb;
  mean += texture(uSmall, vec2(0.25, 0.75)).rgb + texture(uSmall, vec2(0.75)).rgb;
  float energy = luma(mean * 0.25);
  vec3 light = (streak * 2.4 + bloom * 0.6) * uIntensity / (1.0 + energy * 10.0);
  vec3 hue = uTint / max(max(uTint.r, max(uTint.g, uTint.b)), 1e-3);
  float level = luma(light);
  vec3 ramp = mix(hue * hue * hue * hue, mix(hue, vec3(1.0), 0.5), smoothstep(0.1, 1.8, level));
  light = mix(light, level * ramp * 1.5, 0.8);
  vec3 color = 1.0 - (1.0 - base) * exp(-light);
  outColor = vec4(toGamma(color), 1.0);
}`;

const MODES = { zoom: 0, swirl: 1, directional: 2 };

export default {
  id: 'warpbloom',
  name: 'Warp bloom',
  category: 'light',
  blend: 'normal',
  description: 'Highlights smeared and blossomed into light, zooming, swirling or sweeping across the frame.',
  animated: true,
  animates: params => params.pulse > 0 && (params.strength > 0 || params.intensity > 0),
  params: [
    {
      key: 'mode',
      label: 'Warp',
      type: 'select',
      default: 'zoom',
      options: [
        { value: 'zoom', label: 'Zoom' },
        { value: 'swirl', label: 'Swirl' },
        { value: 'directional', label: 'Directional' }
      ]
    },
    { key: 'strength', label: 'Smear', type: 'number', min: 0, max: 1, step: 0.01, default: 0.55 },
    {
      key: 'x',
      label: 'Center X',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.5,
      when: params => params.mode !== 'directional'
    },
    {
      key: 'y',
      label: 'Center Y',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.4,
      when: params => params.mode !== 'directional'
    },
    {
      key: 'angle',
      label: 'Angle',
      type: 'number',
      min: 0,
      max: 360,
      step: 1,
      default: 90,
      when: params => params.mode === 'directional'
    },
    { key: 'threshold', label: 'Threshold', type: 'number', min: 0, max: 1, step: 0.01, default: 0.78 },
    { key: 'intensity', label: 'Bloom', type: 'number', min: 0, max: 3, step: 0.01, default: 1.3 },
    { key: 'tint', label: 'Light color', type: 'color', default: '#ffd2a1' },
    { key: 'smear', label: 'Image smear', type: 'number', min: 0, max: 1, step: 0.01, default: 0.8 },
    { key: 'shadows', label: 'Shadows', type: 'number', min: 0, max: 1, step: 0.01, default: 0.8 },
    { key: 'pulse', label: 'Pulse', type: 'number', min: 0, max: 1, step: 0.01, default: 0.3 }
  ],
  render(ctx, input, params) {
    const mode = MODES[params.mode] ?? 0;
    const beat = params.pulse > 0 ? Math.sin(ctx.time * 1.6) * 0.5 + Math.sin(ctx.time * 0.7 + 1.3) * 0.5 : 0;
    const strength = Math.max(0, params.strength * (1 + beat * 0.3 * params.pulse));
    const intensity = params.intensity * (1 + beat * 0.25 * params.pulse);
    const w = Math.max(2, Math.round(ctx.width / 2));
    const h = Math.max(2, Math.round(ctx.height / 2));
    const threshold = Math.pow(params.threshold, 2.2);
    const bright = ctx.pass('warpbloom-extract', EXTRACT, {
      input,
      target: ctx.target(w, h),
      uniforms: {
        uTexel: [1 / ctx.width, 1 / ctx.height],
        uThreshold: threshold,
        uKnee: Math.max(threshold * 0.6, 0.02)
      }
    });
    const angle = (params.angle * Math.PI) / 180;
    const span = mode === 0 ? strength * 0.85 : mode === 1 ? strength : strength * 0.6;
    const dir = [Math.cos(angle), (Math.sin(angle) * ctx.width) / ctx.height];
    const center = [params.x, 1 - params.y];
    const smear = (source, total, linearize, salt) => {
      const fine = ctx.pass('warpbloom-smear', SMEAR, {
        input: source,
        target: ctx.target(w, h),
        uniforms: {
          uMode: mode,
          uCenter: center,
          uDir: dir,
          uSpan: total / 16,
          uTotal: total,
          uDecay: 1.6,
          uTurn: Math.PI * 0.9,
          uLinearize: linearize,
          uSalt: salt
        }
      });
      const wide = ctx.pass('warpbloom-smear', SMEAR, {
        input: fine,
        target: ctx.target(w, h),
        uniforms: {
          uMode: mode,
          uCenter: center,
          uDir: dir,
          uSpan: total,
          uTotal: total,
          uDecay: 1.6,
          uTurn: Math.PI * 0.9,
          uLinearize: 0,
          uSalt: salt + 17
        }
      });
      ctx.release(fine);
      return wide;
    };
    const light = smear(bright, span, 0, 0);
    const smeared = smear(input, span * 0.7, 1, 31);

    const chain = [bright];
    let current = bright;
    while (chain.length < 6 && Math.min(current.width, current.height) > 12) {
      const next = ctx.pass('warpbloom-down', DOWN, {
        input: current,
        target: ctx.target(Math.max(1, Math.round(current.width / 2)), Math.max(1, Math.round(current.height / 2))),
        uniforms: { uTexel: [1 / current.width, 1 / current.height] }
      });
      chain.push(next);
      current = next;
    }
    let lower = chain[chain.length - 1];
    for (let index = chain.length - 2; index >= 1; index -= 1) {
      const level = chain[index];
      const up = ctx.pass('warpbloom-up', UP, {
        input: level,
        target: ctx.target(level.width, level.height),
        textures: { uLower: lower },
        uniforms: { uTexel: [1 / lower.width, 1 / lower.height] }
      });
      if (!chain.includes(lower)) ctx.release(lower);
      lower = up;
    }

    const output = ctx.pass('warpbloom-composite', COMPOSITE, {
      input,
      textures: { uSmeared: smeared, uLight: light, uBloom: lower, uSmall: chain[chain.length - 1] },
      uniforms: {
        uMode: mode,
        uCenter: center,
        uStrength: strength,
        uSmear: params.smear,
        uShadows: params.shadows,
        uIntensity: intensity,
        uLevels: chain.length - 1,
        uTint: hexToRgb(params.tint)
      }
    });
    chain.forEach(target => ctx.release(target));
    if (!chain.includes(lower)) ctx.release(lower);
    ctx.release(light);
    ctx.release(smeared);
    return output;
  }
};
