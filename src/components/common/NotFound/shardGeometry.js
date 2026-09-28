export const PANE_WIDTH = 760;
export const PANE_HEIGHT = 440;

const triangulate = points => {
  const span = Math.max(PANE_WIDTH, PANE_HEIGHT);
  const vertices = [
    ...points,
    { x: PANE_WIDTH / 2 - span * 20, y: PANE_HEIGHT / 2 - span },
    { x: PANE_WIDTH / 2 + span * 20, y: PANE_HEIGHT / 2 - span },
    { x: PANE_WIDTH / 2, y: PANE_HEIGHT / 2 + span * 20 }
  ];

  const triangle = (a, b, c) => {
    const p = vertices[a];
    let q = vertices[b];
    let r = vertices[c];
    const cross = (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
    if (Math.abs(cross) < 1e-7) return null;
    if (cross < 0) {
      [b, c] = [c, b];
      [q, r] = [r, q];
    }
    const determinant = 2 * (p.x * (q.y - r.y) + q.x * (r.y - p.y) + r.x * (p.y - q.y));
    const p2 = p.x * p.x + p.y * p.y;
    const q2 = q.x * q.x + q.y * q.y;
    const r2 = r.x * r.x + r.y * r.y;
    const x = (p2 * (q.y - r.y) + q2 * (r.y - p.y) + r2 * (p.y - q.y)) / determinant;
    const y = (p2 * (r.x - q.x) + q2 * (p.x - r.x) + r2 * (q.x - p.x)) / determinant;
    return { indices: [a, b, c], x, y, radiusSquared: (x - p.x) ** 2 + (y - p.y) ** 2 };
  };

  let triangles = [triangle(points.length, points.length + 1, points.length + 2)];
  points.forEach((point, index) => {
    const edges = new Map();
    triangles = triangles.filter(cell => {
      if ((point.x - cell.x) ** 2 + (point.y - cell.y) ** 2 > cell.radiusSquared + 1e-7) return true;
      for (let side = 0; side < 3; side++) {
        const a = cell.indices[side];
        const b = cell.indices[(side + 1) % 3];
        const key = a < b ? `${a}:${b}` : `${b}:${a}`;
        if (edges.has(key)) edges.delete(key);
        else edges.set(key, [a, b]);
      }
      return false;
    });
    edges.forEach(([a, b]) => {
      const cell = triangle(a, b, index);
      if (cell) triangles.push(cell);
    });
  });

  return triangles
    .filter(cell => cell.indices.every(index => index < points.length))
    .map(cell => cell.indices.map(index => points[index]));
};

const createShards = () => {
  let seed = 404;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const between = (min, max) => min + random() * (max - min);
  const points = [
    { x: 40, y: 132 },
    { x: 190, y: 34 },
    { x: 343, y: 73 },
    { x: 457, y: 15 },
    { x: 593, y: 100 },
    { x: 727, y: 65 },
    { x: 701, y: 229 },
    { x: 746, y: 336 },
    { x: 560, y: 417 },
    { x: 425, y: 367 },
    { x: 261, y: 432 },
    { x: 85, y: 342 },
    { x: 26, y: 257 },
    { x: 373, y: 207 }
  ];

  for (let index = 0; index < 7; index++) {
    let best = null;
    let clearance = -1;
    for (let candidate = 0; candidate < 80; candidate++) {
      const point = {
        x: Math.round(between(120, PANE_WIDTH - 120)),
        y: Math.round(between(95, PANE_HEIGHT - 95))
      };
      const distance = Math.min(...points.map(vertex => (point.x - vertex.x) ** 2 + (point.y - vertex.y) ** 2));
      if (distance > clearance) {
        best = point;
        clearance = distance;
      }
    }
    points.push(best);
  }

  return triangulate(points).map(vertices => {
    const x = Math.min(...vertices.map(point => point.x));
    const y = Math.min(...vertices.map(point => point.y));
    const width = Math.max(...vertices.map(point => point.x)) - x;
    const height = Math.max(...vertices.map(point => point.y)) - y;
    const cx = vertices.reduce((total, point) => total + point.x, 0) / 3 - PANE_WIDTH / 2;
    const cy = vertices.reduce((total, point) => total + point.y, 0) / 3 - PANE_HEIGHT / 2;
    const radius = Math.hypot(cx, cy) || 1;
    const separation = between(14, 64);
    const sideways = between(-28, 28);
    const rotation = between(-16, 16);

    return {
      x,
      y,
      width,
      height,
      points: vertices.map(point => `${point.x - x},${point.y - y}`).join(' '),
      offsetX: (cx * separation - cy * sideways) / radius,
      offsetY: (cy * separation + cx * sideways) / radius,
      rotation,
      depth: between(0.4, 1),
      driftX: between(3, 6) * (random() < 0.5 ? -1 : 1),
      driftY: between(3, 6) * (random() < 0.5 ? -1 : 1),
      turn: between(0.5, 1.2) * (random() < 0.5 ? -1 : 1),
      duration: between(20, 32),
      delay: between(-32, 0)
    };
  });
};

export const SHARDS = createShards();
