const SHADER = `
uniform float uShape;
uniform float uProfile;
uniform float uBar;
uniform float uAngle;
uniform float uDistortion;
uniform float uShift;
uniform float uStretch;
uniform float uBlur;
uniform float uHighlights;
uniform float uShadows;
uniform float uFrost;
uniform float uSize;
uniform float uDrift;

float smoothFract(float x) {
  float f = fract(x);
  float w = fwidth(x);
  float edge = abs(f - 0.5) - 0.5;
  float band = smoothstep(-w, w, edge);
  return mix(f, 1.0 - f, band);
}

float uvFrame(vec2 uv, float softness) {
  float aax = 2.0 * fwidth(uv.x);
  float aay = 2.0 * fwidth(uv.y);
  float left = smoothstep(0.0, aax + softness, uv.x);
  float right = 1.0 - smoothstep(1.0 - softness - aax, 1.0, uv.x);
  float bottom = smoothstep(0.0, aay + softness, uv.y);
  float top = 1.0 - smoothstep(1.0 - softness - aay, 1.0, uv.y);
  return left * right * bottom * top;
}

vec2 toUv(vec2 p) {
  return vec2(p.x / uResolution.x + 0.5, 0.5 - p.y / uResolution.y);
}

vec2 mirrorUv(vec2 uv) {
  return 1.0 - abs(1.0 - abs(uv));
}

void main() {
  vec2 p = (vec2(vUv.x, 1.0 - vUv.y) - 0.5) * uResolution;
  mat2 toBars = rotation(uAngle);
  mat2 fromBars = rotation(-uAngle);
  vec2 q = toBars * p / uBar;
  q.x += uDrift;

  float curve = 0.0;
  if (uShape > 3.5) {
    curve = 0.5 + 0.5 * sin(0.5 * PI * q.x) * cos(0.5 * PI * q.y);
  } else if (uShape > 2.5) {
    curve = 10.0 * abs(fract(0.1 * q.y) - 0.5);
  } else if (uShape > 1.5) {
    curve = 4.0 * sin(0.23 * q.y);
  } else if (uShape > 0.5) {
    curve = 0.5 + 0.5 * sin(0.5 * q.x) * sin(1.7 * q.x);
  }

  float u = q.x + curve;
  float x = smoothFract(u);
  float xn = fract(u) + 0.0001;
  float scale = max(uUnit, 0.5);

  float lineWidth = 2.0 * max(0.001, fwidth(u) * scale);
  float highlights = 1.0 - smoothstep(0.0, lineWidth, xn) * smoothstep(1.0, 1.0 - lineWidth, xn);
  highlights = clamp(highlights * uHighlights, 0.0, 1.0);

  float shadows = pow(x, 1.3);
  float distortion = 0.0;
  float frameFade = 0.0;
  float fadeX = 1.0;
  float aa = max(max(fwidth(xn), fwidth(q.x)), fwidth(u)) * scale;
  aa = max(aa, 0.0001);

  if (uProfile < 0.5) {
    distortion = -pow(1.5 * x, 3.0) + (0.5 - uShift);
    frameFade = pow(1.5 * x, 3.0);
    aa = max(0.2, aa) + mix(0.2, 0.0, uSize);
    fadeX = smoothstep(0.0, aa, xn) * smoothstep(1.0, 1.0 - aa, xn);
    distortion = mix(0.5, distortion, fadeX);
  } else if (uProfile < 1.5) {
    distortion = 2.0 * pow(x, 2.0) - (0.5 + uShift);
    frameFade = pow(abs(x - 0.5), 4.0);
    aa = max(0.2, aa) + mix(0.2, 0.0, uSize);
    fadeX = smoothstep(0.0, aa, xn) * smoothstep(1.0, 1.0 - aa, xn);
    distortion = mix(0.5, distortion, fadeX);
    frameFade = mix(1.0, frameFade, 0.5 * fadeX);
  } else if (uProfile < 2.5) {
    distortion = pow(abs(2.0 * (xn - 0.5)), 6.0) - 0.25 - uShift;
    frameFade = 1.0 - 2.0 * pow(abs(x - 0.4), 2.0);
    aa = 0.15 + mix(0.1, 0.0, uSize);
    fadeX = smoothstep(0.0, aa, xn) * smoothstep(1.0, 1.0 - aa, xn);
    frameFade = mix(1.0, frameFade, fadeX);
  } else if (uProfile < 3.5) {
    x = xn;
    distortion = sin((x + 0.25) * TAU);
    shadows = 0.5 + 0.5 * asin(distortion) / (0.5 * PI);
    distortion = distortion * 0.5 - uShift;
    frameFade = 0.5 + 0.5 * sin(x * TAU);
  } else {
    distortion = -pow(abs(x), 0.2) * x + 0.33 - 3.0 * uShift;
    distortion *= 0.33;
    frameFade = 0.3 * smoothstep(0.0, 1.0, x);
    shadows = pow(x, 2.5);
    aa = max(0.1, aa) + mix(0.1, 0.0, uSize);
    fadeX = smoothstep(0.0, aa, xn) * smoothstep(1.0, 1.0 - aa, xn);
    distortion *= fadeX;
  }

  if (uFrost > 0.0) {
    float grain = smoothstep(0.4, 0.7, valueNoise(p * 0.8 / uUnit)) * uFrost;
    distortion = mix(distortion, 0.0, grain);
  }

  shadows = clamp(min(shadows, 1.0) * uShadows * uShadows, 0.0, 1.0);
  distortion *= 3.0 * uDistortion;
  frameFade *= uDistortion;

  vec2 sp = p + fromBars * vec2(distortion * uBar, 0.0);
  vec2 uv = toUv(sp);

  float stretch = 1.0 - smoothstep(0.0, 0.5, xn) * smoothstep(1.0, 0.5, xn);
  stretch *= stretch;
  stretch *= uvFrame(uv, 0.1 + 0.05 * frameFade);
  vec2 along = toBars * sp;
  along.y = mix(along.y, 0.0, uStretch * stretch);
  sp = fromBars * along;
  uv = toUv(sp);

  vec2 texel = vec2(textureSize(uInput, 0));
  vec2 gx = dFdx(uv) * texel;
  vec2 gy = dFdy(uv) * texel;
  float lod = 0.5 * log2(max(max(dot(gx, gx), dot(gy, gy)), 1e-8));

  vec3 image;
  if (uBlur < 0.5) {
    image = textureLod(uInput, mirrorUv(uv), max(lod, 0.0)).rgb;
  } else {
    float stride = max(1.0, uBlur / 8.0);
    float level = max(lod, log2(stride) - 0.5);
    vec2 dir = fromBars * vec2(0.0, 1.0);
    vec2 stepUv = vec2(dir.x / uResolution.x, -dir.y / uResolution.y) * stride;
    float reach = min(ceil(3.0 * uBlur / stride), 24.0);
    vec3 sum = vec3(0.0);
    float total = 0.0;
    for (int i = -24; i <= 24; i++) {
      float k = float(i);
      if (abs(k) > reach) continue;
      float d = k * stride;
      float w = exp(-d * d / (2.0 * uBlur * uBlur));
      sum += textureLod(uInput, mirrorUv(uv + stepUv * k), level).rgb * w;
      total += w;
    }
    image = sum / total;
  }

  vec3 color = vec3(highlights);
  float opacity = highlights;
  shadows = mix(shadows, 0.0, highlights);
  color *= 1.0 - 0.5 * shadows;
  opacity = clamp(opacity + shadows, 0.0, 1.0);
  color = clamp(color, 0.0, 1.0) + image * (1.0 - opacity);
  outColor = vec4(color, 1.0);
}`;

const SHAPES = { lines: 0, irregular: 1, wave: 2, zigzag: 3, pattern: 4 };
const PROFILES = { prism: 0, lens: 1, contour: 2, cascade: 3, flat: 4 };

export default {
  id: 'fluted',
  name: 'Fluted glass',
  category: 'glass',
  blend: 'normal',
  description: 'Reeded glass that splits the picture into refracted, streaky bars.',
  animated: true,
  animates: params => params.drift !== 0,
  params: [
    {
      key: 'shape',
      label: 'Shape',
      type: 'select',
      default: 'lines',
      options: [
        { value: 'lines', label: 'Straight' },
        { value: 'irregular', label: 'Irregular' },
        { value: 'wave', label: 'Wave' },
        { value: 'zigzag', label: 'Zigzag' },
        { value: 'pattern', label: 'Weave' }
      ]
    },
    {
      key: 'profile',
      label: 'Profile',
      type: 'select',
      default: 'prism',
      options: [
        { value: 'prism', label: 'Prism' },
        { value: 'lens', label: 'Lens' },
        { value: 'contour', label: 'Contour' },
        { value: 'cascade', label: 'Cascade' },
        { value: 'flat', label: 'Flat' }
      ]
    },
    { key: 'size', label: 'Bar size', type: 'number', min: 4, max: 120, step: 0.5, default: 24 },
    { key: 'angle', label: 'Angle', type: 'number', min: 0, max: 180, step: 1, default: 0 },
    { key: 'distortion', label: 'Distortion', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'shift', label: 'Shift', type: 'number', min: -1, max: 1, step: 0.01, default: 0 },
    { key: 'stretch', label: 'Stretch', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { key: 'blur', label: 'Blur', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { key: 'highlights', label: 'Highlights', type: 'number', min: 0, max: 1, step: 0.01, default: 0.1 },
    { key: 'shadows', label: 'Shadows', type: 'number', min: 0, max: 1, step: 0.01, default: 0.25 },
    { key: 'frost', label: 'Frost', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { key: 'drift', label: 'Drift', type: 'number', min: -2, max: 2, step: 0.01, default: 0 }
  ],
  render(ctx, input, params) {
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const bar = Math.max(1, params.size * ctx.unit);
    const count = 1000 / Math.max(params.size, 1);
    return ctx.pass('fluted', SHADER, {
      input: source,
      uniforms: {
        uShape: SHAPES[params.shape] ?? 0,
        uProfile: PROFILES[params.profile] ?? 0,
        uBar: bar,
        uAngle: (params.angle * Math.PI) / 180,
        uDistortion: params.distortion,
        uShift: params.shift,
        uStretch: params.stretch,
        uBlur: params.blur * 24 * ctx.unit,
        uHighlights: params.highlights,
        uShadows: params.shadows,
        uFrost: params.frost,
        uSize: Math.min(1, Math.max(0, (200 - count) / 195)),
        uDrift: params.drift * ctx.time
      }
    });
  }
};
