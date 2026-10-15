export default {
  id: 'flowing-gradient',
  name: 'Flowing gradient',
  kind: 'fill',
  group: 'pattern',
  source: 'shaders.com',
  animated: true,
  params: [
    { name: 'colorA', label: 'Color A', type: 'color', default: '#0a0015' },
    { name: 'colorB', label: 'Color B', type: 'color', default: '#6b17e6' },
    { name: 'colorC', label: 'Color C', type: 'color', default: '#ff4d6a' },
    { name: 'colorD', label: 'Color D', type: 'color', default: '#ff6b35' },
    { name: 'distortion', label: 'Distortion', type: 'number', min: 0, max: 2, step: 0.05, default: 0.5 },
    { name: 'scale', label: 'Scale', type: 'number', min: 0.25, max: 4, step: 0.05, default: 1 },
    { name: 'speed', label: 'Speed', type: 'number', min: 0, max: 10, step: 0.1, default: 1 },
    { name: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 0 }
  ],
  glsl: `
vec3 m_lin(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
}

vec3 m_srgb(vec3 c) {
  c = max(c, 0.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(0.41666)) - 0.055, step(0.0031308, c));
}

vec3 m_lch(vec3 c) {
  vec3 lms = vec3(
    0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b,
    0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b,
    0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b
  );
  vec3 q = sign(lms) * pow(abs(lms), vec3(1.0 / 3.0));
  vec3 lab = vec3(
    0.2104542553 * q.x + 0.793617785 * q.y - 0.0040720468 * q.z,
    1.9779984951 * q.x - 2.428592205 * q.y + 0.4505937099 * q.z,
    0.0259040371 * q.x + 0.7827717662 * q.y - 0.808675766 * q.z
  );
  float chroma = length(lab.yz);
  return vec3(lab.x, chroma, chroma > 1e-7 ? atan(lab.z, lab.y) : 0.0);
}

vec3 m_rgb(vec3 lch) {
  vec3 lab = vec3(lch.x, lch.y * cos(lch.z), lch.y * sin(lch.z));
  float l = lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z;
  float m = lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z;
  float s = lab.x - 0.0894841775 * lab.y - 1.291485548 * lab.z;
  l = l * l * l;
  m = m * m * m;
  s = s * s * s;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  );
}

vec4 m_mix(vec4 a, vec4 b, float t) {
  float wa = a.a * (1.0 - t);
  float wb = b.a * t;
  float w = wa + wb;
  return vec4((a.rgb * wa + b.rgb * wb) / max(w, 0.001), w);
}

uint m_rotl(uint x, int k) {
  return (x << uint(k)) | (x >> uint(32 - k));
}

uint m_hash(int x, int y, int z) {
  uint s = 0xdeadbeefu + 25u;
  uint a = s + uint(x);
  uint b = s + uint(y);
  uint c = s + uint(z);
  c ^= b;
  c -= m_rotl(b, 14);
  a ^= c;
  a -= m_rotl(c, 11);
  b ^= a;
  b -= m_rotl(a, 25);
  c ^= b;
  c -= m_rotl(b, 16);
  a ^= c;
  a -= m_rotl(c, 4);
  b ^= a;
  b -= m_rotl(a, 14);
  c ^= b;
  c -= m_rotl(b, 24);
  return c;
}

float m_grad(uint h, vec3 f) {
  h &= 15u;
  float u = h < 8u ? f.x : f.y;
  float v = h < 4u ? f.y : (h == 12u || h == 14u ? f.x : f.z);
  return ((h & 1u) != 0u ? -u : u) + ((h & 2u) != 0u ? -v : v);
}

float m_noise(vec3 p) {
  vec3 i = floor(p);
  ivec3 c = ivec3(i);
  vec3 f = p - i;
  vec3 w = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float n000 = m_grad(m_hash(c.x, c.y, c.z), f);
  float n100 = m_grad(m_hash(c.x + 1, c.y, c.z), f - vec3(1.0, 0.0, 0.0));
  float n010 = m_grad(m_hash(c.x, c.y + 1, c.z), f - vec3(0.0, 1.0, 0.0));
  float n110 = m_grad(m_hash(c.x + 1, c.y + 1, c.z), f - vec3(1.0, 1.0, 0.0));
  float n001 = m_grad(m_hash(c.x, c.y, c.z + 1), f - vec3(0.0, 0.0, 1.0));
  float n101 = m_grad(m_hash(c.x + 1, c.y, c.z + 1), f - vec3(1.0, 0.0, 1.0));
  float n011 = m_grad(m_hash(c.x, c.y + 1, c.z + 1), f - vec3(0.0, 1.0, 1.0));
  float n111 = m_grad(m_hash(c.x + 1, c.y + 1, c.z + 1), f - vec3(1.0, 1.0, 1.0));
  float lo = mix(mix(n000, n100, w.x), mix(n010, n110, w.x), w.y);
  float hi = mix(mix(n001, n101, w.x), mix(n011, n111, w.x), w.y);
  return 0.982 * mix(lo, hi, w.z);
}

vec4 m_warp(vec2 at, float scale, float z, vec2 offA, vec2 offB, float reach, float strength) {
  vec3 wp = vec3(at * scale, z);
  float nx = m_noise(wp + vec3(offA, 0.0));
  float ny = m_noise(wp + vec3(offB, 0.0));
  return vec4(at + vec2(nx, ny) * reach * strength, nx, ny);
}

vec4 fill(vec2 p, float time) {
  vec2 centred = p / (1.7 * max(P_scale, 0.05));
  float t = time * P_speed * 0.075;
  float seed = P_variation * 0.17;
  float strength = P_distortion;
  float spin = m_noise(vec3(centred.x * 0.8 + t * 0.4, centred.y * 0.8 - t * 0.25, seed));
  float angle = spin * 12.566370614359172 * strength;
  vec2 rot = vec2(
    centred.x * cos(angle) - centred.y * sin(angle),
    centred.x * sin(angle) + centred.y * cos(angle)
  );
  float shearT = t * 2.0;
  float shearX = rot.x + sin(rot.y * 5.0 + shearT) / 50.0 * strength;
  float shearY = rot.y + sin(shearX * 7.5 + shearT) / 25.0 * strength;
  vec4 level1 = m_warp(vec2(shearX, shearY), 2.0, t * 0.5 + seed, vec2(5.2, 1.3), vec2(1.7, 9.2), 0.25, strength);
  float tz = t * 0.3 + seed;
  vec4 level2 = m_warp(level1.xy, 1.5, tz, vec2(8.3, 2.8), vec2(3.1, 7.4), 0.2, strength);
  float zone = m_noise(vec3(level2.xy * 1.8, tz));
  float hardness = pow(max(level1.z * 0.5 + 0.5, 0.0), 1.5);
  float edge = mix(0.5, 0.008, hardness);
  float t1 = smoothstep(-edge, edge, zone);
  float t2 = smoothstep(-edge, edge, level1.w);
  vec4 a = vec4(m_lch(m_lin(C_colorA.rgb)), C_colorA.a);
  vec4 b = vec4(m_lch(m_lin(C_colorB.rgb)), C_colorB.a);
  vec4 c = vec4(m_lch(m_lin(C_colorC.rgb)), C_colorC.a);
  vec4 d = vec4(m_lch(m_lin(C_colorD.rgb)), C_colorD.a);
  vec4 base = m_mix(m_mix(a, b, t1), m_mix(c, d, t1), t2);
  float fold = max(1.0 - abs(t1 * 2.0 - 1.0), 1.0 - abs(t2 * 2.0 - 1.0)) * hardness;
  float light = (level2.z * 0.5 + 0.5) * 0.12 + 0.94;
  vec3 rgb = clamp(m_rgb(base.rgb) * light * (1.0 + fold * 0.35), 0.0, 1.0);
  return vec4(m_srgb(rgb), clamp(base.a, 0.0, 1.0));
}
`
};
