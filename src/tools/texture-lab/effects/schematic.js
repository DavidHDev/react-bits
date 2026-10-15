import { buildGlyphAtlas, ensureGlyphFont, hexToRgb } from '../engine/assets';

const LABEL_CHARS = 'RCUQ0123456789';
const WEIGHT = 600;

const NODES = `
uniform vec2 uCellPx;
uniform vec2 uImage;
uniform float uLod;
uniform float uSeed;

float tone(vec2 p) {
  return luma(textureLod(uInput, clamp(p / uImage, 0.0, 1.0), uLod).rgb);
}

float salience(vec2 p, float reach) {
  float l = tone(p);
  float gx = tone(p + vec2(reach, 0.0)) - tone(p - vec2(reach, 0.0));
  float gy = tone(p + vec2(0.0, reach)) - tone(p - vec2(0.0, reach));
  return length(vec2(gx, gy)) * (0.35 + l);
}

void main() {
  vec2 cell = floor(gl_FragCoord.xy);
  vec2 origin = cell * uCellPx;
  float reach = exp2(uLod);
  vec2 sum = vec2(0.0);
  float total = 0.0;
  float best = 0.0;
  for (int y = 0; y < 5; y++) {
    for (int x = 0; x < 5; x++) {
      vec2 jitter = (hash22(cell * 5.0 + vec2(float(x), float(y)) + uSeed) - 0.5) * 0.14;
      vec2 local = clamp((vec2(float(x), float(y)) + 0.5) / 5.0 + jitter, 0.08, 0.92);
      float s = salience(origin + local * uCellPx, reach);
      float s2 = s * s;
      float w = s2 * s2 * s2 + 1e-24;
      sum += local * w;
      total += w;
      best = max(best, s);
    }
  }
  vec2 local = sum / total;
  outColor = vec4(local, best, tone(origin + local * uCellPx));
}`;

const DRAW = `
uniform sampler2D uNodes;
uniform sampler2D uAtlas;
uniform vec2 uGrid;
uniform vec2 uCellPx;
uniform float uTop;
uniform float uThreshold;
uniform float uLinks;
uniform float uStyle;
uniform float uRadius;
uniform float uLine;
uniform float uLabels;
uniform float uGridAmount;
uniform float uInkMode;
uniform vec3 uInk;
uniform float uBackground;
uniform float uPulse;
uniform float uSignals;
uniform float uSeed;
uniform vec2 uAtlasGrid;
uniform float uGlyphs[14];
uniform float uTextHeight;
uniform float uAspect;

vec3 backdrop(vec3 image) {
  float l = luma(image);
  if (uBackground < 0.5) return image;
  if (uBackground < 1.5) return mix(vec3(l), image, 0.75) * 0.4;
  if (uBackground < 2.5) return mix(vec3(0.03, 0.11, 0.24), vec3(0.15, 0.35, 0.6), pow(l, 1.25));
  return vec3(0.95, 0.935, 0.9) * (0.86 + 0.14 * l);
}

vec3 inkFor(vec3 back) {
  if (uInkMode > 0.5) return uInk;
  if (uBackground > 2.5) return vec3(0.1, 0.13, 0.18);
  if (uBackground > 1.5) return vec3(0.9, 0.95, 1.0);
  float l = luma(back);
  float peak = max(max(back.r, back.g), max(back.b, 0.05));
  vec3 light = mix(back / peak, vec3(1.0), 0.72);
  vec3 dark = back * 0.16;
  return mix(light, dark, smoothstep(0.52, 0.7, l));
}

float segment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}

vec2 along(vec2 a, vec2 bend, vec2 b, float t) {
  float l1 = length(bend - a);
  float l2 = length(b - bend);
  float s = t * (l1 + l2);
  return s < l1 ? mix(a, bend, s / max(l1, 1e-4)) : mix(bend, b, (s - l1) / max(l2, 1e-4));
}

vec2 corner(vec2 a, vec2 b) {
  vec2 d = b - a;
  if (abs(d.x) >= abs(d.y)) return vec2(b.x - sign(d.x) * abs(d.y), a.y);
  return vec2(a.x, b.y - sign(d.y) * abs(d.x));
}

float stroke(float d, float width) {
  return 1.0 - smoothstep(width - 0.5, width + 0.5, d);
}

float glyph(vec2 p, vec2 origin, float index) {
  float h = uTextHeight;
  float w = h * uAspect;
  vec2 local = (p - origin) / vec2(w, h);
  if (local.x < 0.0 || local.y < 0.0 || local.x > 1.0 || local.y > 1.0) return 0.0;
  float column = mod(index, uAtlasGrid.x);
  float row = floor(index / uAtlasGrid.x);
  vec2 uv = vec2((column + local.x) / uAtlasGrid.x, 1.0 - (row + 1.0 - local.y) / uAtlasGrid.y);
  vec2 gx = vec2(1.0 / (w * uAtlasGrid.x), 0.0);
  vec2 gy = vec2(0.0, 1.0 / (h * uAtlasGrid.y));
  return textureGrad(uAtlas, uv, gx, gy).a;
}

float label(vec2 p, vec2 origin, float id) {
  float w = uTextHeight * uAspect * 0.86;
  float letter = floor(hash11(id * 91.7) * 4.0);
  float number = 1.0 + floor(hash11(id * 37.3) * 98.0);
  float tens = floor(number / 10.0);
  float ones = number - tens * 10.0;
  float a = glyph(p, origin, uGlyphs[int(letter)]);
  if (tens > 0.0) {
    a = max(a, glyph(p, origin + vec2(w, 0.0), uGlyphs[4 + int(tens)]));
    a = max(a, glyph(p, origin + vec2(2.0 * w, 0.0), uGlyphs[4 + int(ones)]));
  } else {
    a = max(a, glyph(p, origin + vec2(w, 0.0), uGlyphs[4 + int(ones)]));
  }
  return a;
}

vec3 nodeAt(vec2 c, float mean) {
  if (c.x < 0.0 || c.y < 0.0 || c.x >= uGrid.x || c.y >= uGrid.y) return vec3(-1e5, -1e5, 0.0);
  vec4 n = texelFetch(uNodes, ivec2(c), 0);
  return vec3((c + n.xy) * uCellPx, smoothstep(uThreshold, uThreshold + 0.25, n.z / mean));
}

bool labeled(vec2 c, float mean) {
  return hash12(c * 0.71 + uSeed * 3.3) < 0.2 && nodeAt(c, mean).z >= 0.5;
}

void main() {
  vec2 p = gl_FragCoord.xy;
  vec3 image = texture(uInput, vUv).rgb;
  vec3 back = backdrop(image);
  vec3 ink = inkFor(backdrop(textureLod(uInput, vUv, 5.0).rgb));
  float mean = max(textureLod(uNodes, vec2(0.5), uTop).b, 1e-4);
  vec2 cell = floor(p / uCellPx);

  float lineAlpha = 0.0;
  float pulse = 0.0;
  float spark = 0.0;
  vec2 reach = vec2(uRadius * 5.0 + uLine);
  if (uStyle < 1.5) {
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 ca = cell + vec2(float(i), float(j));
        vec3 na = nodeAt(ca, mean);
        if (na.z <= 0.0) continue;
        for (int o = 0; o < 4; o++) {
          vec2 off = o == 0 ? vec2(1.0, 0.0) : (o == 1 ? vec2(0.0, 1.0) : (o == 2 ? vec2(1.0) : vec2(-1.0, 1.0)));
          if (o == 2 && hash12(ca + uSeed * 2.1) >= 0.5) continue;
          if (o == 3 && hash12(ca - vec2(1.0, 0.0) + uSeed * 2.1) < 0.5) continue;
          float pick = hash12(ca * 3.17 + float(o) * 19.31 + uSeed);
          if (pick > uLinks) continue;
          vec3 nb = nodeAt(ca + off, mean);
          if (nb.z <= 0.0) continue;
          vec2 pa = na.xy;
          vec2 pb = nb.xy;
          if (any(lessThan(p, min(pa, pb) - reach)) || any(greaterThan(p, max(pa, pb) + reach))) continue;
          float strength = min(na.z, nb.z);
          float d;
          vec2 bend = pa;
          if (uStyle > 0.5) {
            bend = corner(pa, pb);
            d = min(segment(p, pa, bend), segment(p, bend, pb));
          } else {
            d = segment(p, pa, pb);
          }
          lineAlpha = max(lineAlpha, stroke(d, uLine) * strength);
          if (uSignals > 0.5 && d < uRadius * 5.0 && hash11(pick * 3.9) < 0.7) {
            float rate = 0.35 + hash11(pick * 71.0) * 0.65;
            float t = fract(uPulse * rate + pick * 13.0);
            float span = length(bend - pa) + length(pb - bend);
            float tail = uRadius * 3.0 / max(span, 1.0);
            float forward = hash11(pick * 5.3) < 0.5 ? 1.0 : -1.0;
            float t0 = forward > 0.0 ? t : 1.0 - t;
            float t1 = clamp(t0 - forward * tail, 0.0, 1.0);
            vec2 head = along(pa, bend, pb, t0);
            vec2 back = along(pa, bend, pb, t1);
            float dp = segment(p, back, head);
            float visible = smoothstep(0.0, 0.1, t) * smoothstep(1.0, 0.9, t) * strength;
            pulse = max(pulse, stroke(dp, uLine * 2.0) * visible);
            spark = max(spark, exp(-dp * dp / (2.0 * uRadius * uRadius * 2.5)) * visible);
          }
        }
      }
    }
  }

  float nodeAlpha = 0.0;
  float halo = 0.0;
  float marks = 0.0;
  float text = 0.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 c = cell + vec2(float(i), float(j));
      vec3 node = nodeAt(c, mean);
      if (node.z <= 0.0) continue;
      float id = hash12(c * 0.71 + uSeed * 3.3);
      vec2 q = p - node.xy;
      float r = length(q);
      nodeAlpha = max(nodeAlpha, (1.0 - smoothstep(uRadius - 0.6, uRadius + 0.6, r)) * node.z);
      halo = max(halo, exp(-r * r / (2.0 * uRadius * uRadius * 9.0)) * node.z);
      if (uLabels < 0.5) continue;
      if (id < 0.2) {
        marks = max(marks, stroke(abs(r - uRadius * 2.8), uLine) * node.z);
        bool crowded = labeled(c + vec2(1.0, 0.0), mean) || labeled(c + vec2(1.0, 1.0), mean);
        crowded = crowded || labeled(c + vec2(0.0, 1.0), mean) || labeled(c + vec2(1.0, -1.0), mean);
        if (i <= 0 && j <= 0 && node.z >= 0.5 && !crowded) {
          vec2 start = node.xy + vec2(uRadius * 2.0);
          float rise = min(uCellPx.x, uCellPx.y) * 0.24;
          vec2 elbow = start + vec2(rise);
          float width = uTextHeight * uAspect * 0.86 * 3.2;
          float leader = min(segment(p, start, elbow), segment(p, elbow, elbow + vec2(width, 0.0)));
          marks = max(marks, stroke(leader, uLine * 0.85) * node.z);
          text = max(text, label(p, elbow + vec2(uTextHeight * 0.1, uTextHeight * -0.02), id) * node.z);
        }
      } else if (id < 0.34) {
        vec2 box = abs(q) - vec2(uRadius * 2.4);
        float frame = abs(max(box.x, box.y));
        marks = max(marks, stroke(frame, uLine) * node.z);
      } else if (id < 0.46) {
        float arm = max(abs(q.x), abs(q.y));
        float bar = min(abs(q.x), abs(q.y));
        float plus = stroke(bar, uLine) * step(uRadius * 1.8, arm) * step(arm, uRadius * 3.6);
        marks = max(marks, plus * node.z);
      }
    }
  }

  vec2 g = abs(fract(p / uCellPx + 0.5) - 0.5) * uCellPx;
  float gridLine = stroke(min(g.x, g.y), uLine * 0.6);
  vec2 major = abs(fract(p / (uCellPx * 4.0) + 0.5) - 0.5) * uCellPx * 4.0;
  float majorLine = stroke(min(major.x, major.y), uLine * 0.6);
  float gridAlpha = uGridAmount * (gridLine * 0.22 + majorLine * 0.28);

  vec3 color = back;
  color = mix(color, ink, clamp(gridAlpha, 0.0, 1.0));
  float lit = smoothstep(0.35, 0.65, luma(ink));
  color = mix(color, ink, halo * 0.26 * lit);
  color = mix(color, ink, lineAlpha * 0.78);
  color = mix(color, ink, marks * 0.9);
  color = mix(color, ink, nodeAlpha);
  color = mix(color, ink, clamp(text, 0.0, 1.0));
  vec3 hot = mix(ink, vec3(1.0), 0.6 * lit);
  color = mix(color, hot, clamp(spark * 0.45 * lit, 0.0, 1.0));
  color = mix(color, hot, clamp(pulse, 0.0, 1.0));
  outColor = vec4(color, 1.0);
}`;

const STYLES = { straight: 0, circuit: 1, none: 2 };
const BACKGROUNDS = { photo: 0, dim: 1, blueprint: 2, paper: 3 };

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
  id: 'schematic',
  name: 'Schematic',
  category: 'geometric',
  description: 'Draws a technical schematic over the subject: nodes on salient points, connectors and small callouts.',
  animated: true,
  animates: params => params.speed > 0 && params.style !== 'none',
  params: [
    { key: 'density', label: 'Node density', type: 'number', min: 8, max: 60, step: 1, default: 26 },
    { key: 'threshold', label: 'Selectivity', type: 'number', min: 0, max: 2.5, step: 0.01, default: 0.9 },
    {
      key: 'style',
      label: 'Connectors',
      type: 'select',
      default: 'straight',
      options: [
        { value: 'straight', label: 'Straight' },
        { value: 'circuit', label: 'Circuit' },
        { value: 'none', label: 'None' }
      ]
    },
    { key: 'links', label: 'Connections', type: 'number', min: 0, max: 1, step: 0.01, default: 0.7 },
    { key: 'size', label: 'Node size', type: 'number', min: 0.5, max: 4, step: 0.05, default: 1.4 },
    { key: 'labels', label: 'Callouts', type: 'boolean', default: true },
    { key: 'grid', label: 'Grid', type: 'number', min: 0, max: 1, step: 0.01, default: 0.25 },
    {
      key: 'background',
      label: 'Background',
      type: 'select',
      default: 'photo',
      options: [
        { value: 'photo', label: 'Photo' },
        { value: 'dim', label: 'Dimmed photo' },
        { value: 'blueprint', label: 'Blueprint' },
        { value: 'paper', label: 'Paper' }
      ]
    },
    {
      key: 'inkMode',
      label: 'Ink',
      type: 'select',
      default: 'auto',
      options: [
        { value: 'auto', label: 'Automatic' },
        { value: 'custom', label: 'Custom' }
      ]
    },
    { key: 'ink', label: 'Ink color', type: 'color', default: '#ffffff', when: params => params.inkMode === 'custom' },
    { key: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 0 },
    { key: 'speed', label: 'Signals', type: 'number', min: 0, max: 1, step: 0.01, default: 0.35 }
  ],
  render(ctx, input, params, state) {
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const long = Math.max(ctx.width, ctx.height);
    const cellSize = long / Math.max(params.density, 1);
    const nx = Math.max(2, Math.round(ctx.width / cellSize));
    const ny = Math.max(2, Math.round(ctx.height / cellSize));
    const cellPx = [ctx.width / nx, ctx.height / ny];
    const seed = (Math.round(params.variation) % 997) * 1.618;
    const nodes = ctx.pass('schematic-nodes', NODES, {
      input: source,
      target: ctx.target(nx, ny, { filter: 'nearest' }),
      uniforms: {
        uCellPx: cellPx,
        uImage: [ctx.width, ctx.height],
        uLod: Math.max(0, Math.log2(Math.min(cellPx[0], cellPx[1]) / 12)),
        uSeed: seed
      }
    });
    ctx.mipmap(nodes);
    const atlas = atlasFor(ctx, state);
    const output = ctx.pass('schematic-draw', DRAW, {
      input: source,
      textures: { uNodes: nodes, uAtlas: atlas.texture },
      uniforms: {
        uGrid: [nx, ny],
        uCellPx: cellPx,
        uTop: Math.ceil(Math.log2(Math.max(nx, ny))),
        uThreshold: params.threshold,
        uLinks: params.links,
        uStyle: STYLES[params.style] ?? 0,
        uRadius: Math.max(0.8, params.size * 1.6 * ctx.unit),
        uLine: Math.max(0.4, 0.55 * ctx.unit),
        uLabels: params.labels,
        uGridAmount: params.grid,
        uInkMode: params.inkMode === 'custom' ? 1 : 0,
        uInk: hexToRgb(params.ink),
        uBackground: BACKGROUNDS[params.background] ?? 0,
        uPulse: ctx.time * params.speed * 0.6,
        uSignals: params.speed > 0,
        uSeed: seed,
        uAtlasGrid: atlas.grid,
        uGlyphs: state.glyphs,
        uTextHeight: Math.max(6, 13 * ctx.unit),
        uAspect: atlas.aspect
      }
    });
    ctx.release(nodes);
    return output;
  },
  dispose(gl, state) {
    if (state.atlas) gl.deleteTexture(state.atlas.texture);
    state.atlas = null;
  }
};
