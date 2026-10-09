'use client';

import { isValidElement, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CommandIcon,
  Drag04Icon,
  Image01Icon,
  Layers01Icon,
  Timer02Icon
} from '@hugeicons/core-free-icons';

import './Carousel.css';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const DEFAULT_ITEMS = [
  {
    id: 1,
    title: 'Swipe with momentum',
    description: 'Fling the cards and they glide into place.',
    icon: <HugeiconsIcon icon={Drag04Icon} size={16} strokeWidth={1.8} />
  },
  {
    id: 2,
    title: 'Autoplay with a timer',
    description: 'The indicator fills up so people know what comes next.',
    icon: <HugeiconsIcon icon={Timer02Icon} size={16} strokeWidth={1.8} />
  },
  {
    id: 3,
    title: 'Five transitions',
    description: 'Tilt, slide, scale, fade or turn the cards like a cube.',
    icon: <HugeiconsIcon icon={Layers01Icon} size={16} strokeWidth={1.8} />
  },
  {
    id: 4,
    title: 'Keyboard friendly',
    description: 'Arrow keys, Home and End move between the cards.',
    icon: <HugeiconsIcon icon={CommandIcon} size={16} strokeWidth={1.8} />
  },
  {
    id: 5,
    title: 'Bring any content',
    description: 'Pass text, images or your own components as cards.',
    icon: <HugeiconsIcon icon={Image01Icon} size={16} strokeWidth={1.8} />
  }
];

const THEMES = {
  dark: {
    '--carousel-frame': 'rgba(38, 35, 46, 0.66)',
    '--carousel-frame-edge': 'rgba(255, 255, 255, 0.08)',
    '--carousel-frame-highlight': 'rgba(255, 255, 255, 0.07)',
    '--carousel-frame-shadow': '0 22px 44px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)',
    '--carousel-tile': 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
    '--carousel-tile-edge': 'rgba(255, 255, 255, 0.07)',
    '--carousel-tile-highlight': 'rgba(255, 255, 255, 0.12)',
    '--carousel-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    '--carousel-ink': '#f4f4f5',
    '--carousel-muted': 'rgba(244, 244, 245, 0.6)',
    '--carousel-faint': 'rgba(255, 255, 255, 0.22)',
    '--carousel-soft': 'rgba(255, 255, 255, 0.42)',
    '--carousel-badge': 'rgba(255, 255, 255, 0.08)',
    '--carousel-hover': 'brightness(1.12)',
    '--carousel-press': 'brightness(0.8)'
  },
  light: {
    '--carousel-frame': 'rgba(240, 240, 243, 0.8)',
    '--carousel-frame-edge': 'rgba(24, 24, 27, 0.07)',
    '--carousel-frame-highlight': 'rgba(255, 255, 255, 0.95)',
    '--carousel-frame-shadow': '0 22px 44px -22px rgba(24, 24, 27, 0.3), 0 6px 16px -10px rgba(24, 24, 27, 0.16)',
    '--carousel-tile': 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
    '--carousel-tile-edge': 'rgba(24, 24, 27, 0.08)',
    '--carousel-tile-highlight': 'rgba(255, 255, 255, 1)',
    '--carousel-tile-shadow': '0 4px 10px -5px rgba(24, 24, 27, 0.25)',
    '--carousel-ink': '#27272a',
    '--carousel-muted': 'rgba(39, 39, 42, 0.6)',
    '--carousel-faint': 'rgba(24, 24, 27, 0.16)',
    '--carousel-soft': 'rgba(24, 24, 27, 0.34)',
    '--carousel-badge': 'rgba(24, 24, 27, 0.05)',
    '--carousel-hover': 'brightness(0.97)',
    '--carousel-press': 'brightness(0.92)'
  }
};

const EFFECTS = ['tilt', 'slide', 'scale', 'fade', 'cube'];
const STIFFNESS = 150;
const DAMPING = 24;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const wrap = (value, count) => ((value % count) + count) % count;
const nearest = (offset, count) => wrap(offset + count / 2, count) - count / 2;

const smootherstep = t => t * t * t * (t * (t * 6 - 15) + 10);

const edgeMask = size => {
  const stops = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1].map(t => [smootherstep(t).toFixed(3), (t * size).toFixed(1)]);
  const left = stops.map(([alpha, x]) => `rgba(0, 0, 0, ${alpha}) ${x}px`);
  const right = [...stops].reverse().map(([alpha, x]) => `rgba(0, 0, 0, ${alpha}) calc(100% - ${x}px)`);
  return `linear-gradient(to right, ${[...left, ...right].join(', ')})`;
};

const band = (value, max) => {
  if (value < 0) return -0.3 * (1 - Math.exp(value / 0.55));
  if (value > max) return max + 0.3 * (1 - Math.exp((max - value) / 0.55));
  return value;
};

const pose = (index, position, s) => {
  const offset = s.loop ? nearest(index - position, s.count) : index - position;
  const distance = Math.abs(offset);
  const near = Math.min(distance, 1);
  const result = {
    transform: 'none',
    opacity: 1,
    visible: true,
    layer: 10 - Math.min(9, Math.round(distance * 2)),
    shade: 0,
    focus: 1
  };
  if (s.mode === 'fade') {
    const half = Math.min(1, near * 2);
    result.visible = distance < 1;
    result.opacity = 1 - near * near * (3 - 2 * near);
    result.transform = `scale(${1 - 0.04 * near})`;
    result.focus = 1 - half * half * (3 - 2 * half);
    return result;
  }
  if (s.mode === 'cube') {
    const half = s.cardWidth / 2;
    const turn = Math.sin(Math.PI * (position - Math.floor(position)));
    result.visible = distance < 1;
    result.transform = `scale(${1 - 0.12 * turn}) translateZ(${-half}px) rotateY(${clamp(offset, -1, 1) * 90}deg) translateZ(${half}px)`;
    result.shade = near * s.shade;
    return result;
  }
  let x = offset * s.span;
  result.visible = x > -(s.inset + s.cardWidth + 2) && x < s.width + s.bleed * 2 - s.inset + 2;
  result.focus = 1 - near * near * (3 - 2 * near);
  if (s.mode === 'tilt') {
    result.visible = result.visible && distance < 1;
    result.transform = `translate3d(${x}px, 0, 0) rotateY(${-clamp(offset, -1, 1) * 90}deg)`;
  } else if (s.mode === 'scale') {
    x -= Math.sign(offset) * near * s.cardWidth * 0.06;
    result.transform = `translate3d(${x}px, 0, 0) scale(${1 - 0.12 * near})`;
    result.opacity = 1 - 0.5 * near;
  } else {
    result.transform = `translate3d(${x}px, 0, 0)`;
  }
  return result;
};

const keyOf = (item, index) => {
  if (isValidElement(item)) return item.key ?? index;
  if (typeof item === 'object' && item?.id != null) return item.id;
  return index;
};

const Chevron = ({ flip }) => (
  <HugeiconsIcon icon={flip ? ArrowLeft01Icon : ArrowRight01Icon} size={16} strokeWidth={2} />
);

const Card = ({ item, round, compact }) => {
  if (isValidElement(item)) {
    return (
      <div className={`carousel-card is-custom${round ? ' is-round' : ''}`}>
        {item}
        <span className="carousel-card-rim" />
      </div>
    );
  }
  const { image, alt = '', icon: mark, title, description } = typeof item === 'string' ? { image: item } : (item ?? {});
  const text = Boolean(title || description);
  return (
    <div className={`carousel-card${image ? ' has-image' : ''}${round ? ' is-round' : ''}`}>
      {image && <img className="carousel-image" src={image} alt={alt} draggable={false} decoding="async" />}
      {image && text && <span className="carousel-scrim" />}
      {mark && <span className="carousel-icon">{mark}</span>}
      {text && (
        <div className="carousel-text">
          {title && <div className="carousel-title">{title}</div>}
          {description && !compact && <p className="carousel-description">{description}</p>}
        </div>
      )}
      <span className="carousel-card-rim" />
    </div>
  );
};

export default function Carousel({
  items = DEFAULT_ITEMS,
  baseWidth = 300,
  aspectRatio = 1.25,
  peek = 0,
  gap = 16,
  radius = 12,
  frame = true,
  effect = 'tilt',
  indicator = 'dots',
  arrows = false,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  loop = false,
  draggable = true,
  round = false,
  initialIndex = 0,
  theme = 'dark',
  onChange,
  className = '',
  style
}) {
  const count = items.length;
  const mode = EFFECTS.includes(effect) ? effect : 'tilt';
  const stacked = mode === 'fade' || mode === 'cube';
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const viewportRef = useRef(null);
  const slideRefs = useRef([]);
  const shadeRefs = useRef([]);
  const fillRefs = useRef([]);
  const counterRef = useRef(null);
  const engineRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const ratio = clamp(aspectRatio, 0.3, 4);
  const maxWidth =
    typeof baseWidth === 'number' && round && frame ? 20 + (baseWidth - 20) * Math.min(1, 1 / ratio) : baseWidth;
  const [width, setWidth] = useState(typeof maxWidth === 'number' ? maxWidth - (frame ? 20 : 0) : 300);
  const [active, setActive] = useState(() => clamp(Math.round(initialIndex), 0, Math.max(0, count - 1)));
  const startRef = useRef(active);
  const reportedRef = useRef(active);
  const previousRef = useRef(active);

  const side = stacked || (round && frame) ? 0 : clamp(peek, 0, width * 0.2);
  const slot = Math.max(40, width - side * 2);
  const diameter = frame ? slot : Math.min(slot, slot / ratio);
  const cardWidth = round ? diameter : slot;
  const cardHeight = round ? diameter : slot / ratio;
  const clipped = !frame && !stacked;
  const bleed = clipped ? Math.round(Math.min(48, cardWidth * 0.12)) : 0;
  const inset = bleed + (width - cardWidth) / 2;
  const settings = {
    count,
    mode,
    width,
    bleed,
    inset,
    cardWidth,
    span: cardWidth + Math.max(0, gap),
    loop: loop && count > 1,
    autoplay: autoplay && count > 1,
    autoplayDelay: Math.max(600, autoplayDelay),
    pauseOnHover,
    draggable: draggable && count > 1,
    bars: indicator === 'bars',
    shade: theme === 'light' ? 0.3 : 0.6
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const viewport = viewportRef.current;
    if (!root || !stage || !viewport) return undefined;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const state = {
      p: startRef.current,
      v: 0,
      target: startRef.current,
      shown: startRef.current,
      elapsed: 0,
      hovered: false,
      focused: false,
      visible: true,
      drag: null,
      wheeling: false,
      wheelTimer: 0,
      suppress: false,
      last: 0
    };
    let raf = 0;
    let alive = true;

    const unit = s => (s.mode === 'fade' || s.mode === 'cube' ? s.cardWidth : s.span);
    const limit = (s, value) => (s.loop ? value : clamp(value, 0, s.count - 1));

    const apply = () => {
      const s = settingsRef.current;
      for (let i = 0; i < s.count; i++) {
        const slide = slideRefs.current[i];
        if (!slide) continue;
        const next = pose(i, state.p, s);
        slide.style.transform = next.transform;
        slide.style.opacity = String(next.opacity);
        slide.style.visibility = next.visible ? 'visible' : 'hidden';
        slide.style.zIndex = String(next.layer);
        slide.style.setProperty('--carousel-focus', String(next.focus));
        const shade = shadeRefs.current[i];
        if (shade) shade.style.opacity = String(next.shade);
      }
      if (!s.bars) return;
      const progress = s.autoplay ? clamp(state.elapsed / s.autoplayDelay, 0, 1) : 1;
      for (let i = 0; i < s.count; i++) {
        const fill = fillRefs.current[i];
        if (fill) fill.style.transform = `scaleX(${i < state.shown ? 1 : i === state.shown ? progress : 0})`;
      }
    };

    const announce = () => {
      const s = settingsRef.current;
      if (!s.count) return;
      const index = s.loop ? wrap(Math.round(state.target), s.count) : clamp(Math.round(state.target), 0, s.count - 1);
      if (index === state.shown) return;
      state.shown = index;
      setActive(index);
    };

    const paused = s =>
      (s.pauseOnHover && state.hovered) ||
      state.focused ||
      Boolean(state.drag) ||
      state.wheeling ||
      !state.visible ||
      document.hidden;

    const tick = now => {
      raf = 0;
      if (!alive) return;
      const s = settingsRef.current;
      const dt = state.last ? Math.min(0.05, (now - state.last) / 1000) : 1 / 60;
      state.last = now;
      let busy = false;
      if (!state.drag?.moved && !state.wheeling) {
        if (reduce) {
          state.p = state.target;
          state.v = 0;
        } else {
          const steps = Math.ceil(dt * 240);
          const h = dt / steps;
          for (let k = 0; k < steps; k++) {
            state.v += (STIFFNESS * (state.target - state.p) - DAMPING * state.v) * h;
            state.p += state.v * h;
          }
          if (Math.abs(state.target - state.p) < 0.0004 && Math.abs(state.v) < 0.004) {
            state.p = state.target;
            state.v = 0;
          } else {
            busy = true;
          }
        }
        if (!busy && s.loop && s.count) {
          state.target = wrap(Math.round(state.target), s.count);
          state.p = state.target;
        }
      }
      if (s.autoplay && !paused(s)) {
        state.elapsed += dt * 1000;
        if (state.elapsed >= s.autoplayDelay) step(1, true);
        busy = true;
      }
      apply();
      if (busy) raf = requestAnimationFrame(tick);
      else state.last = 0;
    };

    const wake = () => {
      if (!raf && alive) raf = requestAnimationFrame(tick);
    };

    const moveTo = target => {
      state.target = target;
      state.elapsed = 0;
      announce();
      apply();
      wake();
    };

    const step = (direction, auto = false) => {
      const s = settingsRef.current;
      if (s.count < 2) return;
      let next = Math.round(state.target) + direction;
      if (!s.loop) {
        if (auto && next > s.count - 1) next = 0;
        next = clamp(next, 0, s.count - 1);
      }
      moveTo(next);
    };

    const goTo = index => {
      const s = settingsRef.current;
      if (!s.count) return;
      const goal = clamp(Math.round(index), 0, s.count - 1);
      const current = Math.round(state.target);
      moveTo(s.loop ? current + nearest(goal - wrap(current, s.count), s.count) : goal);
    };

    const onPointerDown = event => {
      const s = settingsRef.current;
      if (!s.draggable || (event.pointerType === 'mouse' && event.button !== 0)) return;
      state.drag = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        p: state.p,
        from: 0,
        moved: false,
        samples: []
      };
    };

    const onPointerMove = event => {
      const drag = state.drag;
      if (!drag || event.pointerId !== drag.id) return;
      const s = settingsRef.current;
      if (!drag.moved) {
        const dx = event.clientX - drag.x;
        const dy = event.clientY - drag.y;
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          state.drag = null;
          return;
        }
        drag.moved = true;
        drag.x = event.clientX;
        drag.p = state.p;
        drag.from = Math.round(state.target);
        viewport.setPointerCapture?.(event.pointerId);
        viewport.dataset.dragging = 'true';
      }
      const raw = drag.p - (event.clientX - drag.x) / unit(s);
      state.p = s.loop ? raw : band(raw, s.count - 1);
      state.v = 0;
      state.target = Math.round(limit(s, state.p));
      drag.samples.push([event.timeStamp, event.clientX]);
      if (drag.samples.length > 8) drag.samples.shift();
      announce();
      apply();
    };

    const onPointerUp = event => {
      const drag = state.drag;
      if (!drag || event.pointerId !== drag.id) return;
      state.drag = null;
      delete viewport.dataset.dragging;
      if (!drag.moved) {
        wake();
        return;
      }
      state.suppress = true;
      window.setTimeout(() => {
        state.suppress = false;
      }, 0);
      const s = settingsRef.current;
      const sample = drag.samples.find(([time]) => event.timeStamp - time < 90) ?? [event.timeStamp, event.clientX];
      const elapsed = Math.max(16, event.timeStamp - sample[0]);
      const velocity = clamp(((sample[1] - event.clientX) / elapsed) * (1000 / unit(s)), -12, 12);
      const travelled = state.p - drag.from;
      let target = Math.round(state.p + velocity * 0.2);
      if (target === drag.from) {
        if (Math.abs(velocity) > 0.8) target += Math.sign(velocity);
        else if (Math.abs(travelled) > 0.18) target += Math.sign(travelled);
      }
      if (!s.loop) target = clamp(target, 0, s.count - 1);
      const inside = s.loop || (state.p >= 0 && state.p <= s.count - 1);
      state.v = inside ? velocity : 0;
      moveTo(target);
    };

    const onClickCapture = event => {
      if (!state.suppress) return;
      event.preventDefault();
      event.stopPropagation();
      state.suppress = false;
    };

    const onWheel = event => {
      const s = settingsRef.current;
      if (!s.draggable || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      const raw = state.p + event.deltaX / unit(s);
      state.p = s.loop ? raw : clamp(raw, -0.15, s.count - 0.85);
      state.v = 0;
      state.wheeling = true;
      state.target = Math.round(limit(s, state.p));
      announce();
      apply();
      window.clearTimeout(state.wheelTimer);
      state.wheelTimer = window.setTimeout(() => {
        state.wheeling = false;
        moveTo(Math.round(limit(settingsRef.current, state.p)));
      }, 120);
    };

    const onKeyDown = event => {
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"]'))
        return;
      const s = settingsRef.current;
      const keys = {
        ArrowRight: () => step(1),
        ArrowLeft: () => step(-1),
        Home: () => goTo(0),
        End: () => goTo(s.count - 1)
      };
      if (!keys[event.key]) return;
      event.preventDefault();
      keys[event.key]();
    };

    const onEnter = () => {
      state.hovered = true;
    };

    const onLeave = () => {
      state.hovered = false;
      wake();
    };

    const onFocusIn = () => {
      try {
        state.focused = root.matches(':focus-visible') || Boolean(root.querySelector(':focus-visible'));
      } catch {
        state.focused = false;
      }
    };

    const onFocusOut = event => {
      if (root.contains(event.relatedTarget)) return;
      state.focused = false;
      wake();
    };

    const onVisibility = () => {
      if (document.hidden) return;
      state.last = 0;
      wake();
    };

    const resizeObserver = new ResizeObserver(entries => {
      const box = entries[entries.length - 1]?.contentRect;
      if (box) setWidth(Math.max(1, Math.round(box.width)));
    });
    resizeObserver.observe(stage);
    const visibility = new IntersectionObserver(entries => {
      state.visible = entries.some(entry => entry.isIntersecting);
      if (state.visible) wake();
    });
    visibility.observe(root);

    viewport.addEventListener('pointerdown', onPointerDown);
    viewport.addEventListener('pointermove', onPointerMove);
    viewport.addEventListener('pointerup', onPointerUp);
    viewport.addEventListener('pointercancel', onPointerUp);
    viewport.addEventListener('click', onClickCapture, true);
    viewport.addEventListener('wheel', onWheel, { passive: false });
    root.addEventListener('keydown', onKeyDown);
    root.addEventListener('mouseenter', onEnter);
    root.addEventListener('mouseleave', onLeave);
    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('focusout', onFocusOut);
    document.addEventListener('visibilitychange', onVisibility);

    engineRef.current = {
      goTo,
      step,
      sync: () => {
        const s = settingsRef.current;
        if (!s.loop && s.count) {
          state.target = clamp(Math.round(state.target), 0, s.count - 1);
          state.p = clamp(state.p, -0.3, s.count - 0.7);
        }
        announce();
        apply();
        wake();
      }
    };
    engineRef.current.sync();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(state.wheelTimer);
      engineRef.current = null;
      resizeObserver.disconnect();
      visibility.disconnect();
      viewport.removeEventListener('pointerdown', onPointerDown);
      viewport.removeEventListener('pointermove', onPointerMove);
      viewport.removeEventListener('pointerup', onPointerUp);
      viewport.removeEventListener('pointercancel', onPointerUp);
      viewport.removeEventListener('click', onClickCapture, true);
      viewport.removeEventListener('wheel', onWheel);
      root.removeEventListener('keydown', onKeyDown);
      root.removeEventListener('mouseenter', onEnter);
      root.removeEventListener('mouseleave', onLeave);
      root.removeEventListener('focusin', onFocusIn);
      root.removeEventListener('focusout', onFocusOut);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useIsomorphicLayoutEffect(() => {
    engineRef.current?.sync();
  });

  useEffect(() => {
    if (reportedRef.current === active) return;
    reportedRef.current = active;
    onChangeRef.current?.(active);
  }, [active]);

  useIsomorphicLayoutEffect(() => {
    const previous = previousRef.current;
    previousRef.current = active;
    const counter = counterRef.current;
    if (!counter?.animate || previous === active) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const delta = loop && count > 1 ? nearest(active - previous, count) : active - previous;
    counter.animate(
      [
        { transform: `translateY(${delta > 0 ? 70 : -70}%)`, opacity: 0 },
        { transform: 'translateY(0)', opacity: 1 }
      ],
      { duration: 320, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
    );
  }, [active, count, loop]);

  const controls = count > 1 && (indicator !== 'none' || arrows);
  const atStart = !settings.loop && active === 0;
  const atEnd = !settings.loop && active === count - 1;
  const perspective = mode === 'cube' ? `${Math.round(cardWidth * 2.6)}px` : mode === 'tilt' ? '1000px' : undefined;
  const mask = clipped ? edgeMask(inset) : undefined;

  const controlsNode = controls ? (
    <div className="carousel-controls" style={{ width: cardWidth }}>
      {arrows && (
        <button
          type="button"
          className="carousel-arrow"
          aria-label="Previous slide"
          disabled={atStart}
          onClick={() => engineRef.current?.step(-1)}
        >
          <Chevron flip />
        </button>
      )}

      {indicator === 'dots' && (
        <div className="carousel-dots">
          {items.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`carousel-dot${index === active ? ' is-active' : ''}`}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === active ? 'true' : undefined}
              onClick={() => engineRef.current?.goTo(index)}
            >
              <span className="carousel-dot-mark" />
            </button>
          ))}
        </div>
      )}

      {indicator === 'bars' && (
        <div className="carousel-bars">
          {items.map((_, index) => (
            <button
              key={index}
              type="button"
              className="carousel-bar"
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === active ? 'true' : undefined}
              onClick={() => engineRef.current?.goTo(index)}
            >
              <span className="carousel-bar-track">
                <span
                  ref={element => {
                    fillRefs.current[index] = element;
                  }}
                  className="carousel-bar-fill"
                  style={{
                    transform: `scaleX(${index < active ? 1 : index === active && !settings.autoplay ? 1 : 0})`
                  }}
                />
              </span>
            </button>
          ))}
        </div>
      )}

      {indicator === 'counter' && (
        <div className="carousel-counter">
          <span ref={counterRef} className="carousel-counter-current">
            {String(active + 1).padStart(2, '0')}
          </span>
          <span>/</span>
          <span>{String(count).padStart(2, '0')}</span>
        </div>
      )}

      {arrows && (
        <button
          type="button"
          className="carousel-arrow"
          aria-label="Next slide"
          disabled={atEnd}
          onClick={() => engineRef.current?.step(1)}
        >
          <Chevron />
        </button>
      )}
    </div>
  ) : null;
  const inside = frame && !round;

  return (
    <div
      ref={rootRef}
      className={`carousel-container${frame ? ' has-frame' : ''}${round ? ' is-round' : ''}${className ? ` ${className}` : ''}`}
      style={{
        ...(THEMES[theme] ?? THEMES.dark),
        '--carousel-radius': `${round ? 9999 : Math.max(0, radius)}px`,
        '--carousel-scale': clamp(cardWidth / 300, 0.86, 1),
        ...(typeof maxWidth === 'number' ? { width: '100%', maxWidth } : { width: maxWidth }),
        ...style
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Carousel"
      tabIndex={0}
    >
      <div ref={stageRef} className="carousel-stage">
        <div
          ref={viewportRef}
          className="carousel-viewport"
          data-draggable={settings.draggable ? 'true' : undefined}
          aria-live={settings.autoplay ? 'off' : 'polite'}
          style={{
            height: cardHeight,
            marginInline: bleed ? -bleed : undefined,
            perspective,
            overflowX: clipped ? 'clip' : 'visible',
            maskImage: mask,
            WebkitMaskImage: mask
          }}
        >
          {items.map((item, index) => {
            const initial = pose(index, active, settings);
            return (
              <div
                key={keyOf(item, index)}
                ref={element => {
                  slideRefs.current[index] = element;
                }}
                className="carousel-slide"
                style={{
                  left: inset,
                  width: cardWidth,
                  height: cardHeight,
                  transform: initial.transform,
                  opacity: initial.opacity,
                  visibility: initial.visible ? 'visible' : 'hidden',
                  zIndex: initial.layer,
                  '--carousel-focus': initial.focus
                }}
                data-current={index === active ? 'true' : undefined}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${count}`}
                onClick={() => {
                  if (index !== active) engineRef.current?.goTo(index);
                }}
              >
                <Card item={item} round={round} compact={round && cardWidth < 240} />
                {mode === 'cube' && (
                  <span
                    ref={element => {
                      shadeRefs.current[index] = element;
                    }}
                    className="carousel-shade"
                    style={{ opacity: initial.shade }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {inside && controlsNode}
        {frame && <span className="carousel-frame-rim" />}
      </div>

      {!inside && controlsNode}
    </div>
  );
}
