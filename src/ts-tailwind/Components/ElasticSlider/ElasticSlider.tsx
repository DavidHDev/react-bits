'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode
} from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { VolumeHighIcon, VolumeLowIcon } from '@hugeicons/core-free-icons';

export interface ElasticSliderProps {
  value?: number;
  defaultValue?: number;
  startingValue?: number;
  maxValue?: number;
  isStepped?: boolean;
  stepSize?: number;
  onChange?: (value: number) => void;
  onChangeEnd?: (value: number) => void;
  orientation?: 'horizontal' | 'vertical';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  iconPlacement?: 'outside' | 'inside';
  valuePosition?: 'top' | 'bubble' | 'inside' | 'none';
  formatValue?: (value: number) => string;
  ticks?: boolean | number[];
  thumb?: boolean;
  fillFrom?: number;
  thickness?: number;
  activeThickness?: number;
  radius?: number;
  restOpacity?: number;
  growOnHover?: boolean;
  maxStretch?: number;
  bounce?: number;
  jumpToClick?: boolean;
  wheel?: boolean;
  trackColor?: string;
  rangeColor?: string;
  iconColor?: string;
  contentColor?: string;
  fillContentColor?: string;
  thumbColor?: string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}

interface Motion {
  p: number;
  vp: number;
  target: number;
  s: number;
  vs: number;
  side: number;
  held: boolean;
  a: number;
  va: number;
  goal: number;
  length: number;
  dragging: boolean;
  hovered: boolean;
  focused: boolean;
  raf: number;
  last: number;
  ready: boolean;
}

interface Drag {
  id: number;
  origin: number;
  from: number | null;
}

const ROOT =
  'group/es flex w-48 touch-none flex-col items-center gap-2 text-inherit select-none [-webkit-tap-highlight-color:transparent] data-[disabled]:pointer-events-none data-[disabled]:opacity-45 data-[orientation=vertical]:h-48 data-[orientation=vertical]:w-auto';
const VALUE = 'text-xs leading-none font-medium tabular-nums opacity-60';
const BODY =
  'flex min-h-0 w-full flex-1 items-center gap-3 group-data-[orientation=vertical]/es:h-full group-data-[orientation=vertical]/es:w-auto group-data-[orientation=vertical]/es:flex-col-reverse';
const ICON =
  'grid shrink-0 place-items-center text-[color:var(--elastic-slider-icon,currentColor)] will-change-transform';
const ICON_INNER = 'grid place-items-center';
const HIT =
  'group/hit relative flex h-[var(--elastic-slider-hit,34px)] min-w-0 flex-1 cursor-grab touch-none items-center outline-none data-[dragging]:cursor-grabbing group-data-[orientation=vertical]/es:h-auto group-data-[orientation=vertical]/es:min-h-0 group-data-[orientation=vertical]/es:w-[var(--elastic-slider-hit,34px)] group-data-[orientation=vertical]/es:flex-col group-data-[orientation=vertical]/es:justify-end';
const TRACK =
  'relative h-1.5 w-full shrink-0 overflow-hidden rounded-[var(--elastic-slider-radius,999px)] [background:var(--elastic-slider-track)] will-change-transform group-focus-visible/hit:outline-2 group-focus-visible/hit:outline-offset-3 group-focus-visible/hit:outline-current group-data-[orientation=vertical]/es:h-full group-data-[orientation=vertical]/es:w-1.5';
const RANGE = 'absolute inset-0 [background:var(--elastic-slider-range)] [clip-path:inset(0_100%_0_0)]';
const CONTENT =
  'pointer-events-none absolute inset-0 flex items-center justify-between px-[var(--elastic-slider-pad,12px)] text-[13px] leading-none font-semibold tabular-nums opacity-[var(--elastic-slider-reveal,1)] *:grid *:place-items-center *:[transform:var(--elastic-slider-unscale,none)] group-data-[orientation=vertical]/es:flex-col-reverse group-data-[orientation=vertical]/es:px-0 group-data-[orientation=vertical]/es:py-[var(--elastic-slider-pad,12px)] text-[color:var(--elastic-slider-content)]';
const FILL_CONTENT =
  'pointer-events-none absolute inset-0 flex items-center justify-between px-[var(--elastic-slider-pad,12px)] text-[13px] leading-none font-semibold tabular-nums opacity-[var(--elastic-slider-reveal,1)] *:grid *:place-items-center *:[transform:var(--elastic-slider-unscale,none)] group-data-[orientation=vertical]/es:flex-col-reverse group-data-[orientation=vertical]/es:px-0 group-data-[orientation=vertical]/es:py-[var(--elastic-slider-pad,12px)] text-[color:var(--elastic-slider-fill-content)]';
const TICK =
  'absolute top-1/2 -mt-[1.5px] -ml-[1.5px] size-[3px] rounded-full group-data-[orientation=vertical]/es:top-auto group-data-[orientation=vertical]/es:left-1/2 group-data-[orientation=vertical]/es:mt-0 group-data-[orientation=vertical]/es:-mb-[1.5px] [background:var(--elastic-slider-content)] opacity-40';
const FILL_TICK =
  'absolute top-1/2 -mt-[1.5px] -ml-[1.5px] size-[3px] rounded-full group-data-[orientation=vertical]/es:top-auto group-data-[orientation=vertical]/es:left-1/2 group-data-[orientation=vertical]/es:mt-0 group-data-[orientation=vertical]/es:-mb-[1.5px] [background:var(--elastic-slider-fill-content)] opacity-50';
const THUMB =
  'pointer-events-none absolute top-1/2 left-0 mt-[calc(var(--elastic-slider-thumb-size,18px)/-2)] ml-[calc(var(--elastic-slider-thumb-size,18px)/-2)] size-[var(--elastic-slider-thumb-size,18px)] rounded-full [background:var(--elastic-slider-thumb,#ffffff)] shadow-[0_1px_4px_rgba(0,0,0,0.28),0_0_0_0.5px_rgba(0,0,0,0.12)] will-change-transform group-data-[orientation=vertical]/es:top-auto group-data-[orientation=vertical]/es:bottom-0 group-data-[orientation=vertical]/es:left-1/2 group-data-[orientation=vertical]/es:mt-0 group-data-[orientation=vertical]/es:mb-[calc(var(--elastic-slider-thumb-size,18px)/-2)]';
const BUBBLE =
  'pointer-events-none absolute bottom-[calc(50%+var(--elastic-slider-bubble-offset,14px))] left-0 origin-bottom rounded-lg px-2 py-[5px] text-xs leading-[1.2] font-semibold whitespace-nowrap tabular-nums opacity-0 [background:var(--elastic-slider-range)] will-change-[transform,opacity] group-data-[orientation=vertical]/es:bottom-0 group-data-[orientation=vertical]/es:left-[calc(50%+var(--elastic-slider-bubble-offset,14px))] group-data-[orientation=vertical]/es:origin-left';
const BUBBLE_TEXT = 'text-[color:var(--elastic-slider-fill-content)]';

const TAU = Math.PI * 2;
const VALUE_POSITIONS = ['top', 'bubble', 'inside', 'none'];
const DARK_INK = 'rgba(18, 15, 23, 0.86)';
const LIGHT_INK = 'rgba(255, 255, 255, 0.94)';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const decimalsOf = (step: number) => {
  const text = String(step);
  return text.includes('.') ? text.split('.')[1].length : 0;
};

const rubber = (distance: number, limit: number) =>
  limit > 0 ? 2 * (1 / (1 + Math.exp(-distance / limit)) - 0.5) * limit : 0;

const prefersReduced = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

let probe: CanvasRenderingContext2D | null = null;

const readColor = (text: string): number[] | null => {
  const match = /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)$/.exec(text);
  if (match)
    return [Number(match[1]), Number(match[2]), Number(match[3]), match[4] === undefined ? 1 : Number(match[4])];
  if (typeof document === 'undefined') return null;
  if (!probe) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    probe = canvas.getContext('2d', { willReadFrequently: true });
  }
  if (!probe) return null;
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = '#000000';
  probe.fillStyle = text;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data;
  return [r, g, b, a / 255];
};

function ElasticSlider({
  value,
  defaultValue = 50,
  startingValue = 0,
  maxValue = 100,
  isStepped = false,
  stepSize = 1,
  onChange,
  onChangeEnd,
  orientation = 'horizontal',
  leftIcon = <HugeiconsIcon icon={VolumeLowIcon} size={20} strokeWidth={1.75} />,
  rightIcon = <HugeiconsIcon icon={VolumeHighIcon} size={20} strokeWidth={1.75} />,
  iconPlacement = 'outside',
  valuePosition = 'top',
  formatValue,
  ticks = false,
  thumb = false,
  fillFrom,
  thickness = 6,
  activeThickness = 12,
  radius,
  restOpacity = 0.7,
  growOnHover = true,
  maxStretch = 50,
  bounce = 0.5,
  jumpToClick = true,
  wheel = false,
  trackColor = 'color-mix(in srgb, currentColor 18%, transparent)',
  rangeColor = 'currentColor',
  iconColor = 'currentColor',
  contentColor = 'currentColor',
  fillContentColor = 'auto',
  thumbColor = '#ffffff',
  disabled = false,
  ariaLabel = 'Slider',
  className = '',
  style
}: ElasticSliderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hitRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const startIconRef = useRef<HTMLSpanElement>(null);
  const endIconRef = useRef<HTMLSpanElement>(null);
  const motion = useRef<Motion>({
    p: 0,
    vp: 0,
    target: 0,
    s: 0,
    vs: 0,
    side: 1,
    held: false,
    a: 0,
    va: 0,
    goal: 0,
    length: 0,
    dragging: false,
    hovered: false,
    focused: false,
    raf: 0,
    last: 0,
    ready: false
  });
  const drag = useRef<Drag | null>(null);

  const lo = Math.min(startingValue, maxValue);
  const hi = Math.max(startingValue, maxValue);
  const span = hi - lo || 1;
  const step = isStepped && stepSize > 0 ? stepSize : 0;
  const vertical = orientation === 'vertical';
  const controlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue);
  const current = clamp(controlled ? value : inner, lo, hi);
  const currentRef = useRef(current);

  const settings = {
    lo,
    hi,
    span,
    step,
    vertical,
    origin: clamp(((fillFrom ?? lo) - lo) / span, 0, 1),
    thickness: Math.max(1, thickness),
    activeThickness: Math.max(1, activeThickness),
    radius,
    restOpacity: clamp(restOpacity, 0, 1),
    growOnHover,
    maxStretch: Math.max(0, maxStretch),
    bounce: clamp(bounce, 0, 0.95),
    jumpToClick,
    controlled,
    onChange,
    onChangeEnd
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const snap = (raw: number) => {
    const s = settingsRef.current;
    let next = clamp(raw, s.lo, s.hi);
    if (s.step) next = clamp(s.lo + Math.round((next - s.lo) / s.step) * s.step, s.lo, s.hi);
    return Number(next.toFixed(10));
  };

  const paint = () => {
    const m = motion.current;
    const s = settingsRef.current;
    const track = trackRef.current;
    const range = rangeRef.current;
    if (!track || !range) return;
    const thick = s.thickness + (s.activeThickness - s.thickness) * m.a;
    track.style.width = s.vertical ? `${thick.toFixed(2)}px` : '';
    track.style.height = s.vertical ? '' : `${thick.toFixed(2)}px`;
    track.style.setProperty('--elastic-slider-reveal', clamp((thick - 14) / 10, 0, 1).toFixed(3));
    const length = Math.max(1, m.length);
    const along = 1 + m.s / length;
    const across = 1 - 0.22 * clamp(m.s / Math.max(1, s.maxStretch), -1, 1);
    const atEnd = m.side > 0;
    track.style.transformOrigin = s.vertical ? (atEnd ? '50% 100%' : '50% 0%') : atEnd ? '0% 50%' : '100% 50%';
    const scaleX = s.vertical ? across : along;
    const scaleY = s.vertical ? along : across;
    track.style.transform = `scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})`;
    track.style.setProperty(
      '--elastic-slider-unscale',
      `scale(${(1 / scaleX).toFixed(4)}, ${(1 / scaleY).toFixed(4)})`
    );
    const p = clamp(m.p, 0, 1);
    const from = (Math.min(s.origin, p) * 100).toFixed(3);
    const to = ((1 - Math.max(s.origin, p)) * 100).toFixed(3);
    const round = (s.radius ?? thick / 2).toFixed(2);
    range.style.clipPath = s.vertical
      ? `inset(${to}% 0 ${from}% 0 round ${round}px)`
      : `inset(0 ${to}% 0 ${from}% round ${round}px)`;
    const position = atEnd ? p * length * along : length - (1 - p) * length * along;
    const shift = s.vertical
      ? `translate3d(0, ${(-position).toFixed(2)}px, 0)`
      : `translate3d(${position.toFixed(2)}px, 0, 0)`;
    if (thumbRef.current) thumbRef.current.style.transform = `${shift} scale(${(1 + 0.12 * m.a).toFixed(3)})`;
    if (bubbleRef.current) {
      const center = s.vertical ? 'translate(0, 50%)' : 'translate(-50%, 0)';
      bubbleRef.current.style.transform = `${shift} ${center} scale(${(0.7 + 0.3 * m.a).toFixed(3)})`;
      bubbleRef.current.style.opacity = clamp(m.a * 1.4 - 0.2, 0, 1).toFixed(3);
    }
    const startShift = atEnd ? 0 : m.s;
    const endShift = atEnd ? m.s : 0;
    const iconScale = (1 + 0.08 * m.a).toFixed(3);
    if (startIconRef.current) {
      startIconRef.current.style.transform = s.vertical
        ? `translate3d(0, ${startShift.toFixed(2)}px, 0) scale(${iconScale})`
        : `translate3d(${(-startShift).toFixed(2)}px, 0, 0) scale(${iconScale})`;
    }
    if (endIconRef.current) {
      endIconRef.current.style.transform = s.vertical
        ? `translate3d(0, ${(-endShift).toFixed(2)}px, 0) scale(${iconScale})`
        : `translate3d(${endShift.toFixed(2)}px, 0, 0) scale(${iconScale})`;
    }
    if (bodyRef.current) {
      bodyRef.current.style.opacity = s.restOpacity < 1 ? (s.restOpacity + (1 - s.restOpacity) * m.a).toFixed(3) : '';
    }
  };

  const frame = (now: number) => {
    const m = motion.current;
    m.raf = 0;
    const s = settingsRef.current;
    const elapsed = clamp((now - m.last) / 1000, 0, 1 / 20);
    m.last = now;
    if (prefersReduced()) {
      m.p = m.target;
      m.vp = 0;
      if (!m.held) {
        m.s = 0;
        m.vs = 0;
      }
      m.a = m.goal;
      m.va = 0;
    } else {
      const steps = Math.max(1, Math.ceil(elapsed / (1 / 240)));
      const dt = elapsed / steps;
      const fillOmega = TAU / (m.dragging ? 0.09 : 0.3);
      const fillZeta = m.dragging ? 1 : 0.86;
      const stretchOmega = TAU / 0.42;
      const stretchZeta = 1 - 0.9 * s.bounce;
      const activeOmega = TAU / 0.32;
      for (let i = 0; i < steps; i++) {
        m.vp += (-fillOmega * fillOmega * (m.p - m.target) - 2 * fillZeta * fillOmega * m.vp) * dt;
        m.p += m.vp * dt;
        if (!m.held) {
          m.vs += (-stretchOmega * stretchOmega * m.s - 2 * stretchZeta * stretchOmega * m.vs) * dt;
          m.s += m.vs * dt;
        }
        m.va += (-activeOmega * activeOmega * (m.a - m.goal) - 2 * 0.9 * activeOmega * m.va) * dt;
        m.a += m.va * dt;
      }
    }
    const settled =
      Math.abs(m.p - m.target) < 0.0004 &&
      Math.abs(m.vp) < 0.002 &&
      (m.held || (Math.abs(m.s) < 0.05 && Math.abs(m.vs) < 0.5)) &&
      Math.abs(m.a - m.goal) < 0.002 &&
      Math.abs(m.va) < 0.005;
    if (settled) {
      m.p = m.target;
      m.vp = 0;
      m.a = m.goal;
      m.va = 0;
      if (!m.held) {
        m.s = 0;
        m.vs = 0;
      }
    }
    paint();
    if (!settled || m.dragging) m.raf = requestAnimationFrame(frame);
  };

  const kick = () => {
    const m = motion.current;
    if (m.raf || typeof window === 'undefined') return;
    m.last = performance.now();
    m.raf = requestAnimationFrame(frame);
  };

  const autoInk = () => {
    const root = rootRef.current;
    const range = rangeRef.current;
    if (!root || !range || fillContentColor !== 'auto') return;
    const color = readColor(getComputedStyle(range).backgroundColor);
    const ink =
      !color || color[3] < 0.5
        ? 'var(--elastic-slider-content)'
        : (0.2126 * color[0] + 0.7152 * color[1] + 0.0722 * color[2]) / 255 > 0.55
          ? DARK_INK
          : LIGHT_INK;
    root.style.setProperty('--elastic-slider-fill-content', ink);
  };

  const refreshGoal = () => {
    const m = motion.current;
    m.goal = (m.hovered && settingsRef.current.growOnHover) || m.dragging || m.focused ? 1 : 0;
    kick();
  };

  const pulse = (side: number) => {
    const icon = (side > 0 ? endIconRef : startIconRef).current?.firstElementChild;
    if (!icon || prefersReduced()) return;
    icon.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], {
      duration: 280,
      easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
    });
  };

  const bump = (side: number) => {
    const m = motion.current;
    const s = settingsRef.current;
    if (!s.maxStretch || m.held || Math.abs(m.vs) > 40 || Math.abs(m.s) > 2) return;
    m.side = side;
    m.vs = s.maxStretch * 5.5;
    pulse(side);
    kick();
  };

  const commit = (next: number) => {
    const s = settingsRef.current;
    motion.current.target = (next - s.lo) / s.span;
    kick();
    if (next === currentRef.current) return;
    currentRef.current = next;
    if (!s.controlled) setInner(next);
    s.onChange?.(next);
  };

  const snapRef = useRef(snap);
  snapRef.current = snap;
  const bumpRef = useRef(bump);
  bumpRef.current = bump;
  const commitRef = useRef(commit);
  commitRef.current = commit;
  const goalRef = useRef(refreshGoal);
  goalRef.current = refreshGoal;

  useIsoLayoutEffect(() => {
    const m = motion.current;
    currentRef.current = current;
    const fraction = (current - lo) / span;
    if (!m.dragging) m.target = fraction;
    if (!m.ready) {
      m.ready = true;
      m.p = fraction;
      paint();
      return;
    }
    kick();
  }, [current, lo, span]);

  useIsoLayoutEffect(() => {
    const hit = hitRef.current;
    if (!hit) return undefined;
    const measure = () => {
      motion.current.length = settingsRef.current.vertical ? hit.clientHeight : hit.clientWidth;
      paint();
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(hit);
    return () => observer.disconnect();
  }, [vertical]);

  useIsoLayoutEffect(() => {
    autoInk();
    paint();
  });

  useEffect(() => {
    goalRef.current();
  }, [growOnHover]);

  useEffect(() => {
    const hit = hitRef.current;
    if (!hit || !wheel || disabled) return undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const s = settingsRef.current;
      const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? -event.deltaY : event.deltaX;
      if (!delta) return;
      const amount = s.step ? Math.sign(delta) * s.step : (delta * s.span) / 800;
      const next = snapRef.current(currentRef.current + amount);
      if (next === currentRef.current) {
        bumpRef.current(Math.sign(delta));
        return;
      }
      commitRef.current(next);
      clearTimeout(timer);
      timer = setTimeout(() => settingsRef.current.onChangeEnd?.(currentRef.current), 200);
    };
    hit.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      clearTimeout(timer);
      hit.removeEventListener('wheel', onWheel);
    };
  }, [wheel, disabled]);

  useEffect(() => {
    const m = motion.current;
    return () => cancelAnimationFrame(m.raf);
  }, []);

  const along = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = hitRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return settingsRef.current.vertical ? rect.bottom - event.clientY : event.clientX - rect.left;
  };

  const follow = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const m = motion.current;
    const s = settingsRef.current;
    const length = Math.max(1, m.length);
    const position = along(event);
    const fraction = d.from === null ? position / length : d.from + (position - d.origin) / length;
    const over = fraction < 0 ? -fraction * length : fraction > 1 ? (fraction - 1) * length : 0;
    if (over > 0 && s.maxStretch > 0) {
      const side = fraction < 0 ? -1 : 1;
      if (!m.held || m.side !== side) pulse(side);
      m.held = true;
      m.side = side;
      m.s = rubber(over, s.maxStretch);
      m.vs = 0;
    } else if (m.held) {
      m.held = false;
    }
    commit(snap(s.lo + clamp(fraction, 0, 1) * s.span));
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const hit = hitRef.current;
    if (disabled || event.button !== 0 || !hit) return;
    hit.setPointerCapture(event.pointerId);
    const m = motion.current;
    const s = settingsRef.current;
    drag.current = {
      id: event.pointerId,
      origin: along(event),
      from: s.jumpToClick ? null : m.target
    };
    m.dragging = true;
    hit.setAttribute('data-dragging', '');
    refreshGoal();
    if (s.jumpToClick) commit(snap(s.lo + clamp(along(event) / Math.max(1, m.length), 0, 1) * s.span));
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current || drag.current.id !== event.pointerId) return;
    follow(event);
  };

  const release = () => {
    if (!drag.current) return;
    const m = motion.current;
    drag.current = null;
    m.dragging = false;
    m.held = false;
    hitRef.current?.removeAttribute('data-dragging');
    refreshGoal();
    settingsRef.current.onChangeEnd?.(currentRef.current);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const s = settingsRef.current;
    const unit = s.step || s.span / 100;
    const large = Math.max(unit, s.span / 10);
    const now = currentRef.current;
    const keys: Record<string, number> = {
      ArrowRight: now + unit,
      ArrowUp: now + unit,
      ArrowLeft: now - unit,
      ArrowDown: now - unit,
      PageUp: now + large,
      PageDown: now - large,
      Home: s.lo,
      End: s.hi
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    const wanted = keys[event.key];
    const next = snap(wanted);
    if (next === now) {
      if (wanted !== now) bump(wanted > now ? 1 : -1);
      return;
    }
    commit(next);
    s.onChangeEnd?.(next);
  };

  const label = formatValue
    ? formatValue(current)
    : step
      ? current.toFixed(decimalsOf(step))
      : String(Math.round(current));
  const place = VALUE_POSITIONS.includes(valuePosition) ? valuePosition : 'top';
  const inside = iconPlacement === 'inside';
  const insideStart = inside ? leftIcon : null;
  const insideEnd = place === 'inside' ? <span>{label}</span> : inside ? rightIcon : null;
  const count = step ? Math.round((hi - lo) / step) : 0;
  const tickValues = Array.isArray(ticks)
    ? ticks
    : ticks
      ? count > 0 && count <= 40
        ? Array.from({ length: count + 1 }, (_, index) => lo + index * step)
        : Array.from({ length: 11 }, (_, index) => lo + (index / 10) * (hi - lo))
      : [];
  const marks = tickValues.map(tick => (tick - lo) / span).filter(fraction => fraction > 0.001 && fraction < 0.999);
  const marksFor = (name: string) =>
    marks.map(fraction => (
      <span
        key={fraction}
        className={name}
        style={vertical ? { bottom: `${fraction * 100}%` } : { left: `${fraction * 100}%` }}
      />
    ));
  const contentFor = (name: string) =>
    insideStart || insideEnd ? (
      <span className={name}>
        <span>{insideStart}</span>
        <span>{insideEnd}</span>
      </span>
    ) : null;
  const thumbSize = clamp(activeThickness + 6, 16, 28);

  return (
    <div
      ref={rootRef}
      className={[ROOT, className].filter(Boolean).join(' ')}
      style={
        {
          '--elastic-slider-track': trackColor,
          '--elastic-slider-range': rangeColor,
          '--elastic-slider-icon': iconColor,
          '--elastic-slider-content': contentColor,
          ...(fillContentColor !== 'auto' ? { '--elastic-slider-fill-content': fillContentColor } : {}),
          '--elastic-slider-thumb': thumbColor,
          '--elastic-slider-thumb-size': `${thumbSize}px`,
          '--elastic-slider-hit': `${Math.max(34, thickness, activeThickness)}px`,
          '--elastic-slider-pad': `${Math.max(8, Math.round(thickness * 0.32))}px`,
          '--elastic-slider-bubble-offset': `${(thumb ? thumbSize * 1.12 : activeThickness) / 2 + 8}px`,
          ...(radius !== undefined ? { '--elastic-slider-radius': `${radius}px` } : {}),
          ...style
        } as CSSProperties
      }
      data-orientation={vertical ? 'vertical' : 'horizontal'}
      data-disabled={disabled ? '' : undefined}
      onPointerEnter={() => {
        motion.current.hovered = true;
        autoInk();
        refreshGoal();
      }}
      onPointerLeave={() => {
        motion.current.hovered = false;
        refreshGoal();
      }}
    >
      {place === 'top' && (
        <span className={VALUE} aria-hidden="true">
          {label}
        </span>
      )}
      <div className={BODY} ref={bodyRef}>
        {!inside && leftIcon && (
          <span className={ICON} ref={startIconRef} aria-hidden="true">
            <span className={ICON_INNER}>{leftIcon}</span>
          </span>
        )}
        <div
          ref={hitRef}
          className={HIT}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-label={ariaLabel}
          aria-valuemin={lo}
          aria-valuemax={hi}
          aria-valuenow={current}
          aria-valuetext={label}
          aria-orientation={vertical ? 'vertical' : 'horizontal'}
          aria-disabled={disabled || undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={release}
          onPointerCancel={release}
          onLostPointerCapture={release}
          onKeyDown={onKeyDown}
          onFocus={event => {
            motion.current.focused = event.currentTarget.matches(':focus-visible');
            refreshGoal();
          }}
          onBlur={() => {
            motion.current.focused = false;
            refreshGoal();
          }}
        >
          <div className={TRACK} ref={trackRef}>
            {marksFor(TICK)}
            {contentFor(CONTENT)}
            <div className={RANGE} ref={rangeRef}>
              {marksFor(FILL_TICK)}
              {contentFor(FILL_CONTENT)}
            </div>
          </div>
          {thumb && <span className={THUMB} ref={thumbRef} aria-hidden="true" />}
          {place === 'bubble' && (
            <span className={BUBBLE} ref={bubbleRef} aria-hidden="true">
              <span className={BUBBLE_TEXT}>{label}</span>
            </span>
          )}
        </div>
        {!inside && rightIcon && (
          <span className={ICON} ref={endIconRef} aria-hidden="true">
            <span className={ICON_INNER}>{rightIcon}</span>
          </span>
        )}
      </div>
    </div>
  );
}

export default ElasticSlider;
