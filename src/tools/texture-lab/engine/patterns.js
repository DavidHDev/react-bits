export const BLUE_SIZE = 64;
export const POINT_SIZE = 64;

export function voidAndCluster(size) {
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

export function farthestPoints(size) {
  const n = size * size;
  let seed = 11;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const jx = new Float64Array(n);
  const jy = new Float64Array(n);
  const px = new Float64Array(n);
  const py = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    jx[i] = (random() - 0.5) * 0.8;
    jy[i] = (random() - 0.5) * 0.8;
    px[i] = (i % size) + 0.5 + jx[i];
    py[i] = Math.floor(i / size) + 0.5 + jy[i];
  }
  const nearest = new Float64Array(n).fill(Infinity);
  const rank = new Uint32Array(n);
  const half = size / 2;
  let current = Math.floor(random() * n);
  for (let k = 0; k < n && current >= 0; k += 1) {
    rank[current] = k;
    nearest[current] = -1;
    const cx = px[current];
    const cy = py[current];
    let best = -1;
    let far = -1;
    for (let i = 0; i < n; i += 1) {
      const known = nearest[i];
      if (known < 0) continue;
      let dx = Math.abs(px[i] - cx);
      let dy = Math.abs(py[i] - cy);
      if (dx > half) dx = size - dx;
      if (dy > half) dy = size - dy;
      const d = dx * dx + dy * dy;
      const value = d < known ? d : known;
      nearest[i] = value;
      if (value > far) {
        far = value;
        best = i;
      }
    }
    current = best;
  }
  const data = new Uint8Array(n * 4);
  for (let i = 0; i < n; i += 1) {
    const value = Math.round(((rank[i] + 0.5) / n) * 65535);
    data[i * 4] = value >> 8;
    data[i * 4 + 1] = Math.round((jx[i] + 0.5) * 255);
    data[i * 4 + 2] = Math.round((jy[i] + 0.5) * 255);
    data[i * 4 + 3] = value & 255;
  }
  return data;
}

const cache = { blue: null, points: null };
let worker = null;

export function patternData(name) {
  if (!cache[name]) cache[name] = name === 'blue' ? voidAndCluster(BLUE_SIZE) : farthestPoints(POINT_SIZE);
  return cache[name];
}

export function warmPatterns() {
  if (worker || (cache.blue && cache.points) || typeof Worker === 'undefined') return;
  try {
    worker = new Worker(new URL('./patterns.worker.js', import.meta.url), { type: 'module' });
  } catch {
    worker = null;
    return;
  }
  worker.onmessage = event => {
    const { blue, points } = event.data || {};
    if (!cache.blue && blue) cache.blue = blue;
    if (!cache.points && points) cache.points = points;
    worker.terminate();
  };
  worker.onerror = () => worker.terminate();
  worker.postMessage({ blue: !cache.blue, points: !cache.points });
}
