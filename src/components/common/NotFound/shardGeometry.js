export const PANE_WIDTH = 640;
export const PANE_HEIGHT = 640;
export const FIELD_RADIUS = 245;

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

const createRandom = initialSeed => {
  let seed = initialSeed;
  return (min = 0, max = 1) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return min + (seed / 4294967296) * (max - min);
  };
};

const createProfile = (index, radius) => {
  const random = createRandom(Math.imul(index + 1, 2246822519) ^ 4821);
  const choice = random();
  const profile = choice < 0.42 ? 'pointed' : choice > 0.86 && radius > 12 ? 'chipped' : 'blunt';
  let polygon;
  if (profile === 'pointed') {
    const points = [
      { x: random(1.15, 1.55), y: random(-0.16, 0.16) },
      { x: random(-0.2, 0.18), y: random(0.55, 0.86) },
      { x: random(-0.98, -0.68), y: random(0.2, 0.52) },
      { x: random(-0.65, -0.22), y: random(-0.8, -0.52) }
    ];
    if (random() > 0.5) points.push({ x: random(-0.94, -0.72), y: random(-0.42, -0.18) });
    polygon = hull(points);
  } else {
    const count = 5 + Math.floor(random(0, profile === 'chipped' ? 2 : 3));
    const steps = Array.from({ length: count }, () => random(0.78, 1.22));
    const total = steps.reduce((sum, step) => sum + step, 0);
    const stretch = random(0.86, 1.14);
    let angle = 0;
    polygon = hull(
      steps.map(step => {
        angle += (step / total) * TAU;
        const length = random(0.9, 1.1);
        return { x: Math.cos(angle) * length * stretch, y: (Math.sin(angle) * length) / stretch };
      })
    );
  }

  if (profile === 'chipped') {
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
    const depth = random(0.075, 0.14);
    const nx = -(b.y - a.y) / longest;
    const ny = (b.x - a.x) / longest;
    polygon.splice(
      edge + 1,
      0,
      ...[0.34, 0.48, 0.64].map((t, i) => ({
        x: a.x + (b.x - a.x) * t + (i === 1 ? nx * depth : 0),
        y: a.y + (b.y - a.y) * t + (i === 1 ? ny * depth : 0)
      }))
    );
  }

  const angle = random(0, TAU);
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  polygon = polygon.map(point => ({ x: point.x * c - point.y * s, y: point.x * s + point.y * c }));
  const bevelSize =
    profile === 'pointed' ? random(0.34, 0.5) : profile === 'chipped' ? random(0.43, 0.63) : random(0.58, 0.75);
  const bevelThickness =
    profile === 'pointed' ? random(0.25, 0.33) : profile === 'chipped' ? random(0.3, 0.36) : random(0.34, 0.4);
  return { polygon, profile, bevelSize: Math.min(bevelSize, radius * 0.07), bevelThickness };
};

const createShards = () => {
  const random = createRandom(4821);
  const shards = [];

  // Each fragment is placed independently. Conservative circular clearances
  // leave room for arbitrary in-plane rotation and the separate spring motion.
  for (let index = 0; index < 32; index++) {
    const large = index < 8;
    const chip = index >= 21;
    const protruding = [3, 9, 18].includes(index);
    let placement;
    for (let attempt = 0; attempt < 1800; attempt++) {
      const angle = random(0, TAU);
      // Equal axes give the field a round center of gravity. Uneven pockets
      // and a few independent outliers keep its outline from becoming a ring.
      const boundary = FIELD_RADIUS * (1 + 0.075 * Math.sin(angle * 3 + 0.6) + 0.055 * Math.cos(angle * 5 - 0.4));
      const distance = protruding ? random(265, 286) : Math.sqrt(random()) * boundary;
      const radial = distance / FIELD_RADIUS;
      if (radial < (large ? 0.68 : chip ? 0.55 : 0.5)) continue;
      const px = Math.cos(angle) * distance;
      const py = Math.sin(angle) * distance;
      const radius = chip ? random(4, 8) : (large ? 52 - radial * 22 : 27 - radial * 13) * random(0.78, 1.18);
      if (shards.some(shard => Math.hypot(px - shard.px, py - shard.py) < (radius + shard.radius) * 1.08 + 14))
        continue;
      const fadeDistance = distance / (boundary + (protruding ? 55 : 0));
      placement = { px, py, radius, fadeDistance };
      break;
    }
    if (!placement) continue;
    const { px, py, radius } = placement;
    // Silhouettes have a separate seed so refining a shape cannot move its
    // neighbors or change the clearances in the composition.
    const shape = createProfile(index, radius);
    let polygon = shape.polygon;
    const cx = (Math.min(...polygon.map(p => p.x)) + Math.max(...polygon.map(p => p.x))) / 2;
    const cy = (Math.min(...polygon.map(p => p.y)) + Math.max(...polygon.map(p => p.y))) / 2;
    const scale = radius / Math.max(...polygon.map(p => Math.hypot(p.x - cx, p.y - cy)));
    polygon = polygon.map(p => ({
      x: (p.x - cx) * scale + px + PANE_WIDTH / 2,
      y: (p.y - cy) * scale + PANE_HEIGHT / 2 - py
    }));
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
      profile: shape.profile,
      bevelSize: shape.bevelSize,
      bevelThickness: shape.bevelThickness,
      z: random(-35, 40),
      tiltX: edgeOn ? random(0.95, 1.2) * (random() < 0.5 ? -1 : 1) : random(-0.58, 0.58),
      tiltY: random(-0.62, 0.62),
      turn: random(-Math.PI, Math.PI)
    });
  }
  return shards;
};

export const SHARDS = createShards();
