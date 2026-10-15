import { fieldFor } from '../engine/masks';
import { isMaskLayer, maskKey, ratioOf } from './doc';

export const RAD = Math.PI / 180;

export const rotate = ([x, y], angle) => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [x * c - y * s, x * s + y * c];
};

export const wrapDegrees = value => ((((value + 180) % 360) + 360) % 360) - 180;

export const halfExtents = layer => {
  if (isMaskLayer(layer)) {
    const field = fieldFor(maskKey(layer));
    if (field) return [field.halfW, field.halfH];
    return [1, layer.type === 'text' ? 0.4 : 1];
  }
  return [1, 1];
};

const isRepeated = layer => Math.round(layer.repeat ?? 1) > 1;

export const seedFrame = (layer, mark) => {
  const spin = isRepeated(layer) ? (layer.spin ?? 0) * RAD : 0;
  const seed = rotate([layer.x ?? 0, layer.y ?? 0], spin);
  const markRot = (mark.rotation ?? 0) * RAD;
  const turned = rotate([seed[0] * mark.scale, seed[1] * mark.scale], markRot);
  return {
    center: [turned[0] + (mark.x ?? 0), turned[1] + (mark.y ?? 0)],
    angle: markRot + spin + (layer.rotation ?? 0) * RAD,
    scale: mark.scale * (layer.size ?? 1),
    spin,
    markRot
  };
};

export const positionFor = (layer, mark, center) => {
  const spin = isRepeated(layer) ? (layer.spin ?? 0) * RAD : 0;
  let p = [center[0] - (mark.x ?? 0), center[1] - (mark.y ?? 0)];
  p = rotate(p, -(mark.rotation ?? 0) * RAD);
  p = [p[0] / mark.scale, p[1] / mark.scale];
  p = rotate(p, -spin);
  return { x: Math.round(p[0] * 1000) / 1000, y: Math.round(p[1] * 1000) / 1000 };
};

export const toLayerSpace = (point, layer, mark, copy = 0) => {
  let p = [point[0] - (mark.x ?? 0), point[1] - (mark.y ?? 0)];
  p = rotate(p, -(mark.rotation ?? 0) * RAD);
  p = [p[0] / mark.scale, p[1] / mark.scale];
  if (layer.mirror) p[0] = Math.abs(p[0]);
  const count = Math.round(layer.repeat ?? 1);
  if (count > 1) {
    const sector = (Math.PI * 2) / count;
    let angle = Math.atan2(p[1], p[0]) - (layer.spin ?? 0) * RAD;
    angle = ((((angle + sector / 2) % sector) + sector) % sector) - sector / 2 + copy * sector;
    const length = Math.hypot(p[0], p[1]);
    p = [length * Math.cos(angle), length * Math.sin(angle)];
  }
  const local = rotate([p[0] - (layer.x ?? 0), p[1] - (layer.y ?? 0)], -(layer.rotation ?? 0) * RAD);
  return [local[0] / (layer.size ?? 1), local[1] / (layer.size ?? 1)];
};

const copyOffsets = layer => {
  const count = Math.round(layer.repeat ?? 1);
  if (count < 2) return [0];
  return count < 5 ? [0, -1, 1] : [0, -1, 1, -2, 2];
};

export const hitLayer = (point, mark) => {
  const layers = mark.layers.filter(layer => layer.visible !== false);
  for (let index = layers.length - 1; index >= 0; index--) {
    const layer = layers[index];
    const [hw, hh] = halfExtents(layer);
    const inside = copyOffsets(layer).some(copy => {
      const q = toLayerSpace(point, layer, mark, copy);
      return Math.abs(q[0]) <= hw * 1.02 && Math.abs(q[1]) <= hh * 1.02;
    });
    if (inside) return layer;
  }
  return null;
};

const CORNERS = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1]
];

function boxCorners(center, angle, half) {
  return CORNERS.map(([sx, sy]) => {
    const offset = rotate([sx * half[0], sy * half[1]], angle);
    return [center[0] + offset[0], center[1] + offset[1]];
  });
}

function boundsOf(points) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  points.forEach(([x, y]) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });
  return { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

export const seedBounds = (layer, mark) => {
  const frame = seedFrame(layer, mark);
  const [hw, hh] = halfExtents(layer);
  return boundsOf(boxCorners(frame.center, frame.angle, [hw * frame.scale, hh * frame.scale]));
};

export const layerBounds = (layer, mark) => {
  const count = Math.max(1, Math.round(layer.repeat ?? 1));
  const [hw, hh] = halfExtents(layer);
  const markRot = (mark.rotation ?? 0) * RAD;
  const spin = count > 1 ? (layer.spin ?? 0) * RAD : 0;
  const half = [hw * (layer.size ?? 1) * mark.scale, hh * (layer.size ?? 1) * mark.scale];
  const points = [];
  const mirrors = layer.mirror ? [1, -1] : [1];
  for (let copy = 0; copy < count; copy++) {
    const turn = spin + (copy * Math.PI * 2) / count;
    mirrors.forEach(side => {
      const seed = rotate([layer.x ?? 0, layer.y ?? 0], turn);
      const local = [seed[0] * side, seed[1]];
      const placed = rotate([local[0] * mark.scale, local[1] * mark.scale], markRot);
      const center = [placed[0] + (mark.x ?? 0), placed[1] + (mark.y ?? 0)];
      const angle =
        side > 0 ? markRot + turn + (layer.rotation ?? 0) * RAD : markRot - turn - (layer.rotation ?? 0) * RAD;
      points.push(...boxCorners(center, angle, half));
    });
  }
  return boundsOf(points);
};

export const unionBounds = list => {
  if (!list.length) return null;
  return boundsOf(
    list.flatMap(item => [
      [item.minX, item.minY],
      [item.maxX, item.maxY]
    ])
  );
};

export const artboardHalf = artboard => {
  const ratio = ratioOf(artboard);
  return ratio.w >= ratio.h ? [ratio.w / ratio.h, 1] : [1, ratio.h / ratio.w];
};

export const intersects = (a, b) => a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;

export const flipPatch = (layer, mark, axis, pivot) => {
  const frame = seedFrame(layer, mark);
  const base = (frame.markRot + frame.spin) / RAD;
  const rotation = axis === 'x' ? -(layer.rotation ?? 0) - 2 * base : 180 - (layer.rotation ?? 0) - 2 * base;
  const center = pivot
    ? axis === 'x'
      ? [2 * pivot[0] - frame.center[0], frame.center[1]]
      : [frame.center[0], 2 * pivot[1] - frame.center[1]]
    : frame.center;
  return {
    ...(pivot ? positionFor(layer, mark, center) : {}),
    flip: !layer.flip,
    rotation: Math.round(wrapDegrees(rotation) * 10) / 10
  };
};

export const snapAxis = (anchors, targets, threshold) => {
  let best = null;
  anchors.forEach(anchor => {
    targets.forEach(target => {
      const diff = target - anchor;
      if (Math.abs(diff) <= threshold && (!best || Math.abs(diff) < Math.abs(best.diff))) best = { diff, target };
    });
  });
  return best;
};

export const hitCopy = (point, layer, mark) => {
  let p = [point[0] - (mark.x ?? 0), point[1] - (mark.y ?? 0)];
  p = rotate(p, -(mark.rotation ?? 0) * RAD);
  const mirrored = Boolean(layer.mirror) && p[0] < 0;
  if (mirrored) p = [-p[0], p[1]];
  const count = Math.round(layer.repeat ?? 1);
  if (count < 2) return { copy: 0, mirrored };
  const sector = (Math.PI * 2) / count;
  const angle = Math.atan2(p[1], p[0]) - (layer.spin ?? 0) * RAD;
  const seedAngle = Math.atan2(layer.y ?? 0, layer.x ?? 0);
  return { copy: Math.round((angle - seedAngle) / sector), mirrored };
};

const copyTurn = (layer, hit) => {
  const count = Math.round(layer.repeat ?? 1);
  return count > 1 ? (hit.copy * Math.PI * 2) / count : 0;
};

export const copyFrame = (layer, mark, hit = { copy: 0, mirrored: false }) => {
  const count = Math.round(layer.repeat ?? 1);
  const spin = count > 1 ? (layer.spin ?? 0) * RAD : 0;
  const turn = spin + copyTurn(layer, hit);
  let seed = rotate([layer.x ?? 0, layer.y ?? 0], turn);
  const side = hit.mirrored ? -1 : 1;
  seed = [seed[0] * side, seed[1]];
  const markRot = (mark.rotation ?? 0) * RAD;
  const placed = rotate([seed[0] * mark.scale, seed[1] * mark.scale], markRot);
  const local = (turn + (layer.rotation ?? 0) * RAD) * side;
  return {
    center: [placed[0] + (mark.x ?? 0), placed[1] + (mark.y ?? 0)],
    angle: markRot + local,
    scale: mark.scale * (layer.size ?? 1)
  };
};

export const copyBounds = (layer, mark, hit) => {
  const frame = copyFrame(layer, mark, hit);
  const [hw, hh] = halfExtents(layer);
  return boundsOf(boxCorners(frame.center, frame.angle, [hw * frame.scale, hh * frame.scale]));
};

export const movedSeed = (layer, mark, origin, delta, hit = { copy: 0, mirrored: false }) => {
  let d = rotate(delta, -(mark.rotation ?? 0) * RAD);
  d = [d[0] / mark.scale, d[1] / mark.scale];
  if (hit.mirrored) d = [-d[0], d[1]];
  const count = Math.round(layer.repeat ?? 1);
  const spin = count > 1 ? (layer.spin ?? 0) * RAD : 0;
  d = rotate(d, -(spin + copyTurn(layer, hit)));
  return { x: Math.round((origin.x + d[0]) * 1000) / 1000, y: Math.round((origin.y + d[1]) * 1000) / 1000 };
};
