import { buildGlyphAtlas, ensureGlyphFont, hexToRgb } from '../engine/assets';

const LABEL_CHARS = '0123456789ABCDEF#xy';
const WEIGHT = 500;
const MAX_BOXES = 24;
const ANALYSIS_SIZE = 384;

const ANALYSIS = `
uniform float uLod;

void main() {
  outColor = vec4(textureLod(uInput, vUv, uLod).rgb, 1.0);
}`;

const CANDIDATES = `
uniform vec2 uCount;
uniform float uBox;
uniform float uLod;
uniform float uSeed;
uniform vec2 uImage;
uniform sampler2D uHistory;
uniform float uSticky;
uniform float uKept;

vec3 photo(vec2 p, float lod) {
  return textureLod(uInput, clamp(p / uImage, 0.0, 1.0), lod).rgb;
}

void main() {
  int index = int(gl_FragCoord.x);
  int columns = int(uCount.x);
  vec2 grid = vec2(float(index % columns), float(index / columns));
  vec2 spacing = uImage / uCount;
  vec2 center = (grid + 0.5 + (hash22(grid * 1.31 + uSeed) - 0.5) * 0.7) * spacing;
  float reach = uBox * 0.5;
  float tones[25];
  float fine[25];
  float sum = 0.0;
  float squares = 0.0;
  float chroma = 0.0;
  float grain = 0.0;
  for (int y = 0; y < 5; y++) {
    for (int x = 0; x < 5; x++) {
      vec2 offset = (vec2(float(x), float(y)) - 2.0) / 2.0 * reach * 0.8;
      vec3 c = photo(center + offset, uLod);
      float l = luma(c);
      float f = abs(luma(photo(center + offset, max(uLod - 1.0, 0.0))) - l);
      tones[y * 5 + x] = l;
      fine[y * 5 + x] = f;
      sum += l;
      squares += l * l;
      grain += f;
      chroma += max(max(c.r, c.g), c.b) - min(min(c.r, c.g), c.b);
    }
  }
  float average = sum / 25.0;
  float spread = sqrt(max(squares / 25.0 - average * average, 0.0));
  float steps = 0.0;
  for (int y = 0; y < 5; y++) {
    for (int x = 0; x < 4; x++) {
      steps += abs(tones[y * 5 + x + 1] - tones[y * 5 + x]) + abs(tones[x * 5 + y + 5] - tones[x * 5 + y]);
    }
  }
  vec2 pull = vec2(0.0);
  float total = 0.0;
  for (int y = 0; y < 5; y++) {
    for (int x = 0; x < 5; x++) {
      vec2 offset = (vec2(float(x), float(y)) - 2.0) / 2.0 * reach * 0.8;
      float w = abs(tones[y * 5 + x] - average) + fine[y * 5 + x] * 2.0;
      w *= w;
      pull += offset * w;
      total += w;
    }
  }
  center += pull / max(total, 1e-5) * 0.6;
  center = clamp(center, vec2(reach + uBox * 0.06), uImage - reach - uBox * 0.06);
  vec3 local = photo(center, uLod + 2.3);
  vec3 wide = photo(center, uLod + 4.0);
  float distinct = length(local - wide);
  float score = spread * 1.6 + steps / 40.0 * 2.0 + grain / 25.0 * 3.0 + distinct * 1.5 + chroma / 25.0 * 0.12;
  score = score * (0.8 + 0.4 * hash12(grid * 2.71 + uSeed * 1.7)) + 0.05 * hash12(grid * 5.13 + uSeed * 0.9);
  if (uSticky > 0.5) {
    float near = 0.0;
    for (int k = 0; k < ${MAX_BOXES}; k++) {
      if (k >= int(uKept)) break;
      vec4 h = texelFetch(uHistory, ivec2(k, 2), 0);
      if (h.z < 0.5) continue;
      near = max(near, 1.0 - smoothstep(uBox * 0.15, uBox * 0.6, distance(h.xy, center)));
    }
    score *= 1.0 + 0.45 * near;
  }
  outColor = vec4(center, score, 1.0);
}`;

const GATHER = `
uniform sampler2D uCandidates;
uniform float uTotal;
uniform float uLayout;
uniform float uCount;
uniform float uBox;
uniform float uGap;
uniform vec2 uImage;
uniform float uWander;
uniform float uSeed;

void main() {
  int i = int(gl_FragCoord.x);
  vec2 center = vec2(0.0);
  float valid = 0.0;
  if (uLayout > 0.5) {
    float columns = max(1.0, floor(sqrt(uCount * uImage.x / uImage.y) + 0.5));
    float rows = ceil(uCount / columns);
    float column = mod(float(i), columns);
    float row = floor(float(i) / columns);
    float inRow = min(columns, uCount - row * columns);
    vec2 cell = vec2(uImage.x / columns, uImage.y / rows);
    float shift = (columns - inRow) * 0.5;
    center = vec2((column + shift + 0.5) * cell.x, uImage.y - (row + 0.5) * cell.y);
    valid = float(i) < uCount ? 1.0 : 0.0;
  } else {
    vec2 chosen[${MAX_BOXES}];
    for (int n = 0; n < ${MAX_BOXES}; n++) {
      if (n >= int(uCount) || n > i) break;
      float best = -1.0;
      vec2 pick = vec2(0.0);
      for (int j = 0; j < 1024; j++) {
        if (j >= int(uTotal)) break;
        vec4 c = texelFetch(uCandidates, ivec2(j, 0), 0);
        if (c.z <= best) continue;
        bool free = true;
        for (int m = 0; m < ${MAX_BOXES}; m++) {
          if (m >= n) break;
          vec2 d = abs(chosen[m] - c.xy);
          if (max(d.x, d.y) < uGap) {
            free = false;
            break;
          }
        }
        if (free) {
          best = c.z;
          pick = c.xy;
        }
      }
      if (best < 0.0) break;
      chosen[n] = pick;
      if (n == i) {
        center = pick;
        valid = 1.0;
      }
    }
  }
  vec2 base = center;
  if (uWander > 0.0) {
    float id = float(i) * 7.31 + uSeed;
    vec2 drift = vec2(valueNoise(vec2(id, uTime * 0.35)), valueNoise(vec2(id + 41.0, uTime * 0.35 + 9.0))) - 0.5;
    center += drift * uBox * 0.5 * uWander;
    center = clamp(center, vec2(uBox * 0.56), uImage - uBox * 0.56);
  }
  vec3 color = textureLod(uInput, center / uImage, log2(max(uBox * 0.35, 1.0))).rgb;
  if (gl_FragCoord.y < 1.0) outColor = vec4(center, valid, 1.0);
  else if (gl_FragCoord.y < 2.0) outColor = vec4(color, 1.0);
  else outColor = vec4(base, valid, 1.0);
}`;

const NEIGHBORS = `
uniform sampler2D uBoxes;
uniform float uCount;

void main() {
  int i = int(gl_FragCoord.x);
  vec4 a = texelFetch(uBoxes, ivec2(i, 0), 0);
  float first = -1.0;
  float second = -1.0;
  float d1 = 1e20;
  float d2 = 1e20;
  for (int j = 0; j < ${MAX_BOXES}; j++) {
    if (j >= int(uCount)) break;
    if (j == i) continue;
    vec4 b = texelFetch(uBoxes, ivec2(j, 0), 0);
    if (b.z < 0.5) continue;
    float d = distance(a.xy, b.xy);
    if (d < d1) {
      d2 = d1;
      second = first;
      d1 = d;
      first = float(j);
    } else if (d < d2) {
      d2 = d;
      second = float(j);
    }
  }
  outColor = vec4(first, second, d1, d2);
}`;

const DRAW = `
uniform sampler2D uBoxes;
uniform sampler2D uLinks;
uniform sampler2D uAtlas;
uniform float uCount;
uniform float uHalf;
uniform float uRadius;
uniform float uStroke;
uniform vec3 uColor;
uniform float uFill;
uniform float uLabels;
uniform float uConnect;
uniform float uDim;
uniform float uTextHeight;
uniform vec2 uAtlasGrid;
uniform float uAspect;
uniform float uGlyphs[19];
uniform float uDot;

float roundBox(vec2 q, float r) {
  vec2 d = abs(q) - vec2(uHalf) + r;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
}

vec2 glyph(vec2 p, vec2 origin, float index, float w, float h) {
  vec2 local = (p - origin) / vec2(w, h);
  if (local.x < 0.0 || local.y < 0.0 || local.x > 1.0 || local.y > 1.0) return vec2(0.0);
  float column = mod(index, uAtlasGrid.x);
  float row = floor(index / uAtlasGrid.x);
  vec2 uv = vec2((column + local.x) / uAtlasGrid.x, 1.0 - (row + 1.0 - local.y) / uAtlasGrid.y);
  vec2 gx = vec2(1.0 / (w * uAtlasGrid.x), 0.0);
  vec2 gy = vec2(0.0, 1.0 / (h * uAtlasGrid.y));
  return vec2(textureGrad(uAtlas, uv, gx, gy).a, textureGrad(uAtlas, uv, gx * 5.0, gy * 5.0).a);
}

int digit(float value, int place) {
  float scale = place == 0 ? 1.0 : (place == 1 ? 10.0 : 100.0);
  float v = floor((value + 0.5) / scale);
  return int(v - floor(v / 10.0) * 10.0);
}

int codeAt(int slot, float index, vec2 center, vec3 swatch) {
  if (uLabels < 0.5) {
    float x = clamp(floor(center.x / uResolution.x * 1000.0), 0.0, 999.0);
    float y = clamp(floor((1.0 - center.y / uResolution.y) * 1000.0), 0.0, 999.0);
    if (slot == 0) return 17;
    if (slot >= 2 && slot <= 4) return digit(x, 4 - slot);
    if (slot == 7) return 18;
    if (slot >= 9 && slot <= 11) return digit(y, 11 - slot);
    return -1;
  }
  if (uLabels < 1.5) {
    if (slot == 0) return 16;
    if (slot > 6) return -1;
    int channel = (slot - 1) / 2;
    float c = channel == 0 ? swatch.r : (channel == 1 ? swatch.g : swatch.b);
    float byte = floor(clamp(c, 0.0, 1.0) * 255.0 + 0.5);
    float high = floor(byte / 16.0);
    return int(slot % 2 == 1 ? high : byte - high * 16.0);
  }
  if (slot > 1) return -1;
  return digit(index + 1.0, 1 - slot);
}

vec2 label(vec2 p, vec2 origin, float index, vec2 center, vec3 swatch) {
  float h = uTextHeight;
  float w = h * uAspect * 0.78;
  vec2 local = p - origin;
  if (local.y < 0.0 || local.y > h || local.x < 0.0 || local.x > w * 12.0) return vec2(0.0);
  int slot = int(floor(local.x / w));
  int code = codeAt(slot, index, center, swatch);
  if (code < 0) return vec2(0.0);
  return glyph(p, origin + vec2(float(slot) * w - (h * uAspect - w) * 0.5, 0.0), uGlyphs[code], h * uAspect, h);
}

void main() {
  vec2 p = gl_FragCoord.xy;
  vec3 image = texture(uInput, vUv).rgb;
  float inside = 0.0;
  float edge = 0.0;
  float shade = 0.0;
  float text = 0.0;
  float halo = 0.0;
  float dots = 0.0;
  vec3 fill = image;
  for (int i = 0; i < ${MAX_BOXES}; i++) {
    if (i >= int(uCount)) break;
    vec4 box = texelFetch(uBoxes, ivec2(i, 0), 0);
    if (box.z < 0.5) continue;
    vec3 swatch = texelFetch(uBoxes, ivec2(i, 1), 0).rgb;
    vec2 q = p - box.xy;
    float d = roundBox(q, uRadius);
    float cover = 1.0 - smoothstep(-0.5, 0.5, d);
    if (cover > 0.0) {
      vec3 content = image;
      if (uFill > 0.5 && uFill < 1.5) content = swatch;
      if (uFill > 1.5) content = textureLod(uInput, (box.xy + q * 0.5) / uResolution, 0.0).rgb;
      fill = mix(fill, content, cover);
    }
    inside = max(inside, cover);
    edge = max(edge, 1.0 - smoothstep(uStroke - 0.5, uStroke + 0.5, abs(d)));
    shade = max(shade, 1.0 - smoothstep(uStroke + 0.5, uStroke * 3.0 + 1.5, abs(d)));
    if (uLabels < 2.5) {
      vec2 origin = box.xy + vec2(-uHalf + uRadius * 0.3, uHalf + uTextHeight * 0.35);
      vec2 t = label(p, origin, float(i), box.xy, swatch);
      text = max(text, t.x);
      halo = max(halo, t.y);
    }
    if (uConnect > 0.5) {
      vec4 near = texelFetch(uLinks, ivec2(i, 0), 0);
      for (int k = 0; k < 2; k++) {
        float j = k == 0 ? near.x : near.y;
        if (j < 0.0) continue;
        vec2 other = texelFetch(uBoxes, ivec2(int(j), 0), 0).xy;
        vec2 dir = other - box.xy;
        float len = length(dir);
        if (len < 1.0) continue;
        dir /= len;
        vec2 rel = p - box.xy;
        float s = dot(rel, dir);
        float e = abs(dir.x * rel.y - dir.y * rel.x);
        if (s < 0.0 || s > len || e > uDot * 3.0) continue;
        float spacing = uDot * 4.5;
        float middle = len * 0.5;
        float k0 = floor((s - middle) / spacing + 0.5);
        float at = middle + k0 * spacing;
        vec2 centerDot = box.xy + dir * at;
        float clear = min(roundBox(centerDot - box.xy, uRadius), roundBox(centerDot - other, uRadius));
        if (clear < uDot * 3.0) continue;
        float r = length(vec2(s - at, e));
        dots = max(dots, 1.0 - smoothstep(uDot - 0.5, uDot + 0.5, r));
      }
    }
  }
  vec3 color = mix(image, image * 0.32, uDim * (1.0 - inside));
  color = mix(color, fill, inside);
  float lift = luma(uColor) > 0.5 ? 1.0 : 0.0;
  color = mix(color, color * 0.55, shade * 0.45 * lift);
  color = mix(color, uColor, dots * 0.75);
  color = mix(color, uColor, edge);
  color = mix(color, color * 0.35, clamp(halo * 1.6, 0.0, 1.0) * 0.6 * lift);
  color = mix(color, uColor, clamp(text, 0.0, 1.0));
  outColor = vec4(color, 1.0);
}`;

const FILLS = { frame: 0, swatch: 1, zoom: 2 };
const LABELS = { coords: 0, hex: 1, index: 2, none: 3 };

function atlasFor(ctx, state) {
  if (!state.atlas || (!state.atlas.fontReady && state.fontLoaded)) {
    if (state.atlas) ctx.gl.deleteTexture(state.atlas.texture);
    state.atlas = buildGlyphAtlas(ctx.engine, LABEL_CHARS, WEIGHT);
    state.glyphs = [...LABEL_CHARS].map(char => state.atlas.chars.indexOf(char));
    if (!state.atlas.fontReady && !state.fontPending) {
      state.fontPending = true;
      ensureGlyphFont().then(() => {
        state.fontLoaded = true;
      });
    }
  }
  return state.atlas;
}

export default {
  id: 'specimen',
  name: 'Specimen',
  category: 'geometric',
  description:
    'Boxes the most striking parts of the picture like a specimen sheet, with sampled colors and small labels.',
  animated: true,
  animates: params => params.motion > 0,
  params: [
    {
      key: 'layout',
      label: 'Layout',
      type: 'select',
      default: 'detect',
      options: [
        { value: 'detect', label: 'Points of interest' },
        { value: 'grid', label: 'Sheet' }
      ]
    },
    { key: 'count', label: 'Boxes', type: 'number', min: 1, max: MAX_BOXES, step: 1, default: 6 },
    { key: 'size', label: 'Box size', type: 'number', min: 40, max: 400, step: 1, default: 150 },
    {
      key: 'fill',
      label: 'Fill',
      type: 'select',
      default: 'frame',
      options: [
        { value: 'frame', label: 'Outline' },
        { value: 'swatch', label: 'Swatch' },
        { value: 'zoom', label: 'Magnify' }
      ]
    },
    {
      key: 'labels',
      label: 'Labels',
      type: 'select',
      default: 'coords',
      options: [
        { value: 'coords', label: 'Coordinates' },
        { value: 'hex', label: 'Hex color' },
        { value: 'index', label: 'Numbers' },
        { value: 'none', label: 'None' }
      ]
    },
    { key: 'links', label: 'Connectors', type: 'boolean', default: true },
    { key: 'stroke', label: 'Stroke color', type: 'color', default: '#cfdcb8' },
    { key: 'width', label: 'Stroke width', type: 'number', min: 0.5, max: 6, step: 0.1, default: 2.4 },
    { key: 'radius', label: 'Corner radius', type: 'number', min: 0, max: 0.5, step: 0.01, default: 0.12 },
    { key: 'dim', label: 'Dim outside', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { key: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 0 },
    { key: 'motion', label: 'Wander', type: 'number', min: 0, max: 1, step: 0.01, default: 0 }
  ],
  render(ctx, input, params, state) {
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const count = Math.max(1, Math.min(MAX_BOXES, Math.round(params.count)));
    const columns = Math.max(1, Math.floor(Math.sqrt((count * ctx.width) / ctx.height) + 0.5));
    const rows = Math.ceil(count / columns);
    const fit = Math.min(ctx.width / columns, ctx.height / rows) * 0.86;
    const box = Math.max(8, params.layout === 'grid' ? Math.min(params.size * ctx.unit, fit) : params.size * ctx.unit);
    const seed = (Math.round(params.variation) % 997) * 1.618;
    const grid = params.layout === 'grid';
    const key = [ctx.width, ctx.height, params.layout, count, params.size, params.variation].join(':');
    const elapsed = ctx.time - (state.historyTime ?? Infinity);
    const sticky = Boolean(state.history) && state.historyKey === key && elapsed > 0 && elapsed < 0.5;
    let candidates = null;
    let total = 1;
    if (!grid) {
      const spacing = box * 0.8;
      const kx = Math.max(1, Math.min(28, Math.round(ctx.width / spacing)));
      const ky = Math.max(1, Math.min(28, Math.round(ctx.height / spacing)));
      total = kx * ky;
      const long = Math.max(ctx.width, ctx.height);
      const scale = ANALYSIS_SIZE / long;
      const analysis = ctx.pass('specimen-analysis', ANALYSIS, {
        input: source,
        target: ctx.target(Math.max(1, Math.round(ctx.width * scale)), Math.max(1, Math.round(ctx.height * scale))),
        uniforms: { uLod: Math.max(0, Math.log2(1 / scale) - 0.5) }
      });
      ctx.mipmap(analysis);
      candidates = ctx.pass('specimen-candidates', CANDIDATES, {
        input: analysis,
        target: ctx.target(total, 1, { filter: 'nearest' }),
        textures: { uHistory: sticky ? state.history : source },
        uniforms: {
          uSticky: sticky,
          uKept: state.historyCount || 0,
          uCount: [kx, ky],
          uBox: box,
          uLod: Math.max(0, Math.log2((box * scale) / 10)),
          uSeed: seed,
          uImage: [ctx.width, ctx.height]
        }
      });
      ctx.release(analysis);
    }
    const boxes = ctx.pass('specimen-gather', GATHER, {
      input: source,
      target: ctx.target(MAX_BOXES, 3, { filter: 'nearest' }),
      textures: { uCandidates: candidates || source },
      uniforms: {
        uTotal: total,
        uLayout: grid ? 1 : 0,
        uCount: count,
        uBox: box,
        uGap: box * 1.16,
        uImage: [ctx.width, ctx.height],
        uWander: params.motion,
        uSeed: seed
      }
    });
    if (candidates) ctx.release(candidates);
    const links = ctx.pass('specimen-neighbors', NEIGHBORS, {
      input: source,
      target: ctx.target(MAX_BOXES, 1, { filter: 'nearest' }),
      textures: { uBoxes: boxes },
      uniforms: { uCount: count }
    });
    const atlas = atlasFor(ctx, state);
    const output = ctx.pass('specimen-draw', DRAW, {
      input: source,
      textures: { uBoxes: boxes, uLinks: links, uAtlas: atlas.texture },
      uniforms: {
        uCount: count,
        uHalf: box * 0.5,
        uRadius: Math.min(params.radius, 0.5) * box * 0.5,
        uStroke: Math.max(0.5, params.width * 0.5 * ctx.unit),
        uColor: hexToRgb(params.stroke),
        uFill: FILLS[params.fill] ?? 0,
        uLabels: LABELS[params.labels] ?? 0,
        uConnect: params.links,
        uDim: params.dim,
        uTextHeight: Math.max(7, 13 * ctx.unit),
        uAtlasGrid: atlas.grid,
        uAspect: atlas.aspect,
        uGlyphs: state.glyphs,
        uDot: Math.max(0.6, 1.1 * ctx.unit)
      }
    });
    if (state.history) ctx.release(state.history);
    state.history = boxes;
    state.historyKey = key;
    state.historyTime = ctx.time;
    state.historyCount = count;
    ctx.release(links);
    return output;
  },
  dispose(gl, state) {
    if (state.atlas) gl.deleteTexture(state.atlas.texture);
    if (state.history) {
      gl.deleteTexture(state.history.texture);
      gl.deleteFramebuffer(state.history.fbo);
    }
    state.atlas = null;
    state.history = null;
  }
};
