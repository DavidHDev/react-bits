export default {
  id: 'nebula',
  name: 'Nebula',
  kind: 'shape',
  group: 'volume',
  source: 'shaders.com',
  animated: true,
  outside: false,
  surface: 'bevel',
  params: [
    { name: 'gas', label: 'Gas', type: 'color', default: '#ff5e7a' },
    { name: 'veil', label: 'Veil', type: 'color', default: '#3a5bdb' },
    { name: 'core', label: 'Core', type: 'color', default: '#ffd9b0' },
    { name: 'density', label: 'Density', type: 'number', min: 0, max: 1, step: 0.01, default: 1 },
    { name: 'cavity', label: 'Cavity', type: 'number', min: 0, max: 1, step: 0.01, default: 0.3 },
    { name: 'dust', label: 'Dust', type: 'number', min: 0, max: 1, step: 0.01, default: 0.55 },
    { name: 'billow', label: 'Billow', type: 'number', min: 0, max: 1, step: 0.01, default: 0.6 },
    { name: 'gasScale', label: 'Gas scale', type: 'number', min: 0.1, max: 1, step: 0.01, default: 0.45 },
    { name: 'stars', label: 'Stars', type: 'number', min: 0, max: 1, step: 0.01, default: 0.07 },
    { name: 'glass', label: 'Glass', type: 'number', min: 0, max: 2, step: 0.01, default: 1 },
    { name: 'bevel', label: 'Bevel', type: 'number', min: 0.05, max: 0.8, step: 0.01, default: 0.7 },
    { name: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 12 },
    { name: 'speed', label: 'Speed', type: 'number', min: 0, max: 4, step: 0.01, default: 0.3 }
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

float m_grad3(uint h, vec3 f) {
  h &= 15u;
  float u = h < 8u ? f.x : f.y;
  float v = h < 4u ? f.y : ((h == 12u || h == 14u) ? f.x : f.z);
  return ((h & 1u) != 0u ? -u : u) + ((h & 2u) != 0u ? -v : v);
}

float m_noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = p - i;
  vec3 w = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  uvec3 c = uvec3(ivec3(i));
  float a = m_grad3(m_hash(c), f);
  float b = m_grad3(m_hash(c + uvec3(1u, 0u, 0u)), f - vec3(1.0, 0.0, 0.0));
  float d = m_grad3(m_hash(c + uvec3(0u, 1u, 0u)), f - vec3(0.0, 1.0, 0.0));
  float e = m_grad3(m_hash(c + uvec3(1u, 1u, 0u)), f - vec3(1.0, 1.0, 0.0));
  float g = m_grad3(m_hash(c + uvec3(0u, 0u, 1u)), f - vec3(0.0, 0.0, 1.0));
  float k = m_grad3(m_hash(c + uvec3(1u, 0u, 1u)), f - vec3(1.0, 0.0, 1.0));
  float l = m_grad3(m_hash(c + uvec3(0u, 1u, 1u)), f - vec3(0.0, 1.0, 1.0));
  float m = m_grad3(m_hash(c + uvec3(1u, 1u, 1u)), f - vec3(1.0, 1.0, 1.0));
  return 0.982 * mix(mix(mix(a, b, w.x), mix(d, e, w.x), w.y), mix(mix(g, k, w.x), mix(l, m, w.x), w.y), w.z);
}

float m_grad2(uint h, vec2 f) {
  h &= 7u;
  float u = h < 4u ? f.x : f.y;
  float v = 2.0 * (h < 4u ? f.y : f.x);
  return ((h & 1u) != 0u ? -u : u) + ((h & 2u) != 0u ? -v : v);
}

float m_noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 w = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  uvec3 c = uvec3(uvec2(ivec2(i)), 0u);
  float a = m_grad2(m_hash(c), f);
  float b = m_grad2(m_hash(c + uvec3(1u, 0u, 0u)), f - vec2(1.0, 0.0));
  float d = m_grad2(m_hash(c + uvec3(0u, 1u, 0u)), f - vec2(0.0, 1.0));
  float e = m_grad2(m_hash(c + uvec3(1u, 1u, 0u)), f - vec2(1.0, 1.0));
  return 0.6616 * mix(mix(a, b, w.x), mix(d, e, w.x), w.y);
}

float m_worley(vec2 p) {
  vec2 i = floor(p);
  vec2 f = p - i;
  float best = 1e6;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 o = vec2(float(x), float(y));
      uint h = m_hash(uvec3(uvec2(ivec2(i + o)), 9u));
      vec2 r = vec2(float(h & 65535u), float(h >> 16u)) / 65535.0;
      vec2 q = o + r - f;
      best = min(best, dot(q, q));
    }
  }
  return best;
}

vec3 m_stars(vec2 p, float vf, vec2 rad, vec2 keep, vec2 bright, float rate, float spread, float t, vec3 from, vec3 to, float tint) {
  float v = m_noise2(p * vf) * 0.5 + 0.5;
  float tw = 0.175;
  float shimmer = 1.0 - tw + sin(t * rate + v * spread) * tw;
  float g = (1.0 - smoothstep(0.0005, rad.x + v * rad.y, m_worley(p))) * smoothstep(keep.x, keep.y, v);
  return mix(from, to, v) * g * (bright.x + v * v * bright.y) * shimmer * tint * P_stars;
}

void m_medium(vec3 p, float freq, float drift, float seed, float billow, out float dens, out float mid, out float fine) {
  vec3 q = vec3(
    p.x * freq + drift + seed,
    p.y * freq - drift * 0.7 + seed * 0.53,
    p.z * freq * 1.25 + drift * 1.3 + seed * 0.79
  );
  float warp = m_noise3(q * 0.5 + vec3(drift * 1.4, 0.0, -drift * 0.9));
  vec3 qw = q + vec3(warp, -warp * 0.73, warp * 0.41) * billow;
  mid = m_noise3(qw * 2.13 + vec3(5.2, 1.3, 8.4));
  fine = m_noise3(qw * 4.31 + vec3(9.1, 3.7, 1.2));
  dens = (m_noise3(qw) + mid * 0.5 + fine * 0.27) * 0.57;
}

vec3 m_toLab(vec3 c) {
  vec3 lms = vec3(
    dot(c, vec3(0.4122214708, 0.5363325363, 0.0514459929)),
    dot(c, vec3(0.2119034982, 0.6806995451, 0.1073969566)),
    dot(c, vec3(0.0883024619, 0.2817188376, 0.6299787005))
  );
  lms = sign(lms) * pow(abs(lms), vec3(1.0 / 3.0));
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

vec3 m_neutral(vec3 c) {
  float x = min(c.r, min(c.g, c.b));
  float off = x < 0.08 ? x - 6.25 * x * x : 0.04;
  c -= off;
  float peak = max(c.r, max(c.g, c.b));
  if (peak < 0.76) return c;
  float np = 1.0 - 0.0576 / (peak - 0.52);
  c *= np / peak;
  float g = 1.0 - 1.0 / (0.15 * (peak - np) + 1.0);
  return mix(c, vec3(np), g);
}

float m_box(vec2 e, vec2 at, float r, float gain) {
  return (1.0 - smoothstep(r * 0.2, r, length(e - at))) * gain;
}

float m_studio(vec2 r, vec2 rot, float k, float strength) {
  vec2 e = vec2(r.x * rot.x - r.y * rot.y, r.x * rot.y + r.y * rot.x);
  float sky = smoothstep(-0.7, 0.85, e.y);
  float lum = m_box(e, vec2(0.0, 0.55), k, 1.7);
  lum += m_box(e, vec2(-0.55, 0.18), k * 1.15, 1.05);
  lum += m_box(e, vec2(0.55, 0.1), k, 1.0);
  lum += m_box(e, vec2(0.2, -0.5), k * 1.3, 0.7);
  lum += m_box(e, vec2(-0.35, -0.25), k * 1.1, 0.85);
  return sky * sky * 0.32 + lum * strength;
}

vec4 material(Surface s) {
  if (s.d > 0.02) return vec4(0.0);
  float t = s.time * P_speed;
  vec3 veil = toLinear(C_veil.rgb);
  vec3 core = toLinear(C_core.rgb);
  vec3 labV = m_toLab(veil);
  vec3 labG = m_toLab(toLinear(C_gas.rgb));
  vec3 labC = m_toLab(core);

  vec3 N = domeNormal(s, P_bevel);
  float aspect = s.res.x / s.res.y;
  vec3 view = normalize(vec3((s.uv.x - 0.5) * aspect * 0.6, (s.uv.y - 0.5) * 0.6, -1.0));
  vec2 place = s.p * 0.5;
  vec2 interior = place + N.xy * 0.08;
  float pathLen = 0.9 * P_bevel * domeHeight(s, P_bevel);
  vec2 shear = view.xy * 0.55;

  float freq = P_gasScale * 3.1;
  float drift = t * 0.14;
  float seed = P_variation * 7.31;
  float jit = float(m_hash(uvec3(uvec2(ivec2(s.frag)), 3u)) & 65535u) / 65535.0 * 0.025;
  float macro = m_noise2(vec2(place.x * 1.3 + drift * 0.6 + seed * 0.37, place.y * 1.3 + seed * 0.61)) * 0.5;
  float cav = mix(-0.35, 0.5, P_cavity);
  float billow = P_billow * 0.55;
  float eGain = 0.3 + pathLen * 0.9;
  float aGain = (0.5 + pathLen * 2.2) * P_density * 0.5;

  vec3 trans = vec3(1.0);
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 6; i++) {
    float fi = (float(i) + 0.5) / 6.0;
    float z = pathLen * (fi + jit);
    float g;
    float mid;
    float fine;
    m_medium(vec3(interior + shear * z, z), freq, drift, seed, billow, g, mid, fine);
    float wall = smoothstep(0.0, 0.11, pathLen * min(fi, 1.0 - fi));
    float ridge = 1.0 - clamp(abs(fine) * 1.6, 0.0, 1.0);
    float dens = smoothstep(0.0, 0.5, g + macro - cav) * wall * (0.65 + ridge * 0.7);
    float dust = smoothstep(0.45, 0.75, mid) * wall * P_dust;
    vec3 body = max(m_fromLab(mix(mix(labV, labG, smoothstep(0.05, 0.75, dens)), labC, smoothstep(0.85, 1.3, dens))), 0.0);
    float dim = 1.0 - fi * 0.45;
    float haze = smoothstep(-0.7, 0.3, g) * 0.05 * wall;
    vec3 emit = (body * dens + veil * haze) * dim;
    vec3 absorb = vec3(dens * aGain) + vec3(1.5, 1.0, 0.55) * dust * aGain * 2.2;
    acc += emit * trans * eGain;
    trans *= exp(-absorb);
  }

  vec2 farP = (interior + shear * pathLen * 1.1) * 34.0;
  vec3 far = m_stars(farP, 0.13, vec2(0.004, 0.013), vec2(0.35, 0.75), vec2(0.3, 1.2), 1.7, 40.0, t, vec3(0.72, 0.82, 1.0), vec3(1.0, 0.92, 0.82), 1.6);
  vec2 nearP = (interior + shear * pathLen * 0.25) * 19.04 + vec2(7.3, 2.9);
  vec3 near = m_stars(nearP, 0.11, vec2(0.003, 0.01), vec2(0.45, 0.8), vec2(0.35, 1.3), 2.3, 34.0, t, vec3(0.75, 0.85, 1.0), vec3(1.0, 0.95, 0.88), 1.8);

  vec2 ld = vec2(0.70710678, -0.70710678);
  vec3 L = normalize(vec3(ld, 0.7));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float ndh = clamp(dot(N, H), 0.0, 1.0);
  vec3 R = reflect(view, N);
  float fres = 0.04 + 0.96 * pow(1.0 - clamp(-dot(view, N), 0.0, 1.0), 5.0);
  float env = (m_studio(R.xy, ld, 0.2, 0.7) * 0.6 + 0.1) * fres * P_glass;
  float spec = (pow(ndh, 70.0) * 1.3 + pow(ndh, 11.0) * 0.14) * 1.15 * P_glass;

  vec3 floorC = max(m_fromLab(mix(labV, labG, 0.25)), 0.0);
  vec3 rgb = floorC * 0.06 * trans + acc + far * trans + near * mix(trans, vec3(1.0), 0.35);
  rgb += vec3(0.85, 0.92, 1.08) * env + vec3(1.0, 0.98, 0.95) * spec;
  return vec4(toDisplay(m_neutral(rgb)), 1.0);
}
`
};
