'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode
} from 'react';
import { animate, motion, motionValue, useReducedMotion } from 'motion/react';
import type { MotionValue, ValueAnimationTransition } from 'motion/react';

type Layout = 'fan' | 'cascade' | 'deck' | 'pile';
type Vector = [number, number];
type Sample = [number, number, number];
type SpringKind = 'place' | 'settle' | 'tuck' | 'face' | 'lean' | 'press' | 'fling';

interface PlaceOptions {
  delay?: number;
  lift?: number;
  kind?: SpringKind;
  velocity?: Vector | null;
  keepZ?: boolean;
}

interface PlaceAllOptions {
  stagger?: number;
  lift?: number;
  released?: number;
  velocity?: Vector | null;
  kind?: SpringKind;
}

export interface StackProps {
  cards?: ReactNode[];
  layout?: Layout;
  visible?: number;
  spread?: number;
  depth?: number;
  radius?: number;
  frame?: number;
  frameColor?: string;
  shadow?: boolean;
  tilt?: number;
  threshold?: number;
  speed?: number;
  sendToBackOnClick?: boolean;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  onChange?: (index: number) => void;
  className?: string;
  style?: CSSProperties;
}

interface Placement {
  x: number;
  y: number;
  rotate: number;
  scale: number;
}

interface CardValues {
  x: MotionValue<number>;
  y: MotionValue<number>;
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  tiltX: MotionValue<number>;
  tiltY: MotionValue<number>;
  spin: MotionValue<number>;
  lift: MotionValue<number>;
  grabX: MotionValue<number>;
  grabY: MotionValue<number>;
  z: MotionValue<number>;
  opacity: MotionValue<number>;
  shade: MotionValue<number>;
}

interface Settings {
  layout: Layout;
  visible: number;
  spread: number;
  depth: number;
  tilt: number;
  threshold: number;
  speed: number;
  sendToBackOnClick: boolean;
  count: number;
  reduceMotion: boolean;
}

interface DragState {
  card: number;
  id: number;
  element: HTMLDivElement;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  idle: ReturnType<typeof setTimeout> | 0;
  moved: boolean;
  progress: number;
  capture?: boolean;
  samples: Sample[];
}

interface Actions {
  placeAll: (options?: PlaceAllOptions) => void;
  sendToBack: (direction: Vector | null, velocity?: Vector | null) => void;
  onMove: (event: PointerEvent) => void;
  onUp: (event: PointerEvent) => void;
}

interface Listeners {
  move: (event: PointerEvent) => void;
  up: (event: PointerEvent) => void;
}

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?q=80&w=500&auto=format',
  'https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=500&auto=format',
  'https://images.unsplash.com/photo-1452626212852-811d58933cae?q=80&w=500&auto=format',
  'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?q=80&w=500&auto=format'
];

const ORIGINS: Record<Layout, Vector> = { fan: [0.9, 0.9], cascade: [0.5, 0.5], deck: [0.5, 0], pile: [0.5, 0.5] };
const EXITS: Partial<Record<Layout, Vector>> = { fan: [1, -0.3], cascade: [0.8, 0.6], deck: [0, 1] };
const SHADOW = '0 14px 34px -10px rgba(0, 0, 0, 0.45), 0 3px 8px -2px rgba(0, 0, 0, 0.18)';
const CLICK_SLOP = 6;
const FLICK_SPEED = 650;
const LEAN_SPEED = 1300;
const LEAN_REACH = 260;
const PRESS_SCALE = 1.035;
const SPRINGS: Record<SpringKind, Vector> = {
  place: [260, 24],
  settle: [320, 34],
  tuck: [240, 28],
  face: [240, 30],
  lean: [240, 28],
  press: [420, 34],
  fling: [650, 42]
};

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const noise = (seed: number) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

const placement = (layout: Layout, position: number, card: number, spread: number, depth: number): Placement => {
  if (layout === 'cascade') {
    return { x: -position * spread * 28, y: -position * spread * 28, rotate: 0, scale: 1 - position * depth * 0.07 };
  }
  if (layout === 'deck') {
    return { x: 0, y: -position * spread * 32, rotate: 0, scale: 1 - position * depth * 0.1 };
  }
  if (layout === 'pile') {
    return {
      x: (noise(card + 1) - 0.5) * spread * 56,
      y: (noise(card + 2) - 0.5) * spread * 44,
      rotate: (noise(card + 3) - 0.5) * spread * 40,
      scale: 1 - position * depth * 0.03
    };
  }
  return { x: 0, y: 0, rotate: position * spread * 8, scale: 1 - position * depth * 0.12 };
};

const releaseVelocity = (samples: Sample[], time: number): Vector => {
  const recent = samples.filter(sample => time - sample[2] <= 100);
  if (recent.length < 2) return [0, 0];
  const first = recent[0];
  const last = recent[recent.length - 1];
  const elapsed = Math.max((last[2] - first[2]) / 1000, 0.008);
  return [(last[0] - first[0]) / elapsed, (last[1] - first[1]) / elapsed];
};

export default function Stack({
  cards,
  layout = 'fan',
  visible = 4,
  spread = 0.5,
  depth = 0.5,
  radius = 16,
  frame = 0,
  frameColor = '#ffffff',
  shadow = true,
  tilt = 30,
  threshold = 90,
  speed = 1,
  sendToBackOnClick = false,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  onChange,
  className = '',
  style
}: StackProps) {
  const items =
    cards && cards.length
      ? cards
      : DEFAULT_IMAGES.map((src, index) => <img key={src} src={src} alt={`Card ${index + 1}`} draggable={false} />);
  const count = items.length;
  const shape: Layout = layout in ORIGINS ? layout : 'fan';
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [order, setOrder] = useState(() => Array.from({ length: count }, (_, index) => index));
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const orderRef = useRef(order);
  const valuesRef = useRef(new Map<number, CardValues>());
  const elementsRef = useRef(new Map<number, HTMLDivElement>());
  const flyingRef = useRef(new Map<number, { turned: boolean }>());
  const dragRef = useRef<DragState | null>(null);
  const aliveRef = useRef(true);
  const mountedRef = useRef(false);
  const settingsRef = useRef<Settings | null>(null);
  const actionsRef = useRef<Actions | null>(null);
  const listenersRef = useRef<Listeners | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  if (order.length !== count || order.some(index => index >= count)) {
    const next = order.filter(index => index < count);
    for (let index = 0; index < count; index++) if (!next.includes(index)) next.push(index);
    orderRef.current = next;
    setOrder(next);
  }

  settingsRef.current = {
    layout: shape,
    visible: clamp(Math.round(visible), 1, Math.max(count, 1)),
    spread: clamp(spread, 0, 2),
    depth: clamp(depth, 0, 1),
    tilt: clamp(tilt, 0, 89),
    threshold: Math.max(threshold, 0),
    speed: clamp(speed, 0.2, 4),
    sendToBackOnClick,
    count,
    reduceMotion: !!reduceMotion
  };

  const valuesFor = (index: number): CardValues => {
    let values = valuesRef.current.get(index);
    if (!values) {
      const s = settingsRef.current!;
      const position = Math.max(0, orderRef.current.indexOf(index));
      const start = placement(
        s.layout,
        s.reduceMotion ? Math.min(position, s.visible - 1) : 0,
        index,
        s.spread,
        s.depth
      );
      values = {
        x: motionValue(start.x),
        y: motionValue(start.y),
        rotate: motionValue(start.rotate),
        scale: motionValue(start.scale),
        tiltX: motionValue(0),
        tiltY: motionValue(0),
        spin: motionValue(0),
        lift: motionValue(1),
        grabX: motionValue(0.5),
        grabY: motionValue(0.5),
        z: motionValue(s.count - position),
        opacity: motionValue(position < s.visible ? 1 : 0),
        shade: motionValue(0)
      };
      valuesRef.current.set(index, values);
    }
    return values;
  };

  const springFor = (
    s: Settings,
    kind: SpringKind,
    extra: ValueAnimationTransition<number> = {}
  ): ValueAnimationTransition<number> => {
    if (s.reduceMotion) return { duration: 0.2, ease: 'easeOut', delay: extra.delay || 0 };
    const [stiffness, damping] = SPRINGS[kind];
    return {
      type: 'spring',
      stiffness: stiffness * s.speed * s.speed,
      damping: damping * s.speed,
      restDelta: 0.01,
      restSpeed: 0.5,
      ...extra
    };
  };

  const settleFace = (values: CardValues, s: Settings, delay = 0) => {
    const transition = springFor(s, 'face', { delay });
    animate(values.tiltX, 0, transition);
    animate(values.tiltY, 0, transition);
    animate(values.spin, 0, transition);
    animate(values.lift, 1, transition);
  };

  const placeCard = (
    index: number,
    position: number,
    { delay = 0, lift = 0, kind = 'place', velocity = null, keepZ = false }: PlaceOptions = {}
  ) => {
    const s = settingsRef.current!;
    const values = valuesFor(index);
    const shown = Math.min(position, s.visible - 1);
    const target = placement(s.layout, shown, index, s.spread, s.depth);
    if (lift > 0 && shown > 0) {
      const ahead = placement(s.layout, shown - 1, index, s.spread, s.depth);
      target.x = mix(target.x, ahead.x, lift);
      target.y = mix(target.y, ahead.y, lift);
      target.rotate = mix(target.rotate, ahead.rotate, lift);
      target.scale = mix(target.scale, ahead.scale, lift);
    }
    const motionSpring = springFor(s, kind, { delay });
    const fade: ValueAnimationTransition<number> = {
      duration: s.reduceMotion ? 0.2 : 0.35 / s.speed,
      ease: 'easeOut',
      delay
    };
    if (!keepZ) values.z.set(s.count - position);
    animate(values.x, target.x, velocity ? { ...motionSpring, velocity: velocity[0] } : motionSpring);
    animate(values.y, target.y, velocity ? { ...motionSpring, velocity: velocity[1] } : motionSpring);
    animate(values.rotate, target.rotate, motionSpring);
    animate(values.scale, target.scale, motionSpring);
    settleFace(values, s, delay);
    animate(values.opacity, position < s.visible ? 1 : 0, fade);
    animate(values.shade, Math.min(0.6, shown * s.depth * 0.14 * (1 - lift)), fade);
  };

  const placeAll = ({
    stagger = 0,
    lift = 0,
    released = -1,
    velocity = null,
    kind = 'place'
  }: PlaceAllOptions = {}) => {
    const drag = dragRef.current;
    orderRef.current.forEach((index, position) => {
      const flight = flyingRef.current.get(index);
      if (flight && !flight.turned) return;
      if (drag && drag.moved && drag.card === index) return;
      const isReleased = index === released;
      placeCard(index, position, {
        delay: position * stagger,
        lift: position > 0 ? lift : 0,
        kind: flight ? 'tuck' : isReleased ? 'settle' : kind,
        velocity: isReleased ? velocity : null,
        keepZ: !!flight
      });
    });
  };

  const commit = (next: number[]) => {
    orderRef.current = next;
    setOrder(next);
  };

  const sendToBack = (direction: Vector | null, velocity: Vector | null = null) => {
    const s = settingsRef.current!;
    const current = orderRef.current;
    if (current.length < 2) return;
    const top = current[0];
    if (flyingRef.current.has(top)) return;
    const next = [...current.slice(1), top];
    if (s.reduceMotion) {
      commit(next);
      return;
    }
    let [dx, dy] = direction || EXITS[s.layout] || [Math.cos(noise(top + 9) * 6.283), Math.sin(noise(top + 9) * 6.283)];
    const length = Math.hypot(dx, dy) || 1;
    dx /= length;
    dy /= length;
    const bounds = rootRef.current?.getBoundingClientRect();
    const width = bounds?.width || 240;
    const height = bounds?.height || 240;
    const clearance = Math.min(width / Math.max(Math.abs(dx), 0.01), height / Math.max(Math.abs(dy), 0.01));
    const home = placement(s.layout, 0, top, s.spread, s.depth);
    const travel = clearance * 1.12 + 40;
    const out = [home.x + dx * travel, home.y + dy * travel];
    const values = valuesFor(top);
    const launch = springFor(s, 'fling');
    const flight = { turned: false };
    flyingRef.current.set(top, flight);
    values.z.set(s.count + 1);
    animate(values.x, out[0], velocity ? { ...launch, velocity: velocity[0] } : launch);
    animate(values.y, out[1], velocity ? { ...launch, velocity: velocity[1] } : launch);
    settleFace(values, s);
    commit(next);
    const span = Math.max(Math.hypot(out[0] - values.x.get(), out[1] - values.y.get()), 1);
    let landed = false;
    const turn = () => {
      flight.turned = true;
      const position = orderRef.current.indexOf(top);
      if (position >= 0) placeCard(top, position, { kind: 'tuck', keepZ: !landed });
    };
    const land = () => {
      landed = true;
      if (flyingRef.current.get(top) === flight) flyingRef.current.delete(top);
      const position = orderRef.current.indexOf(top);
      if (position >= 0) values.z.set(settingsRef.current!.count - position);
    };
    const fallback = setTimeout(() => {
      if (!flight.turned) turn();
      if (!landed) land();
    }, 1500 / s.speed);
    const clearOfPile = () => {
      const element = elementsRef.current.get(top);
      if (!element) return true;
      const mine = element.getBoundingClientRect();
      for (const [index, other] of elementsRef.current) {
        if (index === top || flyingRef.current.has(index) || valuesFor(index).opacity.get() < 0.5) continue;
        const box = other.getBoundingClientRect();
        if (mine.left < box.right && mine.right > box.left && mine.top < box.bottom && mine.bottom > box.top) {
          return false;
        }
      }
      return true;
    };
    const watch = () => {
      if (!aliveRef.current || (flight.turned && landed)) {
        clearTimeout(fallback);
        return;
      }
      const x = values.x.get();
      const y = values.y.get();
      const outward = values.x.getVelocity() * dx + values.y.getVelocity() * dy;
      if (!flight.turned && (Math.hypot(out[0] - x, out[1] - y) <= span * 0.06 || outward < 0)) turn();
      if (!landed && (clearOfPile() || (flight.turned && outward < 0))) land();
      requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  };

  const lean = (drag: DragState) => {
    const s = settingsRef.current!;
    if (s.reduceMotion) return;
    const values = valuesFor(drag.card);
    const offsetX = values.x.get() - drag.homeX;
    const offsetY = values.y.get() - drag.homeY;
    const sideways = clamp(drag.vx / LEAN_SPEED, -1, 1) * 0.7 + clamp(offsetX / LEAN_REACH, -1, 1) * 0.3;
    const upward = clamp(-drag.vy / LEAN_SPEED, -1, 1) * 0.7 + clamp(-offsetY / LEAN_REACH, -1, 1) * 0.3;
    const follow = springFor(s, 'lean');
    animate(values.tiltY, sideways * s.tilt, follow);
    animate(values.tiltX, upward * s.tilt, follow);
    animate(values.spin, clamp(offsetX / LEAN_REACH, -1, 1) * 6, follow);
  };

  const onMove = (event: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.id) return;
    const s = settingsRef.current!;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const values = valuesFor(drag.card);
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < CLICK_SLOP) return;
      drag.moved = true;
      values.x.stop();
      values.y.stop();
      drag.originX = values.x.get() - dx;
      drag.originY = values.y.get() - dy;
      try {
        drag.element.setPointerCapture(drag.id);
      } catch {
        drag.capture = false;
      }
      setDragging(true);
    }
    values.x.set(drag.originX + dx);
    values.y.set(drag.originY + dy);
    drag.samples.push([event.clientX, event.clientY, event.timeStamp]);
    if (drag.samples.length > 12) drag.samples.shift();
    [drag.vx, drag.vy] = releaseVelocity(drag.samples, event.timeStamp);
    lean(drag);
    clearTimeout(drag.idle);
    drag.idle = setTimeout(() => {
      if (dragRef.current !== drag) return;
      drag.vx = 0;
      drag.vy = 0;
      lean(drag);
    }, 70);
    const progress = clamp(Math.hypot(dx, dy) / Math.max(s.threshold, 1), 0, 1);
    if (Math.abs(progress - drag.progress) > 0.02) {
      drag.progress = progress;
      placeAll({ lift: progress * 0.4, kind: 'settle' });
    }
  };

  const onUp = (event: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.id) return;
    dragRef.current = null;
    clearTimeout(drag.idle);
    window.removeEventListener('pointermove', listenersRef.current!.move);
    window.removeEventListener('pointerup', listenersRef.current!.up);
    window.removeEventListener('pointercancel', listenersRef.current!.up);
    try {
      drag.element.releasePointerCapture(drag.id);
    } catch {
      drag.capture = false;
    }
    const s = settingsRef.current!;
    if (!drag.moved) {
      if (event.type === 'pointerup' && s.sendToBackOnClick) sendToBack(null);
      else settleFace(valuesFor(drag.card), s);
      return;
    }
    setDragging(false);
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const [vx, vy] = releaseVelocity(drag.samples, event.timeStamp);
    const distance = Math.hypot(dx, dy);
    const pace = Math.hypot(vx, vy);
    const flick = pace > FLICK_SPEED && distance > 16 && vx * dx + vy * dy > 0;
    if (event.type === 'pointerup' && s.count > 1 && (distance > s.threshold || flick)) {
      sendToBack(pace > 300 ? [vx, vy] : [dx, dy], [vx, vy]);
    } else {
      placeAll({ released: drag.card, velocity: [clamp(vx, -3000, 3000), clamp(vy, -3000, 3000)] });
    }
  };

  const onDown = (event: ReactPointerEvent<HTMLDivElement>, index: number) => {
    if (event.button !== 0 || dragRef.current) return;
    if (orderRef.current[0] !== index || flyingRef.current.has(index)) return;
    const s = settingsRef.current!;
    const values = valuesFor(index);
    const home = placement(s.layout, 0, index, s.spread, s.depth);
    const bounds = event.currentTarget.getBoundingClientRect();
    values.grabX.set(clamp((event.clientX - bounds.left) / Math.max(bounds.width, 1), 0, 1));
    values.grabY.set(clamp((event.clientY - bounds.top) / Math.max(bounds.height, 1), 0, 1));
    if (!s.reduceMotion) animate(values.lift, PRESS_SCALE, springFor(s, 'press'));
    dragRef.current = {
      card: index,
      id: event.pointerId,
      element: event.currentTarget,
      startX: event.clientX,
      startY: event.clientY,
      originX: 0,
      originY: 0,
      homeX: home.x,
      homeY: home.y,
      vx: 0,
      vy: 0,
      idle: 0,
      moved: false,
      progress: 0,
      samples: [[event.clientX, event.clientY, event.timeStamp]]
    };
    if (event.pointerType === 'mouse') event.preventDefault();
    window.addEventListener('pointermove', listenersRef.current!.move);
    window.addEventListener('pointerup', listenersRef.current!.up);
    window.addEventListener('pointercancel', listenersRef.current!.up);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (['ArrowRight', 'ArrowDown', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      sendToBack(null);
    }
  };

  actionsRef.current = { placeAll, sendToBack, onMove, onUp };
  if (!listenersRef.current) {
    listenersRef.current = {
      move: (event: PointerEvent) => actionsRef.current!.onMove(event),
      up: (event: PointerEvent) => actionsRef.current!.onUp(event)
    };
  }

  useIsomorphicLayoutEffect(() => {
    orderRef.current = order;
    actionsRef.current!.placeAll({ stagger: mountedRef.current ? 0 : 0.06 });
    mountedRef.current = true;
  }, [order, shape, visible, spread, depth, speed, count]);

  const top = order[0];
  const changedRef = useRef(false);
  useEffect(() => {
    if (!changedRef.current) {
      changedRef.current = true;
      return;
    }
    if (top !== undefined) onChangeRef.current?.(top);
  }, [top]);

  useEffect(() => {
    if (!autoplay || count < 2 || dragging || (pauseOnHover && hovered)) return undefined;
    const timer = setTimeout(() => actionsRef.current!.sendToBack(null), Math.max(300, autoplayDelay));
    return () => clearTimeout(timer);
  }, [autoplay, autoplayDelay, pauseOnHover, hovered, dragging, order, count]);

  useEffect(() => {
    aliveRef.current = true;
    const values = valuesRef.current;
    const listeners = listenersRef.current!;
    return () => {
      aliveRef.current = false;
      if (dragRef.current) clearTimeout(dragRef.current.idle);
      window.removeEventListener('pointermove', listeners.move);
      window.removeEventListener('pointerup', listeners.up);
      window.removeEventListener('pointercancel', listeners.up);
      values.forEach(group => Object.values(group).forEach(value => value.stop()));
    };
  }, []);

  const [originX, originY] = ORIGINS[shape];
  const innerRadius = Math.max(0, radius - frame);

  return (
    <div
      ref={rootRef}
      className={`group relative w-full h-full outline-none ${className}`.trim()}
      style={style}
      tabIndex={0}
      role="group"
      aria-label="Card stack"
      onKeyDown={onKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {items.map((card, index) => {
        const values = valuesFor(index);
        const isTop = order[0] === index;
        return (
          <motion.div
            key={index}
            ref={(element: HTMLDivElement | null) => {
              if (element) elementsRef.current.set(index, element);
              else elementsRef.current.delete(index);
            }}
            className="absolute inset-0 will-change-transform select-none [-webkit-tap-highlight-color:transparent]"
            data-top={isTop ? '' : undefined}
            aria-hidden={isTop ? undefined : true}
            style={{
              x: values.x,
              y: values.y,
              rotate: values.rotate,
              scale: values.scale,
              zIndex: values.z,
              opacity: values.opacity,
              originX,
              originY,
              cursor: isTop ? (dragging ? 'grabbing' : 'grab') : 'default',
              touchAction: isTop ? 'pan-y' : 'auto'
            }}
            onPointerDown={event => onDown(event, index)}
          >
            <motion.div
              className={`absolute inset-0 overflow-hidden will-change-transform ${isTop ? 'group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-current' : ''}`}
              style={{
                rotateX: values.tiltX,
                rotateY: values.tiltY,
                rotate: values.spin,
                scale: values.lift,
                originX: values.grabX,
                originY: values.grabY,
                transformPerspective: 800,
                borderRadius: radius,
                padding: frame,
                backgroundColor: frame > 0 ? frameColor : 'transparent',
                boxShadow: shadow ? SHADOW : 'none'
              }}
            >
              <div
                className="relative w-full h-full overflow-hidden [&_img]:block [&_img]:w-full [&_img]:h-full [&_img]:object-cover [&_img]:pointer-events-none [&_img]:[-webkit-user-drag:none]"
                style={{ borderRadius: innerRadius }}
              >
                {card}
              </div>
              <motion.div
                className="absolute inset-0 bg-black pointer-events-none"
                style={{ opacity: values.shade, borderRadius: radius }}
              />
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
