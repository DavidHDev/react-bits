import { useEffect, useId, useRef, useState } from 'react';
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion
} from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowUp02Icon } from '@hugeicons/core-free-icons';

import './SlingButton.css';

const GAP = 4;
const SLOP = { fine: 4, coarse: 8 };
const FINGER_MAX = 3000;
const HAND_MAX = 6000;
const CANCEL = 0.5;
const POWER_CAP = 1.5;
const DOT_MS = 300;
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const rubberband = (o, dim, c = 0.55) => (o * dim * c) / (dim + c * Math.abs(o));

export default function SlingButton({
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
}) {
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
  const rootRef = useRef(null);
  const padRef = useRef(null);
  const fxRef = useRef(null);
  const bandRef = useRef(null);
  const hotRef = useRef(null);
  const arcRef = useRef(null);
  const dotRef = useRef(null);
  const iconRef = useRef(null);
  const grip = useRef(null);
  const dir = useRef({ ux: 0, uy: -1 });
  const animX = useRef(null);
  const animY = useRef(null);
  const armedRef = useRef(false);
  const dotPending = useRef(false);
  const dotTimer = useRef(undefined);
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

  const aimIcon = (ux, uy, dist) => {
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

  const settle = v0 => {
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

  const onPointerDown = e => {
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
  const onPointerMove = e => {
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
  const release = (pointerId, cancelled) => {
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
      className={`sling-button${className ? ` ${className}` : ''}`}
      data-armed={armed ? '' : undefined}
      data-sent={sent ? '' : undefined}
      style={{
        '--sl-size': `${size}px`,
        '--sl-svg': `${2 * H}px`,
        '--sl-pad': padColor,
        '--sl-icon': iconColor,
        '--sl-accent': accentColor,
        '--sl-well': wellColor,
        '--sl-band': bandColor,
        '--sl-stroke': `${strokeWidth}px`,
        '--sl-dot': `${DOT}px`
      }}
    >
      <svg className="sling-button__fx" viewBox={`${-H} ${-H} ${2 * H} ${2 * H}`} aria-hidden="true">
        <g ref={fxRef} className="sling-button__tension" style={{ opacity: 0 }}>
          <path ref={bandRef} className="sling-button__band" />
          <path ref={hotRef} className="sling-button__band sling-button__band--hot" />
        </g>
        <circle className="sling-button__well" r={wellR} />
        <circle
          ref={arcRef}
          className="sling-button__arc"
          r={arcR}
          pathLength="1"
          strokeDasharray="0 1"
          style={{ opacity: 0 }}
        />
      </svg>
      <span ref={dotRef} className="sling-button__dot" aria-hidden="true" />
      <motion.span className="sling-button__move" style={{ transform: padT }}>
        <button
          ref={padRef}
          type="button"
          className="sling-button__pad"
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
          <span className="sling-button__face">
            <span ref={iconRef} className="sling-button__icon">
              {children ?? <HugeiconsIcon icon={ArrowUp02Icon} size={Math.round(size * 0.4)} strokeWidth={2.2} />}
            </span>
          </span>
        </button>
      </motion.span>
      <span id={hintId} className="sling-button__sr">
        Press Enter to send, or drag away and release.
      </span>
    </span>
  );
}
