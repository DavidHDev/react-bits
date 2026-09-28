export const PANE_WIDTH = 760;
export const PANE_HEIGHT = 440;

const INSET = 12;
const TILE = 100;
const VISIBLE_CELLS = [
  [1, 0],
  [2, 0],
  [4, 0],
  [0, 1],
  [1, 1],
  [2, 1],
  [3, 1],
  [4, 1],
  [5, 1],
  [0, 2],
  [1, 2],
  [2, 2],
  [3, 2],
  [4, 2],
  [5, 2],
  [6, 2],
  [1, 3],
  [2, 3],
  [3, 3],
  [5, 3],
  [2, 4],
  [4, 4]
];

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
  const sites = [];
  for (let row = -2; row <= 6; row++) {
    for (let column = -2; column <= 8; column++) {
      sites.push({
        column,
        row,
        x: 80 + column * TILE + between(-38, 38),
        y: 20 + row * TILE + between(-38, 38)
      });
    }
  }

  return VISIBLE_CELLS.map(([column, row]) => {
    const site = sites.find(candidate => candidate.column === column && candidate.row === row);
    const boundary = [
      { x: -PANE_WIDTH, y: -PANE_HEIGHT },
      { x: PANE_WIDTH * 2, y: -PANE_HEIGHT },
      { x: PANE_WIDTH * 2, y: PANE_HEIGHT * 2 },
      { x: -PANE_WIDTH, y: PANE_HEIGHT * 2 }
    ];
    let sourcePolygon = boundary;
    let vertices = boundary;

    sites.forEach(neighbor => {
      if (neighbor === site) return;
      const dx = neighbor.x - site.x;
      const dy = neighbor.y - site.y;
      const length = Math.hypot(dx, dy);
      const nx = dx / length;
      const ny = dy / length;
      const limit = ((site.x + neighbor.x) * nx + (site.y + neighbor.y) * ny) / 2;
      sourcePolygon = clip(sourcePolygon, nx, ny, limit);
      vertices = clip(vertices, nx, ny, limit - INSET);
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
