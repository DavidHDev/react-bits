import { hexToRgb } from '../engine/assets';
import { gaussianBlur } from '../engine/blur';

const COMBINE = `
uniform sampler2D uSmall;
uniform sampler2D uLarge;
uniform float uTop;
uniform float uStrength;
uniform float uThreshold;
uniform float uSoftness;
uniform vec3 uInk;
uniform vec3 uPaper;
uniform float uColor;
uniform float uShading;
uniform float uSpacing;
uniform float uBoil;
uniform float uSeed;

float hatch(vec2 p, float angle, float darkness) {
  vec2 q = rotation(angle) * p / uSpacing;
  float wander = (valueNoise(vec2(q.x * 0.9, q.y * 0.045) + angle * 17.0 + uSeed) - 0.5) * 0.45;
  float d = abs(fract(q.x + wander) - 0.5) * 2.0;
  float width = 0.08 + clamp(darkness, 0.0, 1.0) * 0.62;
  float aa = fwidth(q.x) * 1.5;
  float line = 1.0 - smoothstep(width - aa, width + aa, d);
  float broken = smoothstep(0.18, 0.42, valueNoise(vec2(q.x * 3.1, q.y * 0.18) + angle * 5.0 + uSeed * 1.3) + darkness * 0.6);
  return line * smoothstep(0.0, 0.12, darkness) * broken;
}

void main() {
  vec2 p = vUv * uResolution;
  vec2 wobble = vec2(0.0);
  if (uBoil > 0.0) {
    vec2 n = vec2(valueNoise(p * 0.035 / max(uUnit, 0.3) + uSeed), valueNoise(p * 0.035 / max(uUnit, 0.3) + uSeed + 7.7)) - 0.5;
    wobble = n * uBoil * 3.0 * uUnit / uResolution;
  }
  float a = luma(texture(uSmall, vUv + wobble).rgb);
  float b = luma(texture(uLarge, vUv + wobble).rgb);
  float d = a - uStrength * b;
  float e = d >= -uThreshold ? 1.0 : 1.0 + tanh(uSoftness * (d + uThreshold));
  e = clamp(e, 0.0, 1.0);

  vec3 original = texture(uInput, vUv).rgb;
  if (uShading > 0.0) {
    float mean = luma(textureLod(uSmall, vec2(0.5), uTop).rgb);
    float tone = clamp(a + (0.5 - mean) * 0.85, 0.0, 1.0);
    vec2 hp = p + wobble * uResolution;
    float l1 = hatch(hp, 0.785, smoothstep(0.86, 0.3, tone) * uShading);
    float l2 = hatch(hp, -0.785, smoothstep(0.6, 0.12, tone) * uShading);
    float l3 = hatch(hp, 0.0, smoothstep(0.36, 0.0, tone) * uShading);
    e = min(e, 1.0 - max(max(l1, l2), l3) * 0.92);
  }
  vec3 paper = mix(uPaper, original * mix(vec3(1.0), uPaper, 0.15) * 1.08, uColor);
  outColor = vec4(mix(uInk, paper, e), 1.0);
}`;

export default {
  id: 'ink',
  name: 'Ink',
  category: 'art',
  description: 'Turns the image into a pen drawing with optional hatching.',
  animated: true,
  animates: params => params.boil > 0,
  params: [
    { key: 'weight', label: 'Line weight', type: 'number', min: 0.3, max: 4, step: 0.05, default: 1.1 },
    { key: 'detail', label: 'Detail', type: 'number', min: 0, max: 1, step: 0.01, default: 0.55 },
    { key: 'softness', label: 'Softness', type: 'number', min: 0, max: 1, step: 0.01, default: 0.35 },
    { key: 'shading', label: 'Hatching', type: 'number', min: 0, max: 1, step: 0.01, default: 0.55 },
    {
      key: 'spacing',
      label: 'Hatch spacing',
      type: 'number',
      min: 1,
      max: 12,
      step: 0.1,
      default: 3.2,
      when: params => params.shading > 0
    },
    { key: 'ink', label: 'Ink', type: 'color', default: '#1b1a1f' },
    { key: 'paper', label: 'Paper', type: 'color', default: '#f4f0e6' },
    { key: 'color', label: 'Keep color', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { key: 'boil', label: 'Line boil', type: 'number', min: 0, max: 1, step: 0.01, default: 0 }
  ],
  render(ctx, input, params) {
    const sigma = Math.max(0.6, params.weight * ctx.unit * 0.9);
    const small = ctx.mipmap(gaussianBlur(ctx, input, sigma));
    const large = gaussianBlur(ctx, input, sigma * 1.6);
    const seed = params.boil > 0 ? Math.floor(ctx.time * 10) * 3.17 : 0;
    const output = ctx.pass('ink', COMBINE, {
      input,
      textures: { uSmall: small, uLarge: large },
      uniforms: {
        uTop: Math.floor(Math.log2(Math.max(small.width, small.height))),
        uStrength: 1,
        uThreshold: 0.0015 + (1 - params.detail) * 0.012,
        uSoftness: 60 + (1 - params.softness) * 500,
        uInk: hexToRgb(params.ink),
        uPaper: hexToRgb(params.paper),
        uColor: params.color,
        uShading: params.shading,
        uSpacing: Math.max(2, params.spacing * ctx.unit),
        uBoil: params.boil,
        uSeed: seed
      }
    });
    ctx.release(small);
    ctx.release(large);
    return output;
  }
};
