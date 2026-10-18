const INK = ['#09090b', '#1c1c21', '#2a2a31', '#09090b'];
const PAPER = ['#efede8', '#ffffff', '#f4f2ee', '#e6e3dc'];
const STONE = ['#e2dfd8', '#eeebe5', '#f7f5f1', '#d9d5cd'];
const NIGHT = ['#0d0d10', '#1f1f25', '#000000', '#000000'];
const WHITE = ['#e9e6e0', '#ffffff', '#ffffff', '#ffffff'];
const DARK_STUDIO = ['#121215', '#18181c', '#ffffff', '#ffffff'];
const LIGHT_STUDIO = ['#e3e0da', '#efece6', '#ffffff', '#ffffff'];

const SCROLLS = [0, 0.5, 1, 0.25, 0.75];

const wall = () => {
  const devices = [];
  const cols = 6;
  const rows = 3;
  const w = 3.2;
  const h = 2.0;
  const gap = 0.32;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const i = r * cols + c;
      devices.push({
        type: 'card',
        finish: 'clean',
        pick: i,
        scroll: SCROLLS[i % SCROLLS.length],
        radius: 0.06,
        x: (c - (cols - 1) / 2) * (w + gap) + (r % 2 ? (w + gap) * 0.25 : 0),
        y: ((rows - 1) / 2 - r) * (h + gap),
        z: 0,
        viewport: '16:10',
        layer: 'wall',
        lane: r,
        laneSpacing: w + gap
      });
    }
  }
  return devices;
};

const backWall = () => {
  const devices = [];
  const cols = 5;
  const rows = 5;
  const w = 2.4;
  const h = 1.5;
  const gap = 0.26;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const i = r * cols + c;
      devices.push({
        type: 'card',
        finish: 'clean',
        pick: i + 1,
        scroll: SCROLLS[i % SCROLLS.length],
        radius: 0.05,
        scale: 0.75,
        viewport: '16:10',
        x: (c - (cols - 1) / 2) * (w + gap),
        y: ((rows - 1) / 2 - r) * (h + gap),
        z: -7,
        opacity: 0.6,
        layer: 'back'
      });
    }
  }
  return devices;
};

const mosaic = () => {
  const finishes = ['black', 'silver', 'burgundy', 'black', 'glacier', 'silver', 'black', 'orange', 'silver', 'black'];
  const devices = [];
  for (let c = 0; c < 5; c += 1) {
    for (let r = 0; r < 2; r += 1) {
      devices.push({
        type: 'phone',
        finish: finishes[c * 2 + r],
        slot: 1,
        x: (c - 2) * 0.92,
        y: (0.5 - r) * 1.75 + (c % 2 ? 0.55 : -0.2),
        z: 0,
        layer: 'mosaic'
      });
    }
  }
  return devices;
};

const fan = finishes =>
  [-17, 0, 17].map((angle, index) => {
    const a = (angle * Math.PI) / 180;
    return {
      type: 'phone',
      finish: finishes[index],
      slot: 1,
      x: Math.sin(a) * 2.6,
      y: Math.cos(a) * 2.6 - 2.6,
      z: index === 1 ? 0.12 : 0,
      rz: -angle
    };
  });

export const LEGACY = [
  {
    id: 'center-stage',
    name: 'Center stage',
    group: 'essentials',
    hero: ['turn', 'bgColor', 'shadow'],
    doc: {
      devices: [{ type: 'browser', finish: 'dark', slot: 0 }],
      camera: { rx: 5, ry: -9, fov: 28, pad: 0.16 },
      background: {
        kind: 'spotlight',
        colors: ['#0b0b0e', '#34343f', '#2a2a33', '#0b0b0e'],
        spot: 0.32,
        spotCenter: [0.5, 0.68],
        spotSize: 0.5
      },
      light: { shadow: 0.7, softness: 0.65, distance: 0.12, height: 66, angle: -18, glare: 0.05 },
      motion: { kind: 'drift', duration: 8, intensity: 0.45 },
      finish: { grain: 0.12, vignette: 0.3 }
    }
  },
  {
    id: 'paper',
    name: 'Paper',
    group: 'essentials',
    hero: ['bgColor', 'shadow', 'zoom'],
    doc: {
      devices: [{ type: 'card', finish: 'clean', slot: 2, radius: 0.05 }],
      camera: { fov: 24, pad: 0.15 },
      background: { kind: 'solid', colors: PAPER },
      light: { shadow: 0.5, softness: 0.75, distance: 0.08, height: 70, angle: -8 },
      finish: { grain: 0.06, vignette: 0.05 }
    }
  },
  {
    id: 'graphite',
    name: 'Graphite',
    group: 'essentials',
    hero: ['bgColor', 'shadow', 'zoom'],
    doc: {
      devices: [{ type: 'browser', finish: 'dark', slot: 0 }],
      camera: { fov: 26, pad: 0.15 },
      background: { kind: 'solid', colors: ['#1c1c20', '#28282e', '#2a2a31', '#1c1c20'], spot: 0.12 },
      light: { shadow: 0.75, softness: 0.6, distance: 0.1, height: 72, angle: 0 },
      finish: { grain: 0.1, vignette: 0.22 }
    }
  },
  {
    id: 'float',
    name: 'Float',
    group: 'essentials',
    hero: ['turn', 'tilt', 'bgColor'],
    doc: {
      devices: [{ type: 'card', finish: 'edge', slot: 2, radius: 0.055 }],
      camera: { rx: 9, ry: -15, rz: 1.5, fov: 30, pad: 0.17 },
      background: { kind: 'solid', colors: STONE, spot: 0.18 },
      light: { shadow: 0.55, softness: 0.85, distance: 0.32, height: 60, angle: -24 },
      motion: { kind: 'float', duration: 6, intensity: 0.5 },
      finish: { grain: 0.06, vignette: 0.08 }
    }
  },
  {
    id: 'window',
    name: 'Window',
    group: 'essentials',
    hero: ['bgColor', 'turn', 'shadow'],
    doc: {
      devices: [{ type: 'window', finish: 'light', slot: 2 }],
      camera: { rx: 3, ry: 6, fov: 26, pad: 0.16 },
      background: { kind: 'gradient', colors: ['#dcd9d2', '#ece9e3', '#f6f4f0', '#dcd9d2'], angle: 100 },
      light: { shadow: 0.55, softness: 0.7, distance: 0.12, height: 64, angle: -20 },
      finish: { grain: 0.06, vignette: 0.06 }
    }
  },
  {
    id: 'studio',
    name: 'Studio',
    group: 'essentials',
    hero: ['turn', 'bgColor', 'studioLight'],
    doc: {
      devices: [{ type: 'laptop', finish: 'silver', slot: 0 }],
      camera: { rx: 11, ry: -18, fov: 28, pad: 0.12 },
      background: { kind: 'studio', colors: ['#e6e3dd', '#f1eee8', '#ffffff', '#ffffff'], light: 0.35 },
      light: { shadow: 0.7, softness: 0.55, height: 64, angle: -26 },
      motion: { kind: 'drift', duration: 10, intensity: 0.3 },
      finish: { grain: 0.05, vignette: 0.08 }
    }
  },
  {
    id: 'ink',
    name: 'Ink',
    group: 'essentials',
    hero: ['turn', 'bgColor', 'glare'],
    doc: {
      devices: [{ type: 'phone', finish: 'black', slot: 1, ry: -14 }],
      camera: { rx: 3, fov: 24, pad: 0.13 },
      background: { kind: 'solid', colors: ['#050506', '#151518', '#000000', '#000000'], spot: 0.1 },
      light: { shadow: 0.5, softness: 0.6, distance: 0.1, height: 60, angle: -30 },
      motion: { kind: 'sway', duration: 9, intensity: 0.4 },
      finish: { grain: 0.1, vignette: 0.3 }
    }
  },
  {
    id: 'mist',
    name: 'Mist',
    group: 'essentials',
    hero: ['bgColor', 'bgColor2', 'shadow'],
    doc: {
      devices: [{ type: 'browser', finish: 'light', slot: 2 }],
      camera: { rx: 4, ry: 10, fov: 28, pad: 0.15 },
      background: { kind: 'mesh', colors: ['#e9e7e2', '#f7f6f2', '#dcdad4', '#efede8'] },
      light: { shadow: 0.5, softness: 0.85, distance: 0.18, height: 60, angle: 18 },
      motion: { kind: 'float', duration: 8, intensity: 0.35 },
      finish: { grain: 0.06, vignette: 0.05 }
    }
  },
  {
    id: 'lean',
    name: 'Lean',
    group: 'perspective',
    hero: ['turn', 'tilt', 'depth'],
    doc: {
      devices: [{ type: 'browser', finish: 'dark', slot: 0 }],
      camera: { rx: 10, ry: -26, fov: 32, pad: 0.12 },
      background: { kind: 'gradient', colors: ['#121216', '#1d1d23', '#2b2b33', '#121216'], angle: 120 },
      depth: { amount: 0.12 },
      light: { shadow: 0.7, softness: 0.6, distance: 0.14, height: 60, angle: -30 },
      motion: { kind: 'drift', duration: 8, intensity: 0.4 },
      finish: { grain: 0.1, vignette: 0.24 }
    }
  },
  {
    id: 'rise',
    name: 'Rise',
    group: 'perspective',
    hero: ['tilt', 'fov', 'bgColor'],
    doc: {
      devices: [{ type: 'browser', finish: 'dark', slot: 0 }],
      camera: { rx: -12, ry: 20, rz: -1.5, fov: 44, pad: 0.12 },
      background: {
        kind: 'spotlight',
        colors: ['#0a0a0d', '#2c2c36', '#000000', '#000000'],
        spot: 0.28,
        spotCenter: [0.5, 0.8],
        spotSize: 0.55
      },
      depth: { amount: 0.1 },
      light: { shadow: 0.6, softness: 0.6, distance: 0.16, height: 52, angle: 22 },
      motion: { kind: 'drift', duration: 9, intensity: 0.4 },
      finish: { grain: 0.12, vignette: 0.32 }
    }
  },
  {
    id: 'isometric',
    name: 'Isometric',
    group: 'perspective',
    hero: ['turn', 'zoom', 'bgColor'],
    doc: {
      devices: [{ type: 'card', finish: 'edge', slot: 2, radius: 0.05, rx: -90 }],
      camera: { rx: 38, ry: -42, fov: 12, pad: 0.14 },
      background: { kind: 'solid', colors: ['#ecebe7', '#ffffff', '#ffffff', '#ffffff'] },
      light: { shadow: 0.6, softness: 0.7, receiver: 'floor', lift: 0.1, height: 70, angle: -30 },
      finish: { grain: 0.05, vignette: 0.04 }
    }
  },
  {
    id: 'tabletop',
    name: 'Tabletop',
    group: 'perspective',
    hero: ['turn', 'tilt', 'depth'],
    doc: {
      devices: [{ type: 'card', finish: 'clean', slot: 0, radius: 0.05, rx: -90 }],
      camera: { rx: 32, ry: -18, fov: 34, pad: 0.1, zoom: 1.15 },
      background: { kind: 'solid', colors: ['#e7e4de', '#f2f0eb', '#ffffff', '#ffffff'] },
      depth: { amount: 0.38 },
      light: { shadow: 0.65, softness: 0.7, receiver: 'floor', lift: 0.03, height: 64, angle: -26 },
      motion: { kind: 'drift', duration: 9, intensity: 0.35 },
      finish: { grain: 0.06, vignette: 0.1 }
    }
  },
  {
    id: 'turn',
    name: 'Turn',
    group: 'perspective',
    hero: ['turn', 'bgColor', 'shadow'],
    doc: {
      devices: [{ type: 'browser', finish: 'light', slot: 2 }],
      camera: { rx: 4, ry: 28, fov: 30, pad: 0.13 },
      background: { kind: 'solid', colors: ['#dedad3', '#f2efe9', '#ffffff', '#ffffff'], spot: 0.14 },
      light: { shadow: 0.6, softness: 0.7, distance: 0.14, height: 62, angle: -26 },
      motion: { kind: 'orbit', duration: 10, intensity: 0.3 },
      finish: { grain: 0.05, vignette: 0.06 }
    }
  },
  {
    id: 'low-angle',
    name: 'Low angle',
    group: 'perspective',
    hero: ['tilt', 'turn', 'fov'],
    doc: {
      devices: [{ type: 'laptop', finish: 'black', slot: 0, open: 112 }],
      camera: { rx: 3, ry: -36, fov: 40, pad: 0.1 },
      background: { kind: 'studio', colors: DARK_STUDIO, light: 0.6 },
      light: { shadow: 0.85, softness: 0.4, height: 58, angle: -28, reflection: 0.18 },
      motion: { kind: 'crane', duration: 12, intensity: 0.25 },
      finish: { grain: 0.1, vignette: 0.3 }
    }
  },
  {
    id: 'dutch',
    name: 'Dutch',
    group: 'perspective',
    hero: ['roll', 'turn', 'depth'],
    doc: {
      devices: [{ type: 'browser', finish: 'dark', slot: 0 }],
      camera: { rx: 12, ry: -20, rz: -9, fov: 30, zoom: 1.3, pad: 0.04 },
      background: { kind: 'solid', colors: NIGHT, spot: 0.14 },
      depth: { amount: 0.3, focus: { device: 0, u: 0.3, v: 0.25 } },
      light: { shadow: 0.6, softness: 0.6, distance: 0.12 },
      motion: { kind: 'drift', duration: 9, intensity: 0.35 },
      finish: { grain: 0.12, vignette: 0.26 }
    }
  },
  {
    id: 'flat-lay',
    name: 'Flat lay',
    group: 'perspective',
    hero: ['turn', 'bgColor', 'shadow'],
    doc: {
      devices: [
        { type: 'phone', finish: 'silver', slot: 1, rx: -90, x: -0.62, ry: 8 },
        { type: 'phone', finish: 'black', slot: 1, rx: -90, x: 0.62, ry: -6 }
      ],
      camera: { rx: 78, ry: 0, rz: -6, fov: 24, pad: 0.14 },
      background: { kind: 'solid', colors: WHITE },
      light: { shadow: 0.65, softness: 0.6, receiver: 'floor', lift: 0, height: 66, angle: -30 },
      motion: { kind: 'drift', duration: 10, intensity: 0.25 },
      finish: { grain: 0.05, vignette: 0.05 }
    }
  },
  {
    id: 'macro',
    name: 'Macro',
    group: 'depth',
    hero: ['depth', 'zoom', 'turn'],
    doc: {
      devices: [{ type: 'browser', finish: 'dark', slot: 0 }],
      camera: { rx: 18, ry: -16, rz: 4, zoom: 2.7, fov: 32, target: { device: 0, u: 0.28, v: 0.32 } },
      depth: { amount: 0.55 },
      background: { kind: 'solid', colors: INK },
      light: { shadow: 0.5, softness: 0.6, distance: 0.12 },
      motion: { kind: 'drift', duration: 9, intensity: 0.35 },
      finish: { grain: 0.12, vignette: 0.2 }
    }
  },
  {
    id: 'focus',
    name: 'Focus',
    group: 'depth',
    hero: ['depth', 'zoom', 'roll'],
    doc: {
      devices: [{ type: 'browser', finish: 'dark', slot: 0 }],
      camera: { rx: 14, ry: 18, rz: -4, zoom: 2.3, fov: 30, target: { device: 0, u: 0.72, v: 0.6 } },
      depth: { amount: 0.5 },
      background: { kind: 'solid', colors: INK },
      light: { shadow: 0.5, softness: 0.6, distance: 0.12 },
      motion: { kind: 'drift', duration: 9, intensity: 0.35 },
      finish: { grain: 0.12, vignette: 0.2 }
    }
  },
  {
    id: 'focus-pull',
    name: 'Focus pull',
    group: 'depth',
    hero: ['depth', 'duration', 'zoom'],
    doc: {
      devices: [{ type: 'browser', finish: 'dark', slot: 0 }],
      camera: { rx: 22, ry: -22, rz: 3, zoom: 2.1, fov: 34, target: { device: 0, u: 0.45, v: 0.5 } },
      depth: { amount: 0.6, focus: { device: 0, u: 0.22, v: 0.3 }, rack: { device: 0, u: 0.75, v: 0.72 } },
      background: { kind: 'solid', colors: INK },
      light: { shadow: 0.5, softness: 0.6, distance: 0.12 },
      motion: { kind: 'rack', duration: 6, intensity: 0.4 },
      finish: { grain: 0.12, vignette: 0.2 }
    }
  },
  {
    id: 'glide',
    name: 'Glide',
    group: 'depth',
    hero: ['depth', 'intensity', 'zoom'],
    doc: {
      devices: [{ type: 'browser', finish: 'dark', slot: 0 }],
      camera: { rx: 16, ry: -12, rz: 3, zoom: 2.5, fov: 30, target: { device: 0, u: 0.5, v: 0.4 } },
      depth: { amount: 0.5 },
      background: { kind: 'solid', colors: INK },
      light: { shadow: 0.5, softness: 0.6, distance: 0.12 },
      motion: { kind: 'pan', duration: 10, intensity: 0.5 },
      finish: { grain: 0.12, vignette: 0.2 }
    }
  },
  {
    id: 'grazing',
    name: 'Grazing',
    group: 'depth',
    hero: ['depth', 'tilt', 'zoom'],
    doc: {
      devices: [{ type: 'card', finish: 'clean', slot: 0, radius: 0.04, rx: -64 }],
      camera: { rx: 6, ry: -10, fov: 36, zoom: 1.45, target: { device: 0, u: 0.4, v: 0.55 } },
      depth: { amount: 0.5 },
      background: { kind: 'solid', colors: ['#0b0b0e', '#1b1b21', '#000000', '#000000'] },
      light: { shadow: 0.5, softness: 0.6, distance: 0.1 },
      motion: { kind: 'drift', duration: 9, intensity: 0.3 },
      finish: { grain: 0.12, vignette: 0.24 }
    }
  },
  {
    id: 'miniature',
    name: 'Miniature',
    group: 'depth',
    hero: ['depth', 'turn', 'zoom'],
    doc: {
      devices: [{ type: 'card', finish: 'clean', slot: 2, radius: 0.04, rx: -90 }],
      camera: { rx: 58, ry: -24, fov: 30, zoom: 1.6, target: { device: 0, u: 0.42, v: 0.4 } },
      depth: { amount: 0.75 },
      background: { kind: 'solid', colors: ['#e8e5df', '#ffffff', '#ffffff', '#ffffff'] },
      light: { shadow: 0.55, softness: 0.7, receiver: 'floor', lift: 0.03, height: 66, angle: -20 },
      motion: { kind: 'pan', duration: 12, intensity: 0.35 },
      finish: { grain: 0.05, vignette: 0.08 }
    }
  },
  {
    id: 'keys',
    name: 'Keys',
    group: 'depth',
    hero: ['depth', 'zoom', 'turn'],
    doc: {
      devices: [{ type: 'laptop', finish: 'silver', slot: 0, open: 110 }],
      camera: { rx: 26, ry: -28, rz: 2, fov: 36, zoom: 2.1, target: { device: 0, u: 0.42, v: 0.95 } },
      depth: { amount: 0.55, focus: { device: 0, u: 0.4, v: 0.55 } },
      background: { kind: 'studio', colors: LIGHT_STUDIO, light: 0.3 },
      light: { shadow: 0.6, softness: 0.5, height: 62, angle: -30 },
      motion: { kind: 'drift', duration: 10, intensity: 0.3 },
      finish: { grain: 0.05, vignette: 0.12 }
    }
  },
  {
    id: 'corner',
    name: 'Corner',
    group: 'depth',
    hero: ['depth', 'zoom', 'turn'],
    doc: {
      devices: [{ type: 'phone', finish: 'natural', slot: 1, ry: -24, rx: 8 }],
      camera: { rx: 8, ry: 4, rz: 4, fov: 30, zoom: 2.6, target: { device: 0, u: 0.22, v: 0.08 } },
      depth: { amount: 0.6 },
      background: { kind: 'solid', colors: ['#0b0b0d', '#1b1b20', '#000000', '#000000'] },
      light: { shadow: 0.45, softness: 0.6, distance: 0.1 },
      motion: { kind: 'drift', duration: 9, intensity: 0.3 },
      finish: { grain: 0.1, vignette: 0.24 }
    }
  },
  {
    id: 'row',
    name: 'Row',
    group: 'depth',
    hero: ['depth', 'turn', 'bgColor'],
    doc: {
      devices: [
        { type: 'phone', finish: 'black', slot: 1, x: -0.9, z: 0.9 },
        { type: 'phone', finish: 'silver', slot: 1, x: 0, z: -0.4 },
        { type: 'phone', finish: 'burgundy', slot: 1, x: 0.9, z: -1.7 }
      ],
      camera: { rx: 4, ry: 30, fov: 30, pad: 0.15 },
      depth: { amount: 0.5, focus: { device: 0, u: 0.5, v: 0.4 }, rack: { device: 2, u: 0.5, v: 0.4 } },
      background: { kind: 'solid', colors: WHITE, spot: 0.1 },
      light: { shadow: 0.55, softness: 0.7, distance: 0.12, height: 62, angle: -30 },
      motion: { kind: 'rack', duration: 8, intensity: 0.3 },
      finish: { grain: 0.05, vignette: 0.06 }
    }
  },
  {
    id: 'tilt-shift',
    name: 'Tilt shift',
    group: 'depth',
    hero: ['depth', 'tilt', 'zoom'],
    doc: {
      devices: [
        { type: 'phone', finish: 'silver', slot: 1, rx: -90, x: -1.05 },
        { type: 'tablet', finish: 'silver', slot: 0, alignX: 0, rx: -90, x: 0.85 },
        { type: 'phone', finish: 'black', slot: 1, rx: -90, x: 2.7, ry: -8 }
      ],
      camera: { rx: 52, ry: -20, fov: 30, zoom: 1.3, target: { device: 1, u: 0.3, v: 0.5 } },
      depth: { amount: 0.8 },
      background: { kind: 'solid', colors: ['#e7e4de', '#ffffff', '#ffffff', '#ffffff'] },
      light: { shadow: 0.6, softness: 0.65, receiver: 'floor', lift: 0, height: 64, angle: -24 },
      motion: { kind: 'pan', duration: 12, intensity: 0.3 },
      finish: { grain: 0.05, vignette: 0.1 }
    }
  },
  {
    id: 'laptop',
    name: 'Laptop',
    group: 'devices',
    hero: ['turn', 'bgColor', 'depth'],
    doc: {
      devices: [{ type: 'laptop', finish: 'silver', slot: 0 }],
      camera: { rx: 15, ry: -24, fov: 30, pad: 0.12 },
      background: { kind: 'studio', colors: LIGHT_STUDIO, light: 0.3 },
      light: { shadow: 0.75, softness: 0.45, height: 62, angle: -30 },
      motion: { kind: 'drift', duration: 9, intensity: 0.35 },
      finish: { grain: 0.05, vignette: 0.1 }
    }
  },
  {
    id: 'night-shift',
    name: 'Night shift',
    group: 'devices',
    hero: ['turn', 'reflection', 'bgColor'],
    doc: {
      devices: [{ type: 'laptop', finish: 'black', slot: 0 }],
      camera: { rx: 10, ry: 22, fov: 30, pad: 0.12 },
      background: { kind: 'studio', colors: DARK_STUDIO, light: 0.45 },
      light: { shadow: 0.85, softness: 0.4, height: 60, angle: 24, reflection: 0.3 },
      motion: { kind: 'drift', duration: 9, intensity: 0.35 },
      finish: { grain: 0.1, vignette: 0.3 }
    }
  },
  {
    id: 'desk',
    name: 'Desk',
    group: 'devices',
    hero: ['turn', 'bgColor', 'shadow'],
    doc: {
      devices: [
        { type: 'monitor', finish: 'silver', slot: 0 },
        { type: 'phone', finish: 'natural', slot: 1, x: 3.7, y: -2.189, z: 1.1, ry: -18, rx: -12 }
      ],
      camera: { rx: 7, ry: -18, fov: 28, pad: 0.08 },
      background: { kind: 'studio', colors: ['#dcd8d0', '#e9e6e0', '#ffffff', '#ffffff'], light: 0.3 },
      light: { shadow: 0.7, softness: 0.5, height: 62, angle: -24 },
      motion: { kind: 'drift', duration: 10, intensity: 0.3 },
      finish: { grain: 0.05, vignette: 0.1 }
    }
  },
  {
    id: 'duo',
    name: 'Duo',
    group: 'devices',
    hero: ['turn', 'bgColor', 'reflection'],
    doc: {
      devices: [
        { type: 'laptop', finish: 'black', slot: 0, x: -0.4 },
        { type: 'phone', finish: 'black', slot: 1, x: 2.05, y: 0.665, z: 1.0, ry: -14, rx: -10 }
      ],
      camera: { rx: 9, ry: -14, fov: 28, pad: 0.1 },
      background: { kind: 'studio', colors: ['#161619', '#1d1d21', '#ffffff', '#ffffff'], light: 0.4 },
      light: { shadow: 0.8, softness: 0.45, height: 60, angle: -22, reflection: 0.22 },
      motion: { kind: 'drift', duration: 10, intensity: 0.3 },
      finish: { grain: 0.1, vignette: 0.28 }
    }
  },
  {
    id: 'phone',
    name: 'Phone',
    group: 'devices',
    hero: ['turn', 'bgColor', 'reflection'],
    doc: {
      devices: [{ type: 'phone', finish: 'burgundy', slot: 1 }],
      camera: { rx: 4, ry: -18, fov: 26, pad: 0.12 },
      background: { kind: 'studio', colors: ['#121214', '#18181b', '#ffffff', '#ffffff'], light: 0.45 },
      light: { shadow: 0.8, softness: 0.4, height: 60, angle: -20, reflection: 0.3 },
      motion: { kind: 'drift', duration: 8, intensity: 0.4 },
      finish: { grain: 0.1, vignette: 0.3 }
    }
  },
  {
    id: 'pair',
    name: 'Pair',
    group: 'devices',
    hero: ['turn', 'bgColor', 'tilt'],
    doc: {
      devices: [
        { type: 'phone', finish: 'burgundy', slot: 1, ry: 208, x: -0.38, y: 0.17, z: -0.32 },
        { type: 'phone', finish: 'burgundy', slot: 1, ry: 30, x: 0.36, y: -0.1, z: 0.15 }
      ],
      camera: { rx: 2, ry: 0, fov: 22, pad: 0.1 },
      background: { kind: 'solid', colors: ['#000000', '#141416', '#000000', '#000000'] },
      light: { shadow: 0, softness: 0.6, distance: 0.12 },
      motion: { kind: 'drift', duration: 9, intensity: 0.3 },
      finish: { grain: 0.06, vignette: 0.12 }
    }
  },
  {
    id: 'trio',
    name: 'Trio',
    group: 'devices',
    hero: ['turn', 'bgColor', 'depth'],
    doc: {
      devices: [
        { type: 'phone', finish: 'silver', slot: 1, x: -0.92, z: -0.5, ry: 14 },
        { type: 'phone', finish: 'black', slot: 1, x: 0, z: 0.2, scale: 1.04 },
        { type: 'phone', finish: 'orange', slot: 1, x: 0.92, z: -0.5, ry: -14 }
      ],
      camera: { rx: 4, ry: 0, fov: 28, pad: 0.12 },
      background: { kind: 'solid', colors: WHITE, spot: 0.15 },
      depth: { amount: 0.2, focus: { device: 1, u: 0.5, v: 0.4 } },
      light: { shadow: 0.6, softness: 0.65, distance: 0.12, height: 64, angle: -16 },
      motion: { kind: 'float', duration: 7, intensity: 0.4 },
      finish: { grain: 0.05, vignette: 0.06 }
    }
  },
  {
    id: 'tablet',
    name: 'Tablet',
    group: 'devices',
    hero: ['turn', 'tilt', 'bgColor'],
    doc: {
      devices: [{ type: 'tablet', finish: 'black', slot: 0, alignX: 0 }],
      camera: { rx: 12, ry: 20, rz: -2, fov: 30, pad: 0.13 },
      background: { kind: 'gradient', colors: ['#d9d6cf', '#ebe8e2', '#f6f4f0', '#d9d6cf'], angle: 75 },
      light: { shadow: 0.6, softness: 0.65, distance: 0.14, height: 62, angle: 20 },
      motion: { kind: 'drift', duration: 9, intensity: 0.35 },
      finish: { grain: 0.05, vignette: 0.08 }
    }
  },
  {
    id: 'display',
    name: 'Display',
    group: 'devices',
    hero: ['turn', 'bgColor', 'shadow'],
    doc: {
      devices: [{ type: 'monitor', finish: 'silver', slot: 0 }],
      camera: { rx: 6, ry: 18, fov: 26, pad: 0.1 },
      background: { kind: 'studio', colors: ['#e4e1db', '#efece6', '#ffffff', '#ffffff'], light: 0.3 },
      light: { shadow: 0.7, softness: 0.5, height: 62, angle: 22 },
      motion: { kind: 'drift', duration: 11, intensity: 0.3 },
      finish: { grain: 0.05, vignette: 0.08 }
    }
  },
  {
    id: 'studio-pair',
    name: 'Studio pair',
    group: 'devices',
    hero: ['turn', 'bgColor', 'shadow'],
    doc: {
      devices: [
        { type: 'tablet', finish: 'silver', slot: 2, alignX: 0, y: 0.14, ry: 10 },
        { type: 'phone', finish: 'silver', slot: 1, x: 1.55, z: 0.55, ry: -12 }
      ],
      camera: { rx: 6, ry: -14, fov: 28, pad: 0.12 },
      background: { kind: 'studio', colors: LIGHT_STUDIO, light: 0.3 },
      light: { shadow: 0.7, softness: 0.5, height: 62, angle: -24 },
      motion: { kind: 'drift', duration: 10, intensity: 0.3 },
      finish: { grain: 0.05, vignette: 0.1 }
    }
  },
  {
    id: 'hero-phone',
    name: 'Hero phone',
    group: 'devices',
    hero: ['turn', 'roll', 'depth'],
    doc: {
      devices: [{ type: 'phone', finish: 'black', slot: 1, ry: -26, rx: 10, rz: 6 }],
      camera: { rx: 4, ry: 0, fov: 26, zoom: 1.45, pad: 0.06, y: -0.3 },
      depth: { amount: 0.25 },
      background: {
        kind: 'spotlight',
        colors: ['#09090b', '#26262e', '#000000', '#000000'],
        spot: 0.3,
        spotCenter: [0.5, 0.55],
        spotSize: 0.5
      },
      light: { shadow: 0.5, softness: 0.6, distance: 0.12, height: 60, angle: -28 },
      motion: { kind: 'sway', duration: 9, intensity: 0.35 },
      finish: { grain: 0.1, vignette: 0.28 }
    }
  },
  {
    id: 'turntable',
    name: 'Turntable',
    group: 'motion',
    hero: ['duration', 'bgColor', 'tilt'],
    doc: {
      devices: [{ type: 'phone', finish: 'burgundy', slot: 1 }],
      camera: { rx: 6, ry: 0, fov: 24, pad: 0.16 },
      background: { kind: 'studio', colors: ['#111113', '#17171a', '#ffffff', '#ffffff'], light: 0.6, pool: 0.8 },
      light: { shadow: 0.85, softness: 0.4, height: 70, angle: -10, reflection: 0.25 },
      motion: { kind: 'turntable', duration: 10, intensity: 0.5 },
      finish: { grain: 0.1, vignette: 0.32 }
    }
  },
  {
    id: 'flip',
    name: 'Flip',
    group: 'motion',
    hero: ['duration', 'bgColor', 'turn'],
    doc: {
      devices: [{ type: 'phone', finish: 'orange', slot: 1 }],
      camera: { rx: 4, ry: -10, fov: 24, pad: 0.15 },
      background: { kind: 'solid', colors: ['#e8e4dd', '#ffffff', '#ffffff', '#ffffff'], spot: 0.14 },
      light: { shadow: 0.5, softness: 0.75, distance: 0.2, height: 62, angle: -24 },
      motion: { kind: 'flip', duration: 7, intensity: 0.5 },
      finish: { grain: 0.05, vignette: 0.05 }
    }
  },
  {
    id: 'sway',
    name: 'Sway',
    group: 'motion',
    hero: ['intensity', 'bgColor', 'turn'],
    doc: {
      devices: [
        { type: 'phone', finish: 'glacier', slot: 1, x: -0.5, ry: 12 },
        { type: 'phone', finish: 'silver', slot: 1, x: 0.5, z: -0.3, ry: -8 }
      ],
      camera: { rx: 3, fov: 26, pad: 0.13 },
      background: { kind: 'gradient', colors: ['#dfe3e8', '#eef0f3', '#f7f8fa', '#dfe3e8'], angle: 95 },
      light: { shadow: 0.55, softness: 0.75, distance: 0.16, height: 64, angle: -20 },
      motion: { kind: 'sway', duration: 8, intensity: 0.5 },
      finish: { grain: 0.05, vignette: 0.05 }
    }
  },
  {
    id: 'crane',
    name: 'Crane',
    group: 'motion',
    hero: ['intensity', 'duration', 'bgColor'],
    doc: {
      devices: [{ type: 'laptop', finish: 'silver', slot: 0 }],
      camera: { rx: 10, ry: -22, fov: 30, pad: 0.12 },
      background: { kind: 'studio', colors: LIGHT_STUDIO, light: 0.32 },
      light: { shadow: 0.75, softness: 0.45, height: 62, angle: -30 },
      motion: { kind: 'crane', duration: 12, intensity: 0.5 },
      finish: { grain: 0.05, vignette: 0.1 }
    }
  },
  {
    id: 'dolly',
    name: 'Dolly zoom',
    group: 'motion',
    hero: ['intensity', 'duration', 'depth'],
    doc: {
      devices: [{ type: 'browser', finish: 'dark', slot: 0, ry: -10, layer: 'hero' }, ...backWall()],
      camera: { rx: 4, ry: 0, fov: 22, pad: 0.26, frame: [4.6, 2.9], frameCenter: [0, 0, 0] },
      depth: { amount: 0.22, focus: { device: 0, u: 0.5, v: 0.5 } },
      background: {
        kind: 'spotlight',
        colors: ['#0a0a0d', '#262630', '#000000', '#000000'],
        spot: 0.28,
        spotCenter: [0.5, 0.6],
        spotSize: 0.55
      },
      light: { shadow: 0.65, softness: 0.6, distance: 0.3, height: 60, angle: -24 },
      motion: { kind: 'dolly', duration: 9, intensity: 0.5 },
      finish: { grain: 0.1, vignette: 0.28 }
    }
  },
  {
    id: 'spiral',
    name: 'Spiral',
    group: 'motion',
    hero: ['intensity', 'duration', 'bgColor'],
    doc: {
      devices: [{ type: 'tablet', finish: 'black', slot: 0, alignX: 0, ry: -10 }],
      camera: { rx: 8, ry: 0, fov: 28, pad: 0.13 },
      depth: { amount: 0.15 },
      background: { kind: 'solid', colors: ['#0e0e11', '#1e1e24', '#000000', '#000000'], spot: 0.16 },
      light: { shadow: 0.6, softness: 0.65, distance: 0.16 },
      motion: { kind: 'spiral', duration: 12, intensity: 0.5 },
      finish: { grain: 0.1, vignette: 0.28 }
    }
  },
  {
    id: 'scroll',
    name: 'Scroll',
    group: 'motion',
    hero: ['duration', 'turn', 'bgColor'],
    doc: {
      devices: [{ type: 'browser', finish: 'light', slot: 2, viewport: '16:9' }],
      camera: { rx: 6, ry: 14, fov: 28, pad: 0.14 },
      background: { kind: 'solid', colors: STONE, spot: 0.12 },
      light: { shadow: 0.55, softness: 0.75, distance: 0.14, height: 62, angle: 20 },
      motion: { kind: 'scroll', duration: 8, intensity: 0.3 },
      finish: { grain: 0.05, vignette: 0.06 }
    }
  },
  {
    id: 'phone-scroll',
    name: 'Phone scroll',
    group: 'motion',
    hero: ['duration', 'turn', 'bgColor'],
    doc: {
      devices: [{ type: 'phone', finish: 'natural', slot: 1, ry: -14 }],
      camera: { rx: 4, ry: 0, fov: 24, pad: 0.14 },
      background: { kind: 'solid', colors: WHITE, spot: 0.12 },
      light: { shadow: 0.55, softness: 0.7, distance: 0.14, height: 62, angle: -20 },
      motion: { kind: 'scroll', duration: 8, intensity: 0.3 },
      finish: { grain: 0.05, vignette: 0.05 }
    }
  },
  {
    id: 'orbit',
    name: 'Orbit',
    group: 'motion',
    hero: ['intensity', 'duration', 'reflection'],
    doc: {
      devices: [
        { type: 'laptop', finish: 'black', slot: 0, x: -0.4 },
        { type: 'phone', finish: 'black', slot: 1, x: 2.05, y: 0.665, z: 1.0, ry: -14, rx: -10 }
      ],
      camera: { rx: 10, ry: -8, fov: 28, pad: 0.12 },
      background: { kind: 'studio', colors: DARK_STUDIO, light: 0.5 },
      light: { shadow: 0.8, softness: 0.45, height: 62, angle: -22, reflection: 0.28 },
      motion: { kind: 'orbit', duration: 12, intensity: 0.55 },
      finish: { grain: 0.1, vignette: 0.3 }
    }
  },
  {
    id: 'rise-up',
    name: 'Rise up',
    group: 'motion',
    hero: ['duration', 'bgColor', 'intensity'],
    doc: {
      devices: [
        { type: 'phone', finish: 'black', slot: 1, x: -0.55, ry: 10 },
        { type: 'phone', finish: 'silver', slot: 1, x: 0.55, z: -0.25, ry: -10 }
      ],
      camera: { rx: 4, fov: 26, pad: 0.14 },
      background: { kind: 'solid', colors: ['#101013', '#1e1e24', '#000000', '#000000'], spot: 0.15 },
      light: { shadow: 0.55, softness: 0.7, distance: 0.14 },
      motion: { kind: 'rise', duration: 4, intensity: 0.5 },
      finish: { grain: 0.1, vignette: 0.26 }
    }
  },
  {
    id: 'parallax',
    name: 'Parallax',
    group: 'motion',
    hero: ['intensity', 'depth', 'bgColor'],
    doc: {
      devices: [
        { type: 'browser', finish: 'dark', slot: 0, z: -1.2 },
        { type: 'phone', finish: 'black', slot: 1, x: -1.3, y: -0.35, z: 0.9, ry: 12 },
        { type: 'phone', finish: 'silver', slot: 1, x: 1.4, y: 0.2, z: 0.4, ry: -12 }
      ],
      camera: { rx: 4, ry: -6, fov: 30, pad: 0.14 },
      depth: { amount: 0.3, focus: { device: 2, u: 0.5, v: 0.5 } },
      background: { kind: 'solid', colors: NIGHT, spot: 0.16 },
      light: { shadow: 0.6, softness: 0.7, distance: 0.14 },
      motion: { kind: 'pan', duration: 10, intensity: 0.4 },
      finish: { grain: 0.1, vignette: 0.26 }
    }
  },
  {
    id: 'headline',
    name: 'Headline',
    group: 'type',
    hero: ['text', 'typeSize', 'depth'],
    doc: {
      devices: [{ type: 'browser', finish: 'dark', slot: 0 }],
      camera: { rx: 16, ry: 0, fov: 24, pad: 0.26, y: -0.22 },
      type: {
        text: 'Ship faster',
        size: 0.98,
        color: '#ffffff',
        opacity: 0.92,
        position: 'behind',
        depth: 0.18,
        offset: 0.24,
        weight: 720
      },
      depth: { amount: 0.34 },
      background: {
        kind: 'solid',
        colors: ['#0b0b0e', '#2a2a33', '#000000', '#000000'],
        spot: 0.18,
        spotCenter: [0.5, 0.62]
      },
      light: { shadow: 0.6, softness: 0.7, distance: 0.1 },
      motion: { kind: 'drift', duration: 9, intensity: 0.3 },
      finish: { grain: 0.12, vignette: 0.3 }
    }
  },
  {
    id: 'outline',
    name: 'Outline',
    group: 'type',
    hero: ['text', 'typeSize', 'turn'],
    doc: {
      devices: [{ type: 'phone', finish: 'black', slot: 1 }],
      camera: { rx: 4, ry: -12, fov: 26, pad: 0.12 },
      type: {
        text: 'Mobile',
        size: 1.05,
        color: '#ffffff',
        opacity: 0.5,
        style: 'outline',
        position: 'behind',
        depth: 0.2,
        weight: 700,
        offset: 0.02
      },
      background: { kind: 'solid', colors: ['#0c0c0f', '#1c1c22', '#000000', '#000000'], spot: 0.12 },
      light: { shadow: 0.7, softness: 0.55, distance: 0.12 },
      motion: { kind: 'float', duration: 7, intensity: 0.35 },
      finish: { grain: 0.1, vignette: 0.25 }
    }
  },
  {
    id: 'statement',
    name: 'Statement',
    group: 'type',
    hero: ['text', 'typeColor', 'bgColor'],
    doc: {
      devices: [{ type: 'phone', finish: 'silver', slot: 1, ry: -16, rz: 4 }],
      camera: { rx: 4, ry: 0, fov: 24, pad: 0.12 },
      type: {
        text: 'Built to last.',
        size: 0.85,
        color: '#111114',
        opacity: 1,
        position: 'behind',
        depth: 0.25,
        weight: 760,
        offset: 0,
        tracking: -0.06
      },
      depth: { amount: 0.24 },
      background: { kind: 'solid', colors: ['#efede8', '#ffffff', '#ffffff', '#ffffff'] },
      light: { shadow: 0.6, softness: 0.65, distance: 0.12, height: 62, angle: -20 },
      motion: { kind: 'sway', duration: 9, intensity: 0.3 },
      finish: { grain: 0.05, vignette: 0.04 }
    }
  },
  {
    id: 'poster',
    name: 'Poster',
    group: 'type',
    hero: ['title', 'subtitle', 'bgColor'],
    doc: {
      devices: [{ type: 'browser', finish: 'light', slot: 2 }],
      camera: { rx: 6, ry: 0, fov: 26, pad: 0.1 },
      caption: {
        title: 'Your next website',
        subtitle: 'Built with React Bits in an afternoon',
        position: 'top',
        align: 'center'
      },
      background: { kind: 'solid', colors: PAPER, spot: 0.1 },
      light: { shadow: 0.5, softness: 0.75, distance: 0.1, height: 66 },
      finish: { grain: 0.05, vignette: 0.04 }
    }
  },
  {
    id: 'editorial',
    name: 'Editorial',
    group: 'type',
    hero: ['title', 'turn', 'bgColor'],
    doc: {
      devices: [{ type: 'browser', finish: 'dark', slot: 0, x: 0.6 }],
      camera: { rx: 10, ry: -24, fov: 30, pad: 0.06, zoom: 1.25, x: 0.18, y: -0.08 },
      caption: {
        title: 'Launch day',
        subtitle: 'Everything you need, nothing you don’t',
        position: 'top',
        align: 'left'
      },
      background: { kind: 'solid', colors: ['#121215', '#1e1e24', '#000000', '#000000'], spot: 0.15 },
      light: { shadow: 0.65, softness: 0.6, distance: 0.12 },
      finish: { grain: 0.1, vignette: 0.24 }
    }
  },
  {
    id: 'footnote',
    name: 'Footnote',
    group: 'type',
    hero: ['title', 'subtitle', 'turn'],
    doc: {
      devices: [{ type: 'laptop', finish: 'silver', slot: 0 }],
      camera: { rx: 12, ry: -16, fov: 28, pad: 0.1 },
      caption: {
        title: 'Made for makers',
        subtitle: 'Free, open source, ready to ship',
        position: 'bottom',
        align: 'center'
      },
      background: { kind: 'studio', colors: LIGHT_STUDIO, light: 0.3 },
      light: { shadow: 0.7, softness: 0.5, height: 62, angle: -24 },
      motion: { kind: 'drift', duration: 10, intensity: 0.3 },
      finish: { grain: 0.05, vignette: 0.08 }
    }
  },
  {
    id: 'spotlight',
    name: 'Spotlight',
    group: 'scenes',
    hero: ['turn', 'studioLight', 'bgColor'],
    doc: {
      devices: [{ type: 'phone', finish: 'natural', slot: 1 }],
      camera: { rx: 7, ry: 14, fov: 26, pad: 0.16 },
      background: { kind: 'studio', colors: ['#0e0e10', '#141417', '#ffffff', '#ffffff'], light: 0.9, pool: 0.75 },
      light: { shadow: 0.9, softness: 0.35, height: 72, angle: 12, reflection: 0.2 },
      motion: { kind: 'orbit', duration: 12, intensity: 0.3 },
      finish: { grain: 0.12, vignette: 0.38 }
    }
  },
  {
    id: 'ambient',
    name: 'Ambient',
    group: 'scenes',
    hero: ['turn', 'bgDim', 'shadow'],
    doc: {
      devices: [{ type: 'card', finish: 'edge', slot: 0, radius: 0.055 }],
      camera: { rx: 7, ry: 12, fov: 30, pad: 0.16 },
      background: { kind: 'ambient', colors: ['#000000', '#000000', '#000000', '#000000'], dim: 0.45, blur: 1 },
      light: { shadow: 0.75, softness: 0.7, distance: 0.14, height: 62 },
      motion: { kind: 'drift', duration: 9, intensity: 0.35 },
      finish: { grain: 0.1, vignette: 0.3 }
    }
  },
  {
    id: 'sky',
    name: 'Sky',
    group: 'scenes',
    hero: ['turn', 'bgBlur', 'shadow'],
    doc: {
      devices: [{ type: 'browser', finish: 'light', slot: 2 }],
      camera: { rx: 4, ry: -12, fov: 28, pad: 0.16 },
      background: {
        kind: 'image',
        image: 'sky-day',
        colors: ['#cfd8e3', '#ffffff', '#ffffff', '#ffffff'],
        blur: 0.15,
        dim: 0
      },
      light: { shadow: 0.55, softness: 0.8, distance: 0.16, height: 62, tint: '#1f3550' },
      motion: { kind: 'drift', duration: 10, intensity: 0.3 },
      finish: { grain: 0.05, vignette: 0.06 }
    }
  },
  {
    id: 'night',
    name: 'Night',
    group: 'scenes',
    hero: ['turn', 'bgBlur', 'bgDim'],
    doc: {
      devices: [{ type: 'browser', finish: 'dark', slot: 0 }],
      camera: { rx: 4, ry: 12, fov: 28, pad: 0.16 },
      background: {
        kind: 'image',
        image: 'sky-night',
        colors: ['#05070d', '#ffffff', '#ffffff', '#ffffff'],
        blur: 0.2,
        dim: 0.15
      },
      light: { shadow: 0.7, softness: 0.8, distance: 0.16, height: 62 },
      motion: { kind: 'drift', duration: 10, intensity: 0.3 },
      finish: { grain: 0.12, vignette: 0.2 }
    }
  },
  {
    id: 'mirror',
    name: 'Mirror',
    group: 'scenes',
    hero: ['reflection', 'turn', 'bgColor'],
    doc: {
      devices: [
        { type: 'phone', finish: 'black', slot: 1, x: -0.48, ry: 14 },
        { type: 'phone', finish: 'silver', slot: 1, x: 0.48, ry: -14 }
      ],
      camera: { rx: 5, ry: 0, fov: 26, pad: 0.14 },
      background: { kind: 'studio', colors: ['#0c0c0e', '#121215', '#ffffff', '#ffffff'], light: 0.55, pool: 0.9 },
      light: { shadow: 0.85, softness: 0.4, height: 66, angle: -14, reflection: 0.55 },
      motion: { kind: 'sway', duration: 10, intensity: 0.3 },
      finish: { grain: 0.1, vignette: 0.34 }
    }
  },
  {
    id: 'slate',
    name: 'Slate',
    group: 'scenes',
    hero: ['bgColor', 'bgColor2', 'turn'],
    doc: {
      devices: [{ type: 'tablet', finish: 'black', slot: 0, alignX: 0, ry: -12 }],
      camera: { rx: 6, ry: 4, fov: 28, pad: 0.15 },
      background: { kind: 'mesh', colors: ['#1b1d22', '#3b4049', '#111215', '#2a2e35'] },
      light: { shadow: 0.65, softness: 0.75, distance: 0.16, height: 60, angle: -22 },
      motion: { kind: 'drift', duration: 11, intensity: 0.3 },
      finish: { grain: 0.12, vignette: 0.25 }
    }
  },
  {
    id: 'stack',
    name: 'Stack',
    group: 'arrange',
    hero: ['turn', 'tilt', 'bgColor'],
    doc: {
      devices: [
        { type: 'card', finish: 'edge', slot: 2, radius: 0.05, x: 0.55, y: 0.38, z: -0.7 },
        { type: 'card', finish: 'edge', slot: 1, radius: 0.05, x: 0.27, y: 0.19, z: -0.35, viewport: '16:10' },
        { type: 'card', finish: 'edge', slot: 0, radius: 0.05 }
      ],
      camera: { rx: 8, ry: -18, fov: 30, pad: 0.12 },
      background: { kind: 'solid', colors: ['#121216', '#202027', '#000000', '#000000'], spot: 0.2 },
      depth: { amount: 0.18, focus: { device: 2, u: 0.5, v: 0.4 } },
      light: { shadow: 0.7, softness: 0.7, distance: 0.14 },
      motion: { kind: 'float', duration: 8, intensity: 0.35 },
      finish: { grain: 0.1, vignette: 0.26 }
    }
  },
  {
    id: 'cascade',
    name: 'Cascade',
    group: 'arrange',
    hero: ['turn', 'depth', 'bgColor'],
    doc: {
      devices: [
        { type: 'card', finish: 'clean', slot: 2, radius: 0.05, x: -2.1, y: 0.7, z: -1.2, ry: 8, scale: 0.8 },
        {
          type: 'card',
          finish: 'clean',
          slot: 2,
          radius: 0.05,
          x: 2.1,
          y: -0.6,
          z: -1.0,
          ry: -8,
          scale: 0.8,
          scroll: 0.5
        },
        { type: 'card', finish: 'clean', slot: 0, radius: 0.05 }
      ],
      camera: { rx: 6, ry: -10, fov: 32, pad: 0.08 },
      background: { kind: 'solid', colors: STONE, spot: 0.12 },
      depth: { amount: 0.3, focus: { device: 2, u: 0.5, v: 0.4 } },
      light: { shadow: 0.6, softness: 0.75, distance: 0.14 },
      motion: { kind: 'float', duration: 9, intensity: 0.35 },
      finish: { grain: 0.05, vignette: 0.06 }
    }
  },
  {
    id: 'wall',
    name: 'Wall',
    group: 'arrange',
    hero: ['shift', 'turn', 'depth'],
    doc: {
      devices: wall(),
      camera: { rx: 24, ry: -28, rz: 6, fov: 30, pad: 0, frame: [10.4, 5.8], frameCenter: [0, 0, 0] },
      background: { kind: 'solid', colors: ['#0d0d10', '#1e1e24', '#000000', '#000000'] },
      depth: { amount: 0.22 },
      light: { shadow: 0.6, softness: 0.6, distance: 0.08 },
      motion: { kind: 'pan', duration: 14, intensity: 0.4, shift: 'sway', shiftAmount: 0.45 },
      finish: { grain: 0.1, vignette: 0.3 }
    }
  },
  {
    id: 'split',
    name: 'Split',
    group: 'arrange',
    hero: ['turn', 'bgColor', 'shadow'],
    doc: {
      devices: [
        { type: 'browser', finish: 'light', slot: 2, x: -1.75, ry: 8 },
        { type: 'browser', finish: 'dark', slot: 0, x: 1.75, ry: -8 }
      ],
      camera: { rx: 4, fov: 28, pad: 0.1 },
      background: { kind: 'solid', colors: ['#d8d4cc', '#eae7e1', '#ffffff', '#ffffff'], spot: 0.12 },
      light: { shadow: 0.6, softness: 0.7, distance: 0.12 },
      finish: { grain: 0.05, vignette: 0.06 }
    }
  },
  {
    id: 'fan',
    name: 'Fan',
    group: 'arrange',
    hero: ['turn', 'bgColor', 'shadow'],
    doc: {
      devices: fan(['silver', 'black', 'glacier']),
      camera: { rx: 4, ry: -8, fov: 26, pad: 0.12 },
      background: { kind: 'solid', colors: WHITE, spot: 0.12 },
      light: { shadow: 0.6, softness: 0.7, distance: 0.12, height: 62, angle: -20 },
      motion: { kind: 'float', duration: 8, intensity: 0.3 },
      finish: { grain: 0.05, vignette: 0.05 }
    }
  },
  {
    id: 'gallery',
    name: 'Gallery',
    group: 'arrange',
    hero: ['turn', 'depth', 'bgColor'],
    doc: {
      devices: [
        { type: 'browser', finish: 'dark', slot: 0, x: -3.6, ry: 26 },
        { type: 'browser', finish: 'light', slot: 2, x: 0, z: 0.3 },
        { type: 'browser', finish: 'dark', slot: 0, x: 3.6, ry: -26, scroll: 0.5 }
      ],
      camera: { rx: 6, ry: 0, fov: 30, pad: 0.06, zoom: 1.55 },
      depth: { amount: 0.22, focus: { device: 1, u: 0.5, v: 0.4 } },
      background: { kind: 'solid', colors: NIGHT, spot: 0.14 },
      light: { shadow: 0.6, softness: 0.65, distance: 0.14 },
      motion: { kind: 'pan', duration: 12, intensity: 0.35 },
      finish: { grain: 0.1, vignette: 0.28 }
    }
  },
  {
    id: 'mosaic',
    name: 'Mosaic',
    group: 'arrange',
    hero: ['turn', 'depth', 'roll'],
    doc: {
      devices: mosaic(),
      camera: { rx: 18, ry: -22, rz: 10, fov: 30, pad: 0, zoom: 1.4 },
      depth: { amount: 0.4 },
      background: { kind: 'solid', colors: ['#e6e3dd', '#ffffff', '#ffffff', '#ffffff'] },
      light: { shadow: 0.55, softness: 0.7, distance: 0.08, height: 64, angle: -24 },
      motion: { kind: 'pan', duration: 14, intensity: 0.35 },
      finish: { grain: 0.05, vignette: 0.06 }
    }
  },
  {
    id: 'stairs',
    name: 'Stairs',
    group: 'arrange',
    hero: ['turn', 'depth', 'bgColor'],
    doc: {
      devices: [0, 1, 2, 3].map(index => ({
        type: 'card',
        finish: 'edge',
        slot: index % 2 ? 2 : 0,
        radius: 0.05,
        x: (index - 1.5) * 1.05,
        y: (index - 1.5) * 0.55,
        z: (1.5 - index) * 0.75,
        ry: -14,
        scale: 0.72
      })),
      camera: { rx: 10, ry: -12, fov: 30, pad: 0.08 },
      depth: { amount: 0.28, focus: { device: 0, u: 0.5, v: 0.4 } },
      background: { kind: 'solid', colors: ['#111114', '#1f1f25', '#000000', '#000000'], spot: 0.16 },
      light: { shadow: 0.65, softness: 0.7, distance: 0.12 },
      motion: { kind: 'drift', duration: 10, intensity: 0.35 },
      finish: { grain: 0.1, vignette: 0.26 }
    }
  }
];
