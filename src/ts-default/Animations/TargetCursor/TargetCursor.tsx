'use client';

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import './TargetCursor.css';

export interface TargetCursorProps {
  targetSelector?: string;
  cursorColor?: string;
  cursorColorOnTarget?: string;
  spinDuration?: number;
  hoverDuration?: number;
  parallaxOn?: boolean;
  hideDefaultCursor?: boolean;
  size?: number;
  cornerSize?: number;
  thickness?: number;
  padding?: number;
  matchRadius?: boolean;
  dotSize?: number;
  blendMode?: CSSProperties['mixBlendMode'];
  showLabel?: boolean;
  clickEffect?: boolean;
  container?: RefObject<HTMLElement | null> | HTMLElement | null;
}

type Spring = { x: number; v: number };

const CORNER_ANGLES = [0, 90, 180, 270];
const QUARTER = Math.PI / 2;

const spring = (state: Spring, goal: number, stiffness: number, damping: number, dt: number) => {
  const steps = 2;
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    state.v += (stiffness * (goal - state.x) - damping * state.v) * h;
    state.x += state.v * h;
  }
};

const resolveElement = (value: TargetCursorProps['container']): HTMLElement | null =>
  (value && 'current' in value ? value.current : value) || null;

const TargetCursor = ({
  targetSelector = '.cursor-target',
  cursorColor = '#ffffff',
  cursorColorOnTarget,
  spinDuration = 2,
  hoverDuration = 0.2,
  parallaxOn = true,
  hideDefaultCursor = true,
  size = 36,
  cornerSize = 12,
  thickness = 3,
  padding = 6,
  matchRadius = true,
  dotSize = 4,
  blendMode = 'difference',
  showLabel = true,
  clickEffect = true,
  container
}: TargetCursorProps) => {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const cornerRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const dotRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const settings = {
    targetSelector,
    cursorColor,
    cursorColorOnTarget,
    spinDuration,
    hoverDuration: Math.max(0.05, hoverDuration),
    parallaxOn,
    hideDefaultCursor,
    size: Math.max(4, size),
    cornerSize: Math.max(2, cornerSize),
    thickness: Math.max(0.5, thickness),
    padding,
    matchRadius,
    dotSize: Math.max(0, dotSize),
    showLabel,
    clickEffect,
    container
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setHost(finePointer.matches ? document.body : null);
    update();
    finePointer.addEventListener('change', update);
    return () => finePointer.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!host || !root) return undefined;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const style = document.createElement('style');
    document.head.appendChild(style);

    const pointer = { x: 0, y: 0, inside: false, seen: false, pressed: false };
    const centerX = { x: 0, v: 0 };
    const centerY = { x: 0, v: 0 };
    const halfW = { x: 0, v: 0 };
    const halfH = { x: 0, v: 0 };
    const radius = { x: 0, v: 0 };
    const turn = { x: 0, v: 0 };
    const lock = { x: 0, v: 0 };
    const press = { x: 0, v: 0 };
    const presence = { x: 0, v: 0 };
    let target: Element | null = null;
    let targetRadius = 0;
    let quarter = 0;
    let spinSpeed = 0;
    let raf = 0;
    let last = 0;
    let lastLabel = '';
    let lastColor = '';
    let lastScope: HTMLElement | null = null;

    const scopeOf = () => resolveElement(settingsRef.current.container);

    const hideCursor = () => {
      const s = settingsRef.current;
      const scope = scopeOf();
      if (scope !== lastScope) {
        lastScope?.removeAttribute('data-target-cursor-scope');
        scope?.setAttribute('data-target-cursor-scope', '');
        lastScope = scope;
      }
      const selector = scope ? '[data-target-cursor-scope]' : 'html';
      const rule =
        s.hideDefaultCursor && pointer.inside ? `${selector}, ${selector} * { cursor: none !important; }` : '';
      if (style.textContent !== rule) style.textContent = rule;
    };

    const findTarget = (x: number, y: number, element?: Element | null): Element | null => {
      const s = settingsRef.current;
      const node = element || document.elementFromPoint(x, y);
      const found = node?.closest(s.targetSelector) || null;
      const scope = scopeOf();
      if (found && scope && !scope.contains(found)) return null;
      return found;
    };

    const lockOn = (next: Element | null) => {
      if (next === target) return;
      target = next;
      if (target) {
        const angle = turn.x;
        quarter = Math.round(angle / QUARTER);
        const corner = parseFloat(getComputedStyle(target).borderTopLeftRadius) || 0;
        targetRadius = corner;
        spinSpeed = 0;
      }
    };

    const frame = (now: number) => {
      raf = 0;
      const s = settingsRef.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;

      if (target && !target.isConnected) lockOn(null);
      const rect = target ? target.getBoundingClientRect() : null;
      const locked = !!rect && pointer.inside;
      const snapW = 4.6 / s.hoverDuration;
      const snapK = snapW * snapW;
      const snapC = 2 * 0.62 * snapW;

      spring(presence, pointer.inside ? 1 : 0, 260, 32, dt);
      spring(lock, locked ? 1 : 0, snapK, 2 * snapW, dt);
      spring(press, pointer.pressed && s.clickEffect ? 1 : 0, 900, 40, dt);

      let goalX = pointer.x;
      let goalY = pointer.y;
      let goalW = s.size / 2;
      let goalH = s.size / 2;
      let goalR = Math.min(2, s.cornerSize / 4);
      if (locked) {
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const lean = s.parallaxOn ? 0.08 : 0;
        goalX = cx + (pointer.x - cx) * lean;
        goalY = cy + (pointer.y - cy) * lean;
        const odd = Math.abs(quarter) % 2 === 1;
        const w = rect.width / 2 + s.padding;
        const h = rect.height / 2 + s.padding;
        goalW = odd ? h : w;
        goalH = odd ? w : h;
        goalR = s.matchRadius ? Math.min(targetRadius + Math.max(0, s.padding), s.cornerSize) : 0;
      }

      if (!pointer.inside && presence.x < 0.01) pointer.seen = false;
      if (!pointer.seen) {
        centerX.x = goalX;
        centerY.x = goalY;
        halfW.x = goalW;
        halfH.x = goalH;
        pointer.seen = pointer.inside;
      }

      const follow = locked ? snapK : 2200;
      const followC = locked ? snapC : 2 * Math.sqrt(2200);
      spring(centerX, goalX, follow, followC, dt);
      spring(centerY, goalY, follow, followC, dt);
      spring(halfW, goalW, snapK, snapC, dt);
      spring(halfH, goalH, snapK, snapC, dt);
      spring(radius, goalR, snapK, 2 * snapW, dt);

      if (locked) {
        spring(turn, quarter * QUARTER, snapK, snapC, dt);
      } else {
        const speed = s.spinDuration > 0 && !reduce ? (Math.PI * 2) / s.spinDuration : 0;
        spinSpeed += (speed - spinSpeed) * (1 - Math.exp(-dt * 3));
        turn.v = spinSpeed;
        turn.x += spinSpeed * dt;
      }

      const squeeze = 1 - press.x * 0.14;
      const cos = Math.cos(turn.x);
      const sin = Math.sin(turn.x);
      const w = Math.max(0, halfW.x) * squeeze;
      const h = Math.max(0, halfH.x) * squeeze;
      const local = [
        [-w, -h],
        [w, -h],
        [w, h],
        [-w, h]
      ];
      const r = Math.max(0, Math.min(radius.x, s.cornerSize));
      const degrees = (turn.x * 180) / Math.PI;
      let left = Infinity;
      let top = Infinity;
      cornerRefs.current.forEach((corner, i) => {
        if (!corner) return;
        const [lx, ly] = local[i];
        const x = centerX.x + lx * cos - ly * sin;
        const y = centerY.x + lx * sin + ly * cos;
        left = Math.min(left, x);
        top = Math.min(top, y);
        corner.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${(CORNER_ANGLES[i] + degrees).toFixed(2)}deg)`;
        corner.style.width = `${s.cornerSize}px`;
        corner.style.height = `${s.cornerSize}px`;
        corner.style.borderWidth = `${s.thickness}px 0 0 ${s.thickness}px`;
        corner.style.borderTopLeftRadius = `${r.toFixed(2)}px`;
      });

      const dot = dotRef.current;
      if (dot) {
        const dotScale = 1 - press.x * 0.35;
        dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%) scale(${dotScale.toFixed(3)})`;
        dot.style.width = `${s.dotSize}px`;
        dot.style.height = `${s.dotSize}px`;
      }

      const label = labelRef.current;
      if (label) {
        const text = s.showLabel && target ? target.getAttribute('data-cursor-label') || '' : '';
        if (text && text !== lastLabel) label.textContent = text;
        if (text) lastLabel = text;
        const shown = text ? Math.max(0, Math.min(1, lock.x)) : 0;
        label.style.transform = `translate3d(${left.toFixed(2)}px, ${(top - 8).toFixed(2)}px, 0) translateY(-100%) translateY(${((1 - shown) * 4).toFixed(2)}px)`;
        label.style.opacity = shown.toFixed(3);
      }

      const mix = s.cursorColorOnTarget ? Math.round(Math.max(0, Math.min(1, lock.x)) * 100) : 0;
      const color = mix ? `color-mix(in oklab, ${s.cursorColorOnTarget} ${mix}%, ${s.cursorColor})` : s.cursorColor;
      if (color !== lastColor) {
        root.style.setProperty('--target-cursor-color', color);
        lastColor = color;
      }
      root.style.opacity = Math.max(0, Math.min(1, presence.x)).toFixed(3);

      const resting =
        !pointer.inside &&
        presence.x < 0.002 &&
        Math.abs(presence.v) < 0.002 &&
        Math.abs(lock.x) < 0.002 &&
        Math.abs(press.x) < 0.002;
      const spinning = pointer.inside && !locked && spinSpeed > 0.0001;
      const moving =
        Math.abs(centerX.v) + Math.abs(centerY.v) + Math.abs(halfW.v) + Math.abs(halfH.v) + Math.abs(turn.v) > 0.01 ||
        Math.abs(goalX - centerX.x) + Math.abs(goalY - centerY.x) > 0.05 ||
        Math.abs(lock.v) + Math.abs(press.v) + Math.abs(presence.v) > 0.001;
      if (!resting && (spinning || moving || locked)) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    wakeRef.current = () => {
      hideCursor();
      wake();
    };

    const insideScope = (x: number, y: number, element?: Element | null) => {
      const scope = scopeOf();
      if (!scope) return true;
      if (element && scope.contains(element)) return true;
      const box = scope.getBoundingClientRect();
      return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      const inside = insideScope(pointer.x, pointer.y, event.target as Element | null);
      if (inside !== pointer.inside) {
        pointer.inside = inside;
        hideCursor();
      }
      lockOn(inside ? findTarget(pointer.x, pointer.y, event.target as Element | null) : null);
      wake();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      pointer.pressed = true;
      wake();
    };

    const onPointerUp = () => {
      pointer.pressed = false;
      wake();
    };

    const onLeave = () => {
      pointer.inside = false;
      pointer.pressed = false;
      lockOn(null);
      hideCursor();
      wake();
    };

    const onScroll = () => {
      if (!pointer.inside) return;
      lockOn(findTarget(pointer.x, pointer.y));
      wake();
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('scroll', onScroll, { capture: true });
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      lastScope?.removeAttribute('data-target-cursor-scope');
      style.remove();
    };
  }, [host]);

  useEffect(() => {
    wakeRef.current?.();
  });

  if (!host) return null;

  return createPortal(
    <div ref={rootRef} className="target-cursor" style={{ mixBlendMode: blendMode, opacity: 0 }} aria-hidden="true">
      {CORNER_ANGLES.map((angle, i) => (
        <span
          key={angle}
          ref={element => {
            cornerRefs.current[i] = element;
          }}
          className="target-cursor__corner"
        />
      ))}
      <span ref={dotRef} className="target-cursor__dot" />
      <span ref={labelRef} className="target-cursor__label" />
    </div>,
    host
  );
};

export default TargetCursor;
