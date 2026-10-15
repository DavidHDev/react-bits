import { hexToRgb } from '../engine/assets';
import { gaussianBlur } from '../engine/blur';

const PANES = `
uniform float uPattern;
uniform float uCell;
uniform float uLead;
uniform vec3 uLeadColor;
uniform float uBoost;
uniform float uVariety;
uniform float uTexture;
uniform float uShimmer;
uniform float uBacklight;
uniform float uSeed;

vec2 site(vec2 cell) {
  return 0.5 + 0.8 * (hash22(cell + uSeed * 7.31) - 0.5);
}

vec4 voronoi(vec2 x) {
  vec2 n = floor(x);
  vec2 f = fract(x);
  vec2 mg = vec2(0.0);
  vec2 mr = vec2(0.0);
  float md = 8.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 r = g + site(n + g) - f;
      float d = dot(r, r);
      if (d < md) {
        md = d;
        mr = r;
        mg = g;
      }
    }
  }
  md = 8.0;
  for (int j = -2; j <= 2; j++) {
    for (int i = -2; i <= 2; i++) {
      vec2 g = mg + vec2(float(i), float(j));
      vec2 r = g + site(n + g) - f;
      vec2 e = r - mr;
      if (dot(e, e) > 1e-5) md = min(md, dot(0.5 * (mr + r), normalize(e)));
    }
  }
  return vec4(x + mr, md, hash12(n + mg + uSeed * 3.17));
}

vec4 diamonds(vec2 x) {
  vec2 a = vec2(x.x * 0.72 + x.y, x.y - x.x * 0.72);
  vec2 cell = floor(a);
  vec2 f = fract(a) - 0.5;
  float edge = (0.5 - max(abs(f.x), abs(f.y))) * 0.82;
  vec2 c = cell + 0.5;
  vec2 center = vec2((c.x - c.y) / 1.44, (c.x + c.y) * 0.5);
  return vec4(center, edge, hash12(cell + uSeed * 3.17));
}

vec4 rose(vec2 x, vec2 middle) {
  vec2 v = x - middle;
  float r = length(v);
  float a = atan(v.y, v.x) / TAU + 0.5;
  float ring = floor(r);
  float count = ring < 0.5 ? 1.0 : 6.0 * pow(2.0, floor(log2(ring + 1.0)));
  float twist = ring * 0.5 / count;
  float s = a * count + twist * count;
  float sector = floor(s);
  float fs = fract(s);
  float radial = r < 1.0 ? 1.0 - r : min(fract(r), 1.0 - fract(r));
  float angular = count > 1.5 ? min(fs, 1.0 - fs) * TAU * r / count : 9.0;
  float edge = min(radial, angular);
  float ca = ((sector + 0.5) / count - twist) * TAU - PI;
  vec2 center = ring < 0.5 ? middle : middle + vec2(cos(ca), sin(ca)) * (ring + 0.5);
  return vec4(center, edge, hash12(vec2(ring, sector) + uSeed * 3.17));
}

void main() {
  vec2 p = vUv * uResolution;
  vec2 x = p / uCell;
  vec4 v;
  if (uPattern < 0.5) v = voronoi(x);
  else if (uPattern < 1.5) v = diamonds(x);
  else v = rose(x, 0.5 * uResolution / uCell);

  vec2 siteUv = clamp(v.xy * uCell / uResolution, 0.0, 1.0);
  float lod = log2(max(uCell * 0.75, 1.0));
  vec3 base = textureLod(uInput, siteUv, lod).rgb;
  base = mix(base, textureLod(uInput, siteUv, lod + 1.0).rgb, 0.3);

  vec3 hsv = rgb2hsv(base);
  vec3 rnd = hash32(vec2(v.w * 91.7, v.w * 13.3 + 5.0));
  float boost = 1.0 + uBoost * 5.0;
  hsv.y = clamp(hsv.y * boost / (1.0 + (boost - 1.0) * hsv.y), 0.0, 1.0);
  hsv.x = fract(hsv.x + (rnd.x - 0.5) * uVariety * 0.16);
  hsv.y = clamp(hsv.y * (1.0 + (rnd.y - 0.5) * uVariety * 0.8), 0.0, 1.0);
  hsv.z = clamp(hsv.z * (1.0 + (rnd.z - 0.5) * uVariety * 0.5), 0.0, 1.0);
  vec3 glass = toLinear(hsv2rgb(hsv));

  if (uShimmer > 0.0) {
    float light = valueNoise(siteUv * vec2(2.2, 1.6) + vec2(uTime * 0.11, uTime * 0.04) + uSeed);
    light += 0.5 * valueNoise(siteUv * 5.0 - vec2(uTime * 0.07, uTime * 0.13));
    glass *= 1.0 + uShimmer * (light - 0.75) * 0.9;
  }

  vec2 local = (x - v.xy);
  float angle = v.w * TAU;
  vec2 grain = rotation(angle) * local;
  float streak = valueNoise(grain * vec2(1.6, 9.0) + v.w * 40.0) - 0.5;
  float ripple = valueNoise(grain * 3.4 + v.w * 17.0) - 0.5;
  float seeds = smoothstep(0.82, 0.92, valueNoise(x * 11.0 + v.w * 9.0));
  float surface = streak * 0.5 + ripple * 0.35 + seeds * 0.25;
  glass *= 1.0 + surface * uTexture * 0.9;

  float edge = v.z * uCell / uUnit;
  float inner = smoothstep(0.0, uLead * 0.5 + 9.0, edge - uLead * 0.5);
  glass *= mix(0.6, 1.0 + 0.4 * uBacklight, inner);

  float aa = 0.75 / uUnit;
  float halfLead = uLead * 0.5;
  float lead = (1.0 - smoothstep(halfLead - aa, halfLead + aa, edge)) * clamp(uLead * 2.0, 0.0, 1.0);
  float profile = clamp(edge / max(halfLead, 1e-3), 0.0, 1.0);
  vec3 metal = toLinear(uLeadColor) * (0.7 + 0.6 * (1.0 - profile * profile));
  vec3 color = mix(glass, metal, lead);
  outColor = vec4(color, 1.0);
}`;

const COMPOSITE = `
uniform sampler2D uGlow;
uniform float uGlowAmount;

void main() {
  vec3 color = texture(uInput, vUv).rgb;
  vec3 glow = texture(uGlow, vUv).rgb;
  float level = dot(glow, LUMA);
  color += glow * smoothstep(0.08, 0.7, level) * uGlowAmount;
  color = color / (1.0 + max(color - 1.0, 0.0));
  outColor = vec4(toGamma(color), 1.0);
}`;

const PATTERNS = { mosaic: 0, diamond: 1, rose: 2 };

export default {
  id: 'stained',
  name: 'Stained glass',
  category: 'glass',
  description: 'Leaded panes of tinted glass, each taking the color of the picture behind it.',
  animated: true,
  animates: params => params.shimmer > 0,
  params: [
    {
      key: 'pattern',
      label: 'Pattern',
      type: 'select',
      default: 'mosaic',
      options: [
        { value: 'mosaic', label: 'Mosaic' },
        { value: 'diamond', label: 'Diamond' },
        { value: 'rose', label: 'Rose window' }
      ]
    },
    { key: 'size', label: 'Pane size', type: 'number', min: 10, max: 150, step: 1, default: 38 },
    { key: 'lead', label: 'Leading', type: 'number', min: 0, max: 14, step: 0.1, default: 4 },
    { key: 'leadColor', label: 'Lead color', type: 'color', default: '#141217' },
    { key: 'saturation', label: 'Color boost', type: 'number', min: 0, max: 1, step: 0.01, default: 0.6 },
    { key: 'variety', label: 'Color variety', type: 'number', min: 0, max: 1, step: 0.01, default: 0.3 },
    { key: 'texture', label: 'Glass texture', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'glow', label: 'Back light', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'shimmer', label: 'Shimmer', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { key: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 0 }
  ],
  render(ctx, input, params) {
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const cell = Math.max(3, params.size * ctx.unit);
    const panes = ctx.pass('stained-panes', PANES, {
      input: source,
      uniforms: {
        uPattern: PATTERNS[params.pattern] ?? 0,
        uCell: cell,
        uLead: Math.min(params.lead, params.size * 0.35),
        uLeadColor: hexToRgb(params.leadColor),
        uBoost: params.saturation,
        uVariety: params.variety,
        uTexture: params.texture,
        uShimmer: params.shimmer,
        uBacklight: params.glow,
        uSeed: params.variation
      }
    });
    if (params.glow <= 0) {
      const output = ctx.pass('stained-composite', COMPOSITE, {
        input: panes,
        textures: { uGlow: panes },
        uniforms: { uGlowAmount: 0 }
      });
      ctx.release(panes);
      return output;
    }
    const glow = gaussianBlur(ctx, panes, cell * 0.45);
    const output = ctx.pass('stained-composite', COMPOSITE, {
      input: panes,
      textures: { uGlow: glow },
      uniforms: { uGlowAmount: params.glow * 0.9 }
    });
    ctx.release(glow);
    ctx.release(panes);
    return output;
  }
};
