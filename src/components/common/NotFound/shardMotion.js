import { PANE_HEIGHT, PANE_WIDTH } from './shardGeometry.js';

const TAU = Math.PI * 2;

export const createShardMotion = (shard, index) => {
  let seed = Math.imul(index + 1, 2654435761) >>> 0;
  const random = (min, max) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return min + (seed / 4294967296) * (max - min);
  };
  // Compensate the resting position for perspective so depth doesn't collapse
  // the independently scattered screen-space clearances.
  const perspective = 1 - shard.z / 1400;
  const x = (shard.x + shard.width / 2 - PANE_WIDTH / 2) * perspective;
  const y = (PANE_HEIGHT / 2 - shard.y - shard.height / 2) * perspective;
  return {
    x,
    y,
    z: shard.z,
    rx: shard.tiltX,
    ry: shard.tiltY,
    rz: shard.turn,
    mobility: Math.min(1, Math.sqrt(shard.width * shard.height) / 100),
    phase: random(0, TAU),
    frequency: TAU / random(22, 36),
    axis: random(0, TAU),
    twist: random(-1, 1),
    responseX: random(0.65, 1.25),
    responseY: random(0.65, 1.25),
    reach: random(125, 185),
    stiffness: random(40, 96),
    damping: random(0.95, 1.08),
    hoverAxis: random(0, TAU),
    hoverAngle: random(0.31, 0.42),
    lift: random(8, 16),
    offset: new Float64Array(6),
    velocity: new Float64Array(6),
    target: new Float64Array(6),
    pose: new Float64Array(6)
  };
};

export const stepShardMotion = (shard, time, pointer, dt) => {
  const dx = (pointer.x - shard.x) / shard.reach;
  const dy = (pointer.y - shard.y) / shard.reach;
  const distance = dx * dx + dy * dy;
  const proximity = pointer.active * Math.exp(-distance * 1.1);
  const center = Math.exp(-distance * 1.6);
  // Each fragment has its own response axes and inertia. Nearby glass reacts
  // most; distant pieces drift gently, instead of rotating as a single sheet.
  const c = Math.cos(shard.axis);
  const s = Math.sin(shard.axis);
  const u = Math.tanh(dx * c + dy * s);
  const v = Math.tanh(dy * c - dx * s);
  // A seeded lift and torque keep the response alive directly under the cursor.
  const drift = 4.2 + shard.mobility * 3.3;
  const tx = (u * 1.3 + c * center) * proximity * drift;
  const ty = (v * 1.3 + s * center) * proximity * drift;
  const translationLimit = Math.max(1, Math.hypot(tx, ty) / 8);
  const rx = (v * 0.75 * shard.responseX + Math.sin(shard.hoverAxis) * shard.hoverAngle * center) * proximity;
  const ry = (u * 0.75 * shard.responseY + Math.cos(shard.hoverAxis) * shard.hoverAngle * center) * proximity;
  const rotationLimit = Math.max(1, Math.hypot(rx, ry) / 0.46);
  const target = shard.target;
  target[0] = tx / translationLimit;
  target[1] = ty / translationLimit;
  target[2] = (shard.lift + (u - v) * shard.twist * 4) * proximity;
  target[3] = rx / rotationLimit;
  target[4] = ry / rotationLimit;
  target[5] = ((u - v) * 0.075 + center * 0.055) * shard.twist * proximity;
  const damping = 2 * Math.sqrt(shard.stiffness) * shard.damping;
  for (let axis = 0; axis < 6; axis++) {
    shard.velocity[axis] +=
      ((target[axis] - shard.offset[axis]) * shard.stiffness - shard.velocity[axis] * damping) * dt;
    shard.offset[axis] += shard.velocity[axis] * dt;
  }
  const wave = time * shard.frequency + shard.phase;
  const pose = shard.pose;
  pose[0] = shard.x + Math.sin(wave) * 1.4 * shard.mobility + shard.offset[0];
  pose[1] = shard.y + Math.cos(wave * 0.83 + shard.axis) * 1.7 * shard.mobility + shard.offset[1];
  pose[2] = shard.z + Math.sin(wave * 0.67) * 2.5 + shard.offset[2];
  pose[3] = shard.rx + Math.sin(wave * 0.9 + shard.axis) * 0.035 + shard.offset[3];
  pose[4] = shard.ry + Math.cos(wave * 0.8) * 0.04 + shard.offset[4];
  pose[5] = shard.rz + Math.sin(wave * 0.7) * 0.01 + shard.offset[5];
  return pose;
};
