'use client';

import { useEffect, useRef } from 'react';

import './PixelTransition.css';

const PATTERNS = ['random', 'dither', 'ripple', 'wipe'];
const ANIMATIONS = ['pop', 'grow', 'fade'];
const SHAPES = ['square', 'rounded', 'circle'];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const WINDOW = 0.35;
const SEAL = 0.22;
const TONES = 5;
const LEVELS = 16;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const smooth = t => t * t * (3 - 2 * t);

const hash = (x, y, seed) => {
  let h = Math.imul(x + 1, 0x27d4eb2d) ^ Math.imul(y + 1, 0x165667b1) ^ Math.imul(seed + 1, 0x2c1b3c6d);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

function PixelTransition({
  firstContent,
  secondContent,
  gridSize = 10,
  pixelColor = '#ffffff',
  mosaic = 0,
  animationStepDuration = 0.4,
  pattern = 'random',
  randomness = 0.3,
  pixelAnimation = 'pop',
  pixelShape = 'square',
  gap = 0,
  fps = 0,
  trigger = 'hover',
  active,
  once = false,
  onActiveChange,
  aspectRatio = '100%',
  className = '',
  style
}) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const firstRef = useRef(null);
  const secondRef = useRef(null);
  const controlRef = useRef(null);
  const pointRef = useRef(null);
  const hoverRef = useRef(false);
  const focusRef = useRef(false);
  const pointerRef = useRef('mouse');
  const initialRef = useRef(active ? 1 : 0);
  const settings = {
    gridSize: clamp(Math.round(gridSize), 2, 80),
    pixelColor,
    mosaic: clamp(mosaic, 0, 1),
    duration: Math.max(0.05, animationStepDuration),
    pattern: PATTERNS.includes(pattern) ? pattern : 'random',
    randomness: clamp(randomness, 0, 1),
    animation: ANIMATIONS.includes(pixelAnimation) ? pixelAnimation : 'pop',
    shape: SHAPES.includes(pixelShape) ? pixelShape : 'square',
    gap: Math.max(0, gap),
    fps: clamp(fps, 0, 120),
    once
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!root || !canvas || !ctx) return undefined;

    const probe = document.createElement('canvas');
    probe.width = 1;
    probe.height = 1;
    const probeCtx = probe.getContext('2d', { willReadFrequently: true });
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const state = {
      progress: 0,
      base: initialRef.current,
      goal: initialRef.current,
      shown: initialRef.current,
      seed: 1,
      originX: 0.5,
      originY: 0.5,
      edge: 'left',
      tones: ['#ffffff'],
      toneKey: '',
      dpr: 1
    };
    let raf = 0;
    let last = 0;
    let drawnAt = 0;
    let alive = true;

    const resolveTones = () => {
      const s = settingsRef.current;
      canvas.style.color = s.pixelColor;
      const color = getComputedStyle(canvas).color;
      canvas.style.color = '';
      let rgba = [255, 255, 255, 1];
      if (probeCtx) {
        probeCtx.clearRect(0, 0, 1, 1);
        probeCtx.fillStyle = color;
        probeCtx.fillRect(0, 0, 1, 1);
        const data = probeCtx.getImageData(0, 0, 1, 1).data;
        rgba = [data[0], data[1], data[2], data[3] / 255];
      }
      const target = (0.2126 * rgba[0] + 0.7152 * rgba[1] + 0.0722 * rgba[2]) / 255 > 0.5 ? 0 : 255;
      state.tones = Array.from({ length: TONES }, (_, index) => {
        const mix = s.mosaic * 0.5 * (index / (TONES - 1));
        const [r, g, b] = rgba.slice(0, 3).map(value => Math.round(value + (target - value) * mix));
        return `rgba(${r}, ${g}, ${b}, ${rgba[3]})`;
      });
      state.toneKey = `${s.pixelColor}|${s.mosaic}`;
    };

    const show = index => {
      state.shown = index;
      if (firstRef.current) firstRef.current.style.visibility = index === 0 ? '' : 'hidden';
      if (secondRef.current) secondRef.current.style.visibility = index === 1 ? '' : 'hidden';
    };

    const draw = () => {
      const s = settingsRef.current;
      const { width, height } = canvas;
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, width, height);
      const progress = state.progress;
      if (progress <= 0 || progress >= 1) return;
      if (state.toneKey !== `${s.pixelColor}|${s.mosaic}`) resolveTones();

      const covering = progress < 0.5;
      const local = covering ? progress * 2 : progress * 2 - 1;
      const seal = covering ? smooth(clamp((local - 1 + SEAL) / SEAL, 0, 1)) : 1 - smooth(clamp(local / SEAL, 0, 1));
      const cols = s.gridSize;
      const cell = width / cols;
      const rows = Math.ceil(height / cell);
      const top = (height - rows * cell) / 2;
      const gap = Math.min(cell * 0.8, s.gap * state.dpr) * (1 - seal);
      const ox = state.originX * width;
      const oy = state.originY * height;
      const far = Math.max(
        Math.hypot(ox, oy),
        Math.hypot(width - ox, oy),
        Math.hypot(ox, height - oy),
        Math.hypot(width - ox, height - oy)
      );
      const paths = new Map();

      for (let row = 0; row < rows; row++) {
        const y0 = top + row * cell;
        const cy = y0 + cell / 2;
        for (let col = 0; col < cols; col++) {
          const x0 = col * cell;
          const cx = x0 + cell / 2;
          const noise = hash(col, row, state.seed);
          let delay = noise;
          if (s.pattern === 'dither') delay = (BAYER[(row & 3) * 4 + (col & 3)] + noise) / 16;
          else if (s.pattern !== 'random') {
            let base;
            if (s.pattern === 'ripple') base = Math.hypot(cx - ox, cy - oy) / Math.max(1, far);
            else if (state.edge === 'left') base = cx / width;
            else if (state.edge === 'right') base = 1 - cx / width;
            else if (state.edge === 'top') base = cy / height;
            else base = 1 - cy / height;
            delay = clamp(base, 0, 1) * (1 - s.randomness) + noise * s.randomness;
          }

          let amount;
          if (s.animation === 'pop') amount = local >= delay === covering ? 1 : 0;
          else {
            const t = smooth(clamp((local - delay * (1 - WINDOW)) / WINDOW, 0, 1));
            amount = covering ? t : 1 - t;
          }
          if (amount <= 0.002) continue;

          const size = (s.animation === 'grow' ? cell * amount : cell) - gap;
          if (size <= 0) continue;
          const level = s.animation === 'fade' ? Math.max(1, Math.round(amount * LEVELS)) : LEVELS;
          const tone = s.mosaic > 0 ? Math.floor(hash(col, row, 7) * TONES) : 0;
          const key = tone * (LEVELS + 1) + level;
          let path = paths.get(key);
          if (!path) {
            path = new Path2D();
            paths.set(key, path);
          }

          if (s.shape === 'circle') {
            const radius = (size / 2) * (1 + 0.45 * seal);
            path.moveTo(cx + radius, cy);
            path.arc(cx, cy, radius, 0, Math.PI * 2);
          } else if (s.shape === 'rounded' && seal < 1 && path.roundRect) {
            path.roundRect(cx - size / 2, cy - size / 2, size, size, size * 0.3 * (1 - seal));
          } else if (size >= cell - 0.01) {
            const left = Math.round(x0);
            const upper = Math.round(y0);
            path.rect(left, upper, Math.round(x0 + cell) - left, Math.round(y0 + cell) - upper);
          } else {
            path.rect(cx - size / 2, cy - size / 2, size, size);
          }
        }
      }

      paths.forEach((path, key) => {
        ctx.globalAlpha = (key % (LEVELS + 1)) / LEVELS;
        ctx.fillStyle = state.tones[Math.floor(key / (LEVELS + 1))] ?? state.tones[0];
        ctx.fill(path);
      });
      ctx.globalAlpha = 1;
    };

    const paint = () => {
      const index = state.progress >= 0.5 ? 1 - state.base : state.base;
      if (index !== state.shown) show(index);
      draw();
    };

    const frame = now => {
      raf = 0;
      if (!alive) return;
      const s = settingsRef.current;
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60;
      last = now;
      const aim = state.goal === state.base ? 0 : 1;
      const step = reduce ? 1 : dt / (2 * s.duration);
      state.progress =
        aim > state.progress ? Math.min(aim, state.progress + step) : Math.max(aim, state.progress - step);
      const settled = state.progress === aim;
      if (settled && aim === 1) {
        state.base = 1 - state.base;
        state.progress = 0;
      }
      if (settled || !s.fps || now - drawnAt >= 1000 / s.fps - 2) {
        drawnAt = now;
        paint();
      }
      if (!settled) raf = requestAnimationFrame(frame);
    };

    const start = point => {
      const rect = root.getBoundingClientRect();
      const x = point ? clamp((point.x - rect.left) / Math.max(1, rect.width), 0, 1) : 0.5;
      const y = point ? clamp((point.y - rect.top) / Math.max(1, rect.height), 0, 1) : 0.5;
      state.originX = x;
      state.originY = y;
      state.seed = Math.floor(Math.random() * 65536);
      if (!point) state.edge = 'left';
      else {
        const sides = [
          ['left', x * rect.width],
          ['right', (1 - x) * rect.width],
          ['top', y * rect.height],
          ['bottom', (1 - y) * rect.height]
        ];
        state.edge = sides.reduce((best, side) => (side[1] < best[1] ? side : best))[0];
      }
      resolveTones();
    };

    const go = (next, point) => {
      const goal = next ? 1 : 0;
      if (goal === state.goal) return;
      if (!goal && settingsRef.current.once) return;
      state.goal = goal;
      if (state.progress === 0 && goal !== state.base) start(point);
      if (raf) return;
      last = 0;
      drawnAt = 0;
      raf = requestAnimationFrame(frame);
    };

    controlRef.current = { go, goal: () => state.goal };

    const resize = () => {
      state.dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(root.clientWidth * state.dpr));
      canvas.height = Math.max(1, Math.round(root.clientHeight * state.dpr));
      draw();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    resize();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      controlRef.current = null;
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (active === undefined) return;
    controlRef.current?.go(active, pointRef.current);
    pointRef.current = null;
  }, [active]);

  const hover = trigger !== 'click';

  const request = (next, point) => {
    const control = controlRef.current;
    if (!control || (!next && once && control.goal() === 1)) return;
    if (active === undefined) control.go(next, point);
    else pointRef.current = point;
    onActiveChange?.(next);
  };

  const pointOf = event => ({ x: event.clientX, y: event.clientY });

  const onPointerEnter = event => {
    if (event.pointerType === 'touch') return;
    hoverRef.current = true;
    if (hover) request(true, pointOf(event));
  };

  const onPointerLeave = event => {
    if (event.pointerType === 'touch') return;
    hoverRef.current = false;
    if (hover && !focusRef.current) request(false, pointOf(event));
  };

  const onPointerDown = event => {
    pointerRef.current = event.pointerType;
  };

  const onClick = event => {
    if (hover && pointerRef.current !== 'touch') return;
    request(controlRef.current?.goal() !== 1, pointOf(event));
  };

  const onFocus = event => {
    if (!hover || event.currentTarget.contains(event.relatedTarget)) return;
    if (!event.target.matches(':focus-visible')) return;
    focusRef.current = true;
    request(true, null);
  };

  const onBlur = event => {
    if (!focusRef.current || event.currentTarget.contains(event.relatedTarget)) return;
    focusRef.current = false;
    if (!hoverRef.current) request(false, null);
  };

  const onKeyDown = event => {
    if (hover || event.target !== event.currentTarget) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    request(controlRef.current?.goal() !== 1, null);
  };

  const ratio = String(aspectRatio).trim();
  const padded = ratio.endsWith('%');

  return (
    <div
      ref={rootRef}
      className={`pixelated-image-card${className ? ` ${className}` : ''}`}
      style={padded ? style : { aspectRatio: ratio, ...style }}
      tabIndex={0}
      role={hover ? undefined : 'button'}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      onClick={onClick}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
    >
      {padded && <div style={{ paddingTop: ratio }} />}
      <div
        ref={firstRef}
        className="pixelated-image-card__default"
        style={{ visibility: initialRef.current === 0 ? undefined : 'hidden' }}
      >
        {firstContent}
      </div>
      <div
        ref={secondRef}
        className="pixelated-image-card__active"
        style={{ visibility: initialRef.current === 1 ? undefined : 'hidden' }}
      >
        {secondContent}
      </div>
      <canvas ref={canvasRef} className="pixelated-image-card__pixels" aria-hidden="true" />
    </div>
  );
}

export default PixelTransition;
