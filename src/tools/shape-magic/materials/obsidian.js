export default {
  id: 'obsidian',
  name: 'Obsidian',
  kind: 'shape',
  group: 'solid',
  source: 'shaders.com',
  animated: true,
  outside: false,
  surface: 0.15,
  params: [
    { name: 'body', label: 'Body color', type: 'color', default: '#06071a' },
    {
      name: 'colors',
      label: 'Iridescence',
      type: 'colorArray',
      default: ['#ff2f7a', '#2a2cff', '#5fe6ff', '#a6ffd8', '#ffb3e6'],
      minItems: 2,
      maxItems: 6
    },
    { name: 'bevel', label: 'Bevel', type: 'number', min: 0.02, max: 0.8, step: 0.01, default: 0.16 },
    { name: 'strength', label: 'Color strength', type: 'number', min: 0, max: 1.5, step: 0.01, default: 1 },
    { name: 'rimWidth', label: 'Rim width', type: 'number', min: 0, max: 1, step: 0.01, default: 0.55 },
    { name: 'rimSoftness', label: 'Rim softness', type: 'number', min: 0.02, max: 0.6, step: 0.01, default: 0.25 },
    { name: 'flowAngle', label: 'Flow angle', type: 'number', min: 0, max: 360, step: 1, default: 30 },
    { name: 'flowScale', label: 'Flow scale', type: 'number', min: 0.2, max: 4, step: 0.01, default: 1 },
    { name: 'gloss', label: 'Gloss', type: 'number', min: 0, max: 2, step: 0.01, default: 0.35 },
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

vec3 m_oklab(vec3 c) {
  vec3 lms = vec3(
    dot(c, vec3(0.4122214708, 0.5363325363, 0.0514459929)),
    dot(c, vec3(0.2119034982, 0.6806995451, 0.1073969566)),
    dot(c, vec3(0.0883024619, 0.2817188376, 0.6299787005))
  );
  lms = sign(lms) * pow(abs(lms), vec3(1.0 / 3.0));
  return vec3(
    dot(lms, vec3(0.2104542553, 0.7936177850, -0.0040720468)),
    dot(lms, vec3(1.9779984951, -2.4285922050, 0.4505937099)),
    dot(lms, vec3(0.0259040371, 0.7827717662, -0.8086757660))
  );
}

vec3 m_fromOklab(vec3 lab) {
  vec3 lms = vec3(
    lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z,
    lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z,
    lab.x - 0.0894841775 * lab.y - 1.2914855480 * lab.z
  );
  lms = lms * lms * lms;
  return vec3(
    dot(lms, vec3(4.0767416621, -3.3077115913, 0.2309699292)),
    dot(lms, vec3(-1.2684380046, 2.6097574011, -0.3413193965)),
    dot(lms, vec3(-0.0041960863, -0.7034186147, 1.7076147010))
  );
}

vec3 m_palette(float t) {
  float n = clamp(N_colors, 1.0, 6.0);
  if (n < 1.5) return m_lin(C_colors(0).rgb);
  float x = clamp(t, 0.0, 1.0) * (n - 1.0);
  float i = min(floor(x), n - 2.0);
  int k = int(i);
  vec3 a = m_oklab(m_lin(C_colors(k).rgb));
  vec3 b = m_oklab(m_lin(C_colors(k + 1).rgb));
  return max(m_fromOklab(mix(a, b, x - i)), 0.0);
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

float m_studio5(vec2 e, float keyRad, float str, float skyGain) {
  float sky = smoothstep(-0.7, 0.85, e.y);
  float lum = sky * sky * skyGain;
  lum += m_ss(keyRad, keyRad * 0.2, length(e - vec2(0.0, 0.55))) * 1.7 * str;
  lum += m_ss(keyRad * 1.15, keyRad * 0.23, length(e - vec2(-0.55, 0.18))) * 1.05 * str;
  lum += m_ss(keyRad, keyRad * 0.2, length(e - vec2(0.55, 0.1))) * str;
  lum += m_ss(keyRad * 1.3, keyRad * 0.26, length(e - vec2(0.2, -0.5))) * 0.7 * str;
  lum += m_ss(keyRad * 1.1, keyRad * 0.22, length(e - vec2(-0.35, -0.25))) * 0.85 * str;
  return lum;
}

vec4 material(Surface s) {
  if (s.d > max(0.02, 2.0 * s.aa)) return vec4(0.0);
  float t = s.time * P_speed + 3.0;
  vec2 dome = m_dome(s, P_bevel);
  vec3 n = vec3(s.n * dome.x, -sqrt(1.0 - dome.x * dome.x));
  vec3 view = normalize(vec3(s.p * 0.3, 1.0));
  float grazing = 1.0 - clamp(-dot(n, view), 0.0, 1.0);
  float rimEdge = 1.0 - P_rimWidth;
  float rim = smoothstep(rimEdge - P_rimSoftness, rimEdge + P_rimSoftness, grazing);
  float fa = radians(P_flowAngle);
  vec2 pat = (s.p + vec2(-0.7, 0.5) * dome.y) * 0.5;
  float along = dot(pat, vec2(cos(fa), sin(fa)));
  float phase = along * P_flowScale / 0.55 + grazing * 0.9 + t * 0.2;
  float m = mod(abs(phase), 2.0);
  vec3 iri = m_palette(m > 1.0 ? 2.0 - m : m);
  vec3 R = reflect(view, n);
  float shine = m_studio5(R.xy, 0.3, P_gloss, 0.25) * (0.04 + pow(grazing, 4.0) * 0.96);
  vec3 walls = mix(m_lin(C_body.rgb), iri, rim * P_strength);
  vec3 rgb = walls + mix(iri, vec3(1.0), 0.6) * shine * 0.5;
  return vec4(m_srgb(rgb), 1.0);
}
`
};
