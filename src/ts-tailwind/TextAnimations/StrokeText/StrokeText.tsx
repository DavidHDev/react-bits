'use client';

import { CSSProperties, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export type StrokeTextTrigger = 'mount' | 'hover' | 'scroll' | 'loop';
export type StrokeTextFillMode = 'wipe' | 'fade' | 'none';
export type StrokeTextWipeFrom = 'left' | 'right' | 'top' | 'bottom';
export type StrokeTextStyle = 'solid' | 'dashed' | 'dotted';

export interface StrokeTextProps {
  text?: string;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  drawDuration?: number;
  fillDelay?: number;
  stagger?: number;
  ease?: string;
  trigger?: StrokeTextTrigger;
  fillMode?: StrokeTextFillMode;
  wipeFrom?: StrokeTextWipeFrom;
  fontSize?: number;
  fontWeight?: number | string;
  fontFamily?: string;
  letterSpacing?: number;
  reverse?: boolean;
  strokeStyle?: StrokeTextStyle;
  dashLength?: number;
  marching?: boolean;
  hoverRedraw?: boolean;
  shadow?: boolean;
  shadowColor?: string;
  className?: string;
  style?: CSSProperties;
}

interface StrokeTextBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DashPattern {
  array: string;
  period: number;
}

const DEFAULT_TEXT = 'Draw Attention';
const SHADOW_OPACITY = 0.5;

const getWipeFrames = (box: StrokeTextBox, wipeFrom: StrokeTextWipeFrom) => {
  const end = { x: box.x, y: box.y, width: box.width, height: box.height };
  if (wipeFrom === 'right') return { start: { ...end, x: box.x + box.width, width: 0 }, end };
  if (wipeFrom === 'top') return { start: { ...end, height: 0 }, end };
  if (wipeFrom === 'bottom') return { start: { ...end, y: box.y + box.height, height: 0 }, end };
  return { start: { ...end, width: 0 }, end };
};

const getDashPattern = (strokeStyle: StrokeTextStyle, dashLength: number, strokeWidth: number): DashPattern | null => {
  const width = Math.max(Number(strokeWidth) || 0, 0.1);
  const length = Math.max(Number(dashLength) || 0, 1);
  if (strokeStyle === 'dotted') {
    const gap = Math.max(length, width * 1.8);
    return { array: `0 ${gap}`, period: gap };
  }
  if (strokeStyle === 'dashed') {
    const on = Math.max(length - width, 0.5);
    const off = length * 0.6 + width;
    return { array: `${on} ${off}`, period: on + off };
  }
  return null;
};

const StrokeText = ({
  text = DEFAULT_TEXT,
  strokeColor = '#A78BFA',
  fillColor = 'currentColor',
  strokeWidth = 1.4,
  drawDuration = 1.6,
  fillDelay = 0.2,
  stagger = 0.05,
  ease = 'power2.out',
  trigger = 'mount',
  fillMode = 'wipe',
  wipeFrom = 'left',
  fontSize = 128,
  fontWeight = 800,
  fontFamily = 'inherit',
  letterSpacing = -4,
  reverse = false,
  strokeStyle = 'solid',
  dashLength = 10,
  marching = false,
  hoverRedraw = false,
  shadow = false,
  shadowColor,
  className = '',
  style = {}
}: StrokeTextProps) => {
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const strokeTextRef = useRef<SVGTextElement | null>(null);
  const wipeRectRef = useRef<SVGRectElement | null>(null);
  const shadowRef = useRef<SVGFEDropShadowElement | null>(null);

  const [box, setBox] = useState<StrokeTextBox | null>(null);

  const baseId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const wipeId = `stroke-text-wipe-${baseId}`;
  const revealId = `stroke-text-reveal-${baseId}`;
  const erodeId = `stroke-text-erode-${baseId}`;
  const shadowId = `stroke-text-shadow-${baseId}`;

  const characters = useMemo(() => Array.from(String(text ?? '')), [text]);

  const dash = Math.max(fontSize * 7, 200);
  const pattern = getDashPattern(strokeStyle, dashLength, strokeWidth);
  const dashArray = pattern ? pattern.array : null;
  const dashPeriod = pattern ? pattern.period : 0;
  const lift = fontSize * 0.06;
  const softness = fontSize * 0.016;
  const castShadow = shadow && fillMode !== 'none';

  const fontStyle = useMemo<CSSProperties>(
    () => ({
      fontFamily,
      fontSize: `${fontSize}px`,
      fontWeight,
      letterSpacing: `${letterSpacing}px`
    }),
    [fontFamily, fontSize, fontWeight, letterSpacing]
  );

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !strokeTextRef.current) return undefined;

    let cancelled = false;

    const measure = () => {
      if (cancelled || !strokeTextRef.current) return;
      let bbox: DOMRect | undefined;
      try {
        bbox = strokeTextRef.current.getBBox();
      } catch {
        return;
      }
      if (!bbox || !bbox.width) return;

      const pad = Math.max(Number(strokeWidth) || 1, fontSize * 0.1);
      const next = {
        x: bbox.x - pad,
        y: bbox.y - pad,
        width: bbox.width + pad * 2,
        height: bbox.height + pad * 2
      };

      setBox(prev =>
        prev &&
        Math.abs(prev.x - next.x) < 0.5 &&
        Math.abs(prev.width - next.width) < 0.5 &&
        Math.abs(prev.y - next.y) < 0.5 &&
        Math.abs(prev.height - next.height) < 0.5
          ? prev
          : next
      );
    };

    measure();
    document.fonts?.ready?.then(measure).catch(() => {});

    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(root);

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [characters, fontFamily, fontSize, fontWeight, letterSpacing, strokeWidth]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (typeof window === 'undefined' || !root || !box) return undefined;

    const strokes = gsap.utils.toArray(root.querySelectorAll('[data-stroke-char]'));
    const fills = gsap.utils.toArray(root.querySelectorAll('[data-fill-char]'));
    const wipe = wipeRectRef.current;
    const outline = strokeTextRef.current;
    const drop = shadowRef.current;
    if (!strokes.length) return undefined;

    const fillEnabled = fillMode !== 'none';
    const useWipe = fillEnabled && fillMode === 'wipe';
    const fillDuration = Math.max(0.4, drawDuration * 0.5);
    const staggerConfig: number | gsap.StaggerVars = reverse ? { each: stagger, from: 'end' as const } : stagger;
    const frames = getWipeFrames(box, wipeFrom);
    const lifted = { dx: lift, dy: lift, 'flood-opacity': SHADOW_OPACITY };
    const grounded = { dx: 0, dy: 0, 'flood-opacity': 0 };
    const targets = [...strokes, ...fills, wipe, drop].filter(Boolean);

    const setStart = () => {
      gsap.killTweensOf(targets);
      gsap.set(strokes, { strokeDasharray: dash, strokeDashoffset: dash, strokeOpacity: 1 });
      gsap.set(fills, { opacity: useWipe ? 1 : 0 });
      if (wipe) gsap.set(wipe, { attr: frames.start });
      if (drop) gsap.set(drop, { attr: grounded });
    };

    const setEnd = () => {
      gsap.killTweensOf(targets);
      gsap.set(strokes, { strokeDasharray: dash, strokeDashoffset: 0, strokeOpacity: 1 });
      gsap.set(fills, { opacity: fillEnabled ? 1 : 0 });
      if (wipe) gsap.set(wipe, { attr: fillEnabled ? frames.end : frames.start });
      if (drop) gsap.set(drop, { attr: fillEnabled ? lifted : grounded });
    };

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setEnd();
      return () => gsap.killTweensOf(targets);
    }

    const build = () => {
      setStart();
      const looping = trigger === 'loop';
      const tl = gsap.timeline({
        paused: true,
        repeat: looping ? -1 : 0,
        repeatDelay: looping ? 0.9 : 0,
        yoyo: looping,
        defaults: { overwrite: 'auto' }
      });

      tl.to(strokes, { strokeDashoffset: 0, duration: drawDuration, ease, stagger: staggerConfig }, 0);

      if (useWipe && wipe) {
        tl.to(wipe, { attr: frames.end, duration: fillDuration, ease: 'power2.inOut' }, drawDuration + fillDelay);
      } else if (fillEnabled) {
        tl.to(
          fills,
          { opacity: 1, duration: fillDuration, ease: 'power2.out', stagger: staggerConfig },
          drawDuration + fillDelay
        );
      }

      if (drop && fillEnabled) {
        tl.to(
          drop,
          { attr: lifted, duration: fillDuration * 1.4, ease: 'power3.out' },
          drawDuration + fillDelay + fillDuration * 0.3
        );
      }

      return tl;
    };

    let timeline: gsap.core.Timeline | null = null;
    let scrollTrigger: ReturnType<typeof ScrollTrigger.create> | null = null;
    let redraw: gsap.core.Timeline | null = null;
    const listeners: (() => void)[] = [];

    const listen = (handler: () => void) => {
      root.addEventListener('pointerenter', handler);
      listeners.push(handler);
    };

    if (trigger === 'hover') {
      setEnd();
      listen(() => {
        timeline?.kill();
        timeline = build();
        timeline.play(0);
      });
    } else {
      timeline = build();
      if (trigger === 'scroll') {
        scrollTrigger = ScrollTrigger.create({
          trigger: root,
          start: 'top 82%',
          once: true,
          onEnter: () => timeline?.play(0)
        });
      } else {
        timeline.play(0);
      }

      if (hoverRedraw && trigger !== 'loop') {
        listen(() => {
          if (!timeline || timeline.progress() < 1 || redraw?.isActive()) return;
          redraw?.kill();
          redraw = gsap
            .timeline()
            .to(strokes, { strokeOpacity: 0, duration: 0.2, ease: 'power1.out' })
            .set(strokes, { strokeDashoffset: dash, strokeOpacity: 1 })
            .to(strokes, { strokeDashoffset: 0, duration: drawDuration * 0.8, ease, stagger: staggerConfig });
        });
      }
    }

    const march =
      dashArray && marching && outline
        ? gsap.fromTo(
            outline,
            { strokeDashoffset: 0 },
            { strokeDashoffset: -dashPeriod, duration: dashPeriod / (fontSize * 0.22), ease: 'none', repeat: -1 }
          )
        : null;

    return () => {
      listeners.forEach(handler => root.removeEventListener('pointerenter', handler));
      scrollTrigger?.kill();
      timeline?.kill();
      redraw?.kill();
      march?.kill();
      gsap.killTweensOf(targets);
    };
  }, [
    box,
    dash,
    drawDuration,
    fillDelay,
    stagger,
    ease,
    trigger,
    fillMode,
    wipeFrom,
    reverse,
    dashArray,
    dashPeriod,
    marching,
    hoverRedraw,
    castShadow,
    lift,
    fontSize
  ]);

  const viewBox = box ? `${box.x} ${box.y} ${box.width} ${box.height}` : `0 ${-fontSize} 600 ${fontSize * 1.3}`;
  const wipeStart = box ? getWipeFrames(box, wipeFrom).start : null;
  const region: Partial<StrokeTextBox> = box
    ? { x: box.x - fontSize, y: box.y - fontSize, width: box.width + fontSize * 2, height: box.height + fontSize * 2 }
    : {};

  const outlineLayer = (
    <text
      key={dashArray ? 'pattern' : 'solid'}
      ref={strokeTextRef}
      className="select-none"
      x="0"
      y="0"
      fill="none"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      strokeLinecap="round"
      strokeDasharray={dashArray || undefined}
      mask={dashArray ? `url(#${revealId})` : undefined}
      style={fontStyle}
    >
      {characters.map((char, index) => (
        <tspan data-stroke-char={dashArray ? undefined : true} key={`s-${index}`}>
          {char}
        </tspan>
      ))}
    </text>
  );

  return (
    <span
      ref={rootRef}
      className={`block w-full leading-[0] ${trigger === 'hover' ? 'cursor-pointer' : ''} ${className}`.trim()}
      style={style}
      role="img"
      aria-label={String(text ?? '')}
    >
      <svg
        className="mx-auto block h-auto w-full overflow-visible"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        style={{ maxWidth: `${box ? box.width : 600}px`, visibility: box ? undefined : 'hidden' }}
      >
        <defs>
          {fillMode === 'wipe' && wipeStart && (
            <clipPath id={wipeId} clipPathUnits="userSpaceOnUse">
              <rect
                ref={wipeRectRef}
                x={wipeStart.x}
                y={wipeStart.y}
                width={wipeStart.width}
                height={wipeStart.height}
              />
            </clipPath>
          )}

          {dashArray && (
            <filter id={erodeId} filterUnits="userSpaceOnUse" {...region}>
              <feMorphology operator="erode" radius={(Number(strokeWidth) || 1) / 2 + 0.75} />
            </filter>
          )}

          {dashArray && (
            <mask id={revealId} maskUnits="userSpaceOnUse" {...region}>
              <text
                x="0"
                y="0"
                fill="none"
                stroke="#fff"
                strokeWidth={(Number(strokeWidth) || 1) + 2}
                strokeLinejoin="round"
                strokeLinecap="round"
                style={fontStyle}
              >
                {characters.map((char, index) => (
                  <tspan data-stroke-char key={`m-${index}`}>
                    {char}
                  </tspan>
                ))}
              </text>
              <text x="0" y="0" fill="#000" stroke="none" filter={`url(#${erodeId})`} style={fontStyle}>
                {characters.map((char, index) => (
                  <tspan key={`e-${index}`}>{char}</tspan>
                ))}
              </text>
            </mask>
          )}

          {castShadow && (
            <filter id={shadowId} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB" {...region}>
              <feDropShadow
                ref={shadowRef}
                dx={lift}
                dy={lift}
                stdDeviation={softness}
                floodColor={shadowColor || strokeColor}
                floodOpacity={SHADOW_OPACITY}
              />
            </filter>
          )}
        </defs>

        {!dashArray && outlineLayer}

        <g filter={castShadow ? `url(#${shadowId})` : undefined}>
          <text
            className="select-none"
            x="0"
            y="0"
            fill={fillColor}
            stroke="none"
            style={fontStyle}
            clipPath={fillMode === 'wipe' && wipeStart ? `url(#${wipeId})` : undefined}
          >
            {characters.map((char, index) => (
              <tspan data-fill-char key={`f-${index}`}>
                {char}
              </tspan>
            ))}
          </text>
        </g>

        {dashArray && outlineLayer}
      </svg>
    </span>
  );
};

export default StrokeText;
