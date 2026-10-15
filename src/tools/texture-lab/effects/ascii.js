import { buildGlyphAtlas, ensureGlyphFont, hexToRgb } from '../engine/assets';
import { gaussianBlur } from '../engine/blur';
import { GRADIENTS } from './gradient';

const CHARSETS = {
  standard: ' .:-=+*#%@',
  letters: ' .-=+xX0S8#@',
  dense: ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
  minimal: ' .·:*oO@',
  mixed: ' .:-=+*xX#%░▒▓█@',
  binary: ' 01',
  matrix: ' .:ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ012345789Z',
  code: ' .,:;-~=+<>!?/\\|(){}[]#%&$@'
};

const SHAPES = { braille: 1, blocks: 2, dots: 3, diamonds: 4, crosses: 5, strokes: 6, lines: 7 };
const SHAPE_ASPECT = { braille: 0.55, blocks: 1, dots: 1, diamonds: 1, crosses: 1, strokes: 1, lines: 0.5 };
const SUBCELLS = { braille: [2, 4], blocks: [2, 2] };
const WEIGHTS = { light: 300, regular: 500, bold: 700, heavy: 900 };
const COLOR_MODES = { image: 0, ink: 1, gradient: 2, palette: 3 };
const BEHIND = { color: 0, image: 1, soft: 2 };

const COMPOSITE = `
uniform sampler2D uGlyphs;
uniform sampler2D uHalo;
uniform sampler2D uBack;
uniform vec3 uBackground;
uniform float uBehind;
uniform float uBackdrop;
uniform float uDim;
uniform float uGlow;

void main() {
  vec3 base;
  if (uBehind < 0.5) {
    base = uBackground;
    if (uBackdrop > 0.0) base = mix(uBackground, mix(uBackground, texture(uInput, vUv).rgb, 0.5), uBackdrop);
  } else {
    base = texture(uBack, vUv).rgb * (1.0 - uDim);
  }
  vec4 glyphs = texture(uGlyphs, vUv);
  vec3 color = base * (1.0 - glyphs.a) + glyphs.rgb;
  if (uGlow > 0.0) color += texture(uHalo, vUv).rgb * uGlow;
  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;

const CELLS = `
uniform vec2 uCell;
uniform vec2 uImage;

void main() {
  vec2 origin = floor(gl_FragCoord.xy) * uCell;
  vec3 sum = vec3(0.0);
  for (int y = 0; y < 4; y++) {
    for (int x = 0; x < 4; x++) {
      vec2 p = origin + (vec2(float(x), float(y)) + 0.5) * 0.25 * uCell;
      sum += texture(uInput, min(p, uImage - 0.5) / uImage).rgb;
    }
  }
  vec3 average = sum / 16.0;
  outColor = vec4(average, luma(average));
}`;

const GLYPHS = `
uniform sampler2D uCells;
uniform sampler2D uAtlas;
uniform vec2 uCell;
uniform vec2 uGrid;
uniform vec2 uAtlasGrid;
uniform float uCount;
uniform float uShape;
uniform float uMode;
uniform vec3 uInk;
uniform vec3 uAccent;
uniform vec3 uPalette[8];
uniform float uPaletteCount;
uniform float uLift;
uniform float uOpacity;
uniform float uCoverage;
uniform float uThreshold;
uniform float uFade;
uniform float uDepth;
uniform float uTwinkle;
uniform float uEdges;
uniform float uFlicker;
uniform float uRain;
uniform float uSpeed;
uniform float uContrast;
uniform float uBrightness;
uniform float uAuto;
uniform float uInvert;
uniform float uTop;
uniform float uSeed;
uniform float uGlyphCurve;

float tone(float v) {
  float mean = textureLod(uCells, vec2(0.5), uTop).a;
  v += clamp(0.5 - mean, -0.35, 0.35) * uAuto;
  v = clamp((v - 0.5) * uContrast + 0.5 + uBrightness, 0.0, 1.0);
  return uInvert > 0.5 ? 1.0 - v : v;
}

vec4 cellData(ivec2 c) {
  return texelFetch(uCells, clamp(c, ivec2(0), ivec2(uGrid) - 1), 0);
}

float cellTone(ivec2 c) {
  return tone(cellData(c).a);
}

float rainAt(vec2 cell, float rows) {
  float column = cell.x;
  float speed = 0.35 + hash11(column * 7.13) * 0.9;
  float offset = hash11(column * 3.71 + 11.0) * 40.0;
  float phase = uTime * uSpeed * speed * 0.12 + offset;
  float head = fract(phase) * (rows + 24.0) - 12.0;
  float behind = head - (rows - 1.0 - cell.y);
  float trail = behind >= 0.0 ? exp(-behind / (6.0 + hash11(column) * 10.0)) : 0.0;
  return trail * step(0.35, hash11(column * 1.91 + floor(phase) * 3.3));
}

float flickerAt(vec2 cell) {
  float tick = floor(uTime * 10.0 * uSpeed + hash12(cell) * 4.0);
  return hash12(cell + tick * 17.37) - 0.5;
}

float orderedTwo(vec2 a) {
  a = floor(a);
  return fract(dot(a, vec2(0.5, a.y * 0.75)));
}

float ordered(vec2 a) {
  return orderedTwo(0.5 * a) * 0.25 + orderedTwo(a);
}

vec3 paletteAt(float t) {
  float x = clamp(t, 0.0, 1.0) * (uPaletteCount - 1.0);
  float index = floor(x);
  vec3 a = uPalette[0];
  vec3 b = uPalette[0];
  for (int i = 0; i < 8; i++) {
    if (float(i) == index) a = uPalette[i];
    if (float(i) == min(index + 1.0, uPaletteCount - 1.0)) b = uPalette[i];
  }
  return mix(a, b, smoothstep(0.0, 1.0, x - index));
}

vec3 inkFor(vec3 color, float value) {
  vec3 ink;
  if (uMode < 0.5) {
    float peak = max(max(color.r, color.g), max(color.b, 0.08));
    ink = mix(color / peak, vec3(1.0), 0.08);
  } else if (uMode < 1.5) {
    ink = uInk;
  } else if (uMode < 2.5) {
    ink = mix(uInk, uAccent, smoothstep(0.15, 0.9, value));
  } else {
    ink = paletteAt(value);
  }
  return mix(ink, vec3(1.0), uLift);
}

float presence(vec2 cell, float value) {
  float pick = hash12(cell * 1.31 + uSeed * 7.7);
  float level = hash12(cell * 2.17 + uSeed * 3.1 + 11.0);
  float density = clamp(uCoverage * mix(1.0, 0.25 + value * 1.25, 0.6), 0.0, 1.0);
  float show = uCoverage >= 1.0 ? 1.0 : step(pick, density);
  show *= smoothstep(uThreshold, uThreshold + 0.16, value + (uThreshold <= 0.0 ? 1.0 : 0.0));
  float alpha = uOpacity * show * mix(1.0, 0.2 + 0.8 * level, uFade);
  if (uTwinkle > 0.0) {
    float wave = 0.5 + 0.5 * sin(uTime * uSpeed * (0.8 + level * 1.8) + pick * TAU);
    alpha *= 1.0 - uTwinkle * wave;
  }
  return alpha;
}

float focusOf(vec2 cell) {
  return step(hash12(cell * 0.73 + uSeed * 5.3 + 3.0), uDepth);
}

float sampleGlyph(float index, vec2 local, vec2 coord, float soft) {
  float column = mod(index, uAtlasGrid.x);
  float row = floor(index / uAtlasGrid.x);
  vec2 atlasUv = vec2((column + local.x) / uAtlasGrid.x, 1.0 - (row + 1.0 - local.y) / uAtlasGrid.y);
  vec2 continuous = coord / uAtlasGrid;
  float scale = exp2(soft * 2.4);
  return textureGrad(uAtlas, atlasUv, dFdx(continuous) * scale, dFdy(continuous) * scale).a;
}

float coverageOf(float d, float aa) {
  return 1.0 - smoothstep(-aa, aa, d);
}

vec4 shapeMark(vec2 coord, vec2 cell, vec2 local, vec4 data, float value) {
  vec2 p = (local - 0.5) * uCell / min(uCell.x, uCell.y);
  float aa = max(fwidth(p.x) * 0.9, 0.012);
  float d = 1.0;
  if (uShape < 3.5) {
    d = length(p) - 0.5 * sqrt(value) * 0.98;
  } else if (uShape < 4.5) {
    d = (abs(p.x) + abs(p.y)) - 0.62 * sqrt(value);
  } else if (uShape < 5.5) {
    vec2 q = value > 0.62 ? rotation(0.785398) * p : p;
    float arm = 0.46 * smoothstep(0.02, 0.5, value) + 0.04;
    float thick = 0.05 + 0.1 * value;
    d = max(min(abs(q.x), abs(q.y)) - thick, max(abs(q.x), abs(q.y)) - arm);
  } else if (uShape < 6.5) {
    ivec2 id = ivec2(cell);
    float gx = cellTone(id + ivec2(1, 0)) - cellTone(id - ivec2(1, 0));
    float gy = cellTone(id + ivec2(0, 1)) - cellTone(id - ivec2(0, 1));
    float strength = smoothstep(0.08, 0.22, length(vec2(gx, gy)));
    float angle = mix(0.785398, atan(gy, gx) + 1.5708, strength);
    vec2 q = rotation(-angle) * p;
    float thick = 0.03 + 0.17 * value;
    d = max(abs(q.y) - thick, abs(q.x) - 0.56);
  } else {
    d = abs(p.x) - (0.04 + 0.42 * value);
  }
  return vec4(data.rgb, coverageOf(d, aa));
}

vec4 subcellMark(vec2 px, out vec4 picked, out float value, out vec2 markCell) {
  vec2 coord = px / uCell;
  vec2 cell = floor(coord);
  vec2 local = coord - cell;
  vec2 counts = uShape < 1.5 ? vec2(2.0, 4.0) : vec2(2.0);
  vec2 sub = min(floor(local * counts), counts - 1.0);
  vec2 id = cell * counts + sub;
  vec4 data = cellData(ivec2(id));
  value = tone(data.a);
  if (uRain > 0.0) value = clamp(value + rainAt(cell, uGrid.y / counts.y) * uRain * 0.85, 0.0, 1.0);
  if (uFlicker > 0.0) value = clamp(value + flickerAt(id) * uFlicker * 0.5, 0.0, 1.0);
  float on = step(ordered(id) * (uShape < 1.5 ? 0.94 : 0.7) + (uShape < 1.5 ? 0.03 : 0.02), value);
  float coverage;
  if (uShape < 1.5) {
    vec2 center = vec2(sub.x < 0.5 ? 0.28 : 0.72, 0.5 + (sub.y - 1.5) * 0.235);
    float dist = length((local - center) * uCell);
    float radius = 0.095 * uCell.y;
    float aa = max(fwidth(dist), 0.5);
    coverage = 1.0 - smoothstep(radius - aa, radius + aa, dist);
  } else {
    vec2 q = abs(fract(local * counts) - 0.5);
    float edge = max(q.x, q.y);
    float aa = max(fwidth(edge), 0.004);
    coverage = 1.0 - smoothstep(0.46 - aa, 0.46 + aa, edge);
  }
  picked = data;
  markCell = id;
  return vec4(data.rgb, on * coverage);
}

void main() {
  vec2 px = vUv * uResolution;
  vec4 mark;
  vec4 data;
  float value;
  vec2 cell;
  if (uShape > 0.5 && uShape < 2.5) {
    mark = subcellMark(px, data, value, cell);
  } else {
    vec2 coord = px / uCell;
    cell = floor(coord);
    vec2 local = coord - cell;
    ivec2 id = ivec2(cell);
    data = cellData(id);
    value = tone(data.a);
    float rain = 0.0;
    if (uRain > 0.0) {
      rain = rainAt(cell, uGrid.y) * uRain;
      value = clamp(value + rain * 0.85, 0.0, 1.0);
    }
    if (uFlicker > 0.0) {
      value = clamp(value + flickerAt(cell) * uFlicker * (uShape > 0.5 ? 0.25 : 2.2 / max(uCount - 1.0, 1.0)), 0.0, 1.0);
    }
    if (uShape > 2.5) {
      mark = shapeMark(coord, cell, local, data, value);
    } else {
      float glyphValue = clamp(pow(value, uGlyphCurve), 0.0, 1.0);
      float index = floor(glyphValue * (uCount - 1.0) + 0.5);
      if (uEdges > 0.0) {
        float tl = cellTone(id + ivec2(-1, 1));
        float tc = cellTone(id + ivec2(0, 1));
        float tr = cellTone(id + ivec2(1, 1));
        float ml = cellTone(id + ivec2(-1, 0));
        float mr = cellTone(id + ivec2(1, 0));
        float bl = cellTone(id + ivec2(-1, -1));
        float bc = cellTone(id + ivec2(0, -1));
        float br = cellTone(id + ivec2(1, -1));
        float gx = (tr + 2.0 * mr + br) - (tl + 2.0 * ml + bl);
        float gy = (tl + 2.0 * tc + tr) - (bl + 2.0 * bc + br);
        if (length(vec2(gx, gy)) > mix(2.4, 0.45, uEdges)) {
          float angle = atan(gy, gx);
          float bin = mod(floor((angle + PI / 8.0) / (PI / 4.0)) + 8.0, 4.0);
          index = uCount + (bin < 0.5 ? 2.0 : bin < 1.5 ? 3.0 : bin < 2.5 ? 0.0 : 1.0);
          value = max(value, 0.55);
        }
      }
      mark = vec4(data.rgb, sampleGlyph(index, local, coord, focusOf(cell)));
      data.rgb = mix(data.rgb, vec3(1.0), rain * 0.75);
    }
  }
  float alpha = clamp(presence(cell, value) * mark.a * (1.0 - focusOf(cell) * 0.3), 0.0, 1.0);
  outColor = vec4(inkFor(data.rgb, value) * alpha, alpha);
}`;

export default {
  id: 'ascii',
  name: 'ASCII',
  category: 'type',
  description:
    'Rebuilds the image from characters, braille, blocks or shapes, over a solid color or the softened photo.',
  animated: true,
  animates: params => params.speed > 0 && (params.flicker > 0 || params.rain > 0 || params.twinkle > 0),
  params: [
    {
      key: 'charset',
      label: 'Characters',
      type: 'select',
      default: 'standard',
      options: [
        { value: 'standard', label: 'Standard' },
        { value: 'letters', label: 'Letters' },
        { value: 'dense', label: 'Dense' },
        { value: 'minimal', label: 'Minimal' },
        { value: 'mixed', label: 'Mixed' },
        { value: 'blocks', label: 'Blocks' },
        { value: 'braille', label: 'Braille dots' },
        { value: 'dots', label: 'Dots' },
        { value: 'diamonds', label: 'Diamonds' },
        { value: 'crosses', label: 'Crosses' },
        { value: 'strokes', label: 'Strokes' },
        { value: 'lines', label: 'Lines' },
        { value: 'binary', label: 'Binary' },
        { value: 'matrix', label: 'Matrix' },
        { value: 'code', label: 'Code' },
        { value: 'custom', label: 'Custom' }
      ]
    },
    {
      key: 'text',
      label: 'Custom set',
      type: 'text',
      default: ' .:-=+*#%@',
      when: params => params.charset === 'custom'
    },
    { key: 'size', label: 'Size', type: 'number', min: 3, max: 40, step: 0.5, default: 10 },
    {
      key: 'weight',
      label: 'Weight',
      type: 'select',
      default: 'bold',
      options: [
        { value: 'light', label: 'Light' },
        { value: 'regular', label: 'Regular' },
        { value: 'bold', label: 'Bold' },
        { value: 'heavy', label: 'Heavy' }
      ],
      when: params => !(params.charset in SHAPES)
    },
    {
      key: 'behind',
      label: 'Background',
      type: 'select',
      default: 'color',
      options: [
        { value: 'color', label: 'Solid color' },
        { value: 'image', label: 'Image' },
        { value: 'soft', label: 'Soft image' }
      ]
    },
    {
      key: 'background',
      label: 'Background color',
      type: 'color',
      default: '#0c0b10',
      when: params => params.behind === 'color'
    },
    {
      key: 'backdrop',
      label: 'Image behind',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0,
      when: params => params.behind === 'color'
    },
    {
      key: 'blur',
      label: 'Softness',
      type: 'number',
      min: 0,
      max: 40,
      step: 0.5,
      default: 14,
      when: params => params.behind === 'soft'
    },
    {
      key: 'dim',
      label: 'Dim image',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0,
      when: params => params.behind !== 'color'
    },
    {
      key: 'color',
      label: 'Color',
      type: 'select',
      default: 'image',
      options: [
        { value: 'image', label: 'From image' },
        { value: 'ink', label: 'Single ink' },
        { value: 'gradient', label: 'Two tone' },
        { value: 'palette', label: 'Palette' }
      ]
    },
    {
      key: 'ink',
      label: 'Ink',
      type: 'color',
      default: '#f2efe8',
      when: params => params.color === 'ink' || params.color === 'gradient'
    },
    {
      key: 'accent',
      label: 'Highlight',
      type: 'color',
      default: '#7cffb2',
      when: params => params.color === 'gradient'
    },
    {
      key: 'palette',
      label: 'Palette',
      type: 'select',
      default: 'ocean',
      options: Object.keys(GRADIENTS).map(value => ({ value, label: value[0].toUpperCase() + value.slice(1) })),
      when: params => params.color === 'palette'
    },
    { key: 'lift', label: 'Glyph brightness', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { key: 'opacity', label: 'Glyph opacity', type: 'number', min: 0, max: 1, step: 0.01, default: 1 },
    { key: 'coverage', label: 'Density', type: 'number', min: 0.05, max: 1, step: 0.01, default: 1 },
    { key: 'threshold', label: 'Dark cutoff', type: 'number', min: 0, max: 0.9, step: 0.01, default: 0 },
    { key: 'fade', label: 'Opacity variation', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { key: 'depth', label: 'Depth of field', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { key: 'glow', label: 'Glow', type: 'number', min: 0, max: 1.5, step: 0.01, default: 0 },
    {
      key: 'spread',
      label: 'Character weight',
      type: 'number',
      min: 0.4,
      max: 2.5,
      step: 0.01,
      default: 1,
      when: params => !(params.charset in SHAPES)
    },
    { key: 'contrast', label: 'Contrast', type: 'number', min: 0.4, max: 2.5, step: 0.01, default: 1.2 },
    { key: 'brightness', label: 'Brightness', type: 'number', min: -0.5, max: 0.5, step: 0.01, default: 0 },
    { key: 'auto', label: 'Auto levels', type: 'boolean', default: true },
    {
      key: 'edges',
      label: 'Edge lines',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0,
      when: params => !(params.charset in SHAPES)
    },
    { key: 'invert', label: 'Invert', type: 'boolean', default: false },
    { key: 'twinkle', label: 'Twinkle', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { key: 'flicker', label: 'Flicker', type: 'number', min: 0, max: 1, step: 0.01, default: 0.15 },
    { key: 'rain', label: 'Rain', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { key: 'speed', label: 'Speed', type: 'number', min: 0, max: 3, step: 0.05, default: 1 },
    { key: 'variation', label: 'Variation', type: 'number', min: 0, max: 100, step: 1, default: 0 }
  ],
  render(ctx, input, params, state) {
    const shape = SHAPES[params.charset] || 0;
    const cellH = Math.max(3, params.size * ctx.unit);
    let cellW = cellH * (SHAPE_ASPECT[params.charset] ?? 0.6);
    let atlas = null;
    if (!shape) {
      const chars = params.charset === 'custom' ? params.text || ' .' : CHARSETS[params.charset] || CHARSETS.standard;
      const weight = WEIGHTS[params.weight] || WEIGHTS.bold;
      const key = `${weight}:${chars}`;
      if (!state.atlas || state.key !== key || (!state.atlas.fontReady && state.fontLoaded)) {
        if (state.atlas) ctx.gl.deleteTexture(state.atlas.texture);
        state.atlas = buildGlyphAtlas(ctx.engine, chars, weight);
        state.key = key;
        if (!state.atlas.fontReady && !state.fontPending) {
          state.fontPending = true;
          ensureGlyphFont().then(() => {
            state.fontLoaded = true;
          });
        }
      }
      atlas = state.atlas;
      cellW = cellH * atlas.aspect;
    }
    const columns = Math.ceil(ctx.width / cellW);
    const rows = Math.ceil(ctx.height / cellH);
    const sub = SUBCELLS[params.charset] || [1, 1];
    const grid = [columns * sub[0], rows * sub[1]];
    const cells = ctx.pass('ascii-cells', CELLS, {
      input,
      target: ctx.target(grid[0], grid[1], { filter: 'nearest' }),
      uniforms: { uCell: [cellW / sub[0], cellH / sub[1]], uImage: [ctx.width, ctx.height] }
    });
    ctx.mipmap(cells);
    const behind = BEHIND[params.behind] ?? 0;
    const back =
      behind === 2 && params.blur > 0 ? gaussianBlur(ctx, input, Math.max(0.5, params.blur * ctx.unit)) : null;
    const palette = (GRADIENTS[params.palette] || GRADIENTS.ocean).slice(0, 8).map(hexToRgb);
    const paletteCount = palette.length;
    while (palette.length < 8) palette.push(palette[palette.length - 1]);
    const glyphs = ctx.pass('ascii-glyphs', GLYPHS, {
      input,
      textures: { uCells: cells, uAtlas: atlas ? atlas.texture : cells },
      uniforms: {
        uCell: [cellW, cellH],
        uGrid: grid,
        uAtlasGrid: atlas ? atlas.grid : [1, 1],
        uCount: atlas ? atlas.count : 1,
        uShape: shape,
        uMode: COLOR_MODES[params.color] ?? 0,
        uInk: hexToRgb(params.ink),
        uAccent: hexToRgb(params.accent),
        uPalette: palette,
        uPaletteCount: paletteCount,
        uLift: params.lift,
        uOpacity: params.opacity,
        uCoverage: params.coverage,
        uThreshold: params.threshold,
        uFade: params.fade,
        uDepth: shape ? 0 : params.depth,
        uTwinkle: params.twinkle,
        uEdges: shape ? 0 : params.edges,
        uFlicker: params.flicker,
        uRain: params.rain,
        uSpeed: params.speed,
        uContrast: params.contrast,
        uBrightness: params.brightness,
        uAuto: params.auto ? 1 : 0,
        uInvert: params.invert ? 1 : 0,
        uTop: Math.floor(Math.log2(Math.max(grid[0], grid[1]))),
        uSeed: params.variation,
        uGlyphCurve: 1 / Math.max(params.spread, 0.1)
      }
    });
    ctx.release(cells);
    const halo = params.glow > 0 ? gaussianBlur(ctx, glyphs, Math.max(1, cellH * 0.45)) : null;
    const output = ctx.pass('ascii-composite', COMPOSITE, {
      input,
      textures: { uGlyphs: glyphs, uHalo: halo || glyphs, uBack: back || input },
      uniforms: {
        uBackground: hexToRgb(params.background),
        uBehind: behind,
        uBackdrop: params.backdrop,
        uDim: params.dim,
        uGlow: params.glow
      }
    });
    ctx.release(glyphs);
    if (halo) ctx.release(halo);
    if (back) ctx.release(back);
    return output;
  },
  dispose(gl, state) {
    if (state.atlas) gl.deleteTexture(state.atlas.texture);
  }
};
