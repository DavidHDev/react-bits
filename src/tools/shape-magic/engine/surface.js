const MIN_THETA = 0.1;
const GRADIENT_THETA = 0.08;
const SIGMA = 1.2;
const NEIGHBOURS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1]
];
const WEIGHTS = [1, 2, 3, 4].map(k => Math.exp(-(k * k) / (2 * SIGMA * SIGMA)));

const blur = (out, width, height, dx, dy) => {
  const source = out.slice();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const c = (y * width + x) * 4;
      if (source[c + 3] < 0.25) continue;
      let u = source[c];
      let gx = source[c + 1];
      let gy = source[c + 2];
      let total = 1;
      for (let k = 1; k <= 4; k++) {
        for (const sign of [1, -1]) {
          const nx = Math.min(width - 1, Math.max(0, x + dx * k * sign));
          const ny = Math.min(height - 1, Math.max(0, y + dy * k * sign));
          const n = (ny * width + nx) * 4;
          if (source[n + 3] < 0.25) continue;
          const w = WEIGHTS[k - 1];
          u += w * source[n];
          gx += w * source[n + 1];
          gy += w * source[n + 2];
          total += w;
        }
      }
      out[c] = u / total;
      out[c + 1] = gx / total;
      out[c + 2] = gy / total;
    }
  }
};

const downsample = (data, width, height) => {
  const w = Math.max(1, Math.floor(width / 2));
  const h = Math.max(1, Math.floor(height / 2));
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * 2 * width + x * 2;
      const right = Math.min(x * 2 + 1, width - 1) - x * 2;
      const down = Math.min(y * 2 + 1, height - 1) - y * 2;
      out[y * w + x] = (data[i] + data[i + right] + data[i + down * width] + data[i + down * width + right]) * 0.25;
    }
  }
  return { data: out, width: w, height: h };
};

const upsample = (coarse, cw, ch, width, height) => {
  const out = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    const fy = Math.min(Math.max((y + 0.5) / 2 - 0.5, 0), ch - 1);
    const y0 = Math.floor(fy);
    const y1 = Math.min(y0 + 1, ch - 1);
    const ty = fy - y0;
    for (let x = 0; x < width; x++) {
      const fx = Math.min(Math.max((x + 0.5) / 2 - 0.5, 0), cw - 1);
      const x0 = Math.floor(fx);
      const x1 = Math.min(x0 + 1, cw - 1);
      const tx = fx - x0;
      const a = coarse[y0 * cw + x0] * (1 - tx) + coarse[y0 * cw + x1] * tx;
      const b = coarse[y1 * cw + x0] * (1 - tx) + coarse[y1 * cw + x1] * tx;
      out[y * width + x] = a * (1 - ty) + b * ty;
    }
  }
  return out;
};

const buildStencil = (sdf, width, height, screen) => {
  const count = width * height;
  const weights = new Float32Array(count * 4);
  const diagonal = new Float32Array(count);
  const inside = new Uint8Array(count);
  for (let i = 0; i < count; i++) inside[i] = sdf[i] < 0 ? 1 : 0;
  const theta = (c, n) => Math.max(MIN_THETA, Math.min(1, sdf[c] / (sdf[c] - sdf[n])));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const c = y * width + x;
      if (!inside[c]) continue;
      const east = x + 1 < width ? c + 1 : -1;
      const west = x > 0 ? c - 1 : -1;
      const south = y + 1 < height ? c + width : -1;
      const north = y > 0 ? c - width : -1;
      const te = east >= 0 && inside[east] ? 1 : east >= 0 ? theta(c, east) : MIN_THETA;
      const tw = west >= 0 && inside[west] ? 1 : west >= 0 ? theta(c, west) : MIN_THETA;
      const ts = south >= 0 && inside[south] ? 1 : south >= 0 ? theta(c, south) : MIN_THETA;
      const tn = north >= 0 && inside[north] ? 1 : north >= 0 ? theta(c, north) : MIN_THETA;
      const kx = 2 / (te + tw);
      const ky = 2 / (ts + tn);
      weights[c * 4] = east >= 0 && inside[east] ? kx / te : 0;
      weights[c * 4 + 1] = west >= 0 && inside[west] ? kx / tw : 0;
      weights[c * 4 + 2] = south >= 0 && inside[south] ? ky / ts : 0;
      weights[c * 4 + 3] = north >= 0 && inside[north] ? ky / tn : 0;
      diagonal[c] = kx * (1 / te + 1 / tw) + ky * (1 / ts + 1 / tn) + screen;
    }
  }
  return { weights, diagonal, inside };
};

const relax = (u, width, height, stencil, screen, sweeps, omega) => {
  const { weights, diagonal, inside } = stencil;
  for (let sweep = 0; sweep < sweeps; sweep++) {
    for (let parity = 0; parity < 2; parity++) {
      for (let y = 0; y < height; y++) {
        for (let x = (y + parity) & 1; x < width; x += 2) {
          const c = y * width + x;
          if (!inside[c]) continue;
          const w = c * 4;
          let sum = screen;
          if (weights[w]) sum += weights[w] * u[c + 1];
          if (weights[w + 1]) sum += weights[w + 1] * u[c - 1];
          if (weights[w + 2]) sum += weights[w + 2] * u[c + width];
          if (weights[w + 3]) sum += weights[w + 3] * u[c - width];
          u[c] += omega * (sum / diagonal[c] - u[c]);
        }
      }
    }
  }
};

const solveLevel = (level, length, initial, sweeps) => {
  const { data, width, height, unit } = level;
  const pixels = Math.max(length * unit, 0.75);
  const screen = 1 / (pixels * pixels);
  const stencil = buildStencil(data, width, height, screen);
  const u = initial || new Float32Array(width * height);
  if (!initial) {
    for (let i = 0; i < u.length; i++) u[i] = data[i] < 0 ? 1 - Math.exp((data[i] * unit) / pixels) : 0;
  } else {
    for (let i = 0; i < u.length; i++) if (!stencil.inside[i]) u[i] = 0;
  }
  relax(u, width, height, stencil, screen, sweeps, 1.6);
  return u;
};

export function solveSurface(field, length) {
  const { data, width, height, unit } = field;
  const sdf = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) sdf[i] = data[i];
  const levels = [{ data: sdf, width, height, unit }];
  while (Math.min(levels[levels.length - 1].width, levels[levels.length - 1].height) > 40) {
    const last = levels[levels.length - 1];
    const next = downsample(last.data, last.width, last.height);
    levels.push({ ...next, unit: last.unit / 2 });
  }
  let u = null;
  for (let index = levels.length - 1; index >= 0; index--) {
    const level = levels[index];
    const coarser = levels[index + 1];
    const initial = u && coarser ? upsample(u, coarser.width, coarser.height, level.width, level.height) : null;
    u = solveLevel(level, length, initial, index === levels.length - 1 ? 60 : index === 0 ? 14 : 10);
  }
  const out = new Float32Array(width * height * 4);
  const inside = i => sdf[i] < 0;
  const theta = (c, n) => Math.max(GRADIENT_THETA, Math.min(1, sdf[c] / (sdf[c] - sdf[n])));
  const slope = (c, plus, minus) => {
    const pIn = plus < 0 || inside(plus);
    const mIn = minus < 0 || inside(minus);
    const up = plus < 0 ? u[c] : pIn ? u[plus] : 0;
    const um = minus < 0 ? u[c] : mIn ? u[minus] : 0;
    if (pIn && mIn) return (up - um) / 2;
    const tp = pIn ? 1 : theta(c, plus);
    const tm = mIn ? 1 : theta(c, minus);
    return (tm * tm * up - tp * tp * um - (tm * tm - tp * tp) * u[c]) / (tm * tp * (tm + tp));
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const c = y * width + x;
      if (!inside(c)) continue;
      out[c * 4] = u[c];
      out[c * 4 + 1] = slope(c, x + 1 < width ? c + 1 : -1, x > 0 ? c - 1 : -1) * unit;
      out[c * 4 + 2] = slope(c, y + 1 < height ? c + width : -1, y > 0 ? c - width : -1) * unit;
      out[c * 4 + 3] = 1;
    }
  }
  for (let ring = 0; ring < 2; ring++) {
    const next = out.slice();
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const c = y * width + x;
        if (out[c * 4 + 3] > 0.25) continue;
        let value = 0;
        let gx = 0;
        let gy = 0;
        let count = 0;
        for (const [dx, dy] of NEIGHBOURS) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const k = (ny * width + nx) * 4;
          if (out[k + 3] < 0.25) continue;
          value += out[k] - (out[k + 1] * dx + out[k + 2] * dy) / unit;
          gx += out[k + 1];
          gy += out[k + 2];
          count += 1;
        }
        if (!count) continue;
        next[c * 4] = value / count;
        next[c * 4 + 1] = gx / count;
        next[c * 4 + 2] = gy / count;
        next[c * 4 + 3] = 0.5;
      }
    }
    out.set(next);
  }
  blur(out, width, height, 1, 0);
  blur(out, width, height, 0, 1);
  return { data: out, width, height, unit };
}
