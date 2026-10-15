import { hexToRgb } from '../engine/assets';
import { gaussianBlur } from '../engine/blur';

const STRENGTH = `
uniform float uScale;
uniform vec2 uStep;

void main() {
  float x = luma(texture(uInput, vUv + vec2(uStep.x, 0.0)).rgb) - luma(texture(uInput, vUv - vec2(uStep.x, 0.0)).rgb);
  float y = luma(texture(uInput, vUv + vec2(0.0, uStep.y)).rgb) - luma(texture(uInput, vUv - vec2(0.0, uStep.y)).rgb);
  float s = length(vec2(x, y)) * 0.5 * uScale;
  outColor = vec4(vec3(s), s);
}`;

const LINES = `
uniform sampler2D uFine;
uniform sampler2D uWide;
uniform sampler2D uStrength;
uniform float uStrengthTop;
uniform float uWidth;
uniform float uThreshold;
uniform float uScale;
uniform float uMode;
uniform vec3 uColor;

float dog(vec2 uv) {
  return luma(texture(uFine, uv).rgb) - luma(texture(uWide, uv).rgb);
}

float level(vec2 uv) {
  return luma(texture(uFine, uv).rgb);
}

vec3 vivid(vec3 c) {
  float top = max(c.r, max(c.g, c.b));
  vec3 hue = c / max(top, 1e-3);
  float spread = top - min(c.r, min(c.g, c.b));
  hue = mix(vec3(1.0), hue, clamp(spread / max(top, 1e-3) * 1.6, 0.0, 1.0));
  return pow(hue, vec3(1.6));
}

void main() {
  vec2 px = 1.0 / uResolution;
  float f = dog(vUv);
  vec2 slope = vec2(dog(vUv + vec2(px.x, 0.0)) - dog(vUv - vec2(px.x, 0.0)), dog(vUv + vec2(0.0, px.y)) - dog(vUv - vec2(0.0, px.y))) * 0.5;
  float dist = abs(f) / max(length(slope), 1e-6);
  float line = 1.0 - smoothstep(uWidth * 0.5 - 0.6, uWidth * 0.5 + 0.6, dist);
  float typical = textureLod(uStrength, vec2(0.5), uStrengthTop).a;
  float th = clamp(typical * uThreshold, 0.01, 0.5);
  vec2 grad = vec2(level(vUv + vec2(px.x, 0.0)) - level(vUv - vec2(px.x, 0.0)), level(vUv + vec2(0.0, px.y)) - level(vUv - vec2(0.0, px.y))) * 0.5;
  float fine = length(grad) * uScale;
  float gate = smoothstep(th, th * 1.6, fine) * (0.55 + 0.45 * smoothstep(th, th * 4.0, fine));
  line *= gate;
  vec3 tone = uMode < 0.5 ? vivid(texture(uFine, vUv).rgb) : uColor;
  outColor = vec4(tone * line, line);
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
  outColor = vec4(texture(uInput, vUv).rgb + s / 16.0 * 0.6, 1.0);
}`;

const COMPOSITE = `
uniform sampler2D uLines;
uniform sampler2D uGlow;
uniform float uBackground;
uniform float uGlowAmount;
uniform float uBrightness;
uniform float uPulse;
uniform float uClock;

void main() {
  vec3 image = toLinear(texture(uInput, vUv).rgb);
  vec3 ground = mix(vec3(luma(image)), image, 0.7) * uBackground * uBackground;
  vec4 lines = texture(uLines, vUv);
  vec3 glow = texture(uGlow, vUv).rgb * 0.8;
  vec2 p = vUv * uResolution / max(uResolution.x, uResolution.y);
  float wave = 0.5 + 0.5 * sin(uClock - (p.x * 0.8 + p.y * 1.3) * 7.0 + valueNoise(p * 3.0 + uClock * 0.1) * 3.0);
  float beat = mix(1.0, 0.35 + 1.1 * wave * wave, uPulse);
  vec3 tone = lines.rgb * uBrightness * beat;
  vec3 core = mix(tone, vec3(luma(tone)) + tone * 0.35, smoothstep(0.4, 1.0, lines.a) * 0.55);
  vec3 light = core + glow * uGlowAmount * uBrightness * beat;
  vec3 color = 1.0 - (1.0 - ground) * exp(-light);
  outColor = vec4(toGamma(color), 1.0);
}`;

export default {
  id: 'edgeglow',
  name: 'Edge glow',
  category: 'light',
  description: 'Edges traced as glowing neon lines over a dark ground.',
  animated: true,
  animates: params => params.pulse > 0,
  params: [
    {
      key: 'colorMode',
      label: 'Line color',
      type: 'select',
      default: 'image',
      options: [
        { value: 'image', label: 'From image' },
        { value: 'custom', label: 'One color' }
      ]
    },
    { key: 'color', label: 'Color', type: 'color', default: '#3df0ff', when: params => params.colorMode === 'custom' },
    { key: 'thickness', label: 'Thickness', type: 'number', min: 0.5, max: 6, step: 0.1, default: 1.4 },
    { key: 'glow', label: 'Glow', type: 'number', min: 0, max: 3, step: 0.01, default: 1.2 },
    { key: 'brightness', label: 'Brightness', type: 'number', min: 0.2, max: 3, step: 0.01, default: 1.4 },
    { key: 'threshold', label: 'Threshold', type: 'number', min: 0, max: 1, step: 0.01, default: 0.3 },
    { key: 'detail', label: 'Detail', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'background', label: 'Image beneath', type: 'number', min: 0, max: 1, step: 0.01, default: 0.25 },
    { key: 'pulse', label: 'Pulse', type: 'number', min: 0, max: 1, step: 0.01, default: 0.3 }
  ],
  render(ctx, input, params) {
    const sigma = (0.7 + Math.pow(1 - params.detail, 1.5) * 5) * ctx.unit;
    const fine = gaussianBlur(ctx, input, sigma);
    const wide = gaussianBlur(ctx, input, sigma * 1.6);
    const qw = Math.max(2, Math.round(ctx.width / 4));
    const qh = Math.max(2, Math.round(ctx.height / 4));
    const strength = ctx.mipmap(
      ctx.pass('edgeglow-strength', STRENGTH, {
        input: fine,
        target: ctx.target(qw, qh),
        uniforms: { uScale: sigma * 2.5, uStep: [1 / ctx.width, 1 / ctx.height] }
      })
    );
    const lines = ctx.pass('edgeglow-lines', LINES, {
      input,
      textures: { uFine: fine, uWide: wide, uStrength: strength },
      uniforms: {
        uStrengthTop: Math.floor(Math.log2(Math.max(qw, qh))),
        uWidth: Math.max(0.8, params.thickness * ctx.unit),
        uThreshold: 0.6 + params.threshold * 5,
        uScale: sigma * 2.5,
        uMode: params.colorMode === 'custom' ? 1 : 0,
        uColor: hexToRgb(params.color)
      }
    });
    ctx.release(fine);
    ctx.release(wide);
    ctx.release(strength);

    const w = Math.max(2, Math.round(ctx.width / 2));
    const h = Math.max(2, Math.round(ctx.height / 2));
    const first = ctx.pass('edgeglow-down', DOWN, {
      input: lines,
      target: ctx.target(w, h),
      uniforms: { uTexel: [0.5 / ctx.width, 0.5 / ctx.height] }
    });
    const chain = [first];
    let current = first;
    while (chain.length < 5 && Math.min(current.width, current.height) > 12) {
      const next = ctx.pass('edgeglow-down', DOWN, {
        input: current,
        target: ctx.target(Math.max(1, Math.round(current.width / 2)), Math.max(1, Math.round(current.height / 2))),
        uniforms: { uTexel: [1 / current.width, 1 / current.height] }
      });
      chain.push(next);
      current = next;
    }
    let lower = chain[chain.length - 1];
    for (let index = chain.length - 2; index >= 0; index -= 1) {
      const level = chain[index];
      const up = ctx.pass('edgeglow-up', UP, {
        input: level,
        target: ctx.target(level.width, level.height),
        textures: { uLower: lower },
        uniforms: { uTexel: [1 / lower.width, 1 / lower.height] }
      });
      if (!chain.includes(lower)) ctx.release(lower);
      lower = up;
    }

    const output = ctx.pass('edgeglow-composite', COMPOSITE, {
      input,
      textures: { uLines: lines, uGlow: lower },
      uniforms: {
        uBackground: params.background,
        uGlowAmount: params.glow,
        uBrightness: params.brightness,
        uPulse: params.pulse,
        uClock: ctx.time * 1.4
      }
    });
    chain.forEach(target => ctx.release(target));
    if (!chain.includes(lower)) ctx.release(lower);
    ctx.release(lines);
    return output;
  }
};
