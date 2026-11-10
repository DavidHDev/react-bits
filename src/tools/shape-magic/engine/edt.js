const INF = 1e20;

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
