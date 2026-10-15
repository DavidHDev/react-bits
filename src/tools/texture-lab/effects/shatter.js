const SHADER = `
uniform float uPattern;
uniform vec2 uImpact;
uniform float uSpokes;
uniform float uRing;
uniform float uGrowth;
uniform float uShard;
uniform float uDisplace;
uniform float uTilt;
uniform float uCracks;
uniform float uWidth;
uniform float uSpread;
uniform float uDrift;
uniform float uSway;
uniform float uWave;
uniform float uSeed;

struct Shard {
  vec2 center;
  float id;
  float edge;
  vec2 normal;
};

vec2 mirrorUv(vec2 uv) {
  return 1.0 - abs(1.0 - abs(uv));
}

vec3 photo(vec2 p) {
  return toLinear(texture(uInput, mirrorUv(vec2(p.x / uResolution.x, 1.0 - p.y / uResolution.y))).rgb);
}

float spokeJitter(float i) {
  return (hash11(mod(i, uSpokes) * 1.731 + uSeed * 0.37 + 0.11) - 0.5) * 0.7;
}

float spokeAngle(float i) {
  return (i + spokeJitter(i)) / uSpokes * TAU - PI;
}

float ringRadius(float i, float j) {
  return uRing * pow(uGrowth, j) * (1.0 + 0.36 * (hash12(vec2(mod(i, uSpokes) * 1.37, j * 2.11) + uSeed * 0.19) - 0.5));
}

Shard impact(vec2 p) {
  vec2 v = p - uImpact;
  float r = length(v);
  float a = (atan(v.y, v.x) + PI) / TAU * uSpokes;
  float k = floor(a);
  float s = k;
  if (a < k + spokeJitter(k)) s = k - 1.0;
  else if (a >= k + 1.0 + spokeJitter(k + 1.0)) s = k + 1.0;
  float a0 = spokeAngle(s);
  float a1 = spokeAngle(s + 1.0);
  vec2 d0 = vec2(cos(a0), sin(a0));
  vec2 d1 = vec2(cos(a1), sin(a1));
  vec2 perp0 = v - d0 * dot(v, d0);
  vec2 perp1 = v - d1 * dot(v, d1);
  float edge = length(perp0);
  vec2 normal = perp0 / max(edge, 1e-4);
  if (length(perp1) < edge) {
    edge = length(perp1);
    normal = perp1 / max(edge, 1e-4);
  }
  float sector = mod(s, uSpokes);
  float band = -1.0;
  for (int t = 0; t < 14; t++) {
    float j = float(t);
    if (hash12(vec2(sector * 3.1 + 0.5, j * 1.7) + uSeed * 0.71) < 0.2) continue;
    vec2 p0 = uImpact + d0 * ringRadius(s, j);
    vec2 p1 = uImpact + d1 * ringRadius(s + 1.0, j);
    vec2 dir = normalize(p1 - p0);
    vec2 n = vec2(dir.y, -dir.x);
    if (dot(n, p0 - uImpact) < 0.0) n = -n;
    float dist = dot(p - p0, n);
    if (dist > 0.0) band = j;
    if (abs(dist) < edge) {
      edge = abs(dist);
      normal = n * sign(dist);
    }
  }
  float inner = band < 0.0 ? 0.0 : ringRadius(s, band);
  float outer = ringRadius(s, band + 1.0);
  float mid = 0.5 * (a0 + a1);
  vec2 center = uImpact + vec2(cos(mid), sin(mid)) * 0.5 * (inner + outer);
  return Shard(center, hash12(vec2(sector * 0.731, band * 1.93) + uSeed * 0.53), edge, normal);
}

Shard splits(vec2 p) {
  vec2 c = 0.5 * uResolution;
  float extent = length(uResolution) * 0.5;
  float id = 1.0;
  float edge = 1e9;
  vec2 normal = vec2(0.0, 1.0);
  float angle = hash11(uSeed * 0.13 + 0.3) * PI;
  for (int i = 0; i < 12; i++) {
    if (extent < uShard) break;
    vec3 h = hash32(vec2(id * 0.7183 + 0.37, uSeed * 0.29 + 1.3));
    angle += PI * 0.5 + (h.x - 0.5) * 1.5;
    vec2 n = vec2(cos(angle), sin(angle));
    vec2 o = c + (h.yz - 0.5) * extent * 0.7;
    float d = dot(p - o, n);
    float side = d >= 0.0 ? 1.0 : -1.0;
    id = id * 2.0 + max(side, 0.0);
    if (abs(d) < edge) {
      edge = abs(d);
      normal = n * side;
    }
    c = o + n * side * extent * 0.3;
    extent *= 0.74;
  }
  return Shard(c, hash11(id * 0.1371 + uSeed * 0.77), edge, normal);
}

Shard crackle(vec2 p) {
  vec2 x = p / uShard;
  vec2 n = floor(x);
  vec2 f = fract(x);
  vec2 mg = vec2(0.0);
  vec2 mr = vec2(0.0);
  float md = 8.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 r = g + 0.5 + 0.8 * (hash22(n + g + uSeed * 7.1) - 0.5) - f;
      float d = dot(r, r);
      if (d < md) {
        md = d;
        mr = r;
        mg = g;
      }
    }
  }
  md = 8.0;
  vec2 normal = vec2(0.0, 1.0);
  for (int j = -2; j <= 2; j++) {
    for (int i = -2; i <= 2; i++) {
      vec2 g = mg + vec2(float(i), float(j));
      vec2 r = g + 0.5 + 0.8 * (hash22(n + g + uSeed * 7.1) - 0.5) - f;
      vec2 e = r - mr;
      if (dot(e, e) < 1e-5) continue;
      float d = dot(0.5 * (mr + r), normalize(e));
      if (d < md) {
        md = d;
        normal = -normalize(e);
      }
    }
  }
  return Shard((x + mr) * uShard, hash12(n + mg + uSeed * 3.3), md * uShard, normal);
}

void main() {
  vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uResolution;
  Shard sh;
  if (uPattern < 0.5) sh = impact(p);
  else if (uPattern < 1.5) sh = splits(p);
  else sh = crackle(p);

  vec3 h = hash32(vec2(sh.id * 97.1 + 0.3, sh.id * 13.7 + 2.0));
  vec3 g = hash32(vec2(sh.id * 51.3 + 7.0, sh.id * 3.1 + 0.9));
  float phase = h.z * TAU;
  vec2 sway = vec2(sin(uDrift * (0.6 + 0.5 * g.z) + phase), cos(uDrift * (0.5 + 0.4 * h.x) + phase * 1.3));
  float angle = (h.z - 0.5) * 0.08 * uWave + sway.x * 0.012 * uSway;
  vec2 offset = (h.xy - 0.5) * 2.0 * uDisplace + sway * uSway * (uDisplace * 0.35 + uWidth * 2.0);
  float zoom = 1.0 + (g.x - 0.5) * 0.06 * uWave;
  vec2 src = sh.center + rotation(angle) * (p - sh.center) * zoom + offset;

  vec2 tiltXY = (g.xy - 0.5) * 0.9 * uTilt * (uPattern > 1.5 ? 0.4 : 1.0) + sway * 0.08 * uTilt * uSway;
  float near = exp(-sh.edge / (uWidth * 4.0 + 2.0));
  vec2 fringe = (sh.normal * (1.0 + 6.0 * near) + (g.yx - 0.5) * 5.0) * uSpread;
  vec3 color = vec3(photo(src - fringe).r, photo(src).g, photo(src + fringe).b);

  vec3 normal = normalize(vec3(tiltXY, 1.0));
  vec3 L = normalize(vec3(-0.5, -0.65, 0.75));
  float diffuse = dot(normal, L) / L.z;
  color *= max(1.0 + (diffuse - 1.0) * 1.6, 0.2);
  float spec = pow(max(dot(reflect(-L, normal), vec3(0.0, 0.0, 1.0)), 0.0), 90.0);
  color += vec3(spec) * uTilt * 0.7;

  vec2 lightDir = normalize(vec2(-0.6, -0.8));
  float facing = -dot(sh.normal, lightDir);
  float streak = smoothstep(0.25, 0.75, valueNoise(p / (uWidth * 22.0) + sh.id * 7.0));
  float strength = uCracks * mix(0.35, 1.0, streak);
  float centerFade = 1.0;
  if (uPattern < 0.5) centerFade = smoothstep(uRing * 0.12, uRing * 0.45, length(p - uImpact));
  strength *= centerFade;
  float bevel = exp(-sh.edge / (uWidth * 0.9 + 0.6));
  color *= 1.0 + bevel * facing * strength * 0.45;
  float aa = 0.8;
  float core = 1.0 - smoothstep(uWidth * 0.5 - aa, uWidth * 0.5 + aa, sh.edge);
  float shadow = (1.0 - smoothstep(uWidth * 0.5, uWidth * 1.6 + 1.0, sh.edge)) * step(0.0, -facing);
  color *= 1.0 - shadow * strength * 0.35;
  vec3 crack = mix(color, vec3(1.0), 0.7) + 0.12;
  color = mix(color, crack, core * strength);

  if (uPattern < 0.5) {
    float r = length(p - uImpact);
    float crush = 1.0 - smoothstep(uRing * 0.1, uRing * 0.5, r + (valueNoise(p / (uWidth * 3.0)) - 0.5) * uRing * 0.25);
    float flecks = smoothstep(0.55, 0.8, valueNoise(p / max(uWidth * 1.2, 1.0) + uSeed));
    flecks += 0.5 * smoothstep(0.6, 0.9, valueNoise(p / max(uWidth * 3.0, 1.0) + 9.0));
    vec3 powder = mix(color, vec3(0.92), 0.55) + flecks * 0.35;
    color = mix(color, powder, crush * uCracks);
  }

  outColor = vec4(toGamma(color), 1.0);
}`;

const PATTERNS = { impact: 0, shards: 1, crackle: 2 };

export default {
  id: 'shatter',
  name: 'Shatter',
  category: 'glass',
  blend: 'normal',
  description: 'The picture cracked into sharp glass shards that shift and catch the light.',
  animated: true,
  animates: params => params.drift > 0,
  params: [
    {
      key: 'pattern',
      label: 'Pattern',
      type: 'select',
      default: 'impact',
      options: [
        { value: 'impact', label: 'Impact' },
        { value: 'shards', label: 'Shards' },
        { value: 'crackle', label: 'Crackle' }
      ]
    },
    {
      key: 'x',
      label: 'Impact horizontal',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.5,
      when: params => params.pattern === 'impact'
    },
    {
      key: 'y',
      label: 'Impact vertical',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.42,
      when: params => params.pattern === 'impact'
    },
    { key: 'size', label: 'Shard size', type: 'number', min: 20, max: 200, step: 1, default: 70 },
    { key: 'displacement', label: 'Displacement', type: 'number', min: 0, max: 1, step: 0.01, default: 0.35 },
    { key: 'tilt', label: 'Tilt', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'cracks', label: 'Crack lines', type: 'number', min: 0, max: 1, step: 0.01, default: 0.7 },
    { key: 'dispersion', label: 'Rainbow edges', type: 'number', min: 0, max: 1, step: 0.01, default: 0.3 },
    { key: 'drift', label: 'Drift', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { key: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 0 }
  ],
  render(ctx, input, params) {
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const size = params.size * ctx.unit;
    return ctx.pass('shatter', SHADER, {
      input: source,
      uniforms: {
        uPattern: PATTERNS[params.pattern] ?? 0,
        uImpact: [params.x * ctx.width, params.y * ctx.height],
        uSpokes: Math.round(Math.min(34, Math.max(8, 1100 / params.size))),
        uRing: size * 0.5,
        uGrowth: 1.42,
        uShard: params.pattern === 'crackle' ? size * 0.24 : size * 1.4,
        uDisplace: params.displacement * (params.pattern === 'crackle' ? 10 : 26) * ctx.unit,
        uTilt: params.tilt,
        uCracks: params.cracks,
        uWidth: Math.max(1, 1.6 * ctx.unit),
        uSpread: params.dispersion * 1.6 * ctx.unit,
        uDrift: ctx.time * (0.6 + params.drift),
        uSway: params.drift,
        uWave: params.displacement,
        uSeed: params.variation
      }
    });
  }
};
