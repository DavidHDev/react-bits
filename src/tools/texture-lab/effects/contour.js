import { hexToRgb } from '../engine/assets';
import { gaussianBlur } from '../engine/blur';

const SHADER = `
uniform sampler2D uImage;
uniform float uLevels;
uniform float uWidth;
uniform float uSoftness;
uniform float uGamma;
uniform float uInvert;
uniform float uFlat;
uniform float uImageLines;
uniform vec3 uLine;
uniform vec3 uFill;

float height(vec2 uv) {
  float value = dot(toLinear(texture(uInput, uv).rgb), LUMA);
  value = uInvert > 0.5 ? 1.0 - value : value;
  return pow(clamp(value, 0.0, 1.0), uGamma) * uLevels + 0.5;
}

void main() {
  vec3 image = texture(uImage, vUv).rgb;
  vec2 px = 1.5 / uResolution;
  float scaled = height(vUv);
  vec2 slope = vec2(
    height(vUv + vec2(px.x, 0.0)) - height(vUv - vec2(px.x, 0.0)),
    height(vUv + vec2(0.0, px.y)) - height(vUv - vec2(0.0, px.y))
  ) / 3.0;
  float dist = abs(fract(scaled + 0.5) - 0.5) / max(length(slope), 0.0001);
  float inner = uWidth * (1.0 - (uSoftness * 0.99 + 0.01));
  float lo = min(inner, uWidth - 0.5);
  float hi = max(uWidth + 0.5, lo + 0.001);
  float mask = 1.0 - smoothstep(lo, hi, dist);

  vec3 base = uFlat > 0.5 ? toLinear(uFill) : toLinear(image);
  vec3 line = uFlat > 0.5 && uImageLines > 0.5 ? toLinear(image) : toLinear(uLine);
  outColor = vec4(toGamma(mix(base, line, mask)), 1.0);
}`;

export default {
  id: 'contour',
  name: 'Contours',
  category: 'art',
  description: 'Topographic contour lines traced through the brightness of the image.',
  animated: false,
  params: [
    { key: 'levels', label: 'Levels', type: 'number', min: 2, max: 30, step: 1, default: 8 },
    { key: 'width', label: 'Line width', type: 'number', min: 0.5, max: 5, step: 0.1, default: 1.5 },
    { key: 'softness', label: 'Softness', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { key: 'balance', label: 'Balance', type: 'number', min: 0.1, max: 2, step: 0.01, default: 0.5 },
    { key: 'smoothing', label: 'Smoothing', type: 'number', min: 0, max: 1, step: 0.01, default: 0.4 },
    { key: 'invert', label: 'Invert', type: 'boolean', default: false },
    {
      key: 'background',
      label: 'Background',
      type: 'select',
      default: 'color',
      options: [
        { value: 'color', label: 'Flat color' },
        { value: 'image', label: 'Image' }
      ]
    },
    {
      key: 'fill',
      label: 'Background color',
      type: 'color',
      default: '#121212',
      when: params => params.background === 'color'
    },
    {
      key: 'lineMode',
      label: 'Lines',
      type: 'select',
      default: 'image',
      options: [
        { value: 'image', label: 'Image colors' },
        { value: 'color', label: 'One color' }
      ],
      when: params => params.background === 'color'
    },
    {
      key: 'line',
      label: 'Line color',
      type: 'color',
      default: '#f4f1ea',
      when: params => params.background === 'image' || params.lineMode === 'color'
    }
  ],
  render(ctx, input, params) {
    const sigma = params.smoothing * 8 * ctx.unit;
    const soft = sigma > 0.3 ? gaussianBlur(ctx, input, sigma) : null;
    const output = ctx.pass('contour', SHADER, {
      input: soft || input,
      textures: { uImage: input },
      uniforms: {
        uLevels: params.levels,
        uWidth: params.width * ctx.unit,
        uSoftness: params.softness,
        uGamma: params.balance,
        uInvert: params.invert,
        uFlat: params.background === 'color',
        uImageLines: params.lineMode === 'image',
        uLine: hexToRgb(params.line),
        uFill: hexToRgb(params.fill)
      }
    });
    if (soft) ctx.release(soft);
    return output;
  }
};
