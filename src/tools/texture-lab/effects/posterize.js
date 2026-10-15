import { hexToRgb } from '../engine/assets';

const SHADER = `
uniform float uLevels;
uniform float uSmooth;
uniform float uSaturation;
uniform float uOutline;
uniform vec3 uLine;

float band(float v) {
  float x = v * uLevels;
  float base = floor(x);
  float f = fract(x);
  float edge = smoothstep(0.5 - 0.06, 0.5 + 0.06, f);
  return (base + edge) / uLevels;
}

void main() {
  float lod = uSmooth;
  vec3 color = textureLod(uInput, vUv, lod).rgb;
  float l = max(luma(color), 1e-4);
  float q = band(l);
  vec3 tinted = color * (q / l);
  vec3 hue = mix(vec3(luma(tinted)), tinted, uSaturation);
  vec3 result = clamp(hue, 0.0, 1.0);

  if (uOutline > 0.0) {
    vec2 t = 1.0 / uResolution * max(uUnit, 0.6);
    float tl = luma(textureLod(uInput, vUv + vec2(-t.x, t.y), lod).rgb);
    float tr = luma(textureLod(uInput, vUv + vec2(t.x, t.y), lod).rgb);
    float bl = luma(textureLod(uInput, vUv + vec2(-t.x, -t.y), lod).rgb);
    float br = luma(textureLod(uInput, vUv + vec2(t.x, -t.y), lod).rgb);
    float gx = (tr + br) - (tl + bl);
    float gy = (tl + tr) - (bl + br);
    float edge = smoothstep(0.12, 0.32, length(vec2(gx, gy)) * uOutline * 2.0);
    result = mix(result, uLine, edge);
  }
  outColor = vec4(result, 1.0);
}`;

export default {
  id: 'posterize',
  name: 'Posterize',
  category: 'print',
  description: 'Flat cel-shaded tones with optional outlines.',
  animated: false,
  params: [
    { key: 'levels', label: 'Levels', type: 'number', min: 2, max: 12, step: 1, default: 5 },
    { key: 'smooth', label: 'Smoothing', type: 'number', min: 0, max: 4, step: 0.1, default: 1.2 },
    { key: 'saturation', label: 'Saturation', type: 'number', min: 0, max: 2, step: 0.01, default: 1.15 },
    { key: 'outline', label: 'Outline', type: 'number', min: 0, max: 1, step: 0.01, default: 0.35 },
    { key: 'line', label: 'Line color', type: 'color', default: '#141217', when: params => params.outline > 0 }
  ],
  render(ctx, input, params) {
    const source = input.mipmapped ? input : ctx.mipmap(input);
    return ctx.pass('posterize', SHADER, {
      input: source,
      uniforms: {
        uLevels: params.levels,
        uSmooth: params.smooth * Math.max(0.6, Math.log2(Math.max(ctx.unit, 1)) + 1),
        uSaturation: params.saturation,
        uOutline: params.outline,
        uLine: hexToRgb(params.line)
      }
    });
  }
};
