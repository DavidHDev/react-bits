import React, { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  type AnimationPlaybackControls
} from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowUp02Icon } from '@hugeicons/core-free-icons';

export type SlingAxis = 'any' | 'horizontal' | 'vertical';

export interface SlingButtonProps {
  children?: ReactNode;
  onSend?: () => void;
  padColor?: string;
  iconColor?: string;
  accentColor?: string;
  wellColor?: string;
  bandColor?: string;
  size?: number;
  strokeWidth?: number;
  armAt?: number;
  maxPull?: number;
  launchSpeed?: number;
  recoil?: number;
  flight?: number;
  axis?: SlingAxis;
  tapSends?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

interface Sample {
  x: number;
  y: number;
  t: number;
}

interface Grip {
  id: number;
  startX: number;
  startY: number;
  scale: number;
  moved: boolean;
  hist: Sample[];
  rawOrigin: { x: number; y: number };
  slop: number;
}

const GAP = 4;
const SLOP = { fine: 4, coarse: 8 };
const FINGER_MAX = 3000;
const HAND_MAX = 6000;
const CANCEL = 0.5;
const POWER_CAP = 1.5;
const DOT_MS = 300;
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const rubberband = (o: number, dim: number, c = 0.55) => (o * dim * c) / (dim + c * Math.abs(o));

const SlingButton: React.FC<SlingButtonProps> = ({
  children,
  onSend,
  padColor = '#f5f5f5',
  iconColor = '#18181b',
  accentColor = '#f5f5f5',
  wellColor = '#27272a',
  bandColor = '#52525b',
  size = 56,
  strokeWidth = 3,
  armAt = 48,
  maxPull = 160,
  launchSpeed = 2600,
  recoil = 0.2,
  flight = 120,
  axis = 'any',
  tapSends = true,
  disabled = false,
  ariaLabel = 'Send',
  className = ''
}) => {
  const reduce = useReducedMotion();
  const R = maxPull;
  const ARM = Math.min(armAt, 0.8 * R);
  const wellR = size / 2 + GAP + strokeWidth;
  const arcR = wellR;
  const H = wellR + strokeWidth + 2;
  const DOT = Math.max(6, Math.round(size / 7));
  const [held, setHeld] = useState(false);
  const [armed, setArmed] = useState(false);
  const [sent, setSent] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const padRef = useRef<HTMLButtonElement>(null);
  const fxRef = useRef<SVGGElement>(null);
  const bandRef = useRef<SVGPathElement>(null);
  const hotRef = useRef<SVGPathElement>(null);
  const arcRef = useRef<SVGCircleElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const grip = useRef<Grip | null>(null);
  const dir = useRef({ ux: 0, uy: -1 });
  const animX = useRef<AnimationPlaybackControls | null>(null);
  const animY = useRef<AnimationPlaybackControls | null>(null);
  const armedRef = useRef(false);
  const dotPending = useRef(false);
  const dotTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const paintQueued = useRef(false);
  const skipClick = useRef(false);
  const hintId = useId();

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const padT = useMotionTemplate`translate(${px}px, ${py}px)`;

  const launchDot = () => {
    dotPending.current = false;
    clearTimeout(dotTimer.current);
    const dot = dotRef.current;
    if (!dot) return;
    const { ux, uy } = dir.current;
    relaxIcon();
    const from = wellR;
    const to = wellR + flight;
    dot.animate(
      [
        { transform: `translate(${-ux * from}px, ${-uy * from}px) scale(1)` },
        { transform: `translate(${-ux * to}px, ${-uy * to}px) scale(0.6)` }
      ],
      { duration: DOT_MS, easing: EASE_OUT, fill: 'none' }
    );
    dot.animate(
      [
        { opacity: 1, offset: 0 },
        { opacity: 1, offset: 0.6 },
        { opacity: 0, offset: 1 }
      ],
      {
        duration: DOT_MS,
        easing: 'linear',
        fill: 'none'
      }
    );
  };

  const aimIcon = (ux: number, uy: number, dist: number) => {
    const icon = iconRef.current;
    if (!icon) return;
    const angle = (Math.atan2(-uy, -ux) * 180) / Math.PI + 90;
    icon.style.transition = 'none';
    icon.style.transform = `rotate(${angle * clamp(dist / 12, 0, 1)}deg)`;
  };
  const relaxIcon = () => {
    const icon = iconRef.current;
    if (!icon) return;
    icon.style.transition = reduce ? 'none' : 'transform 360ms cubic-bezier(0.23, 1, 0.32, 1)';
    icon.style.transform = 'rotate(0deg)';
  };

  const paint = () => {
    paintQueued.current = false;
    const band = bandRef.current;
    const hot = hotRef.current;
    const arc = arcRef.current;
    const fx = fxRef.current;
    if (!band || !hot || !arc || !fx) return;
    const x = px.get();
    const y = py.get();
    const { ux, uy } = dir.current;
    const proj = x * ux + y * uy;
    const p = clamp(proj / ARM, 0, 1);
    const dist = Math.hypot(x, y);
    let d = '';
    if (dist > 0.5) {
      const a = Math.atan2(y, x);
      const b = Math.acos(clamp((wellR - size / 2) / dist, -1, 1));
      d = [a + b, a - b]
        .map(t => {
          const cx = Math.cos(t);
          const cy = Math.sin(t);
          return `M${(wellR * cx).toFixed(2)},${(wellR * cy).toFixed(2)}L${(x + (size / 2) * cx).toFixed(2)},${(y + (size / 2) * cy).toFixed(2)}`;
        })
        .join('');
    }
    const w = strokeWidth * (1 - 0.3 * p);
    band.setAttribute('d', d);
    hot.setAttribute('d', d);
    band.setAttribute('stroke-width', String(w));
    hot.setAttribute('stroke-width', String(w));
    hot.style.opacity = String(p);
    fx.style.opacity = String(clamp(proj / 6, 0, 1));
    arc.setAttribute('stroke-dasharray', `${p} ${1 - p}`);
    arc.setAttribute('stroke-dashoffset', String(p / 2));
    arc.style.opacity = p > 0.01 ? '1' : '0';
    if (grip.current) aimIcon(ux, uy, dist);
    arc.setAttribute('transform', `rotate(${(Math.atan2(-uy, -ux) * 180) / Math.PI})`);
    if (dotPending.current && proj <= size / 4) launchDot();
  };
  const schedulePaint = () => {
    if (paintQueued.current) return;
    paintQueued.current = true;
    requestAnimationFrame(paint);
  };
  useMotionValueEvent(px, 'change', schedulePaint);
  useMotionValueEvent(py, 'change', schedulePaint);
  useEffect(() => {
    animX.current?.stop();
    animY.current?.stop();
    px.jump(0);
    py.jump(0);
    paint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, strokeWidth, armAt, maxPull, axis]);

  const settle = (v0: { x: number; y: number }) => {
    if (reduce) {
      const fx = fxRef.current;
      if (fx) {
        fx.style.transition = 'opacity 200ms ease';
        fx.style.opacity = '0';
      }
      setTimeout(() => {
        px.jump(0);
        py.jump(0);
        if (fx) fx.style.transition = '';
      }, 200);
      return;
    }
    animX.current = animate(px, 0, { type: 'spring', duration: 0.4, bounce: recoil, velocity: v0.x });
    animY.current = animate(py, 0, { type: 'spring', duration: 0.4, bounce: recoil, velocity: v0.y });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled || grip.current || e.button !== 0) return;
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const scale = rect.width / (el.offsetWidth || rect.width) || 1;
    animX.current?.stop();
    animY.current?.stop();
    const x = px.get();
    const y = py.get();
    const dNow = Math.hypot(x, y);
    const dClamped = Math.min(dNow, 0.95 * R);
    const rawNow = dNow > 0.5 ? (R * dClamped) / (R - dClamped) : 0;
    grip.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      scale,
      moved: false,
      hist: [],
      rawOrigin: dNow > 0.5 ? { x: (rawNow * x) / dNow, y: (rawNow * y) / dNow } : { x: 0, y: 0 },
      slop: e.pointerType === 'touch' ? SLOP.coarse : SLOP.fine
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setHeld(true);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const g = grip.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = (e.clientX - g.startX) / g.scale;
    const dy = (e.clientY - g.startY) / g.scale;
    let rx = g.rawOrigin.x + dx;
    let ry = g.rawOrigin.y + dy;
    if (axis === 'horizontal') ry = rubberband(ry, size / 4);
    else if (axis === 'vertical') rx = rubberband(rx, size / 4);
    if (!g.moved && Math.hypot(dx, dy) > g.slop) g.moved = true;
    const raw = Math.hypot(rx, ry);
    if (raw < 0.01) return;
    const d = (R * raw) / (R + raw);
    const ux = rx / raw;
    const uy = ry / raw;
    dir.current = { ux, uy };
    px.set(d * ux);
    py.set(d * uy);
    const t = performance.now();
    g.hist.push({ x: d * ux, y: d * uy, t });
    while (g.hist.length > 4 || t - g.hist[0].t > 80) g.hist.shift();
    const isArmed = d >= ARM;
    if (isArmed !== armedRef.current) {
      armedRef.current = isArmed;
      setArmed(isArmed);
    }
  };
  const release = (pointerId: number, cancelled: boolean) => {
    const g = grip.current;
    if (!g || g.id !== pointerId) return;
    grip.current = null;
    skipClick.current = true;
    try {
      padRef.current?.releasePointerCapture(pointerId);
    } catch {}
    const d = Math.hypot(px.get(), py.get());
    const p = d / ARM;
    const { ux, uy } = dir.current;
    let vx = 0;
    let vy = 0;
    if (!cancelled && g.hist.length > 1) {
      const a = g.hist[0];
      const b = g.hist[g.hist.length - 1];
      const dt = b.t - a.t;
      if (dt > 0 && performance.now() - b.t < 50) {
        vx = ((b.x - a.x) / dt) * 1000;
        vy = ((b.y - a.y) / dt) * 1000;
      }
    }
    const fm = Math.hypot(vx, vy);
    if (fm > FINGER_MAX) {
      vx *= FINGER_MAX / fm;
      vy *= FINGER_MAX / fm;
    }
    if (!g.moved) {
      relaxIcon();
      if (tapSends && !cancelled) onSend?.();
    } else {
      const fire = armedRef.current && !cancelled;
      const launch = fire ? launchSpeed * Math.min(p, POWER_CAP) : CANCEL * launchSpeed * Math.min(p, 1);
      let v0x = vx - ux * launch;
      let v0y = vy - uy * launch;
      const m = Math.hypot(v0x, v0y);
      if (m > HAND_MAX) {
        v0x *= HAND_MAX / m;
        v0y *= HAND_MAX / m;
      }
      if (!fire) relaxIcon();
      if (fire) {
        onSend?.();
        if (reduce) {
          setSent(true);
          setTimeout(() => setSent(false), 200);
        } else {
          dotPending.current = true;
          dotTimer.current = setTimeout(launchDot, 150);
        }
      }
      settle({ x: v0x, y: v0y });
    }
    armedRef.current = false;
    setHeld(false);
    setArmed(false);
  };
  useEffect(
    () => () => {
      animX.current?.stop();
      animY.current?.stop();
      clearTimeout(dotTimer.current);
    },
    []
  );

  return (
    <span
      ref={rootRef}
      className={`group/root relative inline-block [width:var(--sl-size)] [height:var(--sl-size)]${className ? ` ${className}` : ''}`}
      data-armed={armed ? '' : undefined}
      data-sent={sent ? '' : undefined}
      style={
        {
          '--sl-size': `${size}px`,
          '--sl-svg': `${2 * H}px`,
          '--sl-pad': padColor,
          '--sl-icon': iconColor,
          '--sl-accent': accentColor,
          '--sl-well': wellColor,
          '--sl-band': bandColor,
          '--sl-stroke': `${strokeWidth}px`,
          '--sl-dot': `${DOT}px`
        } as CSSProperties
      }
    >
      <svg
        className="pointer-events-none absolute top-1/2 left-1/2 overflow-visible [width:var(--sl-svg)] [height:var(--sl-svg)] [margin:calc(var(--sl-svg)/-2)_0_0_calc(var(--sl-svg)/-2)] [shape-rendering:geometricPrecision]"
        viewBox={`${-H} ${-H} ${2 * H} ${2 * H}`}
        aria-hidden="true"
      >
        <g ref={fxRef} className="sling-button__tension" style={{ opacity: 0 }}>
          <path ref={bandRef} className="fill-none [stroke:var(--sl-band)] [stroke-linecap:round]" />
          <path ref={hotRef} className="fill-none [stroke:var(--sl-accent)] [stroke-linecap:round]" />
        </g>
        <circle
          className="[fill:var(--sl-well)] [transition:fill_200ms_ease] group-data-[sent]/root:[fill:var(--sl-accent)]"
          r={wellR}
        />
        <circle
          ref={arcRef}
          className="fill-none [stroke:var(--sl-accent)] [stroke-width:var(--sl-stroke)] [stroke-linecap:butt] [transition:stroke-width_160ms_cubic-bezier(0.23,1,0.32,1)] group-data-[armed]/root:[stroke-width:calc(var(--sl-stroke)*1.5)]"
          r={arcR}
          pathLength="1"
          strokeDasharray="0 1"
          style={{ opacity: 0 }}
        />
      </svg>
      <span
        ref={dotRef}
        className="pointer-events-none absolute top-1/2 left-1/2 rounded-full opacity-0 [width:var(--sl-dot)] [height:var(--sl-dot)] [margin:calc(var(--sl-dot)/-2)_0_0_calc(var(--sl-dot)/-2)] [background:var(--sl-accent)]"
        aria-hidden="true"
      />
      <motion.span className="absolute inset-0" style={{ transform: padT }}>
        <button
          ref={padRef}
          type="button"
          className="group/pad relative m-0 block h-full w-full cursor-grab touch-none rounded-full border-0 bg-transparent p-0 outline-none select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] after:absolute after:-inset-1.5 after:rounded-full after:content-[''] data-[held]:cursor-grabbing aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
          aria-label={ariaLabel}
          aria-describedby={hintId}
          aria-disabled={disabled || undefined}
          data-held={held ? '' : undefined}
          data-armed={armed ? '' : undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={e => release(e.pointerId, false)}
          onPointerCancel={e => release(e.pointerId, true)}
          onLostPointerCapture={e => release(e.pointerId, true)}
          onKeyDown={e => {
            if (e.key === 'Escape' && grip.current) release(grip.current.id, true);
          }}
          onClick={() => {
            if (skipClick.current) {
              skipClick.current = false;
              return;
            }
            if (!disabled) onSend?.();
          }}
        >
          <span className="flex h-full w-full items-center justify-center rounded-full [background:var(--sl-pad)] [color:var(--sl-icon)] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1)] group-data-[held]/pad:scale-[0.97] group-data-[armed]/pad:scale-[1.04] [@media(hover:hover)_and_(pointer:fine)]:group-hover/pad:group-not-data-[held]/pad:group-not-aria-disabled/pad:scale-[1.02] motion-reduce:transition-none motion-reduce:transform-none!">
            <span ref={iconRef} className="inline-flex will-change-transform">
              {children ?? <HugeiconsIcon icon={ArrowUp02Icon} size={Math.round(size * 0.4)} strokeWidth={2.2} />}
            </span>
          </span>
        </button>
      </motion.span>
      <span id={hintId} className="sr-only">
        Press Enter to send, or drag away and release.
      </span>
    </span>
  );
};

export default SlingButton;
