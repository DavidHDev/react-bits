'use client';

import { useEffect, useRef, type CSSProperties } from 'react';

export interface ShapeGridProps {
  shape?: 'square' | 'tile' | 'hexagon' | 'triangle' | 'diamond' | 'circle' | 'cross' | 'dot';
  cellSize?: number;
  lineWidth?: number;
  direction?: 'diagonal' | 'up' | 'down' | 'left' | 'right' | 'none';
  speed?: number;
  lineColor?: string;
  hoverColor?: string;
  hoverFillColor?: string;
  fillOpacity?: number;
  rainbow?: boolean;
  tiltX?: number;
  tiltY?: number;
  radius?: number;
  trail?: number;
  glow?: number;
  twinkle?: number;
  fade?: number;
  clickCascade?: boolean;
  intro?: boolean;
  opacity?: number;
  backgroundColor?: string;
  paused?: boolean;
  dpr?: number;
  className?: string;
  style?: CSSProperties;
}

interface Layout {
  stepX: number;
  stepY: number;
  radius?: number;
  side?: number;
}

interface View {
  x0: number;
  y0: number;
  width: number;
  height: number;
  inverse: number[] | null;
  transform: string;
  mist: number[] | null;
  far: number;
  reach: number;
}

interface Settings {
  shape: string;
  cellSize: number;
  lineWidth: number;
  direction: string;
  speed: number;
  lineColor: string;
  hoverColor: string;
  hoverFillColor: string;
  fillOpacity: number;
  rainbow: boolean;
  tone: number;
  tiltX: number;
  tiltY: number;
  radius: number;
  trail: number;
  glow: number;
  twinkle: number;
  clickCascade: boolean;
  intro: boolean;
  paused: boolean;
  dpr?: number;
}

interface Cascade {
  x: number;
  y: number;
  time: number;
  power: number;
  reach: number;
  hue: number;
}

interface Engine {
  redraw: () => void;
}

const SHAPES = ['square', 'tile', 'hexagon', 'triangle', 'diamond', 'circle', 'cross', 'dot'];
const DIRECTIONS: Record<string, number[]> = {
  right: [1, 0],
  left: [-1, 0],
  up: [0, -1],
  down: [0, 1],
  diagonal: [Math.SQRT1_2, -Math.SQRT1_2],
  none: [0, 0]
};
const SQRT3 = Math.sqrt(3);
const OFFSET = 32768;
const FAR = 2.5;
const MAX_PIXELS = 8e6;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

const hash = (i: number, j: number) => {
  const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const keyOf = (i: number, j: number) => (i + OFFSET) * 65536 + (j + OFFSET);

const fadeMask = (amount: number) => {
  if (amount <= 0) return 'none';
  const edge = amount * 26;
  const stops: string[] = [];
  for (let k = 0; k <= 8; k++) {
    const t = k / 8;
    stops.push(`rgba(0, 0, 0, ${smootherstep(t).toFixed(3)}) ${(t * edge).toFixed(2)}%`);
  }
  const inner = stops.join(', ');
  const outer = [...stops]
    .reverse()
    .map(stop => stop.replace(/ ([\d.]+)%$/, (_: string, value: string) => ` ${(100 - parseFloat(value)).toFixed(2)}%`))
    .join(', ');
  const axis = (direction: string) => `linear-gradient(${direction}, ${inner}, ${outer})`;
  return `${axis('to right')}, ${axis('to bottom')}`;
};

const lightnessOf = (color: string) => {
  let hex = String(color).trim().replace(/^#/, '');
  if (hex.length === 3 || hex.length === 4) hex = hex.replace(/./g, '$&$&');
  hex = hex.slice(0, 6);
  if (!/^[0-9a-f]{6}$/i.test(hex)) return 0.6;
  const value = parseInt(hex, 16);
  const channels = [value >> 16, (value >> 8) & 255, value & 255];
  return (Math.max(...channels) + Math.min(...channels)) / 510;
};

const tint = (hue: number, lightness: number) =>
  `hsl(${(((hue % 360) + 360) % 360).toFixed(1)}, 90%, ${(lightness * 100).toFixed(1)}%)`;

const multiply = (a: number[], b: number[]) =>
  [0, 1, 2, 3, 4, 5, 6, 7, 8].map(k => {
    const r = k - (k % 3);
    const c = k % 3;
    return a[r] * b[c] + a[r + 1] * b[c + 3] + a[r + 2] * b[c + 6];
  });

const invert = (m: number[]) => {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h;
  const B = f * g - d * i;
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  return [A, c * h - b * i, b * f - c * e, B, a * i - c * g, c * d - a * f, C, b * g - a * h, a * e - b * d].map(
    value => value / det
  );
};

const project = (m: number[], x: number, y: number) => {
  const w = m[6] * x + m[7] * y + m[8];
  return [(m[0] * x + m[1] * y + m[2]) / w, (m[3] * x + m[4] * y + m[5]) / w];
};

const flatView = (width: number, height: number): View => ({
  x0: 0,
  y0: 0,
  width,
  height,
  inverse: null,
  transform: 'none',
  mist: null,
  far: FAR,
  reach: Math.hypot(width, height) / 2
});

const viewFor = (tiltX: number, tiltY: number, width: number, height: number, cellSize: number): View => {
  if (!tiltX && !tiltY) return flatView(width, height);
  const ax = (tiltX * Math.PI) / 180;
  const ay = (tiltY * Math.PI) / 180;
  const depth = Math.max(width, height) * 1.25;
  const cx = width / 2;
  const cy = height / 2;
  const tilt = [
    Math.cos(ay),
    0,
    0,
    Math.sin(ax) * Math.sin(ay),
    Math.cos(ax),
    0,
    (Math.sin(ay) * Math.cos(ax)) / depth,
    -Math.sin(ax) / depth,
    1
  ];
  const forward = multiply(multiply([1, 0, cx, 0, 1, cy, 0, 0, 1], tilt), [1, 0, -cx, 0, 1, -cy, 0, 0, 1]);
  const inverse = invert(forward);
  const facing = Math.cos(ax) * Math.cos(ay);
  const far = clamp(Math.sqrt((facing * cellSize) / 5), 1.15, FAR);
  const near = Math.min(Math.sqrt((facing * cellSize) / 14), far - 0.35);
  const nearness = (x: number, y: number) => inverse[6] * x + inverse[7] * y + inverse[8] - 1 / far;
  const corners = [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height]
  ];
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  const include = (x: number, y: number) => {
    const [px, py] = project(inverse, x, y);
    x0 = Math.min(x0, px);
    y0 = Math.min(y0, py);
    x1 = Math.max(x1, px);
    y1 = Math.max(y1, py);
  };
  corners.forEach((a, k) => {
    const b = corners[(k + 1) % 4];
    const na = nearness(a[0], a[1]);
    const nb = nearness(b[0], b[1]);
    if (na >= 0) include(a[0], a[1]);
    if (na >= 0 !== nb >= 0) {
      const t = na / (na - nb);
      include(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t);
    }
  });
  if (!(x1 > x0 && y1 > y0)) return flatView(width, height);
  x0 = Math.floor(x0 / 16) * 16;
  y0 = Math.floor(y0 / 16) * 16;
  x1 = Math.ceil(x1 / 16) * 16;
  y1 = Math.ceil(y1 / 16) * 16;
  const m = multiply(forward, [1, 0, x0, 0, 1, y0, 0, 0, 1]);
  const transform = `matrix3d(${[m[0], m[3], 0, m[6], m[1], m[4], 0, m[7], 0, 0, 1, 0, m[2], m[5], 0, m[8]].join(', ')})`;
  const gx = forward[6];
  const gy = forward[7];
  const slope = Math.hypot(gx, gy);
  const mist =
    slope > 1e-9
      ? [
          cx + (gx / slope) * ((near - 1) / slope),
          cy + (gy / slope) * ((near - 1) / slope),
          cx + (gx / slope) * ((far - 1) / slope),
          cy + (gy / slope) * ((far - 1) / slope)
        ]
      : null;
  const reach = Math.max(
    Math.hypot(x0 - cx, y0 - cy),
    Math.hypot(x1 - cx, y0 - cy),
    Math.hypot(x1 - cx, y1 - cy),
    Math.hypot(x0 - cx, y1 - cy)
  );
  return { x0, y0, width: x1 - x0, height: y1 - y0, inverse, transform, mist, far, reach };
};

const layoutFor = (shape: string, size: number): Layout => {
  if (shape === 'hexagon') {
    const radius = size / SQRT3;
    return { stepX: radius * 1.5, stepY: size, radius };
  }
  if (shape === 'triangle') {
    const side = (size * 2) / SQRT3;
    return { stepX: side / 2, stepY: size, side };
  }
  return { stepX: size, stepY: size };
};

const centerOf = (shape: string, layout: Layout, i: number, j: number): number[] => {
  const { stepX, stepY } = layout;
  if (shape === 'hexagon') return [i * stepX, j * stepY + (Math.abs(i) % 2 === 1 ? stepY / 2 : 0)];
  if (shape === 'triangle') {
    const up = (((i + j) % 2) + 2) % 2 === 0;
    return [i * stepX, j * stepY + (up ? stepY * (2 / 3) : stepY / 3)];
  }
  if (shape === 'cross' || shape === 'dot') return [i * stepX, j * stepY];
  return [(i + 0.5) * stepX, (j + 0.5) * stepY];
};

const traceCell = (
  ctx: CanvasRenderingContext2D,
  shape: string,
  layout: Layout,
  size: number,
  i: number,
  j: number,
  x: number,
  y: number,
  inset: number
) => {
  if (shape === 'hexagon') {
    const r = (layout.radius ?? 0) - inset;
    for (let k = 0; k < 6; k++) {
      const angle = (Math.PI / 3) * k;
      const px = x + r * Math.cos(angle);
      const py = y + r * Math.sin(angle);
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else if (shape === 'triangle') {
    const up = (((i + j) % 2) + 2) % 2 === 0;
    const half = (layout.side ?? 0) / 2 - inset * 1.7;
    const height = size - inset * 2.6;
    const top = up ? y - height * (2 / 3) : y + height * (2 / 3);
    const base = up ? y + height / 3 : y - height / 3;
    ctx.moveTo(x, top);
    ctx.lineTo(x + half, base);
    ctx.lineTo(x - half, base);
    ctx.closePath();
  } else if (shape === 'diamond') {
    const r = size / 2 - inset;
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r, y);
    ctx.closePath();
  } else if (shape === 'circle') {
    ctx.moveTo(x + size / 2 - inset, y);
    ctx.arc(x, y, Math.max(0.5, size / 2 - inset), 0, Math.PI * 2);
  } else if (shape === 'tile') {
    const half = size / 2 - Math.max(inset, size * 0.06);
    const r = Math.min(half, size * 0.22);
    ctx.roundRect(x - half, y - half, half * 2, half * 2, r);
  } else if (shape === 'cross') {
    const arm = size * 0.16 + inset;
    ctx.moveTo(x - arm, y);
    ctx.lineTo(x + arm, y);
    ctx.moveTo(x, y - arm);
    ctx.lineTo(x, y + arm);
  } else if (shape === 'dot') {
    const r = size * 0.05 + inset;
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, Math.PI * 2);
  } else {
    const half = size / 2 - inset;
    ctx.rect(x - half, y - half, half * 2, half * 2);
  }
};

export default function ShapeGrid({
  shape = 'square',
  cellSize = 40,
  lineWidth = 1,
  direction = 'diagonal',
  speed = 0.5,
  lineColor = '#2a2734',
  hoverColor = '#ffffff',
  hoverFillColor,
  fillOpacity = 0.15,
  rainbow = false,
  tiltX = 0,
  tiltY = 0,
  radius = 1.5,
  trail = 0.6,
  glow = 0.35,
  twinkle = 0,
  fade = 1,
  clickCascade = true,
  intro = true,
  opacity = 1,
  backgroundColor = 'transparent',
  paused = false,
  dpr,
  className = '',
  style
}: ShapeGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const settingsRef = useRef<Settings>(null as unknown as Settings);

  settingsRef.current = {
    shape: SHAPES.includes(shape) ? shape : 'square',
    cellSize: Math.max(8, cellSize),
    lineWidth: Math.max(0.25, lineWidth),
    direction: DIRECTIONS[direction] ? direction : 'diagonal',
    speed: Math.max(0, speed),
    lineColor,
    hoverColor,
    hoverFillColor: hoverFillColor ?? hoverColor,
    fillOpacity: clamp(fillOpacity, 0, 1),
    rainbow,
    tone: clamp(lightnessOf(hoverColor), 0.45, 0.68),
    tiltX: clamp(tiltX, -70, 70),
    tiltY: clamp(tiltY, -70, 70),
    radius: Math.max(0, radius),
    trail: Math.max(0.05, trail),
    glow: clamp(glow, 0, 1),
    twinkle: clamp(twinkle, 0, 1),
    clickCascade,
    intro,
    paused,
    dpr
  };

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    const state = {
      alive: true,
      raf: 0,
      last: 0,
      time: 0,
      visible: true,
      width: 1,
      height: 1,
      ratio: 1,
      view: flatView(1, 1),
      offsetX: 0,
      offsetY: 0,
      started: false,
      startedAt: 0,
      inside: false,
      pointerX: 0,
      pointerY: 0,
      spotX: 0,
      spotY: 0,
      spotVX: 0,
      spotVY: 0,
      spotPower: 0,
      lit: new Map<number, number>(),
      hues: new Map<number, number>(),
      cascades: [] as Cascade[],
      cascadeHue: 0
    };

    const resize = () => {
      const s = settingsRef.current;
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      const view = viewFor(s.tiltX, s.tiltY, width, height, s.cellSize);
      let ratio = s.dpr ?? Math.min(window.devicePixelRatio || 1, 2);
      const pixels = view.width * view.height * ratio * ratio;
      if (pixels > MAX_PIXELS) ratio *= Math.sqrt(MAX_PIXELS / pixels);
      state.width = width;
      state.height = height;
      state.ratio = ratio;
      state.view = view;
      const pixelWidth = Math.max(1, Math.round(view.width * ratio));
      const pixelHeight = Math.max(1, Math.round(view.height * ratio));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      const cssWidth = `${view.width}px`;
      const cssHeight = `${view.height}px`;
      if (canvas.style.width !== cssWidth) canvas.style.width = cssWidth;
      if (canvas.style.height !== cssHeight) canvas.style.height = cssHeight;
      if (canvas.style.transform !== view.transform) canvas.style.transform = view.transform;
    };

    const toPlane = (x: number, y: number): number[] | null => {
      const { inverse, far } = state.view;
      if (!inverse) return [x, y];
      if (inverse[6] * x + inverse[7] * y + inverse[8] < 1 / far) return null;
      return project(inverse, x, y);
    };

    const range = (layout: Layout, margin: number) => {
      const { stepX, stepY } = layout;
      const { view } = state;
      return [
        Math.floor((state.offsetX + view.x0 - margin) / stepX) - 1,
        Math.ceil((state.offsetX + view.x0 + view.width + margin) / stepX) + 1,
        Math.floor((state.offsetY + view.y0 - margin) / stepY) - 1,
        Math.ceil((state.offsetY + view.y0 + view.height + margin) / stepY) + 1
      ];
    };

    const nearestCell = (s: Settings, layout: Layout, wx: number, wy: number) => {
      const { stepX, stepY } = layout;
      const ci = Math.round(wx / stepX);
      const cj = Math.round(wy / stepY);
      let best = Infinity;
      let cell = [ci, cj];
      for (let i = ci - 2; i <= ci + 2; i++) {
        for (let j = cj - 2; j <= cj + 2; j++) {
          const [x, y] = centerOf(s.shape, layout, i, j);
          const d = (x - wx) ** 2 + (y - wy) ** 2;
          if (d < best) {
            best = d;
            cell = [i, j];
          }
        }
      }
      return cell;
    };

    const illuminate = (s: Settings, layout: Layout, dt: number) => {
      const decay = Math.exp(-dt / s.trail);
      for (const [key, value] of state.lit) {
        const next = value * decay;
        if (next < 0.004) {
          state.lit.delete(key);
          state.hues.delete(key);
        } else state.lit.set(key, next);
      }
      if (state.spotPower < 0.01) return;
      const wx = state.spotX + state.offsetX;
      const wy = state.spotY + state.offsetY;
      const reach = Math.max(s.radius, 0.5) * s.cellSize;
      const [hi, hj] = nearestCell(s, layout, wx, wy);
      const spanI = Math.ceil(reach / layout.stepX) + 2;
      const spanJ = Math.ceil(reach / layout.stepY) + 2;
      const hue = state.time * 120;
      for (let i = hi - spanI; i <= hi + spanI; i++) {
        for (let j = hj - spanJ; j <= hj + spanJ; j++) {
          const [x, y] = centerOf(s.shape, layout, i, j);
          const distance = Math.hypot(x - wx, y - wy);
          let value = s.radius > 0 ? smoothstep(reach, reach * 0.15, distance) : 0;
          if (i === hi && j === hj) value = Math.max(value, 1);
          value *= state.spotPower;
          if (value <= 0.004) continue;
          const key = keyOf(i, j);
          if (value > (state.lit.get(key) ?? 0)) {
            state.lit.set(key, value);
            state.hues.set(key, hue + ((x + y) / s.cellSize) * 12);
          }
        }
      }
    };

    const cascadeAt = (s: Settings, x: number, y: number) => {
      let value = 0;
      for (const cascade of state.cascades) {
        const ring = Math.round(Math.hypot(x - cascade.x, y - cascade.y) / s.cellSize);
        const local = state.time - cascade.time - ring * 0.055;
        if (local < 0) continue;
        const pulse = Math.exp(-((local / 0.085) ** 2)) * cascade.power * Math.max(0, 1 - ring / cascade.reach);
        if (pulse > value) {
          value = pulse;
          state.cascadeHue = cascade.hue + ring * 16;
        }
      }
      return value;
    };

    const draw = () => {
      const s = settingsRef.current;
      const { view, ratio } = state;
      const layout = layoutFor(s.shape, s.cellSize);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(ratio, 0, 0, ratio, -view.x0 * ratio, -view.y0 * ratio);

      const left = view.x0;
      const top = view.y0;
      const right = view.x0 + view.width;
      const bottom = view.y0 + view.height;
      const size = s.cellSize;
      const [i0, i1, j0, j1] = range(layout, size);
      const markers = s.shape === 'cross' || s.shape === 'dot';
      const elapsed = state.time - state.startedAt;
      const introRadius = s.intro && !reduce ? elapsed * view.reach * 1.8 : Infinity;
      const originX = state.width / 2;
      const originY = state.height / 2;
      const centerX = originX + state.offsetX;
      const centerY = originY + state.offsetY;

      ctx.lineWidth = s.lineWidth;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = s.lineColor;
      ctx.fillStyle = s.lineColor;
      ctx.beginPath();
      if (s.shape === 'square') {
        for (let i = i0; i <= i1; i++) {
          const x = i * layout.stepX - state.offsetX;
          ctx.moveTo(x, top - size);
          ctx.lineTo(x, bottom + size);
        }
        for (let j = j0; j <= j1; j++) {
          const y = j * layout.stepY - state.offsetY;
          ctx.moveTo(left - size, y);
          ctx.lineTo(right + size, y);
        }
      } else {
        for (let i = i0; i <= i1; i++) {
          for (let j = j0; j <= j1; j++) {
            const [cx, cy] = centerOf(s.shape, layout, i, j);
            traceCell(ctx, s.shape, layout, size, i, j, cx - state.offsetX, cy - state.offsetY, 0);
          }
        }
      }
      if (s.shape === 'dot') ctx.fill();
      else ctx.stroke();

      if (introRadius !== Infinity) {
        const gradient = ctx.createRadialGradient(originX, originY, 0, originX, originY, Math.max(1, introRadius));
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.82, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillStyle = gradient;
        ctx.fillRect(left, top, view.width, view.height);
        ctx.globalCompositeOperation = 'source-over';
      }

      const glowing = s.glow > 0;
      for (let i = i0; i <= i1; i++) {
        for (let j = j0; j <= j1; j++) {
          const [cx, cy] = centerOf(s.shape, layout, i, j);
          const key = keyOf(i, j);
          let value = state.lit.get(key) ?? 0;
          let hue = state.hues.get(key) ?? 0;
          if (state.cascades.length) {
            const pulse = cascadeAt(s, cx, cy);
            if (pulse > value) {
              value = pulse;
              hue = state.cascadeHue;
            }
          }
          if (s.twinkle > 0 && !reduce) {
            const seed = hash(i, j);
            const wave = Math.sin(state.time * (0.35 + seed * 0.5) + seed * 40);
            const sparkle = s.twinkle * 0.7 * Math.max(0, wave) ** 18;
            if (sparkle > value) {
              value = sparkle;
              hue = seed * 360;
            }
          }
          if (introRadius !== Infinity) {
            const front = introRadius - Math.hypot(cx - centerX, cy - centerY);
            if (front < 0) continue;
            const wave = Math.exp(-((front / (size * 1.4)) ** 2)) * 0.85;
            if (wave > value) {
              value = wave;
              hue = (Math.atan2(cy - centerY, cx - centerX) * 180) / Math.PI + state.time * 120;
            }
          }
          if (value <= 0.01) continue;
          const color = s.rainbow ? tint(hue, s.tone) : s.hoverColor;
          const x = cx - state.offsetX;
          const y = cy - state.offsetY;
          ctx.beginPath();
          traceCell(ctx, s.shape, layout, size, i, j, x, y, markers ? value * size * 0.08 : s.lineWidth * 0.5);
          if (markers) {
            ctx.globalAlpha = Math.min(1, value);
            if (glowing) {
              ctx.shadowColor = color;
              ctx.shadowBlur = s.glow * 14 * value;
            }
            if (s.shape === 'dot') {
              ctx.fillStyle = color;
              ctx.fill();
            } else {
              ctx.strokeStyle = color;
              ctx.lineWidth = s.lineWidth * (1 + value * 0.6);
              ctx.stroke();
            }
            ctx.shadowBlur = 0;
            continue;
          }
          if (s.fillOpacity > 0) {
            ctx.globalAlpha = Math.min(1, value) * s.fillOpacity;
            ctx.fillStyle = s.rainbow ? color : s.hoverFillColor;
            ctx.fill();
          }
          ctx.globalAlpha = Math.min(1, value) * 0.85;
          if (glowing) {
            ctx.shadowColor = color;
            ctx.shadowBlur = s.glow * 16 * value;
          }
          ctx.strokeStyle = color;
          ctx.lineWidth = s.lineWidth;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }
      ctx.globalAlpha = 1;

      if (view.mist) {
        const [mx0, my0, mx1, my1] = view.mist;
        const gradient = ctx.createLinearGradient(mx0, my0, mx1, my1);
        for (let k = 0; k <= 8; k++) {
          const t = k / 8;
          gradient.addColorStop(t, `rgba(0, 0, 0, ${(1 - smootherstep(t)).toFixed(3)})`);
        }
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillStyle = gradient;
        ctx.fillRect(left, top, view.width, view.height);
        ctx.globalCompositeOperation = 'source-over';
      }
    };

    const frame = (now: number) => {
      state.raf = 0;
      if (!state.alive) return;
      const s = settingsRef.current;
      const dt = state.last ? Math.min(0.05, (now - state.last) / 1000) : 1 / 60;
      state.last = now;
      resize();
      if (!state.started) {
        state.started = true;
        state.startedAt = state.time;
      }
      if (!s.paused) {
        state.time += dt;
        if (!reduce) {
          const [dx, dy] = DIRECTIONS[s.direction];
          state.offsetX -= dx * s.speed * 60 * dt;
          state.offsetY -= dy * s.speed * 60 * dt;
        }
        const want = state.inside ? 1 : 0;
        state.spotPower += (want - state.spotPower) * (1 - Math.exp(-(want ? 10 : 5) * dt));
        const stiffness = 220;
        const damping = 2 * Math.sqrt(stiffness) * 0.85;
        state.spotVX += (stiffness * (state.pointerX - state.spotX) - damping * state.spotVX) * dt;
        state.spotVY += (stiffness * (state.pointerY - state.spotY) - damping * state.spotVY) * dt;
        state.spotX += state.spotVX * dt;
        state.spotY += state.spotVY * dt;
        illuminate(s, layoutFor(s.shape, s.cellSize), dt);
        state.cascades = state.cascades.filter(cascade => state.time - cascade.time < cascade.reach * 0.055 + 0.4);
      }
      draw();
      const settled =
        s.paused ||
        (s.speed === 0 || s.direction === 'none' || reduce
          ? state.lit.size === 0 &&
            state.cascades.length === 0 &&
            s.twinkle === 0 &&
            state.spotPower < 0.005 &&
            state.time - state.startedAt > 3
          : false);
      if (!settled && state.visible) state.raf = requestAnimationFrame(frame);
      else state.last = 0;
    };

    const wake = () => {
      if (!state.raf && state.alive && state.visible) state.raf = requestAnimationFrame(frame);
    };

    const pointFrom = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;
      return toPlane(x, y);
    };

    const onMove = (event: PointerEvent) => {
      const point = pointFrom(event);
      if (point && !state.inside && state.spotPower < 0.02) {
        state.spotX = point[0];
        state.spotY = point[1];
        state.spotVX = 0;
        state.spotVY = 0;
      }
      state.inside = point !== null;
      if (point) {
        state.pointerX = point[0];
        state.pointerY = point[1];
        wake();
      }
    };

    const onLeave = () => {
      state.inside = false;
    };

    const onDown = (event: PointerEvent) => {
      const s = settingsRef.current;
      if (!s.clickCascade) return;
      const point = pointFrom(event);
      if (!point) return;
      state.cascades.push({
        x: point[0] + state.offsetX,
        y: point[1] + state.offsetY,
        time: state.time,
        power: 1,
        reach: Math.hypot(state.view.width, state.view.height) / s.cellSize,
        hue: state.time * 120
      });
      if (state.cascades.length > 6) state.cascades.shift();
      wake();
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      draw();
      wake();
    });
    resizeObserver.observe(container);

    const visibility = new IntersectionObserver(entries => {
      state.visible = entries.some(entry => entry.isIntersecting);
      if (state.visible) wake();
    });
    visibility.observe(container);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);

    engineRef.current = {
      redraw: () => {
        resize();
        draw();
        wake();
      }
    };

    resize();
    wake();

    return () => {
      state.alive = false;
      cancelAnimationFrame(state.raf);
      resizeObserver.disconnect();
      visibility.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.redraw();
  });

  const mask = fadeMask(clamp(fade, 0, 1));

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden ${className}`.trim()}
      style={{
        opacity: clamp(opacity, 0, 1),
        backgroundColor,
        ...(mask === 'none'
          ? null
          : { maskImage: mask, WebkitMaskImage: mask, maskComposite: 'intersect', WebkitMaskComposite: 'source-in' }),
        ...style
      }}
    >
      <canvas ref={canvasRef} className="absolute left-0 top-0 block origin-top-left" />
    </div>
  );
}
