export const PANE_WIDTH = 760;
export const PANE_HEIGHT = 440;

const clip = (polygon, nx, ny, limit) => {
  const result = [];
  for (let index = 0; index < polygon.length; index++) {
    const a = polygon[index];
    const b = polygon[(index + 1) % polygon.length];
    const da = a.x * nx + a.y * ny - limit;
    const db = b.x * nx + b.y * ny - limit;
    if (da <= 0) result.push(a);
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
      const t = da / (da - db);
      result.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  return result;
};

const area = polygon =>
  Math.abs(
    polygon.reduce((sum, point, index) => {
      const next = polygon[(index + 1) % polygon.length];
      return sum + point.x * next.y - next.x * point.y;
    }, 0) / 2
  );
const span = polygon => Math.max(...polygon.flatMap(a => polygon.map(b => Math.hypot(a.x - b.x, a.y - b.y))));
const center = polygon => ({
  x: polygon.reduce((sum, point) => sum + point.x, 0) / polygon.length,
  y: polygon.reduce((sum, point) => sum + point.y, 0) / polygon.length
});

const inset = (polygon, margin) => {
  let result = polygon;
  polygon.forEach((a, index) => {
    const b = polygon[(index + 1) % polygon.length];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const nx = (b.y - a.y) / length;
    const ny = (a.x - b.x) / length;
    result = clip(result, nx, ny, a.x * nx + a.y * ny - margin);
  });
  return result;
};

const minimumAngle = polygon =>
  Math.min(
    ...polygon.map((point, index) => {
      const a = polygon[(index + polygon.length - 1) % polygon.length];
      const b = polygon[(index + 1) % polygon.length];
      const ax = a.x - point.x;
      const ay = a.y - point.y;
      const bx = b.x - point.x;
      const by = b.y - point.y;
      return Math.acos(Math.max(-1, Math.min(1, (ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by)))));
    })
  );

// Tiny clipped tips soften the silhouette without turning the fragments into
// rounded tiles. All points remain inside their original fracture cell.
const softenTips = polygon =>
  polygon.flatMap((point, index) => {
    const previous = polygon[(index + polygon.length - 1) % polygon.length];
    const next = polygon[(index + 1) % polygon.length];
    const cut = Math.min(
      2.4,
      Math.hypot(previous.x - point.x, previous.y - point.y) * 0.1,
      Math.hypot(next.x - point.x, next.y - point.y) * 0.1
    );
    return [previous, next].map(neighbor => {
      const ratio = cut / Math.hypot(neighbor.x - point.x, neighbor.y - point.y);
      return { x: point.x + (neighbor.x - point.x) * ratio, y: point.y + (neighbor.y - point.y) * ratio };
    });
  });

const targetArea = polygon => {
  const point = center(polygon);
  const radius = Math.min(1, Math.hypot((point.x - 380) / 380, (point.y - 220) / 220));
  return 850 + 8500 * (1 - radius) ** 1.45;
};

const createShards = () => {
  let seed = 404;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const between = (min, max) => min + random() * (max - min);
  const cells = [
    {
      polygon: [
        [0, 217],
        [57, 77],
        [219, 16],
        [474, 0],
        [675, 64],
        [760, 212],
        [693, 366],
        [466, 440],
        [238, 398],
        [70, 339]
      ].map(([x, y]) => ({ x, y })),
      complete: false
    }
  ];

  // Subdivide a connected pane with unequal straight cracks. Smaller target
  // areas near its perimeter create a gradual falloff in fragment size.
  while (cells.length < 90) {
    let selected = -1;
    let largest = 1.3;
    cells.forEach((cell, index) => {
      const ratio = cell.complete ? 0 : area(cell.polygon) / targetArea(cell.polygon);
      if (ratio > largest) {
        largest = ratio;
        selected = index;
      }
    });
    if (selected < 0) break;
    const cell = cells[selected];
    let best = null;
    let bestScore = -Infinity;
    const desiredRatio = between(0.36, 0.5);
    for (let attempt = 0; attempt < 160; attempt++) {
      const direction = between(0, Math.PI);
      const nx = Math.cos(direction);
      const ny = Math.sin(direction);
      const projections = cell.polygon.map(point => point.x * nx + point.y * ny);
      const min = Math.min(...projections);
      const max = Math.max(...projections);
      const limit = min + (max - min) * between(0.3, 0.7);
      const children = [clip(cell.polygon, nx, ny, limit), clip(cell.polygon, -nx, -ny, -limit)];
      if (children.some(polygon => polygon.length < 3 || area(polygon) < 450 || minimumAngle(polygon) < 0.64)) continue;
      const aspects = children.map(polygon => span(polygon) ** 2 / (2 * area(polygon)));
      if (Math.max(...aspects) > 2.15) continue;
      const ratio = Math.min(...children.map(area)) / area(cell.polygon);
      const triangles = children.filter(polygon => polygon.length === 3).length;
      const score = -Math.abs(ratio - desiredRatio) - Math.max(...aspects) * 0.6 - triangles * 0.12;
      if (score > bestScore) {
        bestScore = score;
        best = children;
      }
    }
    if (best) cells.splice(selected, 1, ...best.map(polygon => ({ polygon, complete: false })));
    else cell.complete = true;
  }

  return cells.map(({ polygon: sourcePolygon }) => {
    const margin = 3.8 + span(sourcePolygon) * 0.025;
    const vertices = softenTips(inset(sourcePolygon, margin));
    const x = Math.min(...vertices.map(point => point.x));
    const y = Math.min(...vertices.map(point => point.y));
    const width = Math.max(...vertices.map(point => point.x)) - x;
    const height = Math.max(...vertices.map(point => point.y)) - y;
    return { x, y, width, height, vertices, sourcePolygon };
  });
};

export const SHARDS = createShards();
