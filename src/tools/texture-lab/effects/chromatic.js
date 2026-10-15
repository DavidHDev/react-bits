const SHADER = `
uniform float uAmount;
uniform float uMode;
uniform float uAngle;
uniform float uFalloff;
uniform vec2 uCenter;

vec3 spectrum(float t) {
  vec3 c = vec3(
    smoothstep(0.45, 0.0, abs(t - 0.05)) + smoothstep(0.35, 0.0, abs(t - 0.95)) * 0.25,
    smoothstep(0.38, 0.0, abs(t - 0.5)),
    smoothstep(0.42, 0.0, abs(t - 0.95))
  );
  return c;
}

void main() {
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 dir;
  float strength;
  if (uMode < 0.5) {
    vec2 d = (vUv - uCenter) * aspect;
    float r = length(d);
    strength = pow(clamp(r / 0.75, 0.0, 1.0), uFalloff);
    dir = d / max(r, 1e-4) / aspect;
  } else {
    dir = vec2(cos(uAngle), sin(uAngle)) / aspect;
    strength = 1.0;
  }
  vec2 offset = dir * uAmount * strength / uResolution.y;
  vec3 sum = vec3(0.0);
  vec3 weight = vec3(0.0);
  for (int i = 0; i < 9; i++) {
    float t = float(i) / 8.0;
    vec3 w = spectrum(t);
    sum += texture(uInput, vUv + offset * (t - 0.5) * 2.0).rgb * w;
    weight += w;
  }
  outColor = vec4(sum / weight, 1.0);
}`;

export default {
  id: 'chromatic',
  name: 'Chromatic',
  category: 'analog',
  blend: 'normal',
  description: 'Prism-like color fringes that spread from the center or along a line.',
  animated: true,
  preview: { params: { amount: 16 } },
  animates: params => params.wobble > 0,
  params: [
    {
      key: 'mode',
      label: 'Direction',
      type: 'select',
      default: 'radial',
      options: [
        { value: 'radial', label: 'From center' },
        { value: 'linear', label: 'Along a line' }
      ]
    },
    { key: 'amount', label: 'Amount', type: 'number', min: 0, max: 40, step: 0.1, default: 6 },
    {
      key: 'angle',
      label: 'Angle',
      type: 'number',
      min: 0,
      max: 360,
      step: 1,
      default: 0,
      when: params => params.mode === 'linear'
    },
    {
      key: 'falloff',
      label: 'Falloff',
      type: 'number',
      min: 0.3,
      max: 4,
      step: 0.05,
      default: 1.6,
      when: params => params.mode === 'radial'
    },
    { key: 'wobble', label: 'Wobble', type: 'number', min: 0, max: 1, step: 0.01, default: 0 }
  ],
  render(ctx, input, params) {
    const wobble =
      params.wobble > 0
        ? 1 + Math.sin(ctx.time * 2.3) * 0.45 * params.wobble + Math.sin(ctx.time * 5.7) * 0.15 * params.wobble
        : 1;
    return ctx.pass('chromatic', SHADER, {
      input,
      uniforms: {
        uAmount: params.amount * ctx.unit * wobble,
        uMode: params.mode === 'linear' ? 1 : 0,
        uAngle: (params.angle * Math.PI) / 180,
        uFalloff: params.falloff,
        uCenter: [0.5, 0.5]
      }
    });
  }
};
