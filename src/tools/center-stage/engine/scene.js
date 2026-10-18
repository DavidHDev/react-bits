import {
  DEG,
  add,
  chain,
  clamp,
  cross,
  dot,
  euler,
  invert,
  lerp,
  lookAt,
  multiply,
  normalize,
  perspective,
  scale,
  scaling,
  smoother,
  sub,
  transformPoint,
  translation
} from './math';
import { deviceLayout, mediaTransform } from './devices';
import { captionSpace } from './text';

export const ASPECTS = [
  { value: '16:9', label: '16:9', hint: 'Landscape', ratio: 16 / 9 },
  { value: '16:10', label: '16:10', hint: 'Laptop', ratio: 16 / 10 },
  { value: '4:3', label: '4:3', hint: 'Classic', ratio: 4 / 3 },
  { value: '1:1', label: '1:1', hint: 'Square', ratio: 1 },
  { value: '4:5', label: '4:5', hint: 'Portrait post', ratio: 4 / 5 },
  { value: '9:16', label: '9:16', hint: 'Story', ratio: 9 / 16 },
  { value: '1.91:1', label: '1.91:1', hint: 'Social card', ratio: 1.91 },
  { value: '21:9', label: '21:9', hint: 'Cinema', ratio: 21 / 9 }
];

export const aspectRatio = value => ASPECTS.find(item => item.value === value)?.ratio ?? 16 / 9;

export const DEFAULT_DOC = {
  version: 1,
  aspect: '16:9',
  devices: [{ type: 'browser', finish: 'dark', slot: 0 }],
  camera: { rx: 0, ry: 0, rz: 0, zoom: 1, fov: 28, x: 0, y: 0, pad: 0.14, target: null },
  depth: { amount: 0, focus: null },
  background: { kind: 'solid', colors: ['#0d0d10', '#1a1a1f', '#26262d', '#0d0d10'], angle: 90 },
  light: {
    angle: -24,
    height: 58,
    shadow: 0.55,
    softness: 0.55,
    receiver: 'backdrop',
    distance: 0.25,
    reflection: 0,
    glare: 0.05,
    tint: '#000000'
  },
  type: {
    text: '',
    font: 'Geist',
    weight: 640,
    size: 0.82,
    color: 'auto',
    opacity: 1,
    style: 'fill',
    position: 'behind',
    depth: 0.45,
    tracking: -0.05,
    leading: 0.92,
    lock: false
  },
  caption: { title: '', subtitle: '', position: 'top', align: 'center', color: 'auto', size: 1 },
  motion: { kind: 'none', duration: 6, intensity: 0.5 },
  finish: { grain: 0.12, vignette: 0.18 }
};

const merge = (base, patch) => {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return patch === undefined ? base : patch;
  const out = { ...base };
  Object.keys(patch).forEach(key => {
    const value = patch[key];
    out[key] =
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      base?.[key] &&
      typeof base[key] === 'object' &&
      !Array.isArray(base[key])
        ? merge(base[key], value)
        : value;
  });
  return out;
};

export const normalizeDoc = doc => {
  const out = merge(DEFAULT_DOC, doc || {});
  out.devices = (out.devices?.length ? out.devices : DEFAULT_DOC.devices).map(device => ({
    slot: 0,
    x: 0,
    y: 0,
    z: 0,
    rx: 0,
    ry: 0,
    rz: 0,
    scale: 1,
    ...device
  }));
  return out;
};

const TAU = Math.PI * 2;
const span = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
const wave = p => 0.5 - 0.5 * Math.cos(p * TAU);
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeOutBack = t => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
const easeOutQuint = t => 1 - Math.pow(1 - t, 5);
const easeInOutQuint = t => (t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2);
const stepped = (p, n, hold) => {
  const s = p * n;
  const i = Math.floor(s);
  return i + easeInOut(clamp((s - i - hold) / (1 - hold), 0, 1));
};
const stagger = (i, n, total) => (n > 1 ? (i / (n - 1)) * total : 0);
const wrapRel = (value, n) => ((((value + n / 2) % n) + n) % n) - n / 2;
const lidOpen = o => ({ open: o, wake: span(o, 0.45, 0.95) });
const spinGroup = (axis, angle) => (axis === 'x' ? { rx: angle } : axis === 'z' ? { rz: -angle } : { ry: -angle });

const MOTIONS = {
  none: () => ({}),
  drift: (p, k) => ({
    ry: Math.sin(p * TAU) * 7 * k,
    rx: Math.cos(p * TAU) * 3.2 * k,
    zoom: 1 + Math.sin(p * TAU + 1.1) * 0.025 * k
  }),
  orbit: (p, k) => ({ ry: Math.sin(p * TAU) * 22 * k, rx: Math.sin(p * Math.PI * 4) * 2 * k }),
  push: (p, k) => {
    const e = smoother(wave(p));
    return { zoom: 1 + 0.22 * k * e, ry: -3 * k * e };
  },
  pan: (p, k) => {
    const e = Math.sin(p * TAU);
    return { x: e * 0.19 * k, ry: -e * 4 * k };
  },
  rack: (p, k) => ({ rack: smoother(wave(p)), ry: Math.sin(p * TAU) * 2 * k }),
  scroll: (p, k) => ({ scroll: smoother(wave(p)), ry: Math.sin(p * TAU) * 3 * k }),
  float: (p, k) => ({ float: p, floatAmount: k, ry: Math.sin(p * TAU) * 3 * k }),
  reveal: (p, k) => {
    const e = smoother(clamp(p / 0.7, 0, 1));
    return { rx: (1 - e) * 26 * k, ry: (1 - e) * -14 * k, zoom: lerp(0.86, 1, e), revealT: e };
  },
  turntable: (p, k) => ({ spin: p * 360, rx: Math.sin(p * TAU) * 1.5 * k }),
  sway: (p, k) => ({
    spin: Math.sin(p * TAU) * 16 * k,
    ry: Math.sin(p * TAU + 0.5) * 2.5 * k,
    float: p,
    floatAmount: k * 0.4
  }),
  flip: p => {
    const turn = t => smoother(clamp(t, 0, 1));
    const spin = p < 0.5 ? turn((p - 0.12) / 0.3) * 180 : 180 + turn((p - 0.62) / 0.3) * 180;
    return { spin, float: p, floatAmount: 0.3 };
  },
  crane: (p, k) => {
    const e = smoother(wave(p));
    return { rx: e * 12 * k, ry: Math.sin(p * TAU) * 5 * k, zoom: 1 - 0.05 * k * e };
  },
  dolly: (p, k) => {
    const e = smoother(wave(p));
    const push = 1 + 1.3 * k * e;
    return { zoom: push, fovScale: push / (1 + 0.24 * k * e), ry: Math.sin(p * TAU) * 2 * k };
  },
  spiral: (p, k) => ({
    ry: Math.sin(p * TAU) * 20 * k,
    rx: Math.cos(p * TAU) * 5 * k,
    rz: Math.sin(p * TAU + 1) * 2.5 * k,
    zoom: 1 + 0.06 * k * wave(p)
  }),
  rise: (p, k) => {
    const e = smoother(clamp(p / 0.75, 0, 1));
    return { lift: (1 - e) * -0.9 * k, tilt: (1 - e) * 24 * k, zoom: lerp(0.94, 1, e) };
  },
  present: (p, k) => {
    const t = easeInOut(span(p, 0, 0.8));
    return { spin: (1 - t) * 64 * k, rx: (1 - t) * 6 * k, zoom: lerp(0.86, 1, t) };
  },
  'flip-reveal': (p, k) => {
    const t = easeInOut(span(p, 0.08, 0.62));
    return { spin: 180 + t * 180, zoom: lerp(0.9, 1, easeOut(span(p, 0, 0.8))), ry: (1 - t) * -6 * k };
  },
  wake: (p, k) => {
    const on = easeInOut(span(p, 0.12, 0.5));
    return { zoom: 1 + 0.07 * k * easeOut(p), each: () => ({ wake: on }) };
  },
  unfold: (p, k) => {
    const o = easeInOut(span(p, 0.08, 0.62));
    const c = easeInOut(span(p, 0, 0.75));
    return { rx: (1 - c) * 16 * k, ry: (1 - c) * -6 * k, zoom: lerp(0.9, 1, c), each: () => lidOpen(o) };
  },
  'unfold-zoom': (p, k) => {
    const o = easeInOut(span(p, 0.04, 0.3));
    const c = easeInOut(span(p, 0, 0.34));
    return {
      rx: (1 - c) * 12 * k,
      zoom: lerp(0.92, 1, c),
      screen: easeInOut(span(p, 0.34, 0.58)),
      scroll: easeInOut(span(p, 0.62, 0.96)),
      each: () => lidOpen(o)
    };
  },
  'unfold-spin': (p, k) => {
    const o = easeInOut(span(p, 0.04, 0.4));
    const t = easeInOut(span(p, 0.28, 0.94));
    return {
      spin: t * 360,
      rx: Math.sin(t * Math.PI) * 5 * k,
      zoom: lerp(0.93, 1, easeInOut(span(p, 0, 0.45))),
      each: () => lidOpen(o)
    };
  },
  'zoom-scroll': (p, k) => ({
    screen: easeInOut(span(p, 0.06, 0.36)),
    scroll: easeInOut(span(p, 0.4, 0.94)),
    ry: Math.sin(p * Math.PI) * 2 * k
  }),
  drop: (p, k) => ({
    each: (i, n, device, size) => {
      const d = stagger(i, n, 0.26);
      const t = span(p, d, d + 0.62);
      const e = easeOutQuint(t);
      return {
        y: (1 - e) * size * 1.05 * k,
        roll: (1 - e) * (i % 2 ? 4 : -4) * k,
        opacity: easeOut(span(t, 0, 0.3))
      };
    }
  }),
  'drop-open': (p, k) => ({
    zoom: lerp(0.95, 1, easeInOut(span(p, 0, 0.7))),
    each: (i, n, device, size) => {
      const d = stagger(i, n, 0.16);
      const t = span(p, d, d + 0.44);
      const e = easeOutQuint(t);
      return {
        y: (1 - e) * size * 0.85 * k,
        roll: (1 - e) * 3 * k,
        opacity: easeOut(span(t, 0, 0.3)),
        ...lidOpen(easeInOut(span(p, 0.3, 0.86)))
      };
    }
  }),
  'fly-in': (p, k) => ({
    each: (i, n, device, size) => {
      const d = stagger(i, n, 0.3);
      const t = span(p, d, d + 0.62);
      const e = easeOutQuint(t);
      const side = (device.x || 0) < -0.01 ? -1 : (device.x || 0) > 0.01 ? 1 : i % 2 ? 1 : -1;
      return {
        z: (1 - e) * size * 0.75 * k,
        y: -(1 - e) * size * 0.2 * k,
        tilt: (1 - e) * 16 * k,
        spin: (1 - e) * 8 * side * k,
        opacity: easeOut(span(t, 0, 0.32))
      };
    }
  }),
  pop: p => ({
    each: (i, n) => {
      const d = stagger(i, n, 0.42);
      const t = span(p, d, d + 0.42);
      return { scale: lerp(0.4, 1, easeOutBack(t)), opacity: easeOut(span(t, 0, 0.35)) };
    }
  }),
  assemble: p => ({
    each: (i, n, device) => {
      const d = stagger(i, n, 0.18);
      const t = 1 - easeInOutQuint(span(p, d, d + 0.66));
      return {
        x: -t * (device.x || 0),
        y: -t * (device.y || 0),
        z: -t * i * 0.012,
        tilt: -t * (device.rx || 0) * 0.6,
        spin: -t * (device.ry || 0),
        roll: -t * (device.rz || 0)
      };
    }
  }),
  spread: (p, k) => ({
    ry: Math.sin(p * TAU) * 3 * k,
    each: (i, n, device, size) => {
      const reach = Math.hypot(device.x || 0, device.y || 0);
      const t = easeInOutQuint(wave(p)) * 0.86;
      return {
        x: -t * (device.x || 0),
        y: -t * (device.y || 0),
        z: -t * (reach / Math.max(size, 1e-3)) * 0.12,
        spin: -t * (device.ry || 0),
        roll: -t * (device.rz || 0)
      };
    }
  }),
  carousel: (p, k, n, motion) => ({ group: spinGroup(motion.axis, p * 360) }),
  'carousel-step': (p, k, n, motion) => {
    const steps = Math.max(1, Math.round(motion.steps ?? n));
    return { group: spinGroup(motion.axis, (360 / steps) * stepped(p, steps, 0.45)) };
  },
  coverflow: (p, k, n, motion) => {
    const vertical = motion.axis === 'y';
    return {
      each: (i, count, device, size, layout) => {
        const s = stepped(p, count, 0.5);
        const rel = wrapRel(i - s, count);
        const a = Math.abs(rel);
        const side = Math.sign(rel);
        const w = (vertical ? layout.body.h : layout.body.w) * (device.scale || 1);
        const along = side * (Math.min(a, 1) * 0.8 * w + Math.max(a - 1, 0) * 0.3 * w);
        const z = -Math.min(a, 1) * 0.85 * w - Math.max(a - 1, 0) * 0.12 * w;
        const turn = Math.min(a, 1) * 64 * side;
        const opacity = smoother(clamp(count / 2 - a, 0, 1));
        return vertical
          ? { y: -along - (device.y || 0), z: z - (device.z || 0), tilt: -turn, opacity }
          : { x: along - (device.x || 0), z: z - (device.z || 0), spin: -turn, opacity };
      }
    };
  },
  shuffle: p => ({
    each: (i, n, device, size, layout) => {
      const s = p * n;
      const j = Math.floor(s);
      const f = clamp((s - j - 0.18) / 0.82, 0, 1);
      const k0 = (((i - j) % n) + n) % n;
      const w = layout.body.w * (device.scale || 1);
      const h = layout.body.h * (device.scale || 1);
      const depth = Math.min(w, h) * 0.16;
      let slot = k0 - easeInOut(span(f, 0.3, 0.76));
      let x = 0;
      let roll = 0;
      if (k0 === 0) {
        const side = i % 2 ? -1 : 1;
        const out = easeInOut(span(f, 0, 0.38));
        const back = easeInOut(span(f, 0.3, 0.7));
        const home = easeInOut(span(f, 0.62, 1));
        x = (out - home) * w * 1.16 * side;
        slot = back * (n - 1);
        roll = Math.sin(Math.PI * f) * -5 * side;
      }
      return {
        x,
        y: slot * h * 0.05,
        z: -slot * depth,
        scale: 1 - slot * 0.04,
        roll
      };
    }
  }),
  fan: (p, k) => ({
    each: (i, n, device, size, layout) => {
      const spread = lerp(3, 13, easeInOut(wave(p))) * k;
      const angle = (i - (n - 1) / 2) * spread * (Math.PI / 180);
      const radius = layout.body.h * (device.scale || 1) * 1.6;
      return {
        x: Math.sin(angle) * radius - (device.x || 0),
        y: Math.cos(angle) * radius - radius - (device.y || 0),
        z: i * 0.035 - (device.z || 0),
        roll: (-angle * 180) / Math.PI - (device.rz || 0)
      };
    }
  }),
  wave: (p, k, n, motion) => ({
    each: (i, count, device, size) => {
      const vertical = motion.axis === 'y';
      const phase = (device.x || 0) * 0.08 + (vertical ? device.z || 0 : device.y || 0) * 0.05;
      const t = (p - phase) * TAU;
      const amount = Math.sin(t) * size * 0.16 * k;
      return vertical ? { y: amount * 0.7, tilt: Math.cos(t) * 4 * k } : { z: amount, tilt: Math.cos(t) * 5 * k };
    }
  }),
  flow: (p, k) => ({ ry: Math.sin(p * TAU) * 2 * k })
};

const satellite = (p, i, n, device) => {
  const orbit = device.orbit;
  if (!orbit) return null;
  const angle = ((orbit.phase ?? (i / Math.max(n, 1)) * 360) + p * 360 * (orbit.speed ?? 1)) * DEG;
  const radius = orbit.radius ?? 2.4;
  return {
    x: Math.sin(angle) * radius - (device.x || 0),
    z: Math.cos(angle) * radius - (device.z || 0),
    y: (orbit.y ?? 0) + Math.sin(angle * 2) * (orbit.bob ?? 0) - (device.y || 0)
  };
};

MOTIONS.satellites = (p, k) => ({
  ry: Math.sin(p * TAU) * 3 * k,
  each: (i, n, device) => satellite(p, i, n, device)
});

export const MOTION_GROUPS = [
  { id: 'camera', label: 'Camera' },
  { id: 'device', label: 'Device' },
  { id: 'intro', label: 'Intro' },
  { id: 'screen', label: 'Screen' },
  { id: 'group', label: 'Group' }
];

export const MOTION_KINDS = [
  { value: 'none', label: 'Still', group: 'camera' },
  { value: 'drift', label: 'Drift', group: 'camera' },
  { value: 'orbit', label: 'Orbit', group: 'camera' },
  { value: 'push', label: 'Push in', group: 'camera' },
  { value: 'pan', label: 'Glide', group: 'camera' },
  { value: 'crane', label: 'Crane', group: 'camera' },
  { value: 'dolly', label: 'Dolly zoom', group: 'camera' },
  { value: 'spiral', label: 'Spiral', group: 'camera' },
  { value: 'rack', label: 'Focus pull', group: 'camera' },
  { value: 'float', label: 'Float', group: 'device' },
  { value: 'sway', label: 'Sway', group: 'device' },
  { value: 'turntable', label: 'Turntable', group: 'device' },
  { value: 'flip', label: 'Flip', group: 'device' },
  { value: 'present', label: 'Present', group: 'intro' },
  { value: 'reveal', label: 'Reveal', group: 'intro' },
  { value: 'rise', label: 'Rise', group: 'intro' },
  { value: 'flip-reveal', label: 'Flip reveal', group: 'intro' },
  { value: 'drop', label: 'Drop', group: 'intro' },
  { value: 'drop-open', label: 'Land and open', group: 'intro' },
  { value: 'fly-in', label: 'Fly in', group: 'intro' },
  { value: 'pop', label: 'Pop', group: 'intro' },
  { value: 'assemble', label: 'Assemble', group: 'intro' },
  { value: 'scroll', label: 'Scroll', group: 'screen' },
  { value: 'zoom-scroll', label: 'Zoom and scroll', group: 'screen' },
  { value: 'wake', label: 'Screen on', group: 'screen' },
  { value: 'unfold', label: 'Open lid', group: 'screen' },
  { value: 'unfold-zoom', label: 'Open and zoom', group: 'screen' },
  { value: 'unfold-spin', label: 'Open and spin', group: 'screen' },
  { value: 'carousel', label: 'Carousel', group: 'group' },
  { value: 'carousel-step', label: 'Carousel steps', group: 'group' },
  { value: 'coverflow', label: 'Cover flow', group: 'group' },
  { value: 'flow', label: 'Flow', group: 'group' },
  { value: 'shuffle', label: 'Shuffle', group: 'group' },
  { value: 'fan', label: 'Fan', group: 'group' },
  { value: 'spread', label: 'Spread', group: 'group' },
  { value: 'satellites', label: 'Satellites', group: 'group' },
  { value: 'wave', label: 'Wave', group: 'group' }
];

const ONE_SHOT = new Set([
  'reveal',
  'rise',
  'present',
  'flip-reveal',
  'wake',
  'unfold',
  'unfold-zoom',
  'unfold-spin',
  'zoom-scroll',
  'drop',
  'drop-open',
  'fly-in',
  'pop',
  'assemble'
]);

export const isLooping = kind => !ONE_SHOT.has(kind);

export const posterTime = (doc, poster) => {
  const duration = Math.max(0.5, doc.motion?.duration || 6);
  if (poster !== undefined && poster !== null) return poster * duration;
  return isLooping(doc.motion?.kind) ? 0 : duration;
};

export const loopPhase = (doc, time) => {
  const duration = Math.max(0.5, doc.motion?.duration || 6);
  return (((time / duration) % 1) + 1) % 1;
};

export function evalMotion(doc, time) {
  const motion = doc.motion || {};
  const kind = motion.kind || 'none';
  if (kind === 'none') return {};
  const duration = Math.max(0.5, motion.duration || 6);
  const p = isLooping(kind) ? loopPhase(doc, time) : clamp(time / duration, 0, 1);
  return (MOTIONS[kind] || MOTIONS.none)(p, clamp(motion.intensity ?? 0.5, 0, 1) * 2, doc.devices?.length || 1, motion);
}

const deviceTransform = (device, offsets) => {
  const s = (device.scale || 1) * (offsets?.scale ?? 1);
  return chain(
    translation(
      (device.x || 0) + (offsets?.x || 0),
      (device.y || 0) + (offsets?.bob || 0) + (offsets?.lift || 0) + (offsets?.y || 0),
      (device.z || 0) + (offsets?.z || 0)
    ),
    euler(
      (device.rx || 0) + (offsets?.tilt || 0),
      (device.ry || 0) + (offsets?.spin || 0),
      (device.rz || 0) + (offsets?.roll || 0)
    ),
    scaling(s)
  );
};

const ADDED = ['x', 'y', 'z', 'tilt', 'spin', 'roll'];

const mergeOffsets = (offsets, extra) => {
  if (!extra) return offsets;
  ADDED.forEach(key => {
    if (extra[key]) offsets[key] = (offsets[key] || 0) + extra[key];
  });
  if (extra.scale !== undefined) offsets.scale = (offsets.scale ?? 1) * extra.scale;
  if (extra.opacity !== undefined) offsets.opacity = (offsets.opacity ?? 1) * extra.opacity;
  if (extra.open !== undefined) offsets.open = extra.open;
  if (extra.wake !== undefined) offsets.wake = extra.wake;
  return offsets;
};

function laneShifts(doc, phase) {
  const motion = doc.motion || {};
  const mode = motion.kind === 'flow' ? 'flow' : motion.shift;
  if (!mode || mode === 'off') return null;
  const axis = motion.axis || 'x';
  const lanes = new Map();
  doc.devices.forEach((device, index) => {
    if (device.lane === undefined || device.lane === null) return;
    if (!lanes.has(device.lane)) lanes.set(device.lane, []);
    lanes.get(device.lane).push(index);
  });
  if (!lanes.size) return null;
  const out = new Map();
  lanes.forEach((indices, lane) => {
    const values = indices.map(index => doc.devices[index][axis] || 0).sort((a, b) => a - b);
    const first = doc.devices[indices[0]];
    let spacing = first.laneSpacing;
    if (!spacing) {
      const gaps = [];
      for (let i = 1; i < values.length; i += 1)
        if (values[i] - values[i - 1] > 1e-4) gaps.push(values[i] - values[i - 1]);
      gaps.sort((a, b) => a - b);
      spacing = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 1;
    }
    const dir = first.laneDir ?? (lane % 2 ? 1 : -1);
    if (mode === 'sway') {
      const amount = clamp(motion.shiftAmount ?? 0.5, 0, 1.5);
      const delta = dir * Math.sin(phase * TAU) * amount * spacing;
      indices.forEach(index => out.set(index, { delta, fade: 1 }));
      return;
    }
    const unique = new Set(values.map(value => Math.round(value / (spacing * 0.25))));
    const length = unique.size * spacing;
    const start = values[0] - spacing / 2;
    const speed = Math.max(1, Math.round(motion.laneSpeed ?? 1));
    indices.forEach(index => {
      const base = doc.devices[index][axis] || 0;
      const moved = base + dir * phase * length * speed;
      const wrapped = start + ((((moved - start) % length) + length) % length);
      const edge = Math.min(wrapped - start, start + length - wrapped) / spacing;
      out.set(index, { delta: wrapped - base, fade: motion.fade ? smoother(clamp(edge / 0.9, 0, 1)) : 1 });
    });
  });
  return { axis, out };
}

export function laptopParts(layout) {
  const { body, base, open, hinge } = layout;
  const lid = chain(
    translation(0, hinge.y, hinge.z),
    euler(-(open - 90), 0, 0),
    translation(0, body.h / 2 + hinge.gap, body.thickness / 2 - hinge.inset)
  );
  const deck = chain(translation(0, -base.thickness / 2, base.h / 2), euler(-90, 0, 0));
  const axis = translation(0, hinge.y, hinge.z);
  return { lid, deck, axis };
}

export function deviceBounds(layout) {
  const corners = [];
  const box = (m, w, h, t) => {
    for (const x of [-w / 2, w / 2])
      for (const y of [-h / 2, h / 2]) for (const z of [-t / 2, t / 2]) corners.push(transformPoint(m, [x, y, z]));
  };
  if (layout.type === 'laptop') {
    const { lid, deck } = laptopParts(layout);
    box(lid, layout.body.w, layout.body.h, layout.body.thickness);
    box(deck, layout.base.w, layout.base.h, layout.base.thickness);
  } else if (layout.type === 'monitor') {
    const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    box(I, layout.body.w, layout.body.h, layout.body.thickness);
    const sb = layout.standBounds;
    for (const x of [-sb.width / 2, sb.width / 2]) for (const z of [sb.back, sb.front]) corners.push([x, sb.floor, z]);
  } else {
    box([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], layout.body.w, layout.body.h, layout.body.thickness);
    if (layout.back) {
      const z = -layout.body.thickness / 2 - layout.back;
      const top = layout.body.h / 2;
      const bottom = top - layout.body.h * 0.28;
      for (const x of [-layout.body.w / 2, layout.body.w / 2]) for (const y of [bottom, top]) corners.push([x, y, z]);
    }
  }
  return corners;
}

const screenModel = layout =>
  layout.type === 'laptop' ? laptopParts(layout).lid : [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

export function screenPoint(layout, model, u, v) {
  const { body, screen } = layout;
  const x = screen.x + screen.w * u - body.w / 2;
  const y = body.h / 2 - (screen.y + screen.h * v);
  return transformPoint(multiply(model, screenModel(layout)), [x, y, body.thickness / 2]);
}

export function cameraBasis(rx, ry, rz) {
  const w = [Math.sin(ry * DEG) * Math.cos(rx * DEG), Math.sin(rx * DEG), Math.cos(ry * DEG) * Math.cos(rx * DEG)];
  const up0 = Math.abs(w[1]) > 0.999 ? [0, 0, -1] : [0, 1, 0];
  const u0 = normalize(cross(up0, w));
  const v0 = cross(w, u0);
  const c = Math.cos(rz * DEG);
  const s = Math.sin(rz * DEG);
  const u = normalize(add(scale(u0, c), scale(v0, s)));
  const v = normalize(add(scale(u0, -s), scale(v0, c)));
  return { u, v, w };
}

function fit(points, target, basis, tanX, tanYFull, pad, space = { top: 0, bottom: 0 }) {
  const s = Math.max(0.1, 1 - pad);
  const room = Math.max(0.2, 1 - space.top - space.bottom);
  const tanY = tanYFull * room;
  const shift = space.bottom - space.top;
  let t = target;
  let distance = 1;
  for (let pass = 0; pass < 4; pass += 1) {
    distance = 0.01;
    points.forEach(p => {
      const d = sub(p, t);
      const xc = dot(d, basis.u);
      const yc = dot(d, basis.v);
      const zw = dot(d, basis.w);
      distance = Math.max(distance, zw + Math.abs(xc) / (s * tanX), zw + Math.abs(yc) / (s * tanY));
    });
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    points.forEach(p => {
      const d = sub(p, t);
      const depth = distance - dot(d, basis.w);
      const x = dot(d, basis.u) / (depth * tanX);
      const y = dot(d, basis.v) / (depth * tanY);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    if (Math.abs(cx) < 1e-4 && Math.abs(cy) < 1e-4) break;
    t = add(t, add(scale(basis.u, cx * distance * tanX), scale(basis.v, cy * distance * tanY)));
  }
  if (shift) t = add(t, scale(basis.v, -shift * distance * tanYFull));
  return { target: t, distance };
}

const isMobileMedia = (item, index) => (item.role ? item.role === 'mobile' : index === 1);

const PHONE_SHAPES = new Set(['9:19.5', '9:16']);

export const surfaceRole = device =>
  device.type === 'phone' ||
  (device.type === 'tablet' && device.orientation === 'portrait') ||
  (device.type === 'card' && PHONE_SHAPES.has(device.viewport))
    ? 'mobile'
    : 'desktop';

export function slotFor(device, media) {
  if (!media?.length || device.blank) return null;
  const picking = device.pick !== undefined && device.pick !== null;
  const wanted = device.slot ?? 0;
  if (!picking && media[wanted]) return wanted;
  const mobile = surfaceRole(device) === 'mobile';
  const filled = [];
  const matching = [];
  media.forEach((item, index) => {
    if (!item) return;
    filled.push(index);
    if (isMobileMedia(item, index) === mobile) matching.push(index);
  });
  const samples = matching.filter(index => media[index].sample);
  const pool = samples.length ? samples : matching.length ? matching : filled;
  if (!pool.length) return null;
  return pool[(picking ? device.pick : wanted) % pool.length];
}

export function buildScene(input, media, { width, height, time = 0, preview = false } = {}) {
  const doc = normalizeDoc(input);
  const motion = evalMotion(doc, time);
  const aspect = width / height;
  const cam = doc.camera;
  const rx = (cam.rx || 0) + (motion.rx || 0);
  const ry = (cam.ry || 0) + (motion.ry || 0);
  const rz = (cam.rz || 0) + (motion.rz || 0);
  const zoom = Math.max(0.2, (cam.zoom || 1) * (motion.zoom || 1));
  const baseFov = clamp(cam.fov || 28, 8, 75) * DEG;
  const fitTanY = Math.tan(baseFov / 2);
  const fitTanX = fitTanY * aspect;
  const fov = Math.min(2 * Math.atan(fitTanY * (motion.fovScale || 1)), 120 * DEG);
  const tanY = Math.tan(fov / 2);
  const tanX = tanY * aspect;
  const restBasis = cameraBasis(cam.rx || 0, cam.ry || 0, cam.rz || 0);
  let basis = cameraBasis(rx, ry, rz);

  const count = doc.devices.length;
  const lanes = laneShifts(doc, loopPhase(doc, time));
  const group = motion.group
    ? chain(
        translation(motion.group.x || 0, motion.group.y || 0, motion.group.z || 0),
        euler(motion.group.rx || 0, motion.group.ry || 0, motion.group.rz || 0)
      )
    : null;

  const devices = doc.devices.map((device, index) => {
    const slotIndex = slotFor(device, media);
    const slot = slotIndex === null ? null : media[slotIndex];
    const mediaAspect = slot ? slot.width / slot.height : null;
    const layout = deviceLayout(device, mediaAspect);
    const size = Math.max(layout.body.w, layout.body.h) * (device.scale || 1);
    const offsets = {};
    if (motion.float !== undefined) {
      const phase = index * 1.7;
      offsets.bob =
        Math.sin(motion.float * Math.PI * 2 + phase) * 0.045 * (motion.floatAmount || 1) * (device.scale || 1);
      offsets.roll = Math.sin(motion.float * Math.PI * 2 + phase + 0.8) * 0.8 * (motion.floatAmount || 1);
    }
    if (motion.spin) offsets.spin = motion.spin;
    if (motion.tilt) offsets.tilt = motion.tilt;
    if (motion.lift) offsets.lift = motion.lift * Math.max(layout.body.w, layout.body.h) * (device.scale || 1);
    if (motion.each) mergeOffsets(offsets, motion.each(index, count, device, size, layout));
    const lane = lanes?.out.get(index);
    if (lane) {
      offsets[lanes.axis] = (offsets[lanes.axis] || 0) + lane.delta;
      if (lane.fade < 1) offsets.opacity = (offsets.opacity ?? 1) * lane.fade;
    }
    const local = deviceTransform(device, offsets);
    const model = group ? multiply(group, local) : local;
    const restModel = deviceTransform(device, null);
    const live =
      offsets.open !== undefined && layout.type === 'laptop'
        ? { ...layout, open: lerp(0, layout.open, clamp(offsets.open, 0, 1)) }
        : layout;
    const contentAspect = layout.contentAspect ?? layout.screenAspect;
    const tall = mediaAspect && mediaAspect < contentAspect;
    const scroll =
      motion.scroll !== undefined && tall
        ? lerp(device.scroll ?? 0, device.scrollTo ?? 1, motion.scroll)
        : (device.scroll ?? null);
    const xform = mediaTransform(contentAspect, mediaAspect, {
      fit: device.fit || 'cover',
      alignX: device.alignX ?? 0.5,
      alignY: device.alignY ?? 0,
      scroll
    });
    return {
      index,
      device,
      layout: live,
      restLayout: layout,
      model,
      restModel,
      slot: slot ? slotIndex : null,
      mediaXform: xform,
      crop: device.crop || [0, 0, 1, 1],
      wake: clamp(offsets.wake ?? 1, 0, 1),
      opacity: clamp((device.opacity ?? 1) * (offsets.opacity ?? 1), 0, 1),
      size
    };
  });

  const points = [];
  devices.forEach(item => {
    deviceBounds(item.restLayout).forEach(p => points.push(transformPoint(item.restModel, p)));
  });
  let center = points.reduce((acc, p) => add(acc, p), [0, 0, 0]).map(v => v / Math.max(1, points.length));
  let fitPoints = points.slice();
  if (cam.frame) {
    const [fw, fh] = cam.frame;
    const [fx, fy, fz] = cam.frameCenter || [0, 0, 0];
    fitPoints = cam.frameFlat
      ? [
          [fx - fw / 2, fy, fz - fh / 2],
          [fx + fw / 2, fy, fz - fh / 2],
          [fx - fw / 2, fy, fz + fh / 2],
          [fx + fw / 2, fy, fz + fh / 2]
        ]
      : [
          [fx - fw / 2, fy - fh / 2, fz],
          [fx + fw / 2, fy - fh / 2, fz],
          [fx - fw / 2, fy + fh / 2, fz],
          [fx + fw / 2, fy + fh / 2, fz]
        ];
    center = [fx, fy, fz];
  } else if (
    (doc.light?.reflection ?? 0) > 0.001 &&
    (doc.light?.receiver === 'floor' || doc.background?.kind === 'studio')
  ) {
    const bottom = Math.min(...points.map(p => p[1]));
    const top = Math.max(...points.map(p => p[1]));
    const reach = (top - bottom) * 0.3;
    points.forEach(p => {
      if (p[1] < bottom + reach) fitPoints.push([p[0], bottom - (p[1] - bottom) - reach * 0.15, p[2]]);
    });
  }
  const space = captionSpace(doc.caption, height, width);
  const fitted = fit(fitPoints, center, restBasis, fitTanX, fitTanY, cam.pad ?? 0.14, space);

  let target = fitted.target;
  let distance = fitted.distance / zoom;
  if (cam.target && devices[cam.target.device ?? 0]) {
    const item = devices[cam.target.device ?? 0];
    const pan = motion.x || 0;
    target = screenPoint(
      item.layout,
      item.model,
      clamp((cam.target.u ?? 0.5) + pan, 0, 1),
      clamp(cam.target.v ?? 0.5, 0, 1)
    );
  } else if (motion.x) {
    target = add(target, scale(basis.u, motion.x * distance * tanX));
  }
  target = add(
    target,
    add(scale(basis.u, -(cam.x || 0) * distance * tanX * 2), scale(basis.v, -(cam.y || 0) * distance * tanY * 2))
  );
  const screenT = clamp(motion.screen ?? 0, 0, 1);
  if (screenT > 0) {
    const item = devices[clamp(cam.screenDevice ?? 0, 0, devices.length - 1)];
    const tl = screenPoint(item.layout, item.model, 0, 0);
    const tr = screenPoint(item.layout, item.model, 1, 0);
    const bl = screenPoint(item.layout, item.model, 0, 1);
    const right = sub(tr, tl);
    const down = sub(bl, tl);
    const middle = add(tl, scale(add(right, down), 0.5));
    const up = normalize(scale(down, -1));
    const normal = normalize(cross(right, up));
    const halfW = Math.hypot(...right) / 2;
    const halfH = Math.hypot(...down) / 2;
    const close = Math.max(halfW / tanX, halfH / tanY) * (cam.screenMargin ?? 1.1);
    const w = normalize(add(scale(basis.w, 1 - screenT), scale(normal, screenT)));
    let v = normalize(add(scale(basis.v, 1 - screenT), scale(up, screenT)));
    const u = normalize(cross(v, w));
    v = cross(w, u);
    basis = { u, v, w };
    target = add(scale(target, 1 - screenT), scale(middle, screenT));
    distance = Math.exp(lerp(Math.log(distance), Math.log(close), screenT));
  }
  const eye = add(target, scale(basis.w, distance));
  const radius = Math.max(...points.map(p => Math.hypot(...sub(p, target))), 1);
  const near = Math.max(0.02, distance - radius * 4);
  const far = distance + radius * 8 + 40;
  const view = lookAt(eye, target, basis.v);
  const proj = perspective(fov, aspect, near, far);
  const viewProj = multiply(proj, view);

  const depthOf = p => dot(sub(eye, p), basis.w);

  let focusDepth = distance;
  const focusFrom = f => {
    if (f.point) return depthOf(f.point);
    const item = devices[f.device ?? 0];
    if (!item) return null;
    return depthOf(screenPoint(item.layout, item.model, f.u ?? 0.5, f.v ?? 0.5));
  };
  if (doc.depth?.focus) focusDepth = focusFrom(doc.depth.focus) ?? focusDepth;
  if (motion.rack !== undefined && doc.depth?.rack) {
    const a = doc.depth.focus ? focusFrom(doc.depth.focus) : distance;
    const b = focusFrom(doc.depth.rack) ?? distance;
    focusDepth = lerp(a, b, motion.rack);
  }

  let minZ = Infinity;
  let minY = Infinity;
  points.forEach(p => {
    minZ = Math.min(minZ, p[2]);
    minY = Math.min(minY, p[1]);
  });
  const size = Math.max(...devices.map(item => item.size));
  const light = doc.light;
  const receiver = light.receiver === 'floor' || doc.background.kind === 'studio' ? 'floor' : 'backdrop';
  const gap = (light.distance ?? 0.25) * size;
  const wallZ = minZ - (receiver === 'backdrop' ? gap : size * 1.6);
  const floorY = receiver === 'floor' ? minY - (light.lift ?? 0) * size : minY - size * 2;
  const az = (light.angle ?? -24) * DEG;
  const el = clamp(light.height ?? 58, 8, 89) * DEG;
  let source;
  if (receiver === 'floor')
    source = normalize([Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el) * 0.6 + 0.35]);
  else source = normalize([Math.sin(az) * Math.cos(el), Math.cos(az) * Math.cos(el) * 0.85, Math.sin(el)]);
  const lightDir = scale(source, -1);
  const plane = receiver === 'floor' ? [0, 1, 0, floorY] : [0, 0, 1, wallZ];
  const shadow = shadowRegion(points, receiver, receiver === 'floor' ? floorY : wallZ, lightDir, size, light);

  const pixelsPerUnit = height / (2 * tanY * Math.max(focusDepth, 1e-3));
  const amount = clamp(doc.depth?.amount ?? 0, 0, 1);
  const cocScale = amount * width * 0.075;

  return {
    doc,
    width,
    height,
    aspect,
    time,
    preview,
    motion,
    camera: {
      eye,
      target,
      basis,
      distance,
      view,
      proj,
      viewProj,
      invViewProj: invert(viewProj),
      fov,
      tanX,
      tanY,
      near,
      far
    },
    devices,
    center,
    focusDepth,
    cocScale,
    pixelsPerUnit,
    size,
    receiver,
    wallZ,
    floorY,
    plane,
    lightDir,
    shadow,
    depthOf
  };
}

function shadowRegion(points, receiver, offset, lightDir, size, light) {
  const normal = receiver === 'floor' ? [0, 1, 0] : [0, 0, 1];
  const axisU = [1, 0, 0];
  const axisV = receiver === 'floor' ? [0, 0, -1] : [0, 1, 0];
  const facing = Math.min(dot(normal, lightDir), -0.22);
  let minU = Infinity;
  let maxU = -Infinity;
  let minV = Infinity;
  let maxV = -Infinity;
  let maxHeight = 0;
  points.forEach(p => {
    const h = dot(normal, p) - offset;
    if (h < -1e-4) return;
    const q = add(p, scale(lightDir, -Math.max(h, 0) / facing));
    const u = dot(q, axisU);
    const v = dot(q, axisV);
    minU = Math.min(minU, u, dot(p, axisU));
    maxU = Math.max(maxU, u, dot(p, axisU));
    minV = Math.min(minV, v, dot(p, axisV));
    maxV = Math.max(maxV, v, dot(p, axisV));
    maxHeight = Math.max(maxHeight, h);
  });
  if (!Number.isFinite(minU)) return null;
  const softness = clamp(light.softness ?? 0.55, 0, 1);
  const spread = 0.1 + softness * 0.5;
  const ambient = size * (0.16 + softness * 0.18);
  const contact = [size * (0.016 + softness * 0.012), size * (0.06 + softness * 0.04)];
  const margin = Math.max(maxHeight * spread * 3, ambient * 2.6) + size * 0.04;
  const side = Math.max(maxU - minU, maxV - minV) + margin * 2;
  const centerU = (minU + maxU) / 2;
  const centerV = (minV + maxV) / 2;
  return {
    normal,
    offset,
    axisU,
    axisV,
    facing,
    origin: [centerU - side / 2, centerV - side / 2],
    side,
    spread,
    ambient,
    contact,
    contactHeight: [size * 0.014, size * 0.07],
    sharp: size * (0.004 + softness * 0.004),
    maxHeight
  };
}

export function pickFocus(scene, ndcX, ndcY) {
  const { camera, devices } = scene;
  const inv = camera.invViewProj;
  const a = transformPoint(inv, [ndcX, ndcY, -1]);
  const b = transformPoint(inv, [ndcX, ndcY, 1]);
  const dir = normalize(sub(b, a));
  let best = null;
  devices.forEach(item => {
    const m = multiply(
      item.model,
      item.layout.type === 'laptop' ? laptopParts(item.layout).lid : [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    );
    const inverse = invert(m);
    const o = transformPoint(inverse, a);
    const p = transformPoint(inverse, b);
    const d = sub(p, o);
    const zFront = item.layout.body.thickness / 2;
    if (Math.abs(d[2]) < 1e-6) return;
    const t = (zFront - o[2]) / d[2];
    if (t < 0) return;
    const hit = add(o, scale(d, t));
    const { body, screen } = item.layout;
    const u = (hit[0] + body.w / 2 - screen.x) / screen.w;
    const v = (body.h / 2 - hit[1] - screen.y) / screen.h;
    if (u < -0.05 || u > 1.05 || v < -0.05 || v > 1.05) return;
    const world = transformPoint(m, hit);
    const dist = dot(sub(world, a), dir);
    if (!best || dist < best.dist) best = { device: item.index, u: clamp(u, 0, 1), v: clamp(v, 0, 1), dist };
  });
  return best;
}
