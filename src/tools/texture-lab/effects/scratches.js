import { hexToRgb } from '../engine/assets';

const SHADER = `
uniform float uZoom;
uniform float uSharp;
uniform float uThickness;
uniform float uClock;
uniform float uRoll;
uniform float uMode;
uniform float uSeed;
uniform float uOpacity;
uniform vec3 uColor;

float cellHash(vec2 p) {
  uvec2 u = floatBitsToUint(p * vec2(141421356.0, 2718281828.0));
  return float((u.x ^ u.y) * 3141592653u) / 4294967295.0;
}

float scratch(vec2 uv, float f) {
  vec2 cell = floor(uv);
  vec2 lo = uv - cell;
  float sx = floor(sin(cell.x * 51024.0) * 3104.0);
  float sy = floor(sin(cell.y * 1324.0) * 554.0);
  float ss = sx + sy;
  vec2 q = lo * 2.0 - 1.0;
  q = q * cos(ss) + vec2(-q.y, q.x) * sin(ss);
  q += sin(sx - sy);
  q = q * 0.5 + 0.5;
  float wave = (sin(sx + q.y * PI) + sin(sy + q.y * PI)) * 0.2;
  float x = 0.5 - abs(q.x - 0.5 + wave) * (f / uThickness);
  x = smoothstep(-2.0, fwidth(x) * 1.5 + 16.0, x) * 12.0;
  float h = cellHash(cell);
  float pulse = sin(uClock + h * TAU) * 0.5 + 0.5;
  if (uMode > 0.5) {
    float roll = cellHash(cell + vec2(uRoll * 0.6180339, uRoll * 0.3819660 + 7.0));
    pulse = step(0.5, roll) * (0.35 + 0.65 * fract(roll * 7.31 + h));
  }
  return x * q.y * pulse;
}

void main() {
  vec2 p = vUv * uResolution / min(uResolution.x, uResolution.y) * uZoom + uSeed;
  float lines = 0.0;
  for (int i = 0; i < 8; i++) {
    lines = max(lines, scratch(p, uSharp));
    p = vec2(p.x + p.y * 0.7, p.x * -0.7 + p.y) - 12.31;
  }
  vec3 base = toLinear(texture(uInput, vUv).rgb);
  vec3 color = mix(base, uColor, clamp(lines, 0.0, 1.0) * uOpacity);
  outColor = vec4(toGamma(color), 1.0);
}`;

export default {
  id: 'scratches',
  name: 'Scratches',
  category: 'film',
  blend: 'normal',
  description: 'Fine hairline scratches over the image, like worn film or a scuffed surface.',
  animated: true,
  preview: { zoom: 2.5 },
  animates: params => params.speed > 0 && params.opacity > 0,
  params: [
    { key: 'opacity', label: 'Opacity', type: 'number', min: 0, max: 1, step: 0.01, default: 0.75 },
    { key: 'color', label: 'Color', type: 'color', default: '#ffffff' },
    { key: 'density', label: 'Density', type: 'number', min: -1, max: 4, step: 0.1, default: 1.5 },
    { key: 'thickness', label: 'Thickness', type: 'number', min: 0.2, max: 5, step: 0.01, default: 1.2 },
    {
      key: 'flicker',
      label: 'Flicker',
      type: 'select',
      default: 'smooth',
      options: [
        { value: 'smooth', label: 'Smooth' },
        { value: 'frame', label: 'Every frame' }
      ]
    },
    { key: 'speed', label: 'Speed', type: 'number', min: 0, max: 5, step: 0.1, default: 1 },
    { key: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 0 }
  ],
  render(ctx, input, params) {
    if (params.opacity <= 0) return input;
    const zoom = Math.exp(params.density);
    const short = Math.min(ctx.width, ctx.height);
    return ctx.pass('scratches', SHADER, {
      input,
      uniforms: {
        uZoom: zoom,
        uSharp: short / (zoom * Math.SQRT2 * ctx.unit),
        uThickness: params.thickness,
        uClock: ctx.time * params.speed,
        uRoll: Math.floor(ctx.time * 24 * params.speed),
        uMode: params.flicker === 'frame' ? 1 : 0,
        uSeed: params.variation,
        uOpacity: params.opacity,
        uColor: hexToRgb(params.color).map(c => Math.pow(c, 2.2))
      }
    });
  }
};
