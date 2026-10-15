export default {
  id: 'brushed-metal',
  name: 'Brushed metal',
  kind: 'shape',
  group: 'metal',
  source: 'shaders.com',
  animated: true,
  outside: false,
  surface: 0.15,
  params: [
    { name: 'light', label: 'Light color', type: 'color', default: '#e9ebef' },
    { name: 'dark', label: 'Dark color', type: 'color', default: '#26282d' },
    { name: 'bevel', label: 'Bevel', type: 'number', min: 0.02, max: 0.8, step: 0.01, default: 0.7 },
    { name: 'angle', label: 'Brush angle', type: 'number', min: 0, max: 360, step: 1, default: 0 },
    { name: 'streaks', label: 'Streaks', type: 'number', min: 0, max: 1, step: 0.01, default: 0.8 },
    { name: 'grain', label: 'Grain', type: 'number', min: 0, max: 1, step: 0.01, default: 0.4 },
    { name: 'density', label: 'Grain density', type: 'number', min: 0.25, max: 4, step: 0.01, default: 2 },
    { name: 'roughness', label: 'Roughness', type: 'number', min: 0, max: 1, step: 0.01, default: 0.4 },
    { name: 'reflections', label: 'Reflections', type: 'number', min: 0, max: 2, step: 0.01, default: 1.4 },
    { name: 'lightAngle', label: 'Light angle', type: 'number', min: 0, max: 360, step: 1, default: 215 },
    { name: 'speed', label: 'Speed', type: 'number', min: 0, max: 4, step: 0.01, default: 0.4 }
  ],
  glsl: `
float m_ss(float a, float b, float x) {
  float t = clamp((x - a) / (b - a), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

vec3 m_lin(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
}

vec3 m_srgb(vec3 c) {
  c = max(c, 0.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

uint m_rotl(uint x, uint k) {
  return (x << k) | (x >> (32u - k));
}

uint m_hash(int x, int y) {
  uint seed = 0xdeadbeefu + 21u;
  uint a = seed + uint(x);
  uint b = seed + uint(y);
  uint c = seed;
  c ^= b; c -= m_rotl(b, 14u);
  a ^= c; a -= m_rotl(c, 11u);
  b ^= a; b -= m_rotl(a, 25u);
  c ^= b; c -= m_rotl(b, 16u);
  a ^= c; a -= m_rotl(c, 4u);
  b ^= a; b -= m_rotl(a, 14u);
  c ^= b; c -= m_rotl(b, 24u);
  return c;
}

float m_grad(uint h, float x, float y) {
  h &= 7u;
  float u = h < 4u ? x : y;
  float v = 2.0 * (h < 4u ? y : x);
  return ((h & 1u) != 0u ? -u : u) + ((h & 2u) != 0u ? -v : v);
}

float m_noise(vec2 p) {
  vec2 fl = floor(p);
  ivec2 i = ivec2(fl);
  vec2 f = p - fl;
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float v0 = m_grad(m_hash(i.x, i.y), f.x, f.y);
  float v1 = m_grad(m_hash(i.x + 1, i.y), f.x - 1.0, f.y);
  float v2 = m_grad(m_hash(i.x, i.y + 1), f.x, f.y - 1.0);
  float v3 = m_grad(m_hash(i.x + 1, i.y + 1), f.x - 1.0, f.y - 1.0);
  return 0.6616 * mix(mix(v0, v1, u.x), mix(v2, v3, u.x), u.y);
}

float m_width(Surface s, float bevel) {
  float depth = max(-s.d, 0.0);
  float k = bevel - depth;
  float w = bevel;
  if (k <= 0.0) return w;
  for (int i = 0; i < 4; i++) {
    float g = shapeAt(s.p - s.n * k) + depth + k;
    float c = smoothstep(0.0, 0.5 * k, g);
    if (c <= 0.0) break;
    w = mix(w, depth + k - 0.5 * g, c);
    k *= 0.5;
  }
  return min(bevel, w);
}

vec2 m_dome(Surface s, float bevel) {
  float depth = max(-s.d, 0.0);
  float we = m_width(s, bevel);
  float band = min(0.02, 0.2 * we);
  float x = min(1.0 - clamp((depth - band) / max(we - band, 1e-4), 0.0, 1.0), 0.98);
  return vec2(x * smoothstep(0.0, 0.2, s.slope), we * sqrt(1.0 - x * x));
}

float m_studio5(vec2 r, vec2 rot, float keyRad, float drift, float str, float skyGain) {
  vec2 e = vec2(r.x * rot.x - r.y * rot.y, r.x * rot.y + r.y * rot.x);
  float sky = smoothstep(-0.7, 0.85, e.y);
  float lum = sky * sky * skyGain;
  lum += m_ss(keyRad, keyRad * 0.2, length(e - vec2(drift, 0.55))) * 1.7 * str;
  lum += m_ss(keyRad * 1.15, keyRad * 0.23, length(e - vec2(-0.55 + drift, 0.18))) * 1.05 * str;
  lum += m_ss(keyRad, keyRad * 0.2, length(e - vec2(0.55 + drift, 0.1))) * str;
  lum += m_ss(keyRad * 1.3, keyRad * 0.26, length(e - vec2(0.2 + drift, -0.5))) * 0.7 * str;
  lum += m_ss(keyRad * 1.1, keyRad * 0.22, length(e - vec2(-0.35 + drift, -0.25))) * 0.85 * str;
  return lum;
}

float m_ward(vec3 n, vec3 dir, vec3 L, vec3 V, float aT, float aB) {
  vec3 T = normalize(dir - n * dot(n, dir));
  vec3 B = cross(n, T);
  vec3 H = normalize(L - V);
  float hT = dot(H, T) / max(aT, 0.0001);
  float hB = dot(H, B) / max(aB, 0.0001);
  float hN = clamp(abs(dot(H, n)), 0.0001, 1.0);
  return exp(-(hT * hT + hB * hB) / ((hN + 1.0) * 0.5));
}

vec4 material(Surface s) {
  if (s.d > max(0.02, 2.0 * s.aa)) return vec4(0.0);
  float t = s.time * P_speed;
  vec2 dome = m_dome(s, P_bevel);
  vec3 n = vec3(s.n * dome.x, -sqrt(1.0 - dome.x * dome.x));
  float ba = radians(P_angle);
  vec2 T = vec2(cos(ba), sin(ba));
  vec2 B = vec2(-T.y, T.x);
  vec2 pat = (s.p + vec2(-0.7, 0.5) * dome.y) * 0.5;
  float along = dot(pat, T);
  float across = dot(pat, B);
  float aniso = P_streaks;
  float dens = P_density * 150.0;
  float driftA = sin(t * 0.05) * 0.35;
  float sheenAmt = aniso * 0.5 + 0.08;
  float sheen = m_noise(vec2(along * 1.3 + driftA, across * 6.5));
  float lines = m_noise(vec2(along * 4.5, across * dens)) + 0.5 * m_noise(vec2(along * 8.0 + 3.1, across * dens * 2.3 + 7.7));
  float rAcross = sheen * sheenAmt + lines * P_grain * 0.16;
  float rAlong = m_noise(vec2(along * 1.3 + 15.21 + driftA, across * 6.5)) * sheenAmt * 0.12;
  n = normalize(vec3(n.xy + B * rAcross + T * rAlong, n.z));
  vec3 view = normalize(vec3(s.p * 0.3, 1.0));
  float rough = clamp(P_roughness, 0.0, 1.0);
  vec3 R = reflect(view, n);
  float keyRad = mix(0.42, 0.16, 1.0 - rough);
  float drift = sin(t * 0.07) * 0.05;
  float stepv = aniso * (rough * 0.6 + 0.25) * 0.105;
  float env = 0.0;
  for (int i = 0; i < 9; i++) {
    float o = float(i - 4);
    env += m_studio5(R.xy + T * (stepv * o), vec2(1.0, 0.0), keyRad, drift, P_reflections, 0.38) * exp(-o * o / 8.82);
  }
  env /= 5.1032;
  float la = radians(P_lightAngle);
  vec3 L = normalize(vec3(cos(la), sin(la), -0.7));
  float baseA = mix(0.05, 0.45, rough);
  float spec = m_ward(n, vec3(T, 0.0), L, view, baseA * (1.0 + aniso * 7.0), max(baseA * (1.0 - aniso * 0.55), 0.02)) * mix(0.45, 1.1, 1.0 - rough);
  float grazing = 1.0 - clamp(-dot(n, view), 0.0, 1.0);
  float lit = clamp((env + spec) * (1.0 + grazing * grazing * grazing * 0.6), 0.0, 1.7);
  vec3 rgb = mix(m_lin(C_dark.rgb), m_lin(C_light.rgb), lit);
  return vec4(m_srgb(rgb), 1.0);
}
`
};
