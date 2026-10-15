import { hexToRgb } from '../engine/assets';
import { gaussianBlur } from '../engine/blur';
import { STATS_GLSL, imageStats } from '../engine/stats';

const LINES = `
${STATS_GLSL}
uniform sampler2D uField;
uniform float uView;
uniform float uCell;
uniform vec2 uDrift;
uniform vec2 uRelief;
uniform float uWidth;
uniform float uHalo;
uniform float uThreshold;
uniform float uPattern;
uniform float uColorMode;
uniform vec3 uColor;
uniform float uHorizon;
uniform float uDepth;

vec3 field(vec2 p) {
  return texture(uField, clamp(p / uResolution, 0.0, 1.0)).rgb;
}

float level(vec3 c) {
  float l = luma(c);
  l = mix(l, autoLevel(l), 0.7);
  float v = smoothstep(uThreshold, 1.0, l);
  return v * sqrt(v);
}

vec2 gridOf(vec2 q) {
  if (uView < 0.5) return q / uCell + uDrift;
  vec2 n = (q - 0.5 * uResolution) / uResolution.y;
  float z = 1.0 / max(uHorizon - n.y, 0.02);
  return vec2(n.x * z, z) * uDepth + uDrift;
}

void main() {
  vec2 p = gl_FragCoord.xy;
  vec2 q = p;
  for (int i = 0; i < 4; i++) q = p - uRelief * level(field(q));
  vec3 surface = field(q);
  float strength = level(surface);
  vec2 g = gridOf(q);
  vec2 fw = max(fwidth(g), vec2(1e-5));
  vec2 d = abs(fract(g + 0.5) - 0.5) / fw;
  float dense = smoothstep(0.1, 0.4, max(fw.x, fw.y));
  vec2 wire = 1.0 - smoothstep(vec2(uWidth - 0.5), vec2(uWidth + 0.5), d);
  vec2 wireHalo = exp(-d * d / (2.0 * uHalo * uHalo));
  float node = length(d);
  float r = uWidth * 1.8 + 0.4;
  float bead = 1.0 - smoothstep(r - 0.6, r + 0.6, node);
  float beadHalo = exp(-node * node / (2.0 * (uHalo + r) * (uHalo + r)));

  float lines = max(wire.x, wire.y);
  float halo = max(wireHalo.x, wireHalo.y);
  float nodes = 1.0;
  if (uPattern > 0.5 && uPattern < 1.5) {
    lines = wire.y;
    halo = wireHalo.y;
    nodes = 0.0;
  } else if (uPattern > 1.5 && uPattern < 2.5) {
    lines = wire.x;
    halo = wireHalo.x;
    nodes = 0.0;
  } else if (uPattern > 2.5) {
    lines = 0.0;
    halo = 0.0;
  }

  float full = smoothstep(0.1, 0.32, strength);
  float spark = step(hash12(floor(g + 0.5) + 17.0), strength * 2.6) * (1.0 - full);
  float small = 1.0 - smoothstep(r * 0.55 - 0.6, r * 0.55 + 0.6, node);
  float core = lines * full * 0.6 + bead * nodes * full * 1.7 + small * spark * 0.9;
  float glow = (halo * full * 0.6 + beadHalo * nodes * full) * 0.35;
  float average = clamp(2.0 * uWidth * max(fw.x, fw.y), 0.0, 1.0) * full;
  core = mix(core, average, dense);
  glow = mix(glow, average, dense);
  float energy = max(strength, spark * 0.35);

  vec3 tint = uColor;
  if (uColorMode > 0.5) {
    float peak = max(max(surface.r, surface.g), max(surface.b, 0.04));
    tint = mix(surface / peak, vec3(1.0), 0.12);
  }
  float fade = uView > 0.5 ? smoothstep(uHorizon - 0.02, uHorizon - 0.5, (q.y - 0.5 * uResolution.y) / uResolution.y) : 1.0;
  vec3 light = toLinear(tint) * (core + glow) * energy * 1.5 + vec3(core * energy * energy * 0.6);
  outColor = vec4(light * fade, 1.0);
}`;

const COMPOSITE = `
uniform sampler2D uLines;
uniform sampler2D uNear;
uniform sampler2D uFar;
uniform float uGlow;
uniform vec3 uBackground;
uniform float uBackdrop;

void main() {
  vec3 lines = texture(uLines, vUv).rgb;
  vec3 near = texture(uNear, vUv).rgb;
  vec3 far = texture(uFar, vUv).rgb;
  vec3 image = texture(uInput, vUv).rgb;
  vec3 base = mix(uBackground, image * 0.55 + uBackground * 0.45, uBackdrop);
  vec3 light = lines + (near * 0.85 + far * 0.45) * uGlow;
  vec3 color = 1.0 - (1.0 - toLinear(base)) * exp(-light);
  outColor = vec4(toGamma(color), 1.0);
}`;

const PATTERNS = { grid: 0, rows: 1, columns: 2, dots: 3 };

export default {
  id: 'neongrid',
  name: 'Neon grid',
  category: 'geometric',
  description: 'A glowing neon wireframe grid that lights up and bends with the brightness of the image.',
  animated: true,
  animates: params => params.speed > 0,
  params: [
    {
      key: 'view',
      label: 'View',
      type: 'select',
      default: 'flat',
      options: [
        { value: 'flat', label: 'Flat' },
        { value: 'perspective', label: 'Perspective' }
      ]
    },
    {
      key: 'pattern',
      label: 'Pattern',
      type: 'select',
      default: 'grid',
      options: [
        { value: 'grid', label: 'Grid' },
        { value: 'rows', label: 'Rows' },
        { value: 'columns', label: 'Columns' },
        { value: 'dots', label: 'Dots' }
      ]
    },
    { key: 'density', label: 'Density', type: 'number', min: 12, max: 200, step: 1, default: 60 },
    { key: 'relief', label: 'Relief', type: 'number', min: 0, max: 1, step: 0.01, default: 0.35 },
    { key: 'width', label: 'Line width', type: 'number', min: 0.02, max: 0.4, step: 0.01, default: 0.12 },
    { key: 'threshold', label: 'Threshold', type: 'number', min: 0, max: 0.9, step: 0.01, default: 0.3 },
    {
      key: 'colorMode',
      label: 'Line color',
      type: 'select',
      default: 'neon',
      options: [
        { value: 'neon', label: 'Neon' },
        { value: 'image', label: 'From image' }
      ]
    },
    {
      key: 'color',
      label: 'Neon color',
      type: 'color',
      default: '#2fe4f2',
      when: params => params.colorMode === 'neon'
    },
    { key: 'glow', label: 'Glow', type: 'number', min: 0, max: 2, step: 0.01, default: 0.9 },
    { key: 'background', label: 'Background', type: 'color', default: '#030506' },
    { key: 'backdrop', label: 'Image behind', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { key: 'speed', label: 'Motion', type: 'number', min: 0, max: 1, step: 0.01, default: 0.2 }
  ],
  render(ctx, input, params) {
    const perspective = params.view === 'perspective';
    const cell = Math.max(2, (1000 / Math.max(params.density, 1)) * ctx.unit);
    const field = gaussianBlur(ctx, input, Math.max(cell * 0.45, 1));
    const stats = imageStats(ctx, input);
    const travel = ctx.time * params.speed;
    const lines = ctx.pass('neongrid-lines', LINES, {
      input,
      textures: { uField: field, uStats: stats.target },
      uniforms: {
        uStatsTop: stats.top,
        uView: perspective ? 1 : 0,
        uCell: cell,
        uDrift: perspective ? [0, -travel * 1.5] : [travel * 0.35, travel * 0.6],
        uRelief: [params.relief * 0.25 * cell * 2.2, params.relief * cell * 2.2],
        uWidth: Math.max(0.45, params.width * cell * 0.5),
        uHalo: Math.max(0.8, cell * 0.11),
        uThreshold: params.threshold,
        uPattern: PATTERNS[params.pattern] ?? 0,
        uColorMode: params.colorMode === 'image' ? 1 : 0,
        uColor: hexToRgb(params.color),
        uHorizon: 0.85,
        uDepth: (params.density / 1000) * (ctx.height / Math.max(ctx.unit, 1e-3)) * 0.85
      }
    });
    ctx.release(field);
    ctx.release(stats.target);
    const near = gaussianBlur(ctx, lines, 5 * ctx.unit);
    const far = gaussianBlur(ctx, lines, 22 * ctx.unit);
    const output = ctx.pass('neongrid-composite', COMPOSITE, {
      input,
      textures: { uLines: lines, uNear: near, uFar: far },
      uniforms: {
        uGlow: params.glow,
        uBackground: hexToRgb(params.background),
        uBackdrop: params.backdrop
      }
    });
    ctx.release(lines);
    ctx.release(near);
    ctx.release(far);
    return output;
  }
};
