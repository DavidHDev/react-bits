export default {
  id: 'holo-foil',
  name: 'Holo foil',
  kind: 'shape',
  group: 'light',
  source: 'shaders.com',
  animated: true,
  outside: false,
  surface: 0.08,
  params: [
    { name: 'hueShift', label: 'Hue shift', type: 'number', min: 0, max: 360, step: 1, default: 0 },
    { name: 'foilScale', label: 'Patch size', type: 'number', min: 0.3, max: 6, step: 0.01, default: 1.5 },
    { name: 'saturation', label: 'Saturation', type: 'number', min: 0, max: 1, step: 0.01, default: 0.75 },
    { name: 'silver', label: 'Silver', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { name: 'roughness', label: 'Roughness', type: 'number', min: 0, max: 1, step: 0.01, default: 0.25 },
    { name: 'crinkle', label: 'Crinkle', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { name: 'crinkleScale', label: 'Crinkle size', type: 'number', min: 0.3, max: 6, step: 0.01, default: 1 },
    { name: 'sparkle', label: 'Glitter', type: 'number', min: 0, max: 1, step: 0.01, default: 0.55 },
    { name: 'speed', label: 'Speed', type: 'number', min: 0, max: 2, step: 0.01, default: 1 }
  ],
  glsl: `
const vec2 m_LD = vec2(0.5, -0.8660254);
const vec3 m_L = vec3(0.37164709, -0.64371163, -0.66896474);

uint m_rotl(uint x, int k) {
  return (x << uint(k)) | (x >> uint(32 - k));
}

uint m_hashInt(int x, int y) {
  uint seed = 0xdeadbeefu + (2u << 2u) + 13u;
  uint a = seed + uint(x);
  uint b = seed + uint(y);
  uint c = seed;
  c ^= b; c -= m_rotl(b, 14);
  a ^= c; a -= m_rotl(c, 11);
  b ^= a; b -= m_rotl(a, 25);
  c ^= b; c -= m_rotl(b, 16);
  a ^= c; a -= m_rotl(c, 4);
  b ^= a; b -= m_rotl(a, 14);
  c ^= b; c -= m_rotl(b, 24);
  return c;
}

float m_grad(uint h, float x, float y) {
  h &= 7u;
  float u = h < 4u ? x : y;
  float v = 2.0 * (h < 4u ? y : x);
  return ((h & 1u) != 0u ? -u : u) + ((h & 2u) != 0u ? -v : v);
}

float m_noise(vec2 p) {
  int X = int(floor(p.x));
  int Y = int(floor(p.y));
  float fx = p.x - float(X);
  float fy = p.y - float(Y);
  float u = fx * fx * fx * (fx * (fx * 6.0 - 15.0) + 10.0);
  float v = fy * fy * fy * (fy * (fy * 6.0 - 15.0) + 10.0);
  float a = m_grad(m_hashInt(X, Y), fx, fy);
  float b = m_grad(m_hashInt(X + 1, Y), fx - 1.0, fy);
  float c = m_grad(m_hashInt(X, Y + 1), fx, fy - 1.0);
  float d = m_grad(m_hashInt(X + 1, Y + 1), fx - 1.0, fy - 1.0);
  return 0.6616 * mix(mix(a, b, u), mix(c, d, u), v);
}

vec3 m_rainbow(float t) {
  return cos((t + vec3(0.0, 1.0 / 3.0, 2.0 / 3.0)) * TAU) * 0.5 + 0.5;
}

vec4 material(Surface s) {
  if (s.d > 0.02) return vec4(0.0);
  float t = s.time * P_speed;
  float sdf = s.d * 0.5;
  vec2 pd = s.p * 0.5;
  vec2 grad = s.n * s.slope;

  float edgeT = clamp(-sdf / 0.06, 0.0, 1.0);
  vec2 base = grad * (1.0 - edgeT) * 0.35;

  float crScale = P_crinkleScale * 1.35;
  float crAmp = P_crinkle * 0.8;
  float neps = 0.02;
  vec2 cq = pd * crScale + vec2(2.7, 11.3);
  float w0 = m_noise(cq);
  float wx = (m_noise(cq + vec2(neps * crScale, 0.0)) - w0) / neps;
  float wy = (m_noise(cq + vec2(0.0, neps * crScale)) - w0) / neps;
  vec3 n = normalize(vec3(base + vec2(wx, wy) * crAmp * 0.4, -1.0));

  float fScale = P_foilScale * 2.2;
  float drift = t * 0.06;
  float blotch = m_noise(pd * fScale + drift * m_LD)
    + m_noise(pd * fScale * 2.1 + vec2(5.2, 9.4) - drift * m_LD * 1.6) * 0.4;
  float tilt = dot(n.xy, m_LD);
  float ramp = dot(pd, m_LD) * 0.8;
  float sv = clamp(P_silver, 0.0, 1.0);
  float s1 = smoothstep(0.0, 0.5, sv);
  float s2 = smoothstep(0.4, 1.0, sv);
  float hue = blotch * 0.45 * mix(1.0, 0.5, s2) + ramp * mix(1.0, 1.8, s2) + tilt * 1.4 + t * 0.18 + P_hueShift / 360.0;

  float sat = clamp(P_saturation, 0.0, 1.0);
  float env = smoothstep(-0.5, 0.5, dot(n.xy, vec2(0.6, 0.8)) * 3.0 + dot(pd, vec2(-0.5, 0.9)) * 1.2);
  vec3 silver = vec3(0.72, 0.73, 0.76) * mix(1.0, 0.3 + 0.75 * env, s1);
  float k = mix(1.0, 1.8, s1);
  float w = mix(1.0, 0.55, s1) * mix(1.0, 0.62, s2);
  float u = fract(hue * k + 0.5) - 0.5;
  float inBand = 1.0 - smoothstep(0.3 * w, 0.5 * w, abs(u));
  float bandHue = mix(0.0, 0.6667, s1) + u / w * mix(1.0, 0.6667, s1);
  vec3 spectral = pow(m_rainbow(bandHue), vec3(mix(1.0, 2.4, s2))) * mix(1.0, 1.25, s2);
  float spectralAmt = sat * mix(0.85, inBand * mix(0.85, 1.0, s2), s1);
  vec3 tint = mix(silver, spectral, spectralAmt);

  float rough = clamp(P_roughness, 0.0, 1.0);
  vec3 H = normalize(m_L + vec3(0.0, 0.0, -1.0));
  float ndl = clamp(dot(n, m_L) * 0.5 + 0.5, 0.0, 1.0);
  float ndh = clamp(dot(n, H), 0.0, 1.0);
  float sheen = pow(ndh, 7.0) * 0.45 * (1.0 - rough * 0.35);
  float specCore = pow(ndh, mix(42.0, 12.0, rough)) * 0.85 * (1.0 - rough * 0.55);
  vec3 spec = tint * sheen + mix(tint, vec3(1.0), 0.6) * specCore;

  vec2 fq = pd * 190.0;
  float flakeN = m_noise(fq);
  float flakePhase = m_noise(fq + vec2(47.3, -31.1));
  float twinkle = sin(t * 2.2 + flakePhase * 12.6) * 0.5 + 0.5;
  float flakeMask = smoothstep(0.52, 0.62, flakeN * 0.75 + twinkle * 0.3) * clamp(P_sparkle, 0.0, 1.0);
  vec3 flake = m_rainbow(hue + 0.33 + flakePhase * 0.5) * (0.85 + twinkle * 0.55) * (ndl * 0.6 + 0.7);

  float grain = m_noise(pd * 420.0);
  float grainMul = 1.0 + grain * rough * 0.28;

  vec3 foil = tint * (ndl * 0.5 + 0.62) + spec;
  foil = mix(foil, flake, flakeMask) * grainMul;
  return vec4(toDisplay(clamp(foil, 0.0, 1.0)), 1.0);
}
`
};
