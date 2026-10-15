export default {
  id: 'heatmap',
  name: 'Heatmap',
  kind: 'shape',
  group: 'heat',
  source: 'paper',
  animated: true,
  outside: true,
  normals: false,
  surface: 0.04,
  params: [
    {
      name: 'colors',
      label: 'Colors',
      type: 'colorArray',
      default: ['#11206a', '#1f3ba2', '#2f63e7', '#6bd7ff', '#ffe679', '#ff991e', '#ff4c00'],
      minItems: 2,
      maxItems: 10
    },
    { name: 'base', label: 'Base color', type: 'color', default: '#000000' },
    { name: 'innerGlow', label: 'Inner glow', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { name: 'outerGlow', label: 'Outer glow', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { name: 'contour', label: 'Contour', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { name: 'angle', label: 'Angle', type: 'number', min: 0, max: 360, step: 1, default: 0 },
    { name: 'noise', label: 'Grain', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { name: 'speed', label: 'Speed', type: 'number', min: 0, max: 3, step: 0.01, default: 1 }
  ],
  glsl: `
const float m_box = 1.6;

float m_sst(float a, float b, float x) {
  float t = clamp((x - a) / (b - a), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

float m_lst(float a, float b, float x) {
  return clamp((x - a) / (b - a), 0.0, 1.0);
}

float m_circle(vec2 uv, vec2 c, vec2 r) {
  return 1.0 - m_sst(r.x, r.y, length(uv - c));
}

float m_cdf(float x) {
  float y = x * 0.70710678;
  float y2 = y * y;
  float e = sqrt(1.0 - exp(-y2 * (1.27323954 + 0.147 * y2) / (1.0 + 0.147 * y2)));
  return 0.5 + 0.5 * sign(y) * e;
}

float m_shadow(vec2 uv, float t, float contour) {
  vec2 su = uv;
  float posY = mix(-1.0, 2.0, t);
  su.y -= 0.5;
  float grow = m_sst(0.0, 0.8, posY) * m_lst(1.4, 0.9, posY);
  su *= vec2(1.0, 1.0 + 1.5 * grow);
  su.y += 0.5;
  float outerR = 1.0 - 0.3 * (m_sst(0.1, 0.2, t) * (1.0 - m_sst(0.2, 0.5, t)));
  float s = m_circle(su, vec2(0.5, posY - 0.2), vec2(0.4, outerR));
  s = pow(s, 1.4) * 1.2;
  float pos = posY - uv.y;
  float flat_ = m_lst(-0.4, 0.0, pos) * (1.0 - m_sst(0.0, 1.2, pos));
  flat_ = pow(flat_, 3.0);
  s = mix(flat_, s, 1.0 - m_sst(0.0, 0.3, pos));
  float ang = -2.0 - t * TAU;
  float right = m_circle(uv, vec2(0.95 - 0.2 * cos(ang), 0.4 - 0.1 * sin(ang)), vec2(0.15, 0.3));
  s = mix(s, 0.0, right * m_sst(0.6, 0.7, t) * (1.0 - m_sst(0.8, 0.9, t)));
  float top = m_circle(uv, vec2(0.5, 0.19), vec2(0.05, 0.25));
  top += 2.0 * contour * m_circle(uv, vec2(0.5, 0.19), vec2(0.2, 0.5));
  top *= 0.55 * m_sst(0.2, 0.3, t) * (1.0 - m_sst(0.3, 0.45, t));
  s = mix(s, 0.0, top);
  float leaf = m_circle(uv, vec2(0.53, 0.13), vec2(0.08, 0.19));
  leaf = mix(leaf, 0.0, 1.0 - m_sst(0.4, 0.54, uv.x));
  leaf = mix(0.0, leaf, m_sst(0.0, 0.2, uv.y));
  leaf *= m_sst(0.5, 1.1, posY) * m_sst(1.5, 1.3, posY);
  s += leaf;
  float bottom = m_sst(0.0, 0.4, t) * (1.0 - m_sst(0.6, 0.8, t));
  s = mix(s, 0.0, bottom * m_circle(uv, vec2(0.52, 0.92), vec2(0.09, 0.25)));
  float drift = m_sst(0.0, 0.6, t) * (1.0 - m_sst(0.6, 1.0, t));
  s = mix(s, 0.5, m_circle(uv, vec2(0.0, 1.2 - 0.5 * drift), vec2(0.1, 0.3)));
  s = mix(s, 0.0, m_circle(uv, vec2(1.0, 0.5 + 0.5 * drift), vec2(0.1, 0.3)));
  float rise = m_sst(0.3, 0.4, t);
  s = mix(s, 1.0, m_circle(uv, vec2(0.95, 0.2 + 0.2 * rise * m_sst(0.7, 0.5, t)), vec2(0.07, 0.22)));
  s = mix(s, 1.0, m_circle(uv, vec2(0.95, 0.2 + 0.2 * rise * (1.0 - m_sst(0.5, 0.7, t))), vec2(0.07, 0.22)));
  s /= max(1e-4, m_sst(1.0, 0.85, uv.y));
  return min(s, 1.0);
}

float m_hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec4 material(Surface s) {
  vec2 tex = s.p / (1.75 * m_box) + 0.5;
  float t = 0.1 * s.time * P_speed - 0.3;
  float t1 = fract(t);
  float t2 = fract(t + 1.0 / 3.0);
  float t3 = fract(t + 2.0 / 3.0);
  float a = -P_angle * PI / 180.0;
  vec2 c = tex - 0.5;
  vec2 au = vec2(c.x * cos(a) - c.y * sin(a), c.x * sin(a) + c.y * cos(a)) + 0.5;

  float shape = clamp(0.5 + s.d / (0.011 * m_box), 0.0, 1.0);
  float sigma = 0.15 * m_box;
  float r = sigma * 0.65;
  float soft = sigma * 0.9;
  float big = m_cdf(s.d / soft) * 0.2;
  big += m_cdf(shapeAt(s.p + vec2(r, 0.0)) / soft) * 0.2;
  big += m_cdf(shapeAt(s.p - vec2(r, 0.0)) / soft) * 0.2;
  big += m_cdf(shapeAt(s.p + vec2(0.0, r)) / soft) * 0.2;
  big += m_cdf(shapeAt(s.p - vec2(0.0, r)) / soft) * 0.2;
  float small = m_cdf(s.d / (0.0185 * m_box));
  float outerBlur = shape * (1.0 - big);
  float innerBlur = (1.0 - shape) * big;
  float contour = (1.0 - shape) * small;

  float inner = 0.8 + 0.8 * innerBlur;
  inner = mix(inner, 0.0, m_shadow(au, t1, innerBlur));
  inner = mix(inner, 0.0, m_shadow(au, t2, innerBlur));
  inner = mix(inner, 0.0, m_shadow(au, t3, innerBlur));
  inner *= 2.0 * P_innerGlow;
  inner += P_contour * 2.0 * contour;
  inner = min(1.0, inner) * (1.0 - shape);

  float band = fract(t1 * 3.0 - 0.1);
  float outer = 0.9 * pow(outerBlur, 0.8);
  float y = fract(au.y - band);
  outer *= 0.5 + m_sst(0.3, 0.65, y) * (1.0 - m_sst(0.65, 1.0, y));
  outer *= 5.0 * P_outerGlow * P_outerGlow;

  inner = pow(inner, 1.2);
  float heat = clamp(inner + outer, 0.0, 1.0);
  heat += (0.005 + 0.35 * P_noise) * (m_hash(s.frag * 0.01) - 0.5);

  float n = N_colors;
  float mixer = heat * n;
  vec4 g = C_colors(0);
  g.rgb *= g.a;
  float fade = clamp(mixer, 0.0, 1.0);
  for (int i = 2; i <= 10; i++) {
    if (float(i) > n) break;
    float m = clamp(mixer - float(i - 1), 0.0, 1.0);
    vec4 k = C_colors(i - 1);
    k.rgb *= k.a;
    g = mix(g, k, m);
  }
  vec3 col = g.rgb * fade;
  float alpha = g.a * fade;
  float back = C_base.a * s.cov;
  col += C_base.rgb * back * (1.0 - alpha);
  alpha += back * (1.0 - alpha);
  col += 0.02 * alpha * (m_hash(s.frag * 0.01 + 1.0) - 0.5);
  if (alpha < 1e-4) return vec4(0.0);
  return vec4(col / alpha, alpha);
}
`
};
