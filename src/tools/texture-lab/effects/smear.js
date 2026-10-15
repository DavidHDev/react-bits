const SHADER = `
uniform float uMode;
uniform vec2 uDirection;
uniform float uLength;
uniform float uThreshold;
uniform float uPosition;
uniform float uVariance;
uniform float uSpeed;

void main() {
  vec2 dir = uDirection;
  if (uMode < 0.5) {
    vec3 base = texture(uInput, vUv).rgb;
    vec3 streak = vec3(0.0);
    for (int i = 1; i <= 40; i++) {
      float t = float(i) / 40.0;
      vec3 c = texture(uInput, vUv - dir * t * uLength / uResolution).rgb;
      float w = max(luma(c) - uThreshold, 0.0) / max(1.0 - uThreshold, 1e-3);
      streak = max(streak, c * w * pow(1.0 - t, 1.6));
    }
    outColor = vec4(1.0 - (1.0 - base) * (1.0 - clamp(streak, 0.0, 1.0)), 1.0);
    return;
  }
  vec2 normal = vec2(-dir.y, dir.x);
  float across = dot(vUv - 0.5, normal);
  float along = dot(vUv - 0.5, dir) + 0.5;
  float row = floor(across * uResolution.y / max(uUnit * 2.0, 1.0));
  float start = uPosition + (valueNoise(vec2(row * 0.15, uTime * uSpeed * 0.4)) - 0.5) * uVariance;
  vec2 uv = vUv;
  if (along > start) uv -= dir * (along - start);
  outColor = vec4(texture(uInput, uv).rgb, 1.0);
}`;

export default {
  id: 'smear',
  name: 'Smear',
  category: 'glitch',
  blend: 'normal',
  description: 'Light streaks or stretched pixels, like a slit-scan.',
  animated: true,
  preview: { params: { position: 0.4 } },
  animates: params => params.mode === 'stretch' && params.speed > 0 && params.variance > 0,
  params: [
    {
      key: 'mode',
      label: 'Type',
      type: 'select',
      default: 'stretch',
      options: [
        { value: 'stretch', label: 'Pixel stretch' },
        { value: 'streak', label: 'Light streaks' }
      ]
    },
    { key: 'angle', label: 'Angle', type: 'number', min: 0, max: 360, step: 1, default: 0 },
    {
      key: 'position',
      label: 'Start',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.6,
      when: params => params.mode === 'stretch'
    },
    {
      key: 'variance',
      label: 'Ragged edge',
      type: 'number',
      min: 0,
      max: 0.8,
      step: 0.01,
      default: 0.35,
      when: params => params.mode === 'stretch'
    },
    {
      key: 'length',
      label: 'Length',
      type: 'number',
      min: 2,
      max: 300,
      step: 1,
      default: 80,
      when: params => params.mode === 'streak'
    },
    {
      key: 'threshold',
      label: 'Threshold',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.55,
      when: params => params.mode === 'streak'
    },
    { key: 'speed', label: 'Speed', type: 'number', min: 0, max: 3, step: 0.05, default: 0.6 }
  ],
  render(ctx, input, params) {
    const angle = (params.angle * Math.PI) / 180;
    return ctx.pass('smear', SHADER, {
      input,
      uniforms: {
        uMode: params.mode === 'streak' ? 0 : 1,
        uDirection: [Math.cos(angle), Math.sin(angle)],
        uLength: params.length * ctx.unit,
        uThreshold: params.threshold,
        uPosition: params.position,
        uVariance: params.variance,
        uSpeed: params.speed
      }
    });
  }
};
