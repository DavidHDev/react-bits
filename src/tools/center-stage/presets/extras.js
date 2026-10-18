import { COAL, DARK_STUDIO, INK, NIGHT, lineup, ring, screen, solid, spotlight, studio, white } from './shared';

const floor = (extra = {}) => ({ shadow: 0.6, softness: 0.75, height: 64, angle: -26, receiver: 'floor', ...extra });
const clean = { grain: 0, vignette: 0 };
const dim = (extra = {}) => ({ grain: 0.1, vignette: 0.28, ...extra });

const DEVICES = [
  {
    id: 'top-down',
    name: 'Top down',
    hero: ['tilt', 'turn', 'shadow'],
    doc: {
      devices: [{ type: 'laptop', finish: 'silver', slot: 2, open: 118 }],
      camera: { rx: 56, ry: -14, fov: 28, pad: 0.12 },
      background: white(),
      light: floor({ height: 70 }),
      motion: { kind: 'drift', duration: 10, intensity: 0.25 },
      finish: clean
    }
  },
  {
    id: 'profile',
    name: 'Profile',
    hero: ['turn', 'reflection', 'bgColor'],
    doc: {
      devices: [{ type: 'laptop', finish: 'black', slot: 0, open: 112 }],
      camera: { rx: 4, ry: 74, fov: 30, pad: 0.12 },
      background: studio(DARK_STUDIO, { light: 0.6 }),
      light: { shadow: 0.7, softness: 0.7, height: 60, angle: 40, reflection: 0.25 },
      motion: { kind: 'drift', duration: 10, intensity: 0.3 },
      finish: dim({ vignette: 0.32 })
    }
  },
  {
    id: 'closed-lid',
    name: 'Closed lid',
    hero: ['turn', 'tilt', 'shadow'],
    doc: {
      devices: [
        { type: 'laptop', finish: 'silver', slot: 0, open: 0 },
        { type: 'phone', finish: 'natural', slot: 1, rx: -90, x: 0.55, y: 0.0955, z: 1.2, ry: 16, rest: true }
      ],
      camera: { rx: 42, ry: -12, fov: 28, pad: 0.14 },
      background: white(),
      light: floor({ height: 66 }),
      motion: { kind: 'drift', duration: 10, intensity: 0.25 },
      finish: clean
    }
  },
  {
    id: 'workspace',
    name: 'Workspace',
    hero: ['turn', 'tilt', 'shadow'],
    doc: {
      devices: [
        { type: 'monitor', finish: 'silver', slot: 0 },
        { type: 'laptop', finish: 'silver', slot: 2, x: -4.4, y: -2.851, z: 1.7, ry: 22 },
        { type: 'phone', finish: 'natural', slot: 1, x: 3.7, y: -2.189, z: 1.1, ry: -18, rx: -12 }
      ],
      camera: { rx: 8, ry: -6, fov: 30, pad: 0.06 },
      background: white(),
      light: floor({ angle: -20 }),
      motion: { kind: 'drift', duration: 12, intensity: 0.25 },
      finish: clean
    }
  },
  {
    id: 'lineup',
    name: 'Lineup',
    hero: ['turn', 'tilt', 'shadow'],
    doc: {
      devices: lineup(5, 0.95, i => ({
        type: 'phone',
        finish: ['natural', 'black', 'burgundy', 'glacier', 'orange'][i],
        slot: 1
      })),
      camera: { rx: 4, ry: 0, fov: 24, pad: 0.1 },
      background: white(),
      light: floor({ angle: -14 }),
      motion: { kind: 'float', duration: 8, intensity: 0.3 },
      finish: clean
    }
  },
  {
    id: 'back-side',
    name: 'Back side',
    hero: ['turn', 'reflection', 'bgColor'],
    doc: {
      devices: [{ type: 'phone', finish: 'burgundy', slot: 1, ry: 154 }],
      camera: { rx: 4, ry: 0, fov: 24, pad: 0.14 },
      background: studio(['#111113', '#17171a', '#ffffff', '#ffffff'], { light: 0.6, pool: 0.8 }),
      light: { shadow: 0.7, softness: 0.7, height: 66, angle: -12, reflection: 0.28 },
      motion: { kind: 'sway', duration: 9, intensity: 0.3 },
      finish: dim({ vignette: 0.32 })
    }
  },
  {
    id: 'dual-display',
    name: 'Dual display',
    hero: ['turn', 'tilt', 'bgColor'],
    doc: {
      devices: [
        { type: 'monitor', finish: 'silver', slot: 0, x: -3.32, ry: 10, z: 0.3 },
        { type: 'monitor', finish: 'silver', slot: 2, x: 3.32, ry: -10, z: 0.3 }
      ],
      camera: { rx: 6, ry: 0, fov: 30, pad: 0.06 },
      background: studio(DARK_STUDIO, { light: 0.55 }),
      light: { shadow: 0.7, softness: 0.7, height: 62, angle: -18, reflection: 0.15 },
      motion: { kind: 'drift', duration: 12, intensity: 0.25 },
      finish: dim()
    }
  },
  {
    id: 'laptop-tablet',
    name: 'Laptop and tablet',
    hero: ['turn', 'bgColor', 'shadow'],
    doc: {
      devices: [
        { type: 'laptop', finish: 'silver', slot: 0, x: -0.9 },
        { type: 'tablet', finish: 'silver', slot: 2, alignX: 0, x: 2.5, y: 0.79, z: 0.7, rx: -12, ry: -22 }
      ],
      camera: { rx: 10, ry: -16, fov: 28, pad: 0.1 },
      background: white(),
      light: floor({ angle: -22 }),
      motion: { kind: 'drift', duration: 10, intensity: 0.3 },
      finish: clean
    }
  },
  {
    id: 'tablet-portrait',
    name: 'Tablet portrait',
    hero: ['turn', 'tilt', 'bgColor'],
    doc: {
      devices: [{ type: 'tablet', finish: 'black', pick: 0, orientation: 'portrait', ry: -16, rz: 2 }],
      camera: { rx: 6, ry: 0, fov: 28, pad: 0.12 },
      background: white(),
      light: { shadow: 0.5, softness: 0.8, distance: 0.16, angle: -18 },
      motion: { kind: 'float', duration: 8, intensity: 0.35 },
      finish: clean
    }
  },
  {
    id: 'wide-open',
    name: 'Wide open',
    hero: ['turn', 'tilt', 'reflection'],
    doc: {
      devices: [{ type: 'laptop', finish: 'black', slot: 0, open: 132 }],
      camera: { rx: 4, ry: -42, fov: 38, pad: 0.1 },
      background: studio(DARK_STUDIO, { light: 0.6 }),
      light: { shadow: 0.7, softness: 0.7, height: 60, angle: -30, reflection: 0.22 },
      motion: { kind: 'crane', duration: 12, intensity: 0.2 },
      finish: dim()
    }
  },
  {
    id: 'lens',
    name: 'Lens',
    hero: ['depth', 'zoom', 'turn'],
    doc: {
      devices: [{ type: 'phone', finish: 'natural', slot: 1, ry: 196, rx: 8 }],
      camera: { rx: 10, ry: -6, rz: -6, fov: 30, zoom: 2.6, target: { device: 0, u: 0.78, v: 0.12 } },
      background: solid(['#0b0b0d', '#1b1b20', '#000000', '#000000']),
      depth: { amount: 0.55 },
      light: { shadow: 0.45, softness: 0.75, distance: 0.1 },
      motion: { kind: 'drift', duration: 9, intensity: 0.3 },
      finish: dim()
    }
  }
].map(preset => ({ ...preset, group: 'devices' }));

const MOTION = [
  {
    id: 'laptop-turntable',
    name: 'Laptop turntable',
    hero: ['duration', 'tilt', 'reflection'],
    doc: {
      devices: [{ type: 'laptop', finish: 'silver', slot: 2 }],
      camera: { rx: 14, ry: 0, fov: 28, pad: 0.16 },
      background: white(),
      light: floor({ angle: -10, reflection: 0.1 }),
      motion: { kind: 'turntable', duration: 12, intensity: 0.5 },
      finish: clean
    }
  },
  {
    id: 'display-turntable',
    name: 'Display turntable',
    hero: ['duration', 'tilt', 'reflection'],
    doc: {
      devices: [{ type: 'monitor', finish: 'silver', slot: 0 }],
      camera: { rx: 6, ry: 0, fov: 28, pad: 0.14 },
      background: studio(DARK_STUDIO, { light: 0.6, pool: 0.9 }),
      light: { shadow: 0.7, softness: 0.7, height: 66, angle: -10, reflection: 0.25 },
      motion: { kind: 'turntable', duration: 14, intensity: 0.5 },
      finish: dim({ vignette: 0.32 })
    }
  },
  {
    id: 'tablet-flip',
    name: 'Tablet flip',
    hero: ['duration', 'turn', 'bgColor'],
    doc: {
      devices: [{ type: 'tablet', finish: 'silver', slot: 2, alignX: 0 }],
      camera: { rx: 6, ry: -8, fov: 26, pad: 0.15 },
      background: white(),
      light: { shadow: 0.5, softness: 0.8, distance: 0.2, height: 62, angle: -24 },
      motion: { kind: 'flip', duration: 8, intensity: 0.5 },
      finish: clean
    }
  },
  {
    id: 'push',
    name: 'Push',
    hero: ['duration', 'intensity', 'bgColor'],
    doc: {
      devices: [{ type: 'phone', finish: 'black', slot: 1, ry: -20, rz: 3 }],
      camera: { rx: 5, ry: 0, fov: 26, pad: 0.12 },
      background: spotlight(['#09090b', '#26262e', '#000000', '#000000'], { spotCenter: [0.5, 0.55], spotSize: 0.5 }),
      depth: { amount: 0.15 },
      light: { shadow: 0.5, softness: 0.8, distance: 0.12, angle: -28 },
      motion: { kind: 'push', duration: 7, intensity: 0.5 },
      finish: dim()
    }
  },
  {
    id: 'vertigo',
    name: 'Vertigo',
    hero: ['duration', 'intensity', 'reflection'],
    doc: {
      devices: [{ type: 'laptop', finish: 'black', slot: 0, ry: -20 }],
      camera: { rx: 8, ry: 0, fov: 22, pad: 0.28 },
      background: studio(DARK_STUDIO, { light: 0.6 }),
      light: { shadow: 0.7, softness: 0.7, height: 62, angle: -20, reflection: 0.2 },
      motion: { kind: 'dolly', duration: 9, intensity: 0.5 },
      finish: dim()
    }
  },
  {
    id: 'spiral-trio',
    name: 'Spiral trio',
    hero: ['duration', 'intensity', 'bgColor'],
    doc: {
      devices: [
        { type: 'phone', finish: 'silver', slot: 1, x: -0.92, z: -0.5, ry: 14 },
        { type: 'phone', finish: 'black', slot: 1, x: 0, z: 0.2, scale: 1.04 },
        { type: 'phone', finish: 'glacier', slot: 1, x: 0.92, z: -0.5, ry: -14 }
      ],
      camera: { rx: 4, ry: 0, fov: 28, pad: 0.14 },
      background: white(),
      light: { shadow: 0.5, softness: 0.8, distance: 0.12, height: 64, angle: -16 },
      motion: { kind: 'spiral', duration: 12, intensity: 0.5 },
      finish: clean
    }
  },
  {
    id: 'drift-cards',
    name: 'Drift cards',
    hero: ['duration', 'intensity', 'depth'],
    doc: {
      devices: [
        screen(0, { type: 'card', finish: 'edge', radius: 0.06, viewport: '16:10', x: -1.9, y: 0.8, z: -1.6, ry: 10 }),
        screen(1, { type: 'card', finish: 'edge', radius: 0.06, viewport: '16:10', x: 2.1, y: -0.7, z: -1.1, ry: -9 }),
        screen(2, { type: 'card', finish: 'edge', radius: 0.06, viewport: '16:10' })
      ],
      camera: { rx: 6, ry: -10, fov: 32, pad: 0.08 },
      background: solid(NIGHT, { spot: 0.16 }),
      depth: { amount: 0.3, focus: { device: 2, u: 0.5, v: 0.4 } },
      light: { shadow: 0.5, softness: 0.85, distance: 0.14 },
      motion: { kind: 'float', duration: 9, intensity: 0.5 },
      finish: dim()
    }
  },
  {
    id: 'rack-browsers',
    name: 'Rack focus',
    hero: ['duration', 'depth', 'turn'],
    doc: {
      devices: [
        { type: 'browser', finish: 'dark', slot: 0, x: -2.2, z: 1.4 },
        { type: 'browser', finish: 'light', slot: 2, x: 0.3, z: -0.4 },
        { type: 'browser', finish: 'dark', slot: 0, x: 2.8, z: -2.2, scroll: 0.5 }
      ],
      camera: { rx: 4, ry: 24, fov: 30, pad: 0.08 },
      background: solid(COAL),
      depth: { amount: 0.5, focus: { device: 0, u: 0.5, v: 0.4 }, rack: { device: 2, u: 0.5, v: 0.4 } },
      light: { shadow: 0.45, softness: 0.85, distance: 0.12 },
      motion: { kind: 'rack', duration: 8, intensity: 0.3 },
      finish: dim()
    }
  },
  {
    id: 'laptop-sway',
    name: 'Laptop sway',
    hero: ['duration', 'intensity', 'bgColor'],
    doc: {
      devices: [{ type: 'laptop', finish: 'silver', slot: 0 }],
      camera: { rx: 12, ry: -12, fov: 28, pad: 0.12 },
      background: white(),
      light: floor({ angle: -20 }),
      motion: { kind: 'sway', duration: 10, intensity: 0.35 },
      finish: clean
    }
  },
  {
    id: 'scroll-dark',
    name: 'Scroll, dark',
    hero: ['duration', 'turn', 'bgColor'],
    doc: {
      devices: [{ type: 'browser', finish: 'dark', slot: 0, viewport: '16:9' }],
      camera: { rx: 6, ry: -14, fov: 28, pad: 0.14 },
      background: solid(INK, { spot: 0.14 }),
      light: { shadow: 0.55, softness: 0.8, distance: 0.14, angle: -20 },
      motion: { kind: 'scroll', duration: 10, intensity: 0.3 },
      finish: dim()
    }
  }
].map(preset => ({ ...preset, group: 'motion' }));

const TYPE = [
  {
    id: 'headline-light',
    name: 'Headline, light',
    hero: ['text', 'typeSize', 'turn'],
    doc: {
      devices: [{ type: 'laptop', finish: 'silver', slot: 2 }],
      camera: { rx: 12, ry: -14, fov: 26, pad: 0.24, y: -0.16 },
      type: {
        text: 'Ship it.',
        size: 1,
        color: '#111114',
        opacity: 1,
        position: 'behind',
        depth: 0.3,
        offset: 0.22,
        weight: 760,
        tracking: -0.06
      },
      background: white(),
      light: floor({ angle: -18 }),
      motion: { kind: 'drift', duration: 10, intensity: 0.25 },
      finish: clean
    }
  },
  {
    id: 'big-words',
    name: 'Big words',
    hero: ['text', 'typeSize', 'bgColor'],
    doc: {
      devices: [
        { type: 'phone', finish: 'black', slot: 1, x: -0.62, y: -0.3, ry: 14, rz: -4, scale: 0.86 },
        { type: 'phone', finish: 'silver', slot: 1, x: 0.64, y: -0.36, z: 0.3, ry: -12, rz: 3, scale: 0.86 }
      ],
      camera: { rx: 4, ry: 0, fov: 26, pad: 0.12 },
      type: {
        text: 'Made to\nmove.',
        size: 0.8,
        color: '#ffffff',
        opacity: 0.94,
        position: 'behind',
        depth: 0.3,
        weight: 760,
        leading: 0.86
      },
      depth: { amount: 0.2 },
      background: solid(['#0b0b0e', '#24242c', '#000000', '#000000'], { spot: 0.16 }),
      light: { shadow: 0.55, softness: 0.8, distance: 0.12 },
      motion: { kind: 'float', duration: 8, intensity: 0.35 },
      finish: dim()
    }
  },
  {
    id: 'ring-title',
    name: 'Ring title',
    hero: ['title', 'subtitle', 'duration'],
    doc: {
      devices: ring({
        n: 10,
        radius: 5.9,
        make: i => screen(i, { type: 'card', finish: 'clean', radius: 0.06, viewport: '16:10', layer: 'set' })
      }),
      camera: { rx: 12, ry: 0, fov: 30, pad: 0.02, frame: [8.6, 4.6], frameCenter: [0, -0.2, 5.9] },
      caption: { title: 'Everything you ship', subtitle: 'Collected in one place', position: 'top', align: 'center' },
      background: solid(NIGHT),
      depth: { amount: 0.25 },
      light: { shadow: 0, softness: 0.8 },
      motion: { kind: 'carousel', duration: 26, intensity: 0.5 },
      finish: dim()
    }
  },
  {
    id: 'outline-light',
    name: 'Outline, light',
    hero: ['text', 'typeSize', 'turn'],
    doc: {
      devices: [{ type: 'phone', finish: 'silver', slot: 1 }],
      camera: { rx: 4, ry: -12, fov: 26, pad: 0.12 },
      type: {
        text: 'Mobile',
        size: 1.05,
        color: '#111114',
        opacity: 0.4,
        style: 'outline',
        position: 'behind',
        depth: 0.2,
        weight: 700,
        offset: 0.02
      },
      background: white(),
      light: { shadow: 0.55, softness: 0.8, distance: 0.12 },
      motion: { kind: 'float', duration: 7, intensity: 0.35 },
      finish: clean
    }
  },
  {
    id: 'launch',
    name: 'Launch',
    hero: ['title', 'subtitle', 'duration'],
    doc: {
      devices: lineup(3, 1.05, i => ({ type: 'phone', finish: ['silver', 'black', 'orange'][i], slot: 1 })),
      camera: { rx: 6, ry: -8, fov: 26, pad: 0.1 },
      caption: { title: 'Now on every screen', subtitle: 'Available today', position: 'top', align: 'center' },
      background: white(),
      light: floor({ angle: -18 }),
      motion: { kind: 'drop', duration: 4, intensity: 0.5 },
      finish: clean
    }
  },
  {
    id: 'subtitle',
    name: 'Subtitle',
    hero: ['title', 'turn', 'bgColor'],
    doc: {
      devices: [{ type: 'browser', finish: 'dark', slot: 0, x: -0.4 }],
      camera: { rx: 8, ry: 20, fov: 30, pad: 0.1 },
      caption: {
        title: 'Built for speed',
        subtitle: 'Every page loads in under a second',
        position: 'bottom',
        align: 'left'
      },
      background: solid(['#121215', '#1e1e24', '#000000', '#000000'], { spot: 0.15 }),
      light: { shadow: 0.6, softness: 0.8, distance: 0.12 },
      motion: { kind: 'drift', duration: 9, intensity: 0.3 },
      finish: dim()
    }
  }
].map(preset => ({ ...preset, group: 'type' }));

const SCENES = [
  {
    id: 'daylight',
    name: 'Daylight',
    hero: ['turn', 'bgBlur', 'shadow'],
    doc: {
      devices: [{ type: 'phone', finish: 'glacier', slot: 1, ry: -16 }],
      camera: { rx: 4, ry: 0, fov: 26, pad: 0.16 },
      background: { kind: 'image', image: 'sky-day', colors: ['#cfd8e3', '#ffffff', '#ffffff', '#ffffff'], blur: 0.2 },
      light: { shadow: 0.5, softness: 0.85, distance: 0.16, height: 62, tint: '#1f3550' },
      motion: { kind: 'float', duration: 8, intensity: 0.35 },
      finish: { grain: 0.05, vignette: 0.06 }
    }
  },
  {
    id: 'night-sky',
    name: 'Night sky',
    hero: ['turn', 'bgBlur', 'bgDim'],
    doc: {
      devices: [{ type: 'laptop', finish: 'black', slot: 0 }],
      camera: { rx: 10, ry: -18, fov: 30, pad: 0.14 },
      background: {
        kind: 'image',
        image: 'sky-night',
        colors: ['#05070d', '#ffffff', '#ffffff', '#ffffff'],
        blur: 0.3
      },
      light: { shadow: 0.6, softness: 0.85, distance: 0.16, height: 62 },
      motion: { kind: 'drift', duration: 10, intensity: 0.3 },
      finish: dim({ vignette: 0.2 })
    }
  },
  {
    id: 'glow',
    name: 'Glow',
    hero: ['turn', 'bgDim', 'bgBlur'],
    doc: {
      devices: [{ type: 'phone', finish: 'black', slot: 1, ry: -14 }],
      camera: { rx: 4, ry: 0, fov: 26, pad: 0.14 },
      background: {
        kind: 'ambient',
        slot: 1,
        colors: ['#000000', '#000000', '#000000', '#000000'],
        dim: 0.4,
        blur: 1.2
      },
      light: { shadow: 0.6, softness: 0.85, distance: 0.12 },
      motion: { kind: 'float', duration: 8, intensity: 0.35 },
      finish: dim()
    }
  },
  {
    id: 'cutout',
    name: 'Cutout',
    hero: ['turn', 'tilt', 'shadow'],
    doc: {
      devices: lineup(3, 1.05, i => ({
        type: 'phone',
        finish: ['silver', 'black', 'natural'][i],
        slot: 1,
        ry: (i - 1) * -10
      })),
      camera: { rx: 4, ry: -6, fov: 26, pad: 0.12 },
      background: { kind: 'transparent', colors: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'] },
      light: { shadow: 0.5, softness: 0.85, distance: 0.12 },
      motion: { kind: 'float', duration: 8, intensity: 0.3 },
      finish: clean
    }
  },
  {
    id: 'gloss-floor',
    name: 'Gloss floor',
    hero: ['reflection', 'turn', 'bgColor'],
    doc: {
      devices: [{ type: 'laptop', finish: 'black', slot: 0 }],
      camera: { rx: 8, ry: -24, fov: 30, pad: 0.12 },
      background: studio(['#09090b', '#111114', '#ffffff', '#ffffff'], { light: 0.7, pool: 0.8 }),
      light: { shadow: 0.7, softness: 0.7, height: 64, angle: -20, reflection: 0.6 },
      motion: { kind: 'drift', duration: 10, intensity: 0.3 },
      finish: dim({ vignette: 0.34 })
    }
  },
  {
    id: 'afternoon',
    name: 'Afternoon',
    hero: ['lightAngle', 'softness', 'turn'],
    doc: {
      devices: [{ type: 'laptop', finish: 'silver', slot: 2 }],
      camera: { rx: 16, ry: -18, fov: 30, pad: 0.12 },
      background: white(),
      light: { shadow: 0.55, softness: 0.85, height: 34, angle: -64, receiver: 'floor' },
      motion: { kind: 'drift', duration: 12, intensity: 0.25 },
      finish: clean
    }
  }
].map(preset => ({ ...preset, group: 'scenes' }));

export const EXTRAS = [...DEVICES, ...MOTION, ...TYPE, ...SCENES];
