import { COAL, NIGHT, screen, solid, white } from './shared';

const ISO = { rx: 35, ry: -45, fov: 11 };
const flatCard = (i, extra = {}) =>
  screen(i, { type: 'card', finish: 'edge', radius: 0.06, viewport: '16:10', rx: -90, layer: 'set', ...extra });
const flatApp = (i, extra = {}) =>
  screen(i, {
    type: 'card',
    finish: 'edge',
    radius: 0.42,
    viewport: '9:19.5',
    scale: 0.24,
    rx: -90,
    layer: 'set',
    ...extra
  });

const floorGrid = ({ rows, cols, w, h, gap, make, lanes = false }) => {
  const out = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      out.push({
        ...make(r * cols + c, r, c),
        x: (c - (cols - 1) / 2) * (w + gap) + (lanes && r % 2 ? (w + gap) / 2 : 0),
        y: 0,
        z: (r - (rows - 1) / 2) * (h + gap),
        ...(lanes ? { lane: r, laneSpacing: w + gap } : {})
      });
    }
  }
  return out;
};

const floor = { shadow: 0.45, softness: 0.85, receiver: 'floor', lift: 0.12, height: 72, angle: -30 };

export const ISOMETRIC = [
  {
    id: 'iso-stack',
    name: 'Iso stack',
    group: 'isometric',
    hero: ['duration', 'turn', 'bgColor'],
    doc: {
      devices: [0, 1, 2, 3].map(i => ({ ...flatCard(i), y: i * 0.62 })),
      camera: { ...ISO, pad: 0.16 },
      background: white(),
      light: { ...floor, lift: 0.3 },
      motion: { kind: 'spread', duration: 9, intensity: 0.5 },
      finish: { grain: 0, vignette: 0 }
    }
  },
  {
    id: 'iso-grid',
    name: 'Iso grid',
    group: 'isometric',
    hero: ['duration', 'intensity', 'turn'],
    doc: {
      devices: floorGrid({ rows: 3, cols: 3, w: 2.56, h: 1.6, gap: 0.34, make: i => flatCard(i, { scale: 0.8 }) }),
      camera: { ...ISO, pad: 0.1 },
      background: white(),
      light: floor,
      motion: { kind: 'wave', axis: 'y', duration: 8, intensity: 0.5 },
      finish: { grain: 0, vignette: 0 }
    }
  },
  {
    id: 'iso-night',
    name: 'Iso night',
    group: 'isometric',
    hero: ['duration', 'intensity', 'turn'],
    doc: {
      devices: floorGrid({ rows: 4, cols: 4, w: 1.92, h: 1.2, gap: 0.28, make: i => flatCard(i, { scale: 0.6 }) }),
      camera: { ...ISO, pad: 0.06 },
      background: solid(NIGHT),
      light: { ...floor, shadow: 0.55 },
      motion: { kind: 'wave', axis: 'y', duration: 9, intensity: 0.5 },
      finish: { grain: 0.1, vignette: 0.28 }
    }
  },
  {
    id: 'iso-flow',
    name: 'Iso flow',
    group: 'isometric',
    hero: ['duration', 'turn', 'bgColor'],
    doc: {
      devices: floorGrid({
        rows: 4,
        cols: 7,
        w: 2.24,
        h: 1.4,
        gap: 0.3,
        lanes: true,
        make: i => flatCard(i, { scale: 0.7 })
      }),
      camera: { ...ISO, pad: 0, frame: [6.6, 4.4], frameCenter: [0, 0, 0], frameFlat: true },
      background: white(),
      light: floor,
      motion: { kind: 'flow', axis: 'x', fade: true, duration: 26, intensity: 0.3 },
      finish: { grain: 0, vignette: 0 }
    }
  },
  {
    id: 'iso-columns',
    name: 'Iso columns',
    group: 'isometric',
    hero: ['duration', 'turn', 'bgColor'],
    doc: {
      devices: (() => {
        const out = [];
        for (let c = 0; c < 6; c += 1) {
          for (let r = 0; r < 5; r += 1) {
            out.push({
              ...flatApp(c * 5 + r),
              x: (c - 2.5) * 0.98,
              y: 0,
              z: (r - 2) * 1.88 + (c % 2 ? 0.94 : 0),
              lane: c,
              laneSpacing: 1.88
            });
          }
        }
        return out;
      })(),
      camera: { ...ISO, pad: 0, frame: [4.4, 5.2], frameCenter: [0, 0, 0], frameFlat: true },
      background: solid(COAL),
      light: { ...floor, shadow: 0.5 },
      motion: { kind: 'flow', axis: 'z', fade: true, duration: 20, intensity: 0.3 },
      finish: { grain: 0.1, vignette: 0.26 }
    }
  },
  {
    id: 'iso-phones',
    name: 'Iso phones',
    group: 'isometric',
    hero: ['duration', 'intensity', 'bgColor'],
    doc: {
      devices: [0, 1, 2, 3, 4].map(i => ({
        ...screen(i, { type: 'phone', finish: ['silver', 'black', 'glacier', 'natural', 'burgundy'][i] }),
        x: (i - 2) * 0.98,
        rx: -90,
        layer: 'set'
      })),
      camera: { ...ISO, pad: 0.14 },
      background: white(),
      light: { ...floor, lift: 0.06 },
      motion: { kind: 'wave', axis: 'y', duration: 7, intensity: 0.5 },
      finish: { grain: 0, vignette: 0 }
    }
  },
  {
    id: 'iso-open',
    name: 'Iso open',
    group: 'isometric',
    hero: ['duration', 'turn', 'bgColor'],
    doc: {
      devices: [{ type: 'laptop', finish: 'silver', slot: 0, open: 110 }],
      camera: { ...ISO, pad: 0.16 },
      background: white(),
      light: { ...floor, lift: 0 },
      motion: { kind: 'unfold', duration: 6, intensity: 0.2 },
      finish: { grain: 0, vignette: 0 }
    }
  },
  {
    id: 'iso-desk',
    name: 'Iso desk',
    group: 'isometric',
    hero: ['turn', 'bgColor', 'shadow'],
    doc: {
      devices: [
        { type: 'laptop', finish: 'silver', slot: 0 },
        { type: 'phone', finish: 'natural', slot: 1, rx: -90, x: 2.35, y: -0.06, z: 1.4, ry: -12 },
        { type: 'tablet', finish: 'silver', slot: 2, rx: -90, x: -3.2, y: -0.08, z: 1.25, ry: 8 }
      ],
      camera: { ...ISO, pad: 0.1 },
      background: white(),
      light: { ...floor, lift: 0 },
      motion: { kind: 'drift', duration: 12, intensity: 0.2 },
      finish: { grain: 0, vignette: 0 }
    }
  },
  {
    id: 'iso-tower',
    name: 'Iso tower',
    group: 'isometric',
    hero: ['duration', 'turn', 'bgColor'],
    doc: {
      devices: [0, 1, 2, 3, 4].map(i => ({ ...flatCard(i, { scale: 0.8 }), y: i * 0.5, ry: i * 9 })),
      camera: { ...ISO, pad: 0.14 },
      background: solid(NIGHT),
      light: { ...floor, shadow: 0.5, lift: 0.3 },
      motion: { kind: 'carousel', duration: 24, intensity: 0.5 },
      finish: { grain: 0.1, vignette: 0.26 }
    }
  },
  {
    id: 'iso-steps',
    name: 'Iso steps',
    group: 'isometric',
    hero: ['duration', 'turn', 'bgColor'],
    doc: {
      devices: [0, 1, 2, 3, 4].map(i => ({
        ...screen(i, { type: 'card', finish: 'edge', radius: 0.06, viewport: '16:10', scale: 0.7, layer: 'set' }),
        x: (i - 2) * 1.2,
        y: (i - 2) * 0.32,
        z: (2 - i) * 1.1,
        ry: -45
      })),
      camera: { ...ISO, pad: 0.1 },
      background: white(),
      light: { ...floor, lift: 0.2 },
      motion: { kind: 'float', duration: 8, intensity: 0.4 },
      finish: { grain: 0, vignette: 0 }
    }
  }
];
