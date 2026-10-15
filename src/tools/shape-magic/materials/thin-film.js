export default {
  id: 'thin-film',
  name: 'Thin film',
  kind: 'shape',
  group: 'glass',
  source: 'shaders.com',
  animated: true,
  outside: false,
  surface: 'width',
  params: [
    {
      name: 'palette',
      label: 'Palette',
      type: 'select',
      options: [
        { value: 0, label: 'Rainbow' },
        { value: 1, label: 'Custom' }
      ],
      default: 0
    },
    {
      name: 'colors',
      label: 'Colors',
      type: 'colorArray',
      default: ['#2b6fff', '#ffffff', '#ff7a21'],
      minItems: 2,
      maxItems: 5
    },
    { name: 'width', label: 'Rim width', type: 'number', min: 0.04, max: 0.7, step: 0.01, default: 0.35 },
    { name: 'intensity', label: 'Intensity', type: 'number', min: 0, max: 2, step: 0.01, default: 1 },
    { name: 'thickness', label: 'Film thickness', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { name: 'dispersion', label: 'Dispersion', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { name: 'saturation', label: 'Saturation', type: 'number', min: 0, max: 1, step: 0.01, default: 1 },
    { name: 'hue', label: 'Hue shift', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { name: 'angle', label: 'Light angle', type: 'number', min: 0, max: 360, step: 1, default: 300 },
    { name: 'speed', label: 'Speed', type: 'number', min: -1, max: 1, step: 0.01, default: 0.1 }
  ],
  glsl: `
vec3 m_oklab(vec3 c) {
  vec3 lms = mat3(0.4122214708, 0.2119034982, 0.0883024619, 0.5363325363, 0.6806995451, 0.2817188376, 0.0514459929, 0.1073969566, 0.6299787005) * c;
  lms = pow(max(lms, 0.0), vec3(1.0 / 3.0));
  return mat3(0.2104542553, 1.9779984951, 0.0259040371, 0.7936177850, -2.4285922050, 0.7827717662, -0.0040720468, 0.4505937099, -0.8086757660) * lms;
}

vec3 m_linear(vec3 lab) {
  vec3 lms = mat3(1.0, 1.0, 1.0, 0.3963377774, -0.1055613458, -0.0894841775, 0.2158037573, -0.0638541728, -1.2914855480) * lab;
  lms = lms * lms * lms;
  return mat3(4.0767416621, -1.2684380046, -0.0041960863, -3.3077115913, 2.6097574011, -0.7034186147, 0.2309699292, -0.3413193965, 1.7076147010) * lms;
}

vec3 m_custom(float phase) {
  float n = max(N_colors, 1.0);
  float t = fract(phase) * n;
  float i = floor(t);
  float f = t - i;
  int a = int(i);
  int b = int(mod(i + 1.0, n));
  vec3 ca = m_oklab(toLinear(C_colors(a).rgb));
  vec3 cb = m_oklab(toLinear(C_colors(b).rgb));
  return max(m_linear(mix(ca, cb, f)), 0.0);
}

vec4 material(Surface s) {
  if (s.d > 0.02) return vec4(0.0);
  float bw = max(P_width, 1e-3);
  float xb = clamp(1.0 + s.d / bw, 0.0, 1.0);
  float xw = clamp(1.0 + s.d / 0.7, 0.0, 1.0) * 0.72;
  float x = min(pow(pow(xb, 4.0) + pow(xw, 4.0), 0.25), 0.995);
  float cosView = sqrt(1.0 - x * x);
  float rim = pow(1.0 - cosView, 1.5);
  float halfChord = 0.5 * bw * sqrt(max(1.0 - x * x, 0.0));

  float a = radians(P_angle);
  vec2 l = vec2(cos(a), sin(a));
  vec2 n = s.n * smoothstep(0.0, 0.6, s.slope);
  float baseCos = dot(n, l);
  float baseSin = n.y * l.x - n.x * l.y;
  float theta = s.time * P_speed * TAU;
  float rotated = baseCos * cos(theta) + baseSin * sin(theta);
  float phase = P_hue + P_dispersion * rotated + P_thickness * halfChord * 10.0;

  vec3 film = P_palette > 0.5
    ? m_custom(phase)
    : cos((phase + vec3(0.0, 0.3333, 0.6667)) * TAU) * 0.5 + 0.5;
  vec3 col = mix(vec3(1.0), film, P_saturation) * P_intensity;
  float alpha = clamp(rim, 0.0, 1.0);
  vec3 shown = toDisplay(col * rim * alpha) / max(alpha, 1e-4);
  return vec4(shown, alpha);
}
`
};
