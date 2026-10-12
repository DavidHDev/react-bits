'use client';

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';

export type MagnetAxis = 'both' | 'x' | 'y';

export interface MagnetSpring {
  stiffness?: number;
  damping?: number;
  mass?: number;
}

export interface MagnetProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: number;
  disabled?: boolean;
  magnetStrength?: number;
  maxOffset?: number;
  exclusive?: boolean;
  axis?: MagnetAxis;
  tilt?: number;
  scale?: number;
  spring?: MagnetSpring;
  onActiveChange?: (active: boolean) => void;
  wrapperClassName?: string;
  innerClassName?: string;
}

type Motion = { x: number; y: number; tiltX: number; tiltY: number; scale: number };

type Point = { x: number; y: number };

type Settings = {
  padding: number;
  disabled: boolean;
  strength: number;
  maxOffset?: number;
  exclusive: boolean;
  axis: MagnetAxis;
  tilt: number;
  scale: number;
  stiffness: number;
  damping: number;
  mass: number;
  onActiveChange?: (active: boolean) => void;
};

type Entry = {
  wrapper: HTMLDivElement;
  settings: { current: Settings };
  reduce: boolean;
  wake: () => void;
  active: boolean;
};

const DEFAULT_SPRING = { stiffness: 170, damping: 16, mass: 1 };

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

const registry = new Set<Entry>();
const field: { pointer: Point | null; owner: Entry | null } = { pointer: null, owner: null };
let detach: (() => void) | null = null;

const reach = (rect: DOMRect, pointer: Point) => {
  const dx = pointer.x - (rect.left + rect.width / 2);
  const dy = pointer.y - (rect.top + rect.height / 2);
  const outside = Math.hypot(Math.max(0, Math.abs(dx) - rect.width / 2), Math.max(0, Math.abs(dy) - rect.height / 2));
  return { dx, dy, outside };
};

const arbitrate = () => {
  let winner: Entry | null = null;
  let nearest = Infinity;
  let closest = Infinity;
  for (const entry of registry) {
    const s = entry.settings.current;
    let near: { dx: number; dy: number; outside: number } | null = null;
    if (field.pointer && !s.disabled && !entry.reduce) {
      near = reach(entry.wrapper.getBoundingClientRect(), field.pointer);
      if (near.outside > s.padding) near = null;
    }
    if (!s.exclusive) {
      if (near || entry.active) entry.wake();
      continue;
    }
    if (!near) continue;
    const center = Math.hypot(near.dx, near.dy);
    if (near.outside < nearest || (near.outside === nearest && center < closest)) {
      winner = entry;
      nearest = near.outside;
      closest = center;
    }
  }
  const previous = field.owner;
  field.owner = winner;
  if (previous && previous !== winner) previous.wake();
  if (winner) winner.wake();
};

const attach = () => {
  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    field.pointer = { x: event.clientX, y: event.clientY };
    arbitrate();
  };
  const onLeave = () => {
    field.pointer = null;
    arbitrate();
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('scroll', arbitrate, { passive: true, capture: true });
  document.documentElement.addEventListener('pointerleave', onLeave);
  window.addEventListener('blur', onLeave);
  return () => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('scroll', arbitrate, { capture: true });
    document.documentElement.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('blur', onLeave);
  };
};

const Magnet = ({
  children,
  padding = 100,
  disabled = false,
  magnetStrength = 2,
  maxOffset,
  exclusive = true,
  axis = 'both',
  tilt = 0,
  scale = 1,
  spring,
  onActiveChange,
  wrapperClassName = '',
  innerClassName = '',
  style,
  ...props
}: MagnetProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const settings: Settings = {
    padding: Math.max(0, padding),
    disabled,
    strength: Math.max(0.1, magnetStrength),
    maxOffset,
    exclusive,
    axis,
    tilt,
    scale,
    stiffness: Math.max(1, spring?.stiffness ?? DEFAULT_SPRING.stiffness),
    damping: Math.max(0, spring?.damping ?? DEFAULT_SPRING.damping),
    mass: Math.max(0.01, spring?.mass ?? DEFAULT_SPRING.mass),
    onActiveChange
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const inner = innerRef.current;
    if (!wrapper || !inner) return undefined;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const current: Motion = { x: 0, y: 0, tiltX: 0, tiltY: 0, scale: 1 };
    const velocity: Motion = { x: 0, y: 0, tiltX: 0, tiltY: 0, scale: 0 };
    let active = false;
    let raf = 0;
    let last = 0;

    const solve = (target: Motion, dt: number) => {
      const s = settingsRef.current;
      let resting = true;
      (Object.keys(current) as (keyof Motion)[]).forEach(key => {
        const force = s.stiffness * (target[key] - current[key]) - s.damping * velocity[key];
        velocity[key] += (force / s.mass) * dt;
        current[key] += velocity[key] * dt;
        const epsilon = key === 'scale' ? 0.001 : 0.05;
        if (Math.abs(target[key] - current[key]) > epsilon || Math.abs(velocity[key]) > epsilon) resting = false;
      });
      return resting;
    };

    const measure = () => {
      const s = settingsRef.current;
      const target: Motion = { x: 0, y: 0, tiltX: 0, tiltY: 0, scale: 1 };
      if (s.disabled || reduce || !field.pointer) return { target, engaged: false };
      if (s.exclusive && field.owner !== entry) return { target, engaged: false };
      const rect = wrapper.getBoundingClientRect();
      const { dx, dy, outside } = reach(rect, field.pointer);
      if (outside > s.padding) return { target, engaged: false };
      const pull = s.padding > 0 ? 1 - smoothstep(s.padding * 0.5, s.padding, outside) : 1;
      let x = s.axis === 'y' ? 0 : (dx / s.strength) * pull;
      let y = s.axis === 'x' ? 0 : (dy / s.strength) * pull;
      if (s.maxOffset !== undefined && s.maxOffset !== null) {
        const length = Math.hypot(x, y);
        if (length > s.maxOffset) {
          x *= s.maxOffset / length;
          y *= s.maxOffset / length;
        }
      }
      const nx = Math.max(-1, Math.min(1, dx / Math.max(rect.width / 2, 1)));
      const ny = Math.max(-1, Math.min(1, dy / Math.max(rect.height / 2, 1)));
      target.x = x;
      target.y = y;
      target.tiltX = -ny * s.tilt * pull;
      target.tiltY = nx * s.tilt * pull;
      target.scale = 1 + (s.scale - 1) * pull;
      return { target, engaged: true };
    };

    const apply = () => {
      const { x, y, tiltX, tiltY, scale } = current;
      const turned = Math.abs(tiltX) > 0.01 || Math.abs(tiltY) > 0.01;
      inner.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)${
        turned ? ` perspective(800px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)` : ''
      }${Math.abs(scale - 1) > 0.0005 ? ` scale(${scale.toFixed(4)})` : ''}`;
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
      last = now;
      const { target, engaged } = measure();
      if (engaged !== active) {
        active = engaged;
        entry.active = engaged;
        if (engaged) wrapper.setAttribute('data-magnet-active', '');
        else wrapper.removeAttribute('data-magnet-active');
        settingsRef.current.onActiveChange?.(engaged);
      }
      const steps = Math.ceil(dt / (1 / 120));
      let resting = true;
      for (let i = 0; i < steps; i++) resting = solve(target, dt / steps);
      if (resting) {
        (Object.keys(current) as (keyof Motion)[]).forEach(key => {
          current[key] = target[key];
          velocity[key] = 0;
        });
      }
      apply();
      if (!resting) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    function wake() {
      if (!raf) raf = requestAnimationFrame(frame);
    }

    const entry: Entry = { wrapper, settings: settingsRef, reduce, wake, active: false };
    registry.add(entry);
    if (!detach) detach = attach();
    wakeRef.current = () => {
      arbitrate();
      wake();
    };

    return () => {
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      registry.delete(entry);
      if (field.owner === entry) field.owner = null;
      if (!registry.size && detach) {
        detach();
        detach = null;
      }
    };
  }, []);

  useEffect(() => {
    wakeRef.current?.();
  });

  return (
    <div
      ref={wrapperRef}
      className={wrapperClassName}
      style={{ position: 'relative', display: 'inline-block', ...style }}
      {...props}
    >
      <div ref={innerRef} className={innerClassName} style={{ willChange: 'transform' }}>
        {children}
      </div>
    </div>
  );
};

export default Magnet;
