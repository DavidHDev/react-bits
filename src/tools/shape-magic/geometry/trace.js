const ENTRY = new Uint8Array(16);
const EXIT = new Int8Array(16).fill(-1);

for (let c = 0; c < 16; c++) {
  for (let k = 0; k < 4; k++) {
    const a = (c >> k) & 1;
    const b = (c >> ((k + 1) & 3)) & 1;
    if (a && !b) ENTRY[c] |= 1 << k;
    if (!a && b) EXIT[c] = k;
  }
}

export function traceField(field, { level = 0 } = {}) {
  const { data, width, height } = field;
  const pw = width + 2;
  const inside = new Uint8Array(pw * (height + 2));
  for (let y = 0; y < height; y++) {
    const src = y * width;
    const dst = (y + 1) * pw + 1;
    for (let x = 0; x < width; x++) if (data[src + x] < level) inside[dst + x] = 1;
  }

  const cw = width + 1;
  const ch = height + 1;
  const used = new Uint8Array(cw * ch);

  const value = (px, py) => (px < 1 || py < 1 || px > width || py > height ? NaN : data[(py - 1) * width + px - 1]);

  const cellCase = (cx, cy) => {
    const i = cy * pw + cx;
    return inside[i] | (inside[i + 1] << 1) | (inside[i + pw + 1] << 2) | (inside[i + pw] << 3);
  };

  const follow = (sx, sy, se) => {
    const points = [];
    let cx = sx;
    let cy = sy;
    let e = se;
    let lx = Infinity;
    let ly = Infinity;
    for (let guard = used.length * 4; guard > 0; guard--) {
      used[cy * cw + cx] |= 1 << e;
      const ax = e === 1 ? cx + 1 : cx;
      const ay = e === 2 ? cy + 1 : cy;
      const bx = e === 3 ? cx : cx + 1;
      const by = e === 0 ? cy : cy + 1;
      const va = value(ax, ay);
      const vb = value(bx, by);
      let t = 0.5;
      if (va === va && vb === vb && va !== vb) t = Math.min(1, Math.max(0, (level - va) / (vb - va)));
      const x = ax - 0.5 + (bx - ax) * t;
      const y = ay - 0.5 + (by - ay) * t;
      if (Math.abs(x - lx) + Math.abs(y - ly) > 1e-9) {
        points.push([x, y]);
        lx = x;
        ly = y;
      }
      const c = cellCase(cx, cy);
      let out = EXIT[c];
      if (c === 5 || c === 10) {
        const sum = value(cx, cy) + value(cx + 1, cy) + value(cx + 1, cy + 1) + value(cx, cy + 1);
        out = sum < level * 4 ? (e + 1) & 3 : (e + 3) & 3;
      }
      if (out === 0) cy--;
      else if (out === 1) cx++;
      else if (out === 2) cy++;
      else cx--;
      e = (out + 2) & 3;
      if (cx === sx && cy === sy && e === se) break;
    }
    if (points.length > 1) {
      const a = points[0];
      const b = points[points.length - 1];
      if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) <= 1e-9) points.pop();
    }
    return points;
  };

  const contours = [];
  for (let cy = 0; cy < ch; cy++) {
    const row = cy * pw;
    for (let cx = 0; cx < cw; cx++) {
      const i = row + cx;
      const c = inside[i] | (inside[i + 1] << 1) | (inside[i + pw + 1] << 2) | (inside[i + pw] << 3);
      if (c === 0 || c === 15) continue;
      const cell = cy * cw + cx;
      let mask = ENTRY[c] & ~used[cell];
      while (mask) {
        const e = 31 - Math.clz32(mask & -mask);
        const points = follow(cx, cy, e);
        if (points.length >= 3) contours.push(points);
        mask = ENTRY[c] & ~used[cell];
      }
    }
  }
  return contours;
}

export function contourArea(points) {
  let area = 0;
  for (let i = 0, n = points.length; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    area += a[0] * b[1] - b[0] * a[1];
  }
  return area / 2;
}
