import { hexToRgb } from '../engine/assets';

const LATTICE = `
uniform float uCell;
uniform float uJitter;
uniform float uSeed;
uniform float uDrift;

const float ROW = 0.8660254;

vec2 seedAt(vec2 c) {
  vec2 h = hash22(c + uSeed * 17.31 + 3.7);
  vec2 o = (h - 0.5) * uJitter * 0.92;
#ifdef DRIFT
  vec2 g = hash22(c * 1.37 + uSeed * 5.13 + 11.1);
  o += vec2(sin(uDrift * (0.6 + g.x) + g.y * TAU), cos(uDrift * (0.5 + g.y) + g.x * TAU)) * 0.22;
#endif
  return vec2(c.x + 0.5 + 0.5 * mod(c.y, 2.0) + o.x, (c.y + 0.5 + o.y) * ROW) * uCell;
}

vec2 baseCell(vec2 p) {
  float jy = floor(p.y / (uCell * ROW));
  float jx = floor(p.x / uCell - 0.5 * mod(jy, 2.0));
  return vec2(jx, jy);
}

vec2 nearestCell(vec2 p) {
  vec2 base = baseCell(p);
  float best = 1e20;
  vec2 cell = base;
  for (int y = -2; y <= 2; y++) {
    for (int x = -2; x <= 2; x++) {
      vec2 c = base + vec2(float(x), float(y));
      vec2 d = p - seedAt(c);
      float dd = dot(d, d);
      if (dd < best) {
        best = dd;
        cell = c;
      }
    }
  }
  return cell;
}
`;

const CELLS = `
uniform vec2 uImage;
uniform float uLod;
${LATTICE}
void main() {
  vec2 c = floor(vUv * uResolution) - 2.0;
  vec2 s = seedAt(c);
  vec3 sum = vec3(0.0);
  float total = 0.0;
  for (int y = -2; y <= 2; y++) {
    for (int x = -2; x <= 2; x++) {
      vec2 p = s + vec2(float(x), float(y)) * uCell * 0.4;
      vec2 n = nearestCell(p);
      if (any(notEqual(n, c))) continue;
      vec2 uv = clamp(p / uImage, 0.0, 1.0);
      sum += textureLod(uInput, uv, uLod).rgb;
      total += 1.0;
    }
  }
  vec3 color = total > 0.0 ? sum / total : textureLod(uInput, clamp(s / uImage, 0.0, 1.0), uLod + 1.0).rgb;
  outColor = vec4(color, 1.0);
}`;

const SHADE = `
uniform sampler2D uCells;
uniform float uFacets;
uniform float uCut;
uniform float uLight;
uniform float uEdges;
uniform vec3 uEdgeColor;
${LATTICE}
vec3 cellColor(vec2 c) {
  ivec2 size = textureSize(uCells, 0);
  ivec2 t = clamp(ivec2(c + 2.0), ivec2(0), size - 1);
  return texelFetch(uCells, t, 0).rgb;
}

float facetShade(vec2 c, vec2 toEdge) {
  vec3 light = normalize(vec3(cos(uLight), sin(uLight), 0.9));
  vec2 tilt = uCut > 0.5 ? toEdge * 0.55 : (hash22(c * 1.91 + uSeed * 2.7) - 0.5) * 1.3;
  vec3 n = normalize(vec3(tilt, 1.0));
  float lit = dot(n, light) / light.z;
  float glint = pow(max(dot(reflect(-light, n), vec3(0.0, 0.0, 1.0)), 0.0), 24.0);
  return (lit - 1.0) * 0.9 + glint * 0.35;
}

void main() {
  vec2 p = vUv * uResolution;
  vec2 base = baseCell(p);
  float best = 1e20;
  vec2 cell = base;
  vec2 seed = vec2(0.0);
  for (int y = -2; y <= 2; y++) {
    for (int x = -2; x <= 2; x++) {
      vec2 c = base + vec2(float(x), float(y));
      vec2 s = seedAt(c);
      vec2 d = p - s;
      float dd = dot(d, d);
      if (dd < best) {
        best = dd;
        cell = c;
        seed = s;
      }
    }
  }
  float edge = 1e20;
  float edge2 = 1e20;
  vec2 other = cell;
  vec2 dir1 = vec2(0.0);
  vec2 dir2 = vec2(0.0);
  vec2 cellBase = baseCell(seed);
  for (int y = -2; y <= 2; y++) {
    for (int x = -2; x <= 2; x++) {
      vec2 c = cellBase + vec2(float(x), float(y));
      if (all(equal(c, cell))) continue;
      vec2 s = seedAt(c);
      vec2 along = s - seed;
      float len = length(along);
      if (len < 1e-4) continue;
      vec2 dir = along / len;
      float d = dot(0.5 * (seed + s) - p, dir);
      if (d < edge) {
        edge2 = edge;
        dir2 = dir1;
        edge = d;
        dir1 = dir;
        other = c;
      } else if (d < edge2) {
        edge2 = d;
        dir2 = dir;
      }
    }
  }
  float aa = max(fwidth(p.x), 1.0) * 0.75;
  vec3 color = cellColor(cell);
  vec3 neighbor = cellColor(other);
  if (uFacets > 0.0) {
    float ridge = smoothstep(0.0, aa * 2.0, edge2 - edge);
    float shadeA = facetShade(cell, dir1);
    float shadeB = facetShade(cell, dir2);
    float shade = mix(0.5 * (shadeA + shadeB), shadeA, uCut > 0.5 ? ridge : 1.0);
    float shadeN = facetShade(other, -dir1);
    color *= 1.0 + shade * uFacets;
    neighbor *= 1.0 + shadeN * uFacets;
  }
  float blend = clamp(0.5 + edge / aa, 0.0, 1.0);
  color = mix(neighbor, color, blend);
  if (uEdges > 0.0) {
    float width = uEdges * uCell * 0.08;
    float line = 1.0 - smoothstep(width - aa, width + aa, edge);
    color = mix(color, uEdgeColor, line);
  }
  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;

export default {
  id: 'crystallize',
  name: 'Crystallize',
  category: 'material',
  description: 'Breaks the picture into crystal cells, each filled with the average color of its area.',
  animated: true,
  animates: params => params.drift > 0,
  preview: { zoom: 2 },
  params: [
    { key: 'size', label: 'Cell size', type: 'number', min: 4, max: 120, step: 0.5, default: 26 },
    { key: 'jitter', label: 'Irregularity', type: 'number', min: 0, max: 1, step: 0.01, default: 0.85 },
    { key: 'facets', label: 'Facet shading', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    {
      key: 'cut',
      label: 'Facet cut',
      type: 'select',
      default: 'gem',
      options: [
        { value: 'gem', label: 'Cut gem' },
        { value: 'tilted', label: 'Tilted plates' }
      ],
      when: params => params.facets > 0
    },
    {
      key: 'light',
      label: 'Light angle',
      type: 'number',
      min: 0,
      max: 360,
      step: 1,
      default: 135,
      when: params => params.facets > 0
    },
    { key: 'edges', label: 'Edges', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { key: 'edgeColor', label: 'Edge color', type: 'color', default: '#141217', when: params => params.edges > 0 },
    { key: 'drift', label: 'Drift', type: 'number', min: 0, max: 2, step: 0.01, default: 0 },
    { key: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 0 }
  ],
  render(ctx, input, params) {
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const cell = Math.max(3, params.size * ctx.unit);
    const row = cell * 0.8660254;
    const lattice = {
      uCell: cell,
      uJitter: params.jitter,
      uSeed: params.variation,
      uDrift: ctx.time * params.drift
    };
    const drift = params.drift > 0;
    const prefix = drift ? '#define DRIFT 1\n' : '';
    const cells = ctx.pass(drift ? 'crystallize-cells-drift' : 'crystallize-cells', prefix + CELLS, {
      input: source,
      target: ctx.target(Math.ceil(ctx.width / cell) + 6, Math.ceil(ctx.height / row) + 6, { filter: 'nearest' }),
      uniforms: {
        ...lattice,
        uImage: [ctx.width, ctx.height],
        uLod: Math.max(0, Math.log2(cell * 0.4))
      }
    });
    const output = ctx.pass(drift ? 'crystallize-drift' : 'crystallize', prefix + SHADE, {
      input: source,
      textures: { uCells: cells },
      uniforms: {
        ...lattice,
        uFacets: params.facets,
        uCut: params.cut === 'tilted' ? 0 : 1,
        uLight: (params.light * Math.PI) / 180,
        uEdges: params.edges,
        uEdgeColor: hexToRgb(params.edgeColor)
      }
    });
    ctx.release(cells);
    return output;
  }
};
