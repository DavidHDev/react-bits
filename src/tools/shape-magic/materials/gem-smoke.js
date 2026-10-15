export default {
  id: 'gem-smoke',
  name: 'Gem smoke',
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
      label: 'Smoke',
      type: 'colorArray',
      default: ['#333333', '#e7e6df'],
      minItems: 1,
      maxItems: 6
    },
    { name: 'inner', label: 'Inner color', type: 'color', default: '#fafaf5' },
    { name: 'innerGlow', label: 'Inner smoke', type: 'number', min: 0, max: 1, step: 0.01, default: 1 },
    { name: 'outerGlow', label: 'Outer smoke', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { name: 'innerDistortion', label: 'Inner swirl', type: 'number', min: 0, max: 1, step: 0.01, default: 0.8 },
    { name: 'outerDistortion', label: 'Outer swirl', type: 'number', min: 0, max: 1, step: 0.01, default: 0.6 },
    { name: 'offset', label: 'Offset', type: 'number', min: -1, max: 1, step: 0.01, default: 0 },
    { name: 'angle', label: 'Angle', type: 'number', min: 0, max: 360, step: 1, default: 0 },
    { name: 'size', label: 'Size', type: 'number', min: 0, max: 1, step: 0.01, default: 0.8 },
    { name: 'speed', label: 'Speed', type: 'number', min: 0, max: 3, step: 0.01, default: 1 }
  ],
  glsl: `
const float m_box = 1.8;
const float m_ramp = 0.19;
const float m_refPx = 0.005;

vec4 material(Surface s) {
  float time = s.time * P_speed;
  vec2 obj = vec2(s.p.x, -s.p.y) / m_box;
  float roundness = pow(smoothstep(0.0, m_ramp, -s.d), 0.25);
  float alphaIn = s.cov;

  vec2 suv = rot2(P_angle * PI / 180.0) * obj;
  suv *= mix(4.0, 1.0, P_size);
  vec2 iuv = suv;
  vec2 ouv = suv;
  iuv.y += P_innerDistortion * (1.0 - smoothstep(0.0, 1.0, length(0.4 * iuv)));
  iuv.y -= 0.4 * P_innerDistortion;
  iuv.y += 0.7 * P_offset * roundness;
  ouv.y += P_outerDistortion * (1.0 - smoothstep(0.0, 1.0, length(0.4 * ouv)));
  ouv.y -= 0.4 * P_outerDistortion;

  float swirlIn = P_innerDistortion * roundness;
  float swirlOut = P_outerDistortion;
  float k = m_refPx / s.px;
  for (int i = 1; i < 5; i++) {
    float fi = float(i);
    float stretchIn = max(length(dFdx(iuv)), length(dFdy(iuv))) * k;
    float sIn = swirlIn / (1.0 + stretchIn * 8.0);
    iuv.x += sIn / fi * cos(time + fi * 2.9 * iuv.y);
    iuv.y += sIn / fi * cos(time + fi * 1.5 * iuv.x);
    float stretchOut = max(length(dFdx(ouv)), length(dFdy(ouv))) * k;
    float sOut = swirlOut / (1.0 + stretchOut * 8.0);
    ouv.x += sOut / fi * cos(time + fi * 2.9 * ouv.y);
    ouv.y += sOut / fi * cos(time + fi * 1.5 * ouv.x);
  }

  float innerShape = exp(-1.5 * dot(iuv, iuv)) * (0.01 + 0.99 * P_innerGlow) * alphaIn;
  float outerShape = exp(-1.5 * dot(ouv, ouv)) * P_outerGlow * P_outerGlow * (1.0 - alphaIn);

  float n = N_colors;
  float mixer = (innerShape + outerShape) * n;
  vec4 g = C_colors(0);
  g.rgb *= g.a;
  float mask = smoothstep(0.0, 1.0, clamp(mixer, 0.0, 1.0));
  for (int i = 2; i <= 6; i++) {
    if (float(i) > n) break;
    float m = smoothstep(0.0, 1.0, clamp(mixer - float(i - 1), 0.0, 1.0));
    vec4 c = C_colors(i - 1);
    c.rgb *= c.a;
    g = mix(g, c, m);
  }
  vec3 col = g.rgb * mask;
  float alpha = g.a * mask;
  float innerA = C_inner.a * alphaIn;
  col += C_inner.rgb * innerA * (1.0 - alpha);
  alpha += innerA * (1.0 - alpha);
  if (alpha < 1e-4) return vec4(0.0);
  return vec4(col / alpha, alpha);
}
`
};
