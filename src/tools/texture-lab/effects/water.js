import { hexToRgb } from '../engine/assets';

const SHADER = `
uniform float uScale;
uniform float uCaustic;
uniform float uWaves;
uniform float uLayering;
uniform float uHighlights;
uniform vec3 uHighlight;
uniform float uT;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float causticNoise(vec2 uv, float t, float scale) {
  vec2 n = vec2(0.1);
  vec2 N = vec2(0.1);
  mat2 m = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int j = 0; j < 6; j++) {
    uv *= m;
    n *= m;
    vec2 q = uv * scale + float(j) + n + (0.5 + 0.5 * float(j)) * (mod(float(j), 2.0) - 1.0) * t;
    n += sin(q);
    N += cos(q) / scale;
    scale *= 1.1;
  }
  return N.x + N.y + 1.0;
}

vec2 mirrorUv(vec2 uv) {
  return 1.0 - abs(1.0 - abs(uv));
}

void main() {
  vec2 imageUV = vec2(vUv.x, 1.0 - vUv.y);
  vec2 patternUV = (imageUV - 0.5) * uResolution / uScale;
  float t = uT;

  float waves = snoise((0.3 + 0.1 * sin(t)) * 0.1 * patternUV + vec2(0.0, 0.4 * t));
  float caustic = causticNoise(patternUV + uWaves * vec2(1.0, -1.0) * waves, 2.0 * t, 1.5);
  if (uLayering > 0.0) {
    caustic += uLayering * causticNoise(patternUV + 2.0 * uWaves * vec2(1.0, -1.0) * waves, 1.5 * t, 2.0);
  }
  caustic = caustic * caustic;

  float wavesShift = 0.1 * uWaves * waves;
  vec2 shift = vec2(wavesShift, -wavesShift) + uCaustic * 0.02 * caustic;
  vec2 offset = shift * vec2(1000.0, 666.6667) * uUnit / uResolution;
  vec2 uv = imageUV + offset;
  vec3 color = texture(uInput, mirrorUv(vec2(uv.x, 1.0 - uv.y))).rgb;

  float glow = 0.025 * uHighlights * caustic;
  color = mix(color, uHighlight, 0.05 * uHighlights * caustic);
  color += glow * (0.5 + 0.5 * waves);
  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;

export default {
  id: 'water',
  name: 'Water',
  category: 'distort',
  blend: 'normal',
  description: 'Rippling water over the picture, with refracted caustics and glints of light.',
  animated: true,
  animates: params => params.speed > 0,
  params: [
    { key: 'size', label: 'Size', type: 'number', min: 0.05, max: 1, step: 0.01, default: 0.6 },
    { key: 'refraction', label: 'Refraction', type: 'number', min: 0, max: 1, step: 0.01, default: 0.15 },
    { key: 'waves', label: 'Waves', type: 'number', min: 0, max: 1, step: 0.01, default: 0.12 },
    { key: 'layering', label: 'Layering', type: 'number', min: 0, max: 1, step: 0.01, default: 0.4 },
    { key: 'highlights', label: 'Highlights', type: 'number', min: 0, max: 1, step: 0.01, default: 0.25 },
    { key: 'color', label: 'Highlight color', type: 'color', default: '#ffffff' },
    { key: 'speed', label: 'Speed', type: 'number', min: 0, max: 3, step: 0.05, default: 0.6 }
  ],
  render(ctx, input, params) {
    return ctx.pass('water', SHADER, {
      input,
      uniforms: {
        uScale: (0.01 + 0.09 * params.size) * 666.6667 * ctx.unit,
        uCaustic: params.refraction * 0.25,
        uWaves: params.waves,
        uLayering: params.layering,
        uHighlights: params.highlights,
        uHighlight: hexToRgb(params.color),
        uT: ctx.time * params.speed
      }
    });
  }
};
