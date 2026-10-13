'use client';

import React, { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import './LogoLoop.css';

export type LogoItem =
  | {
      node: React.ReactNode;
      href?: string;
      title?: string;
      ariaLabel?: string;
      hoverColor?: string;
    }
  | {
      src: string;
      alt?: string;
      href?: string;
      title?: string;
      srcSet?: string;
      sizes?: string;
      width?: number;
      height?: number;
      hoverColor?: string;
    };

export interface LogoLoopProps {
  logos: LogoItem[];
  speed?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
  width?: number | string;
  logoHeight?: number;
  gap?: number;
  pauseOnHover?: boolean;
  hoverSpeed?: number;
  fadeOut?: boolean;
  fadeOutWidth?: number;
  fadeOutColor?: string;
  scaleOnHover?: boolean;
  layout?: 'line' | 'wave' | 'arc' | 'orbit';
  bend?: number;
  focus?: number;
  magnify?: number;
  tiltX?: number;
  tiltY?: number;
  step?: boolean;
  muted?: number;
  labels?: 'none' | 'inline' | 'below' | 'hover';
  draggable?: boolean;
  scrollBoost?: number;
  intro?: boolean;
  renderItem?: (item: LogoItem, key: React.Key) => React.ReactNode;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

interface LoopConfig {
  speed: number;
  dirSign: number;
  hoverValue: number | undefined;
  vertical: boolean;
  layout: string;
  bend: number;
  focus: number;
  magnify: number;
  tiltX: number;
  tiltY: number;
  step: boolean;
  draggable: boolean;
  scrollBoost: number;
  intro: boolean;
  scaleOnHover: boolean;
  labels: string;
  links: boolean;
}

interface LoopLayout {
  copies: number;
  primary: number;
}

interface LoopItem {
  el: HTMLElement;
  copy: number;
  index: number;
  content: HTMLElement | null;
  tip: HTMLElement | null;
  center: number;
  size: number;
  cross: number;
  t: string;
  o: string;
  v: string;
  z: string;
  s: string;
  p: string;
}

interface Geometry {
  mode: string;
  shift: number;
  uMin: number;
  uMax: number;
  lead: number;
  focus: number;
  focusSigma: number;
  magnify: number;
  magSigma: number;
  amp: number;
  k: number;
  R: number;
  sign: number;
  limit: number;
  C: number;
  alpha: number;
  depth: number;
  pf: number;
  tilted: boolean;
  tiltX: number;
  tiltY: number;
  m: number[];
  persp: number;
}

interface Drag {
  id: number;
  x: number;
  y: number;
  active: boolean;
  samples: [number, number][];
  scale: number;
  anchor: number;
  offset: number;
}

interface Move {
  from: number;
  delta: number;
  t: number;
  dur: number;
}

interface EngineState {
  offset: number;
  velocity: number;
  period: number;
  length: number;
  box: [number, number];
  items: LoopItem[];
  snaps: number[];
  pitch: number;
  crossMax: number;
  sizeMax: number;
  tipMax: number;
  geo: Geometry | null;
  layout: LoopLayout;
  hovered: boolean;
  focused: boolean;
  pointer: [number, number] | null;
  pointerInside: boolean;
  mag: number;
  magU: number;
  magReady: boolean;
  drag: Drag | null;
  glide: boolean;
  suppressUntil: number;
  pressedAt: number;
  move: Move | null;
  hold: number;
  seek: Move | null;
  scrollVel: number;
  scrollY: number;
  scrollT: number;
  visible: boolean;
  introStart: number;
  introDone: boolean;
  itemMode: boolean;
  active: LoopItem | null;
  raf: number;
  last: number;
  reduced: boolean;
  destroyed: boolean;
}

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const SMOOTH_TAU = 0.25;
const GLIDE_TAU = 0.8;
const DRAG_THRESHOLD = 6;
const MAX_FLING = 4000;
const INTRO_TIME = 0.7;
const INTRO_STAGGER = 0.45;
const HALF_SQRT_PI = Math.sqrt(Math.PI) / 2;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const toCssLength = (value?: number | string): string | undefined =>
  typeof value === 'number' ? `${value}px` : (value ?? undefined);

const erf = (x: number) => {
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return x < 0 ? -y : y;
};

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

const fadeMask = (size: number, vertical: boolean) => {
  const span = clamp(size, 0, 0.5) * 100;
  if (span <= 0) return undefined;
  const stops: string[] = [];
  for (let i = 0; i <= 12; i++) {
    stops.push(`rgba(0,0,0,${smootherstep(i / 12).toFixed(4)}) ${((span * i) / 12).toFixed(3)}%`);
  }
  for (let i = 12; i >= 0; i--) {
    stops.push(`rgba(0,0,0,${smootherstep(i / 12).toFixed(4)}) ${(100 - (span * i) / 12).toFixed(3)}%`);
  }
  return `linear-gradient(${vertical ? 'to bottom' : 'to right'}, ${stops.join(', ')})`;
};

const rotationMatrix = (degX: number, degY: number): number[] => {
  const a = (degX * Math.PI) / 180;
  const b = (degY * Math.PI) / 180;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const cb = Math.cos(b);
  const sb = Math.sin(b);
  return [cb, 0, sb, sa * sb, ca, -sa * cb, -ca * sb, sa, ca * cb];
};

const unproject = (m: number[], depth: number, sx: number, sy: number): [number, number] | null => {
  const den = m[8] * depth - m[2] * sx - m[5] * sy;
  if (den <= 1e-6) return null;
  const t = (m[8] * depth) / den;
  if (t <= 0) return null;
  const qx = t * sx;
  const qy = t * sy;
  const qz = depth * (1 - t);
  return [m[0] * qx + m[3] * qy + m[6] * qz, m[1] * qx + m[4] * qy + m[7] * qz];
};

const project = (m: number[], depth: number, px: number, py: number): [number, number] => {
  const k = depth / (depth - (m[6] * px + m[7] * py));
  return [(m[0] * px + m[1] * py) * k, (m[3] * px + m[4] * py) * k];
};

const createEngine = (
  root: HTMLDivElement,
  track: HTMLDivElement,
  config: React.MutableRefObject<LoopConfig>,
  setLayout: (layout: LoopLayout) => void
) => {
  const query = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const st: EngineState = {
    offset: 0,
    velocity: 0,
    period: 0,
    length: 0,
    box: [0, 0],
    items: [],
    snaps: [],
    pitch: 0,
    crossMax: 0,
    sizeMax: 0,
    tipMax: 0,
    geo: null,
    layout: { copies: 2, primary: 0 },
    hovered: false,
    focused: false,
    pointer: null,
    pointerInside: false,
    mag: 0,
    magU: 0,
    magReady: false,
    drag: null,
    glide: false,
    suppressUntil: 0,
    pressedAt: -1e9,
    move: null,
    hold: 0,
    seek: null,
    scrollVel: 0,
    scrollY: window.scrollY,
    scrollT: 0,
    visible: typeof IntersectionObserver === 'undefined',
    introStart: -1,
    introDone: !config.current.intro,
    itemMode: false,
    active: null,
    raf: 0,
    last: 0,
    reduced: !!query?.matches,
    destroyed: false
  };

  const collect = () => {
    const items: LoopItem[] = [];
    Array.from(track.children).forEach((list, copy) => {
      Array.from(list.children).forEach((el, index) => {
        items.push({
          el: el as HTMLElement,
          copy,
          index,
          content: (el.children[0] as HTMLElement) || null,
          tip: (el.children[1] as HTMLElement) || null,
          center: 0,
          size: 0,
          cross: 0,
          t: '',
          o: '',
          v: '',
          z: '',
          s: '',
          p: ''
        });
      });
    });
    st.items = items;
    st.active = null;
  };

  const clearItems = () => {
    for (const it of st.items) {
      it.el.style.transform = '';
      it.el.style.opacity = '';
      it.el.style.visibility = '';
      it.el.style.zIndex = '';
      if (it.content) it.content.style.transform = '';
      if (it.tip) it.tip.style.transform = '';
      it.t = it.o = it.v = it.z = it.s = it.p = '';
    }
  };

  const geometry = () => {
    const cfg = config.current;
    const L = st.length;
    const P = st.period;
    const hc = st.crossMax;
    const w = st.sizeMax;
    const bend = clamp(cfg.bend, -1, 1);
    const geo: Geometry = {
      mode: cfg.layout,
      shift: 0,
      uMin: -L / 2 - w,
      uMax: L / 2 + w,
      lead: 0,
      focus: clamp(cfg.focus, 0, 1) * 0.9,
      focusSigma: Math.max(40, L * 0.18),
      magnify: clamp(cfg.magnify, 0, 1),
      magSigma: Math.max(hc * 1.4, st.pitch * 1.1),
      amp: 0,
      k: 0,
      R: 0,
      sign: 1,
      limit: 0,
      C: 0,
      alpha: 0,
      depth: 0,
      pf: 1,
      tilted: false,
      tiltX: 0,
      tiltY: 0,
      m: [1, 0, 0, 0, 1, 0, 0, 0, 1],
      persp: 0
    };
    let pad = cfg.scaleOnHover ? hc * 0.1 : 0;
    const lens = (1 + geo.focus) * (1 + geo.magnify) - 1;
    if (geo.mode === 'wave') {
      geo.amp = bend * (hc * 0.6 + L * 0.035);
      geo.k = (2 * Math.PI) / Math.max(1, L / 1.25);
      pad += Math.abs(geo.amp) + (lens * hc) / 2 + hc * 0.08;
    } else if (geo.mode === 'arc' && Math.abs(bend) > 0.005) {
      const edge = Math.abs(bend) * (Math.PI / 4);
      const R = L / 2 / Math.sin(edge);
      const sag = R * (1 - Math.cos(edge));
      geo.R = R;
      geo.sign = Math.sign(bend);
      geo.shift = sag / 2;
      geo.limit = Math.PI * 0.6;
      const reach = R * Math.min(Math.PI / 2, Math.asin(Math.min(1, (L / 2 + w) / R))) + w;
      geo.uMin = -reach;
      geo.uMax = reach;
      pad += sag / 2 + (w / 2) * Math.sin(edge) + (lens * hc) / 2;
    } else if (geo.mode === 'orbit') {
      const R = Math.max(40, L * 0.43 - w * 0.2);
      const k = Math.max(1, Math.round((2 * Math.PI * R) / P));
      const alpha = Math.sign(bend) * Math.atan2(Math.abs(bend) * Math.max(hc * 2, R * 0.36), R);
      const depth = R * 5;
      const pf = depth / (depth - R * Math.cos(alpha));
      const pb = depth / (depth + R * Math.cos(alpha));
      const yf = R * Math.sin(alpha) * pf;
      const yb = -R * Math.sin(alpha) * pb;
      const grow = (1 + lens) * (cfg.scaleOnHover ? 1.2 : 1);
      const lo = Math.min(yf - (hc * pf * grow) / 2, yb - (hc * pb) / 2);
      const hi = Math.max(yf + (hc * pf * grow) / 2, yb + (hc * pb) / 2);
      geo.R = R;
      geo.C = k * P;
      geo.alpha = alpha;
      geo.depth = depth;
      geo.pf = pf;
      geo.shift = (lo + hi) / 2;
      geo.uMin = -geo.C / 2;
      geo.uMax = geo.C / 2;
      pad = Math.max(0, (hi - lo) / 2 - hc / 2);
    } else {
      pad += (lens * hc) / 2;
    }
    if (cfg.labels === 'hover') pad += cfg.vertical ? st.tipMax : hc * 0.2 + Math.max(11, hc * 0.26) * 1.3;
    const tx = clamp(cfg.tiltX, -60, 60);
    const ty = clamp(cfg.tiltY, -60, 60);
    if (Math.abs(tx) > 0.01 || Math.abs(ty) > 0.01) {
      geo.tilted = true;
      geo.tiltX = tx;
      geo.tiltY = ty;
      geo.m = rotationMatrix(tx, ty);
      geo.persp = Math.max(L, 480) * 1.3;
      const edge = L / 2 + w;
      const along = (s: number) => {
        const p = cfg.vertical ? unproject(geo.m, geo.persp, 0, s) : unproject(geo.m, geo.persp, s, 0);
        if (!p) return Math.sign(s) * L * 4;
        return clamp(cfg.vertical ? p[1] : p[0], -L * 4, L * 4);
      };
      const a = along(-edge);
      const b = along(edge);
      geo.uMin = Math.min(geo.uMin, a, b) - w;
      geo.uMax = Math.max(geo.uMax, a, b) + w;
      const band = hc / 2 + pad;
      let reach = band;
      for (const u of [a, b, 0]) {
        for (const v of [-band, band]) {
          const q = cfg.vertical ? project(geo.m, geo.persp, v, u) : project(geo.m, geo.persp, u, v);
          reach = Math.max(reach, Math.abs(cfg.vertical ? q[0] : q[1]));
        }
      }
      pad = reach - hc / 2;
    }
    const extra = cfg.links ? 2 : 0;
    geo.lead = (Math.max(0, Math.ceil((-geo.uMin - L / 2) / P)) + extra) * P;
    const copies = Math.max(2, Math.ceil((geo.uMax + L / 2 + geo.lead) / P) + 2 + (extra ? 1 : 0));
    const primary = Math.min(copies - 1, Math.floor((geo.lead + L / 2) / P));
    st.geo = geo;
    root.style.setProperty('--logoloop-pad', `${Math.ceil(pad)}px`);
    root.style.perspective = geo.tilted ? `${geo.persp}px` : '';
    track.style.transformOrigin = geo.tilted ? (cfg.vertical ? `50% ${L / 2}px` : `${L / 2}px 50%`) : '';
    if (copies !== st.layout.copies || primary !== st.layout.primary) {
      st.layout = { copies, primary };
      setLayout(st.layout);
    }
  };

  const measure = () => {
    const cfg = config.current;
    const lists = track.children;
    if (!lists.length || !st.items.length) {
      st.period = 0;
      return;
    }
    if (cfg.vertical) {
      const parentHeight = root.parentElement?.clientHeight ?? 0;
      if (parentHeight > 0 && root.style.height !== `${Math.ceil(parentHeight)}px`) {
        root.style.height = `${Math.ceil(parentHeight)}px`;
      }
    } else if (root.style.height) {
      root.style.height = '';
    }
    track.style.transform = 'none';
    clearItems();
    const rootRect = root.getBoundingClientRect();
    const k = root.offsetWidth ? rootRect.width / root.offsetWidth || 1 : 1;
    const trackRect = track.getBoundingClientRect();
    const origin = cfg.vertical ? trackRect.top : trackRect.left;
    let crossMax = 0;
    let sizeMax = 0;
    let tipMax = 0;
    for (const it of st.items) {
      const r = it.el.getBoundingClientRect();
      it.center = ((cfg.vertical ? r.top + r.height / 2 : r.left + r.width / 2) - origin) / k;
      it.size = (cfg.vertical ? r.height : r.width) / k;
      it.cross = (cfg.vertical ? r.width : r.height) / k;
      crossMax = Math.max(crossMax, it.cross);
      sizeMax = Math.max(sizeMax, it.size);
      if (it.tip && it.copy === 0) tipMax = Math.max(tipMax, it.tip.offsetWidth);
    }
    const a = lists[0].getBoundingClientRect();
    const b = lists[1] ? lists[1].getBoundingClientRect() : null;
    st.period = (b ? (cfg.vertical ? b.top - a.top : b.left - a.left) : cfg.vertical ? a.height : a.width) / k;
    const cs = getComputedStyle(root);
    st.box = [root.offsetWidth, root.offsetHeight];
    st.length = cfg.vertical
      ? root.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
      : root.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    st.crossMax = crossMax;
    st.sizeMax = sizeMax;
    st.tipMax = tipMax + crossMax * 0.25;
    const first = st.items.filter(it => it.copy === 0);
    st.pitch = first.length ? st.period / first.length : st.period;
    st.snaps = first.map(it => it.center);
    st.itemMode = false;
    if (st.period <= 0) return;
    geometry();
  };

  const pointerU = () => {
    const geo = st.geo;
    if (!st.pointer || !geo) return null;
    const cfg = config.current;
    let sx = st.pointer[0] - st.box[0] / 2;
    let sy = st.pointer[1] - st.box[1] / 2;
    if (geo.tilted) {
      const p = unproject(geo.m, geo.persp, sx, sy);
      if (!p) return null;
      sx = p[0];
      sy = p[1];
    }
    const s = cfg.vertical ? sy : sx;
    if (geo.mode === 'arc' && geo.R) return geo.R * Math.asin(clamp(s / geo.R, -1, 1));
    if (geo.mode === 'orbit') return Math.asin(clamp(s / (geo.R * geo.pf), -1, 1));
    return s;
  };

  const snapTarget = (from: number, dir: number) => {
    const P = st.period;
    const base = st.length / 2 + (st.geo?.lead ?? 0);
    let best: number | null = null;
    for (const c of st.snaps) {
      const s = c - base;
      const candidate = dir > 0 ? s + P * Math.ceil((from + 0.5 - s) / P) : s + P * Math.floor((from - 0.5 - s) / P);
      if (best === null || (dir > 0 ? candidate < best : candidate > best)) best = candidate;
    }
    return best ?? from;
  };

  const nearestSnap = (value: number) => {
    const P = st.period;
    const base = st.length / 2 + (st.geo?.lead ?? 0);
    let best = value;
    let dist = Infinity;
    for (const c of st.snaps) {
      const s = c - base;
      const candidate = s + P * Math.round((value - s) / P);
      if (Math.abs(candidate - value) < dist) {
        dist = Math.abs(candidate - value);
        best = candidate;
      }
    }
    return best;
  };

  const startMove = (target: number, duration: number) => {
    st.move = { from: st.offset, delta: target - st.offset, t: 0, dur: duration };
  };

  const stepTiming = (speed: number) => {
    const cycle = st.pitch / Math.max(1, Math.abs(speed));
    const move = clamp(cycle * 0.55, 0.35, 0.9);
    return { move, hold: Math.max(0.35, cycle - move) };
  };

  const write = (
    it: LoopItem,
    key: 't' | 'o' | 'v' | 'z' | 's' | 'p',
    prop: 'transform' | 'opacity' | 'visibility' | 'zIndex',
    value: string,
    target: HTMLElement
  ) => {
    if (it[key] !== value) {
      it[key] = value;
      target.style[prop] = value;
    }
  };

  const render = (now: number) => {
    const cfg = config.current;
    const geo = st.geo as Geometry;
    const L = st.length;
    const half = L / 2;
    const T = -st.offset - geo.lead;
    const lineT = cfg.vertical
      ? `translate3d(0px, ${T.toFixed(2)}px, 0px)`
      : `translate3d(${T.toFixed(2)}px, 0px, 0px)`;
    track.style.transform = geo.tilted ? `rotateX(${geo.tiltX}deg) rotateY(${geo.tiltY}deg) ${lineT}` : lineT;
    const introRunning = st.introStart >= 0;
    const elapsed = introRunning ? (now - st.introStart) / 1000 : 0;
    const lensFocus = geo.mode === 'orbit' ? clamp(cfg.focus, 0, 1) * 0.9 : geo.focus;
    const lensMag = geo.magnify * st.mag;
    const cursorActive = lensMag > 0 && st.mag > 0.5 && geo.mode !== 'orbit';
    const wantsActive = cfg.focus > 0 || cfg.step || cursorActive;
    const needItems = geo.mode !== 'line' || lensFocus > 0 || lensMag > 0.0005 || introRunning;
    if (!needItems && st.itemMode) clearItems();
    st.itemMode = needItems;
    if (!needItems && !wantsActive) {
      if (st.active) {
        st.active.el.removeAttribute('data-active');
        st.active = null;
      }
      return;
    }
    let best: LoopItem | null = null;
    let bestDist = Infinity;
    for (const it of st.items) {
      const u = T + it.center - half;
      let x = u;
      let y = 0;
      let rot = 0;
      let scale = 1;
      let opacity = 1;
      let z = '';
      let hidden = false;
      let dist = Math.abs(u);
      if (geo.mode === 'orbit') {
        if (u < -geo.C / 2 || u >= geo.C / 2) {
          hidden = true;
        } else {
          const th = (2 * Math.PI * u) / geo.C;
          const Z = geo.R * Math.cos(th);
          const p = geo.depth / (geo.depth - Z * Math.cos(geo.alpha));
          x = geo.R * Math.sin(th) * p;
          y = Z * Math.sin(geo.alpha) * p - geo.shift;
          scale = p;
          if (lensFocus > 0) scale *= 1 + lensFocus * Math.exp(-((th / 0.55) ** 2));
          if (lensMag > 0) {
            const span = (geo.magSigma * 2 * Math.PI) / geo.C;
            scale *= 1 + lensMag * Math.max(0, Math.cos(th)) * Math.exp(-(((th - st.magU) / span) ** 2));
          }
          const facing = (Math.cos(th) + 1) / 2;
          opacity = 0.25 + 0.75 * facing * facing;
          z = String(Math.round(facing * 1000));
          dist = Math.cos(th) > 0 ? Math.abs(th) * geo.R : Infinity;
        }
      } else {
        let w = u;
        if (lensFocus > 0) {
          const kf = w / geo.focusSigma;
          scale *= 1 + lensFocus * Math.exp(-kf * kf);
          opacity *= 1 - 0.45 * lensFocus * (1 - Math.exp(-((u / (geo.focusSigma * 1.8)) ** 2)));
          w += lensFocus * geo.focusSigma * HALF_SQRT_PI * erf(kf);
        }
        const near = Math.abs(w - st.magU);
        if (lensMag > 0) {
          const km = (w - st.magU) / geo.magSigma;
          scale *= 1 + lensMag * Math.exp(-km * km);
          w += lensMag * geo.magSigma * HALF_SQRT_PI * erf(km);
        }
        x = w;
        if (geo.mode === 'wave') {
          y = geo.amp * Math.sin(geo.k * w);
          rot = (Math.atan(geo.amp * geo.k * Math.cos(geo.k * w)) * 90) / Math.PI;
        } else if (geo.mode === 'arc' && geo.R) {
          const phi = w / geo.R;
          if (Math.abs(phi) > geo.limit) hidden = true;
          x = geo.R * Math.sin(phi);
          y = geo.sign * (geo.R * (1 - Math.cos(phi)) - geo.shift);
          rot = (geo.sign * phi * 180) / Math.PI;
        }
        dist = cursorActive ? near : Math.abs(x);
      }
      if (introRunning && !hidden) {
        const pos = clamp((x + half) / Math.max(1, L), 0, 1);
        const e = easeOut(clamp((elapsed - pos * INTRO_STAGGER) / INTRO_TIME, 0, 1));
        opacity *= e;
        y += (1 - e) * 14;
      }
      if (wantsActive && !hidden && dist < bestDist) {
        bestDist = dist;
        best = it;
      }
      if (!needItems) continue;
      const along = x - u;
      const t = hidden
        ? ''
        : `${cfg.vertical ? `translate3d(${y.toFixed(2)}px, ${along.toFixed(2)}px, 0px)` : `translate3d(${along.toFixed(2)}px, ${y.toFixed(2)}px, 0px)`}${
            rot ? ` rotate(${(cfg.vertical ? -rot : rot).toFixed(2)}deg)` : ''
          }`;
      write(it, 't', 'transform', t, it.el);
      write(it, 'o', 'opacity', hidden ? '0' : opacity > 0.999 ? '' : opacity.toFixed(3), it.el);
      write(it, 'v', 'visibility', hidden ? 'hidden' : '', it.el);
      write(it, 'z', 'zIndex', z, it.el);
      if (it.content)
        write(it, 's', 'transform', Math.abs(scale - 1) < 0.0005 ? '' : `scale(${scale.toFixed(4)})`, it.content);
      if (it.tip) {
        const lift = ((scale - 1) * it.cross) / 2;
        write(
          it,
          'p',
          'transform',
          Math.abs(lift) < 0.05
            ? ''
            : cfg.vertical
              ? `translateX(${lift.toFixed(2)}px)`
              : `translateY(${lift.toFixed(2)}px)`,
          it.tip
        );
      }
    }
    const active = best && bestDist < Math.max(best.size, st.pitch) / 2 + 1 ? best : null;
    if (active !== st.active) {
      st.active?.el.removeAttribute('data-active');
      active?.el.setAttribute('data-active', '');
      st.active = active;
    }
  };

  const frame = (now: number) => {
    st.raf = 0;
    if (st.destroyed || !st.geo || st.period <= 0) return;
    const cfg = config.current;
    const dt = st.last ? clamp((now - st.last) / 1000, 0, 0.1) : 0;
    st.last = now;
    const P = st.period;
    let busy = false;
    if (st.introStart === -1 && !st.introDone && st.visible) {
      if (cfg.intro && !st.reduced) {
        st.introStart = now;
      } else {
        st.introDone = true;
      }
      root.removeAttribute('data-intro');
    }
    if (st.introStart >= 0) {
      if ((now - st.introStart) / 1000 >= INTRO_TIME + INTRO_STAGGER) {
        st.introStart = -2;
        st.introDone = true;
      } else {
        busy = true;
      }
    }
    const travel = Math.sign(cfg.speed) || 1;
    const paused = st.focused || (st.hovered && cfg.hoverValue !== undefined);
    const pausedSpeed = st.focused ? 0 : (cfg.hoverValue ?? 0);
    let target = st.reduced ? 0 : paused ? pausedSpeed * travel * cfg.dirSign : cfg.speed * cfg.dirSign;
    if (cfg.scrollBoost > 0 && !st.reduced) {
      st.scrollVel *= Math.exp(-dt / 0.18);
      if (Math.abs(st.scrollVel) > 1) busy = true;
      target += clamp(st.scrollVel * cfg.scrollBoost, -3000, 3000) * travel * cfg.dirSign;
    }
    if (st.drag?.active) {
      busy = true;
    } else if (st.seek) {
      st.seek.t = Math.min(1, st.seek.t + dt / st.seek.dur);
      st.offset = st.seek.from + st.seek.delta * easeInOut(st.seek.t);
      st.velocity = 0;
      if (st.seek.t >= 1) st.seek = null;
      busy = true;
    } else if (st.move) {
      st.move.t = Math.min(1, st.move.t + dt / st.move.dur);
      st.offset = st.move.from + st.move.delta * easeInOut(st.move.t);
      st.velocity = 0;
      busy = true;
      if (st.move.t >= 1) {
        st.move = null;
        st.hold = stepTiming(paused ? pausedSpeed : cfg.speed).hold;
      }
    } else if (cfg.step && !st.reduced) {
      const speed = paused ? pausedSpeed : cfg.speed;
      st.velocity = 0;
      if (speed) {
        busy = true;
        st.hold -= dt;
        if (st.hold <= 0) {
          const dir = Math.sign(speed) * cfg.dirSign;
          startMove(snapTarget(st.offset, dir), stepTiming(speed).move);
        }
      }
    } else {
      const tau = st.glide ? GLIDE_TAU : SMOOTH_TAU;
      st.velocity += (target - st.velocity) * (1 - Math.exp(-dt / tau));
      if (st.glide && Math.abs(st.velocity - target) < 2) st.glide = false;
      if (Math.abs(st.velocity - target) < 0.01) st.velocity = target;
      st.offset += st.velocity * dt;
      if (st.velocity !== 0 || target !== 0) busy = true;
    }
    if (!st.focused && !st.seek && !st.drag?.active) {
      const wrapped = ((st.offset % P) + P) % P;
      if (st.move) st.move.from += wrapped - st.offset;
      st.offset = wrapped;
    }
    const wantMag = cfg.magnify > 0 && st.pointerInside && !st.reduced ? 1 : 0;
    if (st.mag !== wantMag) {
      st.mag += (wantMag - st.mag) * (1 - Math.exp(-dt / (wantMag ? 0.12 : 0.25)));
      if (Math.abs(wantMag - st.mag) < 0.002) st.mag = wantMag;
      busy = true;
    }
    const pu = st.mag > 0 ? pointerU() : null;
    if (pu !== null) {
      if (!st.magReady) {
        st.magU = pu;
        st.magReady = true;
      }
      const next = st.magU + (pu - st.magU) * (1 - Math.exp(-dt / 0.06));
      if (Math.abs(next - pu) > 0.05) busy = true;
      st.magU = Math.abs(next - pu) > 0.05 ? next : pu;
    } else if (st.mag === 0) {
      st.magReady = false;
    }
    render(now);
    if (busy && st.visible && !st.destroyed) st.raf = requestAnimationFrame(frame);
  };

  const wake = () => {
    if (st.raf || st.destroyed || !st.visible) return;
    st.last = 0;
    st.raf = requestAnimationFrame(frame);
  };

  const local = (e: PointerEvent): [number, number] => {
    const r = root.getBoundingClientRect();
    const k = root.offsetWidth ? r.width / root.offsetWidth || 1 : 1;
    return [(e.clientX - r.left) / k, (e.clientY - r.top) / k];
  };

  const dragScale = () => {
    const geo = st.geo;
    if (!geo) return 1;
    if (geo.mode === 'orbit') return geo.C / (2 * Math.PI * geo.R * geo.pf);
    const pu = pointerU();
    if (pu === null || geo.focus <= 0) return 1;
    const kf = pu / geo.focusSigma;
    return 1 / (1 + geo.focus * Math.exp(-kf * kf));
  };

  const onEnter = (e: PointerEvent) => {
    st.hovered = true;
    if (e.pointerType !== 'touch') {
      st.pointerInside = true;
      st.pointer = local(e);
    }
    wake();
  };

  const onLeave = () => {
    st.hovered = false;
    st.pointerInside = false;
    wake();
  };

  const onDown = (e: PointerEvent) => {
    st.pressedAt = performance.now();
    if (!config.current.draggable || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const [x, y] = local(e);
    if (e.pointerType !== 'touch') st.pointer = [x, y];
    st.drag = { id: e.pointerId, x, y, active: false, samples: [], scale: dragScale(), anchor: 0, offset: 0 };
  };

  const onMove = (e: PointerEvent) => {
    const cfg = config.current;
    if (e.pointerType !== 'touch') {
      st.pointer = local(e);
      st.pointerInside = true;
    }
    const d = st.drag;
    if (d && e.pointerId === d.id) {
      const [x, y] = local(e);
      const along = cfg.vertical ? y - d.y : x - d.x;
      const across = cfg.vertical ? x - d.x : y - d.y;
      if (!d.active) {
        if (Math.abs(along) < DRAG_THRESHOLD) return wake();
        if (Math.abs(across) > Math.abs(along)) {
          st.drag = null;
          return wake();
        }
        d.active = true;
        d.anchor = along;
        d.offset = st.offset;
        st.move = null;
        st.seek = null;
        st.glide = false;
        st.velocity = 0;
        try {
          root.setPointerCapture(e.pointerId);
        } catch {}
        root.setAttribute('data-dragging', '');
      }
      const next = d.offset - (along - d.anchor) * d.scale;
      const P = st.period || 1;
      st.offset = ((next % P) + P) % P;
      d.offset += st.offset - next;
      const now = performance.now();
      d.samples.push([now, along]);
      while (d.samples.length > 2 && now - d.samples[0][0] > 100) d.samples.shift();
    }
    wake();
  };

  const endDrag = (e: PointerEvent, cancelled: boolean) => {
    const d = st.drag;
    if (!d || e.pointerId !== d.id) return;
    st.drag = null;
    if (!d.active) return;
    root.removeAttribute('data-dragging');
    try {
      root.releasePointerCapture(e.pointerId);
    } catch {}
    const cfg = config.current;
    const now = performance.now();
    st.suppressUntil = now + 400;
    let v = 0;
    const s = d.samples;
    if (!cancelled && s.length > 1) {
      const [t0, a0] = s[0];
      const [t1, a1] = s[s.length - 1];
      if (t1 > t0 && now - t1 < 80) v = clamp((-(a1 - a0) / (t1 - t0)) * 1000 * d.scale, -MAX_FLING, MAX_FLING);
    }
    if (cfg.step && !st.reduced) {
      const target = nearestSnap(st.offset + v * 0.35);
      startMove(target, clamp(0.3 + Math.abs(target - st.offset) / 1800, 0.3, 0.8));
      st.velocity = 0;
    } else {
      st.velocity = v;
      st.glide = Math.abs(v) > 30;
    }
    wake();
  };

  const onUp = (e: PointerEvent) => endDrag(e, false);
  const onCancel = (e: PointerEvent) => endDrag(e, true);

  const onClick = (e: MouseEvent) => {
    if (performance.now() < st.suppressUntil) {
      e.preventDefault();
      e.stopPropagation();
      st.suppressUntil = 0;
    }
  };

  const onDragStart = (e: DragEvent) => {
    if (config.current.draggable) e.preventDefault();
  };

  const onFocusIn = (e: FocusEvent) => {
    const target = e.target as Node | null;
    if (performance.now() - st.pressedAt < 800) return;
    st.focused = true;
    const it = st.items.find(item => item.el.contains(target));
    if (it && st.geo) {
      const u = -st.offset - st.geo.lead + it.center - st.length / 2;
      const comfortable = st.geo.mode === 'orbit' ? 1 : Math.max(0, st.length / 2 - it.size);
      if (Math.abs(u) > comfortable) {
        st.move = null;
        st.seek = { from: st.offset, delta: u, t: 0, dur: clamp(0.35 + Math.abs(u) / 2000, 0.35, 0.8) };
      }
    }
    wake();
  };

  const onFocusOut = (e: FocusEvent) => {
    if (root.contains(e.relatedTarget as Node | null)) return;
    st.focused = false;
    wake();
  };

  const onRootScroll = () => {
    if (root.scrollLeft || root.scrollTop) {
      root.scrollLeft = 0;
      root.scrollTop = 0;
    }
  };

  const onScroll = () => {
    const now = performance.now();
    const y = window.scrollY;
    if (st.scrollT && now > st.scrollT) {
      const v = ((y - st.scrollY) / (now - st.scrollT)) * 1000;
      st.scrollVel += (clamp(v, -6000, 6000) - st.scrollVel) * 0.5;
    }
    st.scrollY = y;
    st.scrollT = now;
    if (config.current.scrollBoost > 0) wake();
  };

  const onMotion = () => {
    st.reduced = !!query?.matches;
    wake();
  };

  root.addEventListener('pointerenter', onEnter);
  root.addEventListener('pointerleave', onLeave);
  root.addEventListener('pointerdown', onDown);
  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerup', onUp);
  root.addEventListener('pointercancel', onCancel);
  root.addEventListener('lostpointercapture', onCancel);
  root.addEventListener('click', onClick, true);
  root.addEventListener('dragstart', onDragStart);
  root.addEventListener('focusin', onFocusIn);
  root.addEventListener('focusout', onFocusOut);
  root.addEventListener('scroll', onRootScroll);
  window.addEventListener('scroll', onScroll, { passive: true });
  query?.addEventListener?.('change', onMotion);

  let resizeObserver: ResizeObserver | null = null;
  const observed = new Set<Element>();
  const refresh = () => {
    collect();
    measure();
    if (resizeObserver) {
      const first = track.children[0];
      for (const el of [root, first]) {
        if (el && !observed.has(el)) {
          resizeObserver.observe(el);
          observed.add(el);
        }
      }
    }
    st.last = 0;
    if (st.raf) cancelAnimationFrame(st.raf);
    st.raf = 0;
    if (st.geo && st.period > 0) frame(performance.now());
  };

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      measure();
      if (st.geo && st.period > 0) render(performance.now());
      wake();
    });
  } else {
    window.addEventListener('resize', refresh);
  }

  let intersection: IntersectionObserver | null = null;
  if (typeof IntersectionObserver !== 'undefined') {
    intersection = new IntersectionObserver(
      entries => {
        const entry = entries[entries.length - 1];
        st.visible = entry.isIntersecting;
        if (st.visible) wake();
      },
      { threshold: 0.1 }
    );
    intersection.observe(root);
  }

  const onVisibility = () => {
    if (!document.hidden) wake();
  };
  document.addEventListener('visibilitychange', onVisibility);

  const destroy = () => {
    st.destroyed = true;
    if (st.raf) cancelAnimationFrame(st.raf);
    root.removeEventListener('pointerenter', onEnter);
    root.removeEventListener('pointerleave', onLeave);
    root.removeEventListener('pointerdown', onDown);
    root.removeEventListener('pointermove', onMove);
    root.removeEventListener('pointerup', onUp);
    root.removeEventListener('pointercancel', onCancel);
    root.removeEventListener('lostpointercapture', onCancel);
    root.removeEventListener('click', onClick, true);
    root.removeEventListener('dragstart', onDragStart);
    root.removeEventListener('focusin', onFocusIn);
    root.removeEventListener('focusout', onFocusOut);
    root.removeEventListener('scroll', onRootScroll);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', refresh);
    document.removeEventListener('visibilitychange', onVisibility);
    query?.removeEventListener?.('change', onMotion);
    resizeObserver?.disconnect();
    intersection?.disconnect();
  };

  return { refresh, wake, destroy, state: st };
};

export const LogoLoop = memo<LogoLoopProps>(
  ({
    logos,
    speed = 120,
    direction = 'left',
    width = '100%',
    logoHeight = 28,
    gap = 32,
    pauseOnHover,
    hoverSpeed,
    fadeOut = true,
    fadeOutWidth = 0.12,
    scaleOnHover = false,
    layout = 'line',
    bend = 0.5,
    focus = 0,
    magnify = 0,
    tiltX = 0,
    tiltY = 0,
    step = false,
    muted = 0,
    labels = 'none',
    draggable = true,
    scrollBoost = 0,
    intro = true,
    renderItem,
    ariaLabel = 'Partner logos',
    className,
    style
  }) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<ReturnType<typeof createEngine> | null>(null);
    const [{ copies, primary }, setLayout] = useState<LoopLayout>({ copies: 3, primary: 1 });
    const [introPending] = useState(intro);

    const vertical = direction === 'up' || direction === 'down';
    const config = useRef<LoopConfig>({} as LoopConfig);
    config.current = {
      speed,
      dirSign: (vertical ? direction === 'up' : direction !== 'right') ? 1 : -1,
      hoverValue: hoverSpeed !== undefined ? hoverSpeed : pauseOnHover === false ? undefined : 0,
      vertical,
      layout,
      bend,
      focus,
      magnify,
      tiltX,
      tiltY,
      step,
      draggable,
      scrollBoost,
      intro,
      scaleOnHover,
      labels,
      links: logos.some(item => item.href)
    };

    useIsomorphicLayoutEffect(() => {
      const engine = createEngine(
        rootRef.current as HTMLDivElement,
        trackRef.current as HTMLDivElement,
        config,
        setLayout
      );
      engineRef.current = engine;
      return () => {
        engine.destroy();
        engineRef.current = null;
      };
    }, []);

    useIsomorphicLayoutEffect(() => {
      engineRef.current?.refresh();
    }, [
      copies,
      primary,
      logos,
      vertical,
      logoHeight,
      gap,
      labels,
      layout,
      bend,
      focus,
      magnify,
      tiltX,
      tiltY,
      scaleOnHover
    ]);

    useEffect(() => {
      engineRef.current?.wake();
    });

    const lists = useMemo(
      () =>
        Array.from({ length: copies }, (_, copyIndex) => {
          const isPrimary = copyIndex === primary;
          return (
            <ul className="logoloop__list" key={copyIndex} role="list" aria-hidden={isPrimary ? undefined : true}>
              {logos.map((item, itemIndex) => {
                const key = `${copyIndex}-${itemIndex}`;
                const isNode = 'node' in item;
                const visual = renderItem ? (
                  renderItem(item, key)
                ) : isNode ? (
                  <span className="logoloop__node" aria-hidden={!!item.href && !item.ariaLabel}>
                    {item.node}
                  </span>
                ) : (
                  <img
                    src={item.src}
                    srcSet={item.srcSet}
                    sizes={item.sizes}
                    width={item.width}
                    height={item.height}
                    alt={item.alt ?? ''}
                    title={item.title}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                );
                const text = (labels === 'inline' || labels === 'below') && item.title ? item.title : null;
                const inner = (
                  <>
                    {visual}
                    {text && (
                      <span className="logoloop__label" aria-hidden={!isNode && !!item.alt}>
                        {text}
                      </span>
                    )}
                  </>
                );
                const name = isNode ? (item.ariaLabel ?? item.title) : (item.alt ?? item.title);
                return (
                  <li
                    className="logoloop__item"
                    key={key}
                    role="listitem"
                    data-color={item.hoverColor ? '' : undefined}
                    style={
                      item.hoverColor
                        ? ({ '--logoloop-item-color': item.hoverColor } as React.CSSProperties)
                        : undefined
                    }
                  >
                    {item.href ? (
                      <a
                        className="logoloop__content"
                        href={item.href}
                        aria-label={name || 'logo link'}
                        target="_blank"
                        rel="noreferrer noopener"
                        draggable={false}
                        tabIndex={isPrimary ? undefined : -1}
                      >
                        {inner}
                      </a>
                    ) : (
                      <div className="logoloop__content">{inner}</div>
                    )}
                    {labels === 'hover' && item.title && (
                      <span className="logoloop__tip" aria-hidden="true">
                        {item.title}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          );
        }),
      [copies, primary, logos, renderItem, labels]
    );

    const mask = fadeOut ? fadeMask(fadeOutWidth, vertical) : undefined;
    const amount = clamp(muted, 0, 1);

    const containerStyle = {
      width: vertical
        ? toCssLength(width) === '100%'
          ? undefined
          : toCssLength(width)
        : (toCssLength(width) ?? '100%'),
      '--logoloop-gap': `${gap}px`,
      '--logoloop-logoHeight': `${logoHeight}px`,
      ...(amount > 0 && {
        '--logoloop-gray': Math.min(1, amount * 2).toFixed(3),
        '--logoloop-dim': (1 - amount * 0.6).toFixed(3)
      }),
      ...(mask && { WebkitMaskImage: mask, maskImage: mask }),
      ...style
    } as React.CSSProperties;

    const rootClassName = [
      'logoloop',
      vertical ? 'logoloop--vertical' : 'logoloop--horizontal',
      scaleOnHover && 'logoloop--scale-hover',
      className
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        ref={rootRef}
        className={rootClassName}
        style={containerStyle}
        role="region"
        aria-label={ariaLabel}
        data-intro={introPending ? '' : undefined}
        data-draggable={draggable ? '' : undefined}
        data-muted={amount > 0 ? '' : undefined}
        data-labels={labels !== 'none' ? labels : undefined}
      >
        <div className="logoloop__track" ref={trackRef}>
          {lists}
        </div>
      </div>
    );
  }
);

LogoLoop.displayName = 'LogoLoop';

export default LogoLoop;
