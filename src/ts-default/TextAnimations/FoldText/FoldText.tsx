'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import './FoldText.css';

gsap.registerPlugin(ScrollTrigger);

type SplitBy = 'char' | 'word' | 'line';
type Hinge = 'top' | 'bottom' | 'left' | 'right';
type Trigger = 'mount' | 'hover' | 'scroll' | 'loop';
type StaggerFrom = 'start' | 'center' | 'end' | 'edges' | 'random';
type FoldStyle = 'paper' | 'blinds' | 'flip';
type Axis = 'rotateX' | 'rotateY';

export interface FoldTextProps {
  text?: string;
  splitBy?: SplitBy;
  hinge?: Hinge;
  foldStyle?: FoldStyle;
  duration?: number;
  stagger?: number;
  staggerFrom?: StaggerFrom;
  foldAngle?: number;
  ease?: string;
  perspective?: number;
  creaseShading?: number;
  trigger?: Trigger;
  loopDelay?: number;
  hoverRefold?: boolean;
  refoldRadius?: number;
  refoldAngle?: number;
  fontSize?: string | number;
  fontWeight?: string | number;
  color?: string;
  className?: string;
  style?: CSSProperties;
}

type HingeConfig = {
  origin: string;
  axis: Axis;
  sign: number;
};

type Piece = {
  element: HTMLElement;
  parts: HTMLElement[];
  t: number;
  f: number;
  r: number;
  aim: number;
};

type Point = { x: number; y: number };

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const HINGES: Record<Hinge, HingeConfig> = {
  top: { origin: '50% 0%', axis: 'rotateX', sign: -1 },
  bottom: { origin: '50% 100%', axis: 'rotateX', sign: 1 },
  left: { origin: '0% 50%', axis: 'rotateY', sign: 1 },
  right: { origin: '100% 50%', axis: 'rotateY', sign: -1 }
};

const SLATS: Record<Axis, { origins: string[]; clips: string[] }> = {
  rotateX: {
    origins: ['50% 25%', '50% 75%'],
    clips: ['inset(-40% -20% 50% -20%)', 'inset(50% -20% -40% -20%)']
  },
  rotateY: {
    origins: ['25% 50%', '75% 50%'],
    clips: ['inset(-40% 50% -40% -20%)', 'inset(-40% -20% -40% 50%)']
  }
};

const FOLD_STYLES: FoldStyle[] = ['paper', 'blinds', 'flip'];
const SLAT_DELAY = 0.24;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const FoldText = ({
  text = 'Design unfolds',
  splitBy = 'char',
  hinge = 'top',
  foldStyle = 'paper',
  duration = 0.65,
  stagger = 0.045,
  staggerFrom = 'start',
  foldAngle = 92,
  ease = 'power3.out',
  perspective = 700,
  creaseShading = 0.55,
  trigger = 'mount',
  loopDelay = 1.4,
  hoverRefold = false,
  refoldRadius = 140,
  refoldAngle = 45,
  fontSize = 80,
  fontWeight = 800,
  color = 'currentColor',
  className = '',
  style = {}
}: FoldTextProps) => {
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const safeHinge: Hinge = HINGES[hinge] ? hinge : 'top';
  const hingeConfig = HINGES[safeHinge];
  const safeStyle: FoldStyle = FOLD_STYLES.includes(foldStyle) ? foldStyle : 'paper';
  const safeCrease = clamp(creaseShading, 0, 1);
  const safeAngle = clamp(foldAngle, 0, 180);
  const safeStagger = Math.max(0, stagger);
  const safeDelay = Math.max(0, loopDelay);
  const safeRadius = Math.max(1, refoldRadius);
  const safeRefold = clamp(refoldAngle, 0, 180);
  const startsFolded = trigger !== 'hover';

  const segments = useMemo<ReactNode[]>(() => {
    const renderPiece = (content: string, key: string, isLine = false): ReactNode => (
      <span className="fold-text-segment" data-fold-split={isLine ? 'line' : undefined} key={key}>
        {safeStyle === 'blinds' ? (
          <span
            className="fold-text-piece"
            data-fold-hinge={safeHinge}
            data-fold-style="blinds"
            style={startsFolded ? { opacity: 0 } : undefined}
          >
            <span className="fold-text-slat" data-fold-text={content}>
              {content}
            </span>
            <span className="fold-text-slat" data-fold-slat="b" data-fold-text={content}>
              {content}
            </span>
          </span>
        ) : (
          <span
            className="fold-text-piece"
            data-fold-hinge={safeHinge}
            data-fold-style={safeStyle}
            data-fold-text={content}
            style={startsFolded ? { opacity: 0 } : undefined}
          >
            {content}
          </span>
        )}
      </span>
    );

    if (splitBy === 'line') {
      return text.split('\n').map((line, index) => renderPiece(line || '\u00A0', `line-${index}`, true));
    }

    return text.split(/(\s+)/).flatMap((part, partIndex): ReactNode[] => {
      if (!part) return [];

      if (/^\s+$/.test(part)) {
        return part
          .split('\n')
          .flatMap((spaces, lineIndex) => [lineIndex > 0 ? <br key={`br-${partIndex}-${lineIndex}`} /> : null, spaces])
          .filter(Boolean);
      }

      if (splitBy === 'word') return [renderPiece(part, `word-${partIndex}`)];

      return [
        <span className="fold-text-word" key={`word-${partIndex}`}>
          {Array.from(part).map((char, charIndex) => renderPiece(char, `char-${partIndex}-${charIndex}`))}
        </span>
      ];
    });
  }, [text, splitBy, safeHinge, safeStyle, startsFolded]);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const elements = Array.from(root.querySelectorAll<HTMLElement>('.fold-text-piece'));
    if (!elements.length) return undefined;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const { axis, sign, origin } = hingeConfig;
    const slats = SLATS[axis];
    const unfoldEase = gsap.parseEase(reduceMotion ? 'power1.out' : ease) || gsap.parseEase('power3.out');
    const foldEase = gsap.parseEase(reduceMotion ? 'power1.in' : 'power2.in');
    const angle = reduceMotion ? 0 : safeStyle === 'flip' ? 180 : safeAngle;
    const crease = reduceMotion ? 0 : safeCrease;
    const refold = hoverRefold && !reduceMotion ? safeRefold : 0;
    const lift = safeStyle === 'flip' && !reduceMotion ? 0.45 : 0;
    const unfoldDuration = reduceMotion ? Math.min(duration, 0.22) : duration;
    const staggerVars: gsap.StaggerVars = {
      each: reduceMotion ? Math.min(safeStagger, 0.02) : safeStagger,
      from: staggerFrom
    };

    const pieces = elements.map((element): Piece => {
      const parts = safeStyle === 'blinds' ? (Array.from(element.children) as HTMLElement[]) : [element];
      if (safeStyle === 'blinds') {
        element.style.opacity = '1';
        parts.forEach((part, index) => {
          part.style.transformOrigin = slats.origins[index];
          if (index > 0) part.style.clipPath = slats.clips[index];
        });
      } else {
        element.style.transformOrigin = safeStyle === 'flip' ? '50% 50%' : origin;
        element.style.backfaceVisibility = safeStyle === 'flip' ? 'visible' : '';
      }
      return { element, parts, t: startsFolded ? 0 : 1, f: 0, r: 0, aim: 0 };
    });

    const shade = (progress: number, tilt: number) => String(crease * clamp(1 - progress + tilt / 90, 0, 1));

    const render = () => {
      pieces.forEach(piece => {
        const tilt = piece.r * refold;

        if (safeStyle === 'blinds') {
          let resting = tilt < 0.05;
          piece.parts.forEach((part, index) => {
            const offset = index * SLAT_DELAY;
            const open = unfoldEase(clamp((piece.t - offset) / (1 - SLAT_DELAY), 0, 1));
            const close = foldEase(clamp((piece.f - offset) / (1 - SLAT_DELAY), 0, 1));
            const progress = open * (1 - close);
            if (Math.abs(1 - progress) > 0.002) resting = false;
            part.style.transform = `${axis}(${sign * ((1 - progress) * angle + tilt)}deg)`;
            part.style.opacity = String(clamp(progress, 0, 1));
            part.style.setProperty('--fold-crease', shade(progress, tilt));
          });
          piece.parts[0].style.clipPath = resting ? 'none' : slats.clips[0];
          piece.parts[1].style.visibility = resting ? 'hidden' : 'visible';
          return;
        }

        const progress = unfoldEase(piece.t) * (1 - foldEase(piece.f));
        const rise = lift * Math.sin(Math.PI * clamp(progress, 0, 1));
        const turn = `${axis}(${sign * ((1 - progress) * angle + tilt)}deg)`;
        piece.element.style.transform = rise > 0.001 ? `translateZ(${rise}em) ${turn}` : turn;
        piece.element.style.opacity = String(clamp(progress, 0, 1));
        piece.element.style.setProperty('--fold-crease', shade(progress, tilt));
      });
    };

    let timeline: gsap.core.Timeline | null = null;
    let scrollTrigger: ScrollTrigger | null = null;

    const play = (loop: boolean) => {
      timeline?.kill();
      timeline = gsap.timeline({ onUpdate: render, ...(loop ? { repeat: -1, repeatDelay: 0.35 } : {}) });
      timeline.fromTo(pieces, { t: 0, f: 0 }, { t: 1, duration: unfoldDuration, ease: 'none', stagger: staggerVars });
      if (loop) {
        timeline.to(
          pieces,
          { f: 1, duration: unfoldDuration * 0.75, ease: 'none', stagger: staggerVars },
          `+=${safeDelay}`
        );
      }
      render();
    };

    const handleEnter = () => play(false);

    if (trigger === 'hover') {
      render();
      root.addEventListener('mouseenter', handleEnter);
    } else if (trigger === 'scroll') {
      render();
      scrollTrigger = ScrollTrigger.create({
        trigger: root,
        start: 'top 82%',
        once: true,
        onEnter: handleEnter
      });
    } else {
      play(trigger === 'loop');
    }

    let pointer: Point | null = null;
    let centers: Point[] | null = null;
    let measured: { width: number; height: number } | null = null;
    let relaxing = false;

    const measure = (box: DOMRect) => {
      centers = pieces.map(piece => {
        const rect = (piece.element.parentElement ?? piece.element).getBoundingClientRect();
        return { x: rect.left - box.left + rect.width / 2, y: rect.top - box.top + rect.height / 2 };
      });
      measured = { width: box.width, height: box.height };
    };

    const relax = (time: number, deltaTime: number) => {
      const step = Math.min(deltaTime, 64) / 1000;
      let moving = false;
      pieces.forEach(piece => {
        const rate = piece.aim > piece.r ? 14 : 6;
        piece.r += (piece.aim - piece.r) * (1 - Math.exp(-rate * step));
        if (Math.abs(piece.aim - piece.r) > 0.001) moving = true;
        else piece.r = piece.aim;
      });
      render();
      if (!moving) {
        gsap.ticker.remove(relax);
        relaxing = false;
      }
    };

    const aim = () => {
      const box = root.getBoundingClientRect();
      const near =
        pointer &&
        pointer.x > box.left - safeRadius &&
        pointer.x < box.right + safeRadius &&
        pointer.y > box.top - safeRadius &&
        pointer.y < box.bottom + safeRadius;
      if (
        near &&
        (!centers || !measured || Math.abs(box.width - measured.width) + Math.abs(box.height - measured.height) > 1)
      ) {
        measure(box);
      }
      let changed = false;
      pieces.forEach((piece, index) => {
        let value = 0;
        if (near && pointer && centers) {
          const center = centers[index];
          const distance = Math.hypot(box.left + center.x - pointer.x, box.top + center.y - pointer.y) / safeRadius;
          if (distance < 1) value = 1 - distance * distance * (3 - 2 * distance);
        }
        if (value !== piece.aim) changed = true;
        piece.aim = value;
      });
      if (changed && !relaxing) {
        relaxing = true;
        gsap.ticker.add(relax);
      }
    };

    const handleMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      aim();
    };

    const handleLeave = () => {
      pointer = null;
      aim();
    };

    const handleScroll = () => {
      if (pointer) aim();
    };

    if (refold) {
      window.addEventListener('pointermove', handleMove, { passive: true });
      window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
      document.documentElement.addEventListener('pointerleave', handleLeave);
    }

    return () => {
      root.removeEventListener('mouseenter', handleEnter);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('scroll', handleScroll, { capture: true });
      document.documentElement.removeEventListener('pointerleave', handleLeave);
      gsap.ticker.remove(relax);
      scrollTrigger?.kill();
      timeline?.kill();
      gsap.killTweensOf(pieces);
    };
  }, [
    segments,
    hingeConfig,
    safeStyle,
    duration,
    safeStagger,
    staggerFrom,
    safeAngle,
    ease,
    safeCrease,
    trigger,
    safeDelay,
    hoverRefold,
    safeRadius,
    safeRefold,
    startsFolded
  ]);

  const rootStyle = {
    '--fold-text-font-size': typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
    '--fold-text-font-weight': fontWeight,
    '--fold-text-color': color,
    '--fold-perspective': `${Math.max(120, perspective)}px`,
    ...style
  } as CSSProperties;

  return (
    <span ref={rootRef} className={`fold-text ${className}`.trim()} style={rootStyle}>
      <span className="fold-text-sr-only">{text}</span>
      <span className="fold-text-visual" aria-hidden="true">
        {segments}
      </span>
    </span>
  );
};

export default FoldText;
