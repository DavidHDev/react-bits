const random = seed => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

export const createShardIntro = (shard, index) => ({
  delay: 0.1 + (Math.hypot(shard.px, shard.py) / FIELD_RADIUS) * 0.12 + random(index + 1) * 0.18,
  duration: 1.05 + random(index + 17) * 0.32,
  depth: 210 + random(index + 29) * 130,
  rx: (random(index + 43) - 0.5) * 1.1,
  ry: (random(index + 61) - 0.5) * 1.3,
  rz: (random(index + 79) - 0.5) * 0.4
});

export const applyShardIntro = (pose, intro, time) => {
  const progress = Math.max(0, Math.min(1, (time - intro.delay) / intro.duration));
  const remaining = Math.pow(1 - progress, 3);
  const depth = intro.depth * remaining;
  // Follow the viewing ray while approaching: silhouettes settle at their own
  // positions, rather than crossing through neighboring pieces on the way in.
  const perspective = (1400 - pose[2] + depth) / (1400 - pose[2]);
  pose[0] *= perspective;
  pose[1] *= perspective;
  pose[2] -= depth;
  pose[3] += intro.rx * remaining;
  pose[4] += intro.ry * remaining;
  pose[5] += intro.rz * remaining;
};
import { FIELD_RADIUS } from './shardGeometry.js';
