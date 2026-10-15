const SHADER = `
uniform float uShift;
uniform float uSaturation;
uniform float uInvert;
uniform float uSpread;

void main() {
  vec3 color = texture(uInput, vUv).rgb;
  if (uInvert > 0.5) color = 1.0 - color;
  vec3 hsv = rgb2hsv(color);
  float sweep = uSpread * (vUv.x * 0.6 + vUv.y * 0.4);
  hsv.x = fract(hsv.x + uShift + sweep);
  hsv.y = clamp(hsv.y * uSaturation, 0.0, 1.0);
  outColor = vec4(hsv2rgb(hsv), 1.0);
}`;

export default {
  id: 'hue',
  name: 'Hue',
  category: 'color',
  blend: 'normal',
  description: 'Rotates or cycles the colors, with an optional rainbow sweep.',
  animated: true,
  preview: { params: { shift: 140 } },
  animates: params => params.cycle > 0,
  params: [
    { key: 'shift', label: 'Shift', type: 'number', min: -180, max: 180, step: 1, default: 0 },
    { key: 'cycle', label: 'Cycle', type: 'number', min: 0, max: 2, step: 0.01, default: 0 },
    { key: 'spread', label: 'Sweep', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { key: 'saturation', label: 'Saturation', type: 'number', min: 0, max: 2, step: 0.01, default: 1 },
    { key: 'invert', label: 'Invert', type: 'boolean', default: false }
  ],
  render(ctx, input, params) {
    return ctx.pass('hue', SHADER, {
      input,
      uniforms: {
        uShift: params.shift / 360 + ctx.time * params.cycle * 0.1,
        uSaturation: params.saturation,
        uInvert: params.invert ? 1 : 0,
        uSpread: params.spread
      }
    });
  }
};
