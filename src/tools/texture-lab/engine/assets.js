import { BLUE_SIZE, patternData } from './patterns';

const GLYPH_FONT = '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const CELL_W = 60;
const CELL_H = 100;
const FONT_SCALE = 0.94;
const ATLAS_COLUMNS = 16;
const EDGE_GLYPHS = ['-', '/', '|', '\\'];

let fontReady = typeof document === 'undefined';

export const ensureGlyphFont = () => {
  if (fontReady || !document.fonts?.load) return Promise.resolve(true);
  return document.fonts
    .load(`700 64px ${GLYPH_FONT}`)
    .then(() => {
      fontReady = true;
      return true;
    })
    .catch(() => {
      fontReady = true;
      return false;
    });
};

let probe = null;
let sheet = null;
const coverages = new Map();

const measure = (font, chars) => {
  const columns = Math.min(ATLAS_COLUMNS, chars.length);
  const rows = Math.ceil(chars.length / columns);
  const width = CELL_W * columns;
  probe = probe || document.createElement('canvas');
  const context = textContext(probe, width, CELL_H * rows, font, { willReadFrequently: true });
  chars.forEach((char, index) => {
    const x = (index % columns) * CELL_W;
    const y = Math.floor(index / columns) * CELL_H;
    context.save();
    context.beginPath();
    context.rect(x, y, CELL_W, CELL_H);
    context.clip();
    context.fillText(char, x + CELL_W / 2, y + CELL_H / 2 + 3);
    context.restore();
  });
  const data = context.getImageData(0, 0, width, CELL_H * rows).data;
  return chars.map((_, index) => {
    const left = (index % columns) * CELL_W;
    const top = Math.floor(index / columns) * CELL_H;
    let sum = 0;
    for (let row = 0; row < CELL_H; row += 1) {
      const start = ((top + row) * width + left) * 4 + 3;
      for (let column = 0; column < CELL_W; column += 1) sum += data[start + column * 4];
    }
    return sum / (255 * CELL_W * CELL_H);
  });
};

const coveragesOf = (font, list) => {
  const missing = fontReady ? list.filter(char => !coverages.has(`${font}|${char}`)) : list;
  const fresh = new Map();
  if (missing.length) {
    const values = measure(font, missing);
    missing.forEach((char, index) => {
      fresh.set(char, values[index]);
      if (fontReady) coverages.set(`${font}|${char}`, values[index]);
    });
  }
  return list.map(char => (fresh.has(char) ? fresh.get(char) : coverages.get(`${font}|${char}`)));
};

const textContext = (canvas, width, height, font, options) => {
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', options);
  context.font = font;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#fff';
  return context;
};

export function buildGlyphAtlas(engine, chars, weight = 700) {
  const list = [...new Set([...chars].filter(char => char !== '\n'))];
  if (!list.length) list.push(' ');
  if (engine.collecting) {
    ensureGlyphFont();
    const total = list.length + EDGE_GLYPHS.length;
    const wide = Math.min(ATLAS_COLUMNS, total);
    return {
      texture: null,
      chars: list,
      count: list.length,
      total,
      grid: [wide, Math.ceil(total / wide)],
      aspect: CELL_W / CELL_H,
      fontReady: false
    };
  }
  const font = `${weight} ${Math.round(CELL_H * FONT_SCALE)}px ${GLYPH_FONT}`;
  const measured = coveragesOf(font, list);
  const ranked = list
    .map((char, index) => ({ char, coverage: measured[index] }))
    .sort((a, b) => a.coverage - b.coverage);
  const ramp = ranked.map(item => item.char);
  const glyphs = [...ramp, ...EDGE_GLYPHS];
  const columns = Math.min(ATLAS_COLUMNS, glyphs.length);
  const rows = Math.ceil(glyphs.length / columns);

  sheet = sheet || document.createElement('canvas');
  const canvas = sheet;
  const context = textContext(canvas, CELL_W * columns, CELL_H * rows, font);
  glyphs.forEach((char, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    context.fillText(char, column * CELL_W + CELL_W / 2, row * CELL_H + CELL_H / 2 + 3);
  });

  const gl = engine.gl;
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return {
    texture,
    chars: ramp,
    count: ramp.length,
    total: glyphs.length,
    grid: [columns, rows],
    aspect: CELL_W / CELL_H,
    fontReady
  };
}

export function blueNoiseTexture(engine) {
  const data = patternData('blue');
  const gl = engine.gl;
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, BLUE_SIZE, BLUE_SIZE, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  return { texture, size: BLUE_SIZE };
}

export const hexToRgb = hex => {
  const value = String(hex || '#000000').replace('#', '');
  const full = value.length === 3 ? value.replace(/./g, char => char + char) : value.padEnd(6, '0');
  const number = parseInt(full.slice(0, 6), 16);
  return [((number >> 16) & 255) / 255, ((number >> 8) & 255) / 255, (number & 255) / 255];
};
