import { hexToRgb } from '../engine/assets';
import { gaussianBlur } from '../engine/blur';
import { STATS_GLSL, imageStats } from '../engine/stats';

const SHADER = `
${STATS_GLSL}
uniform sampler2D uDepth;
uniform float uSource;
uniform float uFocus;
uniform vec2 uShift;
uniform vec3 uLeft;
uniform vec3 uRight;
uniform float uColor;
uniform float uPop;

float depthAt(vec2 uv) {
  if (uSource < 0.5) return autoLevel(luma(texture(uDepth, uv).rgb));
  if (uSource < 1.5) return 1.0 - autoLevel(luma(texture(uDepth, uv).rgb));
  if (uSource < 2.5) {
    vec2 d = (uv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
    return 1.0 - smoothstep(0.0, 0.8, length(d));
  }
  if (uSource < 3.5) return smoothstep(1.0, 0.0, uv.y);
  return 1.0;
}

vec3 pop(vec3 c) {
  float l = luma(c);
  c = mix(vec3(l), c, 1.0 + uPop * 0.6);
  c = (c - 0.5) * (1.0 + uPop * 0.45) + 0.5 + uPop * 0.04;
  return clamp(c, 0.0, 1.0);
}

void main() {
  float depth = depthAt(vUv);
  float focus = uSource > 3.5 ? 0.0 : uFocus;
  vec2 shift = uShift * (depth - focus);
  vec3 left = pop(texture(uInput, vUv + shift * 0.5).rgb);
  vec3 right = pop(texture(uInput, vUv - shift * 0.5).rgb);
  vec3 l = mix(vec3(luma(left)), left, uColor);
  vec3 r = mix(vec3(luma(right)), right, uColor);
  outColor = vec4(clamp(uLeft * l + uRight * r, 0.0, 1.0), 1.0);
}`;

const SOURCES = { brightness: 0, shadows: 1, center: 2, ground: 3, flat: 4 };
const GLASSES = {
  'red-cyan': [
    [1, 0, 0],
    [0, 1, 1]
  ],
  'green-magenta': [
    [0, 1, 0],
    [1, 0, 1]
  ],
  'amber-blue': [
    [1, 1, 0],
    [0, 0, 1]
  ]
};

export default {
  id: 'anaglyph',
  name: 'Anaglyph',
  category: 'light',
  blend: 'normal',
  description: 'Red and cyan stereo 3D with depth pulled from the picture.',
  animated: true,
  preview: { params: { amount: 30, color: 0.3 } },
  animates: params => params.wiggle > 0 && params.amount > 0,
  params: [
    {
      key: 'glasses',
      label: 'Glasses',
      type: 'select',
      default: 'red-cyan',
      options: [
        { value: 'red-cyan', label: 'Red and cyan' },
        { value: 'green-magenta', label: 'Green and magenta' },
        { value: 'amber-blue', label: 'Amber and blue' },
        { value: 'custom', label: 'Custom' }
      ]
    },
    {
      key: 'lens',
      label: 'Left lens',
      type: 'color',
      default: '#ff2a55',
      when: params => params.glasses === 'custom'
    },
    { key: 'amount', label: 'Separation', type: 'number', min: 0, max: 40, step: 0.1, default: 18 },
    { key: 'angle', label: 'Direction', type: 'number', min: 0, max: 360, step: 1, default: 0 },
    {
      key: 'depth',
      label: 'Depth from',
      type: 'select',
      default: 'brightness',
      options: [
        { value: 'brightness', label: 'Bright is near' },
        { value: 'shadows', label: 'Dark is near' },
        { value: 'center', label: 'Center is near' },
        { value: 'ground', label: 'Bottom is near' },
        { value: 'flat', label: 'Flat' }
      ]
    },
    {
      key: 'focus',
      label: 'Focus',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.35,
      when: params => params.depth !== 'flat'
    },
    {
      key: 'smoothing',
      label: 'Depth softness',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.4,
      when: params => params.depth === 'brightness' || params.depth === 'shadows'
    },
    { key: 'color', label: 'Color', type: 'number', min: 0, max: 1, step: 0.01, default: 0.45 },
    { key: 'pop', label: 'Pop', type: 'number', min: 0, max: 1, step: 0.01, default: 0.35 },
    { key: 'wiggle', label: 'Wiggle', type: 'number', min: 0, max: 1, step: 0.01, default: 0 }
  ],
  render(ctx, input, params) {
    const source = SOURCES[params.depth] ?? 0;
    const fromImage = source < 2;
    const depth = fromImage ? gaussianBlur(ctx, input, (1.5 + params.smoothing * 22) * ctx.unit) : null;
    const stats = fromImage ? imageStats(ctx, depth) : null;
    const lens = hexToRgb(params.lens);
    const [left, right] =
      params.glasses === 'custom' ? [lens, lens.map(v => 1 - v)] : GLASSES[params.glasses] || GLASSES['red-cyan'];
    const t = ctx.time;
    const swing = params.wiggle > 0 ? 1 + Math.sin(t * 2.2) * 0.7 * params.wiggle : 1;
    const focus = params.focus + (params.wiggle > 0 ? Math.sin(t * 1.3 + 1) * 0.22 * params.wiggle : 0);
    const angle = (params.angle * Math.PI) / 180;
    const reach = params.amount * ctx.unit * swing * (source > 3 ? 1 : 2);
    const output = ctx.pass('anaglyph', SHADER, {
      input,
      textures: { uDepth: depth || input, uStats: stats ? stats.target : input },
      uniforms: {
        uStatsTop: stats ? stats.top : 0,
        uSource: source,
        uFocus: focus,
        uShift: [(Math.cos(angle) * reach) / ctx.width, (Math.sin(angle) * reach) / ctx.height],
        uLeft: left,
        uRight: right,
        uColor: params.color,
        uPop: params.pop
      }
    });
    if (depth) ctx.release(depth);
    if (stats) ctx.release(stats.target);
    return output;
  }
};
