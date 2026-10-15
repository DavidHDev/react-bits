export default {
  id: 'irradiance',
  name: 'Irradiance',
  kind: 'shape',
  group: 'light',
  source: 'shaders.com',
  animated: true,
  heavy: true,
  outside: true,
  surface: 'bevel',
  params: [
    { name: 'lightA', label: 'Light', type: 'color', default: '#8fb0ff' },
    { name: 'lightB', label: 'Second light', type: 'color', default: '#ffb347' },
    { name: 'angle', label: 'Light angle', type: 'number', min: 0, max: 360, step: 1, default: 315 },
    { name: 'distance', label: 'Light distance', type: 'number', min: 0.5, max: 2, step: 0.01, default: 1.15 },
    { name: 'intensity', label: 'Intensity', type: 'number', min: 0, max: 8, step: 0.01, default: 3 },
    { name: 'reach', label: 'Spill', type: 'number', min: 0.03, max: 0.6, step: 0.01, default: 0.13 },
    { name: 'core', label: 'Rim', type: 'number', min: 0, max: 2, step: 0.01, default: 1 },
    { name: 'shadows', label: 'Shadows', type: 'boolean', default: true },
    { name: 'body', label: 'Body', type: 'color', default: '#2e2e2e' },
    { name: 'bevel', label: 'Bevel', type: 'number', min: 0.005, max: 0.3, step: 0.001, default: 0.03 },
    { name: 'speed', label: 'Orbit speed', type: 'number', min: 0, max: 2, step: 0.01, default: 0.15 }
  ],
  glsl: `
const float m_RANGE = 2.4;
const float m_HEIGHT = 1.0;
const float m_WRAP = 0.1;
const float m_CW = 1.0;

float m_invSq(float dist) {
  float r = dist / m_RANGE;
  return 1.0 / (1.0 + r * r);
}

float m_facing(vec2 n, vec2 from, vec2 light) {
  vec2 toL = light - from;
  float dist = length(toL);
  float f = clamp((dot(n, toL / max(dist, 1e-4)) + m_WRAP) / (1.0 + m_WRAP), 0.0, 1.0);
  return f * m_invSq(dist);
}

float m_visible(vec2 from, vec2 light, float eps) {
  vec2 seg = light - from;
  float len = length(seg);
  vec2 dir = seg / max(len, 1e-4);
  float vis = 1.0;
  float t = eps * 2.0;
  for (int k = 0; k < 8; k++) {
    if (t >= len) break;
    vec2 q = from + dir * t;
    float dd = shapeAt(q);
    vis = min(vis, clamp(dd / max(t * 0.4, eps), 0.0, 1.0));
    if (vis <= 0.0 || (dot(q, q) > 1.44 && dot(q, dir) > 0.0)) break;
    t += max(dd, eps);
  }
  return vis;
}

vec3 m_tone(vec3 c) {
  return 1.0 - exp(-c);
}

vec4 material(Surface s) {
  float reach = P_reach;
  if (s.d > reach) return vec4(0.0);

  float a = radians(P_angle) + s.time * P_speed;
  vec2 l0 = vec2(cos(a), sin(a)) * P_distance;
  vec2 l1 = -l0;
  vec3 c0 = toLinear(C_lightA.rgb) * P_intensity;
  vec3 c1 = toLinear(C_lightB.rgb) * P_intensity;
  vec3 bodyC = toLinear(C_body.rgb);

  vec3 body = vec3(0.0);
  if (s.cov > 0.0) {
    float rimT = clamp(-s.d / max(P_bevel, 0.003), 0.0, 1.0);
    float sb = min(1.0 - rimT, 0.9995) * smoothstep(0.15, 0.85, s.slope);
    vec3 n = vec3(s.n * sb, sqrt(1.0 - sb * sb));
    vec3 lit = vec3(0.0);
    for (int i = 0; i < 2; i++) {
      vec2 lp = i == 0 ? l0 : l1;
      vec3 lc = i == 0 ? c0 : c1;
      vec2 delta = lp - s.p;
      vec3 L = normalize(vec3(delta, m_HEIGHT));
      float bodyLit = m_invSq(length(delta)) * 0.6;
      vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
      float glint = pow(max(dot(n, H), 0.0), 60.0) * 0.6;
      lit += bodyC * max(dot(n, L), 0.0) * bodyLit + lc * glint * bodyLit;
    }
    body = m_tone(bodyC * 0.3 + lit);
  }

  vec4 glow = vec4(0.0);
  if (s.cov < 1.0) {
    float eps = max(s.px * 1.5, 0.003);
    float lift = max(eps * 2.0 - s.d, 0.0);
    vec2 o = s.p + s.n * lift;
    float d0 = s.d + lift;
    float base = s.slope > 1e-4 ? atan(-s.n.y, -s.n.x) : 0.0;
    float acc0 = 0.0;
    float acc1 = 0.0;
    for (int i = 0; i < 4; i++) {
      float ang = base + (float(i) + 0.5) * TAU / 4.0;
      vec2 dir = vec2(cos(ang), sin(ang));
      float d1 = shapeAt(o + dir * d0);
      float t2 = d0 + max(d1, eps);
      float d2 = shapeAt(o + dir * t2);
      float best = min(d1 / (d0 * m_CW), d2 / (t2 * m_CW));
      float cover = (0.99 - clamp(best, 0.0, 1.0)) / 0.99;
      if (cover > 0.0) {
        vec2 pos = o + dir * t2;
        float gx = shapeAt(pos + vec2(eps, 0.0)) - d2;
        float gy = shapeAt(pos + vec2(0.0, eps)) - d2;
        vec2 hn = normalize(vec2(gx, gy + 1e-6));
        vec2 hit = pos - hn * d2;
        acc0 += cover * m_facing(hn, hit, l0);
        acc1 += cover * m_facing(hn, hit, l1);
      }
    }
    float w = max(0.01, s.px * 1.5);
    float rim = (1.0 - smoothstep(0.0, w, max(s.d, 0.0))) * P_core;
    vec2 ep = s.p - s.n * max(s.d, 0.0);
    float fade = 1.0 - smoothstep(reach * 0.25, reach, max(s.d, 0.0));
    float e0 = acc0 / 4.0 * fade + m_facing(s.n, ep, l0) * rim;
    float e1 = acc1 / 4.0 * fade + m_facing(s.n, ep, l1) * rim;
    if (P_shadows > 0.5) {
      if (e0 > 0.0) e0 *= m_visible(o, l0, eps);
      if (e1 > 0.0) e1 *= m_visible(o, l1, eps);
    }
    vec3 g = m_tone(c0 * e0 + c1 * e1);
    float ga = clamp(max(g.r, max(g.g, g.b)), 0.0, 1.0);
    glow = vec4(g / max(ga, 1e-4), ga);
  }

  vec3 rgb = mix(glow.rgb, body, s.cov);
  float alpha = mix(glow.a, 1.0, s.cov);
  vec3 shown = toDisplay(clamp(rgb * alpha, 0.0, 1.0));
  float outA = max(alpha, max(shown.r, max(shown.g, shown.b)));
  return vec4(shown / max(outA, 1e-4), outA);
}
`
};
