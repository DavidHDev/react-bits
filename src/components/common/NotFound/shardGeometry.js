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
  const third = size => Math.round(size * between(0.26, 0.39));
  const twoThirds = size => Math.round(size * between(0.61, 0.74));
  const points = [
    { x: 0, y: 0 },
    { x: third(PANE_WIDTH), y: 0 },
    { x: twoThirds(PANE_WIDTH), y: 0 },
    { x: PANE_WIDTH, y: 0 },
    { x: PANE_WIDTH, y: third(PANE_HEIGHT) },
    { x: PANE_WIDTH, y: twoThirds(PANE_HEIGHT) },
    { x: PANE_WIDTH, y: PANE_HEIGHT },
    { x: twoThirds(PANE_WIDTH), y: PANE_HEIGHT },
    { x: third(PANE_WIDTH), y: PANE_HEIGHT },
    { x: 0, y: PANE_HEIGHT },
    { x: 0, y: twoThirds(PANE_HEIGHT) },
    { x: 0, y: third(PANE_HEIGHT) },
    { x: 373, y: 207 }
  ];

  for (let index = 0; index < 9; index++) {
    let best = null;
    let clearance = -1;
    for (let candidate = 0; candidate < 80; candidate++) {
      const point = {
        x: Math.round(between(58, PANE_WIDTH - 58)),
        y: Math.round(between(48, PANE_HEIGHT - 48))
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
    const separation = radius * 0.12 + between(4, 9);

    return {
      x,
      y,
      width,
      height,
      points: vertices.map(point => `${point.x - x},${point.y - y}`).join(' '),
      offsetX: (cx / radius) * separation,
      offsetY: (cy / radius) * separation,
      rotation: between(-1.5, 1.5),
      depth: between(0.4, 1),
      driftX: between(3, 6) * (random() < 0.5 ? -1 : 1),
      driftY: between(3, 6) * (random() < 0.5 ? -1 : 1),
      turn: between(0.5, 1.2),
      duration: between(20, 32),
      delay: between(-32, 0)
    };
  });
};

export const SHARDS = createShards();
