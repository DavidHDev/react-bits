import { hexToRgb } from '../engine/assets';
import { STATS_GLSL, imageStats } from '../engine/stats';

const SHADER = `
${STATS_GLSL}
uniform vec3 uColors[8];
uniform float uAuto;
uniform float uCount;
uniform float uContrast;
uniform float uOffset;
uniform float uMix;

vec3 gradientAt(float t) {
  float x = clamp(t, 0.0, 1.0) * (uCount - 1.0);
  float index = floor(x);
  float f = x - index;
  vec3 a = uColors[0];
  vec3 b = uColors[0];
  for (int i = 0; i < 8; i++) {
    if (float(i) == index) a = uColors[i];
    if (float(i) == min(index + 1.0, uCount - 1.0)) b = uColors[i];
  }
  return mix(a, b, smoothstep(0.0, 1.0, f));
}

void main() {
  vec3 color = texture(uInput, vUv).rgb;
  float l = luma(color);
  l = mix(l, autoLevel(l), uAuto);
  l = clamp((l - 0.5) * uContrast + 0.5, 0.0, 1.0);
  float t = l + uOffset;
  t = abs(fract(t * 0.5) * 2.0 - 1.0);
  t = uOffset == 0.0 ? l : t;
  vec3 mapped = gradientAt(t);
  outColor = vec4(mix(color, mapped, uMix), 1.0);
}`;

export const GRADIENTS = {
  thermal: ['#04020c', '#1c0a6b', '#6a0fa0', '#b8197a', '#e84a2a', '#fb9512', '#fde047', '#fffbea'],
  infrared: ['#05060a', '#2d1b69', '#b72e8f', '#ff6b6b', '#ffe66d', '#ffffff'],
  dusk: ['#16121f', '#3d2c5c', '#c3477a', '#ffb38a', '#fff3e3'],
  ocean: ['#04111d', '#0b3c5d', '#328cc1', '#9ad1d4', '#f2fdff'],
  noir: ['#0b0b0d', '#5a5a60', '#f1f1ed'],
  acid: ['#0d0221', '#2de2e6', '#f6019d', '#fdf500'],
  sepia: ['#20160f', '#6b4a32', '#c69c6d', '#f6ead6']
};

export default {
  id: 'gradient',
  name: 'Gradient map',
  category: 'color',
  blend: 'normal',
  description: 'Maps brightness onto a palette, from duotone to thermal.',
  animated: true,
  animates: params => params.cycle > 0,
  params: [
    {
      key: 'palette',
      label: 'Palette',
      type: 'select',
      default: 'dusk',
      options: [
        { value: 'dusk', label: 'Dusk' },
        { value: 'thermal', label: 'Thermal' },
        { value: 'infrared', label: 'Infrared' },
        { value: 'ocean', label: 'Ocean' },
        { value: 'noir', label: 'Noir' },
        { value: 'acid', label: 'Acid' },
        { value: 'sepia', label: 'Sepia' },
        { value: 'custom', label: 'Custom' }
      ]
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'colors',
      min: 2,
      max: 8,
      default: ['#1d1a2f', '#ff5a36', '#ffe9c4'],
      when: params => params.palette === 'custom'
    },
    { key: 'contrast', label: 'Contrast', type: 'number', min: 0.3, max: 2.5, step: 0.01, default: 1.1 },
    { key: 'auto', label: 'Auto levels', type: 'boolean', default: true },
    { key: 'mix', label: 'Strength', type: 'number', min: 0, max: 1, step: 0.01, default: 1 },
    { key: 'cycle', label: 'Cycle', type: 'number', min: 0, max: 2, step: 0.01, default: 0 }
  ],
  render(ctx, input, params) {
    const colors = params.palette === 'custom' ? params.colors || [] : GRADIENTS[params.palette] || GRADIENTS.dusk;
    const rgb = colors.slice(0, 8).map(hexToRgb);
    if (rgb.length < 2) rgb.push([1, 1, 1]);
    const count = rgb.length;
    while (rgb.length < 8) rgb.push(rgb[rgb.length - 1]);
    const stats = imageStats(ctx, input);
    const output = ctx.pass('gradient-map', SHADER, {
      input,
      textures: { uStats: stats.target },
      uniforms: {
        uStatsTop: stats.top,
        uAuto: params.auto ? 1 : 0,
        uColors: rgb,
        uCount: count,
        uContrast: params.contrast,
        uOffset: params.cycle > 0 ? ctx.time * params.cycle * 0.25 : 0,
        uMix: params.mix
      }
    });
    ctx.release(stats.target);
    return output;
  }
};
