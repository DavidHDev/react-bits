export default {
  id: 'light-edge',
  name: 'Light edge',
  kind: 'shape',
  group: 'light',
  source: 'shaders.com',
  animated: true,
  outside: true,
  normals: false,
  surface: 0.1,
  params: [
    {
      name: 'colors',
      label: 'Colors',
      type: 'colorArray',
      default: ['#2f6bff', '#00e0ff', '#bdf6ff'],
      minItems: 1,
      maxItems: 6
    },
    { name: 'thickness', label: 'Thickness', type: 'number', min: 0.01, max: 1, step: 0.01, default: 0.25 },
    { name: 'softness', label: 'Softness', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { name: 'intensity', label: 'Intensity', type: 'number', min: 0, max: 1, step: 0.01, default: 0.6 },
    { name: 'bloom', label: 'Bloom', type: 'number', min: 0, max: 1, step: 0.01, default: 0.3 },
    { name: 'spots', label: 'Spots', type: 'number', min: 1, max: 5, step: 1, default: 3 },
    { name: 'spotSize', label: 'Spot size', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { name: 'pulse', label: 'Pulse', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { name: 'smoke', label: 'Smoke', type: 'number', min: 0, max: 1, step: 0.01, default: 0.3 },
    { name: 'speed', label: 'Speed', type: 'number', min: 0, max: 4, step: 0.1, default: 1 },
    { name: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 0 }
  ],
  glsl: `
float m_hash12(vec2 p) {
  uvec2 u = floatBitsToUint(p * vec2(141421356.0, 2718281828.0));
  return float((u.x ^ u.y) * 3141592653u) / 4294967295.0;
}

vec2 m_hash22(vec2 p) {
  uvec2 u = floatBitsToUint(p * vec2(141421356.0, 2718281828.0));
  uint h = u.x ^ u.y;
  return vec2(float(h * 3141592653u), float(h * 1618033988u)) / 4294967295.0;
}

float m_value(vec2 p) {
  vec2 i = floor(p);
  vec2 f = p - i;
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(m_hash12(i), m_hash12(i + vec2(1.0, 0.0)), f.x),
    mix(m_hash12(i + vec2(0.0, 1.0)), m_hash12(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

vec4 material(Surface s) {
  float th = max(0.5 * P_thickness * 0.35, 0.002);
  float reach = max(th * 3.2, 0.14);
  if (s.d > reach) return vec4(0.0);
  float soft = P_softness;
  float anim = s.time * P_speed;
  float t = anim * 1.2 + 131.0;

  float bt = 0.18 * anim;
  float beat = clamp(pow(abs(sin(bt * TAU)), 10.0) + 0.6 * pow(abs(sin((bt - 0.15) * TAU)), 10.0), 0.0, 1.0);

  float depth = max(-s.d * 0.5, 0.0);
  float field = s.d > 0.0 ? s.d * 0.5 : -sqrt(depth * (0.7 - depth));
  float f = field + mix(th, 0.0, soft);
  float bd = abs(f);
  float borderTh = mix(th, 3.0 * th, soft);
  float aa = s.px;
  float e0 = min(mix(borderTh, -borderTh, soft), borderTh + aa);
  float e1 = max(mix(borderTh, -borderTh, soft), borderTh + aa);
  float border = 1.0 - smoothstep(e0, e1, bd);
  border = pow(clamp(border, 0.0, 1.0), 1.0 + soft);

  vec2 suv = s.p * 0.5 * 1.75;
  float drift = 0.5 * t;
  float n1 = m_value(suv * 2.7 + drift);
  float n2 = m_value(suv * 3.4 - drift);
  float smoke = clamp(3.0 * n1, 0.0, 1.0) - n2;
  float smokeTh = clamp(th + 0.2, 0.1, 0.4);
  float smokeBand = pow(clamp(1.0 - smoothstep(-smokeTh, smokeTh + aa, bd), 0.0, 1.0), 2.0);
  smoke *= smokeBand;
  smoke = 30.0 * smoke * smoke * (0.5 * P_smoke * P_smoke);
  smoke *= mix(1.0, beat, P_pulse);
  border = clamp(border + clamp(smoke, 0.0, 1.0), 0.0, 1.0);
  border *= 1.0 - smoothstep(reach * 0.55, reach, s.d);

  float angle01 = atan(s.p.y, s.p.x) / TAU;
  float boost = 1.0 + (1.0 + 4.0 * soft) * P_intensity;
  float seed = P_variation;

  vec3 mixed = vec3(0.0);
  float w = 0.0;
  float ba = 0.0;
  vec3 ac = vec3(0.0);
  float aacc = 0.0;
  for (int k = 0; k < 6; k++) {
    if (float(k) >= N_colors) break;
    float ci = float(k);
    float over = 0.0;
    float add = 0.0;
    for (int j = 0; j < 5; j++) {
      float sj = float(j);
      if (sj >= P_spots) break;
      vec2 rv = m_hash22(vec2(sj * 10.0 + 2.0 + seed * 7.31, 40.0 + ci + seed * 3.17));
      float sf = 0.1 + 0.15 * abs(sin(sj * (2.0 + ci)) * cos(sj * (2.0 + 2.5 * ci)));
      float dir = rv.y < 0.5 ? -1.0 : 1.0;
      float st = (sf * t + rv.x * 3.0) * dir;
      bool even = abs(ci - 2.0 * floor(ci * 0.5)) < 0.5;
      float wave = even ? sin(t + sj * (5.0 - 1.5 * ci)) : cos(t + sj * (3.0 + 1.3 * ci));
      float mask = 0.5 + 0.5 * wave;
      float pw = clamp(2.0 * P_pulse - rv.x, 0.0, 1.0);
      mask = mix(mask, beat, pw);
      float atg = fract(angle01 + st);
      float ss = 0.05 + 0.6 * P_spotSize * P_spotSize + 0.05 * rv.x;
      ss = mix(ss, 0.1, pw);
      float sector = smoothstep(0.5 - ss, 0.5, atg) * (1.0 - smoothstep(0.5, 0.5 + ss, atg));
      sector = clamp(sector * mask * border * boost, 0.0, 1.0);
      over += (1.0 - over) * sector;
      add += sector;
    }
    vec4 c = C_colors(k);
    vec3 lc = toLinear(c.rgb);
    float wn = c.a * over;
    float tt = wn / max(w + wn, 0.00001);
    mixed = mix(mixed, lc, tt);
    ba += (1.0 - ba) * wn;
    ac += lc * c.a * add;
    aacc += c.a * add;
    w += wn;
  }

  float kb = P_bloom * 4.0;
  vec3 accumC = mix(mixed * ba, ac, kb);
  float accumA = clamp(mix(ba, aacc, kb), 0.0, 1.0);
  vec3 straight = clamp(accumC / max(accumA, 0.0001), 0.0, 1.0);

  vec3 shown = toDisplay(straight * accumA);
  float outA = max(accumA, max(shown.r, max(shown.g, shown.b)));
  return vec4(shown / max(outA, 1e-4), outA);
}
`
};
