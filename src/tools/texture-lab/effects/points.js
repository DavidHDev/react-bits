import { hexToRgb } from '../engine/assets';

const POINTS = 64;
const STYLES = { stipple: 0, pointillism: 1, mezzotint: 2 };
const DIAMETER = { stipple: 2.8, pointillism: 8, mezzotint: 1.6 };

const COMMON = `
uniform sampler2D uPoints;
uniform vec2 uFull;
uniform float uSpacing;
uniform float uStyle;
uniform float uContrast;
uniform float uDensity;
uniform float uColor;
uniform vec3 uInk;
uniform vec3 uPaper;
uniform float uScatter;
uniform float uMix;
uniform float uMotion;
uniform float uRadius;
uniform float uReach;
uniform vec3 uBase;

const float FILL[17] = float[17](0.0, 0.068, 0.136, 0.2043, 0.272, 0.34, 0.4082, 0.4782, 0.5522, 0.634, 0.7268, 0.8375, 0.995, 1.0, 1.0, 1.0, 1.0);
const float GROW[17] = float[17](0.54, 0.54, 0.54, 0.54, 0.54, 0.54, 0.54, 0.54, 0.54, 0.54, 0.54, 0.54, 0.54, 0.5781, 0.6266, 0.6924, 0.85);

float fillFor(float c) {
  float x = clamp(c, 0.0, 1.0) * 16.0;
  int i = int(min(floor(x), 15.0));
  return mix(FILL[i], FILL[i + 1], x - float(i));
}

float growFor(float c) {
  float x = clamp(c, 0.0, 1.0) * 16.0;
  int i = int(min(floor(x), 15.0));
  return mix(GROW[i], GROW[i + 1], x - float(i));
}

vec4 pointAt(vec2 cell) {
  return texelFetch(uPoints, ivec2(mod(cell, 64.0)), 0);
}

vec2 offsetFor(vec2 cell, vec4 pt) {
  vec2 o = pt.gb - 0.5;
  if (uStyle > 0.5) o *= uScatter * 1.25;
  if (uMotion > 0.0) {
    float phase = hash12(cell * 1.37 + 3.1) * TAU;
    float speed = 0.55 + hash12(cell * 2.11 + 7.3) * 0.9;
    float t = uTime * uMotion * speed;
    o += vec2(cos(t + phase), sin(t * 0.83 + phase * 1.7)) * 0.11;
  }
  return o;
}

vec3 tone(vec3 c) {
  return pow(max(c, 0.0), vec3(1.4));
}

vec3 untone(vec3 c) {
  return pow(clamp(c, 0.0, 1.0), vec3(1.0 / 1.4));
}

vec3 graded(vec3 c) {
  return clamp((c - 0.5) * uContrast + 0.5, 0.0, 1.0);
}
`;

const DOTS = `
${COMMON}
uniform float uLod;

void main() {
  vec2 cell = floor(gl_FragCoord.xy);
  vec4 pt = pointAt(cell);
  vec2 center = (cell + 0.5 + offsetFor(cell, pt)) * uSpacing;
  vec3 color = graded(textureLod(uInput, clamp(center / uFull, 0.0, 1.0), uLod).rgb);
  vec3 h = hash32(cell + 17.0);

  if (uStyle > 0.5) {
    vec3 hsv = rgb2hsv(color);
    hsv.x = fract(hsv.x + (h.x - 0.5) * uMix * 0.22);
    hsv.y = clamp(hsv.y * (1.35 + (h.y - 0.5) * uMix * 0.6), 0.0, 1.0);
    hsv.z = clamp(pow(hsv.z, 0.85) * (1.0 + (h.z - 0.5) * uMix * 0.5), 0.0, 1.0);
    vec3 dab = hsv2rgb(hsv);
    float contrast = clamp(abs(luma(dab) - luma(uBase)) * 1.4, 0.0, 1.0);
    float radius = uRadius * (0.55 + 0.75 * sqrt(contrast)) * (1.0 + (hash12(cell * 0.73 + 5.0) - 0.5) * 0.3);
    outColor = vec4(dab, min(radius, uReach) * uSpacing);
    return;
  }

  vec3 paper = tone(uPaper);
  vec3 image = tone(color);
  float c;
  vec3 dotColor = uInk;
  if (uColor > 0.5) {
    vec3 absorb = 1.0 - image / max(paper, vec3(0.02));
    c = clamp(max(max(absorb.r, absorb.g), absorb.b), 0.0, 1.0);
    dotColor = untone(paper + (image - paper) / max(c, 0.08));
  } else {
    float lp = dot(paper, LUMA);
    float li = dot(tone(uInk), LUMA);
    c = clamp((lp - dot(image, LUMA)) / max(lp - li, 0.02), 0.0, 1.0);
  }
  c = clamp(c * uDensity, 0.0, 1.0);
  float rank = (pt.r * 65280.0 + pt.a * 255.0) / 65535.0;
  float on = step(rank, fillFor(c) - 0.0001);
  float radius = growFor(c) * (1.0 + (h.x - 0.5) * 0.12);
  outColor = vec4(dotColor, on * min(radius, uReach) * uSpacing);
}`;

const DRAW = `
${COMMON}
uniform sampler2D uDots;
uniform vec2 uGrid;

void main() {
  vec2 p = gl_FragCoord.xy;
  vec2 base = floor(p / uSpacing);
  vec3 color = uBase;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 cell = base + vec2(float(i), float(j));
      if (cell.x < 0.0 || cell.y < 0.0 || cell.x >= uGrid.x || cell.y >= uGrid.y) continue;
      vec4 spot = texelFetch(uDots, ivec2(cell), 0);
      if (spot.a <= 0.0) continue;
      vec2 center = (cell + 0.5 + offsetFor(cell, pointAt(cell))) * uSpacing;
      float cover = clamp(spot.a - length(p - center) + 0.5, 0.0, 1.0);
      color = mix(color, spot.rgb, cover);
    }
  }
  outColor = vec4(color, 1.0);
}`;

const MEZZO = `
${COMMON}
uniform float uGrain;
uniform float uLod;

float bump(vec2 p, float seed) {
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash12(i + seed) * TAU;
  float b = hash12(i + vec2(1.0, 0.0) + seed) * TAU;
  float c = hash12(i + vec2(0.0, 1.0) + seed) * TAU;
  float d = hash12(i + vec2(1.0, 1.0) + seed) * TAU;
  float na = dot(vec2(cos(a), sin(a)), f);
  float nb = dot(vec2(cos(b), sin(b)), f - vec2(1.0, 0.0));
  float nc = dot(vec2(cos(c), sin(c)), f - vec2(0.0, 1.0));
  float nd = dot(vec2(cos(d), sin(d)), f - vec2(1.0, 1.0));
  return mix(mix(na, nb, u.x), mix(nc, nd, u.x), u.y);
}

float grain(vec2 q, float seed) {
  return bump(q, seed * 17.13) * 0.65 + bump(rotation(0.9) * q * 2.1 + vec2(31.7, 11.3), seed * 7.71 + 3.0) * 0.35;
}

float field(vec2 q, float channel) {
  float s = uTime * uMotion * 0.6;
  float k = floor(s);
  float f = (s - k) * 1.5707963;
  float seed = channel * 5.31;
  float n = grain(q, seed + k) * cos(f) + grain(q, seed + k + 1.0) * sin(f);
  return clamp(n * 1.6 + 0.5, 0.0, 1.0);
}

float ink(float c, float n) {
  float w = max(fwidth(n) * 0.6, 0.15);
  return smoothstep(n - w, n + w, c);
}

float deepen(float c) {
  c = pow(clamp(c * uDensity, 0.0, 1.0), 0.8);
  return smoothstep(0.05, 0.86, c) * 0.7 + c * 0.3;
}

void main() {
  vec2 q = gl_FragCoord.xy / uGrain;
  vec3 color = graded(textureLod(uInput, vUv, uLod).rgb);
  vec3 paper = tone(uPaper);
  vec3 dark = tone(uInk);
  vec3 image = tone(color);
  vec3 c;
  if (uColor > 0.5) {
    c = clamp((paper - image) / max(paper - dark, vec3(0.02)), 0.0, 1.0);
    c = vec3(deepen(c.r), deepen(c.g), deepen(c.b));
  } else {
    float lp = dot(paper, LUMA);
    c = vec3(deepen(clamp((lp - dot(image, LUMA)) / max(lp - dot(dark, LUMA), 0.02), 0.0, 1.0)));
  }
  int count = uGrain < 2.6 ? 4 : 1;
  vec3 k = vec3(0.0);
  for (int i = 0; i < 4; i++) {
    if (i >= count) break;
    vec2 o = count > 1 ? (vec2(float(i % 2), float(i / 2)) - 0.5) * 0.5 / uGrain : vec2(0.0);
    float n = field(q + o, 0.0);
    k += vec3(ink(c.r, n), ink(c.g, n), ink(c.b, n));
  }
  outColor = vec4(mix(uPaper, uInk, k / float(count)), 1.0);
}`;

let pointData = null;

function farthestPoints(size) {
  const n = size * size;
  let seed = 11;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const jx = new Float64Array(n);
  const jy = new Float64Array(n);
  const px = new Float64Array(n);
  const py = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    jx[i] = (random() - 0.5) * 0.8;
    jy[i] = (random() - 0.5) * 0.8;
    px[i] = (i % size) + 0.5 + jx[i];
    py[i] = Math.floor(i / size) + 0.5 + jy[i];
  }
  const nearest = new Float64Array(n).fill(Infinity);
  const rank = new Uint32Array(n);
  const half = size / 2;
  let current = Math.floor(random() * n);
  for (let k = 0; k < n && current >= 0; k += 1) {
    rank[current] = k;
    nearest[current] = -1;
    const cx = px[current];
    const cy = py[current];
    let best = -1;
    let far = -1;
    for (let i = 0; i < n; i += 1) {
      const known = nearest[i];
      if (known < 0) continue;
      let dx = Math.abs(px[i] - cx);
      let dy = Math.abs(py[i] - cy);
      if (dx > half) dx = size - dx;
      if (dy > half) dy = size - dy;
      const d = dx * dx + dy * dy;
      const value = d < known ? d : known;
      nearest[i] = value;
      if (value > far) {
        far = value;
        best = i;
      }
    }
    current = best;
  }
  const data = new Uint8Array(n * 4);
  for (let i = 0; i < n; i += 1) {
    const value = Math.round(((rank[i] + 0.5) / n) * 65535);
    data[i * 4] = value >> 8;
    data[i * 4 + 1] = Math.round((jx[i] + 0.5) * 255);
    data[i * 4 + 2] = Math.round((jy[i] + 0.5) * 255);
    data[i * 4 + 3] = value & 255;
  }
  return data;
}

function pointTexture(engine) {
  if (!pointData) pointData = farthestPoints(POINTS);
  return {
    texture: engine.createTexture(POINTS, POINTS, { float: false, filter: 'nearest', wrap: 'repeat', data: pointData })
  };
}

export default {
  id: 'points',
  name: 'Dots',
  category: 'print',
  description: 'Stippled ink dots, pointillist color dabs or a velvety mezzotint grain.',
  animated: true,
  animates: params => params.motion > 0,
  params: [
    {
      key: 'style',
      label: 'Style',
      type: 'select',
      default: 'stipple',
      options: [
        { value: 'stipple', label: 'Stippling' },
        { value: 'pointillism', label: 'Pointillism' },
        { value: 'mezzotint', label: 'Mezzotint' }
      ]
    },
    { key: 'size', label: 'Dot size', type: 'number', min: 0.4, max: 3, step: 0.05, default: 1 },
    { key: 'density', label: 'Density', type: 'number', min: 0.3, max: 2, step: 0.01, default: 1 },
    { key: 'contrast', label: 'Contrast', type: 'number', min: 0.5, max: 2, step: 0.01, default: 1.1 },
    {
      key: 'color',
      label: 'Image colors',
      type: 'boolean',
      default: false,
      when: params => params.style !== 'pointillism'
    },
    {
      key: 'ink',
      label: 'Ink',
      type: 'color',
      default: '#1b1815',
      when: params => params.style === 'mezzotint' || (params.style === 'stipple' && !params.color)
    },
    { key: 'paper', label: 'Paper', type: 'color', default: '#f2ece1', when: params => params.style !== 'pointillism' },
    {
      key: 'ground',
      label: 'Ground',
      type: 'color',
      default: '#0b0a0e',
      when: params => params.style === 'pointillism'
    },
    {
      key: 'scatter',
      label: 'Scatter',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.5,
      when: params => params.style === 'pointillism'
    },
    {
      key: 'mix',
      label: 'Color mix',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.5,
      when: params => params.style === 'pointillism'
    },
    { key: 'motion', label: 'Shimmer', type: 'number', min: 0, max: 2, step: 0.01, default: 0 }
  ],
  render(ctx, input, params) {
    const style = STYLES[params.style] ?? 0;
    const name = Object.keys(STYLES)[style];
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const diameter = Math.max(1.2, DIAMETER[name] * params.size * ctx.unit);
    const shared = {
      uFull: [ctx.width, ctx.height],
      uStyle: style,
      uContrast: params.contrast,
      uDensity: params.density,
      uColor: params.color ? 1 : 0,
      uInk: hexToRgb(params.ink),
      uPaper: hexToRgb(params.paper),
      uScatter: params.scatter,
      uMix: params.mix,
      uMotion: params.motion
    };

    if (style === 2) {
      return ctx.pass('points-mezzotint', MEZZO, {
        input: source,
        uniforms: { ...shared, uGrain: diameter, uLod: Math.max(0, Math.log2(diameter) - 1) }
      });
    }

    const points = ctx.shared('stipple-points', pointTexture);
    const pointillism = style === 1;
    const spacing = Math.max(2, pointillism ? diameter / params.density : diameter / 1.08);
    const wobble = params.motion > 0 ? 0.11 : 0;
    const offset = pointillism ? 0.5 * params.scatter : 0.4;
    const reach = Math.max(0.3, 1.5 - offset - wobble - 0.5 / spacing);
    const gw = Math.ceil(ctx.width / spacing);
    const gh = Math.ceil(ctx.height / spacing);
    const uniforms = {
      ...shared,
      uSpacing: spacing,
      uRadius: (0.5 * diameter) / spacing,
      uReach: reach,
      uBase: pointillism ? hexToRgb(params.ground) : hexToRgb(params.paper)
    };
    const dots = ctx.pass('points-dots', DOTS, {
      input: source,
      target: ctx.target(gw, gh, { filter: 'nearest' }),
      textures: { uPoints: points.texture },
      uniforms: { ...uniforms, uLod: Math.max(0, Math.log2(spacing) - 0.5) }
    });
    const output = ctx.pass('points-draw', DRAW, {
      input: source,
      textures: { uPoints: points.texture, uDots: dots },
      uniforms: { ...uniforms, uGrid: [gw, gh] }
    });
    ctx.release(dots);
    return output;
  }
};
