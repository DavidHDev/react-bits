import { hexToRgb } from '../engine/assets';

const SHADER = `
uniform float uRatio;
uniform vec3 uColor;
uniform float uSoftness;

void main() {
  vec3 color = texture(uInput, vUv).rgb;
  float aspect = uResolution.x / uResolution.y;
  float soft = max(uSoftness * 0.02, 0.5 / min(uResolution.x, uResolution.y));
  float mask = 0.0;
  if (uRatio >= aspect) {
    float visible = max(aspect / uRatio, 0.5);
    float d = abs(vUv.y - 0.5) * 2.0;
    mask = smoothstep(visible - soft, visible + soft, d);
  } else {
    float visible = max(uRatio / aspect, 0.5);
    float d = abs(vUv.x - 0.5) * 2.0;
    mask = smoothstep(visible - soft * aspect, visible + soft * aspect, d);
  }
  outColor = vec4(mix(color, uColor, mask), 1.0);
}`;

export default {
  id: 'letterbox',
  name: 'Letterbox',
  category: 'film',
  blend: 'normal',
  description: 'Cinema bars that frame the picture at a wider or narrower ratio.',
  animated: false,
  params: [
    {
      key: 'ratio',
      label: 'Ratio',
      type: 'select',
      default: '2.39',
      options: [
        { value: '2.76', label: 'Ultra wide 2.76' },
        { value: '2.39', label: 'Scope 2.39' },
        { value: '2', label: 'Univisium 2.00' },
        { value: '1.85', label: 'Flat 1.85' },
        { value: '1.33', label: 'Academy 4:3' },
        { value: '1', label: 'Square' }
      ]
    },
    { key: 'color', label: 'Bar color', type: 'color', default: '#000000' },
    { key: 'softness', label: 'Edge softness', type: 'number', min: 0, max: 1, step: 0.01, default: 0 }
  ],
  render(ctx, input, params) {
    return ctx.pass('letterbox', SHADER, {
      input,
      uniforms: { uRatio: Number(params.ratio) || 2.39, uColor: hexToRgb(params.color), uSoftness: params.softness }
    });
  }
};
