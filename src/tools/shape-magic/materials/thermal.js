export default {
  id: 'thermal',
  name: 'Thermal',
  kind: 'shape',
  group: 'heat',
  source: 'shaders.com',
  animated: true,
  outside: true,
  normals: false,
  surface: 0.04,
  params: [
    {
      name: 'colors',
      label: 'Colors',
      type: 'colorArray',
      default: ['#02010e', '#260c84', '#972a96', '#d86b3c', '#f5e374', '#ffffff'],
      minItems: 2,
      maxItems: 8
    },
    { name: 'innerGlow', label: 'Inner glow', type: 'number', min: 0, max: 1, step: 0.01, default: 0.4 },
    { name: 'outerGlow', label: 'Outer glow', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { name: 'contour', label: 'Contour', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { name: 'angle', label: 'Angle', type: 'number', min: 0, max: 360, step: 1, default: 90 },
    { name: 'speed', label: 'Speed', type: 'number', min: 0, max: 4, step: 0.01, default: 1 }
  ],
  glsl: `
float m_hash(vec2 p) {
  uvec2 u = floatBitsToUint(p * vec2(141421356.0, 2718281828.0));
  return float((u.x ^ u.y) * 3141592653u) / 4294967295.0;
}

float m_value(vec2 p) {
  vec2 i = floor(p);
  vec2 f = p - i;
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(m_hash(i), m_hash(i + vec2(1.0, 0.0)), f.x),
    mix(m_hash(i + vec2(0.0, 1.0)), m_hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float m_front(float a, float b, float tk, float phase) {
  float pos = mix(-0.6, 0.6, tk);
  float wob = m_value(vec2(b * 4.0 + phase * 13.7, tk * 3.0 + phase * 7.1)) - 0.5;
  float e = a - pos + wob * 0.12;
  float band = exp(-e * e / 0.0256);
  float gate = smoothstep(0.0, 0.15, tk) * (1.0 - smoothstep(0.85, 1.0, tk));
  return clamp(band * gate, 0.0, 1.0);
}

vec3 m_toLab(vec3 c) {
  float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
  float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
  float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;
  l = sign(l) * pow(abs(l), 1.0 / 3.0);
  m = sign(m) * pow(abs(m), 1.0 / 3.0);
  s = sign(s) * pow(abs(s), 1.0 / 3.0);
  return vec3(
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
  );
}

vec3 m_fromLab(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l;
  m = m * m * m;
  s = s * s * s;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  );
}

vec4 m_ramp(float t) {
  float n = max(N_colors, 1.0);
  vec4 c0 = C_colors(0);
  vec3 lab = m_toLab(toLinear(c0.rgb));
  float alpha = c0.a;
  for (int i = 1; i < 8; i++) {
    if (float(i) >= n) break;
    float a = float(i - 1) / (n - 1.0);
    float b = float(i) / (n - 1.0);
    float seg = clamp((t - a) / max(b - a, 1e-6), 0.0, 1.0);
    vec4 ci = C_colors(i);
    float wa = alpha * (1.0 - seg);
    float wb = ci.a * seg;
    lab = (lab * wa + m_toLab(toLinear(ci.rgb)) * wb) / max(wa + wb, 0.001);
    alpha = wa + wb;
  }
  return vec4(toDisplay(m_fromLab(lab)), alpha);
}

vec4 material(Surface s) {
  float t = s.time * P_speed;
  float depth = clamp(-s.d, 0.0, 0.7);
  float f = s.d > 0.0 ? s.d * 0.5 : -0.5 * sqrt(max(depth * (1.4 - depth), 0.0));
  float inside = s.cov;
  vec2 rel = s.p * 0.5;
  float ang = P_angle * PI / 180.0;
  vec2 along = vec2(cos(ang), sin(ang));
  vec2 across = vec2(-along.y, along.x);
  float a = dot(rel, along);
  float b = -dot(rel, across);
  float base = 0.1 * t - 0.3;

  float innerBlur = exp(-max(-f, 0.0) / 0.12);
  float inner = 0.8 + 0.8 * innerBlur;
  inner = mix(inner, 0.0, m_front(a, b, fract(base), 1.0));
  inner = mix(inner, 0.0, m_front(a, b, fract(base + 1.0 / 3.0), 2.0));
  inner = mix(inner, 0.0, m_front(a, b, fract(base + 2.0 / 3.0), 3.0));
  inner *= 2.0 * P_innerGlow;
  inner += P_contour * 2.0 * exp(-abs(f) / 0.03);
  inner = min(inner, 1.0) * inside;
  inner = pow(max(inner, 0.0), 1.2);

  float reach = 0.05 + 0.15 * P_outerGlow;
  float outerBlur = exp(-max(f, 0.0) / reach);
  if (s.d > 0.0) {
    float r = reach * 1.2;
    float k = 0.5 / reach;
    outerBlur += exp(-max(shapeAt(s.p + vec2(r, 0.0)), 0.0) * k);
    outerBlur += exp(-max(shapeAt(s.p - vec2(r, 0.0)), 0.0) * k);
    outerBlur += exp(-max(shapeAt(s.p + vec2(0.0, r)), 0.0) * k);
    outerBlur += exp(-max(shapeAt(s.p - vec2(0.0, r)), 0.0) * k);
    outerBlur *= 0.2;
  }
  vec2 edge = smoothstep(vec2(-0.06), vec2(0.1), s.uv) * (1.0 - smoothstep(vec2(0.9), vec2(1.06), s.uv));
  float sweep = fract(base * 3.0 - 0.1);
  float y = fract(a * 1.2 - sweep);
  float mask = 0.5 + smoothstep(0.3, 0.65, y) * (1.0 - smoothstep(0.65, 1.0, y));
  float outer = 0.9 * pow(outerBlur, 0.8) * mask * 5.0 * P_outerGlow * P_outerGlow * (1.0 - inside) * edge.x * edge.y;

  float heat = clamp(inner + outer, 0.0, 1.0);
  heat += 0.005 * (m_hash(s.frag * vec2(1.7, 1.3)) - 0.5);
  heat = clamp(heat, 0.0, 1.0);
  float cover = clamp(inside + outer, 0.0, 1.0);
  vec4 ramp = m_ramp(heat);
  return vec4(clamp(ramp.rgb, 0.0, 1.0), ramp.a * cover);
}
`
};
