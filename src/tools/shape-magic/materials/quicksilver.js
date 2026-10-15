export default {
  id: 'quicksilver',
  name: 'Quicksilver',
  kind: 'shape',
  group: 'metal',
  source: 'shaders.com',
  animated: true,
  outside: false,
  surface: 0.15,
  params: [
    { name: 'light', label: 'Light color', type: 'color', default: '#eef0f6' },
    { name: 'dark', label: 'Dark color', type: 'color', default: '#141414' },
    { name: 'bevel', label: 'Bevel', type: 'number', min: 0.02, max: 0.8, step: 0.01, default: 0.1 },
    { name: 'turbulence', label: 'Turbulence', type: 'number', min: 0, max: 1.5, step: 0.01, default: 1 },
    { name: 'ripple', label: 'Ripple scale', type: 'number', min: 0.5, max: 8, step: 0.01, default: 3 },
    { name: 'swirl', label: 'Swirl', type: 'number', min: 0, max: 1.5, step: 0.01, default: 1.5 },
    { name: 'sharpness', label: 'Sharpness', type: 'number', min: 0, max: 1, step: 0.01, default: 0.6 },
    { name: 'reflections', label: 'Reflections', type: 'number', min: 0, max: 2, step: 0.01, default: 1.5 },
    { name: 'dispersion', label: 'Dispersion', type: 'number', min: 0, max: 1, step: 0.01, default: 0.25 },
    { name: 'lightAngle', label: 'Light angle', type: 'number', min: 0, max: 360, step: 1, default: 265 },
    { name: 'speed', label: 'Speed', type: 'number', min: 0, max: 4, step: 0.01, default: 0.5 }
  ],
  glsl: `
float m_ss(float a, float b, float x) {
  float t = clamp((x - a) / (b - a), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

vec3 m_lin(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
}

vec3 m_srgb(vec3 c) {
  c = max(c, 0.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

vec2 m_hash22(vec2 p) {
  uvec2 u = floatBitsToUint(p * vec2(141421356.0, 2718281828.0));
  uint h = u.x ^ u.y;
  return vec2(uvec2(h) * uvec2(3141592653u, 1618033988u)) / 4294967295.0;
}

vec3 m_perlin(vec2 p) {
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
  vec2 ga = m_hash22(i) * 2.0 - 1.0;
  vec2 gb = m_hash22(i + vec2(1.0, 0.0)) * 2.0 - 1.0;
  vec2 gc = m_hash22(i + vec2(0.0, 1.0)) * 2.0 - 1.0;
  vec2 gd = m_hash22(i + vec2(1.0, 1.0)) * 2.0 - 1.0;
  float va = dot(ga, f);
  float vb = dot(gb, f - vec2(1.0, 0.0));
  float vc = dot(gc, f - vec2(0.0, 1.0));
  float vd = dot(gd, f - vec2(1.0, 1.0));
  float k = va - vb - vc + vd;
  float value = va + u.x * (vb - va) + u.y * (vc - va) + u.x * u.y * k;
  vec2 deriv = ga + (gb - ga) * u.x + (gc - ga) * u.y + (ga - gb - gc + gd) * (u.x * u.y) + du * (u.yx * k + vec2(vb, vc) - va);
  return vec3(value, deriv);
}

float m_width(Surface s, float bevel) {
  float depth = max(-s.d, 0.0);
  float k = bevel - depth;
  float w = bevel;
  if (k <= 0.0) return w;
  for (int i = 0; i < 4; i++) {
    float g = shapeAt(s.p - s.n * k) + depth + k;
    float c = smoothstep(0.0, 0.5 * k, g);
    if (c <= 0.0) break;
    w = mix(w, depth + k - 0.5 * g, c);
    k *= 0.5;
  }
  return min(bevel, w);
}

vec2 m_dome(Surface s, float bevel) {
  float depth = max(-s.d, 0.0);
  float we = m_width(s, bevel);
  float x = min(1.0 - clamp(depth / max(we, 1e-4), 0.0, 1.0), 0.9995);
  return vec2(x * smoothstep(0.0, 0.2, s.slope), we * sqrt(1.0 - x * x));
}

float m_studio(vec2 r, float keyRad, float drift, float str) {
  float sky = smoothstep(-0.7, 0.85, r.y);
  float lum = sky * sky * 0.4;
  lum += m_ss(keyRad * 1.05, keyRad * 0.21, length(r - vec2(drift, 0.55))) * 1.75 * str;
  lum += m_ss(keyRad * 1.25, keyRad * 0.25, length(r - vec2(-0.45 + drift, -0.4))) * 1.15 * str;
  lum += m_ss(keyRad * 1.15, keyRad * 0.23, length(r - vec2(0.55 + drift, 0.1))) * 1.1 * str;
  return lum;
}

vec4 material(Surface s) {
  if (s.d > max(0.02, 2.0 * s.aa)) return vec4(0.0);
  float t = s.time * P_speed;
  vec2 dome = m_dome(s, P_bevel);
  vec3 n = vec3(s.n * dome.x, -sqrt(1.0 - dome.x * dome.x));
  vec2 pat = (s.p + vec2(-0.7, 0.5) * dome.y) * 0.5;
  float flowT = t * 0.12;
  vec2 q = pat * P_ripple * 2.6;
  vec2 wi = q * 0.6;
  vec2 w = vec2(
    sin(wi.x * 1.7 + flowT * 0.7 + 1.7) * cos(wi.y * 1.3 + flowT * 0.5 + 2.3),
    cos(wi.x * 1.4 + flowT * 0.9 + 8.7) * sin(wi.y * 1.6 + flowT * 0.6 + 5.1)
  );
  vec2 hg = clamp(m_perlin(q + w * P_swirl * 0.9).yz * 0.62, -4.0, 4.0);
  n = normalize(vec3(n.xy - hg * P_turbulence * 0.5, n.z));
  vec3 view = normalize(vec3(s.p * 0.3, 1.0));
  vec3 R = reflect(view, n);
  float sharp = clamp(P_sharpness, 0.0, 1.0);
  float keyRad = mix(0.5, 0.18, sharp);
  float drift = sin(t * 0.07) * 0.05;
  float la = radians(P_lightAngle);
  vec3 L = normalize(vec3(cos(la), sin(la), -0.7));
  vec3 H = normalize(L + vec3(0.0, 0.0, -1.0));
  float spec = pow(clamp(dot(n, H), 0.0, 1.0), mix(60.0, 900.0, sharp)) * mix(0.4, 1.4, sharp);
  float lumG = m_studio(R.xy, keyRad, drift, P_reflections) + spec;
  float dth = P_dispersion * 0.09 * (0.4 + (1.0 - clamp(-n.z, 0.0, 1.0)) * 1.3);
  float lumB = m_studio(vec2(R.x + R.y * dth, R.y - R.x * dth), keyRad, drift, P_reflections) + spec;
  vec3 lum = clamp(vec3(lumG * 2.0 - lumB, lumG, lumB), 0.0, 1.8);
  vec3 rgb = mix(m_lin(C_dark.rgb), m_lin(C_light.rgb), lum);
  return vec4(m_srgb(rgb), 1.0);
}
`
};
