export default {
  id: 'chrome',
  name: 'Studio chrome',
  kind: 'shape',
  group: 'metal',
  source: 'shaders.com',
  animated: true,
  outside: false,
  surface: 0.15,
  params: [
    { name: 'tint', label: 'Tint', type: 'color', default: '#ffffff' },
    { name: 'warm', label: 'Warm light', type: 'color', default: '#ffa94d' },
    { name: 'cool', label: 'Cool light', type: 'color', default: '#82a7e6' },
    { name: 'bevel', label: 'Bevel', type: 'number', min: 0.02, max: 0.8, step: 0.01, default: 0.7 },
    { name: 'profile', label: 'Machined', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { name: 'softness', label: 'Softness', type: 'number', min: 0, max: 1, step: 0.01, default: 0.3 },
    { name: 'accents', label: 'Accent lights', type: 'number', min: 0, max: 2, step: 0.01, default: 0.9 },
    { name: 'shadows', label: 'Shadows', type: 'number', min: 0, max: 1, step: 0.01, default: 0.7 },
    { name: 'dispersion', label: 'Dispersion', type: 'number', min: 0, max: 1, step: 0.01, default: 0.3 },
    { name: 'exposure', label: 'Exposure', type: 'number', min: 0, max: 2, step: 0.01, default: 1 },
    { name: 'rotation', label: 'Rotation', type: 'number', min: 0, max: 360, step: 1, default: 0 },
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

float m_bevelSin(float t, float shape) {
  float k1 = smoothstep(0.0, 0.14, t);
  float k2 = smoothstep(0.68, 0.92, t);
  return mix(1.0 - t, mix(1.0, 0.72 * (1.0 - k2), k1), shape);
}

vec3 m_neutral(vec3 c) {
  float x = min(c.r, min(c.g, c.b));
  float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  c -= offset;
  float peak = max(c.r, max(c.g, c.b));
  if (peak < 0.76) return c;
  float newPeak = 1.0 - 0.0576 / (peak + 0.24 - 0.76);
  c *= newPeak / peak;
  float g = 1.0 - 1.0 / (0.15 * (peak - newPeak) + 1.0);
  return mix(c, vec3(newPeak), g);
}

float m_roundBox(vec2 q) {
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}

vec3 m_studio(vec3 e, float boxSoftIn, float stripSoft, float spectral, float shadows, vec3 warmC, vec3 coolC) {
  float horiz = e.x / (length(e.xy) + 0.0001);
  float warmSide = 0.35 + 0.65 * smoothstep(-0.7, 0.7, horiz);
  float coolSide = 0.45 + 0.55 * smoothstep(-0.7, 0.7, -horiz);
  float up = smoothstep(-0.65, 1.0, e.y);
  vec3 graphite = coolC * 0.03 + vec3(0.003, 0.003, 0.004);
  vec3 baseLo = mix(vec3(0.17, 0.175, 0.19), graphite, shadows);
  vec3 env = mix(baseLo, vec3(0.56, 0.57, 0.6), up * up);
  env += vec3(0.55, 0.55, 0.56) * smoothstep(0.3, 0.9, e.y);
  float cd = (e.y + 0.45) / 0.2;
  env += coolC * exp(-cd * cd) * spectral * 0.2 * coolSide;
  float facing = m_ss(0.18, -0.1, e.z);
  float pz = max(0.32 - e.z, 0.06);
  vec2 q = e.xy / pz;
  float dbox = m_roundBox(vec2(abs(q.x) - 0.62, abs(q.y - 0.3) - 0.28));
  float boxSoft = 0.05 + boxSoftIn * 0.4;
  env += vec3(2.9, 2.87, 2.82) * m_ss(boxSoft, -0.6 * boxSoft, dbox) * facing;
  env *= mix(1.0, mix(0.55, 0.07, shadows), smoothstep(0.5, 0.92, abs(e.x)));
  float gw = 0.065 + stripSoft * 0.05;
  float dOut = max(dbox, 0.0) / gw;
  env += warmC * exp(-dOut * dOut) * smoothstep(-0.06, 0.1, dbox) * spectral * 1.3 * warmSide * facing;
  float fb = (e.y + 0.12) / 0.05;
  env += warmC * exp(-fb * fb) * spectral * 0.5 * warmSide * (1.0 - facing);
  float dcard = m_roundBox(vec2(abs(q.x) - 0.7, abs(q.y + 0.78) - 0.05));
  env += vec3(0.5, 0.5, 0.52) * m_ss(boxSoft, -0.6 * boxSoft, dcard) * facing;
  return env;
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

float m_tilt(Surface s, float bevel, float shape, float wobble) {
  float depth = max(-s.d, 0.0);
  float we = m_width(s, bevel);
  float band = min(0.02, 0.2 * we);
  float t = clamp((depth - band) / max(we - band, 1e-4), 0.0, 1.0);
  t = clamp(t + wobble * t * (1.0 - t), 0.0, 1.0);
  return min(m_bevelSin(t, shape), 0.98) * smoothstep(0.0, 0.2, s.slope);
}

vec4 material(Surface s) {
  if (s.d > max(0.02, 2.0 * s.aa)) return vec4(0.0);
  float t = s.time * P_speed + 15.0;
  vec2 pat = s.p * 0.5;
  float rimN = m_perlin(pat * 21.0).x;
  float tilt = m_tilt(s, P_bevel, P_profile, rimN * 0.132);
  vec3 n = vec3(s.n * tilt, -sqrt(1.0 - tilt * tilt));
  vec2 wg = clamp(m_perlin(pat * 1.05 + vec2(t * 0.08, 0.0)).yz, -4.0, 4.0) * 0.03;
  n = normalize(vec3(n.xy + wg, n.z));
  vec3 view = normalize(vec3(s.p * 0.275, 1.0));
  vec3 R = reflect(view, n);
  float tiltV = 1.0 - clamp(-dot(n, view), 0.0, 1.0);
  float rotA = radians(P_rotation) + sin(t * 0.23) * 0.05;
  float envC = cos(rotA);
  float envS = sin(rotA);
  float upY = -R.y;
  float rx0 = R.x * envC - upY * envS;
  float ry0 = R.x * envS + upY * envC;
  float orbit = sin(t * 0.5) * 0.4 + sin(t * 0.19 + 1.7) * 0.2;
  float oc = cos(orbit);
  float os = sin(orbit);
  float rx = rx0 * oc + R.z * os;
  float rz0 = R.z * oc - rx0 * os;
  float nod = sin(t * 0.31 + 0.9) * 0.12;
  float ry = ry0 * cos(nod) - rz0 * sin(nod);
  float rz = rz0 * cos(nod) + ry0 * sin(nod);
  float faceness = smoothstep(0.75, 1.0, -n.z);
  float softEff = P_softness + faceness * 0.2;
  vec3 warmC = m_lin(C_warm.rgb);
  vec3 coolC = m_lin(C_cool.rgb);
  float delta = P_dispersion * (0.004 + tiltV * tiltV * 0.06);
  vec3 envG = m_studio(vec3(rx, ry, rz), softEff, P_softness, P_accents, P_shadows, warmC, coolC);
  vec3 envR = m_studio(vec3(rx, ry + delta, rz), softEff, P_softness, P_accents, P_shadows, warmC, coolC);
  vec3 envB = m_studio(vec3(rx, ry - delta, rz), softEff, P_softness, P_accents, P_shadows, warmC, coolC);
  vec3 env = vec3(envR.r, envG.g, envB.b);
  vec3 rgb = m_neutral(env * P_exposure * m_lin(C_tint.rgb));
  return vec4(m_srgb(rgb), 1.0);
}
`
};
