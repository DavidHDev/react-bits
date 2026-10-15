export default {
  id: 'glass',
  name: 'Glass',
  kind: 'shape',
  group: 'glass',
  source: 'shaders.com',
  animated: false,
  outside: false,
  surface: 'bevel',
  params: [
    { name: 'tint', label: 'Tint', type: 'color', default: '#ffffff' },
    {
      name: 'backdrop',
      label: 'Backdrop',
      type: 'select',
      options: [
        { value: 0, label: 'Artboard' },
        { value: 1, label: 'Studio' },
        { value: 2, label: 'Checker' }
      ],
      default: 0
    },
    { name: 'bevel', label: 'Bevel', type: 'number', min: 0.04, max: 0.7, step: 0.01, default: 0.28 },
    { name: 'refraction', label: 'Refraction', type: 'number', min: 0, max: 2, step: 0.01, default: 1 },
    { name: 'dispersion', label: 'Dispersion', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { name: 'blur', label: 'Blur', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { name: 'edge', label: 'Edge light', type: 'number', min: 0, max: 1, step: 0.01, default: 0.7 },
    { name: 'highlight', label: 'Highlight', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { name: 'angle', label: 'Light angle', type: 'number', min: 0, max: 360, step: 1, default: 300 }
  ],
  glsl: `
float m_check(vec2 q, float w) {
  vec2 p = q / 0.125;
  vec2 f = vec2(w / 0.125 + 1e-3);
  vec2 i = 2.0 * (abs(fract((p - 0.5 * f) * 0.5) - 0.5) - abs(fract((p + 0.5 * f) * 0.5) - 0.5)) / f;
  return 0.5 - 0.5 * i.x * i.y;
}

float m_lobe(vec2 v, vec2 c, float r, float w) {
  return 1.0 - smoothstep(r * 0.2 - w, r + w, length(v - c));
}

vec3 m_studio(vec2 v, vec2 l, float w) {
  vec2 side = vec2(-l.y, l.x);
  float up = -dot(v, vec2(0.0, 1.0));
  vec3 c = vec3(0.3 + 0.25 * smoothstep(-0.3, 1.0, up));
  c *= 1.0 - 0.7 * m_lobe(v, -l * 0.7, 0.34, w + 0.15);
  c += vec3(1.5) * m_lobe(v, l * 0.62, 0.3, w);
  c += vec3(0.55) * m_lobe(v, side * 0.72 - l * 0.1, 0.24, w);
  c += vec3(0.3) * m_lobe(v, -side * 0.66 - l * 0.35, 0.28, w);
  return c;
}

vec4 m_behind(vec2 q, vec2 v, vec2 l, float w) {
  if (P_backdrop > 1.5) {
    return vec4(toLinear(vec3(mix(0.8, 0.6, m_check(q, w)))), 1.0);
  }
  float open = smoothstep(0.04, 0.6, length(v)) * 0.55;
  vec4 st = vec4(m_studio(v, l, w * 2.0) * open, open);
  if (P_backdrop > 0.5) return st;
  vec4 b = backdropAt(q);
  return vec4(toLinear(b.rgb) * b.a, b.a) + st * (1.0 - b.a);
}

vec4 material(Surface s) {
  float bw = max(P_bevel, 1e-3);
  vec2 g = s.n * min(s.slope, 1.0);
  float depth = clamp(-s.d / bw, 0.0, 1.0);
  float strength = (1.0 - depth) * (1.0 - depth);
  vec2 off = -g * 0.3 * P_refraction * strength;
  vec2 q = s.p + off;
  vec2 fq = fwidth(q);
  if (s.d > 0.02) return vec4(0.0);

  float a = radians(P_angle);
  vec2 l = vec2(cos(a), sin(a));
  float w = max(max(fq.x, fq.y), s.px) + P_blur * 0.15;
  vec2 chr = off * P_dispersion * 0.06;
  vec2 v = off / 0.3;
  vec2 cv = v * P_dispersion * 0.08;
  vec4 tR = m_behind(q + chr, v + cv, l, w);
  vec4 tG = m_behind(q, v, l, w);
  vec4 tB = m_behind(q - chr, v - cv, l, w);
  vec4 t = vec4(tR.r, tG.g, tB.b, tG.a);
  vec3 tint = toLinear(C_tint.rgb);
  t.rgb *= tint;
  float veilA = 0.05;
  t += vec4(tint * 0.45 * veilA, veilA) * (1.0 - t.a);

  vec3 N = domeNormal(s, bw);
  vec2 R = 2.0 * N.z * N.xy;
  float graze = 1.0 - N.z;
  float F = clamp(0.04 + 0.96 * graze * graze, 0.0, 1.0) * P_edge;
  vec3 E = m_studio(R, l, 0.0);
  vec4 col = vec4(E * F, F) + t * (1.0 - F);

  vec3 n3 = normalize(vec3(g, 2.0));
  vec3 h = vec3(l, 2.0) * 0.4472136;
  vec3 hk = normalize(normalize(vec3(l * 0.75, 0.66)) + vec3(0.0, 0.0, 1.0));
  float base = pow(hk.z, 48.0);
  float lobe = max(pow(max(dot(N, hk), 0.0), 48.0) - base, 0.0) / (1.0 - base);
  float spec = (pow(clamp(dot(n3, h), 0.0, 1.0), 22.6) * strength * 0.5 + lobe) * P_highlight;
  float fd = clamp(-s.d / 0.04, 0.0, 1.0);
  float rim = (1.0 - fd) * (1.0 - fd) * P_edge * 0.5;
  float facing = clamp(dot(g, l) * 0.5 + 0.5, 0.0, 1.0);
  float line = (1.0 - smoothstep(s.px * 0.5, s.px * 2.0, -s.d)) * (0.3 + 0.7 * facing) * P_edge;
  float light = spec + rim + line;
  col += vec4(vec3(light), light);
  col.a = clamp(col.a, 0.0, 1.0);
  return vec4(toDisplay(col.rgb / max(col.a, 1e-4)), col.a);
}
`
};
