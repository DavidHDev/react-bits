const WEIGHT = `
uniform float uGain;
uniform float uThreshold;

void main() {
  vec3 color = toLinear(texture(uInput, vUv).rgb);
  float hi = smoothstep(uThreshold, uThreshold + 0.35, dot(color, LUMA));
  float weight = (1.0 + uGain * hi * hi) / (1.0 + uGain);
  outColor = vec4(color * weight, weight);
}`;

const GATHER = `
uniform vec4 uTaps[100];
uniform vec2 uSource;
uniform vec2 uRotate;
uniform float uRadius;
uniform float uFringe;
uniform float uCatEye;
uniform float uLod;

void main() {
  vec2 texel = 1.0 / uSource;
  float aspect = uSource.x / uSource.y;
  vec2 v = vec2((vUv.x - 0.5) * aspect, vUv.y - 0.5);
  float reach = length(v);
  float corner = sqrt(0.25 * aspect * aspect + 0.25);
  vec2 shift = v * (uCatEye * (reach / corner) * 1.4 / max(reach, 0.0001));
  vec3 sum = vec3(0.0);
  vec3 total = vec3(0.0);
  for (int i = 0; i < 100; i++) {
    vec4 tap = uTaps[i];
    vec2 o = vec2(tap.x * uRotate.x - tap.y * uRotate.y, tap.x * uRotate.y + tap.y * uRotate.x);
    float k = tap.z * (1.0 - smoothstep(1.02, 1.12, length(o + shift)));
    vec2 offset = o * uRadius * texel;
    vec4 base = textureLod(uInput, vUv + offset, uLod);
    vec4 red = base;
    vec4 blue = base;
    if (uFringe > 0.001) {
      red = textureLod(uInput, vUv + offset * (1.0 + uFringe * 0.5), uLod);
      blue = textureLod(uInput, vUv + offset * (1.0 - uFringe * 0.5), uLod);
    }
    sum += vec3(red.r, base.g, blue.b) * k;
    total += vec3(red.a, base.a, blue.a) * k;
  }
  outColor = vec4(sum / max(total, vec3(1e-5)), 1.0);
}`;

const OUTPUT = `
void main() {
  outColor = vec4(toGamma(texture(uInput, vUv).rgb), 1.0);
}`;

const TAP_COUNT = 100;
const COMPUTE_EDGE = 1024;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const TWO_PI = Math.PI * 2;
const EDGE_BOOST = 0.6;
const EDGE_POWER = 8;
const RIM_BAND = 0.25;

const polygonRadius = (theta, sides) => {
  if (sides < 3) return 1;
  const a = TWO_PI / sides;
  const m = theta - a * Math.floor(theta / a + 0.5);
  return Math.cos(a * 0.5) / Math.cos(m);
};

const heart = (dx, dy) => {
  const s = 1 / 0.75;
  const px = Math.abs(dx) / s;
  const py = -dy / s + 0.6;
  if (px + py > 1) return (Math.hypot(px - 0.25, py - 0.75) - Math.SQRT2 / 4) * s;
  const b1y = py - 1;
  const m = Math.max(px + py, 0) * 0.5;
  return Math.sqrt(Math.min(px * px + b1y * b1y, (px - m) ** 2 + (py - m) ** 2)) * Math.sign(px - py) * s;
};

const star = (dx, dy, sides, inner) => {
  const len = Math.hypot(dx, dy);
  const sector = TWO_PI / sides;
  const bn = Math.atan2(dy, dx) - Math.floor(Math.atan2(dy, dx) / sector + 0.5) * sector;
  const fpx = Math.abs(len * Math.sin(bn));
  const fpy = len * Math.cos(bn);
  const an = Math.PI / sides;
  const ex = inner * Math.sin(an);
  const ey = inner * Math.cos(an) - 1;
  const qy = fpy - 1;
  const t = Math.min(Math.max((fpx * ex + qy * ey) / (ex * ex + ey * ey), 0), 1);
  return Math.hypot(fpx - ex * t, fpy - (1 + ey * t)) * Math.sign(ex * qy - ey * fpx);
};

const flower = (dx, dy, sides, inner) => {
  const turns = (Math.atan2(dy, dx) * sides) / TWO_PI;
  const t = Math.abs((turns - Math.floor(turns)) * 2 - 1);
  return Math.hypot(dx, dy) - (inner + (1 - inner) * t);
};

const cross = (dx, dy) => {
  const px = Math.abs(dx);
  const py = Math.abs(dy);
  return Math.min(Math.max(px - 0.92, py - 0.3), Math.max(py - 0.92, px - 0.3)) - 0.08;
};

const ring = (dx, dy) => Math.abs(Math.hypot(dx, dy) - 0.72) - 0.28;

const halton = (index, base) => {
  let f = 1;
  let r = 0;
  let i = index;
  while (i > 0) {
    f /= base;
    r += f * (i % base);
    i = Math.floor(i / base);
  }
  return r;
};

const points = count => (Math.round(count) >= 3 ? Math.round(count) : 5);

const AREAS = { star: 0.47, flower: 0.62, heart: 0.5, cross: 0.69, ring: 0.81 };

const SHAPES = {
  star: (x, y, n) => star(-y, x, points(n), 0.5),
  flower: (x, y, n) => flower(-y, x, points(n), 0.55),
  heart: (x, y) => heart(x, y),
  cross: (x, y) => cross(x, y),
  ring: (x, y) => ring(x, y)
};

function apertureTaps(shape, blades) {
  const taps = [];
  const sdf = SHAPES[shape];
  if (!sdf) {
    const sides = shape === 'circle' ? 0 : Math.round(blades);
    for (let i = 0; i < TAP_COUNT; i += 1) {
      const rNorm = Math.sqrt((i + 0.5) / TAP_COUNT);
      const theta = i * GOLDEN_ANGLE;
      const r = rNorm * polygonRadius(theta, sides);
      taps.push([-Math.cos(theta) * r, -Math.sin(theta) * r, 1 + EDGE_BOOST * Math.pow(rNorm, EDGE_POWER)]);
    }
  } else {
    for (let index = 1; taps.length < TAP_COUNT && index <= 20000; index += 1) {
      const x = halton(index, 2) * 2 - 1;
      const y = halton(index, 3) * 2 - 1;
      const dist = sdf(x, y, blades);
      if (dist > 0) continue;
      const near = Math.min(Math.max(1 + dist / RIM_BAND, 0), 1);
      taps.push([-x, -y, 1 + EDGE_BOOST * near * near]);
    }
    if (!taps.length) return apertureTaps('circle', 0);
    for (let i = 0; taps.length < TAP_COUNT; i += 1) taps.push(taps[i % taps.length]);
    const longest = taps.reduce((max, tap) => Math.max(max, Math.hypot(tap[0], tap[1])), 0);
    if (longest > 1) {
      taps.forEach(tap => {
        tap[0] /= longest;
        tap[1] /= longest;
      });
    }
  }
  const count = Math.round(blades);
  const polygon = count >= 3 ? (count * Math.sin(TWO_PI / count)) / TWO_PI : 1;
  const area = AREAS[shape] ?? (shape === 'circle' ? 1 : polygon);
  return { list: taps.map(([x, y, rim]) => [x, -y, rim, 0]), area };
}

export default {
  id: 'bokeh',
  name: 'Lens blur',
  category: 'lens',
  blend: 'normal',
  description: 'Photographic lens blur where bright highlights bloom into aperture-shaped discs.',
  animated: false,
  params: [
    { key: 'radius', label: 'Amount', type: 'number', min: 0, max: 100, step: 1, default: 35 },
    { key: 'gain', label: 'Highlight bloom', type: 'number', min: 0, max: 10, step: 0.1, default: 8 },
    { key: 'threshold', label: 'Highlight threshold', type: 'number', min: 0, max: 1, step: 0.01, default: 0.45 },
    {
      key: 'shape',
      label: 'Aperture',
      type: 'select',
      default: 'blades',
      options: [
        { value: 'blades', label: 'Blades' },
        { value: 'circle', label: 'Circle' },
        { value: 'star', label: 'Star' },
        { value: 'heart', label: 'Heart' },
        { value: 'flower', label: 'Flower' },
        { value: 'cross', label: 'Cross' },
        { value: 'ring', label: 'Ring' }
      ]
    },
    {
      key: 'blades',
      label: 'Blades',
      type: 'number',
      min: 3,
      max: 9,
      step: 1,
      default: 6,
      when: params => params.shape === 'blades' || params.shape === 'star' || params.shape === 'flower'
    },
    { key: 'rotation', label: 'Rotation', type: 'number', min: 0, max: 360, step: 1, default: 0 },
    { key: 'fringe', label: 'Color fringe', type: 'number', min: 0, max: 1, step: 0.01, default: 0.2 },
    { key: 'catEye', label: 'Cat eye', type: 'number', min: 0, max: 1, step: 0.01, default: 0 }
  ],
  render(ctx, input, params, state) {
    const radius = params.radius * 0.8 * ctx.unit;
    if (radius < 0.5) return input;
    const key = `${params.shape}|${Math.round(params.blades)}`;
    if (state.key !== key) {
      state.key = key;
      state.taps = apertureTaps(params.shape, params.blades);
    }
    const weighted = ctx.mipmap(
      ctx.pass('bokeh-weight', WEIGHT, {
        input,
        uniforms: { uGain: params.gain, uThreshold: params.threshold }
      })
    );
    const scale = Math.min(1, COMPUTE_EDGE / Math.max(ctx.width, ctx.height));
    const w = Math.max(8, Math.round(ctx.width * scale));
    const h = Math.max(8, Math.round(ctx.height * scale));
    const spacing = radius * Math.sqrt((Math.PI * state.taps.area) / TAP_COUNT);
    const angle = (-params.rotation * Math.PI) / 180;
    const gathered = ctx.pass('bokeh-gather', GATHER, {
      input: weighted,
      target: ctx.target(w, h),
      uniforms: {
        uTaps: state.taps.list,
        uSource: [ctx.width, ctx.height],
        uRotate: [Math.cos(angle), Math.sin(angle)],
        uRadius: radius,
        uFringe: params.fringe,
        uCatEye: params.catEye,
        uLod: Math.max(0, Math.log2(Math.max(spacing, 1)) - 0.5)
      }
    });
    ctx.release(weighted);
    const output = ctx.pass('bokeh-output', OUTPUT, { input: gathered });
    ctx.release(gathered);
    return output;
  }
};
