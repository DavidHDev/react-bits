import {
  COAL,
  DARK_STUDIO,
  INK,
  NIGHT,
  VOID,
  columns,
  globe,
  grid,
  helix,
  lineup,
  ring,
  rows,
  screen,
  solid,
  spotlight,
  stackOf,
  studio,
  tunnel,
  wheel,
  white
} from './shared';

const desk = (i, extra = {}) =>
  screen(i, { type: 'card', finish: 'clean', radius: 0.06, viewport: '16:10', layer: 'set', ...extra });
const app = (i, extra = {}) =>
  screen(i, { type: 'card', finish: 'clean', radius: 0.42, viewport: '9:19.5', scale: 0.24, layer: 'set', ...extra });
const browser = (i, finish, extra = {}) =>
  screen(i, { type: 'browser', finish, viewport: '16:10', layer: 'set', ...extra });
const handset = (i, finish, extra = {}) => screen(i, { type: 'phone', finish, layer: 'set', ...extra });
const PHONES = ['black', 'silver', 'burgundy', 'glacier', 'natural', 'orange', 'blue'];

const flat = { shadow: 0, softness: 0.8 };
const dim = finish => ({ grain: 0.1, vignette: 0.3, ...finish });
const clean = { grain: 0, vignette: 0 };

export const GALLERIES = [
  {
    id: 'ring',
    name: 'Ring',
    group: 'galleries',
    hero: ['duration', 'tilt', 'depth'],
    doc: {
      devices: ring({ n: 10, radius: 5.9, make: i => desk(i, { twoSided: true }) }),
      camera: { rx: 15, ry: 0, fov: 30, pad: 0.02, frame: [10.4, 5.6], frameCenter: [0, 0.6, 4.4] },
      background: solid(NIGHT),
      depth: { amount: 0.25 },
      light: flat,
      motion: { kind: 'carousel', duration: 26, intensity: 0.5 },
      finish: dim()
    }
  },
  {
    id: 'ring-light',
    name: 'Ring, light',
    group: 'galleries',
    hero: ['duration', 'tilt', 'depth'],
    doc: {
      devices: ring({ n: 10, radius: 6, make: i => browser(i, 'light', { twoSided: true }) }),
      camera: { rx: 13, ry: 0, fov: 30, pad: 0.02, frame: [10.6, 5.6], frameCenter: [0, 0.6, 4.4] },
      background: white(),
      depth: { amount: 0.22 },
      light: flat,
      motion: { kind: 'carousel', duration: 26, intensity: 0.5 },
      finish: clean
    }
  },
  {
    id: 'phone-ring',
    name: 'Phone ring',
    group: 'galleries',
    hero: ['duration', 'tilt', 'reflection'],
    doc: {
      devices: ring({ n: 10, radius: 2.2, make: i => handset(i, PHONES[i % PHONES.length]) }),
      camera: { rx: 8, ry: 0, fov: 28, pad: 0.06, frame: [5.4, 2.4], frameCenter: [0, 0, 1.2] },
      background: studio(DARK_STUDIO, { light: 0.6, pool: 0.9 }),
      light: { shadow: 0.6, softness: 0.8, height: 70, angle: -12, reflection: 0.3 },
      motion: { kind: 'carousel', duration: 22, intensity: 0.5 },
      finish: dim({ vignette: 0.34 })
    }
  },
  {
    id: 'tilted-ring',
    name: 'Tilted ring',
    group: 'galleries',
    hero: ['duration', 'roll', 'depth'],
    doc: {
      devices: ring({ n: 12, radius: 6.1, make: i => desk(i, { scale: 0.86, twoSided: true }) }),
      camera: { rx: 26, ry: 0, rz: -12, fov: 30, pad: 0.02, frame: [14.4, 8], frameCenter: [0, -0.4, 0.6] },
      background: solid(VOID),
      depth: { amount: 0.18 },
      light: flat,
      motion: { kind: 'carousel', duration: 30, intensity: 0.5 },
      finish: dim()
    }
  },
  {
    id: 'carousel',
    name: 'Carousel',
    group: 'galleries',
    hero: ['duration', 'tilt', 'depth'],
    doc: {
      devices: ring({ n: 7, radius: 4.4, make: i => browser(i, 'dark') }),
      camera: { rx: 6, ry: 0, fov: 30, pad: 0.02, frame: [9.2, 4.4], frameCenter: [0, 0, 4.4] },
      background: spotlight(['#0a0a0d', '#24242c', '#000000', '#000000'], { spotCenter: [0.5, 0.56] }),
      depth: { amount: 0.3 },
      light: flat,
      motion: { kind: 'carousel-step', duration: 14, intensity: 0.5 },
      finish: dim()
    }
  },
  {
    id: 'wheel',
    name: 'Wheel',
    group: 'galleries',
    hero: ['duration', 'turn', 'depth'],
    doc: {
      devices: wheel({ n: 10, radius: 2.8, make: i => desk(i, { scale: 0.7, twoSided: true }) }),
      camera: { rx: 2, ry: 34, fov: 30, pad: 0.04, frame: [5.4, 5], frameCenter: [0, 0, 0] },
      background: solid(COAL),
      depth: { amount: 0.2 },
      light: flat,
      motion: { kind: 'carousel', axis: 'x', duration: 24, intensity: 0.5 },
      finish: dim()
    }
  },
  {
    id: 'helix',
    name: 'Helix',
    group: 'galleries',
    hero: ['duration', 'tilt', 'depth'],
    doc: {
      devices: helix({
        n: 24,
        radius: 2.4,
        perTurn: 12,
        rise: 1.05,
        make: i => desk(i, { scale: 0.36, twoSided: true })
      }),
      camera: { rx: 16, ry: 0, fov: 18, pad: 0.04, frame: [7.4, 4.9], frameCenter: [0, -0.3, 0] },
      background: solid(NIGHT),
      depth: { amount: 0.14, focus: { point: [0, 0, 2.4] } },
      light: flat,
      motion: { kind: 'carousel', duration: 32, intensity: 0.5 },
      finish: dim()
    }
  },
  {
    id: 'globe',
    name: 'Globe',
    group: 'galleries',
    hero: ['duration', 'tilt', 'depth'],
    doc: {
      devices: globe({ n: 18, radius: 3.2, make: i => desk(i, { scale: 0.5, twoSided: true }) }),
      camera: { rx: 10, ry: 0, fov: 30, pad: 0.04, frame: [7.4, 6.6], frameCenter: [0, 0, 1.6] },
      background: solid(VOID),
      depth: { amount: 0.1, focus: { point: [0, 0, 3.2] } },
      light: flat,
      motion: { kind: 'carousel', duration: 40, intensity: 0.5 },
      finish: dim()
    }
  },
  {
    id: 'globe-light',
    name: 'Globe, light',
    group: 'galleries',
    hero: ['duration', 'tilt', 'depth'],
    doc: {
      devices: globe({ n: 18, radius: 3.2, make: i => desk(i, { scale: 0.5, twoSided: true }) }),
      camera: { rx: -8, ry: 0, fov: 30, pad: 0.04, frame: [7.4, 6.6], frameCenter: [0, 0, 1.6] },
      background: white(),
      depth: { amount: 0.08, focus: { point: [0, 0, 3.2] } },
      light: flat,
      motion: { kind: 'carousel', duration: 40, intensity: 0.5 },
      finish: clean
    }
  },
  {
    id: 'cover-flow',
    name: 'Cover flow',
    group: 'galleries',
    hero: ['duration', 'tilt', 'depth'],
    doc: {
      devices: stackOf(9, i => browser(i, 'dark')),
      camera: { rx: 6, ry: 0, fov: 30, pad: 0.02, frame: [6.6, 3.1], frameCenter: [0, 0, 0] },
      background: solid(INK),
      depth: { amount: 0.2 },
      light: flat,
      motion: { kind: 'coverflow', duration: 18, intensity: 0.5 },
      finish: dim()
    }
  },
  {
    id: 'cover-flow-light',
    name: 'Cover flow, light',
    group: 'galleries',
    hero: ['duration', 'tilt', 'depth'],
    doc: {
      devices: stackOf(9, i => desk(i)),
      camera: { rx: 4, ry: 0, fov: 30, pad: 0.02, frame: [6.6, 3], frameCenter: [0, 0, 0] },
      background: white(),
      depth: { amount: 0.16 },
      light: { shadow: 0.35, softness: 0.9, distance: 0.12 },
      motion: { kind: 'coverflow', duration: 18, intensity: 0.5 },
      finish: clean
    }
  },
  {
    id: 'phone-flow',
    name: 'Phone flow',
    group: 'galleries',
    hero: ['duration', 'tilt', 'reflection'],
    doc: {
      devices: stackOf(9, i => handset(i, PHONES[i % PHONES.length])),
      camera: { rx: 4, ry: 0, fov: 28, pad: 0.02, frame: [3.6, 2], frameCenter: [0, 0, 0] },
      background: studio(DARK_STUDIO, { light: 0.55, pool: 0.9 }),
      light: { shadow: 0.6, softness: 0.8, height: 66, angle: -12, reflection: 0.32 },
      motion: { kind: 'coverflow', duration: 16, intensity: 0.5 },
      finish: dim({ vignette: 0.34 })
    }
  },
  {
    id: 'dial',
    name: 'Dial',
    group: 'galleries',
    hero: ['duration', 'tilt', 'bgColor'],
    doc: {
      devices: Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * 360;
        const a = (angle * Math.PI) / 180;
        return { ...desk(i, { scale: 0.62 }), x: Math.sin(a) * 4.8, y: Math.cos(a) * 4.8, z: 0, rz: -angle };
      }),
      camera: { rx: 8, ry: -12, fov: 30, pad: 0.02, frame: [11, 10.6], frameCenter: [0, 0, 0] },
      background: solid(COAL),
      light: { shadow: 0.4, softness: 0.85, distance: 0.1 },
      motion: { kind: 'carousel', axis: 'z', duration: 30, intensity: 0.5 },
      finish: dim()
    }
  },
  {
    id: 'tablet-flow',
    name: 'Tablet flow',
    group: 'galleries',
    hero: ['duration', 'tilt', 'depth'],
    doc: {
      devices: stackOf(7, i => screen(i, { type: 'tablet', finish: i % 2 ? 'silver' : 'black', layer: 'set' })),
      camera: { rx: 6, ry: 0, fov: 30, pad: 0.02, frame: [5.6, 2.8], frameCenter: [0, 0, 0] },
      background: solid(NIGHT, { spot: 0.14 }),
      depth: { amount: 0.18 },
      light: flat,
      motion: { kind: 'coverflow', duration: 16, intensity: 0.5 },
      finish: dim()
    }
  },
  {
    id: 'ticker',
    name: 'Ticker',
    group: 'galleries',
    hero: ['duration', 'roll', 'depth'],
    doc: {
      devices: rows({ rows: 4, cols: 7, w: 2.24, h: 1.4, gap: 0.28, make: i => desk(i, { scale: 0.7 }) }),
      camera: { rx: 22, ry: -18, rz: 8, fov: 30, pad: 0, frame: [8.6, 5], frameCenter: [0, 0, 0] },
      background: solid(VOID),
      depth: { amount: 0.24 },
      light: flat,
      motion: { kind: 'flow', axis: 'x', duration: 28, intensity: 0.3 },
      finish: dim()
    }
  },
  {
    id: 'ticker-light',
    name: 'Ticker, light',
    group: 'galleries',
    hero: ['duration', 'roll', 'depth'],
    doc: {
      devices: rows({ rows: 4, cols: 9, w: 2.24, h: 1.4, gap: 0.28, make: i => desk(i, { scale: 0.7 }) }),
      camera: { rx: -18, ry: 20, rz: -8, fov: 30, pad: 0, frame: [8.6, 5], frameCenter: [0, 0, 0] },
      background: white(),
      depth: { amount: 0.2 },
      light: flat,
      motion: { kind: 'flow', axis: 'x', duration: 28, intensity: 0.3 },
      finish: clean
    }
  },
  {
    id: 'app-ticker',
    name: 'App ticker',
    group: 'galleries',
    hero: ['duration', 'roll', 'depth'],
    doc: {
      devices: rows({ rows: 3, cols: 13, w: 0.768, h: 1.664, gap: 0.22, make: i => app(i) }),
      camera: { rx: 14, ry: 0, rz: -12, fov: 30, pad: 0, frame: [6.4, 3.6], frameCenter: [0, 0, 0] },
      background: solid(NIGHT),
      depth: { amount: 0.16 },
      light: flat,
      motion: { kind: 'flow', axis: 'x', duration: 22, intensity: 0.3 },
      finish: dim()
    }
  },
  {
    id: 'columns',
    name: 'Columns',
    group: 'galleries',
    hero: ['duration', 'roll', 'depth'],
    doc: {
      devices: columns({ cols: 9, count: 6, w: 0.768, h: 1.664, gap: 0.2, make: i => app(i) }),
      camera: { rx: 8, ry: 0, rz: -10, fov: 30, pad: 0, frame: [4.6, 4.2], frameCenter: [0, 0, 0] },
      background: solid(INK),
      depth: { amount: 0.12 },
      light: flat,
      motion: { kind: 'flow', axis: 'y', duration: 24, intensity: 0.3 },
      finish: dim()
    }
  },
  {
    id: 'columns-light',
    name: 'Columns, light',
    group: 'galleries',
    hero: ['duration', 'roll', 'depth'],
    doc: {
      devices: columns({ cols: 9, count: 6, w: 0.768, h: 1.664, gap: 0.2, make: i => app(i) }),
      camera: { rx: -8, ry: 14, rz: 10, fov: 30, pad: 0, frame: [4.6, 4.2], frameCenter: [0, 0, 0] },
      background: white(),
      depth: { amount: 0.12 },
      light: flat,
      motion: { kind: 'flow', axis: 'y', duration: 24, intensity: 0.3 },
      finish: clean
    }
  },
  {
    id: 'waterfall',
    name: 'Waterfall',
    group: 'galleries',
    hero: ['duration', 'roll', 'depth'],
    doc: {
      devices: columns({ cols: 5, count: 8, w: 2.24, h: 1.4, gap: 0.26, make: i => desk(i, { scale: 0.7 }) }),
      camera: { rx: 18, ry: -22, rz: 26, fov: 30, pad: 0, frame: [7.4, 4.6], frameCenter: [0, 0, 0] },
      background: solid(COAL),
      depth: { amount: 0.26 },
      light: flat,
      motion: { kind: 'flow', axis: 'y', duration: 24, intensity: 0.3 },
      finish: dim()
    }
  },
  {
    id: 'phone-columns',
    name: 'Phone columns',
    group: 'galleries',
    hero: ['duration', 'roll', 'reflection'],
    doc: {
      devices: columns({
        cols: 4,
        count: 6,
        w: 0.744,
        h: 1.553,
        gap: 0.32,
        make: (i, c) => handset(i, PHONES[(c * 2 + i) % PHONES.length])
      }),
      camera: { rx: 12, ry: -10, rz: -10, fov: 28, pad: 0, frame: [3.6, 3.2], frameCenter: [0, 0, 0] },
      background: solid(['#0a0a0c', '#1a1a1f', '#000000', '#000000'], { spot: 0.12 }),
      depth: { amount: 0.14 },
      light: flat,
      motion: { kind: 'flow', axis: 'y', duration: 22, intensity: 0.3 },
      finish: dim()
    }
  },
  {
    id: 'film-strip',
    name: 'Film strip',
    group: 'galleries',
    hero: ['duration', 'turn', 'depth'],
    doc: {
      devices: rows({ rows: 1, cols: 9, w: 2.56, h: 1.6, gap: 0.4, make: i => desk(i, { scale: 0.8 }) }),
      camera: { rx: 4, ry: -24, fov: 30, pad: 0, frame: [7.4, 2.6], frameCenter: [0, 0, 0] },
      background: solid(NIGHT, { spot: 0.14 }),
      depth: { amount: 0.3 },
      light: flat,
      motion: { kind: 'flow', axis: 'x', duration: 24, intensity: 0.3 },
      finish: dim()
    }
  },
  {
    id: 'stream',
    name: 'Stream',
    group: 'galleries',
    hero: ['duration', 'turn', 'depth'],
    doc: {
      devices: rows({ rows: 1, cols: 9, w: 3.2, h: 2.1, gap: 0.5, make: i => browser(i, 'light') }),
      camera: { rx: 6, ry: 38, fov: 34, pad: 0, frame: [7.6, 3], frameCenter: [0, 0, 0] },
      background: white(),
      depth: { amount: 0.16 },
      light: { shadow: 0.35, softness: 0.9, distance: 0.12 },
      motion: { kind: 'flow', axis: 'x', duration: 26, intensity: 0.3 },
      finish: clean
    }
  },
  {
    id: 'tunnel',
    name: 'Tunnel',
    group: 'galleries',
    hero: ['duration', 'fov', 'depth'],
    doc: {
      devices: tunnel({
        length: 10,
        w: 1.76,
        h: 1.1,
        gap: 0.24,
        width: 2.2,
        height: 1.2,
        make: i => desk(i, { scale: 0.55 })
      }),
      camera: { rx: 0, ry: 0, fov: 66, pad: 0, frame: [2.1, 1.18], frameCenter: [0, 0, -5] },
      background: solid(VOID),
      depth: { amount: 0.12 },
      light: flat,
      motion: { kind: 'flow', axis: 'z', fade: true, duration: 16, intensity: 0.3 },
      finish: dim({ vignette: 0.4 })
    }
  },
  {
    id: 'tunnel-light',
    name: 'Light tunnel',
    group: 'galleries',
    hero: ['duration', 'fov', 'depth'],
    doc: {
      devices: tunnel({
        length: 10,
        w: 1.76,
        h: 1.1,
        gap: 0.24,
        width: 2.2,
        height: 1.2,
        make: i => desk(i, { scale: 0.55 })
      }),
      camera: { rx: 0, ry: 8, fov: 66, pad: 0, frame: [2.1, 1.18], frameCenter: [0, 0, -5] },
      background: white(),
      depth: { amount: 0.1 },
      light: flat,
      motion: { kind: 'flow', axis: 'z', fade: true, duration: 16, intensity: 0.3 },
      finish: clean
    }
  },
  {
    id: 'shuffle',
    name: 'Shuffle',
    group: 'galleries',
    hero: ['duration', 'turn', 'depth'],
    doc: {
      devices: stackOf(6, i => desk(i)),
      camera: { rx: 10, ry: -20, fov: 30, pad: 0.04, frame: [10.8, 4.6], frameCenter: [0, 0.2, -0.6] },
      background: solid(NIGHT, { spot: 0.16 }),
      depth: { amount: 0.2 },
      light: { shadow: 0.5, softness: 0.85, distance: 0.12 },
      motion: { kind: 'shuffle', duration: 12, intensity: 0.5 },
      finish: dim()
    }
  },
  {
    id: 'phone-shuffle',
    name: 'Phone shuffle',
    group: 'galleries',
    hero: ['duration', 'turn', 'bgColor'],
    doc: {
      devices: stackOf(5, i => handset(i, PHONES[i % PHONES.length])),
      camera: { rx: 8, ry: -18, fov: 28, pad: 0.04, frame: [3.4, 2.4], frameCenter: [0, 0.1, -0.2] },
      background: white(),
      light: { shadow: 0.45, softness: 0.85, distance: 0.14 },
      motion: { kind: 'shuffle', duration: 10, intensity: 0.5 },
      finish: clean
    }
  },
  {
    id: 'deck',
    name: 'Deck',
    group: 'galleries',
    hero: ['duration', 'depth', 'turn'],
    doc: {
      devices: stackOf(8, i => browser(i, i % 2 ? 'light' : 'dark')),
      camera: { rx: 4, ry: -34, fov: 34, pad: 0.04, frame: [10.4, 4.6], frameCenter: [0, 0.3, -1.2] },
      background: solid(COAL),
      depth: { amount: 0.25 },
      light: { shadow: 0.45, softness: 0.85, distance: 0.1 },
      motion: { kind: 'shuffle', duration: 16, intensity: 0.5 },
      finish: dim()
    }
  },
  {
    id: 'card-fan',
    name: 'Card fan',
    group: 'galleries',
    hero: ['duration', 'intensity', 'bgColor'],
    doc: {
      devices: stackOf(7, i => app(i, { scale: 0.3 })),
      camera: { rx: 4, ry: 0, fov: 28, pad: 0.04, frame: [5.4, 3.2], frameCenter: [0, -0.15, 0] },
      background: solid(['#0c0c0f', '#1c1c22', '#000000', '#000000'], { spot: 0.14 }),
      light: { shadow: 0.5, softness: 0.85, distance: 0.12 },
      motion: { kind: 'fan', duration: 8, intensity: 0.5 },
      finish: dim()
    }
  },
  {
    id: 'phone-fan',
    name: 'Phone fan',
    group: 'galleries',
    hero: ['duration', 'intensity', 'bgColor'],
    doc: {
      devices: stackOf(5, i => handset(i, PHONES[i % PHONES.length])),
      camera: { rx: 4, ry: 0, fov: 26, pad: 0.04, frame: [3.6, 2.3], frameCenter: [0, -0.1, 0] },
      background: white(),
      light: { shadow: 0.45, softness: 0.85, distance: 0.14 },
      motion: { kind: 'fan', duration: 8, intensity: 0.5 },
      finish: clean
    }
  },
  {
    id: 'spread',
    name: 'Spread',
    group: 'galleries',
    hero: ['duration', 'turn', 'depth'],
    doc: {
      devices: grid({ rows: 3, cols: 3, w: 2.56, h: 1.6, gap: 0.3, make: i => desk(i, { scale: 0.8 }) }),
      camera: { rx: 8, ry: -12, fov: 30, pad: 0.06 },
      background: solid(NIGHT, { spot: 0.14 }),
      light: { shadow: 0.45, softness: 0.85, distance: 0.1 },
      motion: { kind: 'spread', duration: 10, intensity: 0.5 },
      finish: dim()
    }
  },
  {
    id: 'ripple',
    name: 'Ripple',
    group: 'galleries',
    hero: ['duration', 'intensity', 'depth'],
    doc: {
      devices: grid({ rows: 4, cols: 6, w: 1.92, h: 1.2, gap: 0.24, make: i => desk(i, { scale: 0.6 }) }),
      camera: { rx: 28, ry: -24, fov: 30, pad: 0, zoom: 1.18 },
      background: solid(VOID),
      depth: { amount: 0.3 },
      light: flat,
      motion: { kind: 'wave', duration: 8, intensity: 0.5 },
      finish: dim()
    }
  },
  {
    id: 'phone-wave',
    name: 'Phone wave',
    group: 'galleries',
    hero: ['duration', 'intensity', 'turn'],
    doc: {
      devices: lineup(7, 0.96, i => handset(i, PHONES[i % PHONES.length])),
      camera: { rx: 6, ry: -26, fov: 28, pad: 0.08 },
      background: white(),
      light: { shadow: 0.45, softness: 0.85, distance: 0.14, angle: -20 },
      motion: { kind: 'wave', duration: 7, intensity: 0.5 },
      finish: clean
    }
  },
  {
    id: 'wall-light',
    name: 'Wall, light',
    group: 'galleries',
    hero: ['shift', 'shiftAmount', 'depth'],
    doc: {
      devices: rows({ rows: 3, cols: 6, w: 3.2, h: 2, gap: 0.32, offset: 0.25, make: i => desk(i) }),
      camera: { rx: -20, ry: 26, rz: -5, fov: 30, pad: 0, frame: [9.6, 5.4], frameCenter: [0, 0, 0] },
      background: white(),
      depth: { amount: 0.25 },
      light: { shadow: 0.4, softness: 0.85, distance: 0.08 },
      motion: { kind: 'pan', duration: 14, intensity: 0.4, shift: 'sway', shiftAmount: 0.5 },
      finish: clean
    }
  },
  {
    id: 'moving-wall',
    name: 'Moving wall',
    group: 'galleries',
    hero: ['duration', 'roll', 'depth'],
    doc: {
      devices: rows({ rows: 3, cols: 9, w: 3.2, h: 2, gap: 0.32, offset: 0.4, make: i => desk(i) }),
      camera: { rx: -16, ry: 30, rz: -6, fov: 30, pad: 0, frame: [9.6, 5.4], frameCenter: [0, 0, 0] },
      background: white(),
      depth: { amount: 0.35 },
      light: flat,
      motion: { kind: 'flow', axis: 'x', duration: 32, intensity: 0.3 },
      finish: clean
    }
  },
  {
    id: 'phone-steps',
    name: 'Phone steps',
    group: 'galleries',
    hero: ['duration', 'tilt', 'shadow'],
    doc: {
      devices: ring({ n: 7, radius: 1.75, make: i => handset(i, PHONES[i % PHONES.length]) }),
      camera: { rx: 7, ry: 0, fov: 26, pad: 0.04, frame: [3.4, 2], frameCenter: [0, 0, 1.75] },
      background: white(),
      light: { shadow: 0.45, softness: 0.9, receiver: 'floor', height: 70, angle: -16 },
      motion: { kind: 'carousel-step', duration: 16, intensity: 0.5 },
      finish: clean
    }
  },
  {
    id: 'orbiters',
    name: 'Orbiters',
    group: 'galleries',
    hero: ['duration', 'tilt', 'bgColor'],
    doc: {
      devices: [
        { type: 'browser', finish: 'light', slot: 2, layer: 'set' },
        ...[0, 90, 180, 270].map((phase, i) =>
          app(i + 1, { scale: 0.22, orbit: { radius: 2.6, y: 0, phase, bob: 0.12 } })
        )
      ],
      camera: { rx: 10, ry: 0, fov: 30, pad: 0.04, frame: [7.6, 4], frameCenter: [0, 0, 0.6] },
      background: white(),
      light: { shadow: 0.4, softness: 0.85, distance: 0.12 },
      motion: { kind: 'satellites', duration: 16, intensity: 0.4 },
      finish: clean
    }
  },
  {
    id: 'tablet-ring',
    name: 'Tablet ring',
    group: 'galleries',
    hero: ['duration', 'tilt', 'shadow'],
    doc: {
      devices: ring({
        n: 8,
        radius: 4,
        make: i => screen(i, { type: 'tablet', finish: i % 2 ? 'black' : 'silver', layer: 'set' })
      }),
      camera: { rx: 12, ry: 0, fov: 30, pad: 0.04, frame: [8.2, 3.8], frameCenter: [0, 0, 2.2] },
      background: white(),
      depth: { amount: 0.18 },
      light: { shadow: 0.4, softness: 0.9, receiver: 'floor', lift: 0.4, height: 70, angle: -10 },
      motion: { kind: 'carousel', duration: 24, intensity: 0.5 },
      finish: clean
    }
  },
  {
    id: 'phone-helix',
    name: 'Phone helix',
    group: 'galleries',
    hero: ['duration', 'tilt', 'depth'],
    doc: {
      devices: helix({ n: 18, radius: 2.3, perTurn: 9, rise: 2, make: i => app(i, { twoSided: true }) }),
      camera: { rx: 12, ry: 0, fov: 20, pad: 0.04, frame: [7.2, 6.8], frameCenter: [0, -0.45, 0] },
      background: solid(INK),
      depth: { amount: 0.16, focus: { point: [0, 0, 2.3] } },
      light: flat,
      motion: { kind: 'carousel', duration: 22, intensity: 0.5 },
      finish: dim()
    }
  },
  {
    id: 'phone-spin-ring',
    name: 'Halo',
    group: 'galleries',
    hero: ['duration', 'tilt', 'depth'],
    doc: {
      devices: ring({ n: 14, radius: 3.4, make: i => app(i, { scale: 0.26, twoSided: true }) }),
      camera: { rx: 30, ry: 0, rz: 8, fov: 30, pad: 0.02, frame: [7.4, 4.4], frameCenter: [0, -0.2, 1] },
      background: solid(NIGHT),
      depth: { amount: 0.16 },
      light: flat,
      motion: { kind: 'carousel', duration: 26, intensity: 0.5 },
      finish: dim()
    }
  }
];
