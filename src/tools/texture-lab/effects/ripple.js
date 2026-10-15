const SHADER = `
uniform float uMode;
uniform float uAmplitude;
uniform float uFrequency;
uniform float uSpeed;
uniform float uAngle;
uniform float uShine;
uniform vec2 uCenter;

void main() {
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 d = (vUv - uCenter) * aspect;
  float t = uTime * uSpeed;
  vec2 offset;
  float wave;
  if (uMode < 0.5) {
    float r = length(d);
    wave = sin(r * uFrequency * 40.0 - t * 4.0);
    float fade = exp(-r * 1.4);
    offset = d / max(r, 1e-4) * wave * uAmplitude * fade;
  } else {
    vec2 dir = vec2(cos(uAngle), sin(uAngle));
    float x = dot(d, dir);
    wave = sin(x * uFrequency * 40.0 - t * 4.0) + 0.5 * sin(x * uFrequency * 23.0 + t * 2.3);
    offset = vec2(-dir.y, dir.x) * wave * uAmplitude * 0.7;
  }
  vec3 color = texture(uInput, vUv + offset / aspect).rgb;
  color += uShine * 0.12 * max(wave, 0.0) * smoothstep(0.0, 0.02, uAmplitude);
  outColor = vec4(color, 1.0);
}`;

export default {
  id: 'ripple',
  name: 'Ripple',
  category: 'distort',
  blend: 'normal',
  description: 'Water rings from the center, or rolling waves.',
  animated: true,
  preview: { params: { amplitude: 0.03 } },
  animates: params => params.speed > 0 && params.amplitude > 0,
  params: [
    {
      key: 'mode',
      label: 'Type',
      type: 'select',
      default: 'rings',
      options: [
        { value: 'rings', label: 'Rings' },
        { value: 'waves', label: 'Waves' }
      ]
    },
    { key: 'amplitude', label: 'Amplitude', type: 'number', min: 0, max: 0.05, step: 0.0005, default: 0.008 },
    { key: 'frequency', label: 'Frequency', type: 'number', min: 0.1, max: 4, step: 0.01, default: 1 },
    {
      key: 'angle',
      label: 'Angle',
      type: 'number',
      min: 0,
      max: 180,
      step: 1,
      default: 90,
      when: params => params.mode === 'waves'
    },
    { key: 'shine', label: 'Shine', type: 'number', min: 0, max: 1, step: 0.01, default: 0.2 },
    { key: 'speed', label: 'Speed', type: 'number', min: 0, max: 3, step: 0.05, default: 1 }
  ],
  render(ctx, input, params) {
    return ctx.pass('ripple', SHADER, {
      input,
      uniforms: {
        uMode: params.mode === 'waves' ? 1 : 0,
        uAmplitude: params.amplitude,
        uFrequency: params.frequency,
        uSpeed: params.speed,
        uAngle: (params.angle * Math.PI) / 180,
        uShine: params.shine,
        uCenter: [0.5, 0.5]
      }
    });
  }
};
