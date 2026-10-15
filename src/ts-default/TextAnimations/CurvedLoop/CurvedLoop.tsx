'use client';

import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type PointerEvent,
  type SVGProps
} from 'react';
import './CurvedLoop.css';

export type CurvedLoopShape = 'arc' | 'wave' | 'circle' | 'line';

interface CurvedLoopProps {
  marqueeText?: string;
  speed?: number;
  className?: string;
  curveAmount?: number;
  direction?: 'left' | 'right';
  interactive?: boolean;
  pauseOnHover?: boolean;
  color?: string;
  edgeFade?: number;
  shape?: CurvedLoopShape;
  fontSize?: number;
  fontWeight?: number | string;
  letterSpacing?: number;
  outline?: boolean;
  separator?: string;
  separatorColor?: string;
  scrollBoost?: number;
}

interface DragState {
  active: boolean;
  x: number;
  time: number;
  scale: number;
  velocity: number;
  ring: boolean;
  radius: number;
  angle: number;
  cx: number;
  cy: number;
}

interface Geometry {
  d: string;
  viewBox: string;
  radius: number;
  repeats: number;
  span: number;
}

const VIEW_WIDTH = 1440;
const VIEW_HEIGHT = 120;
const MAX_FLING = 4000;
const WAVE_LENGTH = 960;
const RING_RADIUS = 2.2;
const TAU = Math.PI * 2;

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const wrapOffset = (value: number, length: number) =>
  length > 0 ? (((value % length) + length) % length) - length : value;

const wrapAngle = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));

const edgeMask = (amount: number, span: number) => {
  const size = Math.min(Math.max(amount, 0), 1) * 50 * span;
  if (size <= 0) return undefined;
  const start = 50 - span * 50;
  const steps = 10;
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const alpha = (t * t * t * (t * (t * 6 - 15) + 10)).toFixed(3);
    left.push(`rgba(0, 0, 0, ${alpha}) ${(start + t * size).toFixed(2)}%`);
    right.unshift(`rgba(0, 0, 0, ${alpha}) ${(100 - start - t * size).toFixed(2)}%`);
  }
  return `linear-gradient(to right, ${[...left, ...right].join(', ')})`;
};

const wavePath = (amplitude: number, baseline: number) => {
  const from = -100;
  const to = VIEW_WIDTH + 100;
  const k = TAU / WAVE_LENGTH;
  const y = (x: number) => baseline + amplitude * Math.cos(k * (x - VIEW_WIDTH / 2));
  const slope = (x: number) => -amplitude * k * Math.sin(k * (x - VIEW_WIDTH / 2));
  const count = Math.ceil((to - from) / (WAVE_LENGTH / 8));
  const step = (to - from) / count;
  const f = (n: number) => n.toFixed(2);
  let d = `M${f(from)},${f(y(from))}`;
  for (let i = 0; i < count; i++) {
    const x0 = from + i * step;
    const x1 = x0 + step;
    d += ` C${f(x0 + step / 3)},${f(y(x0) + (slope(x0) * step) / 3)} ${f(x1 - step / 3)},${f(y(x1) - (slope(x1) * step) / 3)} ${f(x1)},${f(y(x1))}`;
  }
  return d;
};

const getGeometry = (shape: CurvedLoopShape, curveAmount: number, fontSize: number, spacing: number): Geometry => {
  if (shape === 'circle') {
    const repeats = spacing > 0 ? Math.max(1, Math.round((TAU * fontSize * RING_RADIUS) / spacing)) : 1;
    const radius = spacing > 0 ? (repeats * spacing) / TAU : fontSize * RING_RADIUS;
    const half = radius + fontSize;
    return {
      d: `M${-radius},0 A${radius},${radius} 0 1,1 ${radius},0 A${radius},${radius} 0 1,1 ${-radius},0`,
      viewBox: `${-half} ${-half} ${half * 2} ${half * 2}`,
      radius,
      repeats,
      span: Math.min(1, (fontSize * (RING_RADIUS + 1) * 2) / VIEW_WIDTH)
    };
  }
  const flat = { viewBox: `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`, radius: 0, repeats: 0, span: 1 };
  const baseline = VIEW_HEIGHT / 2 + fontSize * 0.36;
  if (shape === 'line') return { ...flat, d: `M-100,${baseline} L${VIEW_WIDTH + 100},${baseline}` };
  if (shape === 'wave') return { ...flat, d: wavePath(curveAmount * 0.25, baseline) };
  return { ...flat, d: `M-100,40 Q500,${40 + curveAmount} 1540,40` };
};

const CurvedLoop: FC<CurvedLoopProps> = ({
  marqueeText = '',
  speed = 2,
  className,
  curveAmount = 400,
  direction = 'left',
  interactive = true,
  pauseOnHover = false,
  color = 'currentColor',
  edgeFade = 0,
  shape = 'arc',
  fontSize = 96,
  fontWeight = 700,
  letterSpacing = 0,
  outline = false,
  separator = '',
  separatorColor,
  scrollBoost = 0
}) => {
  const body = useMemo(() => marqueeText.replace(/\s+$/, ''), [marqueeText]);
  const mark = String(separator ?? '').trim();
  const text = mark ? `${body}\u00A0${mark}\u00A0` : `${body}\u00A0`;
  const pathId = `curve-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const jacketRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const measureRef = useRef<SVGTextElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const textPathsRef = useRef<SVGTextPathElement[]>([]);

  const [spacing, setSpacing] = useState(0);
  const [pathLength, setPathLength] = useState(0);
  const [dragging, setDragging] = useState(false);

  const spacingRef = useRef(0);
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);
  const directionRef = useRef<'left' | 'right'>(direction);
  const hoverRef = useRef(false);
  const settingsRef = useRef({ speed, pauseOnHover, scrollBoost });
  const scrollRef = useRef({ distance: 0, level: 0 });
  const dragRef = useRef<DragState>({
    active: false,
    x: 0,
    time: 0,
    scale: 1,
    velocity: 0,
    ring: false,
    radius: 0,
    angle: 0,
    cx: 0,
    cy: 0
  });

  const ring = shape === 'circle';
  const geometry = getGeometry(shape, curveAmount, fontSize, spacing);
  const ready = spacing > 0;
  const copies = ready ? (ring ? geometry.repeats + 1 : Math.ceil((pathLength || 1800) / spacing) + 2) : 1;
  const mask = edgeMask(edgeFade, geometry.span);

  const maskId = `${pathId}-outline`;
  const accent = Boolean(mark && separatorColor);
  const plain = text.repeat(copies);
  const repeat = (markProps: SVGProps<SVGTSpanElement>) =>
    Array.from({ length: copies }, (_, i) => (
      <Fragment key={i}>
        {`${body}\u00A0`}
        <tspan {...markProps}>{mark}</tspan>
        {'\u00A0'}
      </Fragment>
    ));

  const applyOffset = () => {
    const value = `${offsetRef.current}px`;
    for (const node of textPathsRef.current) node.setAttribute('startOffset', value);
  };

  useEffect(() => {
    settingsRef.current = { speed, pauseOnHover, scrollBoost };
  }, [speed, pauseOnHover, scrollBoost]);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useIsomorphicLayoutEffect(() => {
    const measure = () => {
      if (measureRef.current) setSpacing(measureRef.current.getComputedTextLength());
    };
    measure();
    let active = true;
    const fonts = document.fonts;
    fonts?.ready.then(() => active && measure());
    fonts?.addEventListener?.('loadingdone', measure);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (observer && svgRef.current) observer.observe(svgRef.current);
    return () => {
      active = false;
      fonts?.removeEventListener?.('loadingdone', measure);
      observer?.disconnect();
    };
  }, [text, className, fontSize, fontWeight, letterSpacing]);

  useIsomorphicLayoutEffect(() => {
    if (pathRef.current) setPathLength(pathRef.current.getTotalLength());
  }, [geometry.d]);

  useIsomorphicLayoutEffect(() => {
    if (!ready) return;
    spacingRef.current = spacing;
    offsetRef.current = wrapOffset(offsetRef.current, spacing);
  }, [ready, spacing]);

  useIsomorphicLayoutEffect(() => {
    textPathsRef.current = svgRef.current ? Array.from(svgRef.current.querySelectorAll('textPath')) : [];
    const value = `${offsetRef.current}px`;
    for (const node of textPathsRef.current) node.setAttribute('startOffset', value);
  });

  useEffect(() => {
    if (!scrollBoost) return undefined;
    const positions = new Map<Window | Element, number>([[window, window.scrollY]]);
    const onScroll = (event: Event) => {
      const target = event.target instanceof Element ? event.target : window;
      if (target instanceof Element && !target.contains(jacketRef.current)) return;
      const position = target instanceof Element ? target.scrollTop : window.scrollY;
      const previous = positions.get(target);
      positions.set(target, position);
      if (previous !== undefined) scrollRef.current.distance += Math.abs(position - previous);
    };
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', onScroll, { capture: true });
  }, [scrollBoost]);

  useEffect(() => {
    if (!ready) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let frame = 0;
    let last = 0;
    let visible = true;

    const tick = (now: number) => {
      frame = 0;
      if (!visible) return;
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      const scroll = scrollRef.current;
      const rate = dt > 0 ? scroll.distance / dt : 0;
      scroll.distance = 0;
      scroll.level += (rate - scroll.level) * (1 - Math.exp(-dt * (rate > scroll.level ? 10 : 2.4)));
      if (!dragRef.current.active) {
        const { speed: base, pauseOnHover: pause, scrollBoost: boost } = settingsRef.current;
        const sign = directionRef.current === 'right' ? 1 : -1;
        const halted = reduceMotion || (pause && hoverRef.current);
        const target = halted ? 0 : sign * base * 60;
        const extra = halted ? 0 : sign * scroll.level * boost * 0.3;
        velocityRef.current += (target - velocityRef.current) * (1 - Math.exp(-dt * 3));
        const step = (velocityRef.current + extra) * dt;
        if (Math.abs(step) > 0.0001) {
          offsetRef.current = wrapOffset(offsetRef.current + step, spacingRef.current);
          for (const node of textPathsRef.current) node.setAttribute('startOffset', `${offsetRef.current}px`);
        }
      }
      frame = requestAnimationFrame(tick);
    };

    const observer =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            if (visible && !frame) {
              last = 0;
              scrollRef.current.level = 0;
              frame = requestAnimationFrame(tick);
            }
          })
        : null;
    if (observer && jacketRef.current) observer.observe(jacketRef.current);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [ready]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!interactive || !ready) return;
    const rect = svgRef.current?.getBoundingClientRect();
    const width = rect?.width || VIEW_WIDTH;
    const cx = rect ? rect.left + rect.width / 2 : e.clientX;
    const cy = rect ? rect.top + rect.height / 2 : e.clientY;
    dragRef.current = {
      active: true,
      x: e.clientX,
      time: performance.now(),
      scale: VIEW_WIDTH / width,
      velocity: 0,
      ring,
      radius: geometry.radius,
      angle: Math.atan2(e.clientY - cy, e.clientX - cx),
      cx,
      cy
    };
    velocityRef.current = 0;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    const now = performance.now();
    let delta = (e.clientX - drag.x) * drag.scale;
    if (drag.ring) {
      const angle = Math.atan2(e.clientY - drag.cy, e.clientX - drag.cx);
      delta = wrapAngle(angle - drag.angle) * drag.radius;
      drag.angle = angle;
    }
    const dt = Math.max(now - drag.time, 1) / 1000;
    drag.x = e.clientX;
    drag.time = now;
    drag.velocity = drag.velocity * 0.5 + (delta / dt) * 0.5;
    offsetRef.current = wrapOffset(offsetRef.current + delta, spacingRef.current);
    applyOffset();
  };

  const endDrag = () => {
    const drag = dragRef.current;
    if (!drag.active) return;
    drag.active = false;
    setDragging(false);
    const fling = performance.now() - drag.time > 100 ? 0 : Math.max(-MAX_FLING, Math.min(MAX_FLING, drag.velocity));
    velocityRef.current = fling;
    if (Math.abs(fling) > 60) directionRef.current = fling > 0 ? 'right' : 'left';
  };

  const onPointerLeave = () => {
    hoverRef.current = false;
    endDrag();
  };

  return (
    <div
      ref={jacketRef}
      className="curved-loop-jacket"
      style={{
        visibility: ready ? 'visible' : 'hidden',
        cursor: interactive ? (dragging ? 'grabbing' : 'grab') : 'auto',
        touchAction: interactive ? 'pan-y' : 'auto',
        maskImage: mask,
        WebkitMaskImage: mask
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      onPointerEnter={() => {
        hoverRef.current = true;
      }}
      onPointerLeave={onPointerLeave}
    >
      <svg
        ref={svgRef}
        className="curved-loop-svg"
        viewBox={geometry.viewBox}
        style={{
          fontSize,
          fontWeight,
          letterSpacing,
          ...(ring ? { width: `${(geometry.span * 100).toFixed(3)}%`, aspectRatio: '1' } : null)
        }}
        role="img"
        aria-label={marqueeText}
      >
        <text
          ref={measureRef}
          xmlSpace="preserve"
          className={className}
          style={{ visibility: 'hidden', opacity: 0, pointerEvents: 'none' }}
        >
          {text}
        </text>
        <defs>
          <path ref={pathRef} id={pathId} d={geometry.d} fill="none" stroke="transparent" />
          {ready && outline && (
            <mask
              id={maskId}
              maskUnits="userSpaceOnUse"
              x={-VIEW_WIDTH}
              y={-VIEW_WIDTH}
              width={VIEW_WIDTH * 3}
              height={VIEW_WIDTH * 3}
            >
              <rect x={-VIEW_WIDTH} y={-VIEW_WIDTH} width={VIEW_WIDTH * 3} height={VIEW_WIDTH * 3} fill="#fff" />
              <text xmlSpace="preserve" className={className} fill="#000">
                <textPath href={`#${pathId}`} xmlSpace="preserve">
                  {plain}
                </textPath>
              </text>
            </mask>
          )}
        </defs>
        {ready &&
          (outline ? (
            <text
              xmlSpace="preserve"
              className={className}
              fill="none"
              stroke={color}
              strokeWidth={fontSize * 0.05}
              strokeLinejoin="round"
              mask={`url(#${maskId})`}
            >
              <textPath href={`#${pathId}`} xmlSpace="preserve">
                {accent ? repeat({ stroke: 'none' }) : plain}
              </textPath>
            </text>
          ) : (
            <text xmlSpace="preserve" className={className} fill={color}>
              <textPath href={`#${pathId}`} xmlSpace="preserve">
                {accent ? repeat({ fill: separatorColor }) : plain}
              </textPath>
            </text>
          ))}
        {ready && outline && accent && (
          <text xmlSpace="preserve" className={className} fill="none" aria-hidden="true">
            <textPath href={`#${pathId}`} xmlSpace="preserve">
              {repeat({ fill: separatorColor })}
            </textPath>
          </text>
        )}
      </svg>
    </div>
  );
};

export default CurvedLoop;
