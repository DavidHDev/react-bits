export default {
  id: 'hologram',
  name: 'Hologram',
  kind: 'shape',
  group: 'light',
  source: 'shaders.com',
  animated: true,
  outside: true,
  surface: 0.1,
  params: [
    { name: 'color', label: 'Color', type: 'color', default: '#5ec8ff' },
    { name: 'brightness', label: 'Brightness', type: 'number', min: 0.2, max: 3, step: 0.01, default: 2.5 },
    { name: 'fill', label: 'Fill', type: 'number', min: 0, max: 1, step: 0.01, default: 0.45 },
    { name: 'edgeGlow', label: 'Edge glow', type: 'number', min: 0, max: 2.5, step: 0.01, default: 1 },
    { name: 'depthLines', label: 'Depth lines', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { name: 'density', label: 'Line density', type: 'number', min: 4, max: 70, step: 1, default: 26 },
    { name: 'scanlines', label: 'Scanlines', type: 'number', min: 0, max: 1, step: 0.01, default: 0.55 },
    { name: 'scanCount', label: 'Scanline count', type: 'number', min: 20, max: 400, step: 1, default: 130 },
    { name: 'flicker', label: 'Flicker', type: 'number', min: 0, max: 1, step: 0.01, default: 0.3 },
    { name: 'distortion', label: 'Distortion', type: 'number', min: 0, max: 1, step: 0.01, default: 0.1 },
    { name: 'speed', label: 'Speed', type: 'number', min: 0, max: 3, step: 0.01, default: 1 }
  ],
  glsl: `
uint m_rotl(uint x, int k) {
  return (x << uint(k)) | (x >> uint(32 - k));
}

uint m_hashInt(int x, int y) {
  uint seed = 0xdeadbeefu + (2u << 2u) + 13u;
  uint a = seed + uint(x);
  uint b = seed + uint(y);
  uint c = seed;
  c ^= b; c -= m_rotl(b, 14);
  a ^= c; a -= m_rotl(c, 11);
  b ^= a; b -= m_rotl(a, 25);
  c ^= b; c -= m_rotl(b, 16);
  a ^= c; a -= m_rotl(c, 4);
  b ^= a; b -= m_rotl(a, 14);
  c ^= b; c -= m_rotl(b, 24);
  return c;
}

float m_grad(uint h, float x, float y) {
  h &= 7u;
  float u = h < 4u ? x : y;
  float v = 2.0 * (h < 4u ? y : x);
  return ((h & 1u) != 0u ? -u : u) + ((h & 2u) != 0u ? -v : v);
}

float m_perlin(vec2 p) {
  int X = int(floor(p.x));
  int Y = int(floor(p.y));
  float fx = p.x - float(X);
  float fy = p.y - float(Y);
  float u = fx * fx * fx * (fx * (fx * 6.0 - 15.0) + 10.0);
  float v = fy * fy * fy * (fy * (fy * 6.0 - 15.0) + 10.0);
  float a = m_grad(m_hashInt(X, Y), fx, fy);
  float b = m_grad(m_hashInt(X + 1, Y), fx - 1.0, fy);
  float c = m_grad(m_hashInt(X, Y + 1), fx, fy - 1.0);
  float d = m_grad(m_hashInt(X + 1, Y + 1), fx - 1.0, fy - 1.0);
  return 0.6616 * mix(mix(a, b, u), mix(c, d, u), v);
}

float m_hash12(vec2 p) {
  uvec2 u = floatBitsToUint(p * vec2(141421356.0, 2718281828.0));
  return float((u.x ^ u.y) * 3141592653u) / 4294967295.0;
}

vec4 material(Surface s) {
  if (s.d > 0.06) return vec4(0.0);
  float t = s.time * P_speed;
  float uvY = s.p.y * 0.5 + 0.5;
  vec2 grad = s.n * s.slope;

  float wob = sin(uvY * 38.0 + t * 2.3) * 0.5 + sin(uvY * 11.5 - t * 1.7) * 0.5;
  float d = s.d + grad.x * wob * P_distortion * 0.024;
  float cov = clamp(0.5 - d / s.aa, 0.0, 1.0);
  if (cov <= 0.0) return vec4(0.0);

  float depthT = max(-d * 0.5, 0.0);
  float px = s.px * 0.5;
  float R = 0.35;
  float tt = min(depthT, R);
  float z = sqrt(max(tt * (2.0 - tt / R) * R, 0.0));
  float dz = depthT < R ? (R - tt) / max(z, px) : 0.0;
  float slope = min(dz * s.slope, 2.0);
  vec3 nrm = normalize(vec3(s.n * slope, -1.0));
  float fres = pow(clamp(1.0 - abs(nrm.z), 0.0, 1.0), 2.2);
  float thickness = z;
  float rimBase = exp(-z * 5.5) * 0.55 + fres;
  float metric = 1.2 - z;
  float rate = dz * s.slope;
  float gradX = clamp(dz, 0.0, 4.0) * grad.x;
  float rim = rimBase * P_edgeGlow;
  float bodyFill = (1.0 - exp(-thickness * 5.0)) * P_fill;

  float phase = metric * P_density - t * 1.2;
  float fr = fract(phase);
  float distI = min(fr, 1.0 - fr);
  float periodPx = 1.0 / max(P_density * rate * px, 1e-5);
  float lines = 1.0 - smoothstep(0.0, 0.06, distI);
  lines = mix(0.12, lines, smoothstep(2.0, 4.0, periodPx));
  float contour = lines * P_depthLines;

  float scanPhase = uvY * P_scanCount - t * 3.0;
  float scan = sin(scanPhase * TAU) * 0.5 + 0.5;
  float scanPx = 1.0 / max(P_scanCount * px, 1e-5);
  scan = mix(0.5, scan, smoothstep(1.8, 3.5, scanPx));
  float scanMask = mix(1.0, scan, P_scanlines);

  float sweepD = uvY - fract(t * 0.16);
  float sweepGlow = exp(-sweepD * sweepD * 650.0) * 0.1;

  float shimmer = sin(t * 40.0) * 0.04 + sin(t * 23.3) * 0.03;
  float drop = smoothstep(0.6, 0.95, m_perlin(vec2(t * 6.0, 11.0)) * 0.5 + 0.5);
  float flick = (1.0 + shimmer) * (1.0 - P_flicker * drop * 0.7);

  float gn = m_hash12(vec2(s.frag.x + t * 57.3, s.frag.y));
  float grainMul = 1.0 + (gn - 0.5) * 0.45 * 0.6;

  float glow = bodyFill + rim + contour;
  float core = (glow * scanMask * flick * grainMul + sweepGlow * scanMask) * P_brightness;

  float fringe = rim * gradX * (P_distortion * 0.12 + 0.04) * 0.1;
  vec3 color = toLinear(C_color.rgb);
  vec3 rgb = vec3(color.r * (core + fringe), color.g * core, color.b * (core - fringe));
  float hot = clamp(rim * 0.5 + sweepGlow, 0.0, 0.8);
  rgb = mix(rgb, vec3(core), hot);
  float alpha = clamp(core, 0.0, 1.0) * cov;

  vec3 shown = toDisplay(clamp(rgb * alpha, 0.0, 1.0));
  float outA = max(alpha, max(shown.r, max(shown.g, shown.b)));
  return vec4(shown / max(outA, 1e-4), outA);
}
`
};
