export const PANE_WIDTH = 760;
export const PANE_HEIGHT = 440;

const INSET = 8;
const COUNT = 30;
const TAU = Math.PI * 2;

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

const createShards = () => {
  let seed = 404;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const between = (min, max) => min + random() * (max - min);
  const sites = [{ x: 373, y: 214 }];
  for (let index = 1; index < COUNT; index++) {
    let best = null;
    let clearance = -1;
    for (let candidate = 0; candidate < 100; candidate++) {
      const angle = between(0, TAU);
      const radius = Math.sqrt(random());
      const edge = 1 + 0.075 * Math.sin(angle * 3 + 0.6) + 0.045 * Math.cos(angle * 5 - 0.8);
      const point = {
        x: PANE_WIDTH / 2 + Math.cos(angle) * radius * edge * 322,
        y: PANE_HEIGHT / 2 + Math.sin(angle) * radius * edge * 171
      };
      const distance = Math.min(...sites.map(site => (point.x - site.x) ** 2 + (point.y - site.y) ** 2));
      if (distance > clearance) {
        best = point;
        clearance = distance;
      }
    }
    sites.push(best);
  }

  const guards = Array.from({ length: 20 }, (_, index) => {
    const angle = (index / 20) * TAU + between(-0.045, 0.045);
    const radius = between(0.95, 1.05);
    return {
      x: PANE_WIDTH / 2 + Math.cos(angle) * radius * 415,
      y: PANE_HEIGHT / 2 + Math.sin(angle) * radius * 258
    };
  });
  const cells = sites.map(site => {
    let polygon = [
      { x: -PANE_WIDTH, y: -PANE_HEIGHT },
      { x: PANE_WIDTH * 2, y: -PANE_HEIGHT },
      { x: PANE_WIDTH * 2, y: PANE_HEIGHT * 2 },
      { x: -PANE_WIDTH, y: PANE_HEIGHT * 2 }
    ];
    [...sites, ...guards].forEach(neighbor => {
      if (neighbor === site) return;
      const dx = neighbor.x - site.x;
      const dy = neighbor.y - site.y;
      const length = Math.hypot(dx, dy);
      const nx = dx / length;
      const ny = dy / length;
      const limit = ((site.x + neighbor.x) * nx + (site.y + neighbor.y) * ny) / 2;
      polygon = clip(polygon, nx, ny, limit);
    });
    return polygon;
  });
  const allPoints = cells.flat();
  const left = Math.min(...allPoints.map(point => point.x));
  const top = Math.min(...allPoints.map(point => point.y));
  const scaleX = PANE_WIDTH / (Math.max(...allPoints.map(point => point.x)) - left);
  const scaleY = PANE_HEIGHT / (Math.max(...allPoints.map(point => point.y)) - top);

  return cells.map(cell => {
    const sourcePolygon = cell.map(point => ({ x: (point.x - left) * scaleX, y: (point.y - top) * scaleY }));
    let vertices = sourcePolygon;
    sourcePolygon.forEach((a, index) => {
      const b = sourcePolygon[(index + 1) % sourcePolygon.length];
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      const nx = (b.y - a.y) / length;
      const ny = (a.x - b.x) / length;
      vertices = clip(vertices, nx, ny, a.x * nx + a.y * ny - INSET);
    });

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
