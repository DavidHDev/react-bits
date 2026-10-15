import { hexToRgb } from '../engine/assets';
import { gaussianBlur } from '../engine/blur';

const SHADER = `
uniform sampler2D uTone;
uniform float uTile;
uniform float uWidth;
uniform float uWeight;
uniform float uPattern;
uniform float uStyle;
uniform float uMode;
uniform vec3 uInk;
uniform vec3 uGround;
uniform float uContrast;
uniform float uShuffle;
uniform float uSeed;
uniform float uLod;

float toneAt(vec3 c) {
  float l = clamp((luma(c) - 0.5) * uContrast + 0.5, 0.0, 1.0);
  float g = luma(uGround);
  return mix(l, 1.0 - l, smoothstep(0.35, 0.65, g));
}

float choose(vec2 cell, float tone) {
  float h = hash12(cell + uSeed * 17.31);
  if (uPattern < 0.5) return step(0.5, h);
  if (uPattern < 1.5) return step(h, mix(0.1, 0.9, smoothstep(0.15, 0.85, tone)));
  if (uPattern < 2.5) return mod(cell.x + cell.y, 2.0);
  return step(0.94, h);
}

float arcs(vec2 f, float w) {
  float a = abs(length(f) - 0.5);
  float b = abs(length(f - 1.0) - 0.5);
  if (uStyle < 0.5) return min(a, b) - w;
  if (uStyle < 1.5) {
    float t = clamp(w * 0.28, 0.004, 0.066);
    float gap = 0.06 + t * 1.2;
    return min(abs(a - gap) - t, abs(b - gap) - t);
  }
  return abs(f.x - f.y) * 0.70710678 - w;
}

void main() {
  vec2 p = vUv * uResolution;
  vec2 g = p / uTile;
  vec2 cell = floor(g);
  vec2 f = g - cell;
  vec2 centerUv = (cell + 0.5) * uTile / uResolution;
  float cellTone = toneAt(texture(uTone, centerUv).rgb);
  float flip = choose(cell, cellTone);
  if (uShuffle > 0.0) {
    float rate = 0.08 + 0.12 * hash12(cell + 3.7 + uSeed);
    float phase = uShuffle * rate + hash12(cell + 9.1 + uSeed);
    flip = mod(flip + floor(phase), 2.0);
    f = rotation(smootherstep(0.0, 0.7 * rate, fract(phase)) * PI * 0.5) * (f - 0.5) + 0.5;
  }
  if (flip > 0.5) f.x = 1.0 - f.x;
  vec3 smoothColor = texture(uTone, vUv).rgb;
  float tone = toneAt(smoothColor);
  float w = uWidth * mix(1.0, 0.08 + 1.1 * tone, uWeight) * 0.5;
  float d = arcs(f, w) * uTile;
  float aa = 0.75;
  float cover = smoothstep(aa, -aa, d) * clamp(w * uTile * 2.0 / 1.2, 0.0, 1.0);
  vec3 image = textureLod(uInput, vUv, uLod).rgb;
  vec3 ink = uInk;
  if (uMode < 0.5) {
    vec3 hsv = rgb2hsv(image);
    float dark = smoothstep(0.35, 0.65, luma(uGround));
    float value = mix(0.14 + 0.86 * pow(tone, 0.85), 0.9 - 0.72 * pow(tone, 0.9), dark);
    ink = hsv2rgb(vec3(hsv.x, clamp(hsv.y * mix(0.5, 1.7, smoothstep(0.04, 0.45, tone)), 0.0, 1.0), value));
  }
  outColor = vec4(mix(uGround, ink, cover), 1.0);
}`;

const PATTERNS = { maze: 0, tone: 1, rings: 2, waves: 3 };
const STYLES = { arcs: 0, double: 1, diagonal: 2 };
const MODES = { image: 0, ink: 1 };

export default {
  id: 'truchet',
  name: 'Truchet',
  category: 'geometric',
  description: 'Curved arc tiles join into a flowing woven pattern that takes its weight and color from the picture.',
  animated: true,
  preview: { zoom: 2 },
  animates: params => params.shuffle > 0,
  params: [
    {
      key: 'pattern',
      label: 'Pattern',
      type: 'select',
      default: 'tone',
      options: [
        { value: 'tone', label: 'Follow tone' },
        { value: 'maze', label: 'Maze' },
        { value: 'rings', label: 'Rings' },
        { value: 'waves', label: 'Waves' }
      ]
    },
    {
      key: 'style',
      label: 'Style',
      type: 'select',
      default: 'arcs',
      options: [
        { value: 'arcs', label: 'Arcs' },
        { value: 'double', label: 'Double arcs' },
        { value: 'diagonal', label: 'Diagonals' }
      ]
    },
    { key: 'size', label: 'Tile size', type: 'number', min: 6, max: 80, step: 0.5, default: 20 },
    { key: 'width', label: 'Line width', type: 'number', min: 0.03, max: 0.45, step: 0.01, default: 0.22 },
    { key: 'weight', label: 'Weight by tone', type: 'number', min: 0, max: 1, step: 0.01, default: 0.6 },
    { key: 'contrast', label: 'Contrast', type: 'number', min: 0.5, max: 2.5, step: 0.01, default: 1.2 },
    {
      key: 'color',
      label: 'Color',
      type: 'select',
      default: 'image',
      options: [
        { value: 'image', label: 'From image' },
        { value: 'ink', label: 'Single ink' }
      ]
    },
    { key: 'ink', label: 'Ink', type: 'color', default: '#f4efe6', when: params => params.color === 'ink' },
    { key: 'ground', label: 'Background', type: 'color', default: '#0b0a0f' },
    { key: 'shuffle', label: 'Shuffle', type: 'number', min: 0, max: 2, step: 0.01, default: 0 },
    { key: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 0 }
  ],
  render(ctx, input, params) {
    const tile = Math.max(3, params.size * ctx.unit);
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const tone = gaussianBlur(ctx, input, tile * 0.3);
    const output = ctx.pass('truchet', SHADER, {
      input: source,
      textures: { uTone: tone },
      uniforms: {
        uTile: tile,
        uWidth: params.width,
        uWeight: params.weight,
        uPattern: PATTERNS[params.pattern] ?? 1,
        uStyle: STYLES[params.style] ?? 0,
        uMode: MODES[params.color] ?? 0,
        uInk: hexToRgb(params.ink),
        uGround: hexToRgb(params.ground),
        uContrast: params.contrast,
        uShuffle: ctx.time * params.shuffle,
        uSeed: params.variation,
        uLod: Math.max(0, Math.log2(tile * 0.15))
      }
    });
    ctx.release(tone);
    return output;
  }
};
