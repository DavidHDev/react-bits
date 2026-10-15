import { gaussianBlur } from '../engine/blur';

const DIRECTIONAL = `
uniform float uMode;
uniform float uAmount;
uniform vec2 uDirection;
uniform vec2 uCenter;

void main() {
  vec2 span = uMode < 0.5 ? uDirection * uAmount / uResolution : (vUv - uCenter) * uAmount * 0.0036;
  float jitter = (hash12(gl_FragCoord.xy) - 0.5) / 31.0;
  vec3 sum = vec3(0.0);
  float total = 0.0;
  for (int i = 0; i < 32; i++) {
    float t = float(i) / 31.0 - 0.5 + jitter;
    float w = 1.0 - abs(t) * 0.8;
    sum += texture(uInput, vUv + span * t).rgb * w;
    total += w;
  }
  outColor = vec4(sum / total, 1.0);
}`;

const TILT = `
uniform sampler2D uSoft;
uniform sampler2D uSofter;
uniform float uFocus;
uniform float uWidth;

void main() {
  float d = abs(vUv.y - uFocus);
  float k = smoothstep(uWidth * 0.5, uWidth * 0.5 + 0.28, d);
  vec3 sharp = texture(uInput, vUv).rgb;
  vec3 soft = texture(uSoft, vUv).rgb;
  vec3 softer = texture(uSofter, vUv).rgb;
  vec3 color = mix(sharp, soft, smoothstep(0.0, 0.5, k));
  color = mix(color, softer, smoothstep(0.5, 1.0, k));
  float pop = 1.0 + (1.0 - k) * 0.06;
  outColor = vec4(mix(vec3(luma(color)), color, pop), 1.0);
}`;

export default {
  id: 'blur',
  name: 'Blur',
  category: 'lens',
  blend: 'normal',
  description: 'Gaussian, zoom, motion or tilt-shift blur.',
  animated: false,
  preview: { params: { amount: 22 } },
  params: [
    {
      key: 'mode',
      label: 'Type',
      type: 'select',
      default: 'gaussian',
      options: [
        { value: 'gaussian', label: 'Gaussian' },
        { value: 'zoom', label: 'Zoom' },
        { value: 'motion', label: 'Motion' },
        { value: 'tilt', label: 'Tilt-shift' }
      ]
    },
    { key: 'amount', label: 'Amount', type: 'number', min: 0, max: 60, step: 0.1, default: 8 },
    {
      key: 'angle',
      label: 'Angle',
      type: 'number',
      min: 0,
      max: 180,
      step: 1,
      default: 0,
      when: params => params.mode === 'motion'
    },
    {
      key: 'focus',
      label: 'Focus',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.45,
      when: params => params.mode === 'tilt'
    },
    {
      key: 'width',
      label: 'Focus size',
      type: 'number',
      min: 0.02,
      max: 0.8,
      step: 0.01,
      default: 0.22,
      when: params => params.mode === 'tilt'
    }
  ],
  render(ctx, input, params) {
    const amount = params.amount * ctx.unit;
    if (amount <= 0.01) return input;
    if (params.mode === 'gaussian') return gaussianBlur(ctx, input, amount * 0.5);
    if (params.mode === 'tilt') {
      const soft = gaussianBlur(ctx, input, amount * 0.3);
      const softer = gaussianBlur(ctx, input, amount * 0.8);
      const output = ctx.pass('blur-tilt', TILT, {
        input,
        textures: { uSoft: soft, uSofter: softer },
        uniforms: { uFocus: 1 - params.focus, uWidth: params.width }
      });
      ctx.release(soft);
      ctx.release(softer);
      return output;
    }
    const angle = (params.angle * Math.PI) / 180;
    return ctx.pass('blur-directional', DIRECTIONAL, {
      input,
      uniforms: {
        uMode: params.mode === 'motion' ? 0 : 1,
        uAmount: params.mode === 'motion' ? amount * 2 : params.amount,
        uDirection: [Math.cos(angle), Math.sin(angle)],
        uCenter: [0.5, 0.5]
      }
    });
  }
};
