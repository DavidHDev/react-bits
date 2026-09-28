export const PANE_WIDTH = 760;
export const PANE_HEIGHT = 440;

const INSET = 8;
const COUNT = 24;

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

const createShards = () => {
  let seed = 404;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const between = (min, max) => min + random() * (max - min);
  const point = (x, y) => ({ x, y });
  const left = point(0, 242);
  const first = point(280, 196);
  const second = point(478, 226);
  const right = point(760, 171);
  const upperLeft = point(190, 28);
  const upperRight = point(590, 40);
  const lowerLeft = point(164, 418);
  const lowerRight = point(553, 394);
  // The primary crack branches between two displaced junctions. Its boundary
  // has inward breaks, so the assembled fragments never form an oval slab.
  const cells = [
    [left, point(37, 95), upperLeft, first],
    [upperLeft, point(338, 0), upperRight, second, first],
    [upperRight, point(680, 20), right, second],
    [left, first, lowerLeft, point(85, 382), point(12, 315)],
    [first, second, lowerRight, point(374, 440), lowerLeft],
    [second, right, point(736, 320), point(685, 409), lowerRight]
  ].map(polygon => ({ polygon, direction: null }));

  while (cells.length < COUNT) {
    const weights = cells.map(cell => Math.max(0, area(cell.polygon) - 6500) ** 1.2);
    let pick = random() * weights.reduce((sum, weight) => sum + weight, 0);
    let selected = weights.findIndex(weight => (pick -= weight) < 0);
    if (selected < 0) selected = 0;
    const cell = cells[selected];
    let best = null;
    let bestScore = -Infinity;
    const desiredRatio = between(0.23, 0.62);
    const desiredAspect = random() < 0.45 ? between(2.2, 3.7) : between(1.2, 2.1);

    for (let attempt = 0; attempt < 100; attempt++) {
      const direction = between(0, Math.PI);
      if (cell.direction !== null && Math.abs(Math.sin(direction - cell.direction)) < 0.3) continue;
      const nx = Math.cos(direction);
      const ny = Math.sin(direction);
      const projections = cell.polygon.map(p => p.x * nx + p.y * ny);
      const min = Math.min(...projections);
      const max = Math.max(...projections);
      const limit = min + (max - min) * between(0.24, 0.76);
      const children = [clip(cell.polygon, nx, ny, limit), clip(cell.polygon, -nx, -ny, -limit)];
      if (children.some(polygon => polygon.length < 3 || area(polygon) < 2500)) continue;
      const inner = children.map(polygon => inset(polygon, INSET));
      if (inner.some((polygon, index) => polygon.length < 3 || area(polygon) < area(children[index]) * 0.43)) continue;
      const smaller = area(children[0]) < area(children[1]) ? 0 : 1;
      const polygon = children[smaller];
      let length = 0;
      for (const a of polygon) for (const b of polygon) length = Math.max(length, Math.hypot(a.x - b.x, a.y - b.y));
      const aspect = (length * length) / (2 * area(polygon));
      const trianglePenalty = children.filter(child => child.length === 3).length * 0.65;
      const score =
        -Math.abs(area(polygon) / area(cell.polygon) - desiredRatio) * 2 -
        Math.abs(aspect - desiredAspect) * 0.3 -
        trianglePenalty;
      if (score > bestScore) {
        bestScore = score;
        best = children.map(child => ({ polygon: child, direction }));
      }
    }
    if (!best) break;
    cells.splice(selected, 1, ...best);
  }

  return cells.map(({ polygon: sourcePolygon }) => {
    const span = Math.max(...sourcePolygon.flatMap(a => sourcePolygon.map(b => Math.hypot(a.x - b.x, a.y - b.y))));
    const vertices = inset(sourcePolygon, Math.max(INSET, span * 0.04));
    const x = Math.min(...vertices.map(point => point.x));
    const y = Math.min(...vertices.map(point => point.y));
    const width = Math.max(...vertices.map(point => point.x)) - x;
    const height = Math.max(...vertices.map(point => point.y)) - y;

    return {
      x,
      y,
      width,
      height,
      vertices,
      points: vertices.map(point => `${point.x - x},${point.y - y}`).join(' '),
      sourcePolygon,
      offsetX: 0,
      offsetY: 0,
      rotation: between(-1, 1),
      depth: between(0.4, 1),
      driftX: between(-2, 2),
      driftY: between(-2, 2),
      turn: between(-0.4, 0.4),
      duration: between(20, 32),
      delay: between(-32, 0)
    };
  });
};

export const SHARDS = createShards();
