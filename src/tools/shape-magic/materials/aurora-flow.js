export default {
  id: 'aurora-flow',
  name: 'Aurora flow',
  kind: 'fill',
  group: 'pattern',
  source: 'shaders.com',
  animated: true,
  params: [
    { name: 'colorA', label: 'Base', type: 'color', default: '#a533f8' },
    { name: 'colorB', label: 'Core', type: 'color', default: '#22ee88' },
    { name: 'colorC', label: 'Tips', type: 'color', default: '#1694e8' },
    { name: 'sky', label: 'Sky', type: 'color', default: '#0a0813' },
    { name: 'intensity', label: 'Intensity', type: 'number', min: 0, max: 200, step: 1, default: 140 },
    { name: 'balance', label: 'Balance', type: 'number', min: 0, max: 100, step: 1, default: 70 },
    { name: 'height', label: 'Height', type: 'number', min: 10, max: 200, step: 1, default: 120 },
    { name: 'position', label: 'Position', type: 'number', min: -0.5, max: 1, step: 0.01, default: 0.3 },
    { name: 'waviness', label: 'Waviness', type: 'number', min: 0, max: 200, step: 1, default: 50 },
    { name: 'rays', label: 'Rays', type: 'number', min: 0, max: 100, step: 1, default: 35 },
    { name: 'scale', label: 'Scale', type: 'number', min: 0.25, max: 4, step: 0.05, default: 1 },
    { name: 'speed', label: 'Speed', type: 'number', min: -10, max: 10, step: 0.1, default: 5 },
    { name: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 0 }
  ],
  glsl: `
const float m_OFFSETS[4] = float[4](0.0, 3.1, 6.7, 9.4);
const float m_WEIGHTS[4] = float[4](1.0, 0.65, 0.45, 0.3);

vec3 m_lin(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
}

vec3 m_srgb(vec3 c) {
  c = max(c, 0.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(0.41666)) - 0.055, step(0.0031308, c));
}

vec4 m_mix(vec4 a, vec4 b, float t) {
  float wa = a.a * (1.0 - t);
  float wb = b.a * t;
  float w = wa + wb;
  return vec4((a.rgb * wa + b.rgb * wb) / max(w, 0.001), w);
}

float m_phase(float seed, float k, float big) {
  return fract(sin(seed * k) * big) * 6.283185307179586;
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
  float span = 1.7 * max(P_scale, 0.05);
  vec2 uv = vec2(0.5 + p.x / span, P_position + (p.y - (P_position - 0.5) * 1.7) / span);
  float t = time * P_speed;
  float wav = P_waviness * 0.01;
  float rayAmount = P_rays * 0.01;
  float height = P_height * 0.01;
  float wx = (uv.x - 0.5) * 2.0;
  float sum = 0.0;
  float total = 0.0;
  for (int i = 0; i < 4; i++) {
    float slow = t * 0.06 + m_OFFSETS[i];
    float seed = P_variation + float(i) * 31.7;
    float arc = sin(wx * 0.7 + slow * 0.4 + m_phase(seed, 12.9, 4758.5)) * 0.15
      + sin(wx * 1.6 + slow * 0.65 + m_phase(seed, 78.2, 2847.1)) * 0.08
      + sin(wx * 2.9 + slow * 0.3 + m_phase(seed, 41.6, 1593.7)) * 0.04;
    float warp = m_noise(vec3(wx * 0.5, slow * 0.25, seed * 0.1));
    float pathY = P_position + arc * wav + warp * 0.14 * wav;
    float wave = sin((wx + warp * 2.5) * (mix(6.0, 20.0, rayAmount) * 0.15) + slow * 0.1 + m_phase(seed, 53.7, 3847.2));
    float rays = pow(max(wave * 0.5 + 0.5, 0.0), 1.5);
    float dist = uv.y - pathY;
    float extent = height * mix(0.4, 1.0, rays) * (rays * 0.4 + 0.6);
    float envelope = smoothstep(-0.04, 0.015, dist) * (1.0 - smoothstep(0.0, extent, dist));
    float colorT = clamp(dist / (extent + 0.001), 0.0, 1.0);
    float section = mix(0.4, 1.0, warp * 0.5 + 0.5);
    float core = exp((colorT - 0.2) * (colorT - 0.2) * -6.0) * 0.3 + 1.0;
    float alpha = envelope * rays * section * core * m_WEIGHTS[i];
    sum += colorT * alpha;
    total += alpha;
  }
  float avgT = pow(sum / (total + 0.001), mix(2.5, 0.4, P_balance * 0.01));
  vec4 a = vec4(m_lin(C_colorA.rgb), C_colorA.a);
  vec4 b = vec4(m_lin(C_colorB.rgb), C_colorB.a);
  vec4 c = vec4(m_lin(C_colorC.rgb), C_colorC.a);
  vec4 color = m_mix(m_mix(a, b, smoothstep(0.0, 0.2, avgT)), c, smoothstep(0.4, 0.85, avgT));
  float glow = total * P_intensity * 0.018;
  vec3 light = m_srgb(clamp(color.rgb * glow, 0.0, 1.0));
  float la = clamp(glow * 0.5, 0.0, 1.0);
  float sa = C_sky.a * (1.0 - la);
  float oa = la + sa;
  return vec4((light * la + C_sky.rgb * sa) / max(oa, 0.0001), oa);
}
`
};
