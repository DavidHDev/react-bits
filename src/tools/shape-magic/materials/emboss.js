export default {
  id: 'emboss',
  name: 'Emboss',
  kind: 'shape',
  group: 'relief',
  source: 'shaders.com',
  animated: false,
  outside: true,
  reach: 99,
  surface: 'bevel',
  params: [
    { name: 'paper', label: 'Paper', type: 'color', default: '#ebeae6' },
    {
      name: 'mode',
      label: 'Relief',
      type: 'select',
      options: [
        { value: 0, label: 'Debossed' },
        { value: 1, label: 'Embossed' }
      ],
      default: 0
    },
    { name: 'surround', label: 'Surround', type: 'boolean', default: false },
    { name: 'depth', label: 'Depth', type: 'number', min: 0.05, max: 1, step: 0.01, default: 0.5 },
    { name: 'bevel', label: 'Bevel', type: 'number', min: 0.004, max: 0.12, step: 0.001, default: 0.02 },
    { name: 'angle', label: 'Light angle', type: 'number', min: 0, max: 360, step: 1, default: 260 },
    { name: 'light', label: 'Highlights', type: 'number', min: 0, max: 2, step: 0.01, default: 0.25 },
    { name: 'shadow', label: 'Shadows', type: 'number', min: 0, max: 1, step: 0.01, default: 0.3 },
    { name: 'grain', label: 'Grain', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 }
  ],
  glsl: `
float m_hash(vec2 p) {
  uvec2 u = floatBitsToUint(p * vec2(141421356.0, 2718281828.0));
  return float((u.x ^ u.y) * 3141592653u) / 4294967295.0;
}

float m_noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = p - i;
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(m_hash(i), m_hash(i + vec2(1.0, 0.0)), f.x),
    mix(m_hash(i + vec2(0.0, 1.0)), m_hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float m_paper(vec2 q) {
  float n = m_noise(q * 9.0) * 0.45;
  n += m_noise(rot2(0.7) * q * vec2(26.0, 70.0)) * 0.3;
  n += m_noise(rot2(-1.1) * q * vec2(60.0, 150.0)) * 0.25;
  return n - 0.5;
}

float m_height(float d, float depth, float w) {
  return depth * smoothstep(0.0, -w, d);
}

vec4 material(Surface s) {
  bool surround = P_surround > 0.5;
  if (!surround && s.d > s.aa * 2.0) return vec4(0.0);
  float depth = (P_mode > 0.5 ? 1.0 : -1.0) * P_depth;
  float ad = max(abs(depth), 1e-4);
  float w = max(P_bevel, s.px);
  float la = P_angle * PI / 180.0;
  vec2 dir = vec2(cos(la), sin(la));

  float x = clamp(-s.d / w, 0.0, 1.0);
  float ramp = 6.0 * x * (1.0 - x) / w;
  vec2 grad = -depth * ramp * s.n * s.slope * 2.0;
  vec3 N = normalize(vec3(-grad, 1.0));
  vec3 L = vec3(dir * 0.8192, 0.5735);
  float lit = (dot(N, L) - 0.5735) * P_light;
  float hi = max(lit, 0.0);
  float edge = max(-lit, 0.0);

  float drop = 0.0;
  float spread = ad * 0.12;
  float soft = ad * 0.12;
  float mid = s.d + w * 0.5;
  if (abs(mid) < spread + soft + w) {
    float hC = m_height(s.d, depth, w);
    float h1 = depth * smoothstep(soft, -soft, shapeAt(s.p + dir * spread * 0.5) + w * 0.5);
    float h2 = depth * smoothstep(soft, -soft, shapeAt(s.p + dir * spread) + w * 0.5);
    drop = smoothstep(0.0, 0.5, (h1 - hC) / ad) * 0.55 + smoothstep(0.0, 0.5, (h2 - hC) / ad) * 0.45;
  }
  float shade = clamp(edge + drop, 0.0, 1.0) * P_shadow;

  vec2 q = s.p * (1.0 - depth * 0.05 * s.cov);
  vec3 paper = C_paper.rgb * (1.0 + m_paper(q) * P_grain * 0.08);
  vec3 col = clamp(paper * (1.0 - shade) + hi, 0.0, 1.0);
  return vec4(col, C_paper.a * (surround ? 1.0 : s.cov));
}
`
};
