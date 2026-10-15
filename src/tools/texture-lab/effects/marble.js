import { hexToRgb } from '../engine/assets';

const FLOW = `
uniform vec2 uUnits;
uniform float uScale;
uniform float uSeed;
uniform float uClock;
uniform float uEddies;

float stream(vec2 p) {
  vec2 q = p / uScale;
  float a = valueNoise(q * 0.55 + vec2(uClock * 0.11, -uClock * 0.07) + uSeed * 1.7);
  float b = valueNoise(rotation(1.1) * q * 1.3 + vec2(-uClock * 0.17, uClock * 0.13) + uSeed * 3.1 + 19.0);
  float c = valueNoise(rotation(2.3) * q * 2.9 + vec2(uClock * 0.23, uClock * 0.19) + uSeed * 0.7 + 41.0);
  return (a * 1.0 + b * 0.45 + c * 0.18) * uScale * 0.9;
}

void main() {
  vec2 p = vUv * uUnits;
  float e = uScale * 0.04;
  float dx = stream(p + vec2(e, 0.0)) - stream(p - vec2(e, 0.0));
  float dy = stream(p + vec2(0.0, e)) - stream(p - vec2(0.0, e));
  vec2 v = vec2(dy, -dx) / (2.0 * e);
  float cell = uScale * 1.15;
  vec2 base = floor(p / cell);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 c = base + vec2(float(x), float(y));
      vec3 h = hash32(c + uSeed * 7.13);
      if (h.z < 0.25) continue;
      vec2 wobble = vec2(sin(uClock * 0.21 + h.x * TAU), cos(uClock * 0.17 + h.y * TAU)) * 0.12;
      vec2 center = (c + 0.2 + h.xy * 0.6 + wobble) * cell;
      float radius = cell * (0.16 + 0.26 * fract(h.x * 7.31 + h.y * 3.17));
      float spin = (fract(h.z * 13.7) < 0.5 ? -1.0 : 1.0) * mix(0.6, 1.0, fract(h.y * 5.9));
      vec2 d = p - center;
      v += uEddies * spin * vec2(-d.y, d.x) / radius * exp(-dot(d, d) / (radius * radius)) * 3.2;
    }
  }
  outColor = vec4(v, 0.0, 1.0);
}`;

const ADVECT = `
uniform sampler2D uFlow;
uniform vec2 uUnits;
uniform float uStep;
uniform float uGrain;

vec2 velocity(vec2 p) {
  return texture(uFlow, p / uUnits).xy;
}

float streakAlong(vec2 p, float dir) {
  float sum = 0.0;
  vec2 q = p;
  for (int i = 1; i <= 10; i++) {
    vec2 v = velocity(q);
    q += dir * v / max(length(v), 1e-4) * uGrain * 0.8;
    float w = 1.0 - float(i) / 11.0;
    sum += (valueNoise(q / uGrain) - 0.5) * w;
  }
  return sum;
}

void main() {
  vec2 p = vUv * uUnits;
  vec2 q = p;
  for (int i = 0; i < 24; i++) {
    vec2 mid = q - velocity(q) * uStep * 0.5;
    q -= velocity(mid) * uStep;
  }
  float streak = (valueNoise(p / uGrain) - 0.5) + streakAlong(p, 1.0) + streakAlong(p, -1.0);
  outColor = vec4((q - p) / uUnits, clamp(0.5 + streak * 0.42, 0.0, 1.0), 1.0);
}`;

const SHADE = `
uniform sampler2D uAdvect;
uniform vec2 uUnits;
uniform float uMode;
uniform vec3 uStone;
uniform vec3 uVein;
uniform float uVeins;
uniform float uDensity;
uniform float uPolish;
uniform float uSeed;
uniform float uScale;
uniform float uLod;
uniform vec2 uAdvectSize;

vec2 mirrorUv(vec2 uv) {
  return 1.0 - abs(1.0 - mod(uv, 2.0));
}

float lines(float v, float width) {
  float d = abs(fract(v + 0.5) - 0.5);
  float w = fwidth(v) + 1e-5;
  float wide = max(width, w * 0.9);
  float fade = 1.0 - smoothstep(0.18, 0.4, w);
  float line = exp(-d * d / (wide * wide) * 1.6) * (width / wide);
  return line * fade + width * 1.6 * (1.0 - fade);
}

float smoothNoise(vec2 p) {
  return valueNoise(p) * 0.65 + valueNoise(rotation(0.9) * p * 2.1 + 7.3) * 0.35;
}

void main() {
  vec4 adv = texture(uAdvect, vUv);
  vec2 uv = vUv + adv.xy;
  vec2 q = uv * uUnits;
  vec2 muv = mirrorUv(uv);
  vec3 color = textureLod(uInput, muv, 0.6).rgb;
  float soft = luma(textureLod(uInput, muv, uLod).rgb);
  float wander = smoothNoise(q / (uScale * 0.45) + uSeed * 2.3);
  float field = soft * mix(2.0, 12.0, uDensity) + wander * mix(0.8, 3.2, uDensity);
  float major = lines(field, 0.045 + 0.03 * smoothNoise(q / (uScale * 0.18) + 5.0));
  float minor = lines(field * 2.618 + 0.37, 0.022) * 0.4;
  float vein = clamp(major + minor, 0.0, 1.0);
  float stripes = adv.z;

  vec3 base;
  if (uMode < 0.5) {
    vec3 c = mix(vec3(luma(color)), color, 1.25);
    base = clamp((c - 0.5) * 1.15 + 0.5, 0.0, 1.0);
    base *= 1.0 + (stripes - 0.5) * 0.44 * uVeins;
  } else {
    float cloud = smoothstep(0.05, 0.95, soft) * 0.75 + (wander - 0.5) * 0.6;
    base = uStone * (0.7 + 0.6 * cloud);
    base = mix(base, mix(uStone, uVein, 0.28), smoothstep(0.5, 1.0, cloud) * 0.55);
    base *= 1.0 + (stripes - 0.5) * 0.12 * uVeins * 2.0;
  }
  float reach = uMode < 0.5 ? 0.18 + 0.82 * smoothstep(0.02, 0.45, luma(base)) : 1.0;
  vec3 marble = mix(base, uVein, vein * uVeins * reach);

  vec2 at = 1.0 / uAdvectSize;
  float sx = texture(uAdvect, vUv + vec2(at.x, 0.0)).z - texture(uAdvect, vUv - vec2(at.x, 0.0)).z;
  float sy = texture(uAdvect, vUv + vec2(0.0, at.y)).z - texture(uAdvect, vUv - vec2(0.0, at.y)).z;
  vec2 grad = vec2(sx, sy) * 2.2 + vec2(dFdx(vein), dFdy(vein)) * 0.5;
  vec3 n = normalize(vec3(-grad, 1.0));
  vec3 light = normalize(vec3(-0.5, 0.6, 0.62));
  vec3 h = normalize(light + vec3(0.0, 0.0, 1.0));
  float glint = max(pow(max(dot(n, h), 0.0), 36.0) - pow(h.z, 36.0), 0.0);
  vec3 tone3 = vec3(luma(marble));
  vec3 deep = pow(mix(tone3, marble, 1.0 + uPolish * 0.25), vec3(1.0 + uPolish * 0.45));
  vec3 finish = mix(marble, deep, uPolish);
  finish += vec3(glint) * uPolish * 0.9;
  outColor = vec4(clamp(finish, 0.0, 1.0), 1.0);
}`;

export default {
  id: 'marble',
  name: 'Marble',
  category: 'material',
  blend: 'normal',
  description: 'Swirls the picture into polished marble with veins that follow its tones.',
  animated: true,
  animates: params => params.speed > 0,
  params: [
    {
      key: 'colors',
      label: 'Colors',
      type: 'select',
      default: 'image',
      options: [
        { value: 'image', label: 'Image colors' },
        { value: 'stone', label: 'Stone' }
      ]
    },
    {
      key: 'stone',
      label: 'Stone color',
      type: 'color',
      default: '#1d1b21',
      when: params => params.colors === 'stone'
    },
    { key: 'vein', label: 'Vein color', type: 'color', default: '#f4eee6' },
    { key: 'veins', label: 'Veins', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'density', label: 'Vein density', type: 'number', min: 0, max: 1, step: 0.01, default: 0.45 },
    { key: 'swirl', label: 'Swirl', type: 'number', min: 0, max: 1, step: 0.01, default: 0.42 },
    { key: 'scale', label: 'Swirl size', type: 'number', min: 0, max: 1, step: 0.01, default: 0.3 },
    { key: 'polish', label: 'Polish', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'speed', label: 'Flow speed', type: 'number', min: 0, max: 1, step: 0.01, default: 0.2 },
    { key: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 0 }
  ],
  render(ctx, input, params) {
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const units = [ctx.width / ctx.unit, ctx.height / ctx.unit];
    const scale = 50 + 250 * params.scale;
    const clock = ctx.time * params.speed * 1.2;
    const flowScale = Math.min(1, 384 / Math.max(ctx.width, ctx.height));
    const flow = ctx.pass('marble-flow', FLOW, {
      target: ctx.target(Math.max(8, ctx.width * flowScale), Math.max(8, ctx.height * flowScale)),
      uniforms: { uUnits: units, uScale: scale, uSeed: params.variation, uClock: clock, uEddies: 1 }
    });
    const advectScale = Math.min(1, 1024 / Math.max(ctx.width, ctx.height));
    const advect = ctx.pass('marble-advect', ADVECT, {
      target: ctx.target(Math.max(8, ctx.width * advectScale), Math.max(8, ctx.height * advectScale)),
      textures: { uFlow: flow },
      uniforms: { uUnits: units, uStep: (params.swirl * scale * 1.6) / 24, uGrain: 4.6 - 3.2 * params.density }
    });
    ctx.release(flow);
    const output = ctx.pass('marble', SHADE, {
      input: source,
      textures: { uAdvect: advect },
      uniforms: {
        uUnits: units,
        uMode: params.colors === 'stone' ? 1 : 0,
        uStone: hexToRgb(params.stone),
        uVein: hexToRgb(params.vein),
        uVeins: params.veins,
        uDensity: params.density,
        uPolish: params.polish,
        uSeed: params.variation,
        uScale: scale,
        uLod: Math.max(0, Math.log2(5 * ctx.unit)),
        uAdvectSize: [advect.width, advect.height]
      }
    });
    ctx.release(advect);
    return output;
  }
};
