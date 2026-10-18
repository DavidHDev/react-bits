import { DARK_STUDIO, NIGHT, VOID, grid, lineup, screen, solid, spotlight, studio, white } from './shared';

const floor = (extra = {}) => ({ shadow: 0.6, softness: 0.75, height: 64, angle: -26, receiver: 'floor', ...extra });

export const REVEALS = [
  {
    id: 'open-up',
    name: 'Open up',
    group: 'reveals',
    hero: ['duration', 'turn', 'bgColor'],
    doc: {
      devices: [{ type: 'laptop', finish: 'silver', slot: 0, open: 112 }],
      camera: { rx: 14, ry: -22, fov: 30, pad: 0.12 },
      background: white(),
      light: floor(),
      motion: { kind: 'unfold', duration: 6, intensity: 0.5 },
      finish: { grain: 0, vignette: 0 }
    }
  },
  {
    id: 'open-read',
    name: 'Open and read',
    group: 'reveals',
    poster: 0.3,
    hero: ['duration', 'turn', 'reflection'],
    doc: {
      devices: [{ type: 'laptop', finish: 'black', slot: 0, open: 110 }],
      camera: { rx: 12, ry: -18, fov: 30, pad: 0.12 },
      background: studio(DARK_STUDIO, { light: 0.5 }),
      light: { shadow: 0.7, softness: 0.7, height: 62, angle: -24, reflection: 0.2 },
      motion: { kind: 'unfold-zoom', duration: 12, intensity: 0.5 },
      finish: { grain: 0.08, vignette: 0.26 }
    }
  },
  {
    id: 'open-spin',
    name: 'Open and spin',
    group: 'reveals',
    hero: ['duration', 'tilt', 'reflection'],
    doc: {
      devices: [{ type: 'laptop', finish: 'silver', slot: 2, open: 108 }],
      camera: { rx: 12, ry: 0, fov: 28, pad: 0.16 },
      background: white(),
      light: floor({ angle: -14, reflection: 0.12 }),
      motion: { kind: 'unfold-spin', duration: 8, intensity: 0.5 },
      finish: { grain: 0, vignette: 0 }
    }
  },
  {
    id: 'night-open',
    name: 'Night open',
    group: 'reveals',
    hero: ['duration', 'turn', 'bgColor'],
    doc: {
      devices: [{ type: 'laptop', finish: 'black', slot: 0, open: 114 }],
      camera: { rx: 6, ry: 30, fov: 34, pad: 0.1 },
      background: spotlight(['#08080a', '#26262e', '#000000', '#000000'], { spotCenter: [0.5, 0.7], spotSize: 0.5 }),
      light: { shadow: 0.7, softness: 0.7, height: 60, angle: 24, receiver: 'floor', reflection: 0.15 },
      motion: { kind: 'unfold', duration: 7, intensity: 0.5 },
      finish: { grain: 0.1, vignette: 0.32 }
    }
  },
  {
    id: 'phone-read',
    name: 'Phone read',
    group: 'reveals',
    poster: 0,
    hero: ['duration', 'turn', 'bgColor'],
    doc: {
      devices: [{ type: 'phone', finish: 'natural', slot: 1, ry: -16 }],
      camera: { rx: 6, ry: 0, fov: 26, pad: 0.14 },
      background: white(),
      light: { shadow: 0.55, softness: 0.75, distance: 0.14, height: 62, angle: -20 },
      motion: { kind: 'zoom-scroll', duration: 10, intensity: 0.5 },
      finish: { grain: 0, vignette: 0 }
    }
  },
  {
    id: 'page-read',
    name: 'Page read',
    group: 'reveals',
    poster: 0,
    hero: ['duration', 'turn', 'depth'],
    doc: {
      devices: [{ type: 'browser', finish: 'dark', slot: 0 }],
      camera: { rx: 12, ry: -26, fov: 30, pad: 0.12 },
      background: solid(NIGHT, { spot: 0.16 }),
      light: { shadow: 0.6, softness: 0.75, distance: 0.14, angle: -24 },
      depth: { amount: 0.15 },
      motion: { kind: 'zoom-scroll', duration: 12, intensity: 0.5 },
      finish: { grain: 0.1, vignette: 0.26 }
    }
  },
  {
    id: 'desk-read',
    name: 'Desk read',
    group: 'reveals',
    poster: 0,
    hero: ['duration', 'turn', 'bgColor'],
    doc: {
      devices: [
        { type: 'monitor', finish: 'silver', slot: 2 },
        { type: 'phone', finish: 'natural', slot: 1, x: 3.7, y: -2.189, z: 1.1, ry: -18, rx: -12 }
      ],
      camera: { rx: 7, ry: -18, fov: 28, pad: 0.08 },
      background: white(),
      light: floor({ angle: -24 }),
      motion: { kind: 'zoom-scroll', duration: 12, intensity: 0.5 },
      finish: { grain: 0, vignette: 0 }
    }
  },
  {
    id: 'tablet-read',
    name: 'Tablet read',
    group: 'reveals',
    poster: 0,
    hero: ['duration', 'turn', 'bgColor'],
    doc: {
      devices: [{ type: 'tablet', finish: 'black', slot: 0, alignX: 0, ry: 14 }],
      camera: { rx: 10, ry: 0, fov: 30, pad: 0.14 },
      background: { kind: 'mesh', colors: ['#1b1d22', '#3b4049', '#111215', '#2a2e35'] },
      light: { shadow: 0.6, softness: 0.75, distance: 0.16, angle: 20 },
      motion: { kind: 'zoom-scroll', duration: 11, intensity: 0.5 },
      finish: { grain: 0.1, vignette: 0.24 }
    }
  },
  {
    id: 'screen-on',
    name: 'Screen on',
    group: 'reveals',
    hero: ['duration', 'turn', 'glare'],
    doc: {
      devices: [{ type: 'phone', finish: 'black', slot: 1, ry: -18 }],
      camera: { rx: 4, ry: 0, fov: 24, pad: 0.14 },
      background: solid(VOID, { spot: 0.1 }),
      light: { shadow: 0.5, softness: 0.75, distance: 0.12, height: 60, angle: -30 },
      motion: { kind: 'wake', duration: 5, intensity: 0.5 },
      finish: { grain: 0.1, vignette: 0.3 }
    }
  },
  {
    id: 'wake-up',
    name: 'Wake up',
    group: 'reveals',
    hero: ['duration', 'turn', 'reflection'],
    doc: {
      devices: [{ type: 'laptop', finish: 'black', slot: 0, open: 116 }],
      camera: { rx: 3, ry: -34, fov: 38, pad: 0.1 },
      background: studio(DARK_STUDIO, { light: 0.6 }),
      light: { shadow: 0.7, softness: 0.7, height: 58, angle: -28, reflection: 0.2 },
      motion: { kind: 'wake', duration: 5, intensity: 0.5 },
      finish: { grain: 0.1, vignette: 0.3 }
    }
  },
  {
    id: 'studio-wake',
    name: 'Studio wake',
    group: 'reveals',
    hero: ['duration', 'turn', 'bgColor'],
    doc: {
      devices: [{ type: 'monitor', finish: 'silver', slot: 2 }],
      camera: { rx: 6, ry: 20, fov: 26, pad: 0.1 },
      background: white(),
      light: floor({ angle: 22 }),
      motion: { kind: 'wake', duration: 5, intensity: 0.5 },
      finish: { grain: 0, vignette: 0 }
    }
  },
  {
    id: 'drop-in',
    name: 'Drop in',
    group: 'reveals',
    hero: ['duration', 'bgColor', 'shadow'],
    doc: {
      devices: lineup(3, 1.05, i => ({ type: 'phone', finish: ['silver', 'black', 'orange'][i], slot: 1 })),
      camera: { rx: 6, ry: -10, fov: 26, pad: 0.14 },
      background: white(),
      light: floor({ angle: -18 }),
      motion: { kind: 'drop', duration: 4, intensity: 0.5 },
      finish: { grain: 0, vignette: 0 }
    }
  },
  {
    id: 'touch-down',
    name: 'Touch down',
    group: 'reveals',
    hero: ['duration', 'turn', 'shadow'],
    doc: {
      devices: [{ type: 'laptop', finish: 'silver', slot: 0 }],
      camera: { rx: 12, ry: -24, fov: 30, pad: 0.12 },
      background: white(),
      light: floor(),
      motion: { kind: 'drop', duration: 3.5, intensity: 0.4 },
      finish: { grain: 0, vignette: 0 }
    }
  },
  {
    id: 'land-and-open',
    name: 'Land and open',
    group: 'reveals',
    hero: ['duration', 'turn', 'shadow'],
    doc: {
      devices: [{ type: 'laptop', finish: 'silver', slot: 2, open: 110 }],
      camera: { rx: 15, ry: -26, fov: 30, pad: 0.12 },
      background: white(),
      light: floor({ angle: -24 }),
      motion: { kind: 'drop-open', duration: 6, intensity: 0.4 },
      finish: { grain: 0, vignette: 0 }
    }
  },
  {
    id: 'fly-in',
    name: 'Fly in',
    group: 'reveals',
    hero: ['duration', 'turn', 'bgColor'],
    doc: {
      devices: grid({
        rows: 2,
        cols: 3,
        w: 3.2,
        h: 2,
        gap: 0.34,
        make: i => screen(i, { type: 'card', finish: 'clean', radius: 0.06, viewport: '16:10' })
      }),
      camera: { rx: 8, ry: -12, fov: 30, pad: 0.1 },
      background: white(),
      light: { shadow: 0.5, softness: 0.8, distance: 0.12, angle: -20 },
      motion: { kind: 'fly-in', duration: 5, intensity: 0.5 },
      finish: { grain: 0, vignette: 0 }
    }
  },
  {
    id: 'pop',
    name: 'Pop',
    group: 'reveals',
    hero: ['duration', 'bgColor', 'tilt'],
    doc: {
      devices: grid({
        rows: 2,
        cols: 5,
        w: 0.768,
        h: 1.664,
        gap: 0.22,
        make: i => screen(i, { type: 'card', finish: 'clean', radius: 0.42, viewport: '9:19.5', scale: 0.24 })
      }),
      camera: { rx: 6, ry: -8, fov: 28, pad: 0.12 },
      background: solid(NIGHT, { spot: 0.16 }),
      light: { shadow: 0.55, softness: 0.8, distance: 0.12 },
      motion: { kind: 'pop', duration: 4, intensity: 0.5 },
      finish: { grain: 0.1, vignette: 0.26 }
    }
  },
  {
    id: 'present',
    name: 'Present',
    group: 'reveals',
    hero: ['duration', 'bgColor', 'reflection'],
    doc: {
      devices: [{ type: 'phone', finish: 'burgundy', slot: 1 }],
      camera: { rx: 4, ry: -6, fov: 26, pad: 0.14 },
      background: studio(['#121214', '#18181b', '#ffffff', '#ffffff'], { light: 0.5 }),
      light: { shadow: 0.7, softness: 0.7, height: 62, angle: -20, reflection: 0.3 },
      motion: { kind: 'present', duration: 5, intensity: 0.5 },
      finish: { grain: 0.1, vignette: 0.3 }
    }
  },
  {
    id: 'flip-reveal',
    name: 'Flip reveal',
    group: 'reveals',
    hero: ['duration', 'bgColor', 'turn'],
    doc: {
      devices: [{ type: 'phone', finish: 'orange', slot: 1 }],
      camera: { rx: 4, ry: -10, fov: 24, pad: 0.15 },
      background: white(),
      light: { shadow: 0.5, softness: 0.8, distance: 0.2, height: 62, angle: -24 },
      motion: { kind: 'flip-reveal', duration: 5, intensity: 0.5 },
      finish: { grain: 0, vignette: 0 }
    }
  },
  {
    id: 'assemble',
    name: 'Assemble',
    group: 'reveals',
    hero: ['duration', 'bgColor', 'turn'],
    doc: {
      devices: [-2, -1, 0, 1, 2].map((k, i) => ({
        ...screen(i, { type: 'card', finish: 'clean', radius: 0.42, viewport: '9:19.5', scale: 0.26 }),
        x: k * 0.98,
        y: -Math.abs(k) * 0.12,
        z: -Math.abs(k) * 0.3 - (k > 0 ? 0.06 : 0),
        rz: -k * 6,
        ry: -k * 8
      })),
      camera: { rx: 6, ry: 0, fov: 28, pad: 0.14 },
      background: solid(['#0c0c0f', '#1c1c22', '#000000', '#000000'], { spot: 0.14 }),
      light: { shadow: 0.55, softness: 0.8, distance: 0.12 },
      motion: { kind: 'assemble', duration: 5, intensity: 0.5 },
      finish: { grain: 0.1, vignette: 0.26 }
    }
  }
];
