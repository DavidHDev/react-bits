'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactNode
} from 'react';
import './PixelSwap.css';

export interface PixelSwapProps {
  firstContent?: ReactNode;
  secondContent?: ReactNode;
  pattern?:
    | 'pointer'
    | 'random'
    | 'center'
    | 'edges'
    | 'left-to-right'
    | 'right-to-left'
    | 'top-to-bottom'
    | 'bottom-to-top'
    | 'diagonal'
    | 'spiral';
  pixelSize?: number;
  gap?: number;
  pixelRadius?: number;
  pixelScale?: number;
  pixelSpin?: number;
  duration?: number;
  pixelDuration?: number;
  randomness?: number;
  bounce?: number;
  trigger?: 'hover' | 'click' | 'none';
  intro?: boolean;
  initialActive?: boolean;
  active?: boolean;
  onActiveChange?: (active: boolean) => void;
  onComplete?: (active: boolean) => void;
  aspectRatio?: string;
  className?: string;
  style?: CSSProperties;
}

interface Point {
  x: number;
  y: number;
}

interface Grid {
  count: number;
  size: number;
  stride: number;
  gap: number;
  width: number;
  height: number;
  cx: Float32Array;
  cy: Float32Array;
  gx: Float32Array;
  gy: Float32Array;
}

interface Engine {
  mode: 'intro' | 'swap';
  grid: Grid;
  value: Float32Array;
  velocity: Float32Array;
  flipAt: Float64Array;
  target: Uint8Array;
  desired: number;
  last: number;
  running: boolean;
  raf: number;
}

const MAX_PIXELS = 600;
const STEP = 1 / 240;
const PATTERNS = [
  'pointer',
  'random',
  'center',
  'edges',
  'left-to-right',
  'right-to-left',
  'top-to-bottom',
  'bottom-to-top',
  'diagonal',
  'spiral'
];

const ROOT = 'pixel-swap';
const LAYER = 'pixel-swap__layer';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

const hash = (index: number) => {
  let h = Math.imul(index + 1, 0x27d4eb2d);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const round = (value: number) => Math.round(value * 10) / 10;

const buildGrid = (width: number, height: number, pixelSize: number, gap: number): Grid => {
  let size = pixelSize;
  let columns = Math.max(1, Math.ceil((width + gap) / (size + gap)));
  let rows = Math.max(1, Math.ceil((height + gap) / (size + gap)));
  if (columns * rows > MAX_PIXELS) {
    size = Math.ceil(size * Math.sqrt((columns * rows) / MAX_PIXELS));
    columns = Math.max(1, Math.ceil((width + gap) / (size + gap)));
    rows = Math.max(1, Math.ceil((height + gap) / (size + gap)));
  }
  const stride = size + gap;
  const startX = (width - (columns * stride - gap)) / 2;
  const startY = (height - (rows * stride - gap)) / 2;
  const count = columns * rows;
  const cx = new Float32Array(count);
  const cy = new Float32Array(count);
  const gx = new Float32Array(count);
  const gy = new Float32Array(count);
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const index = row * columns + column;
      cx[index] = startX + column * stride + size / 2;
      cy[index] = startY + row * stride + size / 2;
      gx[index] = columns > 1 ? column / (columns - 1) : 0.5;
      gy[index] = rows > 1 ? row / (rows - 1) : 0.5;
    }
  }
  return { count, size, stride, gap, width, height, cx, cy, gx, gy };
};

const orderOf = (grid: Grid, index: number, pattern: string, point: Point | null) => {
  const x = grid.gx[index];
  const y = grid.gy[index];
  if (pattern === 'random') return hash(index + 11);
  if (pattern === 'center') return Math.hypot(x - 0.5, y - 0.5) / Math.SQRT1_2;
  if (pattern === 'edges') return 1 - Math.min(x, 1 - x, y, 1 - y) * 2;
  if (pattern === 'left-to-right') return x;
  if (pattern === 'right-to-left') return 1 - x;
  if (pattern === 'top-to-bottom') return y;
  if (pattern === 'bottom-to-top') return 1 - y;
  if (pattern === 'diagonal') return (x + y) / 2;
  if (pattern === 'spiral') {
    const angle = (Math.atan2(y - 0.5, x - 0.5) + Math.PI) / (Math.PI * 2);
    return (angle + Math.hypot(x - 0.5, y - 0.5) / Math.SQRT1_2) / 2;
  }
  const px = point ? point.x : grid.width / 2;
  const py = point ? point.y : grid.height / 2;
  const reach = Math.max(
    Math.hypot(px, py),
    Math.hypot(grid.width - px, py),
    Math.hypot(px, grid.height - py),
    Math.hypot(grid.width - px, grid.height - py),
    1
  );
  return Math.hypot(grid.cx[index] - px, grid.cy[index] - py) / reach;
};

const pixelPath = (x: number, y: number, half: number, radius: number, angle: number) => {
  if (!angle) {
    const x0 = round(x - half);
    const x1 = round(x + half);
    const y0 = round(y - half);
    const y1 = round(y + half);
    if (radius < 0.2) return `M${x0} ${y0}H${x1}V${y1}H${x0}Z`;
    const r = round(radius);
    return `M${round(x0 + r)} ${y0}H${round(x1 - r)}A${r} ${r} 0 0 1 ${x1} ${round(y0 + r)}V${round(y1 - r)}A${r} ${r} 0 0 1 ${round(x1 - r)} ${y1}H${round(x0 + r)}A${r} ${r} 0 0 1 ${x0} ${round(y1 - r)}V${round(y0 + r)}A${r} ${r} 0 0 1 ${round(x0 + r)} ${y0}Z`;
  }
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const at = (u: number, v: number) => `${round(x + u * cos - v * sin)} ${round(y + u * sin + v * cos)}`;
  const h = half;
  if (radius < 0.2) return `M${at(-h, -h)}L${at(h, -h)}L${at(h, h)}L${at(-h, h)}Z`;
  const r = round(radius);
  const k = h - radius;
  return `M${at(-k, -h)}L${at(k, -h)}A${r} ${r} 0 0 1 ${at(h, -k)}L${at(h, k)}A${r} ${r} 0 0 1 ${at(k, h)}L${at(-k, h)}A${r} ${r} 0 0 1 ${at(-h, k)}L${at(-h, -k)}A${r} ${r} 0 0 1 ${at(-k, -h)}Z`;
};

function PixelSwap({
  firstContent,
  secondContent,
  pattern = 'pointer',
  pixelSize = 48,
  gap = 0,
  pixelRadius = 0,
  pixelScale = 0,
  pixelSpin = 0,
  duration = 400,
  pixelDuration = 350,
  randomness = 0.2,
  bounce = 0.3,
  trigger = 'hover',
  intro = true,
  initialActive = false,
  active,
  onActiveChange,
  onComplete,
  aspectRatio = '16 / 10',
  className = '',
  style
}: PixelSwapProps) {
  const controlled = active !== undefined;
  const [shown, setShown] = useState(controlled ? active : initialActive);
  const rootRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shownRef = useRef(shown);
  const desiredRef = useRef(shown);
  const pointRef = useRef<Point | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const waitingRef = useRef(false);

  const settings = {
    pattern: PATTERNS.includes(pattern) ? pattern : 'pointer',
    pixelSize: Math.max(8, Math.round(pixelSize)),
    gap: Math.max(0, gap),
    pixelRadius: clamp(pixelRadius, 0, 50),
    pixelScale: clamp(pixelScale, 0, 0.9),
    pixelSpin: (clamp(pixelSpin, -360, 360) * Math.PI) / 180,
    duration: Math.max(0, duration),
    pixelDuration: Math.max(60, pixelDuration),
    randomness: clamp(randomness, 0, 1),
    bounce: clamp(bounce, 0, 1),
    onComplete
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const setLayer = (index: number, visible: boolean, clip: string) => {
    const layer = layerRefs.current[index];
    if (!layer) return;
    layer.setAttribute('data-visible', String(visible));
    layer.style.clipPath = clip || '';
  };

  const finish = () => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.running = false;
    rootRef.current?.removeAttribute('data-swapping');
    if (engine.mode === 'intro') {
      setLayer(0, !shownRef.current, '');
      engine.mode = 'swap';
      if (desiredRef.current !== shownRef.current) requestRef.current(desiredRef.current, pointRef.current);
      return;
    }
    const target = engine.desired === 1;
    setLayer(1, target, '');
    setLayer(0, !target, '');
    shownRef.current = target;
    setShown(target);
    settingsRef.current.onComplete?.(target);
  };

  const frame = (now: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    const s = settingsRef.current;
    const grid = engine.grid;
    const { value, velocity, flipAt, target } = engine;
    const elapsed = clamp((now - engine.last) / 1000, 0, 1 / 20);
    engine.last = now;
    const omega = (Math.PI * 2) / (s.pixelDuration / 1000);
    const zeta = clamp(1 - s.bounce, 0.15, 1);
    const steps = Math.max(1, Math.ceil(elapsed / STEP));
    const dt = elapsed / steps;
    const pop = s.pixelScale;
    const half = grid.size / 2;
    const cover = grid.gap / 2 + 0.5;
    let moving = false;
    let path = '';

    for (let i = 0; i < grid.count; i++) {
      if (now >= flipAt[i] && target[i] !== engine.desired) {
        target[i] = engine.desired;
        if (target[i] === 1 && value[i] < pop) value[i] = pop;
      }
      let x = value[i];
      let v = velocity[i];
      const goal = target[i];
      for (let n = 0; n < steps; n++) {
        v += (-omega * omega * (x - goal) - 2 * zeta * omega * v) * dt;
        x += v * dt;
      }
      if (goal === 0 && x <= pop) {
        x = 0;
        v = 0;
      }
      if (Math.abs(x - goal) > 0.001 || Math.abs(v) > 0.01 || now < flipAt[i]) moving = true;
      else {
        x = goal;
        v = 0;
      }
      value[i] = x;
      velocity[i] = v;
      if (x <= 0.002) continue;
      const size = Math.min(x * 1.08, 1.25) * (half + cover * smoothstep(0.6, 0.93, x));
      const radius = Math.min(size, (s.pixelRadius / 50) * size * (1 - smoothstep(0.6, 0.93, x)));
      path += pixelPath(grid.cx[i], grid.cy[i], size, radius, s.pixelSpin * (1 - x));
    }

    const layer = engine.mode === 'intro' ? 0 : 1;
    setLayer(layer, path !== '', path ? `path('${path}')` : '');

    if (moving) engine.raf = requestAnimationFrame(frame);
    else finish();
  };

  const launch = (mode: Engine['mode'], to: boolean, point: Point | null) => {
    const root = rootRef.current;
    const s = settingsRef.current;
    let engine: Engine | null = engineRef.current;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const width = root?.clientWidth ?? 0;
    const height = root?.clientHeight ?? 0;
    if (!root || reduce || !width || !height) return false;

    const now = performance.now();
    if (!engine?.running) {
      const grid = buildGrid(width, height, s.pixelSize, s.gap);
      const start = mode === 'intro' ? 0 : shownRef.current ? 1 : 0;
      engine = {
        mode,
        grid,
        value: new Float32Array(grid.count).fill(start),
        velocity: new Float32Array(grid.count),
        flipAt: new Float64Array(grid.count),
        target: new Uint8Array(grid.count).fill(start),
        desired: start,
        last: now,
        running: true,
        raf: engineRef.current?.raf ?? 0
      };
      engineRef.current = engine;
    }
    engine.desired = to ? 1 : 0;
    const grid = engine.grid;
    const orders = new Float32Array(grid.count);
    let first = Infinity;
    for (let i = 0; i < grid.count; i++) {
      orders[i] = orderOf(grid, i, s.pattern, point) * (1 - s.randomness) + hash(i) * s.randomness;
      const settled = engine.target[i] === engine.desired && Math.abs(engine.value[i] - engine.desired) < 0.001;
      if (!settled) first = Math.min(first, orders[i]);
    }
    if (first === Infinity) first = 0;
    for (let i = 0; i < grid.count; i++) engine.flipAt[i] = now + Math.max(0, orders[i] - first) * s.duration;
    root.setAttribute('data-swapping', '');
    if (mode === 'swap') setLayer(0, true, '');
    cancelAnimationFrame(engine.raf);
    engine.raf = requestAnimationFrame(frame);
    return true;
  };

  const request = (to: boolean, point: Point | null) => {
    const engine = engineRef.current;
    if (waitingRef.current || (engine?.running && engine.mode === 'intro')) return;
    if (!engine?.running && shownRef.current === to) return;
    if (launch('swap', to, point)) return;
    setLayer(1, to, '');
    setLayer(0, !to, '');
    shownRef.current = to;
    setShown(to);
    settingsRef.current.onComplete?.(to);
  };
  const requestRef = useRef(request);
  requestRef.current = request;

  const ask = (next: boolean, point: Point | null) => {
    desiredRef.current = next;
    pointRef.current = point;
    onActiveChange?.(next);
    if (!controlled) request(next, point);
  };

  const launchRef = useRef(launch);
  launchRef.current = launch;

  useIsoLayoutEffect(() => {
    if (!intro || shownRef.current) return;
    const images = [...(layerRefs.current[0]?.querySelectorAll('img') ?? [])].filter(image => !image.complete);
    let started = false;
    let timer = 0;
    const begin = () => {
      if (started) return;
      started = true;
      clearTimeout(timer);
      waitingRef.current = false;
      if (launchRef.current('intro', true, null)) return;
      setLayer(0, true, '');
      if (desiredRef.current !== shownRef.current) requestRef.current(desiredRef.current, pointRef.current);
    };
    setLayer(0, false, '');
    if (!images.length) {
      begin();
      return undefined;
    }
    waitingRef.current = true;
    let left = images.length;
    const settle = () => {
      left -= 1;
      if (left <= 0) begin();
    };
    images.forEach(image => {
      image.addEventListener('load', settle, { once: true });
      image.addEventListener('error', settle, { once: true });
    });
    timer = setTimeout(begin, 3000);
    return () => {
      started = true;
      clearTimeout(timer);
      waitingRef.current = false;
      images.forEach(image => {
        image.removeEventListener('load', settle);
        image.removeEventListener('error', settle);
      });
    };
  }, []);

  useEffect(() => {
    if (active === undefined) return;
    desiredRef.current = active;
    requestRef.current(active, pointRef.current);
  }, [active]);

  useEffect(
    () => () => {
      const engine = engineRef.current;
      if (!engine) return;
      cancelAnimationFrame(engine.raf);
      engine.running = false;
    },
    []
  );

  const pointOf = (event: ReactMouseEvent<HTMLDivElement>): Point | null => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect || (event.detail === 0 && event.clientX === 0 && event.clientY === 0)) return null;
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const handlers: HTMLAttributes<HTMLDivElement> = {};
  if (trigger === 'hover') {
    handlers.onPointerEnter = event => {
      if (event.pointerType !== 'touch') ask(true, pointOf(event));
    };
    handlers.onPointerLeave = event => {
      if (event.pointerType !== 'touch') ask(false, pointOf(event));
    };
    handlers.onClick = event => {
      const native = event.nativeEvent;
      const touch = 'pointerType' in native && native.pointerType === 'touch';
      if (event.detail === 0 || touch) ask(!desiredRef.current, pointOf(event));
    };
    handlers.onFocus = event => {
      if (event.target === event.currentTarget && event.currentTarget.matches(':focus-visible')) ask(true, null);
    };
    handlers.onBlur = () => ask(false, null);
    handlers.tabIndex = 0;
  } else if (trigger === 'click') {
    handlers.onClick = event => ask(!desiredRef.current, pointOf(event));
    handlers.onKeyDown = event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      ask(!desiredRef.current, null);
    };
    handlers.role = 'button';
    handlers.tabIndex = 0;
    handlers['aria-pressed'] = shown;
  }

  return (
    <div
      ref={rootRef}
      className={[ROOT, className].filter(Boolean).join(' ')}
      style={{ aspectRatio, ...style }}
      data-active={shown ? '' : undefined}
      {...handlers}
    >
      {[firstContent, secondContent].map((content, index) => (
        <div
          key={index}
          ref={element => {
            layerRefs.current[index] = element;
          }}
          className={LAYER}
          style={{ zIndex: index }}
          data-visible={String(index === (shown ? 1 : 0))}
          aria-hidden={index !== (shown ? 1 : 0)}
        >
          {content}
        </div>
      ))}
    </div>
  );
}

export default PixelSwap;
