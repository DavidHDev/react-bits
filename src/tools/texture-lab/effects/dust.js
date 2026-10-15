import { hexToRgb } from '../engine/assets';
import { gaussianBlur } from '../engine/blur';
import { STATS_GLSL, imageStats } from '../engine/stats';

const PRESENCE = `
${STATS_GLSL}
uniform sampler2D uSoft;
uniform float uThreshold;
uniform float uEdges;
uniform vec2 uStep;

void main() {
  vec3 c = texture(uSoft, vUv).rgb;
  float l = luma(c);
  float level = mix(l, autoLevel(l), 0.6);
  float bright = smoothstep(uThreshold, uThreshold + 0.45, level);
  bright *= bright;
  float gx = luma(texture(uSoft, vUv + vec2(uStep.x, 0.0)).rgb) - luma(texture(uSoft, vUv - vec2(uStep.x, 0.0)).rgb);
  float gy = luma(texture(uSoft, vUv + vec2(0.0, uStep.y)).rgb) - luma(texture(uSoft, vUv - vec2(0.0, uStep.y)).rgb);
  float edge = smoothstep(0.02, 0.14, length(vec2(gx, gy)));
  float presence = max(bright * (1.0 - 0.8 * uEdges), edge * smoothstep(0.05, 0.3, l) * (0.3 + 0.9 * uEdges));
  outColor = vec4(toLinear(c), presence);
}`;

const PARTICLES = `
uniform sampler2D uPresence;
uniform float uCell;
uniform float uRadius;
uniform float uDensity;
uniform float uClock;
uniform vec2 uFlow;
uniform float uTwinkle;
uniform float uWander;
uniform float uSeed;
uniform float uMode;
uniform vec3 uTint;

vec3 tone(vec3 c) {
  float top = max(c.r, max(c.g, c.b));
  vec3 hue = c / max(top, 1e-4);
  hue = pow(hue, vec3(1.5));
  return hue * (0.3 + 0.7 * sqrt(top));
}

vec3 layer(vec2 px, float scale, float speed, float index) {
  float cell = uCell * scale;
  vec2 shift = uFlow * uClock * speed;
  vec2 q = (px - shift) / cell;
  vec2 base = floor(q);
  vec3 sum = vec3(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 c = base + vec2(float(i), float(j));
      vec4 h = vec4(hash32(c + uSeed + index * 57.3), hash12(c * 1.7 + index * 13.1 + uSeed));
      vec2 wobble = vec2(sin(uClock * (0.7 + h.x) + h.y * TAU), cos(uClock * (0.6 + h.y) + h.z * TAU)) * 0.12;
      vec2 at = c + 0.5 + (h.xy - 0.5) * 0.7 + wobble * uWander;
      vec2 screen = at * cell + shift;
      vec4 info = textureLod(uPresence, screen / uResolution, 0.0);
      float visible = smoothstep(h.z - 0.08, h.z + 0.08, info.a * uDensity);
      if (visible <= 0.0) continue;
      float r = uRadius * scale * (0.55 + 0.9 * h.w * h.w);
      float d = length(q - at) * cell / r;
      float dot2 = exp(-d * d * 1.6) + exp(-d * 1.7) * 0.12;
      float flicker = mix(1.0, 0.35 + 0.65 * pow(0.5 + 0.5 * sin(uClock * (1.3 + h.w * 2.5) + h.x * TAU), 2.0), uTwinkle);
      vec3 color = uMode < 0.5 ? tone(info.rgb) : uTint;
      sum += color * dot2 * visible * flicker * (0.6 + 0.8 * h.w);
    }
  }
  return sum;
}

void main() {
  vec2 px = vUv * uResolution;
  vec3 dust = layer(px, 1.0, 1.0, 0.0);
  dust += layer(px, 1.45, 1.6, 1.0) * 0.85;
  dust += layer(px, 0.7, 0.65, 2.0) * 0.9;
  outColor = vec4(dust, 1.0);
}`;

const COMPOSITE = `
uniform sampler2D uDust;
uniform sampler2D uHalo;
uniform float uBackground;
uniform float uGlow;
uniform float uBrightness;

void main() {
  vec3 image = toLinear(texture(uInput, vUv).rgb);
  vec3 ground = image * uBackground * uBackground;
  vec3 dust = texture(uDust, vUv).rgb * uBrightness;
  vec3 halo = texture(uHalo, vUv).rgb * uGlow * uBrightness;
  vec3 color = 1.0 - (1.0 - ground) * exp(-(dust + halo));
  outColor = vec4(toGamma(color), 1.0);
}`;

export default {
  id: 'dust',
  name: 'Dreamdust',
  category: 'light',
  description: 'The picture dissolved into a drifting dust of glowing particles.',
  animated: true,
  animates: params => params.drift > 0 || params.twinkle > 0,
  params: [
    { key: 'size', label: 'Particle size', type: 'number', min: 0.5, max: 6, step: 0.05, default: 1.6 },
    { key: 'density', label: 'Density', type: 'number', min: 0, max: 1, step: 0.01, default: 0.6 },
    { key: 'threshold', label: 'Threshold', type: 'number', min: 0, max: 1, step: 0.01, default: 0.4 },
    { key: 'edges', label: 'Outline focus', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'glow', label: 'Glow', type: 'number', min: 0, max: 2, step: 0.01, default: 0.6 },
    { key: 'brightness', label: 'Brightness', type: 'number', min: 0.2, max: 3, step: 0.01, default: 1.5 },
    {
      key: 'colorMode',
      label: 'Color',
      type: 'select',
      default: 'image',
      options: [
        { value: 'image', label: 'From image' },
        { value: 'tint', label: 'One color' }
      ]
    },
    { key: 'tint', label: 'Tint', type: 'color', default: '#ffd59a', when: params => params.colorMode === 'tint' },
    { key: 'background', label: 'Image beneath', type: 'number', min: 0, max: 1, step: 0.01, default: 0.12 },
    { key: 'drift', label: 'Drift', type: 'number', min: 0, max: 2, step: 0.01, default: 0.4 },
    { key: 'direction', label: 'Direction', type: 'number', min: 0, max: 360, step: 1, default: 90 },
    { key: 'twinkle', label: 'Twinkle', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 0 }
  ],
  render(ctx, input, params) {
    const radius = Math.max(0.6, params.size * ctx.unit);
    const soft = gaussianBlur(ctx, input, Math.max(1, radius * 1.5), { maxSigma: 3 });
    const stats = imageStats(ctx, input);
    const qw = Math.max(2, Math.round(ctx.width / 2));
    const qh = Math.max(2, Math.round(ctx.height / 2));
    const presence = ctx.pass('dust-presence', PRESENCE, {
      input: soft,
      target: ctx.target(qw, qh),
      textures: { uSoft: soft, uStats: stats.target },
      uniforms: {
        uStatsTop: stats.top,
        uThreshold: params.threshold * 0.9 - 0.1,
        uEdges: params.edges,
        uStep: [(6 * ctx.unit) / ctx.width, (6 * ctx.unit) / ctx.height]
      }
    });
    ctx.release(soft);
    ctx.release(stats.target);
    const angle = (params.direction * Math.PI) / 180;
    const speed = params.drift * 40 * ctx.unit;
    const dust = ctx.pass('dust-particles', PARTICLES, {
      input,
      textures: { uPresence: presence },
      uniforms: {
        uCell: radius * (8 - params.density * 3.5),
        uRadius: radius,
        uDensity: 0.08 + params.density,
        uClock: ctx.time,
        uFlow: [Math.cos(angle) * speed, Math.sin(angle) * speed],
        uTwinkle: params.twinkle,
        uWander: Math.min(params.drift * 2, 1),
        uSeed: params.variation * 7.31,
        uMode: params.colorMode === 'tint' ? 1 : 0,
        uTint: hexToRgb(params.tint)
      }
    });
    ctx.release(presence);
    const halo = gaussianBlur(ctx, dust, Math.max(1.5, radius * 3), { maxSigma: 3 });
    const output = ctx.pass('dust-composite', COMPOSITE, {
      input,
      textures: { uDust: dust, uHalo: halo },
      uniforms: { uBackground: params.background, uGlow: params.glow * 1.5, uBrightness: params.brightness }
    });
    ctx.release(dust);
    ctx.release(halo);
    return output;
  }
};
