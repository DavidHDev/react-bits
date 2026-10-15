'use client';

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent
} from 'react';
import { createPortal } from 'react-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ArrowRight01Icon, ArrowUpRight01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';

export interface MasonryItem {
  id: string | number;
  img: string;
  width?: number;
  height?: number;
  title?: string;
  description?: string;
  alt?: string;
  url?: string;
  span?: number;
}

export interface MasonryProps {
  items?: MasonryItem[];
  columns?: 'auto' | number;
  columnWidth?: number;
  gap?: number;
  radius?: number;
  animateFrom?: 'bottom' | 'top' | 'left' | 'right' | 'center' | 'random' | 'none';
  stagger?: number;
  duration?: number;
  bounce?: number;
  blurToFocus?: boolean;
  revealOnScroll?: boolean;
  hoverEffect?: 'zoom' | 'lift' | 'tilt' | 'none';
  focusOnHover?: boolean;
  captions?: 'hover' | 'always' | 'none';
  parallax?: number;
  lightbox?: boolean;
  draggable?: boolean;
  onItemClick?: (item: MasonryItem, index: number, event: ReactMouseEvent<HTMLElement>) => void;
  onReorder?: (items: MasonryItem[]) => void;
  className?: string;
  style?: CSSProperties;
}

type Measured = Record<string, number>;

interface Grid {
  count: number;
  size: number;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Tile extends Rect {
  item: MasonryItem;
  id: string;
}

interface Layout {
  tiles: Tile[];
  height: number;
}

interface Spring {
  x: number;
  y: number;
  s: number;
  vx: number;
  vy: number;
  vs: number;
  tx: number;
  ty: number;
  w: number;
  h: number;
  shown: boolean;
  dragging: boolean;
  blur: boolean;
  reveal: number;
  start: number;
}

interface Ghost {
  id: string;
  item: MasonryItem;
  x: number;
  y: number;
  s: number;
  w: number;
  h: number;
}

interface Drag {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  active: boolean;
  moved: boolean;
}

const ROOT = 'group/masonry relative w-full';
const ITEM = 'group/item absolute top-0 left-0 will-change-transform data-[dragging]:z-10 data-[hidden]:invisible';
const CARD =
  'group/card relative block h-full w-full cursor-pointer rounded-[var(--masonry-radius,12px)] border-0 bg-transparent p-0 text-left text-inherit no-underline outline-none [-webkit-tap-highlight-color:transparent] [font:inherit] [transform:perspective(900px)_rotateX(var(--masonry-tilt-x,0deg))_rotateY(var(--masonry-tilt-y,0deg))_translateY(var(--masonry-lift,0px))_scale(var(--masonry-scale,1))] [transition:transform_0.5s_cubic-bezier(0.2,0.8,0.2,1),box-shadow_0.5s_cubic-bezier(0.2,0.8,0.2,1),opacity_0.35s_ease] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-current group-data-[hover=lift]/masonry:group-hover/item:shadow-[0_22px_40px_-22px_rgba(0,0,0,0.55)] group-data-[hover=lift]/masonry:group-hover/item:[--masonry-lift:-6px] group-data-[hover=lift]/masonry:group-hover/item:[--masonry-scale:1.02] group-data-[hover=tilt]/masonry:[transition:transform_0.25s_cubic-bezier(0.2,0.8,0.2,1),box-shadow_0.5s_cubic-bezier(0.2,0.8,0.2,1),opacity_0.35s_ease] group-data-[hover=tilt]/masonry:group-hover/item:shadow-[0_26px_44px_-24px_rgba(0,0,0,0.55)] group-data-[hover=tilt]/masonry:group-hover/item:[--masonry-scale:1.03] group-data-[dimmed]/item:opacity-35 group-data-[dragging]/item:cursor-grabbing group-data-[dragging]/item:shadow-[0_34px_60px_-26px_rgba(0,0,0,0.6)] group-data-[dragging]/item:[--masonry-scale:1.05]';
const MEDIA =
  'relative isolate block h-full w-full overflow-hidden rounded-[var(--masonry-radius,12px)] bg-[rgba(127,127,127,0.14)]';
const PARALLAX = 'absolute inset-0 block';
const IMAGE =
  'pointer-events-none block h-full w-full object-cover opacity-0 select-none [-webkit-user-drag:none] [transition:opacity_0.5s_ease,transform_0.8s_cubic-bezier(0.2,0.8,0.2,1)] data-[loaded]:opacity-100 group-data-[hover=zoom]/masonry:group-hover/item:[transform:scale(1.07)]';
const CAPTION =
  'pointer-events-none absolute right-0 bottom-0 left-0 flex flex-col gap-0.5 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.02)_15%,rgba(0,0,0,0.08)_30%,rgba(0,0,0,0.18)_45%,rgba(0,0,0,0.3)_60%,rgba(0,0,0,0.42)_75%,rgba(0,0,0,0.5)_88%,rgba(0,0,0,0.54)_100%)] px-3.5 pt-10 pb-3 text-white [transition:opacity_0.35s_ease,transform_0.5s_cubic-bezier(0.2,0.8,0.2,1)] data-[mode=hover]:[transform:translateY(6px)] data-[mode=hover]:opacity-0 data-[mode=hover]:group-hover/item:[transform:none] data-[mode=hover]:group-hover/item:opacity-100 data-[mode=hover]:group-focus-visible/card:[transform:none] data-[mode=hover]:group-focus-visible/card:opacity-100';
const TITLE = 'text-sm leading-[1.3] font-semibold tracking-[-0.01em]';
const TEXT = 'text-xs leading-[1.4] opacity-80';
const GHOST = 'pointer-events-none absolute top-0 left-0';
const BOX = 'fixed inset-0 z-[1000]';
const BOX_BACKDROP = 'absolute inset-0 bg-[rgba(9,9,11,0.9)]';
const BOX_IMAGE =
  'fixed top-0 left-0 block origin-top-left cursor-zoom-out object-cover will-change-transform select-none [-webkit-user-drag:none]';
const BOX_CAPTION =
  'pointer-events-none fixed right-0 left-0 flex items-center justify-center gap-3.5 px-[72px] text-center text-sm leading-[1.4] text-white [&_a]:pointer-events-auto [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1 [&_a]:font-semibold [&_a]:text-inherit [&_a]:no-underline [&_a]:opacity-80 [&_a]:transition-opacity [&_a:focus-visible]:opacity-100 [&_a:hover]:opacity-100';
const BOX_MUTED = 'opacity-60';
const BOX_CLOSE =
  'absolute grid h-11 w-11 cursor-pointer place-items-center rounded-full border-0 bg-white/8 p-0 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-colors hover:bg-white/16 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white top-4 right-4';
const BOX_PREV =
  'absolute grid h-11 w-11 cursor-pointer place-items-center rounded-full border-0 bg-white/8 p-0 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-colors hover:bg-white/16 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white top-[calc(50%-22px)] left-4';
const BOX_NEXT =
  'absolute grid h-11 w-11 cursor-pointer place-items-center rounded-full border-0 bg-white/8 p-0 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-colors hover:bg-white/16 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white top-[calc(50%-22px)] right-4';

const DIRECTIONS = ['bottom', 'top', 'left', 'right'];
const ANIMATE_FROM = ['bottom', 'top', 'left', 'right', 'center', 'random', 'none'];
const HOVER_EFFECTS = ['zoom', 'lift', 'tilt', 'none'];
const CAPTION_MODES = ['hover', 'always', 'none'];
const EASE = 'cubic-bezier(0.2, 0.9, 0.2, 1)';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const keyOf = (item: MasonryItem) => String(item.id);

const aspectOf = (item: MasonryItem, measured: Measured) => {
  const width = item.width ?? 0;
  const height = item.height ?? 0;
  if (width > 0 && height > 0) return height / width;
  if (measured[keyOf(item)]) return measured[keyOf(item)];
  if (height > 0) return height / 600;
  return 1;
};

const needsMeasure = (item: MasonryItem) => !((item.height ?? 0) > 0);

const gridOf = (width: number, columns: 'auto' | number, columnWidth: number, gap: number): Grid => {
  const fixed = Number(columns);
  const count =
    columns !== 'auto' && fixed > 0
      ? Math.max(1, Math.round(fixed))
      : Math.max(1, Math.floor((width + gap) / (Math.max(40, columnWidth) + gap)));
  return { count, size: Math.max(1, (width - gap * (count - 1)) / count) };
};

const place = (
  heights: number[],
  item: MasonryItem,
  grid: Grid,
  gap: number,
  measured: Measured,
  commit: boolean
): Rect => {
  const { count, size } = grid;
  const span = Math.min(count, Math.max(1, Math.round(item.span || 1)));
  let column = 0;
  let top = Infinity;
  for (let start = 0; start <= count - span; start++) {
    let y = 0;
    for (let k = start; k < start + span; k++) y = Math.max(y, heights[k]);
    if (y < top - 0.5) {
      top = y;
      column = start;
    }
  }
  const w = size * span + gap * (span - 1);
  const h = Math.max(1, w * aspectOf(item, measured));
  if (commit) for (let k = column; k < column + span; k++) heights[k] = top + h + gap;
  return { x: Math.round(column * (size + gap)), y: Math.round(top), w, h };
};

const scrollerOf = (element: HTMLElement | null): HTMLElement | null => {
  let node = element?.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    const overflow = getComputedStyle(node).overflowY;
    if (
      (overflow === 'auto' || overflow === 'scroll' || overflow === 'overlay') &&
      node.scrollHeight > node.clientHeight
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
};

const layoutOf = (
  list: MasonryItem[],
  width: number,
  columns: 'auto' | number,
  columnWidth: number,
  gap: number,
  measured: Measured
): Layout => {
  const grid = gridOf(width, columns, columnWidth, gap);
  const heights = new Array(grid.count).fill(0);
  const tiles = list.map(item => ({ item, id: keyOf(item), ...place(heights, item, grid, gap, measured, true) }));
  return { tiles, height: Math.max(0, Math.max(...heights) - gap) };
};

const slotsFor = (
  others: MasonryItem[],
  dragged: MasonryItem,
  width: number,
  columns: 'auto' | number,
  columnWidth: number,
  gap: number,
  measured: Measured
) => {
  const grid = gridOf(width, columns, columnWidth, gap);
  const heights = new Array(grid.count).fill(0);
  const slots: { x: number; y: number }[] = [];
  for (let i = 0; i <= others.length; i++) {
    const slot = place(heights, dragged, grid, gap, measured, false);
    slots.push({ x: slot.x + slot.w / 2, y: slot.y + slot.h / 2 });
    if (i < others.length) place(heights, others[i], grid, gap, measured, true);
  }
  return slots;
};

const Masonry = ({
  items = [],
  columns = 'auto',
  columnWidth = 240,
  gap = 12,
  radius = 12,
  animateFrom = 'bottom',
  stagger = 0.05,
  duration = 0.6,
  bounce = 0.15,
  blurToFocus = true,
  revealOnScroll = true,
  hoverEffect = 'zoom',
  focusOnHover = false,
  captions = 'hover',
  parallax = 0,
  lightbox = true,
  draggable = true,
  onItemClick,
  onReorder,
  className = '',
  style
}: MasonryProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<string, HTMLDivElement>());
  const springs = useRef(new Map<string, Spring>());
  const loaded = useRef(new Set<string>());
  const waiting = useRef(new Set<string>());
  const pending = useRef(new Set<string>());
  const engine = useRef({ raf: 0, last: 0, flush: 0 });
  const dragRef = useRef<Drag | null>(null);
  const suppressRef = useRef(false);
  const ghostsRef = useRef(new Map<string, HTMLDivElement>());
  const previousRef = useRef(new Map<string, { item: MasonryItem; w: number; h: number }>());
  const boxRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef(0);
  const lastShownRef = useRef<string | null>(null);
  const [width, setWidth] = useState(0);
  const [order, setOrder] = useState<string[] | null>(null);
  const [measured, setMeasured] = useState<Measured>({});
  const [ready, setReady] = useState(() => !items.some(needsMeasure));
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  const settings = {
    gap: Math.max(0, gap),
    animateFrom: ANIMATE_FROM.includes(animateFrom) ? animateFrom : 'bottom',
    stagger: Math.max(0, stagger),
    duration: Math.max(0.05, duration),
    bounce: clamp(bounce, 0, 0.9),
    blurToFocus,
    revealOnScroll,
    hoverEffect: HOVER_EFFECTS.includes(hoverEffect) ? hoverEffect : 'zoom',
    focusOnHover,
    parallax: clamp(parallax, 0, 1),
    lightbox,
    draggable,
    onItemClick,
    onReorder
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const itemsKey = items.map(keyOf).join('\u0000');

  const ordered = useMemo(() => {
    if (!order) return items;
    const byId = new Map(items.map(item => [keyOf(item), item]));
    const list = order.filter(id => byId.has(id)).map(id => byId.get(id) as MasonryItem);
    items.forEach(item => {
      if (!order.includes(keyOf(item))) list.push(item);
    });
    return list;
  }, [items, order]);

  const layout = useMemo(
    () => (width && ready ? layoutOf(ordered, width, columns, columnWidth, settings.gap, measured) : null),
    [ordered, width, ready, columns, columnWidth, settings.gap, measured]
  );
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const orderedRef = useRef(ordered);
  orderedRef.current = ordered;
  const params = { width, columns, columnWidth, gap: settings.gap, measured };
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(root);
    setWidth(Math.round(root.getBoundingClientRect().width));
    return () => observer.disconnect();
  }, []);

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const measuredRef = useRef(measured);
  measuredRef.current = measured;

  useEffect(() => {
    const known = measuredRef.current;
    const missing = itemsRef.current.filter(item => needsMeasure(item) && !known[keyOf(item)]);
    if (!missing.length) {
      setReady(true);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) setReady(true);
    }, 2500);
    missing.forEach(item => {
      const image = new Image();
      image.onload = () => {
        if (cancelled || !image.naturalWidth) return;
        setMeasured(current => ({ ...current, [keyOf(item)]: image.naturalHeight / image.naturalWidth }));
      };
      image.src = item.img;
    });
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [itemsKey]);

  useEffect(() => {
    if (ready) return;
    if (items.every(item => !needsMeasure(item) || measured[keyOf(item)])) setReady(true);
  }, [measured, ready, items]);

  const reduced = () =>
    typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

  const paint = (id: string, spring: Spring) => {
    const node = nodes.current.get(id);
    if (!node) return;
    node.style.transform = `translate3d(${spring.x}px, ${spring.y}px, 0) scale(${spring.s})`;
    if (spring.reveal < 1) {
      const eased = 1 - Math.pow(1 - Math.max(0, spring.reveal), 3);
      node.style.opacity = String(eased);
      node.style.filter = spring.blur ? `blur(${((1 - eased) * 12).toFixed(2)}px)` : '';
    } else if (node.style.opacity !== '') {
      node.style.opacity = '';
      node.style.filter = '';
    }
  };

  const frame = (now: number) => {
    const state = engine.current;
    state.raf = 0;
    const s = settingsRef.current;
    const elapsed = clamp((now - state.last) / 1000, 0, 1 / 20);
    state.last = now;
    const omega = (Math.PI * 2) / s.duration;
    const zeta = clamp(1 - s.bounce, 0.1, 1);
    const steps = Math.max(1, Math.ceil(elapsed / (1 / 240)));
    const dt = elapsed / steps;
    let active = false;
    springs.current.forEach((spring, id) => {
      if (!spring.shown) return;
      if (spring.dragging) {
        paint(id, spring);
        return;
      }
      if (now < spring.start) {
        active = true;
        return;
      }
      for (let i = 0; i < steps; i++) {
        spring.vx += (-omega * omega * (spring.x - spring.tx) - 2 * zeta * omega * spring.vx) * dt;
        spring.vy += (-omega * omega * (spring.y - spring.ty) - 2 * zeta * omega * spring.vy) * dt;
        spring.vs += (-omega * omega * (spring.s - 1) - 2 * zeta * omega * spring.vs) * dt;
        spring.x += spring.vx * dt;
        spring.y += spring.vy * dt;
        spring.s += spring.vs * dt;
      }
      const resting =
        Math.abs(spring.x - spring.tx) < 0.05 &&
        Math.abs(spring.y - spring.ty) < 0.05 &&
        Math.abs(spring.s - 1) < 0.0005 &&
        Math.abs(spring.vx) + Math.abs(spring.vy) < 0.05 &&
        Math.abs(spring.vs) < 0.001;
      if (resting) {
        spring.x = spring.tx;
        spring.y = spring.ty;
        spring.s = 1;
        spring.vx = spring.vy = spring.vs = 0;
      } else active = true;
      if (spring.reveal < 1) {
        spring.reveal = clamp((now - spring.start) / (s.duration * 1000), 0, 1);
        if (spring.reveal < 1) active = true;
      }
      paint(id, spring);
    });
    if (active) state.raf = requestAnimationFrame(frame);
  };

  const kick = () => {
    const state = engine.current;
    if (state.raf || typeof window === 'undefined') return;
    state.last = performance.now();
    state.raf = requestAnimationFrame(frame);
  };

  const visibleCenter = () => {
    const root = rootRef.current;
    if (!root) return 0;
    const rect = root.getBoundingClientRect();
    const top = Math.max(0, -rect.top);
    const bottom = Math.min(rect.height, window.innerHeight - rect.top);
    return bottom > top ? (top + bottom) / 2 : rect.height / 2;
  };

  const flushReveals = () => {
    engine.current.flush = 0;
    const s = settingsRef.current;
    const batch: { id: string; spring: Spring }[] = [];
    pending.current.forEach(id => {
      const spring = springs.current.get(id);
      if (spring && !spring.shown) batch.push({ id, spring });
    });
    pending.current.clear();
    if (!batch.length) return;
    batch.sort((a, b) => a.spring.ty - b.spring.ty || a.spring.tx - b.spring.tx);
    const now = performance.now();
    const still = reduced() || s.animateFrom === 'none';
    const rootWidth = rootRef.current?.clientWidth ?? 0;
    const centerY = visibleCenter();
    batch.forEach(({ id, spring }, rank) => {
      spring.shown = true;
      spring.blur = s.blurToFocus && !still;
      if (still) {
        spring.x = spring.tx;
        spring.y = spring.ty;
        spring.s = 1;
        spring.reveal = 1;
        spring.start = now;
        paint(id, spring);
        return;
      }
      const direction =
        s.animateFrom === 'random' ? DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)] : s.animateFrom;
      const distance = 60 + Math.min(spring.h, 280) * 0.35;
      spring.x = spring.tx;
      spring.y = spring.ty;
      spring.s = 0.96;
      if (direction === 'center') {
        spring.x = rootWidth / 2 - spring.w / 2;
        spring.y = centerY - spring.h / 2;
        spring.s = 0.55;
      } else if (direction === 'bottom') spring.y += distance;
      else if (direction === 'top') spring.y -= distance;
      else if (direction === 'left') spring.x -= distance;
      else if (direction === 'right') spring.x += distance;
      spring.vx = spring.vy = spring.vs = 0;
      spring.reveal = 0;
      spring.start = now + rank * s.stagger * 1000;
      paint(id, spring);
    });
    kick();
  };

  const requestReveal = (id: string) => {
    const spring = springs.current.get(id);
    if (!spring || spring.shown) return;
    if (!loaded.current.has(id)) {
      waiting.current.add(id);
      return;
    }
    waiting.current.delete(id);
    pending.current.add(id);
    if (!engine.current.flush) engine.current.flush = requestAnimationFrame(flushReveals);
  };

  const revealRef = useRef(requestReveal);
  revealRef.current = requestReveal;

  const markLoaded = (id: string) => {
    loaded.current.add(id);
    const node = nodes.current.get(id);
    node?.querySelector('img')?.setAttribute('data-loaded', '');
    if (waiting.current.has(id)) requestReveal(id);
  };

  useIsoLayoutEffect(() => {
    const previous = previousRef.current;
    const live = new Set(items.map(keyOf));
    const leaving: Ghost[] = [];
    previous.forEach((entry, id) => {
      if (live.has(id)) return;
      const spring = springs.current.get(id);
      previous.delete(id);
      if (!spring?.shown) return;
      leaving.push({ id, item: entry.item, x: spring.x, y: spring.y, s: spring.s, w: entry.w, h: entry.h });
      springs.current.delete(id);
    });
    if (leaving.length) setGhosts(current => [...current.filter(ghost => !live.has(ghost.id)), ...leaving]);
    setOrder(null);
  }, [itemsKey]);

  useIsoLayoutEffect(() => {
    if (!layout) return;
    const root = rootRef.current;
    const instant = reduced();
    layout.tiles.forEach(tile => {
      const node = nodes.current.get(tile.id);
      let spring = springs.current.get(tile.id);
      if (!spring) {
        spring = {
          x: tile.x,
          y: tile.y,
          s: 1,
          vx: 0,
          vy: 0,
          vs: 0,
          tx: tile.x,
          ty: tile.y,
          w: tile.w,
          h: tile.h,
          shown: false,
          dragging: false,
          blur: false,
          reveal: 0,
          start: 0
        };
        springs.current.set(tile.id, spring);
        if (node) {
          node.style.opacity = '0';
          node.style.transform = `translate3d(${tile.x}px, ${tile.y}px, 0)`;
        }
      } else if (spring.shown && Math.abs(spring.w - tile.w) > 0.5 && !instant) {
        spring.s *= spring.w / tile.w;
      }
      spring.tx = tile.x;
      spring.ty = tile.y;
      spring.w = tile.w;
      spring.h = tile.h;
      if (!spring.shown) {
        spring.x = tile.x;
        spring.y = tile.y;
        if (node) node.style.transform = `translate3d(${tile.x}px, ${tile.y}px, 0)`;
      } else if (instant && !spring.dragging) {
        spring.x = tile.x;
        spring.y = tile.y;
        spring.s = 1;
        paint(tile.id, spring);
      }
      previousRef.current.set(tile.id, { item: tile.item, w: tile.w, h: tile.h });
    });
    if (root) root.style.height = `${layout.height}px`;
    kick();
  });

  useEffect(() => {
    if (!layout) return undefined;
    const ids = layout.tiles.map(tile => tile.id);
    const reveal = revealRef.current;
    if (!settingsRef.current.revealOnScroll || typeof IntersectionObserver === 'undefined') {
      ids.forEach(reveal);
      return undefined;
    }
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const id = entry.target.getAttribute('data-id');
          if (id) reveal(id);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -6% 0px' }
    );
    ids.forEach(id => {
      const node = nodes.current.get(id);
      if (node && !springs.current.get(id)?.shown) observer.observe(node);
    });
    return () => observer.disconnect();
  }, [layout, revealOnScroll]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    waiting.current.forEach(id => {
      timers.push(
        setTimeout(() => {
          if (!waiting.current.has(id)) return;
          loaded.current.add(id);
          revealRef.current(id);
        }, 2500)
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [layout]);

  useEffect(() => {
    ghosts.forEach(ghost => {
      const node = ghostsRef.current.get(ghost.id);
      if (!node || node.getAttribute('data-leaving')) return;
      node.setAttribute('data-leaving', '');
      const from = `translate3d(${ghost.x}px, ${ghost.y}px, 0) scale(${ghost.s})`;
      const to = `translate3d(${ghost.x + ghost.w * 0.04}px, ${ghost.y + ghost.h * 0.04}px, 0) scale(${ghost.s * 0.92})`;
      const animation = node.animate(
        [
          { transform: from, opacity: 1 },
          { transform: to, opacity: 0 }
        ],
        { duration: reduced() ? 1 : 320, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' }
      );
      animation.finished
        .then(() => setGhosts(current => current.filter(entry => entry.id !== ghost.id)))
        .catch(() => {});
    });
  }, [ghosts]);

  useEffect(() => {
    const strength = settingsRef.current.parallax;
    const layers = () => [...nodes.current.values()].map(node => node.querySelector<HTMLElement>('[data-parallax]'));
    if (!strength || !layout) {
      layers().forEach(layer => {
        if (layer) layer.style.transform = '';
      });
      return undefined;
    }
    let raf = 0;
    const scroller = scrollerOf(rootRef.current);
    const update = () => {
      raf = 0;
      const frame = scroller ? scroller.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
      const top = Math.max(frame.top, 0);
      const bottom = Math.min(frame.bottom, window.innerHeight);
      const center = (top + bottom) / 2;
      nodes.current.forEach(node => {
        const layer = node.querySelector<HTMLElement>('[data-parallax]');
        if (!layer) return;
        const rect = node.getBoundingClientRect();
        if (rect.bottom < top - 200 || rect.top > bottom + 200) return;
        const reach = strength * 0.2 * rect.height;
        const shift = clamp(-(rect.top + rect.height / 2 - center) * strength * 0.25, -reach, reach);
        layer.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0) scale(${(1 + strength * 0.4 + 0.002).toFixed(3)})`;
      });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { capture: true, passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule, { capture: true });
      window.removeEventListener('resize', schedule);
    };
  }, [layout, parallax]);

  useEffect(() => {
    const state = engine.current;
    return () => {
      cancelAnimationFrame(state.raf);
      cancelAnimationFrame(state.flush);
    };
  }, []);

  const setDimmed = (activeId: string | null) => {
    nodes.current.forEach((node, id) => {
      if (activeId && id !== activeId) node.setAttribute('data-dimmed', '');
      else node.removeAttribute('data-dimmed');
    });
  };

  const onEnter = (id: string) => {
    if (settingsRef.current.focusOnHover && !dragRef.current?.active) setDimmed(id);
  };

  const onLeave = (event: ReactPointerEvent<HTMLElement>) => {
    if (settingsRef.current.focusOnHover) setDimmed(null);
    event.currentTarget.style.removeProperty('--masonry-tilt-x');
    event.currentTarget.style.removeProperty('--masonry-tilt-y');
  };

  const onTilt = (event: ReactPointerEvent<HTMLElement>) => {
    if (settingsRef.current.hoverEffect !== 'tilt' || dragRef.current?.active) return;
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty('--masonry-tilt-x', `${(-py * 10).toFixed(2)}deg`);
    card.style.setProperty('--masonry-tilt-y', `${(px * 10).toFixed(2)}deg`);
  };

  const finishDrag = () => {
    const drag = dragRef.current;
    window.removeEventListener('pointermove', moveDrag);
    window.removeEventListener('pointerup', finishDrag);
    window.removeEventListener('pointercancel', finishDrag);
    dragRef.current = null;
    if (!drag?.active) return;
    const spring = springs.current.get(drag.id);
    const node = nodes.current.get(drag.id);
    if (spring) spring.dragging = false;
    node?.removeAttribute('data-dragging');
    rootRef.current?.removeAttribute('data-dragging');
    suppressRef.current = true;
    setTimeout(() => {
      suppressRef.current = false;
    }, 0);
    kick();
    if (drag.moved) settingsRef.current.onReorder?.(orderedRef.current);
  };

  const moveDrag = (event: PointerEvent) => {
    const drag = dragRef.current;
    const root = rootRef.current;
    if (!drag || !root || event.pointerId !== drag.pointerId) return;
    if (!drag.active) {
      if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 6) return;
      const spring = springs.current.get(drag.id);
      if (!spring?.shown) return;
      drag.active = true;
      spring.dragging = true;
      spring.vx = spring.vy = spring.vs = 0;
      nodes.current.get(drag.id)?.setAttribute('data-dragging', '');
      root.setAttribute('data-dragging', '');
      setDimmed(null);
    }
    const rect = root.getBoundingClientRect();
    const spring = springs.current.get(drag.id);
    if (!spring) return;
    spring.x = event.clientX - rect.left - drag.offsetX;
    spring.y = event.clientY - rect.top - drag.offsetY;
    spring.s = 1;
    paint(drag.id, spring);
    kick();
    const list = orderedRef.current;
    const dragged = list.find(item => keyOf(item) === drag.id);
    const grid = paramsRef.current;
    if (!dragged || !grid.width) return;
    const others = list.filter(item => keyOf(item) !== drag.id);
    const slots = slotsFor(others, dragged, grid.width, grid.columns, grid.columnWidth, grid.gap, grid.measured);
    const cx = spring.x + spring.w / 2;
    const cy = spring.y + spring.h / 2;
    const current = list.indexOf(dragged);
    let best = current;
    let nearest = Math.hypot(slots[current].x - cx, slots[current].y - cy);
    const threshold = nearest * 0.8 - 6;
    slots.forEach((slot, index) => {
      const distance = Math.hypot(slot.x - cx, slot.y - cy);
      if (distance < nearest && distance < threshold) {
        nearest = distance;
        best = index;
      }
    });
    if (best === current) return;
    const ids = others.map(keyOf);
    ids.splice(best, 0, drag.id);
    drag.moved = true;
    setOrder(ids);
  };

  const startDrag = (event: ReactPointerEvent<HTMLElement>, id: string) => {
    const s = settingsRef.current;
    if (!s.draggable || event.button !== 0 || event.pointerType === 'touch' || openId) return;
    const root = rootRef.current;
    const spring = springs.current.get(id);
    if (!root || !spring) return;
    const rect = root.getBoundingClientRect();
    dragRef.current = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left - spring.x,
      offsetY: event.clientY - rect.top - spring.y,
      active: false,
      moved: false
    };
    window.addEventListener('pointermove', moveDrag);
    window.addEventListener('pointerup', finishDrag);
    window.addEventListener('pointercancel', finishDrag);
  };

  const onCardClick = (event: ReactMouseEvent<HTMLElement>, item: MasonryItem, index: number) => {
    if (suppressRef.current) {
      event.preventDefault();
      return;
    }
    const s = settingsRef.current;
    s.onItemClick?.(item, index, event);
    if (event.defaultPrevented) return;
    if (s.lightbox) {
      event.preventDefault();
      tokenRef.current += 1;
      setClosing(false);
      setOpenId(keyOf(item));
    }
  };

  const openIndex = openId ? ordered.findIndex(item => keyOf(item) === openId) : -1;
  const openItem = openIndex >= 0 ? ordered[openIndex] : null;

  const mediaRect = (id: string) =>
    nodes.current.get(id)?.querySelector('[data-media]')?.getBoundingClientRect() ?? null;

  const frameFor = (item: MasonryItem) => {
    const aspect = aspectOf(item, measured);
    const pad = window.innerWidth < 640 ? 16 : 72;
    const room = item.title || item.description || item.url ? 64 : 0;
    const maxW = Math.max(40, window.innerWidth - pad * 2);
    const maxH = Math.max(40, window.innerHeight - pad * 2 - room);
    let w = maxW;
    let h = w * aspect;
    if (h > maxH) {
      h = maxH;
      w = h / aspect;
    }
    const left = (window.innerWidth - w) / 2;
    const top = (window.innerHeight - room - h) / 2;
    return { left, top, width: w, height: h, room };
  };

  const closeBox = () => {
    if (!openId || closing) return;
    tokenRef.current += 1;
    const token = tokenRef.current;
    const box = boxRef.current;
    const image = box?.querySelector<HTMLElement>('[data-box-image]');
    const backdrop = box?.querySelector<HTMLElement>('[data-box-backdrop]');
    const rect = mediaRect(openId);
    setClosing(true);
    if (!image || !rect || reduced()) {
      setOpenId(null);
      setClosing(false);
      return;
    }
    const current = image.getBoundingClientRect();
    const scale = rect.width / current.width;
    image.getAnimations().forEach(animation => animation.cancel());
    const animation = image.animate(
      [
        { transform: 'none', borderRadius: '6px' },
        {
          transform: `translate(${rect.left - current.left}px, ${rect.top - current.top}px) scale(${scale})`,
          borderRadius: `${radius / Math.max(scale, 0.01)}px`
        }
      ],
      { duration: 380, easing: EASE, fill: 'forwards' }
    );
    backdrop?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease', fill: 'forwards' });
    box
      ?.querySelectorAll('[data-box-fade]')
      .forEach(node => node.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }));
    animation.finished
      .then(() => {
        if (token !== tokenRef.current) return;
        setOpenId(null);
        setClosing(false);
      })
      .catch(() => {});
  };

  const stepBox = (direction: number) => {
    if (!openItem || closing || ordered.length < 2) return;
    const next = ordered[(openIndex + direction + ordered.length) % ordered.length];
    setOpenId(keyOf(next));
  };

  useIsoLayoutEffect(() => {
    if (!openId) return undefined;
    const node = nodes.current.get(openId);
    node?.setAttribute('data-hidden', '');
    return () => node?.removeAttribute('data-hidden');
  }, [openId]);

  const openedRef = useRef<string | null>(null);
  useIsoLayoutEffect(() => {
    const box = boxRef.current;
    if (!openId || !box) {
      openedRef.current = null;
      return;
    }
    const image = box.querySelector<HTMLElement>('[data-box-image]');
    const backdrop = box.querySelector<HTMLElement>('[data-box-backdrop]');
    const fades = box.querySelectorAll('[data-box-fade]');
    if (!image) return;
    if (openedRef.current) {
      image.animate(
        [
          { opacity: 0, transform: 'scale(0.97)' },
          { opacity: 1, transform: 'none' }
        ],
        { duration: reduced() ? 1 : 320, easing: EASE }
      );
      openedRef.current = openId;
      return;
    }
    openedRef.current = openId;
    const rect = mediaRect(openId);
    const target = image.getBoundingClientRect();
    if (rect && !reduced()) {
      const scale = rect.width / target.width;
      image.animate(
        [
          {
            transform: `translate(${rect.left - target.left}px, ${rect.top - target.top}px) scale(${scale})`,
            borderRadius: `${radius / Math.max(scale, 0.01)}px`
          },
          { transform: 'none', borderRadius: '6px' }
        ],
        { duration: 520, easing: EASE }
      );
      backdrop?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 360, easing: 'ease' });
      fades.forEach(fade =>
        fade.animate([{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }], { duration: 560, easing: 'ease' })
      );
    }
  }, [openId]);

  if (openId) lastShownRef.current = openId;
  const isOpen = Boolean(openId);
  useEffect(() => {
    if (!isOpen) return undefined;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    boxRef.current?.querySelector<HTMLElement>('[data-box-close]')?.focus({ preventScroll: true });
    const map = nodes.current;
    return () => {
      document.documentElement.style.overflow = previous;
      map
        .get(lastShownRef.current ?? '')
        ?.querySelector<HTMLElement>('[data-card]')
        ?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  useEffect(() => {
    if (!openId) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeBox();
      else if (event.key === 'ArrowRight') stepBox(1);
      else if (event.key === 'ArrowLeft') stepBox(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const captionMode = CAPTION_MODES.includes(captions) ? captions : 'hover';
  const mode = settings.hoverEffect;
  const box = openItem && typeof document !== 'undefined' ? frameFor(openItem) : null;

  return (
    <div
      ref={rootRef}
      className={[ROOT, className].filter(Boolean).join(' ')}
      style={{ '--masonry-radius': `${Math.max(0, radius)}px`, ...style } as CSSProperties}
      data-hover={mode}
      role="list"
    >
      {(layout?.tiles ?? []).map((tile, index) => {
        const { item } = tile;
        const id = tile.id;
        const label = item.title || item.alt || undefined;
        const shared = {
          className: CARD,
          'data-card': '',
          onClick: (event: ReactMouseEvent<HTMLElement>) => onCardClick(event, item, index),
          onPointerDown: (event: ReactPointerEvent<HTMLElement>) => startDrag(event, id),
          onPointerEnter: () => onEnter(id),
          onPointerLeave: onLeave,
          onPointerMove: onTilt
        };
        const content = (
          <span className={MEDIA} data-media="">
            <span className={PARALLAX} data-parallax="">
              <img
                className={IMAGE}
                src={item.img}
                alt={item.alt ?? item.title ?? ''}
                draggable={false}
                decoding="async"
                data-loaded={loaded.current.has(id) ? '' : undefined}
                ref={image => {
                  if (image?.complete && image.naturalWidth && !loaded.current.has(id)) markLoaded(id);
                }}
                onLoad={() => markLoaded(id)}
                onError={() => markLoaded(id)}
              />
            </span>
            {captionMode !== 'none' && (item.title || item.description) && (
              <span className={CAPTION} data-mode={captionMode}>
                {item.title && <span className={TITLE}>{item.title}</span>}
                {item.description && <span className={TEXT}>{item.description}</span>}
              </span>
            )}
          </span>
        );
        return (
          <div
            key={id}
            ref={node => {
              if (node) nodes.current.set(id, node);
              else nodes.current.delete(id);
            }}
            className={ITEM}
            style={{ width: tile.w, height: tile.h }}
            data-id={id}
            role="listitem"
          >
            {!lightbox && item.url ? (
              <a
                {...shared}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                draggable={false}
                aria-label={label}
              >
                {content}
              </a>
            ) : lightbox || onItemClick ? (
              <button {...shared} type="button" aria-label={label}>
                {content}
              </button>
            ) : (
              <div {...shared}>{content}</div>
            )}
          </div>
        );
      })}
      {ghosts.map(ghost => (
        <div
          key={`ghost-${ghost.id}`}
          ref={node => {
            if (node) ghostsRef.current.set(ghost.id, node);
            else ghostsRef.current.delete(ghost.id);
          }}
          className={GHOST}
          style={{
            width: ghost.w,
            height: ghost.h,
            transform: `translate3d(${ghost.x}px, ${ghost.y}px, 0) scale(${ghost.s})`
          }}
          aria-hidden="true"
        >
          <div className={MEDIA}>
            <img className={IMAGE} src={ghost.item.img} alt="" data-loaded="" draggable={false} />
          </div>
        </div>
      ))}
      {openItem &&
        box &&
        createPortal(
          <div
            ref={boxRef}
            className={BOX}
            role="dialog"
            aria-modal="true"
            aria-label={openItem.title || openItem.alt || 'Image'}
          >
            <div className={BOX_BACKDROP} data-box-backdrop="" onClick={closeBox} />
            <img
              className={BOX_IMAGE}
              data-box-image=""
              src={openItem.img}
              alt={openItem.alt ?? openItem.title ?? ''}
              draggable={false}
              style={{ width: box.width, height: box.height, left: box.left, top: box.top, borderRadius: 6 }}
              onClick={closeBox}
            />
            {box.room > 0 && (
              <div className={BOX_CAPTION} data-box-fade="" style={{ top: box.top + box.height + 18 }}>
                {openItem.title && <span>{openItem.title}</span>}
                {openItem.description && <span className={BOX_MUTED}>{openItem.description}</span>}
                {openItem.url && (
                  <a href={openItem.url} target="_blank" rel="noopener noreferrer">
                    Open
                    <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} strokeWidth={2} />
                  </a>
                )}
              </div>
            )}
            <button
              type="button"
              className={BOX_CLOSE}
              data-box-fade=""
              data-box-close=""
              aria-label="Close"
              onClick={closeBox}
            >
              <HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={2} />
            </button>
            {ordered.length > 1 && (
              <>
                <button
                  type="button"
                  className={BOX_PREV}
                  data-box-fade=""
                  aria-label="Previous"
                  onClick={() => stepBox(-1)}
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={20} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  className={BOX_NEXT}
                  data-box-fade=""
                  aria-label="Next"
                  onClick={() => stepBox(1)}
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} size={20} strokeWidth={2} />
                </button>
              </>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};

export default Masonry;
