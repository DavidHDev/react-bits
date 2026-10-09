'use client';

import React, { isValidElement, useEffect, useMemo, useRef, useState } from 'react';

export type GridMotionItem = React.ReactNode | { src: string; alt?: string };

export type GridMotionDirection = 'alternate' | 'left' | 'right';

export type GridMotionProps = {
  items?: GridMotionItem[];
  rows?: number;
  aspectRatio?: number;
  gap?: number;
  radius?: number;
  angle?: number;
  tilt?: number;
  speed?: number;
  direction?: GridMotionDirection;
  parallax?: number;
  spotlight?: number;
  dim?: number;
  grayscale?: boolean;
  fade?: number;
  tileColor?: string;
  textColor?: string;
  theme?: 'dark' | 'light';
  className?: string;
  style?: React.CSSProperties;
};

type TileData =
  | { kind: 'empty' }
  | { kind: 'node'; node: React.ReactNode }
  | { kind: 'image'; src: string; alt: string }
  | { kind: 'text'; text: string };

type Motion = {
  offsets: number[];
  shifts: number[];
  intro: number;
  pointer: { x: number; y: number; active: boolean };
};

const ROOT = 'relative isolate h-full w-full overflow-hidden';
const PLANE = 'absolute top-1/2 left-1/2 opacity-0';
const ROW = 'absolute left-0 flex gap-[var(--gm-gap)] will-change-transform';
const TILE =
  "relative flex h-[var(--gm-tile-h)] w-[var(--gm-tile-w)] flex-none items-center justify-center overflow-hidden rounded-[var(--gm-radius)] [background:var(--gm-tile)] text-center text-[length:var(--gm-font)] leading-[1.2] text-[color:var(--gm-text)] opacity-[calc(1_-_var(--gm-dim)_*_(1_-_var(--spot,0)))] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_0_0_1px_var(--gm-border)] after:content-['']";
const TILE_GRAY = '[filter:grayscale(calc(1_-_var(--spot,0)))]';
const IMG = 'pointer-events-none block h-full w-full object-cover select-none';

const THEMES = {
  dark: {
    tile: '#1b1922',
    text: 'rgba(255, 255, 255, 0.78)',
    border: 'rgba(255, 255, 255, 0.07)'
  },
  light: {
    tile: '#f4f4f5',
    text: '#3f3f46',
    border: 'rgba(24, 24, 27, 0.08)'
  }
};

const DIRECTIONS: GridMotionDirection[] = ['alternate', 'left', 'right'];
const IMAGE = /^(https?:\/\/|\/\/|\/|\.\.?\/|data:image\/|blob:)|\.(avif|gif|jpe?g|png|svg|webp)(\?.*)?$/i;
const INERTIA = [0.42, 0.32, 0.26, 0.22];
const PACE = [1, 0.86, 1.12, 0.94];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const wrap = (value: number, total: number) => ((value % total) + total) % total;
const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

const feather = (side: string, zone: number) => {
  const stops: string[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const alpha = t * t * t * (t * (t * 6 - 15) + 10);
    stops.push(`rgba(0, 0, 0, ${alpha.toFixed(4)}) ${(t * zone).toFixed(2)}%`);
  }
  const mirrored = stops.map((_, i) => {
    const t = (12 - i) / 12;
    const alpha = t * t * t * (t * (t * 6 - 15) + 10);
    return `rgba(0, 0, 0, ${alpha.toFixed(4)}) ${(100 - t * zone).toFixed(2)}%`;
  });
  return `linear-gradient(${side}, ${stops.join(', ')}, ${mirrored.join(', ')})`;
};

const toTile = (item: GridMotionItem): TileData => {
  if (item === null || item === undefined || item === false) return { kind: 'empty' };
  if (isValidElement(item)) return { kind: 'node', node: item };
  if (typeof item === 'object' && 'src' in item && typeof item.src === 'string') {
    return { kind: 'image', src: item.src, alt: item.alt ?? '' };
  }
  const text = String(item).trim();
  return IMAGE.test(text) ? { kind: 'image', src: text, alt: '' } : { kind: 'text', text };
};

const EMPTY: TileData = { kind: 'empty' };

const Tile = ({ tile, gray }: { tile: TileData; gray: boolean }) => (
  <div className={gray ? `${TILE} ${TILE_GRAY}` : TILE}>
    {tile.kind === 'image' && <img className={IMG} src={tile.src} alt={tile.alt} draggable={false} decoding="async" />}
    {tile.kind === 'text' && <span className="px-[1em]">{tile.text}</span>}
    {tile.kind === 'node' && tile.node}
  </div>
);

const GridMotion = ({
  items = [],
  rows = 4,
  aspectRatio = 1.33,
  gap = 16,
  radius = 14,
  angle = -12,
  tilt = 0,
  speed = 24,
  direction = 'alternate',
  parallax = 0.5,
  spotlight = 0.6,
  dim = 0.35,
  grayscale = false,
  fade = 0.5,
  tileColor,
  textColor,
  theme = 'dark',
  className = '',
  style
}: GridMotionProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef<Motion>({ offsets: [], shifts: [], intro: 0, pointer: { x: 0, y: 0, active: false } });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const palette = THEMES[theme] ?? THEMES.dark;
  const settings = {
    rows: clamp(Math.round(rows), 1, 12),
    aspect: clamp(aspectRatio, 0.3, 4),
    gap: Math.max(0, gap),
    angle,
    tilt: clamp(tilt, 0, 75),
    speed,
    direction: DIRECTIONS.includes(direction) ? direction : 'alternate',
    parallax: clamp(parallax, 0, 1),
    spotlight: clamp(spotlight, 0, 1),
    dim: clamp(dim, 0, 1),
    fade: clamp(fade, 0, 1)
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const layout = useMemo(() => {
    const { width, height } = size;
    if (!width || !height) return null;
    const turn = (settings.angle * Math.PI) / 180;
    const lean = (settings.tilt * Math.PI) / 180;
    const cos = Math.abs(Math.cos(turn));
    const sin = Math.abs(Math.sin(turn));
    const planeHeight = ((width * sin + height * cos) / Math.max(0.3, Math.cos(lean))) * 1.12;
    const planeWidth = (width * cos + height * sin) * (1 + Math.sin(lean) * 0.9) * 1.12;
    const tileHeight = Math.max(16, (planeHeight - settings.gap * (settings.rows - 1)) / settings.rows);
    const tileWidth = tileHeight * settings.aspect;
    const step = tileWidth + settings.gap;
    const perRow = Math.ceil(planeWidth / step) + 1;
    const period = perRow * step;
    return {
      planeWidth,
      planeHeight,
      tileWidth,
      tileHeight,
      step,
      perRow,
      period,
      copies: Math.ceil(planeWidth / period) + 2,
      top: (planeHeight - settings.rows * tileHeight - (settings.rows - 1) * settings.gap) / 2,
      perspective: Math.max(width, height) * 1.5
    };
  }, [size, settings.angle, settings.tilt, settings.rows, settings.gap, settings.aspect]);

  const tiles = useMemo(() => items.map(toTile), [items]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const observer = new ResizeObserver(() => {
      const width = Math.round(root.clientWidth);
      const height = Math.round(root.clientHeight);
      setSize(current => (current.width === width && current.height === height ? current : { width, height }));
    });
    observer.observe(root);
    const motion = motionRef.current;
    const onMove = (event: PointerEvent) => {
      motion.pointer.x = event.clientX;
      motion.pointer.y = event.clientY;
      motion.pointer.active = true;
    };
    const onUp = (event: PointerEvent) => {
      if (event.pointerType === 'touch') motion.pointer.active = false;
    };
    const onLeave = () => {
      motion.pointer.active = false;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('blur', onLeave);
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      observer.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('blur', onLeave);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const plane = planeRef.current;
    if (!root || !plane || !layout) return undefined;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const motion = motionRef.current;
    const rowEls = Array.from(plane.children) as HTMLElement[];
    const tileEls = rowEls.map(row => Array.from(row.children) as HTMLElement[]);
    const spots = tileEls.map(list => new Float32Array(list.length));
    const written = tileEls.map(list => new Float32Array(list.length));
    let raf = 0;
    let last = performance.now();
    let visible = true;
    let alive = true;
    if (motion.intro >= 1) plane.style.opacity = '1';

    const frame = (now: number) => {
      raf = 0;
      if (!alive) return;
      const s = settingsRef.current;
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;

      if (motion.intro < 1) {
        motion.intro = Math.min(1, motion.intro + dt / 0.9);
        plane.style.opacity = String(1 - (1 - motion.intro) ** 3);
      }

      const rect = root.getBoundingClientRect();
      const scale = rect.width ? root.clientWidth / rect.width : 1;
      const halfWidth = root.clientWidth / 2 || 1;
      const halfHeight = root.clientHeight / 2 || 1;
      const px = (motion.pointer.x - rect.left) * scale - halfWidth;
      const py = (motion.pointer.y - rect.top) * scale - halfHeight;
      const inside = motion.pointer.active && Math.abs(px) <= halfWidth && Math.abs(py) <= halfHeight;
      const lean = (s.tilt * Math.PI) / 180;
      const turn = (s.angle * Math.PI) / 180;
      const depth = layout.perspective;
      let flatY = py;
      let flatX = px;
      if (lean > 0.0001) {
        flatY = (py * depth) / (depth * Math.cos(lean) + py * Math.sin(lean));
        flatX = (px * (depth - flatY * Math.sin(lean))) / depth;
      }
      const planeX = flatX * Math.cos(turn) + flatY * Math.sin(turn);
      const planeY = -flatX * Math.sin(turn) + flatY * Math.cos(turn);
      const nudge = motion.pointer.active ? clamp(px / halfWidth, -1, 1) : 0;
      const reach = (0.6 + 2.2 * s.spotlight) * Math.max(layout.tileWidth, layout.tileHeight);
      const settle = 1 - Math.exp(-dt / 0.22);

      rowEls.forEach((row, r) => {
        const drift = s.direction === 'left' ? -1 : s.direction === 'right' ? 1 : r % 2 ? 1 : -1;
        if (motion.offsets[r] === undefined) {
          motion.offsets[r] = r * layout.step * 0.37;
          motion.shifts[r] = 0;
        }
        if (!reduce) motion.offsets[r] += s.speed * drift * PACE[r % PACE.length] * dt;
        const target = reduce ? 0 : s.parallax * layout.tileWidth * 1.2 * nudge * (r % 2 ? -1 : 1);
        motion.shifts[r] += (target - motion.shifts[r]) * (1 - Math.exp(-dt / INERTIA[r % INERTIA.length]));
        const x = -layout.period + wrap(motion.offsets[r] + motion.shifts[r], layout.period);
        row.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;

        const rowY = layout.top + r * (layout.tileHeight + s.gap) + layout.tileHeight / 2 - layout.planeHeight / 2;
        const left = x - layout.planeWidth / 2 + layout.tileWidth / 2;
        const list = tileEls[r];
        const values = spots[r];
        const marks = written[r];
        for (let k = 0; k < list.length; k++) {
          let wanted = 0;
          if (inside && s.spotlight > 0) {
            const distance = Math.hypot(left + k * layout.step - planeX, rowY - planeY) / reach;
            wanted = 1 - smoothstep(0.25, 1, distance);
          }
          values[k] += (wanted - values[k]) * settle;
          if (Math.abs(values[k] - marks[k]) > 0.004 || (wanted === 0 && values[k] < 0.004 && marks[k] !== 0)) {
            marks[k] = values[k] < 0.004 ? 0 : values[k];
            list[k].style.setProperty('--spot', marks[k].toFixed(3));
          }
        }
      });

      if (visible) raf = requestAnimationFrame(frame);
    };

    const visibility = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    });
    visibility.observe(root);
    raf = requestAnimationFrame(frame);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      visibility.disconnect();
    };
  }, [layout, tiles]);

  const rowTiles = layout
    ? Array.from({ length: settings.rows }, (_, r) =>
        Array.from({ length: layout.perRow }, (_, j) =>
          tiles.length ? tiles[(r * layout.perRow + j) % tiles.length] : EMPTY
        )
      )
    : [];
  const mask =
    settings.fade > 0
      ? `${feather('to right', settings.fade * 34)}, ${feather('to bottom', settings.fade * 44)}`
      : undefined;

  return (
    <div
      ref={rootRef}
      className={`${ROOT}${className ? ` ${className}` : ''}`}
      style={
        {
          '--gm-tile': tileColor ?? palette.tile,
          '--gm-text': textColor ?? palette.text,
          '--gm-border': palette.border,
          '--gm-radius': `${Math.max(0, radius)}px`,
          '--gm-dim': settings.dim,
          perspective: layout && settings.tilt > 0 ? `${layout.perspective}px` : undefined,
          maskImage: mask,
          WebkitMaskImage: mask,
          maskComposite: mask ? 'intersect' : undefined,
          WebkitMaskComposite: mask ? 'source-in' : undefined,
          ...style
        } as React.CSSProperties
      }
    >
      {layout && (
        <div
          ref={planeRef}
          className={PLANE}
          aria-hidden="true"
          style={
            {
              width: layout.planeWidth,
              height: layout.planeHeight,
              transform: `translate(-50%, -50%) rotateX(${settings.tilt}deg) rotateZ(${settings.angle}deg)`,
              '--gm-gap': `${settings.gap}px`,
              '--gm-tile-w': `${layout.tileWidth}px`,
              '--gm-tile-h': `${layout.tileHeight}px`,
              '--gm-font': `${clamp(layout.tileHeight * 0.12, 12, 32)}px`
            } as React.CSSProperties
          }
        >
          {rowTiles.map((sequence, r) => (
            <div key={r} className={ROW} style={{ top: layout.top + r * (layout.tileHeight + settings.gap) }}>
              {Array.from({ length: layout.copies * layout.perRow }, (_, k) => (
                <Tile key={k} tile={sequence[k % layout.perRow]} gray={grayscale} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GridMotion;
