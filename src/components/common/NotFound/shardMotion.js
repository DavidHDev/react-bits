import { PANE_HEIGHT, PANE_WIDTH } from './shardGeometry.js';

const TAU = Math.PI * 2;

export const createShardMotion = (shard, index) => {
  let seed = Math.imul(index + 1, 2654435761) >>> 0;
  const random = (min, max) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return min + (seed / 4294967296) * (max - min);
  };
  const x = shard.x + shard.width / 2 - PANE_WIDTH / 2;
  const y = PANE_HEIGHT / 2 - shard.y - shard.height / 2;
  return {
    x,
    y,
    z: random(-4, 4),
    rx: (y - 65) * 0.00045 + random(-0.2, 0.2),
    ry: -x * 0.00045 + random(-0.24, 0.24),
    rz: random(-0.085, 0.085),
    phase: random(0, TAU),
    frequency: TAU / random(22, 36),
    axis: random(0, TAU),
    twist: random(-1, 1),
    responseX: random(0.65, 1.25),
    responseY: random(0.65, 1.25),
    reach: random(170, 260),
    stiffness: random(24, 52),
    damping: random(1, 1.12),
    offset: new Float64Array(6),
    velocity: new Float64Array(6),
    target: new Float64Array(6),
    pose: new Float64Array(6)
  };
};

export const stepShardMotion = (shard, time, pointer, dt) => {
  const dx = (pointer.x - shard.x) / shard.reach;
  const dy = (pointer.y - shard.y) / shard.reach;
  const proximity = pointer.active * (0.16 + 0.84 * Math.exp(-(dx * dx + dy * dy) * 0.5));
  // Each fragment has its own response axes and inertia. Nearby glass reacts
  // most; distant pieces drift gently, instead of rotating as a single sheet.
  const c = Math.cos(shard.axis);
  const s = Math.sin(shard.axis);
  const u = Math.tanh(dx * c + dy * s) * proximity;
  const v = Math.tanh(dy * c - dx * s) * proximity;
  const target = shard.target;
  target[0] = u * 2.2 * shard.responseX;
  target[1] = v * 2.2 * shard.responseY;
  target[2] = (u + v) * shard.twist * 2.2;
  target[3] = v * 0.12 * shard.responseX;
  target[4] = u * 0.14 * shard.responseY;
  target[5] = (u - v) * shard.twist * 0.018;
  const damping = 2 * Math.sqrt(shard.stiffness) * shard.damping;
  for (let axis = 0; axis < 6; axis++) {
    shard.velocity[axis] +=
      ((target[axis] - shard.offset[axis]) * shard.stiffness - shard.velocity[axis] * damping) * dt;
    shard.offset[axis] += shard.velocity[axis] * dt;
  }
  const wave = time * shard.frequency + shard.phase;
  const pose = shard.pose;
  pose[0] = shard.x + Math.sin(wave) * 1.4 + shard.offset[0];
  pose[1] = shard.y + Math.cos(wave * 0.83 + shard.axis) * 1.7 + shard.offset[1];
  pose[2] = shard.z + Math.sin(wave * 0.67) * 2.5 + shard.offset[2];
  pose[3] = shard.rx + Math.sin(wave * 0.9 + shard.axis) * 0.035 + shard.offset[3];
  pose[4] = shard.ry + Math.cos(wave * 0.8) * 0.04 + shard.offset[4];
  pose[5] = shard.rz + Math.sin(wave * 0.7) * 0.01 + shard.offset[5];
  return pose;
};
