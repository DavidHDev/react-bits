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

const GAUSSIAN_PAIRS = `
uniform vec2 uStep;
uniform float uSigma;

void main() {
  float sigma = max(uSigma, 0.001);
  float radius = min(ceil(sigma * 3.0), 40.0);
  vec3 sum = texture(uInput, vUv).rgb;
  float total = 1.0;
  for (int i = 1; i <= 40; i += 2) {
    float x = float(i);
    if (x > radius) break;
    float a = exp(-x * x / (2.0 * sigma * sigma));
    float y = x + 1.0;
    float b = y > radius ? 0.0 : exp(-y * y / (2.0 * sigma * sigma));
    float w = a + b;
    vec2 offset = uStep * ((x * a + y * b) / w);
    sum += (texture(uInput, vUv + offset).rgb + texture(uInput, vUv - offset).rgb) * w;
    total += 2.0 * w;
  }
  outColor = vec4(sum / total, 1.0);
}`;

const matches = (texture, w, h) => Boolean(texture) && texture.width === w && texture.height === h;

export function gaussianBlur(ctx, input, sigma, { maxSigma = 10, paired = false } = {}) {
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
  const pairs = paired && matches(source, w, h);
  const horizontal = ctx.pass(pairs ? 'blur-gauss-pairs' : 'blur-gauss', pairs ? GAUSSIAN_PAIRS : GAUSSIAN, {
    input: source,
    target: ctx.target(w, h),
    uniforms: { uStep: [1 / w, 0], uSigma: s }
  });
  if (owned) ctx.release(owned);
  const vertical = ctx.pass(paired ? 'blur-gauss-pairs' : 'blur-gauss', paired ? GAUSSIAN_PAIRS : GAUSSIAN, {
    input: horizontal,
    target: ctx.target(w, h),
    uniforms: { uStep: [0, 1 / h], uSigma: s }
  });
  ctx.release(horizontal);
  return vertical;
}
