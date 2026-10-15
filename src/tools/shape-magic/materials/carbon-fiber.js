export default {
  id: 'carbon-fiber',
  name: 'Carbon fiber',
  kind: 'shape',
  group: 'solid',
  source: 'shaders.com',
  animated: false,
  outside: false,
  surface: 0.15,
  params: [
    { name: 'sheenColor', label: 'Fiber color', type: 'color', default: '#b9bdc6' },
    { name: 'resin', label: 'Resin color', type: 'color', default: '#0b0c0e' },
    { name: 'bevel', label: 'Bevel', type: 'number', min: 0.02, max: 0.8, step: 0.01, default: 0.7 },
    {
      name: 'weave',
      label: 'Weave',
      type: 'select',
      options: [
        { value: 0, label: 'Twill' },
        { value: 1, label: 'Plain' }
      ],
      default: 0
    },
    { name: 'density', label: 'Weave density', type: 'number', min: 2, max: 50, step: 0.5, default: 30 },
    { name: 'angle', label: 'Weave angle', type: 'number', min: 0, max: 360, step: 1, default: 0 },
    { name: 'depth', label: 'Weave depth', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { name: 'sheen', label: 'Fiber sheen', type: 'number', min: 0, max: 1.5, step: 0.01, default: 1.2 },
    { name: 'roughness', label: 'Roughness', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { name: 'clearcoat', label: 'Clearcoat', type: 'number', min: 0, max: 2, step: 0.01, default: 1.2 },
    { name: 'lightAngle', label: 'Light angle', type: 'number', min: 0, max: 360, step: 1, default: 215 }
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

vec3 m_dome(Surface s, float bevel) {
  float depth = max(-s.d, 0.0);
  float w = m_width(s, bevel);
  float we = min(bevel, w * mix(0.55, 1.0, smoothstep(0.25, 0.9, w / max(bevel, 1e-4))));
  float band = min(0.02, 0.2 * we);
  float x = min(1.0 - clamp((depth - band) / max(we - band, 1e-4), 0.0, 1.0), 0.98);
  float xw = min(x, 0.85);
  return vec3(x * smoothstep(0.0, 0.2, s.slope), (asin(xw) - xw) * we, inversesqrt(1.0 - xw * xw));
}

float m_studio5(vec2 e, float keyRad, float str, float skyGain) {
  float sky = smoothstep(-0.7, 0.85, e.y);
  float lum = sky * sky * skyGain;
  lum += m_ss(keyRad, keyRad * 0.2, length(e - vec2(0.0, 0.55))) * 1.7 * str;
  lum += m_ss(keyRad * 1.15, keyRad * 0.23, length(e - vec2(-0.55, 0.18))) * 1.05 * str;
  lum += m_ss(keyRad, keyRad * 0.2, length(e - vec2(0.55, 0.1))) * str;
  lum += m_ss(keyRad * 1.3, keyRad * 0.26, length(e - vec2(0.2, -0.5))) * 0.7 * str;
  lum += m_ss(keyRad * 1.1, keyRad * 0.22, length(e - vec2(-0.35, -0.25))) * 0.85 * str;
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
  vec3 dome = m_dome(s, P_bevel);
  vec3 ng = vec3(s.n * dome.x, -sqrt(1.0 - dome.x * dome.x));
  vec2 pat = (s.p + s.n * dome.y) * vec2(0.5, -0.5);
  float wa = radians(P_angle);
  vec2 T = vec2(cos(wa), sin(wa));
  vec2 B = vec2(-T.y, T.x);
  float warp = dot(pat, T);
  float weft = dot(pat, B);
  vec2 cellUV = vec2(warp, weft) * P_density;
  vec2 cell = floor(cellUV);
  vec2 f = cellUV - cell - 0.5;
  float parity;
  if (P_weave > 0.5) {
    float s2 = cell.x + cell.y;
    parity = s2 - 2.0 * floor(s2 / 2.0);
  } else {
    float s4 = cell.x - cell.y + 64.0;
    parity = s4 - 4.0 * floor(s4 / 4.0) >= 2.0 ? 1.0 : 0.0;
  }
  vec2 fiber = mix(T, B, parity) * vec2(1.0, -1.0);
  vec2 crossAxis = mix(B, T, parity) * vec2(1.0, -1.0);
  float acrossLocal = mix(f.y, f.x, parity);
  float alongLocal = mix(warp, weft, parity);
  float cellPx = 2.0 / (P_density * dome.z * s.px);
  float fine = smoothstep(14.0, 28.0, cellPx);
  float bulge = sin(acrossLocal * PI) * P_depth * 0.32;
  float filament = (sin(acrossLocal * TAU * 7.0) + m_noise(vec2(alongLocal * 2.0, acrossLocal * 40.0)) * 0.18) * 0.13 * fine;
  float tilt = (bulge + filament) * smoothstep(3.0, 6.0, cellPx);
  vec3 n = normalize(vec3(ng.xy + crossAxis * tilt, ng.z));
  float edge = min(0.5 - abs(f.x), 0.5 - abs(f.y));
  float ao = mix(0.5, 1.0, smoothstep(0.0, max(0.05, 1.2 / cellPx), edge));
  ao = mix(0.86, ao, smoothstep(2.0, 5.0, cellPx));
  vec3 view = normalize(vec3(s.p * 0.3, 1.0));
  float grazing = 1.0 - clamp(-dot(ng, view), 0.0, 1.0);
  vec3 R = reflect(view, ng);
  float rough = clamp(P_roughness, 0.0, 1.0);
  float la = radians(P_lightAngle);
  vec3 L = normalize(vec3(cos(la), sin(la), -0.7));
  float baseA = mix(0.06, 0.5, rough);
  float sheenA = m_ward(n, vec3(fiber, 0.0), L, view, baseA * 6.0, baseA);
  float sheenB = m_ward(n, vec3(crossAxis, 0.0), L, view, baseA * 6.0, baseA);
  float sheen = mix((sheenA + sheenB) * 0.5, sheenA, smoothstep(2.5, 5.0, cellPx)) * P_sheen;
  float ndl = clamp(dot(n, L) * 0.5 + 0.5, 0.0, 1.0);
  float bodyLum = clamp(0.035 + ndl * 0.1 + sheen, 0.0, 1.3);
  vec3 body = mix(m_lin(C_resin.rgb), m_lin(C_sheenColor.rgb), bodyLum) * ao;
  float coat = m_studio5(R.xy, 0.16, 2.0, 0.3) * (0.05 + pow(grazing, 5.0) * 0.95) * P_clearcoat;
  return vec4(m_srgb(body + coat), 1.0);
}
`
};
