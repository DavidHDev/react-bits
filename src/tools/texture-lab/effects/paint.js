const TENSOR = `
vec3 tap(vec2 offset) {
  return texture(uInput, vUv + offset / uResolution).rgb;
}

void main() {
  vec3 gx = (tap(vec2(1.0, -1.0)) + 2.0 * tap(vec2(1.0, 0.0)) + tap(vec2(1.0, 1.0))
    - tap(vec2(-1.0, -1.0)) - 2.0 * tap(vec2(-1.0, 0.0)) - tap(vec2(-1.0, 1.0))) * 0.25;
  vec3 gy = (tap(vec2(-1.0, 1.0)) + 2.0 * tap(vec2(0.0, 1.0)) + tap(vec2(1.0, 1.0))
    - tap(vec2(-1.0, -1.0)) - 2.0 * tap(vec2(0.0, -1.0)) - tap(vec2(1.0, -1.0))) * 0.25;
  outColor = vec4(dot(gx, gx), dot(gx, gy), dot(gy, gy), 1.0);
}`;

const SMOOTH = `
uniform vec2 uStep;

void main() {
  vec3 sum = texture(uInput, vUv).rgb * 0.2270270270;
  sum += (texture(uInput, vUv + uStep * 1.3846153846).rgb + texture(uInput, vUv - uStep * 1.3846153846).rgb) * 0.3162162162;
  sum += (texture(uInput, vUv + uStep * 3.2307692308).rgb + texture(uInput, vUv - uStep * 3.2307692308).rgb) * 0.0702702703;
  outColor = vec4(sum, 1.0);
}`;

const KUWAHARA = `
uniform sampler2D uTensor;
uniform float uRadius;
uniform float uSharpness;
uniform float uFlow;

void main() {
  vec2 texel = 1.0 / uResolution;
  vec3 tensor = texture(uTensor, vUv).rgb;
  float e = tensor.x;
  float f = tensor.y;
  float g = tensor.z;
  float root = sqrt(max((e - g) * (e - g) + 4.0 * f * f, 0.0));
  float l1 = 0.5 * (e + g + root);
  float l2 = 0.5 * (e + g - root);
  vec2 dir = vec2(l1 - e, -f);
  dir = dot(dir, dir) > 1e-12 ? normalize(dir) : vec2(0.0, 1.0);
  float anisotropy = (l1 + l2) > 1e-7 ? (l1 - l2) / (l1 + l2) : 0.0;
  anisotropy *= uFlow;
  float alpha = 1.0;
  float a = uRadius * clamp((alpha + anisotropy) / alpha, 0.1, 2.0);
  float b = uRadius * clamp(alpha / (alpha + anisotropy), 0.1, 2.0);
  vec2 major = dir;
  vec2 minor = vec2(-dir.y, dir.x);
  float extentX = sqrt(a * a * major.x * major.x + b * b * minor.x * minor.x);
  float extentY = sqrt(a * a * major.y * major.y + b * b * minor.y * minor.y);
  float stride = max(1.0, max(a, b) / 5.5);

  vec3 m[8];
  vec3 s[8];
  float w[8];
  for (int k = 0; k < 8; k++) {
    m[k] = vec3(0.0);
    s[k] = vec3(0.0);
    w[k] = 0.0;
  }
  float zeta = 2.0 / 3.0;
  float eta = 0.95;
  for (float j = -extentY; j <= extentY; j += stride) {
    for (float i = -extentX; i <= extentX; i += stride) {
      vec2 d = vec2(i, j);
      vec2 v = vec2(dot(d, major) / a, dot(d, minor) / b);
      if (dot(v, v) > 1.0) continue;
      vec3 c = texture(uInput, vUv + d * texel).rgb;
      float wx[8];
      float sum = 0.0;
      float vxx = zeta - eta * v.x * v.x;
      float vyy = zeta - eta * v.y * v.y;
      float z = max(0.0, v.y + vxx); wx[0] = z * z; sum += wx[0];
      z = max(0.0, -v.x + vyy); wx[2] = z * z; sum += wx[2];
      z = max(0.0, -v.y + vxx); wx[4] = z * z; sum += wx[4];
      z = max(0.0, v.x + vyy); wx[6] = z * z; sum += wx[6];
      vec2 r = 0.70710678 * vec2(v.x - v.y, v.x + v.y);
      vxx = zeta - eta * r.x * r.x;
      vyy = zeta - eta * r.y * r.y;
      z = max(0.0, r.y + vxx); wx[1] = z * z; sum += wx[1];
      z = max(0.0, -r.x + vyy); wx[3] = z * z; sum += wx[3];
      z = max(0.0, -r.y + vxx); wx[5] = z * z; sum += wx[5];
      z = max(0.0, r.x + vyy); wx[7] = z * z; sum += wx[7];
      float gauss = exp(-3.125 * dot(v, v)) / max(sum, 1e-5);
      for (int k = 0; k < 8; k++) {
        float weight = wx[k] * gauss;
        m[k] += c * weight;
        s[k] += c * c * weight;
        w[k] += weight;
      }
    }
  }
  float sigma[8];
  float lowest = 1e9;
  for (int k = 0; k < 8; k++) {
    vec3 mean = m[k] / max(w[k], 1e-6);
    vec3 variance = abs(s[k] / max(w[k], 1e-6) - mean * mean);
    sigma[k] = variance.r + variance.g + variance.b;
    lowest = min(lowest, sigma[k]);
  }
  vec3 result = vec3(0.0);
  float total = 0.0;
  for (int k = 0; k < 8; k++) {
    vec3 mean = m[k] / max(w[k], 1e-6);
    float weight = 1.0 / (1.0 + pow(1000.0 * max(sigma[k] - lowest, 0.0) + 1.0, 0.5 * uSharpness));
    result += mean * weight;
    total += weight;
  }
  outColor = vec4(result / max(total, 1e-20), 1.0);
}`;

const FINISH = `
uniform sampler2D uTensor;
uniform float uSaturation;
uniform float uCanvas;
uniform float uLight;

void main() {
  vec3 color = texture(uInput, vUv).rgb;
  float gray = luma(color);
  color = mix(vec3(gray), color, uSaturation);
  vec2 p = vUv * uResolution / max(uUnit, 0.3);
  float weave = (valueNoise(p * vec2(0.9, 0.12)) + valueNoise(p * vec2(0.12, 0.9))) * 0.5;
  float fiber = valueNoise(p * 2.7) * 0.5 + valueNoise(p * 6.1) * 0.5;
  float canvas = mix(weave, fiber, 0.35) - 0.5;
  vec3 tensor = texture(uTensor, vUv).rgb;
  float root = sqrt(max((tensor.x - tensor.z) * (tensor.x - tensor.z) + 4.0 * tensor.y * tensor.y, 0.0));
  vec2 dir = vec2(0.5 * (tensor.x + tensor.z + root) - tensor.x, -tensor.y);
  dir = dot(dir, dir) > 1e-12 ? normalize(dir) : vec2(0.0, 1.0);
  float streak = valueNoise(vec2(dot(p, vec2(-dir.y, dir.x)) * 0.9, dot(p, dir) * 0.08)) - 0.5;
  vec2 t = 1.5 * uUnit / uResolution;
  float lx = luma(texture(uInput, vUv + vec2(t.x, 0.0)).rgb) - luma(texture(uInput, vUv - vec2(t.x, 0.0)).rgb);
  float ly = luma(texture(uInput, vUv + vec2(0.0, t.y)).rgb) - luma(texture(uInput, vUv - vec2(0.0, t.y)).rgb);
  float relief = (lx * 0.7 + ly * 0.7) * uLight * 3.0 + streak * uLight * 0.12;
  color *= 1.0 + canvas * uCanvas * 0.2 + relief;
  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;

export function abstractImage(ctx, input, { radius: size, flow, sharpness }) {
  const radiusPx = Math.max(1, size * ctx.unit);
  const scale = Math.min(1, 8 / radiusPx);
  const w = Math.max(1, Math.round(ctx.width * scale));
  const h = Math.max(1, Math.round(ctx.height * scale));
  const radius = Math.max(1.5, radiusPx * scale);
  const raw = ctx.pass('paint-tensor', TENSOR, { input, target: ctx.target(w, h) });
  const across = ctx.pass('paint-smooth', SMOOTH, {
    input: raw,
    target: ctx.target(w, h),
    uniforms: { uStep: [1.4 / w, 0] }
  });
  ctx.release(raw);
  const tensor = ctx.pass('paint-smooth', SMOOTH, {
    input: across,
    target: ctx.target(w, h),
    uniforms: { uStep: [0, 1.4 / h] }
  });
  ctx.release(across);
  const painted = ctx.pass('paint-kuwahara', KUWAHARA, {
    input,
    target: ctx.target(w, h),
    textures: { uTensor: tensor },
    uniforms: { uRadius: radius, uSharpness: sharpness, uFlow: flow }
  });
  return { painted, tensor };
}

export default {
  id: 'paint',
  name: 'Paint',
  category: 'art',
  description: 'Oil paint strokes that follow the shapes in the image.',
  animated: false,
  params: [
    { key: 'radius', label: 'Brush', type: 'number', min: 1, max: 20, step: 0.1, default: 6 },
    { key: 'flow', label: 'Stroke flow', type: 'number', min: 0, max: 1, step: 0.01, default: 0.8 },
    { key: 'sharpness', label: 'Sharpness', type: 'number', min: 2, max: 18, step: 0.5, default: 8 },
    { key: 'saturation', label: 'Saturation', type: 'number', min: 0, max: 2, step: 0.01, default: 1.12 },
    { key: 'canvas', label: 'Canvas', type: 'number', min: 0, max: 1, step: 0.01, default: 0.35 },
    { key: 'light', label: 'Impasto', type: 'number', min: 0, max: 1, step: 0.01, default: 0.35 }
  ],
  render(ctx, input, params) {
    const { painted, tensor } = abstractImage(ctx, input, params);
    const output = ctx.pass('paint-finish', FINISH, {
      input: painted,
      textures: { uTensor: tensor },
      uniforms: { uSaturation: params.saturation, uCanvas: params.canvas, uLight: params.light }
    });
    ctx.release(painted);
    ctx.release(tensor);
    return output;
  }
};
