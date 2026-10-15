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

const coverageOf = (context, char) => {
  context.clearRect(0, 0, CELL_W, CELL_H);
  context.fillText(char, CELL_W / 2, CELL_H / 2 + 3);
  const data = context.getImageData(0, 0, CELL_W, CELL_H).data;
  let sum = 0;
  for (let i = 3; i < data.length; i += 4) sum += data[i];
  return sum / (255 * CELL_W * CELL_H);
};

export function buildGlyphAtlas(engine, chars, weight = 700) {
  const list = [...new Set([...chars].filter(char => char !== '\n'))];
  if (!list.length) list.push(' ');
  const font = `${weight} ${Math.round(CELL_H * FONT_SCALE)}px ${GLYPH_FONT}`;
  const probe = document.createElement('canvas');
  probe.width = CELL_W;
  probe.height = CELL_H;
  const probeContext = probe.getContext('2d', { willReadFrequently: true });
  probeContext.font = font;
  probeContext.textAlign = 'center';
  probeContext.textBaseline = 'middle';
  probeContext.fillStyle = '#fff';
  const ranked = list
    .map(char => ({ char, coverage: coverageOf(probeContext, char) }))
    .sort((a, b) => a.coverage - b.coverage);
  const ramp = ranked.map(item => item.char);
  const glyphs = [...ramp, ...EDGE_GLYPHS];
  const columns = Math.min(ATLAS_COLUMNS, glyphs.length);
  const rows = Math.ceil(glyphs.length / columns);

  const canvas = document.createElement('canvas');
  canvas.width = CELL_W * columns;
  canvas.height = CELL_H * rows;
  const context = canvas.getContext('2d');
  context.font = font;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#fff';
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

const BLUE_SIZE = 64;
let blueNoise = null;

function voidAndCluster(size) {
  const count = size * size;
  const sigma = 1.9;
  const radius = 7;
  const kernel = [];
  for (let y = -radius; y <= radius; y += 1) {
    for (let x = -radius; x <= radius; x += 1) {
      kernel.push([x, y, Math.exp(-(x * x + y * y) / (2 * sigma * sigma))]);
    }
  }
  const energy = new Float32Array(count);
  const bits = new Uint8Array(count);
  const splat = (index, sign) => {
    const px = index % size;
    const py = (index / size) | 0;
    for (const [dx, dy, w] of kernel) {
      const x = (px + dx + size) % size;
      const y = (py + dy + size) % size;
      energy[y * size + x] += sign * w;
    }
  };
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const initial = Math.round(count * 0.1);
  let placed = 0;
  while (placed < initial) {
    const index = Math.floor(random() * count);
    if (bits[index]) continue;
    bits[index] = 1;
    splat(index, 1);
    placed += 1;
  }
  const tightest = () => {
    let best = -1;
    let value = -Infinity;
    for (let i = 0; i < count; i += 1) if (bits[i] && energy[i] > value) ((value = energy[i]), (best = i));
    return best;
  };
  const largestVoid = () => {
    let best = -1;
    let value = Infinity;
    for (let i = 0; i < count; i += 1) if (!bits[i] && energy[i] < value) ((value = energy[i]), (best = i));
    return best;
  };
  for (let guard = 0; guard < count; guard += 1) {
    const cluster = tightest();
    bits[cluster] = 0;
    splat(cluster, -1);
    const gap = largestVoid();
    if (gap === cluster) {
      bits[cluster] = 1;
      splat(cluster, 1);
      break;
    }
    bits[gap] = 1;
    splat(gap, 1);
  }
  const rank = new Int32Array(count).fill(-1);
  const prototype = bits.slice();
  const prototypeEnergy = energy.slice();
  let ones = initial;
  for (let r = ones - 1; r >= 0; r -= 1) {
    const cluster = tightest();
    bits[cluster] = 0;
    splat(cluster, -1);
    rank[cluster] = r;
  }
  bits.set(prototype);
  energy.set(prototypeEnergy);
  for (let r = ones; r < count; r += 1) {
    const gap = largestVoid();
    bits[gap] = 1;
    splat(gap, 1);
    rank[gap] = r;
  }
  const values = new Uint8Array(count * 4);
  for (let i = 0; i < count; i += 1) {
    const v = Math.round(((rank[i] + 0.5) / count) * 255);
    values[i * 4] = v;
    values[i * 4 + 1] = v;
    values[i * 4 + 2] = v;
    values[i * 4 + 3] = 255;
  }
  return values;
}

export function blueNoiseTexture(engine) {
  if (!blueNoise) blueNoise = voidAndCluster(BLUE_SIZE);
  const gl = engine.gl;
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, BLUE_SIZE, BLUE_SIZE, 0, gl.RGBA, gl.UNSIGNED_BYTE, blueNoise);
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
