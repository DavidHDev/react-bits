import { hexToRgb } from '../engine/assets';
import { gaussianBlur } from '../engine/blur';

const SHADER = `
uniform float uStyle;
uniform float uFrequency;
uniform float uAngle;
uniform float uRelief;
uniform float uWaviness;
uniform float uContrast;
uniform vec3 uInk;
uniform vec3 uPaper;

uint mxRotl(uint x, int k) {
  return (x << uint(k)) | (x >> uint(32 - k));
}

uint mxFinal(uint a, uint b, uint c) {
  c ^= b;
  c -= mxRotl(b, 14);
  a ^= c;
  a -= mxRotl(c, 11);
  b ^= a;
  b -= mxRotl(a, 25);
  c ^= b;
  c -= mxRotl(b, 16);
  a ^= c;
  a -= mxRotl(c, 4);
  b ^= a;
  b -= mxRotl(a, 14);
  c ^= b;
  c -= mxRotl(b, 24);
  return c;
}

uint mxHash(int x, int y) {
  uint seed = 0xdeadbeefu + 21u;
  return mxFinal(seed + uint(x), seed + uint(y), seed);
}

float mxGradient(uint hash, float x, float y) {
  uint h = hash & 7u;
  float u = h < 4u ? x : y;
  float v = 2.0 * (h < 4u ? y : x);
  return ((h & 1u) != 0u ? -u : u) + ((h & 2u) != 0u ? -v : v);
}

float mxNoise(vec2 p) {
  int x = int(floor(p.x));
  int y = int(floor(p.y));
  float fx = p.x - float(x);
  float fy = p.y - float(y);
  float u = fx * fx * fx * (fx * (fx * 6.0 - 15.0) + 10.0);
  float v = fy * fy * fy * (fy * (fy * 6.0 - 15.0) + 10.0);
  float a = mxGradient(mxHash(x, y), fx, fy);
  float b = mxGradient(mxHash(x + 1, y), fx - 1.0, fy);
  float c = mxGradient(mxHash(x, y + 1), fx, fy - 1.0);
  float d = mxGradient(mxHash(x + 1, y + 1), fx - 1.0, fy - 1.0);
  return 0.6616 * mix(mix(a, b, u), mix(c, d, u), v);
}

float pulse(float phase, float level, float footprint) {
  float reach = acos(clamp(mix(-1.15, 1.15, clamp(level, 0.0, 1.0)), -1.0, 1.0));
  float fp = clamp(footprint, 0.001, TAU);
  float w = phase - TAU * floor(phase / TAU + 0.5);
  float a = w - fp * 0.5;
  float b = w + fp * 0.5;
  float cover = max(0.0, min(b, reach) - max(a, -reach));
  cover += max(0.0, min(b, TAU + reach) - max(a, TAU - reach));
  cover += max(0.0, min(b, reach - TAU) - max(a, -reach - TAU));
  return clamp(cover / fp, 0.0, 1.0);
}

float plate(vec2 p, float angle, float frequency, float relief, float level, float footprint) {
  float a = radians(angle);
  float w = -p.x * sin(a) + p.y * cos(a);
  return pulse(w * frequency * TAU + relief, level, footprint * frequency);
}

float spiral(vec2 p, vec2 center, float frequency, float relief, float level, float footprint, float swing) {
  vec2 d = p - center;
  float r = length(d);
  float theta = atan(d.y, d.x);
  float turn = 1.0 / max(r * uResolution.y, 0.5);
  float fp = sqrt(footprint * frequency * footprint * frequency + turn * turn) + swing;
  return pulse((r * frequency - theta / TAU) * TAU + relief, level, fp);
}

void main() {
  vec3 color = toLinear(texture(uInput, vUv).rgb);
  float lum = dot(color, vec3(0.299, 0.587, 0.114));
  float level = clamp(0.5 + (lum - 0.5) * uContrast, 0.0, 1.0);

  float aspect = uResolution.x / uResolution.y;
  vec2 pa = vec2(vUv.x * aspect, vUv.y);
  vec2 meander = vec2(mxNoise(pa * 3.1), mxNoise(pa * 3.1 + vec2(7.31, 3.77)));
  vec2 p = pa + meander * uWaviness * 0.06;

  float relief = uRelief * level * 9.42;
  float swing = fwidth(relief);
  float footprint = TAU / max(uResolution.y, 1.0);

  float cover;
  if (uStyle > 1.5) {
    cover = spiral(p, vec2(0.5 * aspect, 0.5), uFrequency, relief, level, footprint, swing);
  } else if (uStyle > 0.5) {
    float first = plate(p, uAngle, uFrequency, relief, level, footprint + swing / uFrequency);
    float second = plate(p, uAngle + 72.0, uFrequency * 0.92, relief * 0.7, level / 0.55, footprint + swing * 0.7 / (uFrequency * 0.92));
    float third = plate(p, uAngle - 38.0, uFrequency * 1.13, relief * 0.5, level / 0.28, footprint + swing * 0.5 / (uFrequency * 1.13));
    cover = max(first, max(second, third));
  } else {
    cover = plate(p, uAngle, uFrequency, relief, level, footprint + swing / uFrequency);
  }

  vec3 result = mix(toLinear(uPaper), toLinear(uInk), cover);
  outColor = vec4(toGamma(result), 1.0);
}`;

const STYLES = { line: 0, crosshatch: 1, spiral: 2 };

export default {
  id: 'engrave',
  name: 'Engraving',
  category: 'art',
  description: 'Banknote line engraving whose lines swell in the shadows and climb over the form.',
  animated: false,
  params: [
    {
      key: 'style',
      label: 'Style',
      type: 'select',
      default: 'crosshatch',
      options: [
        { value: 'line', label: 'Line' },
        { value: 'crosshatch', label: 'Cross-hatch' },
        { value: 'spiral', label: 'Spiral' }
      ]
    },
    { key: 'density', label: 'Line density', type: 'number', min: 20, max: 300, step: 1, default: 90 },
    {
      key: 'angle',
      label: 'Angle',
      type: 'number',
      min: 0,
      max: 180,
      step: 1,
      default: 8,
      when: params => params.style !== 'spiral'
    },
    { key: 'relief', label: 'Relief', type: 'number', min: 0, max: 2, step: 0.01, default: 0.6 },
    { key: 'waviness', label: 'Waviness', type: 'number', min: 0, max: 1, step: 0.01, default: 0.35 },
    { key: 'smoothing', label: 'Smoothing', type: 'number', min: 0, max: 1, step: 0.01, default: 0.4 },
    { key: 'contrast', label: 'Contrast', type: 'number', min: 0.25, max: 3, step: 0.01, default: 1.15 },
    { key: 'ink', label: 'Ink', type: 'color', default: '#1a1410' },
    { key: 'paper', label: 'Paper', type: 'color', default: '#f4eee2' }
  ],
  render(ctx, input, params) {
    const sigma = (ctx.height / Math.max(params.density, 1)) * params.smoothing * 0.4;
    const tone = sigma > 0.3 ? gaussianBlur(ctx, input, sigma) : null;
    const output = ctx.pass('engrave', SHADER, {
      input: tone || input,
      uniforms: {
        uStyle: STYLES[params.style] ?? 1,
        uFrequency: params.density,
        uAngle: params.angle,
        uRelief: params.relief,
        uWaviness: params.waviness,
        uContrast: params.contrast,
        uInk: hexToRgb(params.ink),
        uPaper: hexToRgb(params.paper)
      }
    });
    if (tone) ctx.release(tone);
    return output;
  }
};
