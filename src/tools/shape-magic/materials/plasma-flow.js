export default {
  id: 'plasma-flow',
  name: 'Plasma flow',
  kind: 'fill',
  group: 'pattern',
  source: 'shaders.com',
  animated: true,
  params: [
    { name: 'colors', label: 'Colors', type: 'colorArray', default: ['#7018be', '#000000'], minItems: 2, maxItems: 6 },
    { name: 'intensity', label: 'Intensity', type: 'number', min: 0.1, max: 3, step: 0.1, default: 1.8 },
    { name: 'contrast', label: 'Contrast', type: 'number', min: 0, max: 3, step: 0.1, default: 1 },
    { name: 'balance', label: 'Balance', type: 'number', min: 0, max: 100, step: 1, default: 50 },
    { name: 'density', label: 'Density', type: 'number', min: 0, max: 4, step: 0.1, default: 2 },
    { name: 'warp', label: 'Warp', type: 'number', min: 0, max: 1, step: 0.01, default: 0.4 },
    { name: 'speed', label: 'Speed', type: 'number', min: 0, max: 5, step: 0.1, default: 2 }
  ],
  glsl: `
vec3 m_lin(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
}

vec3 m_srgb(vec3 c) {
  c = max(c, 0.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(0.41666)) - 0.055, step(0.0031308, c));
}

vec4 m_stop(int k) {
  vec4 c = C_colors(k);
  return vec4(m_lin(c.rgb), c.a);
}

vec4 m_ramp(float t) {
  float n = clamp(N_colors, 1.0, 6.0);
  float x = clamp(t, 0.0, 1.0) * max(n - 1.0, 0.0);
  int i = int(min(floor(x), max(n - 2.0, 0.0)));
  float f = clamp(x - float(i), 0.0, 1.0);
  vec4 a = m_stop(i);
  vec4 b = m_stop(min(i + 1, int(n) - 1));
  float wa = a.a * (1.0 - f);
  float wb = b.a * f;
  float w = wa + wb;
  return vec4((a.rgb * wa + b.rgb * wb) / max(w, 0.001), w);
}

uint m_rotl(uint x, int k) {
  return (x << uint(k)) | (x >> uint(32 - k));
}

uint m_hash(int x, int y, int z) {
  uint s = 0xdeadbeefu + 25u;
  uint a = s + uint(x);
  uint b = s + uint(y);
  uint c = s + uint(z);
  c ^= b;
  c -= m_rotl(b, 14);
  a ^= c;
  a -= m_rotl(c, 11);
  b ^= a;
  b -= m_rotl(a, 25);
  c ^= b;
  c -= m_rotl(b, 16);
  a ^= c;
  a -= m_rotl(c, 4);
  b ^= a;
  b -= m_rotl(a, 14);
  c ^= b;
  c -= m_rotl(b, 24);
  return c;
}

float m_grad(uint h, vec3 f) {
  h &= 15u;
  float u = h < 8u ? f.x : f.y;
  float v = h < 4u ? f.y : (h == 12u || h == 14u ? f.x : f.z);
  return ((h & 1u) != 0u ? -u : u) + ((h & 2u) != 0u ? -v : v);
}

float m_noise(vec3 p) {
  vec3 i = floor(p);
  ivec3 c = ivec3(i);
  vec3 f = p - i;
  vec3 w = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float n000 = m_grad(m_hash(c.x, c.y, c.z), f);
  float n100 = m_grad(m_hash(c.x + 1, c.y, c.z), f - vec3(1.0, 0.0, 0.0));
  float n010 = m_grad(m_hash(c.x, c.y + 1, c.z), f - vec3(0.0, 1.0, 0.0));
  float n110 = m_grad(m_hash(c.x + 1, c.y + 1, c.z), f - vec3(1.0, 1.0, 0.0));
  float n001 = m_grad(m_hash(c.x, c.y, c.z + 1), f - vec3(0.0, 0.0, 1.0));
  float n101 = m_grad(m_hash(c.x + 1, c.y, c.z + 1), f - vec3(1.0, 0.0, 1.0));
  float n011 = m_grad(m_hash(c.x, c.y + 1, c.z + 1), f - vec3(0.0, 1.0, 1.0));
  float n111 = m_grad(m_hash(c.x + 1, c.y + 1, c.z + 1), f - vec3(1.0, 1.0, 1.0));
  float lo = mix(mix(n000, n100, w.x), mix(n010, n110, w.x), w.y);
  float hi = mix(mix(n001, n101, w.x), mix(n011, n111, w.x), w.y);
  return 0.982 * mix(lo, hi, w.z);
}

vec4 fill(vec2 p, float time) {
  vec3 pos = vec3(p / 1.7 * exp(P_density - 1.0) + 0.5 * exp(1.0), 0.0);
  float t = time * P_speed * 0.125;
  float amount = P_warp * 4.0;
  float qx = m_noise(pos + vec3(t * 0.3, t * -0.2, 0.0));
  float qy = m_noise(pos + vec3(5.2, 1.3, t * 0.25));
  vec3 warped = pos + vec3(qx, qy, 0.0) * amount;
  float rx = m_noise(warped + vec3(1.7, 9.2, t * 0.15));
  float ry = m_noise(warped + vec3(8.3, 2.8, t * 0.13));
  float v = m_noise(pos + vec3(rx, ry, 0.0) * amount) * 0.5 + 0.5;
  float spread = pow(max(v, 0.0), 5.0 / max(P_intensity, 0.01));
  float contrasted = clamp((spread - 0.5) * P_contrast + 0.5, 0.0, 1.0);
  float balanced = clamp(contrasted + P_balance / 100.0 - 0.5, 0.0, 1.0);
  vec4 c = m_ramp(1.0 - balanced);
  return vec4(m_srgb(c.rgb), c.a);
}
`
};
