const SHADER = `
uniform float uAmount;
uniform float uSize;
uniform float uChroma;
uniform float uSeed;
uniform float uProtect;

float grainAt(vec2 p, float seed) {
  vec2 q = p / uSize + vec2(seed * 17.13, seed * 9.71);
  float n = valueNoise(q) * 1.0 + valueNoise(q * 1.93 + 4.1) * 0.62 + valueNoise(q * 3.71 + 9.3) * 0.36;
  return n / 1.98 - 0.5;
}

void main() {
  vec3 color = texture(uInput, vUv).rgb;
  vec2 p = vUv * uResolution;
  float l = luma(color);
  float response = mix(1.0, 4.0 * l * (1.0 - l), 0.55);
  response *= 1.0 - smoothstep(0.75, 1.0, l) * uProtect;
  response *= 1.0 - (1.0 - smoothstep(0.0, 0.08, l)) * uProtect * 0.6;
  float mono = grainAt(p, uSeed);
  vec3 grain = vec3(mono);
  if (uChroma > 0.0) {
    vec3 tinted = vec3(mono, grainAt(p, uSeed + 3.31), grainAt(p, uSeed + 7.77));
    grain = mix(grain, tinted, uChroma);
  }
  color += grain * uAmount * response * 0.6;
  outColor = vec4(color, 1.0);
}`;

export default {
  id: 'grain',
  name: 'Grain',
  category: 'film',
  blend: 'normal',
  description: 'Film grain that lives in the midtones and moves every frame.',
  animated: true,
  preview: { zoom: 2.5, params: { amount: 0.7 } },
  animates: params => params.motion > 0 && params.amount > 0,
  params: [
    { key: 'amount', label: 'Amount', type: 'number', min: 0, max: 1, step: 0.01, default: 0.28 },
    { key: 'size', label: 'Size', type: 'number', min: 0.4, max: 5, step: 0.05, default: 1.1 },
    { key: 'chroma', label: 'Color', type: 'number', min: 0, max: 1, step: 0.01, default: 0.15 },
    { key: 'protect', label: 'Protect highlights', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'motion', label: 'Motion', type: 'number', min: 0, max: 2, step: 0.01, default: 1 }
  ],
  render(ctx, input, params) {
    const seed = params.motion > 0 ? Math.floor(ctx.time * 24 * params.motion) % 997 : 0;
    return ctx.pass('grain', SHADER, {
      input,
      uniforms: {
        uAmount: params.amount,
        uSize: Math.max(0.5, params.size * ctx.unit),
        uChroma: params.chroma,
        uSeed: seed * 1.37,
        uProtect: params.protect
      }
    });
  }
};
