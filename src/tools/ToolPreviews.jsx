import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import useInView from '../hooks/useInView';
import { BACKGROUNDS, getDefaultProps } from './background-studio/backgrounds';
import { BACKGROUND_LIGHT_PROPS } from '../constants/backgroundThemeProps';
import { computeLiquidPath } from './shape-magic/liquid';
import { createRenderer } from './texture-lab/renderer';
import {
  EFFECT_TYPES,
  DEFAULT_ASCII_PARAMS,
  DEFAULT_DITHER_PARAMS,
  DEFAULT_HALFTONE_PARAMS
} from './texture-lab/types';

const EASE = [0.23, 1, 0.32, 1];

const Chip = ({ label, reduceMotion }) => (
  <span className="tl-chip" aria-hidden="true">
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={label}
        className="tl-chip-label"
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, filter: 'blur(2px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, filter: 'blur(2px)' }}
        transition={{ duration: reduceMotion ? 0 : 0.3, ease: EASE }}
      >
        {label}
      </motion.span>
    </AnimatePresence>
  </span>
);

const STUDIO_PICKS = ['line-waves', 'silk', 'light-pillar'];
const STUDIO_CYCLE = 6500;
const STUDIO_LIGHT = {
  'line-waves': { invert: true },
  silk: { props: { color: '#a3a3a3' } }
};

const StudioSlide = ({ background, light }) => {
  const [Component, setComponent] = useState(null);

  useEffect(() => {
    let active = true;
    background.component().then(module => {
      if (active) setComponent(() => module.default);
    });
    return () => {
      active = false;
    };
  }, [background]);

  if (!Component) return null;

  const tweak = light ? STUDIO_LIGHT[background.id] : null;
  const props = {
    ...getDefaultProps(background),
    ...(light && !tweak?.invert ? BACKGROUND_LIGHT_PROPS[background.id] : null),
    ...tweak?.props,
    ...background.fixedProps
  };

  return <Component {...props} />;
};

export const BackgroundStudioPreview = ({ light }) => {
  const [ref, inView] = useInView('80px');
  const reduceMotion = useReducedMotion();
  const picks = useMemo(() => STUDIO_PICKS.map(id => BACKGROUNDS.find(bg => bg.id === id)).filter(Boolean), []);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!inView || reduceMotion || picks.length < 2) return;
    const timer = setTimeout(() => setIndex(i => (i + 1) % picks.length), STUDIO_CYCLE);
    return () => clearTimeout(timer);
  }, [index, inView, reduceMotion, picks.length]);

  const current = picks[index];
  if (!current) return null;

  return (
    <div ref={ref} className="tl-preview">
      <AnimatePresence initial={false}>
        <motion.div
          key={`${current.id}-${light ? 'light' : 'dark'}`}
          className={`tl-studio-slide${light && STUDIO_LIGHT[current.id]?.invert ? ' is-inverted' : ''}`}
          style={current.wrapperStyle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 1.1, ease: EASE }}
        >
          <StudioSlide background={current} light={light} />
        </motion.div>
      </AnimatePresence>
      <Chip label={current.label} reduceMotion={reduceMotion} />
    </div>
  );
};

const SHAPE_W = 480;
const SHAPE_H = 480;
const SHAPE_RADIUS = 26;
const SHAPE_BLEND = 26;
const SHAPE_FPS = 45;
const HANDLE = 7;

const shapeFrame = t => {
  const swing = Math.sin(t * 0.85);
  return [
    { x: 66, y: 148, w: 150, h: 184 },
    { x: 196 + swing * 38, y: 206, w: 164, h: 88 },
    { x: 336 + swing * 5, y: 122 + Math.cos(t * 1.1) * 22, w: 82, h: 82 }
  ];
};

export const ShapeMagicPreview = () => {
  const [ref, inView] = useInView('80px');
  const reduceMotion = useReducedMotion();
  const gradientId = `tl-shape-${useId().replace(/:/g, '')}`;
  const pathRef = useRef(null);
  const selectionRef = useRef(null);
  const handlesRef = useRef([]);
  const timeRef = useRef(1.4);

  useEffect(() => {
    const path = pathRef.current;
    const selection = selectionRef.current;
    if (!path || !selection) return;

    const draw = t => {
      const shapes = shapeFrame(t);
      path.setAttribute('d', computeLiquidPath(shapes, SHAPE_RADIUS, SHAPE_BLEND, { cell: 4, smooth: 2 }).d);
      const active = shapes[1];
      selection.setAttribute('x', active.x);
      selection.setAttribute('y', active.y);
      selection.setAttribute('width', active.w);
      selection.setAttribute('height', active.h);
      const corners = [
        [active.x, active.y],
        [active.x + active.w, active.y],
        [active.x, active.y + active.h],
        [active.x + active.w, active.y + active.h]
      ];
      handlesRef.current.forEach((handle, i) => {
        if (!handle) return;
        handle.setAttribute('x', corners[i][0] - HANDLE / 2);
        handle.setAttribute('y', corners[i][1] - HANDLE / 2);
      });
    };

    draw(timeRef.current);
    if (!inView || reduceMotion) return;

    let raf = 0;
    let last = performance.now();
    let lastDraw = 0;
    const loop = now => {
      raf = requestAnimationFrame(loop);
      timeRef.current += Math.min(now - last, 50) / 1000;
      last = now;
      if (now - lastDraw < 1000 / SHAPE_FPS) return;
      lastDraw = now;
      draw(timeRef.current);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduceMotion]);

  return (
    <div ref={ref} className="tl-preview tl-shape">
      <svg viewBox={`0 0 ${SHAPE_W} ${SHAPE_H}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--tl-shape-top)' }} />
            <stop offset="1" style={{ stopColor: 'var(--tl-shape-bottom)' }} />
          </linearGradient>
        </defs>
        <path ref={pathRef} className="tl-shape-path" fill={`url(#${gradientId})`} />
        <rect ref={selectionRef} className="tl-shape-selection" rx="3" />
        {[0, 1, 2, 3].map(i => (
          <rect
            key={i}
            ref={el => {
              handlesRef.current[i] = el;
            }}
            className="tl-shape-handle"
            width={HANDLE}
            height={HANDLE}
            rx="1.5"
          />
        ))}
      </svg>
    </div>
  );
};

const TEXTURE_W = 1000;
const TEXTURE_H = 1000;
const TEXTURE_CYCLE = 2600;

const drawSubject = light => {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_W;
  canvas.height = TEXTURE_H;
  const ctx = canvas.getContext('2d');
  const shade = light
    ? { bg: '#ffffff', hi: '#ffffff', mid: '#b4b4b4', low: '#4a4a4a', edge: '#262626', floor: 'rgba(0, 0, 0, 0.26)' }
    : {
        bg: '#000000',
        hi: '#ffffff',
        mid: '#9a9a9a',
        low: '#2e2e2e',
        edge: '#0a0a0a',
        floor: 'rgba(255, 255, 255, 0.14)'
      };

  ctx.fillStyle = shade.bg;
  ctx.fillRect(0, 0, TEXTURE_W, TEXTURE_H);

  const sphere = (cx, cy, r) => {
    const floor = ctx.createRadialGradient(cx, cy + r * 1.02, 0, cx, cy + r * 1.02, r * 1.05);
    floor.addColorStop(0, shade.floor);
    floor.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.save();
    ctx.translate(0, cy + r * 1.02);
    ctx.scale(1, 0.18);
    ctx.translate(0, -(cy + r * 1.02));
    ctx.fillStyle = floor;
    ctx.beginPath();
    ctx.arc(cx, cy + r * 1.02, r * 1.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const body = ctx.createRadialGradient(cx - r * 0.38, cy - r * 0.42, r * 0.04, cx, cy, r);
    body.addColorStop(0, shade.hi);
    body.addColorStop(0.4, shade.mid);
    body.addColorStop(0.82, shade.low);
    body.addColorStop(1, shade.edge);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  };

  sphere(TEXTURE_W * 0.42, TEXTURE_H * 0.45, TEXTURE_W * 0.27);
  sphere(TEXTURE_W * 0.74, TEXTURE_H * 0.63, TEXTURE_W * 0.13);
  return canvas;
};

const textureFrames = light => {
  const ink = light ? '#18181b' : '#ffffff';
  const paper = light ? '#ffffff' : '#000000';
  return [
    { label: 'Original' },
    {
      label: 'Halftone',
      effect: {
        type: EFFECT_TYPES.HALFTONE,
        enabled: true,
        params: {
          ...DEFAULT_HALFTONE_PARAMS,
          gridSize: 12,
          dotScale: light ? 1.5 : 1,
          colorMode: 'monochrome',
          dotColor: ink,
          backgroundColor: paper,
          invert: light
        }
      }
    },
    {
      label: 'Dither',
      effect: {
        type: EFFECT_TYPES.DITHER,
        enabled: true,
        params: { ...DEFAULT_DITHER_PARAMS, levels: 2, threshold: 1.5, scale: 4 }
      }
    },
    {
      label: 'ASCII',
      effect: {
        type: EFFECT_TYPES.ASCII,
        enabled: true,
        params: {
          ...DEFAULT_ASCII_PARAMS,
          cellSize: 20,
          color: false,
          backgroundBlend: 0,
          contrast: 1.6,
          brightness: 1.15,
          charBrightness: 1.5,
          charColor: ink,
          backgroundColor: paper,
          invert: light
        }
      }
    }
  ];
};

export const TextureLabPreview = ({ light }) => {
  const [ref, inView] = useInView('80px');
  const reduceMotion = useReducedMotion();
  const [frames, setFrames] = useState([]);
  const [index, setIndex] = useState(1);

  useEffect(() => {
    const subject = drawSubject(light);
    const canvas = document.createElement('canvas');
    let renderer;
    try {
      renderer = createRenderer(canvas);
    } catch {
      setFrames([{ label: 'Original', src: subject.toDataURL('image/webp', 0.92) }]);
      return;
    }
    renderer.setImage(subject);
    const rendered = textureFrames(light).map(frame => {
      if (!frame.effect) return { label: frame.label, src: subject.toDataURL('image/webp', 0.92) };
      renderer.render([frame.effect], 7, TEXTURE_W, TEXTURE_H);
      return { label: frame.label, src: canvas.toDataURL('image/webp', 0.92) };
    });
    renderer.destroy();
    renderer.gl?.getExtension('WEBGL_lose_context')?.loseContext();
    setFrames(rendered);
  }, [light]);

  useEffect(() => {
    if (!inView || reduceMotion || frames.length < 2) return;
    const timer = setTimeout(() => setIndex(i => (i + 1) % frames.length), TEXTURE_CYCLE);
    return () => clearTimeout(timer);
  }, [index, inView, reduceMotion, frames.length]);

  const current = frames[index % Math.max(frames.length, 1)];

  return (
    <div ref={ref} className="tl-preview tl-texture">
      {frames.map(frame => (
        <img
          key={frame.label}
          src={frame.src}
          alt=""
          className="tl-texture-frame"
          data-active={frame === current ? '' : undefined}
          draggable={false}
        />
      ))}
      {current && <Chip label={current.label} reduceMotion={reduceMotion} />}
    </div>
  );
};
