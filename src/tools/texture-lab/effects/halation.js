import { hexToRgb } from '../engine/assets';
import { gaussianBlur } from '../engine/blur';

const EXTRACT = `
uniform float uThreshold;
void main() {
  vec3 linear = toLinear(texture(uInput, vUv).rgb);
  float l = luma(linear);
  float k = smoothstep(uThreshold, uThreshold + 0.35, l);
  outColor = vec4(toGamma(linear * k), 1.0);
}`;

const COMPOSITE = `
uniform sampler2D uHalo;
uniform sampler2D uWide;
uniform sampler2D uBright;
uniform float uTop;
uniform vec3 uTint;
uniform float uIntensity;

void main() {
  vec3 base = toLinear(texture(uInput, vUv).rgb);
  vec3 halo = toLinear(texture(uHalo, vUv).rgb);
  vec3 wide = toLinear(texture(uWide, vUv).rgb);
  float mean = luma(toLinear(textureLod(uBright, vec2(0.5), uTop).rgb));
  float energy = (luma(halo) * 0.65 + luma(wide) * 0.5) / (1.0 + mean * 6.0);
  vec3 color = 1.0 - (1.0 - base) * exp(-uTint * energy * uIntensity * 2.2);
  outColor = vec4(toGamma(color), 1.0);
}`;

export default {
  id: 'halation',
  name: 'Halation',
  category: 'light',
  blend: 'normal',
  description: 'The warm red halo film puts around bright lights.',
  animated: false,
  preview: { params: { threshold: 0.3, intensity: 1.5 } },
  params: [
    { key: 'threshold', label: 'Threshold', type: 'number', min: 0, max: 1, step: 0.01, default: 0.45 },
    { key: 'radius', label: 'Radius', type: 'number', min: 1, max: 30, step: 0.1, default: 9 },
    { key: 'intensity', label: 'Intensity', type: 'number', min: 0, max: 2, step: 0.01, default: 0.7 },
    { key: 'tint', label: 'Color', type: 'color', default: '#ff3d1f' }
  ],
  render(ctx, input, params) {
    const bright = ctx.mipmap(
      ctx.pass('halation-extract', EXTRACT, { input, uniforms: { uThreshold: params.threshold * 0.8 } })
    );
    const halo = gaussianBlur(ctx, bright, Math.max(1, params.radius * ctx.unit * 0.5));
    const wide = gaussianBlur(ctx, bright, Math.max(2, params.radius * ctx.unit * 1.6));
    const output = ctx.pass('halation', COMPOSITE, {
      input,
      textures: { uHalo: halo, uWide: wide, uBright: bright },
      uniforms: {
        uTint: hexToRgb(params.tint),
        uIntensity: params.intensity,
        uTop: Math.floor(Math.log2(Math.max(ctx.width, ctx.height)))
      }
    });
    ctx.release(bright);
    ctx.release(halo);
    ctx.release(wide);
    return output;
  }
};
