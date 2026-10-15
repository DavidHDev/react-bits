import { blueNoiseTexture, hexToRgb } from '../engine/assets';

const MAX_COLORS = 64;
const LUT_SIZE = 40;
const PAD = 2;
const BYTE = 1 / 255;
const SPAN = 0.8 / 255;

const GRID = `
uniform sampler2D uNoise;
uniform vec2 uFull;
uniform float uPixel;
uniform float uPattern;
uniform float uSpread;
uniform float uContrast;
uniform float uBrightness;
uniform vec3 uPalette[${MAX_COLORS}];
uniform vec3 uLab[${MAX_COLORS}];
uniform float uCount;
uniform float uLevels;
uniform float uMatch;
uniform float uEncode;
uniform vec2 uOffset;

float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}

float bayer4(vec2 a) {
  return bayer2(0.5 * a) * 0.25 + bayer2(a);
}

float bayer8(vec2 a) {
  return bayer4(0.5 * a) * 0.25 + bayer2(a);
}

float threshold(vec2 cell) {
  vec2 c = cell + uOffset;
  if (uPattern < 0.5) return bayer4(c);
  if (uPattern < 1.5) return bayer8(c);
  if (uPattern < 2.5) return texture(uNoise, (c + 0.5) / 64.0).r;
  if (uPattern < 3.5) {
    vec2 q = rotation(0.785398) * c / 5.6568;
    vec2 f = fract(q) - 0.5;
    float d = length(f) * 1.4142;
    return clamp(1.0 - d, 0.0, 1.0);
  }
  if (uPattern < 4.5) {
    return abs(fract(c.y / 4.0 + bayer2(vec2(c.x, 0.0)) * 0.03) - 0.5) * 2.0;
  }
  if (uPattern < 5.5) return hash12(c * 0.7 + 3.1);
  if (uPattern < 6.5) return bayer2(c) + 0.125;
  vec2 g = floor(c);
  float across = abs(fract((g.x + g.y) / 6.0 + 0.0833) - 0.5) * 2.0;
  return clamp(across * 0.88 + bayer2(vec2(g.x - g.y, 0.0)) * 0.2, 0.0, 1.0);
}

vec3 grade(vec3 c) {
  c = clamp((c - 0.5) * uContrast + 0.5 + uBrightness, 0.0, 1.0);
  return c;
}

vec3 ramp(vec3 color, float t) {
  float l = clamp(toOklab(color).x, 0.0, 1.0);
  float x = l * (uCount - 1.0);
  float index = floor(x);
  float pick = min(index + step(t, fract(x) - 1e-4), uCount - 1.0);
  return uPalette[int(pick)];
}

vec3 quantize(vec3 color, float t) {
  if (uMatch < 0.5) return ramp(color, t);
  if (uCount < 1.5) return uPalette[0];
  vec3 lab = toOklab(color);
  float best = 1e9;
  float second = 1e9;
  int ia = 0;
  int ib = 0;
  for (int i = 0; i < ${MAX_COLORS}; i++) {
    if (float(i) >= uCount) break;
    float d = distance(lab, uLab[i]);
    if (d < best) {
      second = best;
      ib = ia;
      best = d;
      ia = i;
    } else if (d < second) {
      second = d;
      ib = i;
    }
  }
  vec3 a = uLab[ia];
  vec3 b = uLab[ib];
  vec3 ab = b - a;
  float f = clamp(dot(lab - a, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
  return f > t ? uPalette[ib] : uPalette[ia];
}

void main() {
  vec2 cell = floor(gl_FragCoord.xy);
  vec2 center = (cell + 0.5) * uPixel;
  vec3 color = textureLod(uInput, center / uFull, log2(max(uPixel, 1.0))).rgb;
  color = grade(color);
  if (uEncode > 0.5) {
    if (uEncode > 2.5) {
      outColor = vec4(color, 1.0);
    } else {
      vec3 lab = toOklab(color);
      outColor = vec4(clamp(lab.x, 0.0, 1.0), clamp(lab.yz / 0.8 + 0.5, 0.0, 1.0), 1.0);
    }
    return;
  }
  float t = threshold(cell);
  t = clamp(0.5 + (t - 0.5) * uSpread, 0.0, 0.999);
  vec3 result;
  if (uLevels > 0.5) {
    float steps = max(uLevels - 1.0, 1.0);
    result = floor(color * steps + t) / steps;
  } else {
    result = quantize(color, t);
  }
  outColor = vec4(result, 1.0);
}`;

const SHOW = `
uniform sampler2D uGrid;
uniform float uPixel;

void main() {
  outColor = vec4(texelFetch(uGrid, ivec2(floor(gl_FragCoord.xy / uPixel)), 0).rgb, 1.0);
}`;

export const PALETTES = {
  gameboy: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
  pico8: [
    '#000000',
    '#1d2b53',
    '#7e2553',
    '#008751',
    '#ab5236',
    '#5f574f',
    '#c2c3c7',
    '#fff1e8',
    '#ff004d',
    '#ffa300',
    '#ffec27',
    '#00e436',
    '#29adff',
    '#83769c',
    '#ff77a8',
    '#ffccaa'
  ],
  cga: ['#000000', '#55ffff', '#ff55ff', '#ffffff'],
  sepia: ['#21170f', '#5e4430', '#a9835f', '#efe0c4'],
  mac: ['#000000', '#ffffff'],
  virtualboy: ['#000000', '#550000', '#aa0000', '#ff0000'],
  ega: [
    '#000000',
    '#0000aa',
    '#00aa00',
    '#00aaaa',
    '#aa0000',
    '#aa00aa',
    '#aa5500',
    '#aaaaaa',
    '#555555',
    '#5555ff',
    '#55ff55',
    '#55ffff',
    '#ff5555',
    '#ff55ff',
    '#ffff55',
    '#ffffff'
  ],
  c64: [
    '#000000',
    '#ffffff',
    '#813338',
    '#75cec8',
    '#8e3c97',
    '#56ac4d',
    '#2e2c9b',
    '#edf171',
    '#8e5029',
    '#553800',
    '#c46c71',
    '#4a4a4a',
    '#7b7b7b',
    '#a9ff9f',
    '#706deb',
    '#b2b2b2'
  ],
  vic20: [
    '#000000',
    '#ffffff',
    '#a8734a',
    '#e9b287',
    '#772d26',
    '#b66862',
    '#85d4dc',
    '#c5ffff',
    '#a85fb4',
    '#e99df5',
    '#559e4a',
    '#92df87',
    '#42348b',
    '#7e70ca',
    '#bdcc71',
    '#ffffb0'
  ],
  zx: [
    '#000000',
    '#0000d7',
    '#d70000',
    '#d700d7',
    '#00d700',
    '#00d7d7',
    '#d7d700',
    '#d7d7d7',
    '#0000ff',
    '#ff0000',
    '#ff00ff',
    '#00ff00',
    '#00ffff',
    '#ffff00',
    '#ffffff'
  ],
  cpc: [
    '#000000',
    '#000080',
    '#0000ff',
    '#800000',
    '#800080',
    '#8000ff',
    '#ff0000',
    '#ff0080',
    '#ff00ff',
    '#008000',
    '#008080',
    '#0080ff',
    '#808000',
    '#808080',
    '#8080ff',
    '#ff8000',
    '#ff8080',
    '#ff80ff',
    '#00ff00',
    '#00ff80',
    '#00ffff',
    '#80ff00',
    '#80ff80',
    '#80ffff',
    '#ffff00',
    '#ffff80',
    '#ffffff'
  ],
  msx: [
    '#000000',
    '#3eb849',
    '#74d07d',
    '#5955e0',
    '#8076f1',
    '#b95e51',
    '#65dbef',
    '#db6559',
    '#ff897d',
    '#ccc35e',
    '#ded087',
    '#3aa241',
    '#b766b5',
    '#cccccc',
    '#ffffff'
  ],
  apple2: ['#000000', '#bb36ff', '#43c800', '#07a8e0', '#f9561d', '#ffffff'],
  nes: [
    '#7c7c7c',
    '#0000fc',
    '#0000bc',
    '#4428bc',
    '#940084',
    '#a80020',
    '#a81000',
    '#881400',
    '#503000',
    '#007800',
    '#006800',
    '#005800',
    '#004058',
    '#000000',
    '#bcbcbc',
    '#0078f8',
    '#0058f8',
    '#6844fc',
    '#d800cc',
    '#e40058',
    '#f83800',
    '#e45c10',
    '#ac7c00',
    '#00b800',
    '#00a800',
    '#00a844',
    '#008888',
    '#f8f8f8',
    '#3cbcfc',
    '#6888fc',
    '#9878f8',
    '#f878f8',
    '#f85898',
    '#f87858',
    '#fca044',
    '#f8b800',
    '#b8f818',
    '#58d854',
    '#58f898',
    '#00e8d8',
    '#787878',
    '#a4e4fc',
    '#b8b8f8',
    '#d8b8f8',
    '#f8b8f8',
    '#f8a4c0',
    '#f0d0b0',
    '#fce0a8',
    '#f8d878',
    '#d8f878',
    '#b8f8b8',
    '#b8f8d8',
    '#00fcfc',
    '#f8d8f8'
  ],
  teletext: ['#000000', '#ff0000', '#00ff00', '#ffff00', '#0000ff', '#ff00ff', '#00ffff', '#ffffff'],
  mac16: [
    '#ffffff',
    '#fcf305',
    '#ff6402',
    '#dd0806',
    '#f20884',
    '#4600a5',
    '#0000d4',
    '#02abea',
    '#1fb714',
    '#006411',
    '#562c05',
    '#90713a',
    '#c0c0c0',
    '#808080',
    '#404040',
    '#000000'
  ],
  amber: ['#120a02', '#5c3606', '#c47c0c', '#ffbf3a'],
  phosphor: ['#020f06', '#0b4d1c', '#23a83c', '#7cff7a'],
  neon: ['#0d0222', '#ec2f73', '#3ec6d0', '#d4f8ff']
};

const PATTERNS = { bayer4: 0, bayer8: 1, blue: 2, clustered: 3, lines: 4, noise: 5, bayer2: 6, diagonal: 7 };

const RAMPS = new Set(['custom', 'gameboy', 'cga', 'sepia', 'mac', 'gray', 'virtualboy', 'amber', 'phosphor', 'neon']);

const DIFFUSION = { floyd: 0, atkinson: 1 };

const toOklab = rgb => {
  const linearish = rgb.map(c => Math.max(c, 0) ** 2.2);
  const l = Math.cbrt(0.4122214708 * linearish[0] + 0.5363325363 * linearish[1] + 0.0514459929 * linearish[2]);
  const m = Math.cbrt(0.2119034982 * linearish[0] + 0.6806995451 * linearish[1] + 0.1073969566 * linearish[2]);
  const s = Math.cbrt(0.0883024619 * linearish[0] + 0.2817188376 * linearish[1] + 0.6299787005 * linearish[2]);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  ];
};

const grays = count =>
  Array.from({ length: count }, (_, index) => {
    const value = Math.round(((index / (count - 1)) ** 3) ** (1 / 2.2) * 255);
    return `#${value.toString(16).padStart(2, '0').repeat(3)}`;
  });

const paletteFor = params => {
  if (params.palette === 'custom') return params.colors?.length ? params.colors : ['#000000', '#ffffff'];
  if (params.palette === 'gray') return grays(Math.max(2, Math.round(params.levels || 4)));
  return PALETTES[params.palette] || PALETTES.mac;
};

const noiseAt = (x, y, seed) => {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

function push(atkinson, cur, next, after, j, d, e) {
  if (atkinson) {
    const f = e * 0.125;
    cur[j + d] += f;
    cur[j + d + d] += f;
    next[j - d] += f;
    next[j] += f;
    next[j + d] += f;
    after[j] += f;
  } else {
    cur[j + d] += e * 0.4375;
    next[j - d] += e * 0.1875;
    next[j] += e * 0.3125;
    next[j + d] += e * 0.0625;
  }
}

function diffuseRamp(data, gw, gh, rows, atkinson, { strength, jitter, seed, count, bytes }) {
  const top = count - 1;
  const scale = top / 255;
  for (let r = 0; r < gh; r += 1) {
    const cur = rows[r % 3];
    const next = rows[(r + 1) % 3];
    const after = rows[(r + 2) % 3];
    const y = gh - 1 - r;
    const d = r & 1 ? -1 : 1;
    let x = d > 0 ? 0 : gw - 1;
    for (let k = 0; k < gw; k += 1, x += d) {
      const i = (y * gw + x) * 4;
      const j = x + PAD;
      let v = data[i] * scale + cur[j];
      v = v < -0.5 ? -0.5 : v > top + 0.5 ? top + 0.5 : v;
      const probe = jitter ? v + (noiseAt(x, y, seed) - 0.5) * jitter : v;
      const q = probe <= 0 ? 0 : probe >= top ? top : (probe + 0.5) | 0;
      push(atkinson, cur, next, after, j, d, (v - q) * strength);
      const c = q * 3;
      data[i] = bytes[c];
      data[i + 1] = bytes[c + 1];
      data[i + 2] = bytes[c + 2];
    }
    cur.fill(0);
  }
}

function diffuseLab(data, gw, gh, rows, atkinson, { strength, jitter, seed, lut, lab, bytes }) {
  const n = LUT_SIZE;
  for (let r = 0; r < gh; r += 1) {
    const k0 = r % 3;
    const k1 = (r + 1) % 3;
    const k2 = (r + 2) % 3;
    const lc = rows[k0];
    const ln = rows[k1];
    const la = rows[k2];
    const ac = rows[3 + k0];
    const an = rows[3 + k1];
    const aa = rows[3 + k2];
    const bc = rows[6 + k0];
    const bn = rows[6 + k1];
    const ba = rows[6 + k2];
    const y = gh - 1 - r;
    const d = r & 1 ? -1 : 1;
    let x = d > 0 ? 0 : gw - 1;
    for (let k = 0; k < gw; k += 1, x += d) {
      const i = (y * gw + x) * 4;
      const j = x + PAD;
      let l = data[i] * BYTE + lc[j];
      let a = data[i + 1] * SPAN - 0.4 + ac[j];
      let b = data[i + 2] * SPAN - 0.4 + bc[j];
      l = l < 0 ? 0 : l > 1 ? 1 : l;
      a = a < -0.4 ? -0.4 : a > 0.4 ? 0.4 : a;
      b = b < -0.4 ? -0.4 : b > 0.4 ? 0.4 : b;
      let probe = jitter ? l + (noiseAt(x, y, seed) - 0.5) * jitter : l;
      probe = probe < 0 ? 0 : probe > 0.9999 ? 0.9999 : probe;
      const pa = (a + 0.4) * 1.25;
      const pb = (b + 0.4) * 1.25;
      const ai = ((pa > 0.9999 ? 0.9999 : pa) * n) | 0;
      const bi = ((pb > 0.9999 ? 0.9999 : pb) * n) | 0;
      const p = lut[(((probe * n) | 0) * n + ai) * n + bi] * 3;
      push(atkinson, lc, ln, la, j, d, (l - lab[p]) * strength);
      push(atkinson, ac, an, aa, j, d, (a - lab[p + 1]) * strength);
      push(atkinson, bc, bn, ba, j, d, (b - lab[p + 2]) * strength);
      data[i] = bytes[p];
      data[i + 1] = bytes[p + 1];
      data[i + 2] = bytes[p + 2];
    }
    lc.fill(0);
    ac.fill(0);
    bc.fill(0);
  }
}

function diffuseLevels(data, gw, gh, rows, atkinson, { strength, jitter, seed, steps }) {
  const margin = 0.5 / steps;
  const low = -margin;
  const high = steps + margin;
  const scale = steps / 255;
  const table = Uint8Array.from({ length: steps + 1 }, (_, q) => Math.round((q / steps) * 255));
  for (let r = 0; r < gh; r += 1) {
    const k0 = r % 3;
    const k1 = (r + 1) % 3;
    const k2 = (r + 2) % 3;
    const rc = rows[k0];
    const rn = rows[k1];
    const ra = rows[k2];
    const gc = rows[3 + k0];
    const gn = rows[3 + k1];
    const ga = rows[3 + k2];
    const bc = rows[6 + k0];
    const bn = rows[6 + k1];
    const ba = rows[6 + k2];
    const y = gh - 1 - r;
    const d = r & 1 ? -1 : 1;
    let x = d > 0 ? 0 : gw - 1;
    for (let k = 0; k < gw; k += 1, x += d) {
      const i = (y * gw + x) * 4;
      const j = x + PAD;
      const shake = jitter ? (noiseAt(x, y, seed) - 0.5) * jitter : 0;
      let vr = data[i] * scale + rc[j];
      let vg = data[i + 1] * scale + gc[j];
      let vb = data[i + 2] * scale + bc[j];
      vr = vr < low ? low : vr > high ? high : vr;
      vg = vg < low ? low : vg > high ? high : vg;
      vb = vb < low ? low : vb > high ? high : vb;
      const pr = vr + shake;
      const pg = vg + shake;
      const pb = vb + shake;
      const qr = pr <= 0 ? 0 : pr >= steps ? steps : (pr + 0.5) | 0;
      const qg = pg <= 0 ? 0 : pg >= steps ? steps : (pg + 0.5) | 0;
      const qb = pb <= 0 ? 0 : pb >= steps ? steps : (pb + 0.5) | 0;
      push(atkinson, rc, rn, ra, j, d, (vr - qr) * strength);
      push(atkinson, gc, gn, ga, j, d, (vg - qg) * strength);
      push(atkinson, bc, bn, ba, j, d, (vb - qb) * strength);
      data[i] = table[qr];
      data[i + 1] = table[qg];
      data[i + 2] = table[qb];
    }
    rc.fill(0);
    gc.fill(0);
    bc.fill(0);
  }
}

function buildLut(lab, count) {
  const n = LUT_SIZE;
  const lut = new Uint8Array(n * n * n);
  for (let li = 0; li < n; li += 1) {
    const l = (li + 0.5) / n;
    for (let ai = 0; ai < n; ai += 1) {
      const a = ((ai + 0.5) / n - 0.5) * 0.8;
      for (let bi = 0; bi < n; bi += 1) {
        const b = ((bi + 0.5) / n - 0.5) * 0.8;
        let best = 0;
        let distance = Infinity;
        for (let k = 0; k < count; k += 1) {
          const dl = l - lab[k * 3];
          const da = a - lab[k * 3 + 1];
          const db = b - lab[k * 3 + 2];
          const d = dl * dl + da * da + db * db;
          if (d < distance) {
            distance = d;
            best = k;
          }
        }
        lut[(li * n + ai) * n + bi] = best;
      }
    }
  }
  return lut;
}

function buffers(ctx, state, gw, gh) {
  const gl = ctx.gl;
  const cache = state.diffusion;
  if (cache && cache.width === gw && cache.height === gh) return cache;
  if (cache) {
    gl.deleteTexture(cache.texture);
    gl.deleteBuffer(cache.pbo);
  }
  const pbo = gl.createBuffer();
  gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pbo);
  gl.bufferData(gl.PIXEL_PACK_BUFFER, gw * gh * 4, gl.STREAM_READ);
  gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
  state.diffusion = {
    width: gw,
    height: gh,
    texture: ctx.engine.createTexture(gw, gh, { float: false, filter: 'nearest' }),
    pbo,
    data: new Uint8Array(gw * gh * 4),
    rows: Array.from({ length: 9 }, () => new Float32Array(gw + PAD * 2)),
    lutKey: cache?.lutKey,
    lut: cache?.lut
  };
  return state.diffusion;
}

export default {
  id: 'dither',
  name: 'Dither',
  category: 'print',
  description: 'Error diffusion, ordered, halftone and line dithers in classic computer and console palettes.',
  animated: true,
  animates: params => params.motion > 0,
  preview: { params: { pattern: 'floyd', palette: 'c64', pixel: 2.5 } },
  params: [
    {
      key: 'pattern',
      label: 'Pattern',
      type: 'select',
      default: 'blue',
      options: [
        { value: 'floyd', label: 'Floyd–Steinberg' },
        { value: 'atkinson', label: 'Atkinson' },
        { value: 'blue', label: 'Blue noise' },
        { value: 'bayer2', label: 'Bayer 2×2' },
        { value: 'bayer4', label: 'Bayer 4×4' },
        { value: 'bayer8', label: 'Bayer 8×8' },
        { value: 'clustered', label: 'Halftone' },
        { value: 'lines', label: 'Lines' },
        { value: 'diagonal', label: 'Diagonal lines' },
        { value: 'noise', label: 'Noise' }
      ]
    },
    {
      key: 'palette',
      label: 'Palette',
      type: 'select',
      default: 'custom',
      options: [
        { value: 'custom', label: 'Custom' },
        { value: 'levels', label: 'Image colors' },
        { value: 'gray', label: 'Grayscale' },
        { value: 'mac', label: '1-bit' },
        { value: 'gameboy', label: 'Game Boy' },
        { value: 'virtualboy', label: 'Virtual Boy' },
        { value: 'cga', label: 'CGA' },
        { value: 'ega', label: 'EGA' },
        { value: 'c64', label: 'Commodore 64' },
        { value: 'vic20', label: 'Commodore VIC-20' },
        { value: 'zx', label: 'ZX Spectrum' },
        { value: 'cpc', label: 'Amstrad CPC' },
        { value: 'msx', label: 'MSX' },
        { value: 'apple2', label: 'Apple II' },
        { value: 'nes', label: 'NES' },
        { value: 'teletext', label: 'Teletext' },
        { value: 'mac16', label: 'Macintosh 16' },
        { value: 'pico8', label: 'PICO-8' },
        { value: 'amber', label: 'Amber screen' },
        { value: 'phosphor', label: 'Green screen' },
        { value: 'neon', label: 'Neon' },
        { value: 'sepia', label: 'Sepia' }
      ]
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'colors',
      min: 2,
      max: 8,
      default: ['#111014', '#f1ede4'],
      when: params => params.palette === 'custom'
    },
    {
      key: 'match',
      label: 'Match by',
      type: 'select',
      default: 'auto',
      options: [
        { value: 'auto', label: 'Auto' },
        { value: 'brightness', label: 'Brightness' },
        { value: 'color', label: 'Color' }
      ],
      when: params => params.palette !== 'levels' && params.palette !== 'gray'
    },
    {
      key: 'levels',
      label: 'Levels',
      type: 'number',
      min: 2,
      max: 16,
      step: 1,
      default: 3,
      when: params => params.palette === 'levels' || params.palette === 'gray'
    },
    { key: 'pixel', label: 'Pixel size', type: 'number', min: 0.5, max: 16, step: 0.5, default: 1.5 },
    { key: 'spread', label: 'Amount', type: 'number', min: 0, max: 1.5, step: 0.01, default: 1 },
    { key: 'contrast', label: 'Contrast', type: 'number', min: 0.4, max: 2.5, step: 0.01, default: 1.15 },
    { key: 'brightness', label: 'Brightness', type: 'number', min: -0.5, max: 0.5, step: 0.01, default: 0 },
    { key: 'motion', label: 'Shimmer', type: 'number', min: 0, max: 2, step: 0.01, default: 0 }
  ],
  render(ctx, input, params, state) {
    const noise = ctx.shared('blue-noise', blueNoiseTexture);
    const source = input.mipmapped ? input : ctx.mipmap(input);
    const pixel = Math.max(1, Math.round(params.pixel * ctx.unit));
    const gw = Math.ceil(ctx.width / pixel);
    const gh = Math.ceil(ctx.height / pixel);
    const diffusion = DIFFUSION[params.pattern];
    const levels = params.palette === 'levels';
    const byColor =
      params.palette !== 'gray' &&
      (params.match === 'color' || (params.match === 'auto' && !RAMPS.has(params.palette)));
    const colors = paletteFor(params).slice(0, MAX_COLORS);
    let rgb = colors.map(hexToRgb);
    if (!byColor) rgb = rgb.slice().sort((a, b) => toOklab(a)[0] - toOklab(b)[0]);
    const lab = rgb.map(toOklab);
    const count = rgb.length;
    const padded = rgb.slice();
    const paddedLab = lab.slice();
    while (padded.length < MAX_COLORS) {
      padded.push([0, 0, 0]);
      paddedLab.push([0, 0, 0]);
    }
    const step = params.motion > 0 ? Math.floor(ctx.time * 12 * params.motion) : 0;
    const uniforms = {
      uFull: [ctx.width, ctx.height],
      uPixel: pixel,
      uPattern: PATTERNS[params.pattern] ?? 2,
      uSpread: params.spread,
      uContrast: params.contrast,
      uBrightness: params.brightness,
      uPalette: padded,
      uLab: paddedLab,
      uCount: count,
      uLevels: levels ? params.levels : 0,
      uMatch: byColor ? 1 : 0,
      uEncode: 0,
      uOffset: step ? [((step * 37) % 64) + ((step * 0.618) % 1), ((step * 23) % 64) + ((step * 0.382) % 1)] : [0, 0]
    };

    if (diffusion === undefined) {
      if (pixel === 1) {
        return ctx.pass('dither-grid', GRID, { input: source, textures: { uNoise: noise.texture }, uniforms });
      }
      const grid = ctx.pass('dither-grid', GRID, {
        input: source,
        target: ctx.target(gw, gh, { float: false, filter: 'nearest' }),
        textures: { uNoise: noise.texture },
        uniforms
      });
      const output = ctx.pass('dither-show', SHOW, {
        input: source,
        textures: { uGrid: grid },
        uniforms: { uPixel: pixel }
      });
      ctx.release(grid);
      return output;
    }

    const grid = ctx.pass('dither-grid', GRID, {
      input: source,
      target: ctx.target(gw, gh, { float: false, filter: 'nearest' }),
      textures: { uNoise: noise.texture },
      uniforms: { ...uniforms, uEncode: levels ? 3 : byColor ? 2 : 1 }
    });
    const gl = ctx.gl;
    const cache = buffers(ctx, state, gw, gh);
    gl.bindFramebuffer(gl.FRAMEBUFFER, grid.fbo);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, cache.pbo);
    gl.readPixels(0, 0, gw, gh, gl.RGBA, gl.UNSIGNED_BYTE, 0);
    const fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    gl.clientWaitSync(fence, gl.SYNC_FLUSH_COMMANDS_BIT, 0);
    gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, cache.data);
    gl.deleteSync(fence);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
    ctx.release(grid);
    cache.rows.forEach(row => row.fill(0));
    const atkinson = diffusion === DIFFUSION.atkinson;
    const bytes = new Uint8Array(rgb.flat().map(value => Math.round(value * 255)));
    const strength = Math.min(params.spread, 1);
    const jitter = Math.max(params.spread - 1, 0) * 1.6 + (params.motion > 0 ? 0.35 : 0);
    const seed = step + 1;
    if (levels) {
      const steps = Math.max(Math.round(params.levels) - 1, 1);
      diffuseLevels(cache.data, gw, gh, cache.rows, atkinson, { strength, jitter, seed, steps });
    } else if (byColor && count > 1) {
      const key = colors.join(',');
      if (cache.lutKey !== key) {
        cache.lut = buildLut(lab.flat(), count);
        cache.lutKey = key;
      }
      diffuseLab(cache.data, gw, gh, cache.rows, atkinson, {
        strength,
        jitter: jitter * 0.3,
        seed,
        lut: cache.lut,
        lab: new Float32Array(lab.flat()),
        bytes
      });
    } else {
      diffuseRamp(cache.data, gw, gh, cache.rows, atkinson, {
        strength,
        jitter,
        seed,
        count: Math.max(count, 1),
        bytes
      });
    }
    gl.bindTexture(gl.TEXTURE_2D, cache.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gw, gh, gl.RGBA, gl.UNSIGNED_BYTE, cache.data);
    return ctx.pass('dither-show', SHOW, {
      input: source,
      textures: { uGrid: cache.texture },
      uniforms: { uPixel: pixel }
    });
  },
  dispose(gl, state) {
    if (state.diffusion) {
      gl.deleteTexture(state.diffusion.texture);
      gl.deleteBuffer(state.diffusion.pbo);
    }
    state.diffusion = null;
  }
};
