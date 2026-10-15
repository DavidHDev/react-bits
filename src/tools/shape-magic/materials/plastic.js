export default {
  id: 'plastic',
  name: 'Plastic',
  kind: 'shape',
  group: 'solid',
  source: 'shaders.com',
  animated: true,
  outside: false,
  surface: 0.15,
  params: [
    { name: 'top', label: 'Top color', type: 'color', default: '#f5f5f7' },
    { name: 'bottom', label: 'Bottom color', type: 'color', default: '#d9dade' },
    { name: 'puffiness', label: 'Puffiness', type: 'number', min: 0.03, max: 0.8, step: 0.01, default: 0.3 },
    { name: 'roughness', label: 'Roughness', type: 'number', min: 0, max: 1, step: 0.01, default: 0.12 },
    { name: 'gloss', label: 'Gloss', type: 'number', min: 0, max: 2, step: 0.01, default: 1 },
    { name: 'crumple', label: 'Crumple', type: 'number', min: 0, max: 1, step: 0.01, default: 0.25 },
    { name: 'dentSize', label: 'Dent density', type: 'number', min: 0.5, max: 10, step: 0.1, default: 1 },
    { name: 'coverage', label: 'Coverage', type: 'number', min: 0, max: 1, step: 0.01, default: 1 },
    { name: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 0 },
    { name: 'lightAngle', label: 'Light angle', type: 'number', min: 0, max: 360, step: 1, default: 315 },
    { name: 'speed', label: 'Speed', type: 'number', min: 0, max: 4, step: 0.01, default: 1 }
  ],
  glsl: `
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

float m_crumple(vec2 p, float cs, float so) {
  return abs(m_noise(vec2(p.x * cs + so, p.y * cs + so * 0.617))) + 0.45 * abs(m_noise(vec2(p.x * cs * 2.3 + 13.1 + so, p.y * cs * 2.3 + 7.7 + so * 0.617)));
}

float m_box(float x, float lo, float hi, float s) {
  return smoothstep(lo - s, lo + s, x) * (1.0 - smoothstep(hi - s, hi + s, x));
}

vec4 material(Surface s) {
  if (s.d > max(0.02, 2.0 * s.aa)) return vec4(0.0);
  float t = s.time * P_speed + 3.0;
  float depth = max(-s.d, 0.0);
  float range = max(P_puffiness, 0.02);
  float we = m_width(s, range);
  float dn = clamp(depth / max(we, 1e-4), 0.0, 1.0);
  float bevel = sqrt(max(1.0 - dn * dn, 0.0)) * 2.4 * smoothstep(0.0, 0.2, s.slope);
  vec3 n = normalize(vec3(s.n * bevel, -1.0));
  vec2 pat = s.p * 0.5;
  float cs = P_dentSize * 4.0;
  float so = P_variation * 7.31;
  float c0 = m_crumple(pat, cs, so);
  vec2 cg = vec2(m_crumple(pat + vec2(0.012, 0.0), cs, so) - c0, m_crumple(pat + vec2(0.0, 0.012), cs, so) - c0) / 0.012;
  float covNoise = m_noise(vec2(pat.x * 2.6 + so + 31.7, pat.y * 2.6 + so * 0.617 + 17.3)) * 0.5 + 0.5;
  float th = 1.25 - clamp(P_coverage, 0.0, 1.0) * 1.75;
  float cw = P_crumple * 0.9 * smoothstep(th - 0.25, th + 0.25, covNoise) * (smoothstep(0.0, 0.35, dn) * 0.85 + 0.15);
  n = normalize(vec3(n.xy + cg * cw * 0.25, n.z));
  float grazing = 1.0 - clamp(-n.z, 0.0, 1.0);
  vec3 R = reflect(vec3(0.0, 0.0, 1.0), n);
  float rough = clamp(P_roughness, 0.0, 1.0);
  float la = radians(P_lightAngle + t * 6.0);
  vec2 l = vec2(cos(la), sin(la));
  float jit = rough * m_noise(pat * 140.0) * 0.18;
  float eu = R.x * l.x + R.y * l.y + jit;
  float ev = -R.x * l.y + R.y * l.x + jit * 0.6;
  float soft = mix(0.02, 0.45, rough);
  float key = m_box(eu, 0.18, 0.95, soft) * m_box(ev, -0.42, 0.42, soft) * (1.0 - m_box(ev, -0.045, 0.045, soft * 0.6) * 0.8 * (1.0 - rough));
  float strip = m_box(eu, -0.16, -0.05, soft * 0.7) * m_box(ev, -0.85, 0.85, soft) * 0.85;
  float fill = m_box(eu, -0.95, -0.45, soft * 1.6) * m_box(ev, -0.6, 0.6, soft * 1.6) * 0.3;
  float env = (key + strip + fill + clamp(eu * 0.5 + 0.5, 0.0, 1.0) * 0.12) * (1.0 - rough * 0.55);
  vec3 L = normalize(vec3(l, -0.8));
  vec3 H = normalize(L + vec3(0.0, 0.0, -1.0));
  float glint = pow(clamp(dot(n, H), 0.0, 1.0), exp2(mix(9.0, 4.0, rough))) * 1.6 * (1.0 - rough * 0.7);
  float spec = (env + glint) * P_gloss * (0.3 + grazing * grazing * grazing * 0.7);
  float lit = clamp(dot(n, L), -1.0, 1.0) * 0.5 + 0.5;
  float diffuse = mix(1.0 - 0.2625, 1.1575, lit);
  float ao = mix(0.6, 1.0, smoothstep(0.0, 1.0, clamp(depth / min(0.05, 0.5 * we), 0.0, 1.0)));
  float rim = pow(grazing, 3.5) * 0.4 * (lit * 0.6 + 0.4);
  float g = smoothstep(0.0, 1.0, clamp(pat.y / 0.7 + 0.5, 0.0, 1.0));
  vec3 base = mix(m_lin(C_top.rgb), m_lin(C_bottom.rgb), g);
  vec3 rgb = base * diffuse * ao + spec + rim;
  return vec4(m_srgb(rgb), 1.0);
}
`
};
