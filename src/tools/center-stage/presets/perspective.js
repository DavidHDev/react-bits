import { DARK_STUDIO, NIGHT, VOID, screen, solid, spotlight, studio, white } from './shared';

const dim = (extra = {}) => ({ grain: 0.1, vignette: 0.24, ...extra });
const clean = { grain: 0, vignette: 0 };
const page = (slot, extra = {}) => ({ type: 'card', finish: 'clean', slot, radius: 0.04, viewport: '16:10', ...extra });
const tile = (i, extra = {}) => screen(i, { type: 'card', finish: 'clean', radius: 0.04, viewport: '16:10', ...extra });

const ROW = Array.from({ length: 10 }, (_, i) =>
  tile(i, { x: 8 - i * 3.5, y: 0, z: 0, lane: 0, laneDir: 1, laneSpacing: 3.5, layer: 'row' })
);

export const PERSPECTIVE = [
  {
    id: 'wide-angle',
    name: 'Wide angle',
    group: 'perspective',
    hero: ['turn', 'tilt', 'bgColor'],
    doc: {
      devices: [{ type: 'browser', finish: 'dark', slot: 0 }],
      camera: { rx: -6, ry: -24, fov: 64, pad: 0.08 },
      background: { kind: 'gradient', colors: ['#121216', '#1d1d23', '#2b2b33', '#121216'], angle: 140 },
      light: { shadow: 0.55, softness: 0.65, distance: 0.12 },
      motion: { kind: 'drift', duration: 10, intensity: 0.35 },
      finish: dim()
    }
  },
  {
    id: 'telephoto',
    name: 'Telephoto',
    group: 'perspective',
    hero: ['turn', 'tilt', 'shadow'],
    doc: {
      devices: [{ type: 'laptop', finish: 'silver', slot: 2, open: 110 }],
      camera: { rx: 16, ry: -34, fov: 9, pad: 0.12 },
      background: white(),
      light: { shadow: 0.55, softness: 0.7, height: 62, angle: -26, receiver: 'floor' },
      motion: { kind: 'orbit', duration: 12, intensity: 0.3 },
      finish: clean
    }
  },
  {
    id: 'corner-view',
    name: 'Corner view',
    group: 'perspective',
    hero: ['turn', 'tilt', 'roll'],
    doc: {
      devices: [page(2)],
      camera: { rx: 38, ry: 46, rz: -8, fov: 30, pad: 0.14 },
      background: white(),
      light: { shadow: 0.45, softness: 0.75, distance: 0.14, angle: -20 },
      motion: { kind: 'drift', duration: 10, intensity: 0.3 },
      finish: clean
    }
  },
  {
    id: 'lean-out',
    name: 'Lean out',
    group: 'perspective',
    hero: ['tilt', 'turn', 'bgColor'],
    doc: {
      devices: [{ type: 'browser', finish: 'dark', slot: 0, rx: 14 }],
      camera: { rx: -12, ry: 12, fov: 38, pad: 0.1 },
      background: spotlight(NIGHT, { spotCenter: [0.5, 0.7], spotSize: 0.6 }),
      light: { shadow: 0.5, softness: 0.7, distance: 0.14 },
      motion: { kind: 'float', duration: 9, intensity: 0.35 },
      finish: dim()
    }
  },
  {
    id: 'floor-view',
    name: 'Floor view',
    group: 'perspective',
    hero: ['turn', 'reflection', 'bgColor'],
    doc: {
      devices: [
        { type: 'phone', finish: 'black', slot: 1, x: -0.55, z: 0.5, ry: 14 },
        { type: 'phone', finish: 'silver', slot: 1, x: 0.75, z: -0.9, ry: -10 }
      ],
      camera: { rx: 1, ry: -18, fov: 36, pad: 0.12 },
      background: studio(DARK_STUDIO, { light: 0.55 }),
      light: { shadow: 0.6, softness: 0.6, height: 60, angle: -24, reflection: 0.4, receiver: 'floor', lift: 0 },
      motion: { kind: 'orbit', duration: 12, intensity: 0.25 },
      finish: dim()
    }
  },
  {
    id: 'vanishing',
    name: 'Vanishing point',
    group: 'perspective',
    hero: ['duration', 'turn', 'bgColor'],
    doc: {
      devices: ROW,
      camera: { rx: 6, ry: 62, fov: 46, pad: 0, frame: [4.2, 2.6], frameCenter: [5.6, 0, 0] },
      background: solid(VOID),
      light: { shadow: 0, softness: 0.8 },
      motion: { kind: 'flow', axis: 'x', fade: true, duration: 18, intensity: 0.3 },
      finish: dim()
    }
  },
  {
    id: 'skew',
    name: 'Skew',
    group: 'perspective',
    hero: ['turn', 'roll', 'tilt'],
    doc: {
      devices: [page(0)],
      camera: { rx: -6, ry: -58, rz: -12, fov: 48, pad: 0.08 },
      background: { kind: 'gradient', colors: ['#121216', '#1d1d23', '#2b2b33', '#121216'], angle: 60 },
      light: { shadow: 0.5, softness: 0.7, distance: 0.14, angle: -24 },
      motion: { kind: 'drift', duration: 10, intensity: 0.3 },
      finish: dim()
    }
  },
  {
    id: 'plan-view',
    name: 'Plan view',
    group: 'perspective',
    hero: ['roll', 'shadow', 'bgColor'],
    doc: {
      devices: [page(0, { rx: -90, ry: 18 })],
      camera: { rx: 90, ry: 0, fov: 24, pad: 0.14 },
      background: white(),
      light: { shadow: 0.5, softness: 0.75, height: 64, angle: -30, receiver: 'floor', lift: 0.05 },
      motion: { kind: 'drift', duration: 11, intensity: 0.25 },
      finish: clean
    }
  },
  {
    id: 'user-view',
    name: 'User view',
    group: 'perspective',
    hero: ['tilt', 'zoom', 'reflection'],
    doc: {
      devices: [{ type: 'laptop', finish: 'black', slot: 0, open: 108 }],
      camera: { rx: 18, ry: -6, fov: 50, zoom: 1.25, target: { device: 0, u: 0.5, v: 0.78 } },
      background: studio(DARK_STUDIO, { light: 0.5 }),
      light: { shadow: 0.6, softness: 0.65, height: 60, angle: -20 },
      motion: { kind: 'drift', duration: 10, intensity: 0.3 },
      finish: dim()
    }
  },
  {
    id: 'upshot',
    name: 'Upshot',
    group: 'perspective',
    hero: ['tilt', 'turn', 'shadow'],
    doc: {
      devices: [{ type: 'phone', finish: 'natural', slot: 1 }],
      camera: { rx: -32, ry: 18, fov: 40, pad: 0.1 },
      background: white(),
      light: { shadow: 0.45, softness: 0.75, distance: 0.12, height: 62, angle: -20 },
      motion: { kind: 'crane', duration: 11, intensity: 0.4 },
      finish: clean
    }
  }
];
