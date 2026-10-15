export default {
  id: 'swirl',
  name: 'Swirl',
  kind: 'fill',
  group: 'pattern',
  source: 'shaders.com',
  animated: true,
  params: [
    { name: 'colors', label: 'Colors', type: 'colorArray', default: ['#1275d8', '#e19136'], minItems: 2, maxItems: 6 },
    { name: 'blend', label: 'Blend', type: 'number', min: 0, max: 100, step: 1, default: 50 },
    { name: 'detail', label: 'Detail', type: 'number', min: 0.2, max: 5, step: 0.1, default: 1 },
    { name: 'scale', label: 'Scale', type: 'number', min: 0.25, max: 4, step: 0.05, default: 1 },
    { name: 'speed', label: 'Speed', type: 'number', min: 0, max: 5, step: 0.1, default: 1 }
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

float m_flow(vec2 uv, float detail, float t) {
  float f1 = detail;
  vec2 d1 = vec2(
    uv.x + (sin(uv.y * (f1 * 1.7) + t * 0.8) * 0.12 + cos(uv.x * (f1 * 0.9) - t * 0.5) * 0.05),
    uv.y + (cos(uv.x * (f1 * 1.3) - t * 0.6) * 0.12 + sin(uv.y * (f1 * 1.1) + t * 0.7) * 0.05)
  );
  float p1 = sin(d1.x * (f1 * 2.1) + d1.y * (f1 * 1.8) + t * 0.4);
  float f2 = detail * 2.1;
  vec2 d2 = vec2(
    d1.x + (cos(d1.y * (f2 * 2.7) - t * 0.45) * 0.07 + sin(d1.x * (f2 * 1.9) + t * 0.6) * 0.04),
    d1.y + (sin(d1.x * (f2 * 2.3) + t * 0.65) * 0.07 + cos(d1.y * (f2 * 1.6) - t * 0.4) * 0.04)
  );
  float p2 = cos(d2.x * (f2 * 1.4) - d2.y * (f2 * 1.9) + t * 0.35);
  float f3 = detail * 3.7;
  vec2 d3 = vec2(
    d2.x + (sin(d2.y * (f3 * 1.8) + t * 0.85) * 0.04 + cos(d2.x * (f3 * 1.3) - t * 0.55) * 0.025 + sin((d2.x + d2.y) * (f3 * 0.7) + t * 0.9) * 0.02),
    d2.y + (cos(d2.x * (f3 * 1.6) - t * 0.75) * 0.04 + sin(d2.y * (f3 * 1.1) + t * 0.5) * 0.025 + cos((d2.x + d2.y) * (f3 * 0.8) - t * 0.95) * 0.02)
  );
  float p3 = sin(d3.x * (f3 * 1.1) + d3.y * (f3 * 1.5) - t * 0.55);
  return p1 * 0.45 + p2 * 0.35 + p3 * 0.2;
}

vec4 fill(vec2 p, float time) {
  vec2 uv = 0.5 + p * 0.82 / max(P_scale, 0.05);
  float t = time * P_speed;
  float pattern = m_flow(uv, P_detail, t);
  float k = smoothstep(0.3, 0.7, pattern * 0.5 + 0.5 + (P_blend - 50.0) * 0.006);
  vec4 c = m_ramp(k) * (sin(t * 2.5 + pattern * 8.0) * 0.015 + 1.0);
  return vec4(m_srgb(clamp(c.rgb, 0.0, 1.0)), clamp(c.a, 0.0, 1.0));
}
`
};
