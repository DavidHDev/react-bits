'use client';

import { useEffect, useRef, useState } from 'react';
import './PixelSwap.css';

const MAX_TILES = 196;
const EFFECTS = ['flip', 'assemble', 'grow'];
const ORIGINS = ['pointer', 'center', 'edges', 'left', 'right', 'top', 'bottom', 'diagonal', 'random'];
const AXES = ['auto', 'x', 'y'];

const ROOT = 'pixel-swap';
const LAYER = 'pixel-swap__layer';
const WALL = 'pixel-swap__wall';
const TILE = 'pixel-swap__tile';
const FACE = 'pixel-swap__face';
const PIECE = 'pixel-swap__piece';
const SHADE = 'pixel-swap__shade';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const hash = index => {
  let h = Math.imul(index + 1, 0x27d4eb2d);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const buildGrid = (width, height, pixelSize, gap) => {
  let size = pixelSize;
  let columns = Math.max(1, Math.ceil((width + gap) / (size + gap)));
  let rows = Math.max(1, Math.ceil((height + gap) / (size + gap)));
  if (columns * rows > MAX_TILES) {
    size = Math.ceil(size * Math.sqrt((columns * rows) / MAX_TILES));
    columns = Math.max(1, Math.ceil((width + gap) / (size + gap)));
    rows = Math.max(1, Math.ceil((height + gap) / (size + gap)));
  }
  const stride = size + gap;
  const startX = (width - (columns * stride - gap)) / 2;
  const startY = (height - (rows * stride - gap)) / 2;
  const tiles = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      tiles.push({
        index: row * columns + column,
        left: startX + column * stride,
        top: startY + row * stride,
        x: columns > 1 ? column / (columns - 1) : 0.5,
        y: rows > 1 ? row / (rows - 1) : 0.5
      });
    }
  }
  return { tiles, size, width, height };
};

const routeOf = (tile, grid, origin, point) => {
  const cx = tile.left + grid.size / 2;
  const cy = tile.top + grid.size / 2;
  if (origin === 'pointer' || origin === 'center' || origin === 'random') {
    const px = origin === 'pointer' && point ? point.x : grid.width / 2;
    const py = origin === 'pointer' && point ? point.y : grid.height / 2;
    const reach = Math.max(
      Math.hypot(px, py),
      Math.hypot(grid.width - px, py),
      Math.hypot(px, grid.height - py),
      Math.hypot(grid.width - px, grid.height - py),
      1
    );
    const length = Math.hypot(cx - px, cy - py);
    const order = origin === 'random' ? hash(tile.index + 7) : length / reach;
    return { order, dx: length ? (cx - px) / length : 0, dy: length ? (cy - py) / length : 1 };
  }
  if (origin === 'left') return { order: tile.x, dx: 1, dy: 0 };
  if (origin === 'right') return { order: 1 - tile.x, dx: -1, dy: 0 };
  if (origin === 'top') return { order: tile.y, dx: 0, dy: 1 };
  if (origin === 'bottom') return { order: 1 - tile.y, dx: 0, dy: -1 };
  if (origin === 'diagonal') return { order: (tile.x + tile.y) / 2, dx: Math.SQRT1_2, dy: Math.SQRT1_2 };
  const edge = Math.min(tile.x, 1 - tile.x, tile.y, 1 - tile.y);
  if (edge === tile.x) return { order: edge * 2, dx: 1, dy: 0 };
  if (edge === 1 - tile.x) return { order: edge * 2, dx: -1, dy: 0 };
  if (edge === tile.y) return { order: edge * 2, dx: 0, dy: 1 };
  return { order: edge * 2, dx: 0, dy: -1 };
};

const makeFace = (layer, tile, grid, cover) => {
  const face = document.createElement('div');
  face.className = FACE;
  const piece = document.createElement('div');
  piece.className = PIECE;
  piece.style.left = `${-tile.left}px`;
  piece.style.top = `${-tile.top}px`;
  piece.style.width = `${grid.width}px`;
  piece.style.height = `${grid.height}px`;
  piece.style.transformOrigin = `${tile.left + grid.size / 2}px ${tile.top + grid.size / 2}px`;
  piece.style.transform = `scale(${1 / cover})`;
  const clone = layer.cloneNode(true);
  clone.removeAttribute('class');
  clone.removeAttribute('data-visible');
  clone.removeAttribute('aria-hidden');
  clone.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;visibility:visible;';
  piece.appendChild(clone);
  const shade = document.createElement('div');
  shade.className = SHADE;
  face.append(piece, shade);
  face.style.transform = `scale(${cover})`;
  return { face, piece, shade };
};

function PixelSwap({
  firstContent,
  secondContent,
  effect = 'flip',
  pixelSize = 72,
  gap = 0,
  pixelRadius = 0,
  origin = 'pointer',
  axis = 'auto',
  duration = 1100,
  pixelDuration = 700,
  depth = 0.5,
  shading = 0.5,
  bounce = 0.3,
  randomness = 0.15,
  backdropColor = 'transparent',
  trigger = 'hover',
  initialActive = false,
  active,
  onActiveChange,
  onComplete,
  aspectRatio = '16 / 10',
  className = '',
  style
}) {
  const controlled = active !== undefined;
  const [shown, setShown] = useState(controlled ? active : initialActive);
  const rootRef = useRef(null);
  const wallRef = useRef(null);
  const layerRefs = useRef([]);
  const shownRef = useRef(shown);
  const desiredRef = useRef(shown);
  const pointRef = useRef(null);
  const engineRef = useRef({ running: false, to: false, animations: [], token: 0 });

  const settings = {
    effect: EFFECTS.includes(effect) ? effect : 'flip',
    pixelSize: Math.max(12, Math.round(pixelSize)),
    gap: Math.max(0, Math.round(gap)),
    pixelRadius: clamp(pixelRadius, 0, 50),
    origin: ORIGINS.includes(origin) ? origin : 'pointer',
    axis: AXES.includes(axis) ? axis : 'auto',
    duration: Math.max(200, duration),
    pixelDuration: Math.max(80, pixelDuration),
    depth: clamp(depth, 0, 1),
    shading: clamp(shading, 0, 1),
    bounce: clamp(bounce, 0, 1),
    randomness: clamp(randomness, 0, 1),
    backdropColor,
    onComplete
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const commit = target => {
    const root = rootRef.current;
    const engine = engineRef.current;
    engine.running = false;
    engine.animations.forEach(animation => animation.cancel());
    engine.animations = [];
    layerRefs.current.forEach((layer, index) =>
      layer?.setAttribute('data-visible', String(index === (target ? 1 : 0)))
    );
    root?.removeAttribute('data-swapping');
    wallRef.current?.replaceChildren();
    shownRef.current = target;
    setShown(target);
    settingsRef.current.onComplete?.(target);
  };

  const watch = () => {
    const engine = engineRef.current;
    engine.token += 1;
    const token = engine.token;
    Promise.all(engine.animations.map(animation => animation.finished))
      .then(() => {
        if (token === engine.token && engine.running) commit(engine.to);
      })
      .catch(() => {});
  };

  const start = (to, point) => {
    const root = rootRef.current;
    const wall = wallRef.current;
    const engine = engineRef.current;
    const s = settingsRef.current;
    const from = layerRefs.current[shownRef.current ? 1 : 0];
    const target = layerRefs.current[to ? 1 : 0];
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const width = root?.clientWidth ?? 0;
    const height = root?.clientHeight ?? 0;
    if (!root || !wall || !from || !target || reduce || !width || !height) {
      commit(to);
      return;
    }

    const grid = buildGrid(width, height, s.pixelSize, s.gap);
    const cover = (grid.size + s.gap + 1.5) / grid.size;
    const lift = grid.size * (0.15 + 0.65 * s.depth);
    const spread = Math.max(0, s.duration - s.pixelDuration);
    const tileMs = Math.min(s.pixelDuration, s.duration);
    const overshoot = 1 + 0.6 * s.bounce;
    const radius = `${s.pixelRadius}%`;
    const animations = [];
    const fragment = document.createDocumentFragment();

    wall.style.perspective = `${Math.max(width, height) * (2.6 - 1.8 * s.depth)}px`;
    wall.style.background = s.backdropColor;

    grid.tiles.forEach(tile => {
      const route = routeOf(tile, grid, s.origin, point);
      const order = route.order * (1 - s.randomness) + hash(tile.index) * s.randomness;
      const delay = order * spread;
      const element = document.createElement('div');
      element.className = TILE;
      element.style.left = `${tile.left}px`;
      element.style.top = `${tile.top}px`;
      element.style.width = `${grid.size}px`;
      element.style.height = `${grid.size}px`;
      const old = makeFace(from, tile, grid, cover);
      const next = makeFace(target, tile, grid, cover);
      const seal = [{ borderRadius: '0%' }, { borderRadius: radius, offset: 0.5 }, { borderRadius: '0%' }];
      const pieceSeal = [
        { transform: `scale(${1 / cover})` },
        { transform: 'scale(1)', offset: 0.5 },
        { transform: `scale(${1 / cover})` }
      ];

      if (s.effect === 'flip') {
        let ax = -route.dy;
        let ay = route.dx;
        let sign = 1;
        if (s.axis === 'x') {
          ax = 1;
          ay = 0;
          sign = route.dy >= 0 ? -1 : 1;
        } else if (s.axis === 'y') {
          ax = 0;
          ay = 1;
          sign = route.dx >= 0 ? 1 : -1;
        }
        const turn = angle => `rotate3d(${ax}, ${ay}, 0, ${angle * sign}deg)`;
        old.face.style.transform = '';
        next.face.style.transform = turn(180);
        element.append(old.face, next.face);
        const timing = {
          duration: tileMs,
          delay,
          easing: `cubic-bezier(0.6, 0, 0.3, ${overshoot})`,
          fill: 'both'
        };
        animations.push(
          element.animate(
            [
              { transform: `translateZ(0px) ${turn(0)} scale(${cover})` },
              { transform: `translateZ(${lift}px) ${turn(90)} scale(1)`, offset: 0.5 },
              { transform: `translateZ(0px) ${turn(180)} scale(${cover})` }
            ],
            timing
          ),
          old.piece.animate(pieceSeal, timing),
          next.piece.animate(pieceSeal, timing),
          old.shade.animate([{ opacity: 0 }, { opacity: s.shading * 0.85, offset: 0.5 }, { opacity: 0 }], timing),
          next.shade.animate([{ opacity: 0 }, { opacity: s.shading * 0.85, offset: 0.5 }, { opacity: 0 }], timing)
        );
        if (s.pixelRadius > 0) {
          animations.push(old.face.animate(seal, timing), next.face.animate(seal, timing));
        }
      } else if (s.effect === 'assemble') {
        const fall = grid.size * (0.5 + 0.9 * s.depth);
        const tilt = (hash(tile.index + 3) - 0.5) * 2;
        element.append(next.face, old.face);
        const out = { duration: tileMs * 0.8, delay, easing: 'cubic-bezier(0.5, 0, 0.75, 0)', fill: 'both' };
        const into = {
          duration: tileMs * 0.85,
          delay: delay + tileMs * 0.3,
          easing: `cubic-bezier(0.2, 0.8, 0.3, ${overshoot})`,
          fill: 'both'
        };
        animations.push(
          old.face.animate(
            [
              { transform: `translate3d(0px, 0px, 0px) rotateX(0deg) rotateZ(0deg) scale(${cover})`, opacity: 1 },
              {
                transform: `translate3d(${route.dx * fall * 0.6}px, ${route.dy * fall * 0.6 + fall}px, ${-lift}px) rotateX(${-50 - 30 * Math.abs(tilt)}deg) rotateZ(${tilt * 35}deg) scale(${cover * 0.85})`,
                opacity: 0
              }
            ],
            out
          ),
          old.shade.animate([{ opacity: 0 }, { opacity: s.shading * 0.7 }], out),
          next.face.animate(
            [
              {
                transform: `translate3d(0px, 0px, ${-lift * 2.2}px) rotateX(${20 * tilt}deg) scale(${cover * 0.6})`,
                opacity: 0,
                borderRadius: radius
              },
              { transform: `translate3d(0px, 0px, 0px) rotateX(0deg) scale(${cover})`, opacity: 1, borderRadius: '0%' }
            ],
            into
          ),
          next.shade.animate([{ opacity: s.shading * 0.8 }, { opacity: 0 }], into)
        );
      } else {
        element.append(old.face, next.face);
        const initial = 0.25;
        const timing = {
          duration: tileMs,
          delay,
          easing: `cubic-bezier(0.2, 0.8, 0.3, ${overshoot})`,
          fill: 'both'
        };
        animations.push(
          next.face.animate(
            [
              { transform: `scale(${cover * initial})`, opacity: 0, borderRadius: radius },
              { transform: `scale(${cover})`, opacity: 1, borderRadius: '0%' }
            ],
            timing
          ),
          next.piece.animate(
            [{ transform: `scale(${1 / (cover * initial)})` }, { transform: `scale(${1 / cover})` }],
            timing
          ),
          next.shade.animate([{ opacity: s.shading * 0.6 }, { opacity: 0 }], timing)
        );
      }
      fragment.appendChild(element);
    });

    wall.replaceChildren(fragment);
    root.setAttribute('data-swapping', '');
    engine.animations = animations;
    engine.running = true;
    engine.to = to;
    watch();
  };

  const request = (to, point) => {
    const engine = engineRef.current;
    if (engine.running) {
      if (engine.to === to) return;
      engine.to = to;
      engine.animations.forEach(animation => animation.reverse());
      watch();
      return;
    }
    if (shownRef.current === to) return;
    start(to, point);
  };
  const requestRef = useRef(request);
  requestRef.current = request;

  const ask = (next, point) => {
    desiredRef.current = next;
    pointRef.current = point;
    onActiveChange?.(next);
    if (!controlled) request(next, point);
  };

  useEffect(() => {
    if (active === undefined) return;
    desiredRef.current = active;
    requestRef.current(active, pointRef.current);
  }, [active]);

  useEffect(() => {
    const engine = engineRef.current;
    return () => {
      engine.token += 1;
      engine.animations.forEach(animation => animation.cancel());
      engine.animations = [];
      engine.running = false;
    };
  }, []);

  const pointOf = event => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect || event.clientX === undefined || (event.clientX === 0 && event.clientY === 0 && event.detail === 0))
      return null;
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const handlers = {};
  if (trigger === 'hover') {
    handlers.onPointerEnter = event => {
      if (event.pointerType === 'touch') return;
      ask(true, pointOf(event));
    };
    handlers.onPointerLeave = event => {
      if (event.pointerType === 'touch') return;
      ask(false, pointOf(event));
    };
    handlers.onClick = event => {
      const native = event.nativeEvent;
      const touch = 'pointerType' in native && native.pointerType === 'touch';
      if (touch || event.detail === 0) ask(!desiredRef.current, pointOf(event));
    };
    handlers.onFocus = event => {
      if (event.target === event.currentTarget && event.currentTarget.matches(':focus-visible')) ask(true, null);
    };
    handlers.onBlur = () => ask(false, null);
    handlers.tabIndex = 0;
  } else if (trigger === 'click') {
    handlers.onClick = event => ask(!desiredRef.current, pointOf(event));
    handlers.onKeyDown = event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      ask(!desiredRef.current, null);
    };
    handlers.role = 'button';
    handlers.tabIndex = 0;
    handlers['aria-pressed'] = shown;
  }

  return (
    <div
      ref={rootRef}
      className={[ROOT, className].filter(Boolean).join(' ')}
      style={{ aspectRatio, ...style }}
      data-active={shown ? '' : undefined}
      {...handlers}
    >
      {[firstContent, secondContent].map((content, index) => (
        <div
          key={index}
          ref={element => {
            layerRefs.current[index] = element;
          }}
          className={LAYER}
          data-visible={String(index === (shown ? 1 : 0))}
          aria-hidden={index !== (shown ? 1 : 0)}
        >
          {content}
        </div>
      ))}
      <div ref={wallRef} className={WALL} aria-hidden="true" />
    </div>
  );
}

export default PixelSwap;
