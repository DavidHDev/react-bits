export default {
  id: 'particles',
  name: 'Dust',
  kind: 'shape',
  group: 'volume',
  source: 'shaders.com',
  animated: true,
  outside: true,
  surface: 0.05,
  params: [
    { name: 'rest', label: 'Color', type: 'color', default: '#8ec5ff' },
    { name: 'excited', label: 'Excited', type: 'color', default: '#ff7ad9' },
    { name: 'density', label: 'Density', type: 'number', min: 0.25, max: 4, step: 0.01, default: 1.4 },
    { name: 'size', label: 'Size', type: 'number', min: 0.002, max: 0.02, step: 0.0005, default: 0.0075 },
    {
      name: 'shape',
      label: 'Shape',
      type: 'select',
      options: [
        { value: 0, label: 'Dot' },
        { value: 1, label: 'Square' },
        { value: 2, label: 'Glow' }
      ],
      default: 0
    },
    { name: 'softness', label: 'Softness', type: 'number', min: 0, max: 1, step: 0.01, default: 0.1 },
    { name: 'exposure', label: 'Exposure', type: 'number', min: 0.2, max: 3, step: 0.01, default: 1 },
    { name: 'depth', label: 'Depth', type: 'number', min: 0, max: 0.8, step: 0.01, default: 0.25 },
    { name: 'agitation', label: 'Agitation', type: 'number', min: 0, max: 1, step: 0.01, default: 0.12 },
    { name: 'stir', label: 'Stir', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { name: 'speed', label: 'Speed', type: 'number', min: 0, max: 3, step: 0.01, default: 1 }
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

vec4 m_rand(uvec3 v) {
  uint a = m_hash(v);
  uint b = m_hash(uvec3(a, v.y ^ 0x9e3779b9u, v.z + 17u));
  return vec4(float(a & 65535u), float(a >> 16u), float(b & 65535u), float(b >> 16u)) / 65535.0;
}

vec3 m_toLab(vec3 c) {
  vec3 lms = vec3(
    dot(c, vec3(0.4122214708, 0.5363325363, 0.0514459929)),
    dot(c, vec3(0.2119034982, 0.6806995451, 0.1073969566)),
    dot(c, vec3(0.0883024619, 0.2817188376, 0.6299787005))
  );
  lms = pow(max(lms, 0.0), vec3(1.0 / 3.0));
  return vec3(
    dot(lms, vec3(0.2104542553, 0.793617785, -0.0040720468)),
    dot(lms, vec3(1.9779984951, -2.428592205, 0.4505937099)),
    dot(lms, vec3(0.0259040371, 0.7827717662, -0.808675766))
  );
}

vec3 m_fromLab(vec3 l) {
  vec3 lms = vec3(
    l.x + 0.3963377774 * l.y + 0.2158037573 * l.z,
    l.x - 0.1055613458 * l.y - 0.0638541728 * l.z,
    l.x - 0.0894841775 * l.y - 1.291485548 * l.z
  );
  lms = lms * lms * lms;
  return vec3(
    dot(lms, vec3(4.0767416621, -3.3077115913, 0.2309699292)),
    dot(lms, vec3(-1.2684380046, 2.6097574011, -0.3413193965)),
    dot(lms, vec3(-0.0041960863, -0.7034186147, 1.707614701))
  );
}

vec4 material(Surface s) {
  float h = 0.034 / sqrt(max(P_density, 0.05));
  float r0 = min(P_size, h * 0.6);
  if (s.d > r0 * 1.6 + s.px * 2.0) return vec4(0.0);
  float t = s.time * P_speed;
  float soft = P_shape > 1.5 ? 1.0 : P_softness;
  float aa = s.px * 0.75;
  vec2 grad = s.n * s.slope;
  float budget = max(0.0, 0.98 - r0 * 1.35 / h);
  float jitter = min(0.3, budget * 0.4);
  float wob = min(P_agitation * 1.2, budget * 0.25);
  float push = min(0.45, budget * 0.4) * P_stir;
  vec2 stir = vec2(sin(t * 0.37) + 0.35 * sin(t * 0.83 + 1.3), 0.8 * cos(t * 0.29 + 0.6) + 0.3 * sin(t * 0.61)) * 0.45;
  float stirR = 0.22;
  float energy = 0.0;
  float excite = 0.0;
  for (int k = 0; k < 4; k++) {
    float fk = float(k);
    mat2 R = rot2(fk * 1.7 + 0.4);
    vec2 shift = vec2(fk * 0.37, fk * 0.71);
    vec2 q = R * s.p / h + shift;
    vec2 sg = R * stir / h + shift;
    vec2 cell = floor(q);
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 c = cell + vec2(float(i), float(j));
        uvec3 key = uvec3(uvec2(ivec2(c)), uint(k));
        vec4 a = m_rand(key);
        vec4 b = m_rand(key + uvec3(0u, 0u, 8u));
        vec2 home = c + 0.5 + (a.xy - 0.5) * 2.0 * jitter;
        float ph = b.x * TAU;
        float fr = (0.7 + b.y * 0.9) * (0.6 + P_agitation * 2.5);
        vec2 pg = home + vec2(sin(t * fr * 2.3 + ph), cos(t * fr * 1.9 + ph * 1.7)) * wob;
        vec2 toS = pg - sg;
        float ds = length(toS) * h / stirR;
        float fall = exp(-ds * ds) * P_stir;
        pg += toS / max(length(toS), 1e-4) * push * exp(-ds * ds);
        vec2 off = ((pg - q) * R) * h;
        float dc = s.d + dot(grad, off);
        float tk = clamp(-dc / max(P_depth, 1e-3), 0.0, 1.0);
        float th = P_depth < 1e-3 ? step(dc, 0.0) : sqrt(max(1.0 - (1.0 - tk) * (1.0 - tk), 0.0));
        float keep = step(a.z, th) * step(dc, 0.0) * (1.0 - P_stir * (1.0 - smoothstep(0.25, 0.85, ds)));
        if (keep <= 0.0) continue;
        float rad = r0 * (0.65 + 0.7 * a.w);
        float dist = length(off);
        float sd = P_shape > 0.5 && P_shape < 1.5 ? max(abs(off.x), abs(off.y)) - rad * 0.9 : dist - rad;
        float hard = clamp(0.5 - sd / (aa * 2.0), 0.0, 1.0);
        float qq = dist * dist / (rad * rad);
        float w = mix(hard, exp(-2.5 * qq), soft);
        float bright = (0.7 + 0.6 * a.w) * keep;
        energy += w * bright;
        excite += w * bright * clamp(fall * 1.4 + smoothstep(0.45, 1.0, P_agitation) * b.z * 0.9, 0.0, 1.0);
      }
    }
  }
  if (energy <= 1e-5) return vec4(0.0);
  float alpha = 1.0 - exp(-1.6 * energy * P_exposure);
  vec3 la = m_toLab(toLinear(C_rest.rgb));
  vec3 lb = m_toLab(toLinear(C_excited.rgb));
  vec3 col = toDisplay(m_fromLab(mix(la, lb, clamp(excite / energy, 0.0, 1.0))));
  return vec4(col, alpha * C_rest.a);
}
`
};
