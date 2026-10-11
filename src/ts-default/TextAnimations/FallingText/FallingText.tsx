'use client';

import { Fragment, useEffect, useMemo, useRef, type CSSProperties } from 'react';
import Matter from 'matter-js';

import './FallingText.css';

interface FallingTextProps {
  text?: string;
  highlightWords?: string[];
  highlightClass?: string;
  trigger?: 'auto' | 'hover' | 'click' | 'scroll';
  variant?: 'text' | 'tiles';
  split?: 'words' | 'letters';
  gravity?: number;
  bounciness?: number;
  scatter?: number;
  stagger?: number;
  order?: 'random' | 'sequence' | 'center' | 'together';
  draggable?: boolean;
  mouseConstraintStiffness?: number;
  cursorPush?: number;
  restoreDelay?: number;
  fontSize?: string;
  accentColor?: string;
  theme?: 'dark' | 'light';
  backgroundColor?: string;
  wireframes?: boolean;
  className?: string;
  style?: CSSProperties;
}

interface Piece {
  element: HTMLElement;
  body: Matter.Body;
  w: number;
  h: number;
  x0: number;
  y0: number;
  px: number;
  py: number;
  pa: number;
  dx: number;
  dy: number;
  da: number;
  at: number;
  released: boolean;
  knocked?: boolean;
  pushed?: number;
}

const THEMES: Record<string, Record<string, string>> = {
  dark: {
    '--falling-text-tile': 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
    '--falling-text-tile-edge': 'rgba(255, 255, 255, 0.07)',
    '--falling-text-tile-highlight': 'rgba(255, 255, 255, 0.12)',
    '--falling-text-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    '--falling-text-tile-ink': '#f4f4f5'
  },
  light: {
    '--falling-text-tile': 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
    '--falling-text-tile-edge': 'rgba(24, 24, 27, 0.08)',
    '--falling-text-tile-highlight': 'rgba(255, 255, 255, 1)',
    '--falling-text-tile-shadow': '0 4px 10px -5px rgba(24, 24, 27, 0.25)',
    '--falling-text-tile-ink': '#27272a'
  }
};

const STEP = 1000 / 120;
const WALL = 400;
const SPRING =
  'linear(0, 0.0603, 0.2033, 0.3821, 0.5633, 0.7258, 0.8584, 0.9574, 1.0242, 1.0634, 1.0809, 1.0828, 1.0747, 1.0613, 1.046, 1.0313, 1.0186, 1.0085, 1.0012, 0.9965, 0.994, 0.9931, 0.9933, 0.9941, 0.9953, 0.9966, 0.9978, 0.9988, 1)';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const readableOn = (color: string) => {
  let hex = String(color || '')
    .trim()
    .replace('#', '');
  if (hex.length === 3) hex = hex.replace(/./g, c => c + c);
  if (!/^[0-9a-f]{6}$/i.test(hex)) return '#ffffff';
  const [r, g, b] = [0, 2, 4].map(index => {
    const c = parseInt(hex.slice(index, index + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#18181b' : '#ffffff';
};

const springEase = () =>
  typeof CSS !== 'undefined' && CSS.supports?.('transition-timing-function', 'linear(0, 1)')
    ? SPRING
    : 'cubic-bezier(0.34, 1.4, 0.64, 1)';

const FallingText = ({
  text = '',
  highlightWords = [],
  highlightClass = 'highlighted',
  trigger = 'auto',
  variant = 'text',
  split = 'words',
  gravity = 1,
  bounciness = 0.2,
  scatter = 0.5,
  stagger = 0.03,
  order = 'random',
  draggable = true,
  mouseConstraintStiffness = 0.2,
  cursorPush = 0.5,
  restoreDelay = 0,
  fontSize = '1rem',
  accentColor = '#5b8cff',
  theme = 'dark',
  backgroundColor = 'transparent',
  wireframes = false,
  className = '',
  style
}: FallingTextProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const settings = {
    trigger,
    gravity,
    bounciness,
    scatter,
    stagger,
    order,
    draggable,
    mouseConstraintStiffness,
    cursorPush,
    restoreDelay
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const highlightKey = highlightWords.join('\u0000');
  const groups = useMemo(() => {
    const marks = highlightKey ? highlightKey.split('\u0000') : [];
    return String(text)
      .split(/\s+/)
      .filter(Boolean)
      .map(word => ({ word, highlighted: marks.some(entry => entry && word.startsWith(entry)) }));
  }, [text, highlightKey]);

  useEffect(() => {
    const container = containerRef.current;
    const block = textRef.current;
    if (!container || !block) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let phase: 'idle' | 'falling' | 'restoring' = 'idle';
    let engine: Matter.Engine | null = null;
    let pieces: Piece[] = [];
    let walls: Matter.Body[] = [];
    let drag: { constraint: Matter.Constraint; id: number } | null = null;
    let raf = 0;
    let last = 0;
    let clock = 0;
    let accumulator = 0;
    let quietSince: number | null = null;
    let inside = false;
    let visible = true;
    let armed = true;
    let lastBounciness: number | null = null;
    const pointer = { x: 0, y: 0, vx: 0, vy: 0, time: 0 };

    const local = (event: PointerEvent) => {
      const box = container.getBoundingClientRect();
      return { x: event.clientX - box.left - container.clientLeft, y: event.clientY - box.top - container.clientTop };
    };

    const placeWalls = () => {
      if (!engine) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      const [floor, left, right, ceiling] = walls;
      Matter.Body.setPosition(floor, { x: width / 2, y: height + WALL / 2 });
      Matter.Body.setPosition(left, { x: -WALL / 2, y: height / 2 });
      Matter.Body.setPosition(right, { x: width + WALL / 2, y: height / 2 });
      Matter.Body.setPosition(ceiling, { x: width / 2, y: -WALL / 2 });
      pieces.forEach(piece => Matter.Sleeping.set(piece.body, false));
    };

    const draw = (alpha: number) => {
      for (const piece of pieces) {
        const { body } = piece;
        const x = piece.px + (body.position.x - piece.px) * alpha;
        const y = piece.py + (body.position.y - piece.py) * alpha;
        const angle = piece.pa + (body.angle - piece.pa) * alpha;
        if (Math.abs(x - piece.dx) < 0.01 && Math.abs(y - piece.dy) < 0.01 && Math.abs(angle - piece.da) < 0.0001)
          continue;
        piece.dx = x;
        piece.dy = y;
        piece.da = angle;
        piece.element.style.transform = `translate3d(${(x - piece.w / 2).toFixed(2)}px, ${(y - piece.h / 2).toFixed(2)}px, 0) rotate(${angle.toFixed(4)}rad)`;
      }
    };

    const release = (piece: Piece) => {
      const s = settingsRef.current;
      piece.released = true;
      Matter.Body.setStatic(piece.body, false);
      Matter.Sleeping.set(piece.body, false);
      const kick = clamp(s.scatter, 0, 1) * (piece.knocked ? 0.4 : 1);
      Matter.Body.setVelocity(piece.body, { x: (Math.random() - 0.5) * 6 * kick, y: -Math.random() * 2.5 * kick });
      Matter.Body.setAngularVelocity(piece.body, (Math.random() - 0.5) * 0.12 * kick);
    };

    const frame = (now: number) => {
      raf = 0;
      if (!engine || !visible) return;
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 1 / 60);
      last = now;
      clock += dt;
      const s = settingsRef.current;
      engine.gravity.y = clamp(s.gravity, -3, 4) * 1.4;
      const bounce = clamp(s.bounciness, 0, 1);
      if (bounce !== lastBounciness) {
        lastBounciness = bounce;
        pieces.forEach(piece => {
          piece.body.restitution = bounce;
        });
      }
      for (const piece of pieces) if (!piece.released && (clock >= piece.at || piece.knocked)) release(piece);
      accumulator += dt * 1000;
      while (accumulator >= STEP) {
        for (const piece of pieces) {
          piece.px = piece.body.position.x;
          piece.py = piece.body.position.y;
          piece.pa = piece.body.angle;
        }
        Matter.Engine.update(engine, STEP);
        accumulator -= STEP;
      }
      draw(accumulator / STEP);
      const settled = pieces.every(piece => piece.released && (piece.body.isSleeping || piece.body.speed < 0.05));
      if (s.restoreDelay > 0 && settled && !inside && !drag) {
        quietSince ??= now;
        if (now - quietSince > s.restoreDelay * 1000) {
          restore();
          return;
        }
      } else quietSince = null;
      raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (!raf && engine && visible) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    };

    const fall = () => {
      if (phase !== 'idle' || reduced) return;
      const elements = [...block.querySelectorAll<HTMLElement>('[data-piece]')];
      if (!elements.length) return;
      const s = settingsRef.current;
      const box = container.getBoundingClientRect();
      const originX = box.left + container.clientLeft;
      const originY = box.top + container.clientTop;
      const rects = elements.map(element => {
        const rect = element.getBoundingClientRect();
        return { x: rect.left - originX, y: rect.top - originY, w: rect.width, h: rect.height };
      });
      block.style.minHeight = `${block.offsetHeight}px`;
      const world = Matter.Engine.create({ enableSleeping: true, positionIterations: 10, velocityIterations: 8 });
      world.gravity.y = clamp(s.gravity, -3, 4) * 1.4;
      walls = [
        Matter.Bodies.rectangle(0, 0, 10000, WALL, { isStatic: true, friction: 0.8 }),
        Matter.Bodies.rectangle(0, 0, WALL, 10000, { isStatic: true, friction: 0.3 }),
        Matter.Bodies.rectangle(0, 0, WALL, 10000, { isStatic: true, friction: 0.3 }),
        Matter.Bodies.rectangle(0, 0, 10000, WALL, { isStatic: true, friction: 0.3 })
      ];
      const count = rects.length;
      const center = rects.reduce((sum, rect) => sum + rect.x + rect.w / 2, 0) / count;
      const span = Math.max(1, ...rects.map(rect => Math.abs(rect.x + rect.w / 2 - center)));
      const shuffled = rects.map((_, index) => index).sort(() => Math.random() - 0.5);
      pieces = elements.map((element, index) => {
        const rect = rects[index];
        const radius = Math.max(0, Math.min(variant === 'tiles' ? rect.h * 0.28 : 4, rect.w / 2 - 1, rect.h / 2 - 1));
        const body = Matter.Bodies.rectangle(
          rect.x + rect.w / 2,
          rect.y + rect.h / 2,
          Math.max(2, rect.w - 1),
          Math.max(2, rect.h - 1),
          {
            chamfer: radius > 0.5 ? { radius } : undefined,
            restitution: clamp(s.bounciness, 0, 1),
            friction: 0.4,
            frictionStatic: 0.8,
            frictionAir: 0.012,
            density: 0.0015,
            slop: 0.02
          }
        );
        Matter.Body.setStatic(body, true);
        const rank =
          s.order === 'random'
            ? shuffled.indexOf(index)
            : s.order === 'center'
              ? (Math.abs(rect.x + rect.w / 2 - center) / span) * (count - 1)
              : index;
        element.style.position = 'absolute';
        element.style.left = '0';
        element.style.top = '0';
        element.style.width = `${rect.w}px`;
        element.style.height = `${rect.h}px`;
        element.style.margin = '0';
        element.style.transform = `translate3d(${rect.x}px, ${rect.y}px, 0)`;
        return {
          element,
          body,
          w: rect.w,
          h: rect.h,
          x0: rect.x,
          y0: rect.y,
          px: body.position.x,
          py: body.position.y,
          pa: 0,
          dx: body.position.x,
          dy: body.position.y,
          da: 0,
          at: s.order === 'together' ? 0 : rank * Math.max(0, s.stagger),
          released: false
        };
      });
      Matter.Composite.add(world.world, [...walls, ...pieces.map(piece => piece.body)]);
      const byBody = new Map(pieces.map(piece => [piece.body, piece]));
      Matter.Events.on(world, 'collisionStart', event => {
        const down = Math.sign(world.gravity.y) || 1;
        for (const pair of event.pairs) {
          const a = byBody.get(pair.bodyA);
          const b = byBody.get(pair.bodyB);
          if (!a || !b || a.released === b.released) continue;
          const [moving, still] = a.released ? [a, b] : [b, a];
          if ((still.body.position.y - moving.body.position.y) * down > still.h * 0.25) still.knocked = true;
        }
      });
      engine = world;
      placeWalls();
      phase = 'falling';
      container.dataset.phase = 'falling';
      clock = 0;
      accumulator = 0;
      quietSince = null;
      lastBounciness = clamp(s.bounciness, 0, 1);
      wake();
    };

    const restore = () => {
      if (phase !== 'falling') return;
      phase = 'restoring';
      container.dataset.phase = 'restoring';
      if (drag && engine) {
        Matter.Composite.remove(engine.world, drag.constraint);
        drag = null;
      }
      cancelAnimationFrame(raf);
      raf = 0;
      const easing = springEase();
      const order = [...pieces].sort((a, b) => a.body.position.y - b.body.position.y);
      const animations = order.map((piece, index) => {
        const angle = Math.atan2(Math.sin(piece.body.angle), Math.cos(piece.body.angle));
        const from = `translate3d(${(piece.body.position.x - piece.w / 2).toFixed(2)}px, ${(piece.body.position.y - piece.h / 2).toFixed(2)}px, 0) rotate(${angle.toFixed(4)}rad)`;
        const to = `translate3d(${piece.x0}px, ${piece.y0}px, 0) rotate(0rad)`;
        piece.element.style.transform = to;
        return piece.element.animate([{ transform: from }, { transform: to }], {
          duration: 760,
          delay: Math.min(index * 14, 360),
          easing,
          fill: 'backwards'
        });
      });
      Promise.all(animations.map(animation => animation.finished.catch(() => null))).then(() => {
        if (phase !== 'restoring') return;
        reset();
      });
    };

    const reset = (rearm = true) => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (engine) {
        Matter.Composite.clear(engine.world, false);
        Matter.Engine.clear(engine);
      }
      engine = null;
      for (const piece of pieces) {
        piece.element.getAnimations().forEach(animation => animation.cancel());
        piece.element.style.position = '';
        piece.element.style.left = '';
        piece.element.style.top = '';
        piece.element.style.width = '';
        piece.element.style.height = '';
        piece.element.style.margin = '';
        piece.element.style.transform = '';
      }
      pieces = [];
      walls = [];
      drag = null;
      block.style.minHeight = '';
      phase = 'idle';
      delete container.dataset.phase;
      delete container.dataset.dragging;
      if (rearm) armed = true;
    };

    const onEnter = () => {
      inside = true;
      if (settingsRef.current.trigger === 'hover') fall();
    };
    const onLeave = () => {
      inside = false;
    };
    const onClick = () => {
      if (settingsRef.current.trigger === 'click') fall();
    };

    const onDown = (event: PointerEvent) => {
      const s = settingsRef.current;
      if (!engine || phase !== 'falling' || !s.draggable || (event.pointerType === 'mouse' && event.button !== 0))
        return;
      const point = local(event);
      const bodies = pieces.filter(piece => piece.released).map(piece => piece.body);
      const hit = Matter.Query.point(bodies, point)[0];
      if (!hit) return;
      event.preventDefault();
      container.setPointerCapture?.(event.pointerId);
      Matter.Sleeping.set(hit, false);
      const constraint = Matter.Constraint.create({
        pointA: point,
        bodyB: hit,
        pointB: { x: point.x - hit.position.x, y: point.y - hit.position.y },
        stiffness: clamp(s.mouseConstraintStiffness, 0.01, 1),
        damping: 0.08,
        length: 0
      });
      Matter.Composite.add(engine.world, constraint);
      drag = { constraint, id: event.pointerId };
      container.dataset.dragging = '';
      wake();
    };

    const onMove = (event: PointerEvent) => {
      const point = local(event);
      const now = performance.now();
      const dt = Math.max(1, now - pointer.time);
      if (pointer.time && dt < 120) {
        const blend = Math.min(1, dt / 40);
        pointer.vx += ((point.x - pointer.x) / dt - pointer.vx) * blend;
        pointer.vy += ((point.y - pointer.y) / dt - pointer.vy) * blend;
      } else {
        pointer.vx = 0;
        pointer.vy = 0;
      }
      pointer.x = point.x;
      pointer.y = point.y;
      pointer.time = now;
      inside = true;
      if (phase === 'idle' && settingsRef.current.trigger === 'hover') fall();
      if (phase !== 'falling') return;
      if (drag && event.pointerId === drag.id) {
        drag.constraint.pointA = point;
        return;
      }
      const s = settingsRef.current;
      const push = clamp(s.cursorPush, 0, 2);
      const speed = Math.hypot(pointer.vx, pointer.vy);
      if (!push || speed < 0.35) return;
      let touched = false;
      for (const piece of pieces) {
        if (!piece.released) continue;
        const { body } = piece;
        const reach = Math.max(piece.w, piece.h) / 2 + 18;
        const distance = Math.hypot(body.position.x - point.x, body.position.y - point.y);
        if (distance > reach) continue;
        if (now - (piece.pushed || 0) < 60) continue;
        piece.pushed = now;
        const falloff = 1 - (distance / reach) ** 2;
        const kick = Math.min(20, speed * push * falloff * 16);
        Matter.Sleeping.set(body, false);
        Matter.Body.setVelocity(body, {
          x: body.velocity.x + (pointer.vx / speed) * kick,
          y: body.velocity.y + (pointer.vy / speed) * kick - kick * 0.7
        });
        Matter.Body.setAngularVelocity(body, body.angularVelocity + (Math.random() - 0.5) * 0.06 * push);
        touched = true;
      }
      if (touched) wake();
    };

    const onUp = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return;
      if (engine) Matter.Composite.remove(engine.world, drag.constraint);
      drag = null;
      delete container.dataset.dragging;
    };

    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            entries => {
              const entry = entries[entries.length - 1];
              visible = entry.isIntersecting;
              if (visible) wake();
              if (settingsRef.current.trigger !== 'scroll') return;
              if (entry.intersectionRatio >= 0.3) {
                if (armed) {
                  armed = false;
                  fall();
                }
              } else if (phase === 'idle') armed = true;
            },
            { threshold: [0, 0.3] }
          );
    observer?.observe(container);

    const resizeObserver = new ResizeObserver(() => {
      if (phase === 'falling') {
        placeWalls();
        wake();
      }
    });
    resizeObserver.observe(container);

    container.addEventListener('pointerenter', onEnter);
    container.addEventListener('pointerleave', onLeave);
    container.addEventListener('click', onClick);
    container.addEventListener('pointerdown', onDown);
    container.addEventListener('pointermove', onMove);
    container.addEventListener('pointerup', onUp);
    container.addEventListener('pointercancel', onUp);

    let cancelled = false;
    if (trigger === 'auto') {
      const ready = document.fonts?.ready ?? Promise.resolve();
      ready.then(() => {
        if (!cancelled) requestAnimationFrame(() => !cancelled && fall());
      });
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      resizeObserver.disconnect();
      container.removeEventListener('pointerenter', onEnter);
      container.removeEventListener('pointerleave', onLeave);
      container.removeEventListener('click', onClick);
      container.removeEventListener('pointerdown', onDown);
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerup', onUp);
      container.removeEventListener('pointercancel', onUp);
      phase = 'idle';
      reset(false);
    };
  }, [groups, split, variant, fontSize, trigger]);

  const pieceClass = `falling-text__piece${variant === 'tiles' ? ' falling-text__piece--tile' : ''}`;

  return (
    <div
      ref={containerRef}
      className={`falling-text${wireframes ? ' falling-text--wireframes' : ''} ${className}`.trim()}
      data-trigger={trigger}
      data-draggable={draggable ? '' : undefined}
      style={
        {
          ...(THEMES[theme] ?? THEMES.dark),
          '--falling-text-accent': accentColor,
          '--falling-text-accent-ink': readableOn(accentColor),
          background: backgroundColor,
          fontSize,
          ...style
        } as CSSProperties
      }
    >
      <div ref={textRef} className="falling-text__text">
        {groups.map((group, index) => (
          <Fragment key={index}>
            {index > 0 && ' '}
            {split === 'letters' ? (
              <span className="falling-text__group">
                {[...group.word].map((letter, position) => (
                  <span
                    key={position}
                    className={`${pieceClass}${group.highlighted ? ` ${highlightClass}` : ''}`}
                    data-piece=""
                    data-highlight={group.highlighted ? '' : undefined}
                  >
                    {letter}
                  </span>
                ))}
              </span>
            ) : (
              <span
                className={`${pieceClass}${group.highlighted ? ` ${highlightClass}` : ''}`}
                data-piece=""
                data-highlight={group.highlighted ? '' : undefined}
              >
                {group.word}
              </span>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
};

export default FallingText;
