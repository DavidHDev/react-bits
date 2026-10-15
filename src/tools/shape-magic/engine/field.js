const INF = 1e20;
const MAX_SIDE = 896;
const PAD = 0.14;

const edt1d = (grid, offset, stride, length, f, v, z) => {
  for (let i = 0; i < length; i++) f[i] = grid[offset + i * stride];
  const meet = (q, r) => (f[q] + q * q - (f[r] + r * r)) / (2 * q - 2 * r);
  let k = 0;
  v[0] = 0;
  z[0] = -INF;
  z[1] = INF;
  for (let q = 1; q < length; q++) {
    let s = meet(q, v[k]);
    while (s <= z[k]) {
      k--;
      s = meet(q, v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = INF;
  }
  k = 0;
  for (let q = 0; q < length; q++) {
    while (z[k + 1] < q) k++;
    const d = q - v[k];
    grid[offset + q * stride] = d * d + f[v[k]];
  }
};

const edt = (grid, width, height) => {
  const size = Math.max(width, height);
  const f = new Float64Array(size);
  const v = new Uint16Array(size);
  const z = new Float64Array(size + 1);
  for (let x = 0; x < width; x++) edt1d(grid, x, width, height, f, v, z);
  for (let y = 0; y < height; y++) edt1d(grid, y * width, 1, width, f, v, z);
};

export function alphaToField(alpha, width, height) {
  const count = width * height;
  const outer = new Float64Array(count);
  const inner = new Float64Array(count);
  for (let i = 0; i < count; i++) {
    const a = alpha[i] / 255;
    if (a >= 1) {
      outer[i] = 0;
      inner[i] = INF;
    } else if (a <= 0) {
      outer[i] = INF;
      inner[i] = 0;
    } else {
      const d = 0.5 - a;
      outer[i] = d > 0 ? d * d : 0;
      inner[i] = d < 0 ? d * d : 0;
    }
  }
  edt(outer, width, height);
  edt(inner, width, height);
  const long = Math.max(width, height);
  const scale = 2 / long;
  const data = new Float32Array(count);
  for (let i = 0; i < count; i++) data[i] = (Math.sqrt(outer[i]) - Math.sqrt(inner[i])) * scale;
  return { data, width, height, halfW: width / long, halfH: height / long };
}

const paddedCanvas = (contentW, contentH) => {
  const long = Math.max(contentW, contentH);
  const pad = Math.round(long * PAD);
  const canvas = document.createElement('canvas');
  canvas.width = contentW + pad * 2;
  canvas.height = contentH + pad * 2;
  return { canvas, pad };
};

const readAlpha = canvas => {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const alpha = new Uint8ClampedArray(canvas.width * canvas.height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = pixels[i * 4 + 3];
  return alpha;
};

const opaqueToAlpha = (context, width, height) => {
  const image = context.getImageData(0, 0, width, height);
  const data = image.data;
  let opaque = true;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 250) {
      opaque = false;
      break;
    }
  }
  if (!opaque) return;
  const corners = [0, width - 1, (height - 1) * width, height * width - 1].map(i => [
    data[i * 4],
    data[i * 4 + 1],
    data[i * 4 + 2]
  ]);
  const bg = corners.reduce((sum, c) => sum.map((v, k) => v + c[k] / 4), [0, 0, 0]);
  let spread = 0;
  for (let i = 0; i < data.length; i += 4) {
    const dist = Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]);
    if (dist > spread) spread = dist;
  }
  const edge = Math.max(24, spread * 0.5);
  for (let i = 0; i < data.length; i += 4) {
    const dist = Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]);
    data[i + 3] = Math.round(Math.min(1, Math.max(0, (dist - edge * 0.5) / (edge * 0.5))) * 255);
  }
  context.putImageData(image, 0, 0);
};

const cropToContent = canvas => {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const { width, height } = canvas;
  const data = context.getImageData(0, 0, width, height).data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
};

export async function imageField(source, key) {
  const image = new Image();
  image.decoding = 'async';
  image.src = source;
  await image.decode();
  const naturalW = image.naturalWidth || 512;
  const naturalH = image.naturalHeight || 512;
  const fit = MAX_SIDE / Math.max(naturalW, naturalH);
  const drawW = Math.max(1, Math.round(naturalW * fit));
  const drawH = Math.max(1, Math.round(naturalH * fit));
  const raw = document.createElement('canvas');
  raw.width = drawW;
  raw.height = drawH;
  const rawContext = raw.getContext('2d', { willReadFrequently: true });
  rawContext.drawImage(image, 0, 0, drawW, drawH);
  opaqueToAlpha(rawContext, drawW, drawH);
  const box = cropToContent(raw);
  if (!box) throw new Error('That image looks empty.');
  const scale = MAX_SIDE / Math.max(box.width, box.height);
  const contentW = Math.max(1, Math.round(box.width * Math.min(scale, 1.6)));
  const contentH = Math.max(1, Math.round(box.height * Math.min(scale, 1.6)));
  const { canvas, pad } = paddedCanvas(contentW, contentH);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.imageSmoothingQuality = 'high';
  context.drawImage(raw, box.x, box.y, box.width, box.height, pad, pad, contentW, contentH);
  const field = alphaToField(readAlpha(canvas), canvas.width, canvas.height);
  return { ...field, key, aspect: contentW / contentH, color: canvas };
}

export async function textField({ text, font = 'Geist', weight = 700, tracking = 0, key }) {
  const value = String(text || '').trim() || 'Aa';
  const size = 360;
  const spec = `${weight} ${size}px "${font}"`;
  try {
    await document.fonts?.load(spec, value);
  } catch {
    await Promise.resolve();
  }
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = spec;
  probe.letterSpacing = `${tracking * size}px`;
  const metrics = probe.measureText(value);
  const ascent = Math.ceil(metrics.actualBoundingBoxAscent ?? size * 0.8);
  const descent = Math.ceil(metrics.actualBoundingBoxDescent ?? size * 0.2);
  const left = Math.ceil(metrics.actualBoundingBoxLeft ?? 0);
  const right = Math.ceil(metrics.actualBoundingBoxRight ?? metrics.width);
  const contentW = Math.max(1, left + right);
  const contentH = Math.max(1, ascent + descent);
  const shrink = Math.min(1, MAX_SIDE / Math.max(contentW, contentH));
  const { canvas, pad } = paddedCanvas(Math.round(contentW * shrink), Math.round(contentH * shrink));
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.scale(shrink, shrink);
  context.font = spec;
  context.letterSpacing = `${tracking * size}px`;
  context.fillStyle = '#000';
  context.textBaseline = 'alphabetic';
  context.fillText(value, pad / shrink + left, pad / shrink + ascent);
  const field = alphaToField(readAlpha(canvas), canvas.width, canvas.height);
  return { ...field, key, aspect: contentW / contentH };
}
