export const PANE_WIDTH = 760;
export const PANE_HEIGHT = 440;

const TAU = Math.PI * 2;
const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

const hull = points => {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const half = list => {
    const result = [];
    list.forEach(point => {
      while (result.length > 1 && cross(result.at(-2), result.at(-1), point) <= 0) result.pop();
      result.push(point);
    });
    return result;
  };
  return [...half(sorted).slice(0, -1), ...half([...sorted].reverse()).slice(0, -1)];
};

const createShards = () => {
  let seed = 4821;
  const random = (min = 0, max = 1) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return min + (seed / 4294967296) * (max - min);
  };
  const shards = [];

  // Each fragment is placed independently. Conservative circular clearances
  // leave room for arbitrary in-plane rotation and the separate spring motion.
  for (let index = 0; index < 56; index++) {
    const large = index < 12;
    const chip = index >= 30;
    let placement;
    for (let attempt = 0; attempt < 1800; attempt++) {
      const px = random(-350, 350);
      const py = random(-203, 203);
      const radial = Math.hypot(px / 380, py / 220);
      if (radial > 0.96 || radial < (large ? 0.4 : chip ? 0.48 : 0.25)) continue;
      const radius = chip ? random(5, 10) : (large ? 64 - radial * 28 : 32 - radial * 16) * random(0.78, 1.18);
      if (shards.some(shard => Math.hypot(px - shard.px, py - shard.py) < (radius + shard.radius) * 1.08 + 14))
        continue;
      placement = { px, py, radius };
      break;
    }
    if (!placement) continue;
    const { px, py, radius } = placement;
    const count = 4 + Math.floor(random(0, 4));
    const steps = Array.from({ length: count }, () => random(0.65, 1.4));
    const total = steps.reduce((sum, step) => sum + step, 0);
    const stretch = random(0.78, index % 6 === 0 ? 1.65 : 1.28);
    let angle = random(0, TAU);
    let polygon = hull(
      steps.map(step => {
        angle += (step / total) * TAU;
        const length = random(0.68, 1.15);
        return { x: Math.cos(angle) * length * stretch, y: (Math.sin(angle) * length) / stretch };
      })
    );

    // Only occasional pieces have a small chipped edge. Most keep uninterrupted
    // fracture faces, rather than uniformly trimmed or rounded corners.
    if (large && index % 4 === 1) {
      let edge = 0;
      let longest = 0;
      polygon.forEach((a, i) => {
        const b = polygon[(i + 1) % polygon.length];
        const length = Math.hypot(b.x - a.x, b.y - a.y);
        if (length > longest) {
          longest = length;
          edge = i;
        }
      });
      const a = polygon[edge];
      const b = polygon[(edge + 1) % polygon.length];
      const nx = -(b.y - a.y) / longest;
      const ny = (b.x - a.x) / longest;
      polygon.splice(
        edge + 1,
        0,
        ...[0.36, 0.49, 0.62].map((t, i) => ({
          x: a.x + (b.x - a.x) * t + (i === 1 ? nx * 0.12 : 0),
          y: a.y + (b.y - a.y) * t + (i === 1 ? ny * 0.12 : 0)
        }))
      );
    }
    const cx = (Math.min(...polygon.map(p => p.x)) + Math.max(...polygon.map(p => p.x))) / 2;
    const cy = (Math.min(...polygon.map(p => p.y)) + Math.max(...polygon.map(p => p.y))) / 2;
    const scale = radius / Math.max(...polygon.map(p => Math.hypot(p.x - cx, p.y - cy)));
    polygon = polygon.map(p => ({ x: (p.x - cx) * scale + px + 380, y: (p.y - cy) * scale + 220 - py }));
    const x = Math.min(...polygon.map(p => p.x));
    const y = Math.min(...polygon.map(p => p.y));
    const width = Math.max(...polygon.map(p => p.x)) - x;
    const height = Math.max(...polygon.map(p => p.y)) - y;
    const edgeOn = index % 7 === 0;
    shards.push({
      ...placement,
      x,
      y,
      width,
      height,
      vertices: polygon,
      z: random(-35, 40),
      tiltX: edgeOn ? random(0.95, 1.2) * (random() < 0.5 ? -1 : 1) : random(-0.58, 0.58),
      tiltY: random(-0.62, 0.62),
      turn: random(-Math.PI, Math.PI)
    });
  }
  return shards;
};

export const SHARDS = createShards();
