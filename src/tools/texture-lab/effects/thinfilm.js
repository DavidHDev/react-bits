import { gaussianBlur } from '../engine/blur';
import { imageStats } from '../engine/stats';

const LUT_SIZE = 768;
const MAX_PATH = 3000;

const lobe = (x, mu, low, high) => {
  const s = x < mu ? low : high;
  return Math.exp((-0.5 * (x - mu) * (x - mu)) / (s * s));
};

const matching = lambda => [
  1.056 * lobe(lambda, 599.8, 37.9, 31.0) +
    0.362 * lobe(lambda, 442.0, 16.0, 26.7) -
    0.065 * lobe(lambda, 501.1, 20.4, 26.2),
  0.821 * lobe(lambda, 568.8, 46.9, 40.5) + 0.286 * lobe(lambda, 530.9, 16.3, 31.1),
  1.217 * lobe(lambda, 437.0, 11.8, 36.0) + 0.681 * lobe(lambda, 459.0, 26.0, 13.8)
];

const toRgb = ([x, y, z]) => [
  3.2406 * x - 1.5372 * y - 0.4986 * z,
  -0.9689 * x + 1.8758 * y + 0.0415 * z,
  0.0557 * x - 0.204 * y + 1.057 * z
];

function filmTable() {
  const spectrum = [];
  for (let lambda = 380; lambda <= 780; lambda += 4) spectrum.push([lambda, matching(lambda)]);
  const integrate = reflect => {
    const xyz = [0, 0, 0];
    spectrum.forEach(([lambda, cmf]) => {
      const r = reflect(lambda);
      xyz[0] += r * cmf[0];
      xyz[1] += r * cmf[1];
      xyz[2] += r * cmf[2];
    });
    return toRgb(xyz);
  };
  const white = integrate(() => 1);
  const data = new Uint8Array(LUT_SIZE * 4);
  for (let i = 0; i < LUT_SIZE; i += 1) {
    const path = (i / (LUT_SIZE - 1)) * MAX_PATH;
    const rgb = integrate(lambda => 0.5 - 0.5 * Math.cos((2 * Math.PI * path) / lambda));
    for (let c = 0; c < 3; c += 1) {
      const linear = Math.min(1, Math.max(0, rgb[c] / white[c]));
      data[i * 4 + c] = Math.round(Math.pow(linear, 1 / 2.2) * 255);
    }
    data[i * 4 + 3] = 255;
  }
  return data;
}

const FIELD = `
uniform sampler2D uSoft;
uniform sampler2D uStats;
uniform float uStatsTop;
uniform vec2 uSoftSize;
uniform vec2 uUnits;
uniform float uBase;
uniform float uSpread;
uniform float uEdges;
uniform float uSwirl;
uniform float uScale;
uniform float uClock;
uniform float uSeed;

vec4 bspline(sampler2D tex, vec2 uv, vec2 size) {
  vec2 p = uv * size - 0.5;
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 f2 = f * f;
  vec2 f3 = f2 * f;
  vec2 w0 = (1.0 - 3.0 * f + 3.0 * f2 - f3) / 6.0;
  vec2 w1 = (4.0 - 6.0 * f2 + 3.0 * f3) / 6.0;
  vec2 w2 = (1.0 + 3.0 * f + 3.0 * f2 - 3.0 * f3) / 6.0;
  vec2 w3 = f3 / 6.0;
  vec2 g0 = w0 + w1;
  vec2 g1 = w2 + w3;
  vec2 h0 = (i - 0.5 + w1 / g0) / size;
  vec2 h1 = (i + 1.5 + w3 / g1) / size;
  return g0.y * (g0.x * texture(tex, vec2(h0.x, h0.y)) + g1.x * texture(tex, vec2(h1.x, h0.y)))
    + g1.y * (g0.x * texture(tex, vec2(h0.x, h1.y)) + g1.x * texture(tex, vec2(h1.x, h1.y)));
}

float level(float l) {
  vec2 moments = textureLod(uStats, vec2(0.5), uStatsTop).rg;
  float spread = max(sqrt(max(moments.y - moments.x * moments.x, 0.0)), 0.08);
  return clamp((l - moments.x) / (spread * 3.8) + 0.5, 0.0, 1.0);
}

float toneAt(vec2 uv) {
  return level(luma(bspline(uSoft, uv, uSoftSize).rgb));
}

void main() {
  vec2 q = vUv * uUnits;
  vec2 texel = 1.0 / uResolution;
  float t = toneAt(vUv);
  float tx = toneAt(vUv + vec2(texel.x, 0.0)) - toneAt(vUv - vec2(texel.x, 0.0));
  float ty = toneAt(vUv + vec2(0.0, texel.y)) - toneAt(vUv - vec2(0.0, texel.y));
  float slope = length(vec2(tx, ty) / (2.0 * texel * uUnits));
  vec2 p = q / uScale + uSeed * 3.17;
  vec2 warp = vec2(fbm(p * 0.7 + vec2(uClock * 0.11, -uClock * 0.08)), fbm(p * 0.7 + vec2(4.7 - uClock * 0.07, 2.1 + uClock * 0.1)));
  float swirl = fbm(p + warp * 2.4 + vec2(-uClock * 0.05, uClock * 0.06));
  float path = uBase + t * uSpread - min(slope * 28.0, 1.6) * uEdges + (swirl - 0.5) * uSwirl;
  outColor = vec4(path, t, 0.0, 1.0);
}`;

const SHADE = `
uniform sampler2D uField;
uniform sampler2D uTable;
uniform float uMaxPath;
uniform float uFilm;
uniform float uStrength;

vec3 film(float path) {
  float x = clamp(path / uMaxPath, 0.0, 1.0);
  return toLinear(texture(uTable, vec2(x, 0.5)).rgb);
}

void main() {
  vec4 field = texture(uField, vUv);
  vec3 image = texture(uInput, vUv).rgb;
  vec3 linear = toLinear(image);
  float lum = luma(linear);
  vec3 sheen = film(field.x);
  vec3 color;
  if (uFilm < 0.5) {
    float body = pow(lum, 0.85);
    color = sheen * (0.06 + body * 1.12);
    color = color / (1.0 + max(color.r, max(color.g, color.b)) * 0.35) * 1.3;
  } else {
    color = linear * 0.78 + sheen * (0.22 + 0.25 * (1.0 - lum));
  }
  color = mix(linear, color, uStrength);
  outColor = vec4(toGamma(clamp(color, 0.0, 1.0)), 1.0);
}`;

export default {
  id: 'thinfilm',
  name: 'Thin film',
  category: 'material',
  description: 'Oil-slick or soap-bubble interference colors that follow the brightness and edges of the picture.',
  animated: true,
  animates: params => params.speed > 0,
  params: [
    {
      key: 'film',
      label: 'Film',
      type: 'select',
      default: 'oil',
      options: [
        { value: 'oil', label: 'Oil slick' },
        { value: 'soap', label: 'Soap bubble' }
      ]
    },
    { key: 'strength', label: 'Strength', type: 'number', min: 0, max: 1, step: 0.01, default: 1 },
    { key: 'thickness', label: 'Thickness', type: 'number', min: 0, max: 1, step: 0.01, default: 0.73 },
    { key: 'spread', label: 'Color bands', type: 'number', min: 0, max: 1, step: 0.01, default: 0.25 },
    { key: 'edges', label: 'Edge rings', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'swirl', label: 'Swirl', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'scale', label: 'Swirl size', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'speed', label: 'Shimmer', type: 'number', min: 0, max: 2, step: 0.01, default: 0.3 },
    { key: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 0 }
  ],
  render(ctx, input, params) {
    const table = ctx.shared('thinfilm-table', engine => ({
      texture: engine.createTexture(LUT_SIZE, 1, { float: false, filter: 'linear', data: filmTable() })
    }));
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const soft = gaussianBlur(ctx, source, 2.5 * ctx.unit, { maxSigma: 3 });
    const stats = imageStats(ctx, source);
    const scale = Math.min(1, 1024 / Math.max(ctx.width, ctx.height));
    const soap = params.film === 'soap';
    const field = ctx.pass('thinfilm-field', FIELD, {
      target: ctx.target(Math.max(8, ctx.width * scale), Math.max(8, ctx.height * scale)),
      textures: { uSoft: soft, uStats: stats.target },
      uniforms: {
        uStatsTop: stats.top,
        uSoftSize: [soft.width, soft.height],
        uUnits: [ctx.width / ctx.unit, ctx.height / ctx.unit],
        uBase: (soap ? 60 : 200) + params.thickness * 1300,
        uSpread: params.spread * 900,
        uEdges: params.edges * 420,
        uSwirl: params.swirl * 1100,
        uScale: 60 + params.scale * 340,
        uClock: ctx.time * params.speed,
        uSeed: params.variation
      }
    });
    ctx.release(soft);
    ctx.release(stats.target);
    const output = ctx.pass('thinfilm', SHADE, {
      input,
      textures: { uField: field, uTable: table },
      uniforms: { uMaxPath: MAX_PATH, uFilm: soap ? 1 : 0, uStrength: params.strength }
    });
    ctx.release(field);
    return output;
  }
};
