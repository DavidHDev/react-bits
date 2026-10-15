export default {
  id: 'frost',
  name: 'Frost',
  kind: 'shape',
  group: 'glass',
  source: 'shaders.com',
  animated: true,
  outside: false,
  surface: 'bevel',
  params: [
    { name: 'ice', label: 'Ice color', type: 'color', default: '#0597fc' },
    { name: 'bevel', label: 'Bevel', type: 'number', min: 0.04, max: 0.7, step: 0.01, default: 0.3 },
    { name: 'density', label: 'Density', type: 'number', min: 0, max: 10, step: 0.01, default: 5 },
    { name: 'frost', label: 'Frost', type: 'number', min: 0, max: 1, step: 0.01, default: 0.8 },
    { name: 'reach', label: 'Frost depth', type: 'number', min: 0, max: 1, step: 0.01, default: 0.6 },
    { name: 'scale', label: 'Crystal scale', type: 'number', min: 0.3, max: 4, step: 0.01, default: 1 },
    { name: 'sparkle', label: 'Sparkle', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { name: 'gloss', label: 'Gloss', type: 'number', min: 0, max: 1, step: 0.01, default: 0.6 },
    { name: 'angle', label: 'Light angle', type: 'number', min: 0, max: 360, step: 1, default: 300 },
    { name: 'speed', label: 'Speed', type: 'number', min: 0, max: 2, step: 0.01, default: 0.3 }
  ],
  glsl: `
uint m_hash(ivec2 c, uint k) {
  uvec2 v = uvec2(c) * 1664525u + uvec2(1013904223u, 1013904223u + k * 2654435769u);
  v.x += v.y * 1664525u;
  v.y += v.x * 1664525u;
  v ^= v >> 16u;
  v.x += v.y * 1664525u;
  v.y += v.x * 1664525u;
  v ^= v >> 16u;
  return v.x ^ v.y;
}

float m_grad(uint h, float x, float y) {
  uint k = h & 7u;
  float u = k < 4u ? x : y;
  float v = 2.0 * (k < 4u ? y : x);
  return ((k & 1u) != 0u ? -u : u) + ((k & 2u) != 0u ? -v : v);
}

float m_noise(vec2 p) {
  vec2 fl = floor(p);
  ivec2 i = ivec2(fl);
  vec2 f = p - fl;
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = m_grad(m_hash(i, 0u), f.x, f.y);
  float b = m_grad(m_hash(i + ivec2(1, 0), 0u), f.x - 1.0, f.y);
  float c = m_grad(m_hash(i + ivec2(0, 1), 0u), f.x, f.y - 1.0);
  float d = m_grad(m_hash(i + ivec2(1, 1), 0u), f.x - 1.0, f.y - 1.0);
  return 0.6616 * mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float m_worley(vec2 p) {
  vec2 fl = floor(p);
  ivec2 i = ivec2(fl);
  vec2 f = p - fl;
  float best = 1e6;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      ivec2 c = i + ivec2(x, y);
      vec2 o = vec2(float(m_hash(c, 1u) >> 8u), float(m_hash(c, 2u) >> 8u)) / 16777216.0;
      vec2 diff = vec2(x, y) + o - f;
      best = min(best, dot(diff, diff));
    }
  }
  return best;
}

vec4 material(Surface s) {
  if (s.d > 0.02) return vec4(0.0);
  float t = s.time * P_speed;
  float bw = max(P_bevel, 1e-3);

  float ridge = smoothstep(0.15, 0.85, s.slope);
  float xb = clamp(1.0 + s.d / bw, 0.0, 1.0);
  float xs = clamp(1.0 + s.d / 0.7, 0.0, 1.0);
  float x = min(pow(pow(xb, 4.0) + pow(xs * 0.72, 4.0), 0.25), 0.97) * ridge;
  float slope = x / sqrt(1.0 - x * x);
  vec3 nBase = normalize(vec3(s.n * slope, -1.0));
  float steep = 1.0 / (1.0 + min(slope * slope, 2.0) * 2.0);
  float chord = 0.35 * sqrt(max(1.0 - xs * xs, 0.0));
  vec2 pat = vec2(s.p.x * 0.5 - chord * 0.7, -s.p.y * 0.5 - chord * 0.5);

  float thickness = clamp(chord * 2.0, 0.0, 1.2) * P_density;
  float depthT = clamp(thickness * 1.2, 0.0, 1.0);
  vec3 transmit = exp(-thickness * vec3(1.6, 0.85, 0.45));
  vec3 ice = toLinear(C_ice.rgb);
  vec3 scattered = mix(vec3(1.0), ice, depthT) * transmit;

  float reach = max(P_reach * 0.3, 0.01);
  float field = (1.0 - smoothstep(0.0, reach, chord)) * P_frost;
  vec3 fx = vec3(0.0);
  float glint = 0.0;
  float a = radians(P_angle);
  vec3 L = normalize(vec3(cos(a), sin(a), -0.6));
  vec3 H = normalize(L + vec3(0.0, 0.0, -1.0));
  if (field > 0.0) {
    float fs = P_scale * 60.0;
    float e = 0.004;
    float n0 = m_noise(pat * fs);
    float nx = (m_noise(vec2(pat.x + e, pat.y) * fs) - n0) / e;
    float ny = (m_noise(vec2(pat.x, pat.y + e) * fs) - n0) / e;
    float amp = field * 3.0 * steep;
    float wc = m_worley(pat * P_scale * 40.0);
    fx = vec3(nx * amp * 0.03, ny * amp * 0.03, (1.0 - smoothstep(0.0, 0.25, wc)) * field);
  }
  vec3 n = normalize(vec3(nBase.xy + fx.xy, nBase.z));
  float ndl = dot(n, L);
  float ndh = clamp(dot(n, H), 0.0, 1.0);
  if (field > 0.0) {
    float gf = m_noise(vec2(pat.x * 190.0 + 13.7, pat.y * 190.0 - 4.3)) * 0.5 + 0.5;
    float tw = sin(t * 3.0 + gf * 40.0) * 0.5 + 0.5;
    glint = smoothstep(0.72, 0.96, gf * tw) * (pow(ndh, 6.0) * 0.6 + 0.4) * field * P_sparkle;
  }

  float wrap = ndl * 0.5 + 0.5;
  float sss = pow(max(wrap, 0.0), 0.7);
  float back = clamp(dot(L, vec3(0.0, 0.0, 1.0)) * 0.5 + 0.5, 0.0, 1.0);
  vec3 forward = transmit * back * 0.5 * (1.0 - depthT * 0.4);
  vec3 sssRgb = scattered * (sss * 0.6 + 0.5) + forward * 0.5;
  vec3 frostRgb = vec3(0.95, 0.98, 1.0) * (fx.z * 0.4 + glint * 4.0);

  float graze = 1.0 - clamp(-n.z, 0.0, 1.0);
  vec3 fres = vec3(0.85, 0.93, 1.0) * pow(graze, 3.0) * 0.02 * 1.5;
  float spec = pow(ndh, 16.0) * 0.4 * P_gloss;
  vec3 rgb = sssRgb + vec3(spec) + fres + frostRgb;
  return vec4(toDisplay(rgb), 1.0);
}
`
};
