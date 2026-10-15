const jhash = x => {
  const s = Math.sin(x * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

const num = value => value.toFixed(6);

const charges = Array.from({ length: 7 }, (_, i) => {
  const theta = i * 2.399963;
  const radius = Math.sqrt((i + 0.5) / 7);
  const pf = [radius * Math.cos(theta), radius * Math.sin(theta), 0.5 + jhash(i + 1), 0.5 + jhash(i + 7)];
  const ph = [0.5 + jhash(i + 13), jhash(i + 2) * 6.2831853, jhash(i + 5) * 6.2831853, jhash(i + 9) * 6.2831853];
  return `  pot += m_charge(q, t, vec4(${pf.map(num).join(', ')}), vec4(${ph.map(num).join(', ')}), drift, baseR);`;
}).join('\n');

export default {
  id: 'goo',
  name: 'Goo',
  kind: 'shape',
  group: 'relief',
  source: 'shaders.com',
  animated: true,
  outside: false,
  surface: 0.25,
  params: [
    { name: 'color', label: 'Color', type: 'color', default: '#67c667' },
    { name: 'bevel', label: 'Roundness', type: 'number', min: 0.02, max: 0.8, step: 0.01, default: 0.32 },
    { name: 'blobSize', label: 'Blob size', type: 'number', min: 0.1, max: 1, step: 0.01, default: 0.3 },
    { name: 'bulge', label: 'Bulge', type: 'number', min: 0, max: 1.5, step: 0.01, default: 1 },
    { name: 'wobble', label: 'Wobble', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { name: 'angle', label: 'Light angle', type: 'number', min: 0, max: 360, step: 1, default: 300 },
    { name: 'wetness', label: 'Highlights', type: 'number', min: 0, max: 5, step: 0.01, default: 2 },
    { name: 'translucency', label: 'Translucency', type: 'number', min: 0, max: 1, step: 0.01, default: 0.6 },
    { name: 'speed', label: 'Speed', type: 'number', min: 0, max: 2, step: 0.01, default: 0.5 },
    { name: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 1 }
  ],
  glsl: `
vec3 m_charge(vec2 q, float t, vec4 pf, vec4 ph, float drift, float baseR) {
  vec2 c = pf.xy * 0.45 + drift * vec2(sin(t * pf.z + ph.y), cos(t * pf.w + ph.z));
  float r = baseR * (1.0 + 0.3 * sin(t * ph.x + ph.w));
  float inv = 1.0 / max(r * r, 1e-4);
  vec2 dq = q - c;
  float e = exp(-dot(dq, dq) * inv);
  return vec3(e, -2.0 * inv * e * dq);
}

vec4 material(Surface s) {
  if (s.d > 0.02) return vec4(0.0);
  float t = s.time * P_speed + P_variation;
  vec2 q = s.p * 0.5;
  float drift = P_wobble * 0.12;
  float baseR = P_blobSize * 0.38 * 1.07;
  vec3 pot = vec3(0.0);
${charges}

  float contain = 0.9;
  float f = s.d * 0.5;
  float i0 = 1.0 - smoothstep(-0.06, 0.06, f);
  float H = pot.x * mix(1.0, i0, contain) + i0 * contain;

  float rim = clamp(1.0 + s.d / P_bevel, 0.0, 0.985) * smoothstep(0.15, 0.85, s.slope);
  vec2 dome = s.n * rim / sqrt(1.0 - rim * rim);
  float lift = P_bulge * 0.12 + 0.03;
  vec3 n = normalize(vec3(dome - pot.yz * mix(1.0, i0, contain) * lift, 1.0));
  float bulge = sqrt(max(H - 0.5, 0.0)) * P_bulge;
  float thick = clamp(bulge + max(-f, 0.0) * contain * 1.2, 0.0, 1.0);

  float la = P_angle * PI / 180.0;
  vec3 L = normalize(vec3(cos(la), sin(la), 0.8));
  vec3 Hv = normalize(L + vec3(0.0, 0.0, 1.0));
  float ndl = clamp(dot(n, L), 0.0, 1.0);
  float ndh = clamp(dot(n, Hv), 0.0, 1.0);
  float spec = pow(ndh, 232.0) * 1.7 + pow(ndh, 32.0) * 0.25 + smoothstep(0.992, 0.999, ndh) * 1.9;
  spec += pow(1.0 - clamp(n.z, 0.0, 1.0), 5.0) * 0.25;
  vec3 goo = toLinear(C_color.rgb);
  vec3 sss = goo * P_translucency * exp(-2.0 * (1.0 - thick)) * (ndl * 0.5 + 0.5);
  vec3 body = goo * (0.25 + ndl * 0.7);
  vec3 rgb = body + sss + vec3(spec * P_wetness);
  return vec4(toDisplay(rgb), C_color.a);
}
`
};
