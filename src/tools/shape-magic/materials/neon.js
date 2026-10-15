export default {
  id: 'neon',
  name: 'Neon',
  kind: 'shape',
  group: 'light',
  source: 'shaders.com',
  animated: true,
  outside: true,
  normals: false,
  surface: 0.05,
  params: [
    { name: 'color', label: 'Tube', type: 'color', default: '#00ddff' },
    { name: 'shade', label: 'Shade', type: 'color', default: '#2f6bff' },
    { name: 'glowColor', label: 'Glow', type: 'color', default: '#00ddff' },
    { name: 'twoTone', label: 'Two-tone', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { name: 'width', label: 'Tube width', type: 'number', min: 0.006, max: 0.1, step: 0.001, default: 0.02 },
    { name: 'intensity', label: 'Brightness', type: 'number', min: 0.5, max: 4, step: 0.01, default: 1.5 },
    { name: 'core', label: 'Hot core', type: 'number', min: 0, max: 1, step: 0.01, default: 0.6 },
    { name: 'glow', label: 'Glow strength', type: 'number', min: 0, max: 2, step: 0.01, default: 0.6 },
    { name: 'glowSize', label: 'Glow size', type: 'number', min: 0.05, max: 1, step: 0.01, default: 0.25 },
    { name: 'angle', label: 'Light angle', type: 'number', min: 0, max: 360, step: 1, default: 300 },
    { name: 'corners', label: 'Corner rounding', type: 'number', min: 0, max: 1, step: 0.01, default: 0.15 },
    { name: 'flicker', label: 'Flicker', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { name: 'flow', label: 'Flow', type: 'number', min: 0, max: 1, step: 0.01, default: 0.3 },
    { name: 'speed', label: 'Speed', type: 'number', min: 0, max: 5, step: 0.1, default: 0.6 }
  ],
  glsl: `
float m_flicker(float t, float amount) {
  float c = sin(t * 17.13) + sin(t * 31.71) * 0.5 + sin(t * 47.29) * 0.3;
  float th = mix(-2.0, 0.8, amount);
  return smoothstep(th - 0.1, th + 0.1, c);
}

vec4 material(Surface s) {
  float tube = P_width * 0.5;
  float eps = 0.008 + P_corners * 0.03;
  float glowR = max(P_glowSize, 0.001);
  float reach = glowR * 0.56;
  float e2 = eps * 2.0;
  if (s.d > reach + e2 + s.aa) return vec4(0.0);
  if (s.d < -(P_width + e2 * 2.0 + s.aa * 2.0)) return vec4(0.0);

  float t = s.time * P_speed;
  float pxH = s.px * 0.5;
  float softPx = max(pxH, 0.004);

  float sC = s.d * 0.5;
  float sR = shapeAt(s.p + vec2(e2, 0.0)) * 0.5;
  float sL = shapeAt(s.p - vec2(e2, 0.0)) * 0.5;
  float sU = shapeAt(s.p + vec2(0.0, e2)) * 0.5;
  float sD = shapeAt(s.p - vec2(0.0, e2)) * 0.5;

  vec2 g = vec2(sR - sL, sU - sD) / (eps * 2.0);
  float sdf = mix(sC, (sC + sR + sL + sU + sD) / 5.0, P_corners);
  vec2 gn = g / max(length(g), 0.0001);

  float depth = clamp(-sdf / max(tube, 0.001), 0.0, 1.0);
  float inner = smoothstep(tube + softPx, tube - softPx, -sdf);
  float outer = smoothstep(softPx, -softPx, sdf);
  float tubeMask = outer * inner;

  float cz = sqrt(max(depth * (2.0 - depth), 0.0));
  vec3 n = vec3(gn * (1.0 - depth), cz);

  float a = radians(P_angle);
  vec3 L = normalize(vec3(cos(a), sin(a), 0.7));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float diffuse = clamp(dot(n, L), 0.0, 1.0);
  float shininess = exp2(8.0 - 0.5 * 7.0);
  float spec = pow(clamp(dot(n, H), 0.0, 1.0), shininess) * 0.5;

  float ang = atan(s.p.y, s.p.x);
  float flow = mix(1.0, sin(ang * 2.0 + t) * 0.5 + 0.5, P_flow);

  vec3 color = toLinear(C_color.rgb);
  vec3 shade = toLinear(C_shade.rgb);
  vec3 base = mix(color, mix(shade, color, diffuse), P_twoTone);
  vec3 tubeRgb = base * (0.12 + diffuse * 0.55 + cz * 0.35) + spec;
  float hot = smoothstep(0.55, 1.0, depth) * P_core * flow;
  tubeRgb = mix(tubeRgb, mix(color, vec3(1.0), 0.75), hot);
  tubeRgb *= mix(1.0, flow, 0.4);

  float so = max(sdf, 0.0);
  float glow = (exp(-so * 12.0 / glowR) * 0.7 + exp(-so * 4.0 / glowR) * 0.35) * P_glow;
  glow *= smoothstep(-0.003, 0.003, sdf);
  glow *= 1.0 - smoothstep(0.35, 1.0, s.d / reach);

  float level = P_intensity * m_flicker(t, P_flicker);
  vec3 tubeLit = tubeRgb * level;
  vec3 glowLit = toLinear(C_glowColor.rgb) * glow * level;
  float glowA = clamp(glow * 0.6, 0.0, 1.0);
  vec3 rgb = mix(glowLit, tubeLit, tubeMask);
  float alpha = max(tubeMask, glowA);

  vec3 shown = toDisplay(clamp(rgb * alpha, 0.0, 1.0));
  float outA = max(alpha, max(shown.r, max(shown.g, shown.b)));
  return vec4(shown / max(outA, 1e-4), outA);
}
`
};
