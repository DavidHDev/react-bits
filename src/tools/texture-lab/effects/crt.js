import { gaussianBlur } from '../engine/blur';

const SHADER = `
uniform sampler2D uGlowMap;
uniform float uCurvature;
uniform float uLines;
uniform float uScan;
uniform float uMaskType;
uniform float uMask;
uniform float uMaskSize;
uniform float uGlow;
uniform float uVignette;
uniform float uFlicker;
uniform float uRoll;
uniform float uConvergence;
uniform float uSeed;

vec2 warp(vec2 uv) {
  vec2 c = uv * 2.0 - 1.0;
  vec2 offset = c.yx * c.yx * vec2(0.11, 0.16) * uCurvature;
  c += c * offset;
  return c * 0.5 + 0.5;
}

vec3 maskAt(vec2 px) {
  if (uMaskType < 0.5) return vec3(1.0);
  float size = uMaskSize;
  if (uMaskType < 1.5) {
    float x = mod(floor(px.x / size), 3.0);
    return vec3(x < 0.5 ? 1.0 : 0.0, x > 0.5 && x < 1.5 ? 1.0 : 0.0, x > 1.5 ? 1.0 : 0.0);
  }
  if (uMaskType < 2.5) {
    float column = floor(px.x / (size * 3.0));
    float x = mod(floor(px.x / size), 3.0);
    vec3 triad = vec3(x < 0.5 ? 1.0 : 0.0, x > 0.5 && x < 1.5 ? 1.0 : 0.0, x > 1.5 ? 1.0 : 0.0);
    float y = fract((px.y + mod(column, 2.0) * size * 2.0) / (size * 4.0));
    return triad * (y < 0.82 ? 1.0 : 0.25);
  }
  vec2 cell = floor(px / size);
  float x = mod(cell.x + mod(cell.y, 2.0), 3.0);
  return vec3(x < 0.5 ? 1.0 : 0.0, x > 0.5 && x < 1.5 ? 1.0 : 0.0, x > 1.5 ? 1.0 : 0.0);
}

void main() {
  vec2 uv = warp(vUv);
  vec2 edge = smoothstep(vec2(0.0), vec2(0.004 + uCurvature * 0.006), uv) * smoothstep(vec2(0.0), vec2(0.004 + uCurvature * 0.006), 1.0 - uv);
  float inside = edge.x * edge.y;
  float shift = uConvergence / uResolution.x;
  vec3 color;
  color.r = texture(uInput, uv + vec2(shift, 0.0)).r;
  color.g = texture(uInput, uv).g;
  color.b = texture(uInput, uv - vec2(shift, 0.0)).b;
  vec3 linear = toLinear(color);

  float y = uv.y * uLines;
  float s = sin(fract(y) * PI);
  float bright = luma(linear);
  float beam = pow(s, mix(2.4, 0.7, clamp(bright * 1.6, 0.0, 1.0)));
  linear *= mix(1.0, beam * 1.55, uScan);

  vec3 mask = maskAt(uv * uResolution);
  linear *= mix(vec3(1.0), mask * 2.4 + 0.18, uMask);

  linear += toLinear(texture(uGlowMap, uv).rgb) * uGlow;

  if (uRoll > 0.0) {
    float band = fract(uv.y - uTime * 0.11);
    linear *= 1.0 + smoothstep(0.0, 0.12, band) * smoothstep(0.26, 0.12, band) * uRoll * 0.16;
  }
  linear *= 1.0 + (hash11(uSeed) - 0.5) * uFlicker * 0.12;

  vec2 v = vUv * 2.0 - 1.0;
  float vig = smootherstep(1.45, 0.35, length(v * vec2(0.92, 1.0)));
  linear *= mix(1.0, vig, uVignette);

  outColor = vec4(toGamma(linear) * inside, 1.0);
}`;

const MASKS = { none: 0, aperture: 1, slot: 2, shadow: 3 };

export default {
  id: 'crt',
  name: 'CRT',
  category: 'analog',
  blend: 'normal',
  description: 'Curved glass, scanlines, a phosphor mask and glow.',
  animated: true,
  animates: params => params.flicker > 0 || params.roll > 0,
  params: [
    { key: 'curvature', label: 'Curvature', type: 'number', min: 0, max: 1, step: 0.01, default: 0.45 },
    { key: 'lines', label: 'Line size', type: 'number', min: 1.5, max: 10, step: 0.1, default: 3.2 },
    { key: 'scan', label: 'Scanlines', type: 'number', min: 0, max: 1, step: 0.01, default: 0.6 },
    {
      key: 'mask',
      label: 'Mask',
      type: 'select',
      default: 'aperture',
      options: [
        { value: 'aperture', label: 'Aperture grille' },
        { value: 'slot', label: 'Slot mask' },
        { value: 'shadow', label: 'Shadow mask' },
        { value: 'none', label: 'None' }
      ]
    },
    {
      key: 'maskStrength',
      label: 'Mask strength',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.35,
      when: params => params.mask !== 'none'
    },
    { key: 'glow', label: 'Glow', type: 'number', min: 0, max: 1.5, step: 0.01, default: 0.45 },
    { key: 'convergence', label: 'Convergence', type: 'number', min: 0, max: 4, step: 0.05, default: 0.8 },
    { key: 'vignette', label: 'Vignette', type: 'number', min: 0, max: 1, step: 0.01, default: 0.55 },
    { key: 'flicker', label: 'Flicker', type: 'number', min: 0, max: 1, step: 0.01, default: 0.2 },
    { key: 'roll', label: 'Rolling band', type: 'number', min: 0, max: 1, step: 0.01, default: 0.3 }
  ],
  render(ctx, input, params) {
    const glow = gaussianBlur(ctx, input, Math.max(1, 6 * ctx.unit));
    const linePx = Math.max(1.5, params.lines * ctx.unit);
    const output = ctx.pass('crt', SHADER, {
      input,
      textures: { uGlowMap: glow },
      uniforms: {
        uCurvature: params.curvature,
        uLines: ctx.height / linePx,
        uScan: params.scan,
        uMaskType: MASKS[params.mask] ?? 1,
        uMask: params.mask === 'none' ? 0 : params.maskStrength,
        uMaskSize: Math.max(1, Math.round(ctx.unit * 1.2)),
        uGlow: params.glow,
        uVignette: params.vignette,
        uFlicker: params.flicker,
        uRoll: params.roll,
        uConvergence: params.convergence * ctx.unit,
        uSeed: Math.floor(ctx.time * 30) * 1.7
      }
    });
    ctx.release(glow);
    return output;
  }
};
