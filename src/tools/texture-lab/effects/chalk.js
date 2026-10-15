import { hexToRgb } from '../engine/assets';

const SHADER = `
uniform float uSpacing;
uniform float uSensitivity;
uniform float uHatch;
uniform float uShading;
uniform float uGrain;
uniform vec3 uBoard;
uniform vec3 uChalk;
uniform float uStyle;

const vec3 REC601 = vec3(0.299, 0.587, 0.114);

float tone(vec2 uv) {
  return dot(toLinear(texture(uInput, uv).rgb), REC601);
}

float hatchLine(vec2 p, float shade, float angle, float threshold) {
  vec2 q = rotation(angle) * p / uHatch;
  float wander = (valueNoise(vec2(q.x * 0.7, q.y * 0.05) + angle * 9.0) - 0.5) * 0.5;
  float d = abs(fract(q.x + wander) - 0.5) * 2.0;
  float amount = smoothstep(threshold, threshold + 0.3, shade);
  float width = 0.1 + amount * 0.28;
  float line = 1.0 - smoothstep(width * 0.5, width, d);
  float skip = smoothstep(0.3, 0.7, valueNoise(vec2(q.x * 2.3, q.y * 0.35) + angle * 3.0) + amount * 0.3);
  return line * amount * skip;
}

void main() {
  vec2 t = uSpacing / uResolution;
  float tl = tone(vUv + vec2(-t.x, -t.y));
  float tc = tone(vUv + vec2(0.0, -t.y));
  float tr = tone(vUv + vec2(t.x, -t.y));
  float ml = tone(vUv + vec2(-t.x, 0.0));
  float mr = tone(vUv + vec2(t.x, 0.0));
  float bl = tone(vUv + vec2(-t.x, t.y));
  float bc = tone(vUv + vec2(0.0, t.y));
  float br = tone(vUv + vec2(t.x, t.y));
  float gx = -tl - ml * 2.0 - bl + tr + mr * 2.0 + br;
  float gy = -tl - tc * 2.0 - tr + bl + bc * 2.0 + br;
  float high = mix(1.0, 0.08, uSensitivity);
  float edge = smoothstep(high * 0.4, high, sqrt(gx * gx + gy * gy));

  float level = tone(vUv);
  float board = dot(toLinear(uBoard), REC601);
  float span = dot(toLinear(uChalk), REC601) - board;
  float shade = abs(span) < 0.02 ? 1.0 - level : clamp((level - board) / span, 0.0, 1.0);
  vec2 p = vUv * uResolution / uUnit;
  float hatch;
  if (uStyle < 0.5) {
    vec2 r = rotation(0.42) * p;
    float streak = valueNoise(vec2(r.x * 0.045, r.y * 0.75)) * 0.65 + valueNoise(vec2(r.x * 0.11, r.y * 2.1)) * 0.35;
    float speck = valueNoise(p * 1.7) - 0.5;
    hatch = smoothstep(0.18, 0.9, shade * (0.5 + 0.6 * streak) + speck * 0.3);
  } else {
    hatch = max(max(hatchLine(p, shade, 0.785, 0.22), hatchLine(p, shade, -0.785, 0.5)), hatchLine(p, shade, 0.0, 0.78));
  }
  hatch *= uShading;

  float dust = mix(1.0 - uGrain, 1.0, valueNoise(p * 0.5) * 0.6 + valueNoise(p * 2.1) * 0.4);
  float mask = clamp(max(edge, hatch) * dust, 0.0, 1.0);
  vec3 surface = toLinear(uBoard) + (valueNoise(p * 0.9) - 0.5) * 0.04;
  vec3 color = mix(surface, toLinear(uChalk), mask);
  outColor = vec4(toGamma(color), 1.0);
}`;

export default {
  id: 'chalk',
  name: 'Chalk',
  category: 'art',
  description: 'A chalk drawing on a blackboard, with dusty outlines and smudged or cross-hatched shading.',
  animated: false,
  params: [
    { key: 'board', label: 'Board', type: 'color', default: '#1f2a25' },
    { key: 'chalk', label: 'Chalk', type: 'color', default: '#eceadb' },
    { key: 'sensitivity', label: 'Edge sensitivity', type: 'number', min: 0, max: 1, step: 0.01, default: 0.6 },
    { key: 'thickness', label: 'Stroke width', type: 'number', min: 0.5, max: 4, step: 0.1, default: 1.5 },
    { key: 'shading', label: 'Shading', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    {
      key: 'style',
      label: 'Shading style',
      type: 'select',
      default: 'smudge',
      options: [
        { value: 'smudge', label: 'Smudged' },
        { value: 'hatch', label: 'Cross-hatched' }
      ],
      when: params => params.shading > 0
    },
    {
      key: 'spacing',
      label: 'Hatch spacing',
      type: 'number',
      min: 3,
      max: 24,
      step: 0.5,
      default: 16,
      when: params => params.shading > 0 && params.style === 'hatch'
    },
    { key: 'grain', label: 'Dust', type: 'number', min: 0, max: 1, step: 0.01, default: 0.45 }
  ],
  render(ctx, input, params) {
    return ctx.pass('chalk', SHADER, {
      input,
      uniforms: {
        uSpacing: params.thickness * ctx.unit,
        uSensitivity: params.sensitivity,
        uHatch: params.spacing,
        uShading: params.shading,
        uGrain: params.grain,
        uBoard: hexToRgb(params.board),
        uChalk: hexToRgb(params.chalk),
        uStyle: params.style === 'hatch' ? 1 : 0
      }
    });
  }
};
