import { DARK_STUDIO, INK, NIGHT, VOID, screen, solid, spotlight, studio, white } from './shared';

const LIGHT_STUDIO = ['#e3e0da', '#efece6', '#ffffff', '#ffffff'];
const dim = (extra = {}) => ({ grain: 0.1, vignette: 0.22, ...extra });
const clean = { grain: 0, vignette: 0 };
const page = (slot, extra = {}) => ({ type: 'card', finish: 'clean', slot, radius: 0.04, viewport: '16:10', ...extra });
const tile = (i, extra = {}) => screen(i, { type: 'card', finish: 'clean', radius: 0.04, viewport: '16:10', ...extra });

const BOKEH = [
  [-4.2, 1.8, -4],
  [4.6, 2.2, -6],
  [-5.6, -1.6, -7],
  [3.8, -2, -3.5],
  [0.6, 3, -8],
  [-1.8, -3, -5.5],
  [6.8, 0.2, -9],
  [-7.2, 0.8, -9.5],
  [1.8, -3.6, -7.5],
  [-3, 3.6, -6.5]
];

const RUNWAY = Array.from({ length: 8 }, (_, i) =>
  tile(i, { rx: -90, x: 0, y: 0, z: 4 - i * 2.5, lane: 0, laneDir: 1, laneSpacing: 2.5, layer: 'runway' })
);

const TRAIL = Array.from({ length: 5 }, (_, i) =>
  tile(i, { x: -2.8 + i * 1.9, y: 0.15 * i, z: 1 - i * 2.2, scale: 0.8, layer: 'trail' })
);

const TOWER = Array.from({ length: 4 }, (_, i) => tile(i, { y: i * 2.18, layer: 'tower' }));

export const DEPTH = [
  {
    id: 'edge-left',
    name: 'Left edge',
    group: 'depth',
    hero: ['depth', 'turn', 'zoom'],
    doc: {
      devices: [page(2)],
      camera: { rx: 8, ry: 34, rz: -2, fov: 30, zoom: 2.4, target: { device: 0, u: 0.1, v: 0.42 } },
      depth: { amount: 0.55 },
      background: white(),
      light: { shadow: 0.45, softness: 0.75, distance: 0.12 },
      motion: { kind: 'drift', duration: 10, intensity: 0.3 },
      finish: clean
    }
  },
  {
    id: 'edge-right',
    name: 'Right edge',
    group: 'depth',
    hero: ['depth', 'turn', 'zoom'],
    doc: {
      devices: [page(0)],
      camera: { rx: 10, ry: -34, rz: 2, fov: 30, zoom: 2.4, target: { device: 0, u: 0.9, v: 0.55 } },
      depth: { amount: 0.55 },
      background: solid(INK),
      light: { shadow: 0.5, softness: 0.65, distance: 0.12 },
      motion: { kind: 'drift', duration: 10, intensity: 0.3 },
      finish: dim()
    }
  },
  {
    id: 'top-bar',
    name: 'Top bar',
    group: 'depth',
    hero: ['depth', 'tilt', 'intensity'],
    doc: {
      devices: [page(0)],
      camera: { rx: -16, ry: -10, rz: 1, fov: 30, zoom: 2.8, target: { device: 0, u: 0.32, v: 0.06 } },
      depth: { amount: 0.6 },
      background: solid(NIGHT),
      light: { shadow: 0.5, softness: 0.65, distance: 0.12 },
      motion: { kind: 'pan', duration: 12, intensity: 0.35 },
      finish: dim()
    }
  },
  {
    id: 'address-bar',
    name: 'Address bar',
    group: 'depth',
    hero: ['depth', 'tilt', 'zoom'],
    doc: {
      devices: [{ type: 'phone', finish: 'natural', slot: 1, rx: -10, ry: -14, browserBar: true }],
      camera: { rx: 6, ry: 12, rz: -3, fov: 30, zoom: 2.3, target: { device: 0, u: 0.5, v: 0.93 } },
      depth: { amount: 0.6 },
      background: white(),
      light: { shadow: 0.45, softness: 0.75, distance: 0.12, height: 62, angle: -24 },
      motion: { kind: 'drift', duration: 10, intensity: 0.3 },
      finish: clean
    }
  },
  {
    id: 'side-view',
    name: 'Side view',
    group: 'depth',
    hero: ['depth', 'turn', 'reflection'],
    doc: {
      devices: [page(0)],
      camera: { rx: 6, ry: 50, fov: 30, zoom: 1.7, target: { device: 0, u: 0.62, v: 0.5 } },
      depth: { amount: 0.5 },
      background: studio(LIGHT_STUDIO, { light: 0.3 }),
      light: { shadow: 0.55, softness: 0.6, height: 62, angle: 30, reflection: 0.18 },
      motion: { kind: 'drift', duration: 11, intensity: 0.25 },
      finish: clean
    }
  },
  {
    id: 'dutch-focus',
    name: 'Dutch focus',
    group: 'depth',
    hero: ['depth', 'roll', 'zoom'],
    doc: {
      devices: [page(2)],
      camera: { rx: 12, ry: -18, rz: -14, fov: 30, zoom: 2.2, target: { device: 0, u: 0.36, v: 0.3 } },
      depth: { amount: 0.5 },
      background: white(),
      light: { shadow: 0.45, softness: 0.75, distance: 0.12 },
      motion: { kind: 'drift', duration: 10, intensity: 0.3 },
      finish: clean
    }
  },
  {
    id: 'low-display',
    name: 'Low display',
    group: 'depth',
    hero: ['depth', 'tilt', 'reflection'],
    doc: {
      devices: [{ type: 'monitor', finish: 'silver', slot: 0 }],
      camera: { rx: -10, ry: -40, fov: 30, zoom: 2.2, target: { device: 0, u: 0.22, v: 0.24 } },
      depth: { amount: 0.6 },
      background: studio(DARK_STUDIO, { light: 0.55 }),
      light: { shadow: 0.65, softness: 0.65, height: 60, angle: -26, reflection: 0.2 },
      motion: { kind: 'drift', duration: 11, intensity: 0.25 },
      finish: dim()
    }
  },
  {
    id: 'rack-down',
    name: 'Rack down',
    group: 'depth',
    hero: ['depth', 'duration', 'tilt'],
    doc: {
      devices: [{ type: 'card', finish: 'clean', slot: 1, radius: 0.12, viewport: '9:19.5', rx: -76 }],
      camera: { rx: 22, ry: -12, fov: 30, zoom: 1.5, target: { device: 0, u: 0.5, v: 0.5 } },
      depth: { amount: 0.7, focus: { device: 0, u: 0.5, v: 0.12 }, rack: { device: 0, u: 0.5, v: 0.86 } },
      background: spotlight(INK, { spotCenter: [0.5, 0.55] }),
      light: { shadow: 0.5, softness: 0.65, distance: 0.12 },
      motion: { kind: 'rack', duration: 7, intensity: 0.4 },
      finish: dim()
    }
  },
  {
    id: 'foreground',
    name: 'Foreground',
    group: 'depth',
    hero: ['depth', 'turn', 'bgColor'],
    doc: {
      devices: [page(0, { ry: -8 }), page(2, { x: 2.05, y: -1.0, z: 2.1, ry: -16 })],
      camera: { rx: 6, ry: -6, fov: 30, pad: 0.02, frame: [4.4, 2.75], frameCenter: [0.15, -0.05, 0] },
      depth: { amount: 0.6, focus: { device: 0, u: 0.4, v: 0.4 } },
      background: solid(NIGHT),
      light: { shadow: 0.45, softness: 0.7, distance: 0.12 },
      motion: { kind: 'drift', duration: 10, intensity: 0.3 },
      finish: dim()
    }
  },
  {
    id: 'far-corner',
    name: 'Far corner',
    group: 'depth',
    hero: ['depth', 'turn', 'zoom'],
    doc: {
      devices: [{ type: 'laptop', finish: 'black', slot: 0, open: 112 }],
      camera: { rx: 28, ry: 40, fov: 30, zoom: 2.1, target: { device: 0, u: 0.18, v: 0.22 } },
      depth: { amount: 0.6 },
      background: solid(['#0b0b0d', '#1b1b20', '#000000', '#000000']),
      light: { shadow: 0.55, softness: 0.65, distance: 0.12, height: 60, angle: 28 },
      motion: { kind: 'drift', duration: 10, intensity: 0.25 },
      finish: dim()
    }
  },
  {
    id: 'layers',
    name: 'Layers',
    group: 'depth',
    hero: ['depth', 'duration', 'turn'],
    doc: {
      devices: [
        page(2, { x: -2.1, y: -0.45, z: 1.8, scale: 0.8 }),
        page(0, { x: 0, y: 0, z: 0, scale: 0.8 }),
        page(2, { x: 2.1, y: 0.45, z: -1.8, scale: 0.8 })
      ],
      camera: { rx: 4, ry: -6, fov: 30, pad: 0.06 },
      depth: { amount: 0.55, focus: { device: 0, u: 0.5, v: 0.4 }, rack: { device: 2, u: 0.5, v: 0.4 } },
      background: solid(NIGHT),
      light: { shadow: 0.4, softness: 0.8, distance: 0.12 },
      motion: { kind: 'rack', duration: 9, intensity: 0.4 },
      finish: dim()
    }
  },
  {
    id: 'bokeh',
    name: 'Bokeh',
    group: 'depth',
    hero: ['depth', 'bgColor', 'zoom'],
    doc: {
      devices: [
        page(0, { ry: -10, layer: 'hero' }),
        ...BOKEH.map(([x, y, z], i) => tile(i + 1, { x, y, z, ry: ((i * 37) % 30) - 15, scale: 0.6, layer: 'back' }))
      ],
      camera: { rx: 4, ry: 0, fov: 28, pad: 0.18, frame: [4.6, 2.9], frameCenter: [0, 0, 0] },
      depth: { amount: 0.95, focus: { device: 0, u: 0.5, v: 0.5 } },
      background: solid(VOID),
      light: { shadow: 0, softness: 0.8 },
      motion: { kind: 'drift', duration: 12, intensity: 0.3 },
      finish: dim()
    }
  },
  {
    id: 'tower',
    name: 'Tower',
    group: 'depth',
    hero: ['depth', 'tilt', 'zoom'],
    doc: {
      devices: TOWER,
      camera: { rx: -30, ry: -20, fov: 44, pad: 0, frame: [3.4, 2.4], frameCenter: [0, 0, 0] },
      depth: { amount: 0.5, focus: { device: 0, u: 0.5, v: 0.6 } },
      background: solid(INK),
      light: { shadow: 0.4, softness: 0.75, distance: 0.12 },
      motion: { kind: 'drift', duration: 11, intensity: 0.3 },
      finish: dim()
    }
  },
  {
    id: 'between',
    name: 'Between',
    group: 'depth',
    hero: ['depth', 'turn', 'bgColor'],
    doc: {
      devices: [page(0, { ry: -6 }), page(2, { x: -2.5, z: 2.2, ry: 40 }), page(2, { x: 2.5, z: 2.2, ry: -40 })],
      camera: { rx: 4, ry: 0, fov: 30, pad: 0.02, frame: [4.6, 2.9], frameCenter: [0, 0, 0] },
      depth: { amount: 0.7, focus: { device: 0, u: 0.5, v: 0.45 } },
      background: solid(NIGHT),
      light: { shadow: 0.35, softness: 0.8, distance: 0.12 },
      motion: { kind: 'drift', duration: 10, intensity: 0.3 },
      finish: dim()
    }
  },
  {
    id: 'runway',
    name: 'Runway',
    group: 'depth',
    hero: ['depth', 'duration', 'tilt'],
    doc: {
      devices: RUNWAY,
      camera: { rx: 16, ry: -8, fov: 32, pad: 0, frame: [3.2, 6], frameCenter: [0, 0, -2], frameFlat: true },
      depth: { amount: 0.42, focus: { point: [0, 0, -2.5] } },
      background: solid(VOID),
      light: { shadow: 0, softness: 0.8 },
      motion: { kind: 'flow', axis: 'z', fade: true, duration: 16, intensity: 0.3 },
      finish: dim()
    }
  },
  {
    id: 'reading',
    name: 'Reading',
    group: 'depth',
    hero: ['depth', 'duration', 'zoom'],
    doc: {
      devices: [page(2)],
      camera: { rx: 34, ry: -18, rz: -6, fov: 28, zoom: 3.2, target: { device: 0, u: 0.32, v: 0.42 } },
      depth: { amount: 0.7 },
      background: white(),
      light: { shadow: 0.4, softness: 0.75, distance: 0.12 },
      motion: { kind: 'scroll', duration: 14, intensity: 0.4 },
      finish: clean
    }
  },
  {
    id: 'detail',
    name: 'Detail',
    group: 'depth',
    hero: ['depth', 'zoom', 'turn'],
    doc: {
      devices: [page(0)],
      camera: { rx: 20, ry: -26, rz: 2, fov: 26, zoom: 4.2, target: { device: 0, u: 0.16, v: 0.42 } },
      depth: { amount: 0.75 },
      background: solid(INK),
      light: { shadow: 0.4, softness: 0.7, distance: 0.12 },
      motion: { kind: 'drift', duration: 10, intensity: 0.3 },
      finish: dim()
    }
  },
  {
    id: 'trail',
    name: 'Trail',
    group: 'depth',
    hero: ['depth', 'turn', 'bgColor'],
    doc: {
      devices: TRAIL,
      camera: { rx: 6, ry: -24, fov: 30, pad: 0.14 },
      depth: { amount: 0.6, focus: { device: 0, u: 0.5, v: 0.5 } },
      background: white(),
      light: { shadow: 0.35, softness: 0.85, distance: 0.1 },
      motion: { kind: 'drift', duration: 11, intensity: 0.3 },
      finish: clean
    }
  },
  {
    id: 'mirror-floor',
    name: 'Mirror floor',
    group: 'depth',
    hero: ['depth', 'reflection', 'turn'],
    doc: {
      devices: [page(2)],
      camera: { rx: 4, ry: -24, fov: 30, zoom: 1.6, target: { device: 0, u: 0.35, v: 0.95 } },
      depth: { amount: 0.55 },
      background: studio(DARK_STUDIO, { light: 0.5 }),
      light: { shadow: 0.6, softness: 0.6, height: 60, angle: -20, reflection: 0.45, receiver: 'floor', lift: 0 },
      motion: { kind: 'drift', duration: 11, intensity: 0.25 },
      finish: dim()
    }
  },
  {
    id: 'orbit-focus',
    name: 'Orbit focus',
    group: 'depth',
    hero: ['depth', 'intensity', 'zoom'],
    doc: {
      devices: [page(2)],
      camera: { rx: 18, ry: -24, fov: 30, zoom: 2.2, target: { device: 0, u: 0.5, v: 0.4 } },
      depth: { amount: 0.6, focus: { device: 0, u: 0.3, v: 0.3 } },
      background: white(),
      light: { shadow: 0.4, softness: 0.75, distance: 0.12 },
      motion: { kind: 'spiral', duration: 12, intensity: 0.6 },
      finish: clean
    }
  }
];
