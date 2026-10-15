import { hexToRgb } from '../engine/assets';

const SHADER = `
uniform float uPattern;
uniform float uFacet;
uniform float uCell;
uniform float uAngle;
uniform float uRefraction;
uniform float uSpread;
uniform float uLines;
uniform float uWidth;
uniform float uShading;
uniform vec3 uTint;
uniform vec2 uDrift;
uniform float uSeed;

vec2 mirrorUv(vec2 uv) {
  return 1.0 - abs(1.0 - abs(uv));
}

vec3 photo(vec2 p) {
  return toLinear(texture(uInput, mirrorUv(vec2(p.x / uResolution.x, 1.0 - p.y / uResolution.y))).rgb);
}

void main() {
  vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uResolution;
  vec2 centered = p - 0.5 * uResolution;
  mat2 spin = rotation(uAngle);
  vec2 g = spin * centered / uCell + uDrift;

  mat2 toLocal = mat2(1.0);
  if (uPattern > 0.5 && uPattern < 1.5) toLocal = mat2(0.68, -0.68, 0.6, 0.6);
  vec2 q = toLocal * g;
  vec2 scale = vec2(length(vec2(toLocal[0][0], toLocal[1][0])), length(vec2(toLocal[0][1], toLocal[1][1])));

  vec2 cell;
  vec2 f;
  float edge;
  vec2 edgeNormal;
  float ridge;
  if (uPattern < 1.5) {
    cell = floor(q);
    f = fract(q) - 0.5;
    vec2 dist = (0.5 - abs(f)) / scale;
    edge = min(dist.x, dist.y);
    edgeNormal = dist.x < dist.y ? vec2(sign(f.x), 0.0) : vec2(0.0, sign(f.y));
    ridge = abs(abs(f.x) - abs(f.y)) * 0.7071 / max(scale.x, scale.y);
  } else {
    vec2 r = vec2(1.0, 1.7320508);
    vec2 h = r * 0.5;
    vec2 a = mod(q, r) - h;
    vec2 b = mod(q - h, r) - h;
    f = dot(a, a) < dot(b, b) ? a : b;
    cell = floor((q - f) * 2.0 + 0.5);
    vec2 af = abs(f);
    float p1 = af.x;
    float p2 = dot(af, vec2(0.5, 0.8660254));
    float p3 = abs(dot(af, vec2(-0.5, 0.8660254)));
    edge = 0.5 - max(p1, p2);
    edgeNormal = p1 > p2 ? vec2(sign(f.x), 0.0) : sign(f) * vec2(0.5, 0.8660254);
    ridge = p1 > p2 ? (p1 - p2) : min(p2 - p1, p2 - p3);
  }

  vec2 slope;
  if (uFacet < 0.5) {
    vec2 tilt = hash22(cell + uSeed * 3.1) - 0.5;
    slope = tilt * 1.1 + f * 0.9;
  } else if (uFacet < 1.5) {
    slope = edgeNormal * 0.8;
  } else {
    float d = length(f * 2.0);
    slope = f * 2.4 * (1.0 + 0.6 * d * d);
  }

  mat2 back = inverse(toLocal);
  mat2 unspin = rotation(-uAngle);
  vec2 lit = unspin * (back * slope);
  vec2 shift = lit * uCell * uRefraction * 0.35;

  vec3 color;
  if (uSpread > 0.0) {
    color = vec3(
      photo(p - shift * (1.0 - uSpread)).r,
      photo(p - shift).g,
      photo(p - shift * (1.0 + uSpread)).b
    );
  } else {
    color = photo(p - shift);
  }

  vec2 lightDir = normalize(vec2(-0.6, -0.8));
  float facing = dot(normalize(lit + 1e-5), lightDir) * min(length(lit), 1.0);
  color *= 1.0 + facing * uShading * 0.55;
  color *= toLinear(uTint);

  float aa = 0.75 / uUnit;
  float w = uWidth * 0.5;
  float px = edge * uCell / uUnit;
  float line = 1.0 - smoothstep(w - aa, w + aa, px);
  vec2 n = unspin * (back * edgeNormal);
  float side = dot(normalize(n + 1e-5), lightDir);
  float bevel = exp(-px / (uWidth * 1.4 + 1.0)) * (1.0 - line);
  color *= 1.0 - bevel * uLines * 0.35 * max(side, 0.0);
  color += bevel * uLines * 0.25 * max(-side, 0.0) * (0.3 + color);

  if (uFacet > 0.5 && uFacet < 1.5) {
    float rpx = ridge * uCell / uUnit;
    float crest = 1.0 - smoothstep(w * 0.35 - aa, w * 0.35 + aa, rpx);
    float glow = exp(-rpx / (uWidth + 1.0));
    color += (crest * 0.28 + glow * 0.1) * uLines * (0.25 + color);
  } else if (uFacet > 1.5) {
    vec2 spot = f * 2.0 - toLocal * (spin * vec2(-0.35, -0.42));
    color += exp(-dot(spot, spot) * 9.0) * uShading * 0.5 * (0.4 + color);
  }

  vec3 bright = mix(color * 1.6 + 0.12, vec3(1.0), 0.6) * toLinear(uTint);
  color = mix(color, bright, line * uLines);

  outColor = vec4(toGamma(color), 1.0);
}`;

const PATTERNS = { square: 0, diamond: 1, hexagon: 2 };
const FACETS = { flat: 0, pyramid: 1, dome: 2 };

export default {
  id: 'vitrine',
  name: 'Pressed glass',
  category: 'glass',
  blend: 'normal',
  description: 'A grid of pressed-glass facets, each refracting its own piece of the picture.',
  animated: true,
  animates: params => params.drift !== 0,
  params: [
    {
      key: 'pattern',
      label: 'Pattern',
      type: 'select',
      default: 'square',
      options: [
        { value: 'square', label: 'Square' },
        { value: 'diamond', label: 'Diamond' },
        { value: 'hexagon', label: 'Hexagon' }
      ]
    },
    {
      key: 'facet',
      label: 'Facets',
      type: 'select',
      default: 'flat',
      options: [
        { value: 'flat', label: 'Flat' },
        { value: 'pyramid', label: 'Pyramid' },
        { value: 'dome', label: 'Dome' }
      ]
    },
    { key: 'size', label: 'Facet size', type: 'number', min: 10, max: 200, step: 1, default: 60 },
    { key: 'angle', label: 'Angle', type: 'number', min: 0, max: 90, step: 1, default: 0 },
    { key: 'refraction', label: 'Refraction', type: 'number', min: 0, max: 1, step: 0.01, default: 0.4 },
    { key: 'dispersion', label: 'Rainbow edges', type: 'number', min: 0, max: 1, step: 0.01, default: 0.3 },
    { key: 'lines', label: 'Highlight lines', type: 'number', min: 0, max: 1, step: 0.01, default: 0.8 },
    { key: 'width', label: 'Line width', type: 'number', min: 0.5, max: 8, step: 0.1, default: 2.6 },
    { key: 'shading', label: 'Facet shading', type: 'number', min: 0, max: 1, step: 0.01, default: 0.35 },
    { key: 'tint', label: 'Glass tint', type: 'color', default: '#ffffff' },
    { key: 'drift', label: 'Drift', type: 'number', min: -2, max: 2, step: 0.01, default: 0 },
    {
      key: 'variation',
      label: 'Variation',
      type: 'number',
      min: 0,
      max: 100,
      step: 1,
      default: 0,
      when: params => params.facet === 'flat'
    }
  ],
  render(ctx, input, params) {
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const drift = params.drift * ctx.time * 0.15;
    return ctx.pass('vitrine', SHADER, {
      input: source,
      uniforms: {
        uPattern: PATTERNS[params.pattern] ?? 0,
        uFacet: FACETS[params.facet] ?? 0,
        uCell: Math.max(4, params.size * ctx.unit),
        uAngle: (params.angle * Math.PI) / 180,
        uRefraction: params.refraction,
        uSpread: params.dispersion * 0.35,
        uLines: params.lines,
        uWidth: params.width,
        uShading: params.shading,
        uTint: hexToRgb(params.tint),
        uDrift: [drift, drift * 0.4],
        uSeed: params.variation
      }
    });
  }
};
