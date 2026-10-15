const DOWNSAMPLE = `
uniform float uLod;
void main() {
  outColor = vec4(textureLod(uInput, vUv, uLod).rgb, 1.0);
}`;

const GAUSSIAN = `
uniform vec2 uStep;
uniform float uSigma;

void main() {
  float sigma = max(uSigma, 0.001);
  float radius = min(ceil(sigma * 3.0), 40.0);
  vec3 sum = texture(uInput, vUv).rgb;
  float total = 1.0;
  for (int i = 1; i <= 40; i++) {
    float x = float(i);
    if (x > radius) break;
    float w = exp(-x * x / (2.0 * sigma * sigma));
    vec2 offset = uStep * x;
    sum += (texture(uInput, vUv + offset).rgb + texture(uInput, vUv - offset).rgb) * w;
    total += 2.0 * w;
  }
  outColor = vec4(sum / total, 1.0);
}`;

export function gaussianBlur(ctx, input, sigma, { maxSigma = 10 } = {}) {
  let factor = 1;
  while (sigma / factor > maxSigma && factor < 32) factor *= 2;
  const w = Math.max(1, Math.round(ctx.width / factor));
  const h = Math.max(1, Math.round(ctx.height / factor));
  let source = input;
  let owned = null;
  if (factor > 1) {
    const mipped = input.mipmapped ? input : ctx.mipmap(input);
    owned = ctx.pass('blur-down', DOWNSAMPLE, {
      input: mipped,
      target: ctx.target(w, h),
      uniforms: { uLod: Math.log2(factor) - 0.5 }
    });
    source = owned;
  }
  const s = sigma / factor;
  const horizontal = ctx.pass('blur-gauss', GAUSSIAN, {
    input: source,
    target: ctx.target(w, h),
    uniforms: { uStep: [1 / w, 0], uSigma: s }
  });
  if (owned) ctx.release(owned);
  const vertical = ctx.pass('blur-gauss', GAUSSIAN, {
    input: horizontal,
    target: ctx.target(w, h),
    uniforms: { uStep: [0, 1 / h], uSigma: s }
  });
  ctx.release(horizontal);
  return vertical;
}
