const YIQ = `
vec3 rgb2yiq(vec3 c) {
  return vec3(
    dot(c, vec3(0.299, 0.587, 0.114)),
    dot(c, vec3(0.596, -0.274, -0.322)),
    dot(c, vec3(0.211, -0.523, 0.312))
  );
}

vec3 yiq2rgb(vec3 c) {
  return vec3(
    dot(c, vec3(1.0, 0.956, 0.621)),
    dot(c, vec3(1.0, -0.272, -0.647)),
    dot(c, vec3(1.0, -1.106, 1.703))
  );
}
`;

const ENCODE = `
uniform float uJitter;
uniform float uTracking;
uniform float uSpeed;
uniform float uLines;
${YIQ}
void main() {
  float t = uTime * uSpeed;
  float line = floor(vUv.y * uLines);
  float wobble = valueNoise(vec2(line * 0.09, t * 1.7)) - 0.5;
  wobble += (valueNoise(vec2(line * 0.6, t * 9.0)) - 0.5) * 0.35;
  float shift = wobble * uJitter * 3.2 / 640.0;

  float bandPos = 1.12 - fract(t * 0.043 + 0.62) * 1.24;
  float d = vUv.y - bandPos;
  float band = exp(-d * d / 0.0009) * uTracking;
  shift += (hash11(line * 1.73 + floor(t * 30.0) * 7.1) - 0.5) * band * 0.035;
  shift += band * 0.012 * sin(line * 0.21 + t * 7.0);

  float head = smoothstep(0.028, 0.0, vUv.y) * step(0.001, uSpeed + uJitter + uTracking);
  shift += head * (0.012 + 0.02 * valueNoise(vec2(line * 0.8, t * 18.0)));

  vec3 color = texture(uInput, vec2(vUv.x - shift, vUv.y)).rgb;
  vec3 yiq = rgb2yiq(color);
  outColor = vec4(yiq.x, yiq.y + 0.5, yiq.z + 0.5, clamp(band + head, 0.0, 1.0));
}`;

const DECODE = `
uniform float uBleed;
uniform float uSharp;
uniform float uNoise;
uniform float uFade;
uniform float uLines;
uniform float uLuma;
uniform float uSeed;
${YIQ}
void main() {
  vec2 px = vUv * uResolution;
  vec2 texel = 1.0 / uResolution;
  float line = floor(vUv.y * uLines);
  float lumaWidth = uResolution.x / uLuma;
  float chromaWidth = uResolution.x / 52.0 * (0.25 + uBleed);

  float soft = 0.0;
  float wide = 0.0;
  float total = 0.0;
  for (int i = -4; i <= 4; i++) {
    float x = float(i);
    float w = exp(-x * x / 8.0);
    soft += texture(uInput, vUv + vec2(x * lumaWidth * 0.3 * texel.x, 0.0)).r * w;
    wide += texture(uInput, vUv + vec2((x * 0.85 - 1.1) * lumaWidth * texel.x, 0.0)).r * w;
    total += w;
  }
  soft /= total;
  wide /= total;
  float y = soft + (soft - wide) * uSharp * 1.6;

  vec2 iq = vec2(0.0);
  total = 0.0;
  float delay = chromaWidth * 0.3;
  vec2 above = vec2(0.0, uResolution.y / uLines * texel.y);
  for (int i = 0; i < 16; i++) {
    float f = float(i) / 15.0 * 2.0 - 1.0;
    float w = exp(-f * f * 2.5);
    vec2 s = vUv + vec2((f * chromaWidth - delay) * texel.x, 0.0);
    iq += (texture(uInput, s).gb - 0.5) * w;
    iq += (texture(uInput, s + above).gb - 0.5) * w * 0.6;
    total += w * 1.6;
  }
  iq /= total;

  float mask = texture(uInput, vUv).a;
  float rowSeed = hash11(line * 0.137 + uSeed);
  float grain = valueNoise(vec2(px.x / (lumaWidth * 2.2) + rowSeed * 613.0, line * 17.31 + uSeed)) - 0.5;
  float fine = hash12(vec2(floor(px.x / max(lumaWidth * 0.7, 1.0)), line) + uSeed) - 0.5;
  y += (grain * 0.75 + fine * 0.35) * uNoise * 0.16 * (1.0 + mask * 3.0);
  vec2 blotch = vec2(
    valueNoise(vec2(px.x / (chromaWidth * 0.9) + rowSeed * 211.0, line * 0.35 + uSeed * 3.0)),
    valueNoise(vec2(px.x / (chromaWidth * 0.9) + rowSeed * 97.0, line * 0.35 + uSeed * 5.0 + 40.0))
  ) - 0.5;
  iq += blotch * uNoise * 0.07 * (1.0 + mask * 2.0);

  float dropout = step(1.0 - uNoise * 0.006 - mask * 0.05, hash12(vec2(line, floor(uSeed * 7.0))));
  float span = smoothstep(0.0, 0.08, fract(vUv.x * 0.7 + rowSeed) ) * step(fract(vUv.x * 0.7 + rowSeed), 0.35 + rowSeed * 0.4);
  y += dropout * span * 0.8;

  iq *= 1.0 - uFade * 0.3;
  vec3 color = yiq2rgb(vec3(y, iq));
  color = color * (1.0 - uFade * 0.14) + vec3(0.055, 0.035, 0.065) * uFade;
  color = mix(color, color * vec3(1.03, 0.98, 1.04), uFade);
  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;

const TAPES = { sp: [330, 1, 1], lp: [250, 1.25, 1.35], ep: [190, 1.55, 1.8] };

export default {
  id: 'vhs',
  name: 'VHS',
  category: 'analog',
  blend: 'normal',
  description: 'Soft tape picture with color smear, edge halos, noise, tracking drift and head switching.',
  animated: true,
  preview: { params: { bleed: 1.2, noise: 0.8, tracking: 0.9, fade: 0.7 } },
  animates: params => params.speed > 0,
  params: [
    {
      key: 'tape',
      label: 'Recording',
      type: 'select',
      default: 'sp',
      options: [
        { value: 'sp', label: 'Standard play' },
        { value: 'lp', label: 'Long play' },
        { value: 'ep', label: 'Extended play' }
      ]
    },
    { key: 'bleed', label: 'Color bleed', type: 'number', min: 0, max: 1.5, step: 0.01, default: 0.75 },
    { key: 'sharpen', label: 'Edge halo', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'noise', label: 'Noise', type: 'number', min: 0, max: 1, step: 0.01, default: 0.4 },
    { key: 'jitter', label: 'Jitter', type: 'number', min: 0, max: 1.5, step: 0.01, default: 0.5 },
    { key: 'tracking', label: 'Tracking', type: 'number', min: 0, max: 1, step: 0.01, default: 0.45 },
    { key: 'fade', label: 'Wear', type: 'number', min: 0, max: 1, step: 0.01, default: 0.45 },
    { key: 'speed', label: 'Speed', type: 'number', min: 0, max: 3, step: 0.05, default: 1 }
  ],
  render(ctx, input, params) {
    const [luma, bleed, noise] = TAPES[params.tape] || TAPES.sp;
    const lines = Math.min(ctx.height, 480);
    const encoded = ctx.pass('vhs-encode', ENCODE, {
      input,
      uniforms: { uJitter: params.jitter, uTracking: params.tracking, uSpeed: params.speed, uLines: lines }
    });
    const output = ctx.pass('vhs-decode', DECODE, {
      input: encoded,
      uniforms: {
        uBleed: params.bleed * bleed,
        uSharp: params.sharpen,
        uNoise: Math.min(params.noise * noise, 1.6),
        uFade: params.fade,
        uLines: lines,
        uLuma: luma,
        uSeed: (Math.floor(ctx.time * 30 * Math.max(params.speed, 0.0001)) % 997) * 0.731
      }
    });
    ctx.release(encoded);
    return output;
  }
};
