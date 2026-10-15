const KEY = `
uniform float uKey;

float sortKey(vec3 c) {
  if (uKey < 0.5) return luma(c);
  vec3 hsv = rgb2hsv(clamp(c, 0.0, 1.0));
  if (uKey < 1.5) return hsv.x;
  return hsv.y;
}
`;

const SAMPLE = `
uniform vec2 uImage;
uniform vec2 uCenter;
uniform vec2 uAlong;
uniform vec2 uAcross;
uniform vec2 uExtent;
uniform vec2 uSpacing;
uniform vec2 uTaps;
uniform float uLow;
uniform float uHigh;
uniform float uRandom;
uniform float uSeed;

void main() {
  vec2 g = gl_FragCoord.xy * uSpacing - uExtent * 0.5;
  vec2 p = uCenter + uAlong * g.x + uAcross * g.y;
  vec3 color = vec3(0.0);
  for (int a = 0; a < 4; a++) {
    if (float(a) >= uTaps.x) break;
    for (int b = 0; b < 4; b++) {
      if (float(b) >= uTaps.y) break;
      vec2 o = ((vec2(a, b) + 0.5) / uTaps - 0.5) * uSpacing;
      color += texture(uInput, (p + uAlong * o.x + uAcross * o.y) / uImage).rgb;
    }
  }
  color /= uTaps.x * uTaps.y;
  float row = floor(gl_FragCoord.y);
  float jitter = (hash11(row * 0.6180339 + uSeed) - 0.5) * uRandom * 0.12;
  float l = luma(color) + jitter;
  bool inside = p.x >= 0.0 && p.y >= 0.0 && p.x <= uImage.x && p.y <= uImage.y;
  float flag = inside && l >= uLow && l <= uHigh ? 1.0 : 0.0;
  outColor = vec4(color, flag);
}`;

const SCAN_START = `
uniform float uPiece;
uniform float uRandom;
uniform float uSeed;
uniform float uPhase;

float piece(float i, float row) {
  float u = i / uPiece + uPhase;
  float ragged = hash11(row * 0.7548777 + uSeed * 1.3) * uRandom;
  float wander = valueNoise(vec2(u * 0.6 + uSeed, row * 0.045 + uSeed * 3.1)) * (1.0 - uRandom * 0.5);
  return floor(u + ragged + wander);
}

void main() {
  int i = int(gl_FragCoord.x);
  int row = int(gl_FragCoord.y);
  float best = -1.0;
  vec4 prev = i >= 8 ? texelFetch(uInput, ivec2(i - 8, row), 0) : vec4(0.0);
  float prevPiece = piece(float(i - 8), float(row));
  vec4 here = vec4(0.0);
  for (int k = 7; k >= 0; k--) {
    int x = i - k;
    if (x < 0) continue;
    vec4 cur = texelFetch(uInput, ivec2(x, row), 0);
    float pc = piece(float(x), float(row));
    bool joined = x > 0 && cur.a > 0.5 && prev.a > 0.5 && pc == prevPiece;
    if (!joined) best = float(x);
    prev = cur;
    prevPiece = pc;
    if (k == 0) here = cur;
  }
  outColor = vec4(here.rgb, best);
}`;

const SCAN = `
uniform float uDistance;

void main() {
  int i = int(gl_FragCoord.x);
  int row = int(gl_FragCoord.y);
  int d = int(uDistance + 0.5);
  vec4 here = texelFetch(uInput, ivec2(i, row), 0);
  float best = here.a;
  for (int k = 1; k < 8; k++) {
    int x = i - k * d;
    if (x < 0) break;
    best = max(best, texelFetch(uInput, ivec2(x, row), 0).a);
  }
  outColor = vec4(here.rgb, best);
}`;

const SORT = `
${KEY}
uniform float uMerge;
uniform float uDistance;
uniform float uSteps;

vec4 v[8];
float c[8];

void exchange(int a, int b, bool up) {
  if ((c[a] > c[b]) == up) {
    vec4 tv = v[a];
    v[a] = v[b];
    v[b] = tv;
    float tc = c[a];
    c[a] = c[b];
    c[b] = tc;
  }
}

void main() {
  int i = int(gl_FragCoord.x);
  int row = int(gl_FragCoord.y);
  int k = int(uMerge + 0.5);
  int steps = int(uSteps + 0.5);
  int j1 = int(uDistance + 0.5);
  int j2 = steps > 1 ? j1 / 2 : 0;
  int j3 = steps > 2 ? j1 / 4 : 0;
  int base = i & ~(j1 | j2 | j3);
  bool up = (i & k) == 0;
  for (int t = 0; t < 8; t++) {
    int x = base + ((t & 4) != 0 ? j1 : 0) + ((t & 2) != 0 ? j2 : 0) + ((t & 1) != 0 ? j3 : 0);
    v[t] = texelFetch(uInput, ivec2(x, row), 0);
    c[t] = v[t].a + clamp(sortKey(v[t].rgb), 0.0, 1.0) * 0.998;
  }
  exchange(0, 4, up);
  exchange(1, 5, up);
  exchange(2, 6, up);
  exchange(3, 7, up);
  if (steps > 1) {
    exchange(0, 2, up);
    exchange(1, 3, up);
    exchange(4, 6, up);
    exchange(5, 7, up);
  }
  if (steps > 2) {
    exchange(0, 1, up);
    exchange(2, 3, up);
    exchange(4, 5, up);
    exchange(6, 7, up);
  }
  int t = ((i & j1) != 0 ? 4 : 0) + (j2 > 0 && (i & j2) != 0 ? 2 : 0) + (j3 > 0 && (i & j3) != 0 ? 1 : 0);
  outColor = v[t];
}`;

const COMPOSITE = `
uniform sampler2D uSorted;
uniform vec2 uCenter;
uniform vec2 uAlong;
uniform vec2 uAcross;
uniform vec2 uExtent;
uniform vec2 uSpacing;
uniform vec2 uGrid;
uniform float uSoft;

float spanAt(int i, int row) {
  if (i < 0 || i >= int(uGrid.x) || row < 0 || row >= int(uGrid.y)) return 0.0;
  float s = texelFetch(uSorted, ivec2(i, row), 0).a;
  float next = i + 1 < int(uGrid.x) ? texelFetch(uSorted, ivec2(i + 1, row), 0).a : -1.0;
  return abs(s - float(i)) > 0.5 || abs(next - float(i)) < 0.5 ? 1.0 : 0.0;
}

void main() {
  vec2 p = vUv * uResolution;
  vec2 d = p - uCenter;
  vec2 g = (vec2(dot(d, uAlong), dot(d, uAcross)) + uExtent * 0.5) / uSpacing;
  vec3 original = texture(uInput, vUv).rgb;
  vec3 sorted = texture(uSorted, g / uGrid).rgb;
  if (uSoft > 0.0) {
    vec3 sum = sorted;
    float total = 1.0;
    for (int k = 1; k <= 4; k++) {
      float o = float(k) * uSoft * 0.5;
      float w = exp(-float(k * k) * 0.25);
      sum += (texture(uSorted, (g + vec2(o, 0.0)) / uGrid).rgb + texture(uSorted, (g - vec2(o, 0.0)) / uGrid).rgb) * w;
      total += 2.0 * w;
    }
    sorted = sum / total;
  }
  vec2 x = g - 0.5;
  ivec2 c0 = ivec2(floor(x));
  vec2 f = fract(x);
  float bottom = mix(spanAt(c0.x, c0.y), spanAt(c0.x + 1, c0.y), f.x);
  float top = mix(spanAt(c0.x, c0.y + 1), spanAt(c0.x + 1, c0.y + 1), f.x);
  float mask = mix(bottom, top, f.y);
  outColor = vec4(mix(original, sorted, mask), 1.0);
}`;

const KEYS = { brightness: 0, hue: 1, saturation: 2 };

const sortPlan = n => {
  const plan = [];
  for (let k = 2; k <= n; k *= 2) {
    let j = k / 2;
    while (j >= 1) {
      const steps = Math.min(3, Math.round(Math.log2(j)) + 1);
      plan.push([k, j, steps]);
      j /= 2 ** steps;
    }
  }
  return plan;
};

export default {
  id: 'pixelsort',
  name: 'Pixel sort',
  category: 'glitch',
  blend: 'normal',
  description: 'Sorts runs of pixels by brightness, hue or saturation into glitchy streaks.',
  animated: true,
  animates: params => params.drift > 0,
  params: [
    {
      key: 'sortBy',
      label: 'Sort by',
      type: 'select',
      default: 'brightness',
      options: [
        { value: 'brightness', label: 'Brightness' },
        { value: 'hue', label: 'Hue' },
        { value: 'saturation', label: 'Saturation' }
      ]
    },
    { key: 'low', label: 'Lower threshold', type: 'number', min: 0, max: 1, step: 0.01, default: 0.4 },
    { key: 'high', label: 'Upper threshold', type: 'number', min: 0, max: 1, step: 0.01, default: 0.9 },
    { key: 'angle', label: 'Angle', type: 'number', min: 0, max: 180, step: 1, default: 0 },
    { key: 'reverse', label: 'Reverse', type: 'boolean', default: false },
    { key: 'length', label: 'Streak length', type: 'number', min: 0.02, max: 1, step: 0.01, default: 0.5 },
    { key: 'randomness', label: 'Ragged ends', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'smooth', label: 'Smoothing', type: 'number', min: 0, max: 1, step: 0.01, default: 0.3 },
    { key: 'drift', label: 'Drift', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { key: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 0 }
  ],
  render(ctx, input, params) {
    const angle = ((params.angle + (params.reverse ? 180 : 0)) * Math.PI) / 180;
    const along = [Math.cos(angle), Math.sin(angle)];
    const across = [-along[1], along[0]];
    const extentX = Math.abs(ctx.width * along[0]) + Math.abs(ctx.height * along[1]);
    const extentY = Math.abs(ctx.width * along[1]) + Math.abs(ctx.height * along[0]);
    const cell = Math.max(1, ctx.unit);
    const n = Math.min(1024, Math.max(64, 2 ** Math.round(Math.log2(extentX / cell))));
    const m = Math.max(1, Math.round(extentY / cell));
    const spacing = [extentX / n, extentY / m];
    const seed = params.variation * 1.618;
    const t = ctx.time * params.drift;
    const shift = params.drift > 0 ? 0.12 * Math.sin(t * 0.9) + 0.04 * Math.sin(t * 2.3 + 1.7) : 0;
    const geometry = {
      uCenter: [ctx.width / 2, ctx.height / 2],
      uAlong: along,
      uAcross: across,
      uExtent: [extentX, extentY],
      uSpacing: spacing
    };
    let current = ctx.pass('pixelsort-sample', SAMPLE, {
      input,
      size: [n, m],
      uniforms: {
        ...geometry,
        uImage: [ctx.width, ctx.height],
        uTaps: [Math.min(4, Math.ceil(spacing[0] / 2)), Math.min(4, Math.ceil(spacing[1] / 2))],
        uLow: params.low + shift,
        uHigh: params.high + shift,
        uRandom: params.randomness,
        uSeed: seed
      }
    });
    const swap = next => {
      ctx.release(current);
      current = next;
    };
    swap(
      ctx.pass('pixelsort-start', SCAN_START, {
        input: current,
        size: [n, m],
        uniforms: {
          uPiece: Math.max(2, (params.length * 1000 * ctx.unit) / spacing[0]),
          uRandom: params.randomness,
          uSeed: seed,
          uPhase: t * 0.15
        }
      })
    );
    for (let d = 8; d < n; d *= 8) {
      swap(ctx.pass('pixelsort-scan', SCAN, { input: current, size: [n, m], uniforms: { uDistance: d } }));
    }
    sortPlan(n).forEach(([k, j, steps]) => {
      swap(
        ctx.pass('pixelsort-sort', SORT, {
          input: current,
          size: [n, m],
          uniforms: { uKey: KEYS[params.sortBy] ?? 0, uMerge: k, uDistance: j, uSteps: steps }
        })
      );
    });
    const output = ctx.pass('pixelsort-composite', COMPOSITE, {
      input,
      textures: { uSorted: current },
      uniforms: { ...geometry, uGrid: [n, m], uSoft: (params.smooth * 12 * Math.max(ctx.unit, 1)) / spacing[0] }
    });
    ctx.release(current);
    return output;
  }
};
