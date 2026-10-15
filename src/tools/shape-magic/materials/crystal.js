export default {
  id: 'crystal',
  name: 'Crystal',
  kind: 'shape',
  group: 'glass',
  source: 'shaders.com',
  animated: false,
  outside: false,
  surface: 'bevel',
  params: [
    { name: 'tint', label: 'Tint', type: 'color', default: '#ffffff' },
    {
      name: 'backdrop',
      label: 'Backdrop',
      type: 'select',
      options: [
        { value: 0, label: 'Artboard' },
        { value: 1, label: 'Studio' },
        { value: 2, label: 'Checker' }
      ],
      default: 0
    },
    { name: 'facets', label: 'Facets', type: 'number', min: 3, max: 24, step: 1, default: 5 },
    { name: 'bevel', label: 'Bevel', type: 'number', min: 0.04, max: 0.7, step: 0.01, default: 0.3 },
    { name: 'refraction', label: 'Refraction', type: 'number', min: 0, max: 3, step: 0.01, default: 1.2 },
    { name: 'dispersion', label: 'Dispersion', type: 'number', min: 0, max: 2, step: 0.01, default: 0.5 },
    { name: 'highlights', label: 'Highlights', type: 'number', min: 0, max: 2, step: 0.01, default: 0.35 },
    { name: 'shadows', label: 'Shadows', type: 'number', min: 0, max: 1, step: 0.01, default: 0.3 },
    { name: 'brightness', label: 'Brightness', type: 'number', min: 0.5, max: 3, step: 0.01, default: 0.9 },
    { name: 'angle', label: 'Light angle', type: 'number', min: 0, max: 360, step: 1, default: 270 }
  ],
  glsl: `
uint m_rotl(uint x, uint k) {
  return (x << k) | (x >> (32u - k));
}

float m_mx(ivec2 c, uint z) {
  uint s0 = 3735928584u;
  uint a = s0 + uint(c.x);
  uint b = s0 + uint(c.y);
  uint h = s0 + z;
  h ^= b;
  h -= m_rotl(b, 14u);
  a ^= h;
  a -= m_rotl(h, 11u);
  b ^= a;
  b -= m_rotl(a, 25u);
  h ^= b;
  h -= m_rotl(b, 16u);
  a ^= h;
  a -= m_rotl(h, 4u);
  b ^= a;
  b -= m_rotl(a, 14u);
  h ^= b;
  h -= m_rotl(b, 24u);
  return float(h) / 4294967295.0;
}

vec4 m_cells(vec2 p) {
  vec2 fl = floor(p);
  ivec2 i = ivec2(fl);
  vec2 f = p - fl;
  float d1 = 1e6;
  float d2 = 1e6;
  vec2 s1 = vec2(0.0);
  vec2 s2 = vec2(0.0);
  ivec2 id = i;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      ivec2 c = i + ivec2(x, y);
      vec2 sp = vec2(x, y) + vec2(m_mx(c, 0u), m_mx(c, 1u));
      vec2 k = sp - f;
      float dd = dot(k, k);
      if (dd < d1) {
        d2 = d1;
        s2 = s1;
        d1 = dd;
        s1 = sp;
        id = c;
      } else if (dd < d2) {
        d2 = dd;
        s2 = sp;
      }
    }
  }
  float edge = (d2 - d1) / max(2.0 * length(s2 - s1), 1e-4);
  return vec4(vec2(id), edge, 0.0);
}

vec2 m_dir(vec4 c) {
  float ang = m_mx(ivec2(c.xy), 2u) * TAU;
  return vec2(cos(ang), sin(ang));
}

vec2 m_fold(vec2 d, float sector) {
  float r = length(d);
  float th = atan(d.y, d.x) + PI;
  float inSector = fract(th / sector) * sector;
  float folded = min(inSector, sector - inSector);
  return vec2(r * cos(folded), r * sin(folded));
}

float m_rand(vec2 id, vec2 k) {
  return fract(sin(dot(id, k)) * 43758.5453);
}

float m_check(vec2 q, float w) {
  vec2 p = q / 0.06;
  vec2 f = vec2(w / 0.06 + 1e-3);
  vec2 i = 2.0 * (abs(fract((p - 0.5 * f) * 0.5) - 0.5) - abs(fract((p + 0.5 * f) * 0.5) - 0.5)) / f;
  return 0.5 - 0.5 * i.x * i.y;
}

float m_lobe(vec2 v, vec2 c, float r) {
  return 1.0 - smoothstep(r * 0.2, r, length(v - c));
}

vec3 m_studio(vec2 v, vec2 l) {
  vec2 side = vec2(-l.y, l.x);
  vec3 c = vec3(0.42 + 0.3 * smoothstep(-0.6, 0.8, -v.y));
  c *= 1.0 - 0.8 * m_lobe(v, -l * 0.55, 0.34);
  c *= 1.0 - 0.6 * m_lobe(v, side * 0.62, 0.22);
  c += vec3(1.4) * m_lobe(v, l * 0.5, 0.26);
  c += vec3(0.6) * m_lobe(v, -side * 0.6 + l * 0.2, 0.2);
  return c;
}

vec4 m_behind(vec2 q, vec2 v, vec2 l, float w) {
  if (P_backdrop > 1.5) {
    return vec4(toLinear(vec3(mix(0.8, 0.6, m_check(q, w)))), 1.0);
  }
  float open = 0.62 + 0.3 * smoothstep(0.05, 0.6, length(v));
  vec4 st = vec4(m_studio(v, l) * open, open);
  if (P_backdrop > 0.5) return st;
  vec4 b = backdropAt(q);
  return vec4(toLinear(b.rgb) * b.a, b.a) + st * (1.0 - b.a);
}

vec4 material(Surface s) {
  if (s.d > 0.02) return vec4(0.0);
  float bw = max(P_bevel, 1e-3);
  vec2 g = s.n * min(s.slope, 1.0);
  vec2 pd = s.p * 0.5;
  float sdf = s.d * 0.5;
  float depthNorm = clamp(-s.d / bw, 0.0, 1.0);
  float rNorm = length(pd) / 0.35;
  float a = radians(P_angle);
  vec2 l = vec2(cos(a), sin(a));
  vec3 L = normalize(vec3(l, -0.75));
  vec3 H = normalize(L + vec3(0.0, 0.0, -1.0));
  vec3 L2 = normalize(vec3(-l.y, l.x, -0.4));
  vec3 H2 = normalize(L2 + vec3(0.0, 0.0, -1.0));

  float sector = TAU / max(P_facets, 1.0);
  vec2 fUv = m_fold(pd, sector);
  float vScale = P_facets * 1.2 * (1.0 + clamp(rNorm, 0.0, 1.0) * 0.6);
  vec4 c0 = m_cells(vec2(0.0));

  float cpx = s.px * 0.5 * vScale;
  vec2 p1 = fUv * vScale;
  vec4 c1 = m_cells(p1);
  vec2 n1 = m_dir(c1);
  float table = (all(equal(c1.xy, c0.xy)) ? 1.0 : 0.0) * (1.0 - smoothstep(0.3, 0.45, rNorm));
  float tableSuppress = 1.0 - table * 0.9;
  float bevelSlope = (1.0 - smoothstep(0.0, 1.0, depthNorm)) * 1.7 * (1.0 - table);
  vec3 nSurf = normalize(vec3(g * bevelSlope, -1.0));
  float grazing = 1.0 - clamp(-nSurf.z, 0.0, 1.0);
  float seam1 = smoothstep(0.0, 0.05 + cpx * 1.5, c1.z);
  float cellRand = m_rand(floor(p1), vec2(12.9898, 78.233));
  vec3 nF1 = normalize(nSurf + vec3(n1 * 0.55 * tableSuppress, 0.0));
  float ndlS = dot(nSurf, L);
  float ndl1 = (dot(nF1, L) - ndlS) * 2.2;

  vec2 p2 = fUv * vScale * 1.7 + vec2(3.7, 1.2);
  vec4 c2 = m_cells(p2);
  vec2 n2 = m_dir(c2);
  vec3 nF2 = normalize(nSurf + vec3(n2 * 0.4 * tableSuppress, 0.0));
  float ndl2 = (dot(nF2, L2) - dot(nSurf, L2)) * 2.2;

  float amp = clamp(P_refraction * 0.8, 0.0, 1.6);
  vec3 nRefr = normalize(nSurf + vec3(n1 * 0.75 * amp * tableSuppress, 0.0) + vec3(n2 * 0.55 * amp, 0.0));
  vec3 refr = refract(vec3(0.0, 0.0, 1.0), nRefr, 1.0 / (1.0 + P_refraction * 0.55));
  vec2 bend = refr.xy / max(refr.z, 0.25);

  float thickEff = clamp(-sdf, 0.0, 0.12) * 1.6;
  float offMag = thickEff * (0.55 + cellRand * 0.9);
  vec2 halo = -g * P_refraction * 0.15 * 0.4 * (1.0 - smoothstep(0.0, 1.0, depthNorm));
  vec2 off = (bend * offMag + halo) * 2.0;

  vec3 nBack = normalize(vec3(n2 * 0.7, -1.0));
  vec3 bounce = reflect(refr, nBack);
  vec2 bounceOff = bounce.xy / max(abs(bounce.z), 0.3) * thickEff * 0.8 * 2.0;
  float innerW = (grazing * 0.5 + 0.18) * (cellRand * 0.7 + 0.3);

  vec2 pb = pd + bend * thickEff * 1.2;
  vec2 p3 = m_fold(pb, sector) * vScale * 1.4 + vec2(9.1, 4.7);
  vec4 c3 = m_cells(p3);
  vec2 n3 = m_dir(c3);
  float cellRand3 = m_rand(floor(p3), vec2(31.727, 57.131));
  float w3 = clamp(thickEff * 2.5, 0.0, 1.0) * clamp(P_refraction * 1.2, 0.0, 1.0);
  float wedgeLit = dot(n3, l) * 0.5 + 0.5;
  float mosaicLevel = (cellRand3 * 0.9 + 0.55) * (wedgeLit * 0.7 + 0.65);
  float edge3 = smoothstep(0.0, 0.05 + cpx * 2.5, c3.z) * 0.45 + 0.55;
  float mosaicMul = mosaicLevel * edge3;
  float mosaicFire = smoothstep(0.75, 1.0, wedgeLit * (cellRand3 + 0.4)) * w3 * 0.8;

  vec2 lens = s.p / 1.5 + off;

  float lit1 = clamp(ndl1, 0.0, 1.0);
  float shadow1 = clamp(-ndl1, 0.0, 1.0);
  float bright1 = max(1.0 + lit1 * P_highlights - shadow1 * P_shadows, 0.02);
  float lit2 = clamp(ndl2, 0.0, 1.0);
  float shadow2 = clamp(-ndl2, 0.0, 1.0);
  float bright2 = 1.0 + lit2 * P_highlights * 0.5 - shadow2 * P_shadows * 0.5;
  float surfBright = 1.0 + clamp(ndlS, 0.0, 1.0) * P_highlights * 0.4 - clamp(-ndlS, 0.0, 1.0) * P_shadows * 0.6;
  float combined = bright1 * bright2 * surfBright;

  vec2 chr = off * P_dispersion * 0.12;
  float edgeDarken = mix(seam1, 1.0, table) * 0.4 + 0.6;
  float facetMul = (combined + table * 0.25) * edgeDarken * mix(1.0, mosaicMul, w3) * P_brightness;
  float ndh1 = clamp(dot(nF1, H), 0.0, 1.0);
  float ndh2 = clamp(dot(nF2, H2), 0.0, 1.0);
  float flash = (pow(ndh1, 110.0) * 2.2 + pow(ndh2, 56.0) * 0.9 + smoothstep(0.965, 0.995, ndh1) * 3.0 + mosaicFire) * P_highlights * P_brightness;
  float fresnel = pow(grazing, 3.75) * 0.05 * 2.0;

  float w = s.px;
  vec2 v = off / 0.2;
  vec2 cv = v * P_dispersion * 0.12;
  vec4 tR = m_behind(lens + chr, v + cv, l, w);
  vec4 tG = m_behind(lens, v, l, w);
  vec4 tB = m_behind(lens - chr, v - cv, l, w);
  vec4 tI = m_behind(lens + bounceOff, (off + bounceOff) / 0.2, l, w);
  vec4 primary = vec4(tR.r, tG.g, tB.b, tG.a);
  vec4 body = mix(primary, tI, innerW);
  body.rgb *= facetMul * toLinear(C_tint.rgb);
  float light = flash + fresnel;
  vec4 col = body + vec4(vec3(light), light);
  col.a = clamp(col.a, 0.0, 1.0);
  return vec4(toDisplay(col.rgb / max(col.a, 1e-4)), col.a);
}
`
};
