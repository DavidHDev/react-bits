const SHADER = `
uniform float uSpacing;
uniform float uIntensity;
uniform float uThreshold;
uniform float uExpand;
uniform float uRayRate;
uniform float uColorize;
uniform float uClock;
uniform float uSeed;
uniform float uScale;

vec3 scatterHash(vec2 p) {
  uvec2 u = floatBitsToUint(p * vec2(141421356.0, 2718281828.0));
  uint h = u.x ^ u.y;
  uvec3 prod = uvec3(h) * uvec3(1732050807u, 2645751311u, 3316624790u);
  return vec3(prod) / 4294967295.0;
}

vec4 brightest(vec2 point, float angle) {
  vec3 color = toLinear(texture(uInput, point / uResolution).rgb);
  float best = dot(color, LUMA);
  if (uExpand > 0.0) {
    for (int i = 0; i < 4; i++) {
      float a = angle + float(i) * 1.5707963;
      vec3 tap = toLinear(texture(uInput, (point + vec2(cos(a), sin(a)) * uExpand) / uResolution).rgb);
      float l = dot(tap, LUMA);
      if (l > best) {
        best = l;
        color = tap;
      }
    }
  }
  return vec4(color, best);
}

float glint(vec2 o, float reach) {
  vec2 a = abs(o);
  float core = exp(-dot(o, o) * 0.9);
  float rays = exp(-(a.x * 1.6 + a.y * uRayRate)) + exp(-(a.y * 1.6 + a.x * uRayRate));
  return (core + rays * 0.25) * (1.0 - smoothstep(reach * 0.6, reach, max(a.x, a.y)));
}

vec3 layer(vec2 px, float scale, float index) {
  float cell = uSpacing * scale;
  vec2 base = floor(px / cell - 0.5);
  float seed = uSeed + index * 0.31;
  vec2 salt = vec2(seed * 97.13, seed * 31.71);
  vec3 sum = vec3(0.0);
  for (int j = 0; j < 4; j++) {
    vec2 c = base + vec2(float(j % 2), float(j / 2));
    vec3 r = scatterHash(c + salt);
    vec2 point = (c + 0.5 + (r.xy - 0.5) * 0.6) * cell;
    vec4 source = brightest(point, index * 0.7853982);
    float presence = smoothstep(uThreshold, uThreshold + 0.12, sqrt(max(source.a, 0.0)));
    float blink = max(sin(uClock * (0.8 + r.z * 1.2) + r.x * TAU), 0.0);
    blink *= blink;
    blink *= blink;
    blink *= blink;
    float level = 0.35 + 0.65 * step(0.45, r.z);
    float star = glint((px - point) / uScale, cell * 0.5 / uScale);
    vec3 hue = source.rgb / max(source.a, 0.001) * 0.6;
    vec3 tint = mix(vec3(1.0), hue, uColorize);
    sum += tint * star * blink * presence * level * uIntensity;
  }
  return sum;
}

void main() {
  vec2 px = vUv * uResolution;
  vec3 glow = layer(px, 1.0, 0.0) + layer(px, 2.0 / 3.0, 1.0);
  vec3 color = toLinear(texture(uInput, vUv).rgb) + glow;
  outColor = vec4(clamp(toGamma(color), 0.0, 1.0), 1.0);
}`;

export default {
  id: 'sparkle',
  name: 'Sparkle',
  category: 'light',
  blend: 'normal',
  description: 'Twinkling star glints over the bright parts of the image.',
  animated: true,
  preview: { zoom: 2.5, params: { threshold: 0.7, intensity: 14 } },
  animates: params => params.speed > 0 && params.intensity > 0,
  params: [
    { key: 'spacing', label: 'Spacing', type: 'number', min: 10, max: 200, step: 1, default: 60 },
    { key: 'intensity', label: 'Intensity', type: 'number', min: 0, max: 20, step: 0.1, default: 10 },
    { key: 'threshold', label: 'Threshold', type: 'number', min: 0, max: 1, step: 0.01, default: 0.82 },
    { key: 'expand', label: 'Reach', type: 'number', min: 0, max: 100, step: 1, default: 10 },
    { key: 'rays', label: 'Ray length', type: 'number', min: 0, max: 20, step: 0.1, default: 5 },
    { key: 'colorize', label: 'Image color', type: 'number', min: 0, max: 1, step: 0.01, default: 0.45 },
    { key: 'speed', label: 'Twinkle speed', type: 'number', min: 0, max: 5, step: 0.05, default: 1 },
    { key: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 0 }
  ],
  render(ctx, input, params) {
    if (params.intensity <= 0) return input;
    const scale = Math.max(ctx.unit, 0.4);
    return ctx.pass('sparkle', SHADER, {
      input,
      uniforms: {
        uSpacing: params.spacing * ctx.unit,
        uIntensity: params.intensity,
        uThreshold: params.threshold,
        uExpand: params.expand * ctx.unit,
        uRayRate: 0.45 / Math.max(params.rays, 0.01),
        uColorize: params.colorize,
        uClock: ctx.time * params.speed,
        uSeed: params.variation,
        uScale: scale
      }
    });
  }
};
