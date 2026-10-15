export default {
  id: 'water',
  name: 'Water',
  kind: 'shape',
  group: 'glass',
  source: 'shaders.com',
  animated: true,
  outside: false,
  surface: 'bevel',
  params: [
    { name: 'color', label: 'Water color', type: 'color', default: '#00bfeb' },
    { name: 'bevel', label: 'Bevel', type: 'number', min: 0.04, max: 0.7, step: 0.01, default: 0.3 },
    { name: 'depth', label: 'Depth', type: 'number', min: 0, max: 8, step: 0.01, default: 5 },
    { name: 'choppiness', label: 'Choppiness', type: 'number', min: 0, max: 1.5, step: 0.01, default: 0.8 },
    { name: 'waves', label: 'Wave density', type: 'number', min: 1, max: 12, step: 0.01, default: 6 },
    { name: 'swirl', label: 'Swirl', type: 'number', min: 0, max: 1.5, step: 0.01, default: 0.6 },
    { name: 'caustics', label: 'Caustics', type: 'number', min: 0, max: 2, step: 0.01, default: 0.15 },
    { name: 'foam', label: 'Foam', type: 'number', min: 0, max: 1, step: 0.01, default: 0.3 },
    { name: 'angle', label: 'Sun angle', type: 'number', min: 0, max: 360, step: 1, default: 30 },
    { name: 'speed', label: 'Speed', type: 'number', min: 0, max: 4, step: 0.01, default: 0.5 }
  ],
  glsl: `
uint m_hash(ivec2 c) {
  uvec2 v = uvec2(c) * 1664525u + 1013904223u;
  v.x += v.y * 1664525u;
  v.y += v.x * 1664525u;
  v ^= v >> 16u;
  v.x += v.y * 1664525u;
  v.y += v.x * 1664525u;
  v ^= v >> 16u;
  return v.x ^ v.y;
}

float m_grad(uint h, float x, float y) {
  uint k = h & 7u;
  float u = k < 4u ? x : y;
  float v = 2.0 * (k < 4u ? y : x);
  return ((k & 1u) != 0u ? -u : u) + ((k & 2u) != 0u ? -v : v);
}

float m_noise(vec2 p) {
  vec2 fl = floor(p);
  ivec2 i = ivec2(fl);
  vec2 f = p - fl;
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = m_grad(m_hash(i), f.x, f.y);
  float b = m_grad(m_hash(i + ivec2(1, 0)), f.x - 1.0, f.y);
  float c = m_grad(m_hash(i + ivec2(0, 1)), f.x, f.y - 1.0);
  float d = m_grad(m_hash(i + ivec2(1, 1)), f.x - 1.0, f.y - 1.0);
  return 0.6616 * mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float m_fbm(vec2 p) {
  float n0 = m_noise(p);
  float n1 = m_noise(p * 2.07 + vec2(4.3, 9.1)) * 0.5;
  float n2 = m_noise(p * 4.13 + vec2(1.7, 8.2)) * 0.25;
  return (n0 + n1 + n2) * 0.52;
}

vec3 m_sky(vec2 r, vec2 l, float sharp) {
  float up = clamp(r.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 above = mix(vec3(0.9, 0.96, 1.0), vec3(0.2, 0.46, 0.85), smoothstep(0.5, 1.0, up));
  vec3 base = mix(vec3(0.04, 0.1, 0.16), above, smoothstep(0.4, 0.55, up));
  vec2 sunAt = vec2(l.x * 0.8, l.y * 0.8 + 0.12);
  float rad = mix(0.5, 0.13, sharp);
  float sun = 1.0 - smoothstep(rad * 0.15, rad, length(r - sunAt));
  return base + vec3(1.0, 0.97, 0.88) * sun * 1.5;
}

vec4 material(Surface s) {
  if (s.d > 0.02) return vec4(0.0);
  float t = s.time * P_speed;
  float bw = max(P_bevel, 1e-3);
  float a = radians(P_angle);
  vec2 l = vec2(cos(a), sin(a));
  float sharp = 0.1;

  float ridge = smoothstep(0.15, 0.85, s.slope);
  float xb = clamp(1.0 + s.d / bw, 0.0, 1.0);
  float xs = clamp(1.0 + s.d / 0.7, 0.0, 1.0);
  float xw = xs * 0.72;
  float x = min(pow(pow(xb, 4.0) + pow(xw, 4.0), 0.25), 0.985) * ridge;
  vec3 G = normalize(vec3(s.n * x, sqrt(1.0 - x * x)));
  float dh = sqrt(max(1.0 - xs * xs, 0.0));
  float hz = 0.35 * dh;

  float wz = 0.16 * sqrt(max(1.0 - xb * xb, 0.0));
  vec2 pat = vec2(s.p.x * 0.5 - wz * 0.7, -s.p.y * 0.5 - wz * 0.5);
  float freq = P_waves * 2.4;
  float flowT = t * 0.2;
  vec2 q = vec2(pat.x * freq * 0.8, pat.y * freq * 1.25);
  vec2 wi = q * 0.6;
  vec2 warp = vec2(
    sin(wi.x * 1.7 + flowT * 0.7 + 1.7) * cos(wi.y * 1.3 + flowT * 0.5 + 2.3),
    cos(wi.x * 1.4 + flowT * 0.9 + 8.7) * sin(wi.y * 1.6 + flowT * 0.6 + 5.1)
  );
  vec2 qw = q + warp * P_swirl * 0.9 + vec2(0.0, -flowT);
  float n0 = m_noise(qw);
  float h0 = (n0 + m_noise(qw * 2.07 + vec2(4.3, 9.1)) * 0.5 + m_noise(qw * 4.13 + vec2(1.7, 8.2)) * 0.25) * 0.52;
  float h0n1 = n0 * 0.52;
  float re = 0.06;
  float hx = clamp((m_noise(qw + vec2(re, 0.0)) * 0.52 - h0n1) / re, -4.0, 4.0);
  float hy = clamp((m_noise(qw + vec2(0.0, re)) * 0.52 - h0n1) / re, -4.0, 4.0);
  float fre = 0.025;
  vec2 qf = qw * 3.3 + vec2(flowT * 1.7, -flowT * 1.15) + vec2(11.3, 4.7);
  float f0 = m_noise(qf) * 0.52;
  float fxg = clamp((m_noise(qf + vec2(fre, 0.0)) * 0.52 - f0) / fre, -4.0, 4.0);
  float fyg = clamp((m_noise(qf + vec2(0.0, fre)) * 0.52 - f0) / fre, -4.0, 4.0);
  float relief = P_choppiness * 0.5;
  float fine = P_choppiness * 0.22;
  vec3 n = normalize(vec3(G.x - hx * relief - fxg * fine, G.y - hy * relief - fyg * fine, -G.z));

  vec3 R = reflect(vec3(0.0, 0.0, 1.0), n);
  vec3 refl = m_sky(R.xy, l, sharp) * 2.0;

  float thickness = 0.7 * dh * P_depth;
  float depthT = clamp(thickness * 1.3, 0.0, 1.0);
  vec3 wc = toLinear(C_color.rgb);
  vec3 absorb = (1.0 - wc) * 2.2;
  vec3 transmit = exp(-thickness * absorb);
  vec3 shallow = mix(wc, vec3(1.0), 0.5);
  vec3 bodyTint = mix(shallow, wc, depthT) * transmit + wc * depthT * 0.18;

  vec3 L = normalize(vec3(l, -0.7));
  vec3 H = normalize(L + vec3(0.0, 0.0, -1.0));
  float ndl = dot(n, L);
  float diffuse = pow(clamp(ndl * 0.5 + 0.5, 0.0, 1.0), 0.8) * 0.5 + 0.5;

  vec3 tdir = refract(vec3(0.0, 0.0, 1.0), n, 1.0 / 1.333);
  vec3 transSky = m_sky(tdir.xy, l, sharp) * transmit;
  float clarityT = 0.4 * (1.0 - depthT * 0.8);
  vec3 body = mix(bodyTint, transSky * 0.6 + bodyTint * 0.4, clarityT) * diffuse;

  float causT = t * 3.0;
  vec2 causP = pat * 6.0 + vec2(sin(causT * 0.15) * 0.4, -causT * 0.3);
  float c1 = 1.0 - abs(m_fbm(causP));
  float c2 = 1.0 - abs(m_fbm(causP * 1.9 + vec2(3.7, -causT * 0.18)));
  float causV = pow(clamp(c1 * 0.6 + c2 * 0.4, 0.0, 1.0), 3.0);
  float causMask = (depthT * 0.8 + 0.2) * P_caustics;
  body = body * (1.0 + causV * causMask * 0.7) + vec3(0.55, 0.82, 1.0) * causV * causMask * 0.45;

  float graze = 1.0 - clamp(-n.z, 0.0, 1.0);
  float fres = clamp(0.04 + pow(graze, 5.0) * 0.96, 0.0, 1.0);
  vec3 col = mix(body, refl, fres);

  float ndh = clamp(dot(n, H), 0.0, 1.0);
  float spec = pow(ndh, mix(40.0, 600.0, sharp)) * mix(0.3, 1.3, sharp);
  col += vec3(1.0, 0.98, 0.92) * spec;

  float crest = smoothstep(0.62, 0.92, clamp(h0 * 0.5 + 0.5, 0.0, 1.0));
  float shore = 1.0 - smoothstep(0.0, 0.045, hz);
  float foam = clamp(crest + shore * 0.7, 0.0, 1.0) * P_foam;
  col = mix(col, vec3(1.0), foam * 0.85);

  return vec4(toDisplay(col), 1.0);
}
`
};
