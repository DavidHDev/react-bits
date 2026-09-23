import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode
} from 'react';
import { flushSync } from 'react-dom';

const FOLLOW = 30;
const SETTLE = 16;
const TUG = 2.4;
const TUG_DECAY = 0.14;
const SLIT = 6;
const OVER = 40;
const SLIVER = 2;
const STACK_K = 320;
const STACK_C = 22;
const STAGGER = 0.035;
const ENTER = 22;
const HYSTERESIS = 8;
const DEG = Math.PI / 180;

export interface ShredderItem {
  id: string | number;
}

export interface ShredderProps<T extends ShredderItem> {
  items?: T[];
  renderItem: (item: T, index: number) => ReactNode;
  onShred?: (item: T) => void;
  onReorder?: (items: T[]) => void;
  width?: number;
  height?: number;
  inset?: number;
  gap?: number;
  slitHeight?: number;
  fallHeight?: number;
  feedSpeed?: number;
  bite?: number;
  autoFeed?: boolean;
  stripWidth?: number;
  curl?: number;
  autoAnimate?: boolean;
  loop?: boolean;
  loopAfterDelete?: boolean;
  dragTilt?: number;
  lift?: number;
  slitColor?: string;
  color?: string;
  disabled?: boolean;
  className?: string;
}

interface Config<T> {
  items: T[];
  height: number;
  inset: number;
  gap: number;
  slitHeight: number;
  fallHeight: number;
  feedSpeed: number;
  bite: number;
  autoFeed: boolean;
  stripWidth: number;
  curl: number;
  loop: boolean;
  loopAfterDelete: boolean;
  dragTilt: number;
  lift: number;
  onShred?: (item: T) => void;
  onReorder?: (items: T[]) => void;
  disabled: boolean;
}

interface Metrics {
  left: number;
  top: number;
  k: number;
  rw: number;
  lip: number;
  exit: number;
}

interface Texture {
  tex: HTMLCanvasElement;
  scale: number;
}

interface Drag<T> {
  key: string | number;
  item: T;
  el: HTMLDivElement;
  slot: HTMLLIElement;
  W: number;
  H: number;
  rx: number;
  ry: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  tilt: number;
  lift: number;
  gx: number;
  gy: number;
  px: number;
  py: number;
  ox: number;
  oy: number;
  moved: boolean;
  from: number;
  j: number;
  phase: 'drag' | 'carry' | 'return';
  id: number | null;
  snap: Promise<Texture>;
  fill: string;
}

interface Feed<T> {
  key: string | number;
  item: T;
  el: HTMLDivElement;
  slot: HTMLLIElement;
  W: number;
  H: number;
  rx: number;
  ry: number;
  tx: number;
  tilt: number;
  lift: number;
  v: number;
  age: number;
  tex: HTMLCanvasElement | null;
  ts: number;
  consumed: boolean;
  strips: number;
}

interface Strip<T> {
  feed: Feed<T>;
  x: number;
  w: number;
  H: number;
  phase: 'attached' | 'free';
  curl: number;
  amp: number;
  freq: number;
  wave: number;
  rA: number;
  rB: number;
  speed: number;
  splay: number;
  core: number;
  rest: number;
  alpha: number;
  th: number;
  ax: number;
  ay: number;
  vx: number;
  vy: number;
  hang: number;
  pts: number[];
}

interface Shift {
  el: HTMLLIElement;
  y: number;
  v: number;
  target: number;
  delay: number;
  item: HTMLDivElement | null;
}

interface Sim<T> {
  raf: number;
  last: number;
  t: number;
  drag: Drag<T> | null;
  feeds: Feed<T>[];
  strips: Strip<T>[];
  shifts: Map<HTMLLIElement, Shift>;
  tops: Map<HTMLLIElement, number>;
  timers: Set<ReturnType<typeof setTimeout>>;
  dpr: number;
  cw: number;
  ch: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const ease = (from: number, to: number, dt: number, tau: number) => from + (to - from) * (1 - Math.exp(-dt / tau));
const smooth = (t: number) => {
  const u = clamp(t, 0, 1);
  return u * u * (3 - 2 * u);
};
const pick = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const side = () => (Math.random() < 0.5 ? -1 : 1);
const reduced = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const spring = (p: number, v: number, target: number, dt: number, omega: number): [number, number] => {
  const offset = p - target;
  const term = v + omega * offset;
  const decay = Math.exp(-omega * dt);
  return [target + (offset + term * dt) * decay, (v - omega * term * dt) * decay];
};

const urls = new Map<string, Promise<string>>();

const dataUrl = (src: string): Promise<string> => {
  if (!src || src.startsWith('data:')) return Promise.resolve(src);
  const hit = urls.get(src);
  if (hit) return hit;
  const job = fetch(src, { mode: 'cors' })
    .then(res => res.blob())
    .then(
      blob =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
    );
  urls.set(src, job);
  job.catch(() => urls.delete(src));
  return job;
};

const snapshot = (node: HTMLElement, W: number, H: number): Promise<Texture> => {
  const clone = node.cloneNode(true) as HTMLElement;
  const src = [node, ...node.querySelectorAll<HTMLElement>('*')];
  const dst = [clone, ...clone.querySelectorAll<HTMLElement>('*')];
  const images: [HTMLImageElement, string][] = [];
  for (let i = 0; i < src.length; i += 1) {
    const cs = getComputedStyle(src[i]);
    const style = dst[i].style;
    for (let j = 0; j < cs.length; j += 1) style.setProperty(cs[j], cs.getPropertyValue(cs[j]));
    const from = src[i];
    const to = dst[i];
    if (to instanceof HTMLImageElement && from instanceof HTMLImageElement)
      images.push([to, from.currentSrc || from.src]);
  }
  Object.assign(clone.style, {
    position: 'relative',
    inset: 'auto',
    margin: '0',
    transform: 'none',
    filter: 'none',
    transition: 'none',
    width: `${W}px`,
    height: `${H}px`
  });
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  const scale = Math.min(3, window.devicePixelRatio || 1);
  return Promise.all(
    images.map(async ([img, from]) => {
      img.removeAttribute('srcset');
      img.removeAttribute('loading');
      try {
        img.setAttribute('src', await dataUrl(from));
      } catch {
        img.removeAttribute('src');
        img.style.background = 'rgba(127, 127, 127, 0.25)';
      }
    })
  ).then(
    () =>
      new Promise<Texture>((resolve, reject) => {
        const markup = new XMLSerializer().serializeToString(clone);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><foreignObject width="${W}" height="${H}">${markup}</foreignObject></svg>`;
        const img = new Image();
        img.onload = () => {
          const tex = document.createElement('canvas');
          tex.width = Math.ceil(W * scale);
          tex.height = Math.ceil(H * scale);
          tex.getContext('2d')!.drawImage(img, 0, 0, tex.width, tex.height);
          resolve({ tex, scale });
        };
        img.onerror = () => reject(new Error('snapshot'));
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      })
  );
};

const flat = (W: number, H: number, fill: string): Texture => {
  const tex = document.createElement('canvas');
  tex.width = W;
  tex.height = H;
  const ctx = tex.getContext('2d')!;
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, W, H);
  return { tex, scale: 1 };
};

const shape = <T,>(st: Strip<T>, len: number, time: number, tear: number) => {
  const pts = st.pts;
  pts.length = 0;
  let x = st.ax;
  let y = st.ay;
  const steps = Math.ceil(len / SLIVER);
  const swing = (3 + 9 * st.rA) * tear;
  const pace = time * (1.6 + st.rA * 2.2) + st.rA * 6.2832;
  for (let j = 0; j <= steps; j += 1) {
    const d = Math.min(j * SLIVER, len);
    const a = st.th + st.curl * d + st.amp * Math.sin(d * st.freq + st.wave);
    const flutter = swing * Math.sin(d * 0.045 + pace);
    pts.push(x + flutter * Math.cos(a), y - flutter * Math.sin(a), a);
    const h = Math.min(SLIVER, len - d);
    x += Math.sin(a) * h;
    y += Math.cos(a) * h;
  }
};

const middle = (pts: number[]) => {
  let y = 0;
  for (let j = 1; j < pts.length; j += 3) y += pts[j];
  return (y * 3) / pts.length;
};

const paintStrip = <T,>(ctx: CanvasRenderingContext2D, st: Strip<T>, len: number, dpr: number) => {
  const { tex, ts } = st.feed;
  if (!tex) return;
  const pts = st.pts;
  const wc = st.w * st.core;
  const half = wc / 2;
  const sx = (st.x + (st.w - wc) / 2) * ts;
  const v0 = st.H - len;
  ctx.globalAlpha = st.alpha;
  for (let j = 0; j + 3 < pts.length; j += 3) {
    const d = (j / 3) * SLIVER;
    const h = Math.min(SLIVER, len - d);
    if (h <= 0) break;
    const ca = Math.cos(pts[j + 2]);
    const sa = Math.sin(pts[j + 2]);
    ctx.setTransform(dpr * ca, -dpr * sa, dpr * sa, dpr * ca, dpr * (pts[j] + OVER), dpr * pts[j + 1]);
    ctx.drawImage(tex, sx, (v0 + d) * ts, wc * ts, h * ts, -half, 0, wc, h + 0.4);
  }
  ctx.globalAlpha = 1;
};

const Shredder = <T extends ShredderItem>({
  items = [],
  renderItem,
  onShred,
  onReorder,
  width = 340,
  height = 460,
  inset = 14,
  gap = 10,
  slitHeight = 4,
  fallHeight = 140,
  feedSpeed = 180,
  bite = 18,
  autoFeed = true,
  stripWidth = 10,
  curl = 1,
  autoAnimate = false,
  loop = false,
  loopAfterDelete = false,
  dragTilt = 6,
  lift = 1.02,
  slitColor = '#3f3f46',
  color = '#f5f5f5',
  disabled = false,
  className = ''
}: ShredderProps<T>) => {
  const [order, setOrder] = useState(() => items.map(item => item.id));
  const rank = new Map<string | number, number>(order.map((id, i) => [id, i]));
  const weight = (item: T) => rank.get(item.id) ?? order.length + items.indexOf(item);
  const sorted = [...items].sort((a, b) => weight(a) - weight(b));
  const rootRef = useRef<HTMLDivElement>(null);
  const slitRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const slotEls = useRef(new Map<string | number, HTMLLIElement>());
  const itemEls = useRef(new Map<string | number, HTMLDivElement>());
  const cfg = useRef<Config<T>>({} as Config<T>);
  cfg.current = {
    items: sorted,
    height,
    inset,
    gap,
    slitHeight,
    fallHeight,
    feedSpeed,
    bite,
    autoFeed,
    stripWidth,
    curl,
    loop,
    loopAfterDelete,
    dragTilt,
    lift,
    onShred,
    onReorder,
    disabled
  };
  const sim = useRef<Sim<T>>({
    raf: 0,
    last: 0,
    t: 0,
    drag: null,
    feeds: [],
    strips: [],
    shifts: new Map(),
    tops: new Map(),
    timers: new Set(),
    dpr: 1,
    cw: 0,
    ch: 0
  });

  const metrics = (): Metrics => {
    const c = cfg.current;
    const root = rootRef.current!;
    const r = root.getBoundingClientRect();
    const k = r.width / root.offsetWidth || 1;
    const lip = c.height - c.fallHeight - c.slitHeight;
    return { left: r.left, top: r.top, k, rw: root.offsetWidth, lip, exit: lip + c.slitHeight };
  };
  const at = (el: Element, m: Metrics) => {
    const r = el.getBoundingClientRect();
    return { x: (r.left - m.left) / m.k, y: (r.top - m.top) / m.k };
  };
  const local = (e: { clientX: number; clientY: number }, m: Metrics) => ({
    x: (e.clientX - m.left) / m.k,
    y: (e.clientY - m.top) / m.k
  });

  const run = () => {
    const s = sim.current;
    if (s.raf) return;
    s.last = performance.now();
    s.raf = requestAnimationFrame(step);
  };

  const later = (ms: number, fn: () => void) => {
    const s = sim.current;
    const id = setTimeout(() => {
      s.timers.delete(id);
      fn();
    }, ms);
    s.timers.add(id);
  };

  const slotOf = (key: string | number) => slotEls.current.get(key);
  const isLive = (key: string | number) => {
    const slot = slotOf(key);
    return !!slot && slot.dataset.gone === undefined;
  };
  const liveKeys = () => cfg.current.items.map(item => item.id).filter(isLive);
  const goneKeys = () =>
    cfg.current.items
      .map(item => item.id)
      .filter(key => {
        const slot = slotOf(key);
        return !!slot && slot.dataset.gone !== undefined;
      });

  const shiftOf = (slot: HTMLLIElement): Shift => {
    const s = sim.current;
    let sh = s.shifts.get(slot);
    if (!sh) {
      sh = { el: slot, y: 0, v: 0, target: 0, delay: 0, item: null };
      s.shifts.set(slot, sh);
    }
    return sh;
  };

  const settle = (origin: HTMLLIElement | null, entering: Set<HTMLLIElement> | null) => {
    const s = sim.current;
    if (!rootRef.current) return;
    const m = metrics();
    const next = new Map<HTMLLIElement, number>();
    const still = reduced();
    const active = s.drag ? s.drag.slot : null;
    const slots = cfg.current.items.map(item => slotOf(item.id));
    const from = origin ? slots.indexOf(origin) : -1;
    let born = 0;
    cfg.current.items.forEach((item, idx) => {
      const slot = slots[idx];
      if (!slot) return;
      const sh = s.shifts.get(slot);
      const top = at(slot, m).y - (sh ? sh.y : 0);
      const prev = s.tops.get(slot);
      next.set(slot, top);
      if (slot === active || still) return;
      const fresh = (entering && entering.has(slot)) || (prev === undefined && s.tops.size > 0);
      if (fresh) {
        const rec = shiftOf(slot);
        const el = itemEls.current.get(item.id) || null;
        rec.y = -ENTER;
        rec.v = 0;
        rec.target = 0;
        rec.delay = born * 0.05;
        rec.item = el;
        born += 1;
        if (el) el.style.opacity = '0';
        slot.style.transform = `translateY(${rec.y}px)`;
        return;
      }
      if (prev === undefined) return;
      const delta = prev - top;
      if (Math.abs(delta) < 0.5) return;
      const rec = shiftOf(slot);
      rec.y += delta;
      if (from >= 0) rec.delay = Math.max(0, from - 1 - idx) * STAGGER;
      slot.style.transform = `translateY(${rec.y}px)`;
    });
    s.tops = next;
    run();
  };

  const reflow = (mutate: () => void, origin?: HTMLLIElement | null, entering?: Set<HTMLLIElement> | null) => {
    mutate();
    settle(origin || null, entering || null);
  };

  const arrange = (key: string | number, index: number) => {
    const ids = cfg.current.items.map(item => item.id).filter(id => id !== key);
    const live = ids.filter(isLive);
    let anchor = 0;
    if (index < live.length) anchor = ids.indexOf(live[index]);
    else if (live.length) anchor = ids.indexOf(live[live.length - 1]) + 1;
    ids.splice(anchor, 0, key);
    return ids;
  };

  const commit = (ids: (string | number)[]) => {
    const same = ids.every((id, i) => id === cfg.current.items[i]?.id);
    if (same) return false;
    flushSync(() => setOrder(ids));
    return true;
  };

  const revive = (keys: (string | number)[], index?: number) => {
    const s = sim.current;
    if (s.drag) {
      later(300, () => revive(keys, index));
      return;
    }
    const entering = new Set<HTMLLIElement>();
    reflow(
      () => {
        if (index !== undefined && keys.length === 1) commit(arrange(keys[0], index));
        keys.forEach(key => {
          const slot = slotOf(key);
          const el = itemEls.current.get(key);
          if (!slot || slot.dataset.gone === undefined) return;
          delete slot.dataset.gone;
          slot.style.height = '';
          slot.style.marginBottom = '';
          if (el) {
            el.style.visibility = '';
            el.style.transform = '';
            delete el.dataset.state;
          }
          entering.add(slot);
        });
      },
      null,
      entering
    );
  };

  const afterShred = (key: string | number) => {
    const c = cfg.current;
    if (c.loopAfterDelete) {
      later(700, () => revive([key], Math.floor(Math.random() * (liveKeys().length + 1))));
    } else if (c.loop && liveKeys().length === 0) {
      later(900, () => revive(goneKeys()));
    }
  };

  const collapse = (f: Feed<T>, s: Sim<T>) => {
    f.consumed = true;
    f.el.style.visibility = 'hidden';
    delete f.slot.dataset.active;
    s.shifts.forEach(sh => {
      sh.target = 0;
    });
    reflow(() => {
      f.slot.dataset.gone = '';
      f.slot.style.height = '0px';
      f.slot.style.marginBottom = '0px';
    }, f.slot);
    cfg.current.onShred?.(f.item);
    afterShred(f.key);
  };

  const consumeNow = (key: string | number, item: T, el: HTMLDivElement, slot: HTMLLIElement) => {
    const s = sim.current;
    const f: Feed<T> = {
      key,
      item,
      el,
      slot,
      W: 0,
      H: 0,
      rx: 0,
      ry: 0,
      tx: 0,
      tilt: 0,
      lift: 1,
      v: 0,
      age: 0,
      tex: null,
      ts: 1,
      consumed: false,
      strips: 0
    };
    collapse(f, s);
    run();
  };

  const grab = (d: Drag<T>, m: Metrics) => {
    const s = sim.current;
    const c = cfg.current;
    s.drag = null;
    s.shifts.forEach(sh => {
      sh.target = 0;
    });
    if (reduced()) {
      consumeNow(d.key, d.item, d.el, d.slot);
      return;
    }
    const over = d.ry + d.H - m.lip;
    const ry = over > c.bite * 1.5 ? m.lip + c.bite * 1.5 - d.H : d.ry;
    const lo = c.inset - SLIT;
    const hi = m.rw - c.inset + SLIT - d.W;
    const n = Math.max(1, Math.round(d.W / Math.max(4, c.stripWidth)));
    const sw = Math.floor(d.W / n);
    const f: Feed<T> = {
      key: d.key,
      item: d.item,
      el: d.el,
      slot: d.slot,
      W: d.W,
      H: d.H,
      rx: d.rx,
      ry,
      tx: clamp(d.rx, Math.min(lo, hi), Math.max(lo, hi)),
      tilt: d.tilt,
      lift: d.lift,
      v: c.feedSpeed * TUG,
      age: 0,
      tex: null,
      ts: 1,
      consumed: false,
      strips: n
    };
    let settled = false;
    const use = ({ tex, scale }: Texture) => {
      if (settled) return;
      settled = true;
      f.tex = tex;
      f.ts = scale;
      run();
    };
    d.snap.then(use, () => use(flat(d.W, d.H, d.fill)));
    setTimeout(() => use(flat(d.W, d.H, d.fill)), 400);
    d.el.dataset.state = 'feed';
    s.feeds.push(f);
    for (let i = 0; i < n; i += 1) {
      s.strips.push({
        feed: f,
        x: i * sw,
        w: i === n - 1 ? d.W - sw * (n - 1) : sw,
        H: d.H,
        phase: 'attached',
        curl: side() * pick(0.35, 0.9) * DEG * c.curl,
        amp: pick(1.5, 4) * DEG * c.curl,
        freq: (Math.PI * 2) / pick(34, 60),
        wave: pick(0, Math.PI * 2),
        rA: Math.random(),
        rB: Math.random(),
        speed: 0,
        splay: 0,
        core: 1,
        rest: 0,
        alpha: 1,
        th: 0,
        ax: 0,
        ay: 0,
        vx: 0,
        vy: 0,
        hang: 0,
        pts: []
      });
    }
  };

  const place = (d: Drag<T>, sp: { x: number; y: number }) => {
    d.el.style.transform = `translate(${d.rx - sp.x}px, ${d.ry - sp.y}px) rotate(${d.tilt}deg) scale(${d.lift})`;
  };

  const aim = (d: Drag<T>, m: Metrics) => {
    const s = sim.current;
    const c = cfg.current;
    const rows: { slot: HTMLLIElement; mid: number }[] = [];
    c.items.forEach(item => {
      if (item.id === d.key) return;
      const slot = slotOf(item.id);
      if (!slot || slot.dataset.gone !== undefined) return;
      const top = s.tops.get(slot);
      if (top === undefined) return;
      rows.push({ slot, mid: top + slot.offsetHeight / 2 });
    });
    let j = -1;
    if (d.moved && d.ry + d.H < m.lip - 8) {
      const cy = d.ry + d.H / 2;
      let n = 0;
      rows.forEach(row => {
        if (row.mid < cy) n += 1;
      });
      if (d.j >= 0 && n !== d.j) {
        const edge = rows[n > d.j ? n - 1 : n];
        if (edge && Math.abs(edge.mid - cy) < HYSTERESIS) n = d.j;
      }
      j = n;
    }
    if (j === d.j) return;
    d.j = j;
    rows.forEach((row, k) => {
      shiftOf(row.slot).target = j >= 0 && k < j ? -(d.H + c.gap) : 0;
    });
  };

  const drop = (d: Drag<T>) => {
    const s = sim.current;
    const c = cfg.current;
    const live = liveKeys().filter(key => key !== d.key);
    const index = clamp(d.j >= 0 ? d.j : d.from, 0, live.length);
    s.shifts.forEach(sh => {
      sh.target = 0;
    });
    let changed = false;
    reflow(() => {
      changed = commit(arrange(d.key, index));
      d.slot.style.height = `${d.H}px`;
      d.slot.style.marginBottom = '';
    });
    d.phase = 'return';
    if (changed) c.onReorder?.(cfg.current.items);
  };

  const tick = (now: number) => {
    const s = sim.current;
    const c = cfg.current;
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) {
      s.raf = 0;
      return;
    }
    const dt = clamp((now - s.last) / 1000, 0, 0.05);
    s.last = now;
    s.t += dt;
    const m = metrics();
    const d = s.drag;
    if (d) {
      if (!d.el.isConnected) {
        s.drag = null;
      } else {
        const sp = at(d.slot, m);
        const ceiling = m.lip + c.bite - d.H;
        if (d.phase === 'drag') {
          d.tx = d.px - d.gx;
          d.ty = Math.min(d.py - d.gy, ceiling);
          if (!d.moved && Math.hypot(d.px - d.ox, d.py - d.oy) > 6) d.moved = true;
          aim(d, m);
        } else if (d.phase === 'carry') {
          d.tx = (m.rw - d.W) / 2;
          d.ty = ceiling;
        } else {
          d.tx = sp.x;
          d.ty = sp.y;
        }
        const omega = d.phase === 'drag' ? FOLLOW : SETTLE;
        [d.rx, d.vx] = spring(d.rx, d.vx, d.tx, dt, omega);
        [d.ry, d.vy] = spring(d.ry, d.vy, d.ty, dt, omega);
        const lean = d.phase === 'drag' ? clamp(d.vx * 0.012, -c.dragTilt, c.dragTilt) : 0;
        d.tilt = ease(d.tilt, lean, dt, 0.09);
        d.lift = ease(d.lift, d.phase === 'return' ? 1 : c.lift, dt, 0.12);
        const over = d.ry + d.H - m.lip;
        const bites = d.phase === 'carry' || (d.phase === 'drag' && c.autoFeed);
        if (bites && over >= c.bite - 0.5) {
          grab(d, m);
        } else {
          place(d, sp);
          const still =
            Math.abs(d.rx - d.tx) < 0.2 && Math.abs(d.ry - d.ty) < 0.2 && Math.abs(d.vy) < 2 && Math.abs(d.vx) < 2;
          if (d.phase === 'return' && still && Math.abs(d.lift - 1) < 0.002 && Math.abs(d.tilt) < 0.05) {
            d.el.style.transform = '';
            delete d.el.dataset.state;
            delete d.slot.dataset.active;
            d.slot.style.height = '';
            s.drag = null;
          }
        }
      }
    }
    let pulling = false;
    for (let i = s.feeds.length - 1; i >= 0; i -= 1) {
      const f = s.feeds[i];
      if (!f.consumed) {
        if (!f.el.isConnected) {
          s.feeds.splice(i, 1);
          continue;
        }
        pulling = true;
        const sp = at(f.slot, m);
        if (f.tex) {
          f.age += dt;
          f.v = c.feedSpeed * (1 + (TUG - 1) * Math.exp(-f.age / TUG_DECAY));
          f.ry += f.v * dt;
        }
        f.rx = ease(f.rx, f.tx, dt, 0.1);
        f.tilt = ease(f.tilt, 0, dt, 0.08);
        f.lift = ease(f.lift, 1, dt, 0.1);
        if (f.ry >= m.lip) {
          collapse(f, s);
        } else {
          const jitter = Math.sin(s.t * 150) * 0.5;
          f.el.style.transform = `translate(${f.rx - sp.x + jitter}px, ${f.ry - sp.y}px) rotate(${f.tilt}deg) scale(${f.lift})`;
        }
      } else {
        f.ry += f.v * dt;
        if (f.strips === 0) s.feeds.splice(i, 1);
      }
    }
    let moving = false;
    s.shifts.forEach((sh, el) => {
      if (!el.isConnected) {
        s.shifts.delete(el);
        return;
      }
      if (sh.delay > 0) {
        sh.delay -= dt;
        moving = true;
        return;
      }
      if (sh.item) {
        const el = sh.item;
        el.style.transition = 'opacity 280ms ease';
        el.style.opacity = '';
        setTimeout(() => {
          el.style.transition = '';
        }, 320);
        sh.item = null;
      }
      const n = Math.ceil(dt * 240);
      const h = dt / n;
      for (let k = 0; k < n; k += 1) {
        sh.v += (-STACK_K * (sh.y - sh.target) - STACK_C * sh.v) * h;
        sh.y += sh.v * h;
      }
      if (Math.abs(sh.y - sh.target) < 0.15 && Math.abs(sh.v) < 4) {
        sh.y = sh.target;
        sh.v = 0;
        if (sh.target === 0) {
          el.style.transform = '';
          s.shifts.delete(el);
        } else {
          el.style.transform = `translateY(${sh.y}px)`;
        }
      } else {
        el.style.transform = `translateY(${sh.y}px)`;
        moving = true;
      }
    });
    const ctx = canvas.getContext('2d')!;
    const dpr = s.dpr;
    if (s.strips.length) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    for (let i = s.strips.length - 1; i >= 0; i -= 1) {
      const st = s.strips[i];
      const f = st.feed;
      let len = st.H;
      if (st.phase === 'attached') {
        const top = f.ry - m.exit;
        st.hang = top + st.H;
        if (st.hang <= 0) {
          moving = true;
          continue;
        }
        st.ax = f.rx + st.x + st.w / 2;
        st.th = Math.sin(s.t * 6 + st.wave) * 0.03 * smooth(st.hang / 40);
        if (top >= 0) {
          st.phase = 'free';
          st.ay = top;
          st.vy = f.v;
          st.vx = pick(-20, 20);
          st.speed = 150 + st.rA * 230;
          st.splay = (st.rA - 0.5) * 320;
          st.rest = side() * pick(0.15, 0.6);
          f.strips -= 1;
        } else {
          st.ay = 0;
          len = st.hang;
        }
      }
      if (st.phase === 'free') {
        const tear = Math.pow(clamp(middle(st.pts) / c.fallHeight, 0, 1), 1.2);
        const breath = 0.85 + 0.15 * Math.sin(s.t * (1 + st.rB * 2) + st.rA * 6.2832);
        st.vy = ease(st.vy, st.speed * breath, dt, 0.25);
        st.vx = ease(st.vx, st.splay * tear + (st.ax - m.rw / 2) * 0.25, dt, 0.4);
        st.ax += st.vx * dt;
        st.ay += st.vy * dt;
        st.th = ease(st.th, st.rest, dt, 0.5);
        st.core = 1 - smooth(tear / 0.85) * (0.8 - st.rA * 0.16);
        shape(st, st.H, s.t, tear);
        st.alpha = 1 - smooth((tear - 0.6) / 0.4);
        if (st.alpha <= 0.01 || st.pts[1] > c.fallHeight) {
          s.strips.splice(i, 1);
          continue;
        }
      } else {
        st.core = 1;
        shape(st, len, s.t, 0);
        st.alpha = 1;
      }
      paintStrip(ctx, st, len, dpr);
      moving = true;
    }
    const slit = slitRef.current;
    if (slit) {
      slit.style.transform = pulling ? `translate(${Math.sin(s.t * 140) * 0.5}px, ${Math.cos(s.t * 97) * 0.35}px)` : '';
    }
    if (s.drag || s.feeds.length || moving) {
      s.raf = requestAnimationFrame(step);
    } else {
      s.raf = 0;
    }
  };

  const step = (now: number) => {
    const s = sim.current;
    try {
      tick(now);
    } catch (err) {
      s.raf = 0;
      throw err;
    }
  };

  const begin = (item: T, phase: Drag<T>['phase'], e: PointerEvent<HTMLDivElement> | null) => {
    const s = sim.current;
    const c = cfg.current;
    const key = item.id;
    const el = itemEls.current.get(key);
    const slot = slotOf(key);
    if (c.disabled || s.drag || !el || !slot || slot.dataset.gone !== undefined) return;
    if (s.feeds.some(f => f.key === key)) return;
    const m = metrics();
    const sp = at(slot, m);
    const W = slot.offsetWidth;
    const H = slot.offsetHeight;
    const p = e ? local(e, m) : { x: sp.x, y: sp.y };
    const face = (el.firstElementChild as HTMLElement | null) || el;
    const fill = getComputedStyle(face).backgroundColor;
    let snap: Promise<Texture>;
    try {
      snap = snapshot(el, W, H);
    } catch {
      snap = Promise.reject(new Error('snapshot'));
    }
    snap.catch(() => {});
    const d: Drag<T> = {
      key,
      item,
      el,
      slot,
      W,
      H,
      rx: sp.x,
      ry: sp.y,
      tx: sp.x,
      ty: sp.y,
      vx: 0,
      vy: 0,
      tilt: 0,
      lift: 1,
      gx: p.x - sp.x,
      gy: p.y - sp.y,
      px: p.x,
      py: p.y,
      ox: p.x,
      oy: p.y,
      moved: false,
      from: liveKeys().indexOf(key),
      j: -1,
      phase,
      id: e ? e.pointerId : null,
      snap,
      fill: fill === 'rgba(0, 0, 0, 0)' || fill === 'transparent' ? 'rgba(127, 127, 127, 0.35)' : fill
    };
    s.drag = d;
    s.shifts.delete(slot);
    slot.style.transform = '';
    reflow(() => {
      slot.dataset.active = '';
      el.dataset.state = 'drag';
      slot.style.height = '0px';
      slot.style.marginBottom = '0px';
    }, slot);
    place(d, at(slot, m));
    run();
  };

  const onDown = (e: PointerEvent<HTMLDivElement>, item: T) => {
    if (e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    begin(item, 'drag', e);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = sim.current.drag;
    if (!d || d.id !== e.pointerId) return;
    const p = local(e, metrics());
    d.px = p.x;
    d.py = p.y;
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = sim.current.drag;
    if (!d || d.id !== e.pointerId) return;
    d.id = null;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    const m = metrics();
    if (d.ry + d.H > m.lip + 0.5) {
      grab(d, m);
    } else {
      drop(d);
    }
    run();
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>, item: T) => {
    if (e.key !== 'Delete' && e.key !== 'Backspace') return;
    e.preventDefault();
    if (e.repeat) return;
    const key = item.id;
    if (reduced()) {
      const el = itemEls.current.get(key);
      const slot = slotOf(key);
      const s = sim.current;
      if (cfg.current.disabled || !el || !slot || slot.dataset.gone !== undefined || s.feeds.some(f => f.key === key))
        return;
      consumeNow(key, item, el, slot);
      return;
    }
    begin(item, 'carry', null);
  };

  useLayoutEffect(() => {
    settle(null, null);
  });

  useEffect(() => {
    const s = sim.current;
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return undefined;
    const fit = () => {
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      const cw = root.offsetWidth + OVER * 2;
      const ch = cfg.current.fallHeight;
      if (cw === s.cw && ch === s.ch && dpr === s.dpr) return;
      if (s.cw) s.tops = new Map();
      s.cw = cw;
      s.ch = ch;
      s.dpr = dpr;
      canvas.width = Math.ceil(cw * dpr);
      canvas.height = Math.ceil(ch * dpr);
    };
    const ro = new ResizeObserver(fit);
    ro.observe(root);
    fit();
    return () => ro.disconnect();
  }, [fallHeight]);

  useEffect(() => {
    const timer = setTimeout(() => {
      itemEls.current.forEach(el => {
        el.querySelectorAll('img').forEach(img => {
          dataUrl(img.currentSrc || img.src).catch(() => {});
        });
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [items]);

  useEffect(() => {
    if (!autoAnimate) return undefined;
    const s = sim.current;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const wait = (ms: number) =>
      new Promise(resolve => {
        timer = setTimeout(resolve, ms);
      });
    const idle = () => !s.drag && s.feeds.length === 0 && s.strips.length === 0 && s.shifts.size === 0;
    const pickNext = () => {
      const list = cfg.current.items;
      for (let i = list.length - 1; i >= 0; i -= 1) {
        if (isLive(list[i].id)) return list[i];
      }
      return null;
    };
    const play = async () => {
      await wait(900);
      while (alive) {
        while (alive && !idle()) await wait(120);
        if (!alive) break;
        const item = pickNext();
        if (!item) {
          await wait(1100);
          if (!alive) break;
          revive(goneKeys());
          await wait(1200);
          continue;
        }
        if (!cfg.current.disabled) begin(item, 'carry', null);
        await wait(700);
      }
    };
    play();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAnimate]);

  useEffect(() => {
    const s = sim.current;
    return () => {
      cancelAnimationFrame(s.raf);
      s.raf = 0;
      s.timers.forEach(id => clearTimeout(id));
      s.timers.clear();
    };
  }, []);

  const keep =
    <E extends HTMLElement>(map: { current: Map<string | number, E> }, key: string | number) =>
    (el: E | null) => {
      if (el) map.current.set(key, el);
      else map.current.delete(key);
    };

  return (
    <div
      ref={rootRef}
      className={`group relative [width:min(var(--sh-w),100%)] [height:var(--sh-h)] [color:var(--sh-ink)] [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] data-[disabled]:opacity-60${className ? ` ${className}` : ''}`}
      data-disabled={disabled ? '' : undefined}
      style={
        {
          '--sh-w': `${width}px`,
          '--sh-h': `${height}px`,
          '--sh-inset': `${inset}px`,
          '--sh-gap': `${gap}px`,
          '--sh-slit-h': `${slitHeight}px`,
          '--sh-fall': `${fallHeight}px`,
          '--sh-slit-inset': `${Math.max(0, inset - SLIT)}px`,
          '--sh-over': `${OVER}px`,
          '--sh-slit': slitColor,
          '--sh-ink': color
        } as CSSProperties
      }
    >
      <ul className="absolute right-0 left-0 z-[1] m-0 list-none [bottom:calc(var(--sh-fall)+var(--sh-slit-h))] [padding:0_var(--sh-inset)] [clip-path:inset(-9999px_-9999px_0_-9999px)]">
        {sorted.map((item, index) => (
          <li
            key={item.id}
            ref={keep(slotEls, item.id)}
            className="group/slot relative [margin-bottom:var(--sh-gap)] data-[active]:z-[2] data-[gone]:pointer-events-none"
          >
            <div
              ref={keep(itemEls, item.id)}
              className="relative origin-center cursor-grab touch-none select-none outline-none [-webkit-user-select:none] group-data-[active]/slot:absolute group-data-[active]/slot:top-0 group-data-[active]/slot:right-0 group-data-[active]/slot:left-0 group-data-[active]/slot:[will-change:transform,filter] group-data-[active]/slot:[filter:drop-shadow(0_0_0_rgba(0,0,0,0))] group-data-[active]/slot:[transition:filter_240ms_ease] data-[state=drag]:cursor-grabbing data-[state=drag]:[filter:drop-shadow(0_14px_22px_rgba(0,0,0,0.22))]! data-[state=feed]:pointer-events-none data-[state=feed]:cursor-default group-data-[disabled]:cursor-default motion-reduce:group-data-[active]/slot:[transition:none]"
              tabIndex={disabled ? -1 : 0}
              aria-disabled={disabled || undefined}
              onPointerDown={e => onDown(e, item)}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              onLostPointerCapture={onUp}
              onKeyDown={e => onKey(e, item)}
              onDragStart={e => e.preventDefault()}
            >
              {renderItem(item, index)}
            </div>
          </li>
        ))}
      </ul>
      <div
        ref={slitRef}
        className="absolute z-[3] rounded-full will-change-transform [right:var(--sh-slit-inset)] [bottom:var(--sh-fall)] [left:var(--sh-slit-inset)] [height:var(--sh-slit-h)] [background:var(--sh-slit)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-0 bottom-0 left-0 z-[2] [height:var(--sh-fall)]"
        aria-hidden="true"
      >
        <canvas
          ref={canvasRef}
          className="absolute top-0 block h-full [left:calc(-1*var(--sh-over))] [width:calc(100%+var(--sh-over)*2)]"
        />
      </div>
    </div>
  );
};

export default Shredder;
