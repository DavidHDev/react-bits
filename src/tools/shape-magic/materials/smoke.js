export default {
  id: 'smoke',
  name: 'Smoke',
  kind: 'shape',
  group: 'volume',
  source: 'shaders.com',
  animated: true,
  outside: false,
  normals: false,
  surface: 0.1,
  params: [
    { name: 'fresh', label: 'Fresh', type: 'color', default: '#8cf3ff' },
    { name: 'aged', label: 'Aged', type: 'color', default: '#04a0d6' },
    { name: 'sourceX', label: 'Source x', type: 'number', min: -0.9, max: 0.9, step: 0.01, default: 0 },
    { name: 'sourceY', label: 'Source y', type: 'number', min: -0.9, max: 0.9, step: 0.01, default: 0.5 },
    { name: 'direction', label: 'Direction', type: 'number', min: 0, max: 360, step: 1, default: 0 },
    { name: 'spread', label: 'Spread', type: 'number', min: 0, max: 180, step: 1, default: 60 },
    { name: 'intensity', label: 'Intensity', type: 'number', min: 0.1, max: 1, step: 0.01, default: 1 },
    { name: 'dissipation', label: 'Dissipation', type: 'number', min: 0.1, max: 5, step: 0.1, default: 0.3 },
    { name: 'detail', label: 'Detail', type: 'number', min: 0, max: 50, step: 1, default: 25 },
    { name: 'decay', label: 'Color decay', type: 'number', min: 0, max: 3, step: 0.1, default: 0.4 },
    { name: 'speed', label: 'Speed', type: 'number', min: 0, max: 2, step: 0.01, default: 1 }
  ],
  glsl: `
uint m_hash(uvec3 v) {
  uint h = v.x * 0x8da6b343u ^ v.y * 0xd8163841u ^ v.z * 0xcb1ab31fu;
  h ^= h >> 16u;
  h *= 0x7feb352du;
  h ^= h >> 15u;
  h *= 0x846ca68bu;
  h ^= h >> 16u;
  return h;
}

float m_grad(uint h, vec2 f) {
  h &= 7u;
  float u = h < 4u ? f.x : f.y;
  float v = 2.0 * (h < 4u ? f.y : f.x);
  return ((h & 1u) != 0u ? -u : u) + ((h & 2u) != 0u ? -v : v);
}

float m_noise(vec2 p, uint z) {
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 w = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  uvec3 c = uvec3(uvec2(ivec2(i)), z);
  float a = m_grad(m_hash(c), f);
  float b = m_grad(m_hash(c + uvec3(1u, 0u, 0u)), f - vec2(1.0, 0.0));
  float d = m_grad(m_hash(c + uvec3(0u, 1u, 0u)), f - vec2(0.0, 1.0));
  float e = m_grad(m_hash(c + uvec3(1u, 1u, 0u)), f - vec2(1.0, 1.0));
  return 0.6616 * mix(mix(a, b, w.x), mix(d, e, w.x), w.y);
}

float m_fbm(vec2 p, uint z) {
  float sum = 0.0;
  float amp = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    sum += amp * m_noise(p, z + uint(i));
    p = r * p * 2.03 + vec2(1.7, 9.2);
    amp *= 0.5;
  }
  return sum;
}

vec4 material(Surface s) {
  if (s.d > 0.02) return vec4(0.0);
  float t = s.time * P_speed;
  float ang = radians(P_direction);
  vec2 up = vec2(sin(ang), -cos(ang));
  vec2 side = vec2(-up.y, up.x);
  vec2 src0 = vec2(P_sourceX, P_sourceY);
  float d0 = shapeAt(src0);
  vec2 g0 = vec2(shapeAt(src0 + vec2(0.01, 0.0)) - d0, shapeAt(src0 + vec2(0.0, 0.01)) - d0);
  vec2 srcP = src0 - g0 / max(length(g0), 1e-5) * max(d0 + 0.07, 0.0);
  vec2 rel = s.p - srcP;
  float a = dot(rel, up);
  float c = dot(rel, side);
  float turb = P_detail / 25.0;
  vec2 q = vec2(c, a - 0.3 * t);

  vec2 warp = vec2(m_fbm(q * 1.7 + vec2(0.0, t * 0.12), 0u), m_fbm(q * 1.7 + vec2(5.2, 1.3) - vec2(0.0, t * 0.1), 8u));
  vec2 fine = vec2(m_fbm(q * 4.6 + warp * 0.8 + vec2(0.0, t * 0.2), 48u), m_fbm(q * 4.6 + vec2(2.7, 8.1) - warp * 0.8, 56u));
  float h = max(a, 0.0);
  float amp = turb * (0.02 + 0.36 * min(h, 1.4));
  float cw = c + (warp.x + fine.x * 0.35) * amp;
  float aw = a + (warp.y + fine.y * 0.25) * amp * 0.5;
  float hw = max(aw, 0.0);
  float src = 0.055;
  float width = src + hw * tan(radians(min(P_spread, 178.0)) * 0.5) * 0.58;
  float flare = smoothstep(-0.3, -0.02, s.d) * smoothstep(0.15, 0.7, hw);
  width *= 1.0 + flare * 1.2;
  float core = exp(-cw * cw / (width * width));
  core *= smoothstep(-src * 1.5, src, aw);
  core *= exp(-hw * P_dissipation * 0.8);
  float wisps = smoothstep(-0.32, 0.42, m_fbm(q * 3.6 + warp * 1.1 * turb + fine * 0.5, 16u));
  float dens = smoothstep(0.03, 0.8, core * mix(0.38, 1.0, wisps)) * 0.8;
  dens += core * exp(-hw * 7.0) * 0.7;
  float plume = dens * P_intensity;

  vec2 fq = s.p * 1.1 + vec2(0.0, -t * 0.04);
  vec2 fw = vec2(m_fbm(fq + vec2(t * 0.025, 0.0), 24u), m_fbm(fq + vec2(3.1, -t * 0.03), 32u));
  float body = m_fbm(fq * 1.6 + fw * (0.5 + turb * 0.5), 40u);
  float fill = clamp(0.62 + body * 0.55, 0.0, 1.0) * P_intensity * 0.4 / (0.75 + P_dissipation);

  float total = plume + fill;
  float age = clamp(hw * P_decay * 1.1 + (1.0 - core) * 0.3, 0.0, 1.0);
  float ageMix = (plume * age + fill) / max(total, 1e-4);
  vec3 col = toDisplay(mix(toLinear(C_fresh.rgb), toLinear(C_aged.rgb), clamp(ageMix, 0.0, 1.0)));
  return vec4(col, clamp(total, 0.0, 1.0) * C_fresh.a);
}
`
};
