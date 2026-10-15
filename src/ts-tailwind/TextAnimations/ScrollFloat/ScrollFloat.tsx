'use client';

import React, {
  Children,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject
} from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

type ScrollFloatEffect = 'float' | 'flip' | 'scatter' | 'blur' | 'wave';
type ScrollFloatSplit = 'chars' | 'words';
type ScrollFloatDirection = 'up' | 'down';
type ScrollFloatOrder = 'start' | 'end' | 'center' | 'edges' | 'random';

interface ScrollFloatProps {
  children: ReactNode;
  scrollContainerRef?: RefObject<HTMLElement | null>;
  containerClassName?: string;
  textClassName?: string;
  effect?: ScrollFloatEffect;
  splitBy?: ScrollFloatSplit;
  direction?: ScrollFloatDirection;
  order?: ScrollFloatOrder;
  fromColor?: string;
  animationDuration?: number;
  ease?: string;
  scrollStart?: string;
  scrollEnd?: string;
  stagger?: number;
  distance?: number;
  stretch?: number;
  smoothing?: number;
}

const clampToScroll = (position: string) =>
  typeof position === 'string' && !position.startsWith('clamp(') ? `clamp(${position})` : position;

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

const smoothstep = (from: number, to: number, value: number) => {
  const k = clamp01((value - from) / (to - from));
  return k * k * (3 - 2 * k);
};

const random = (index: number, salt: number) => {
  const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

const getDelays = (count: number, order: ScrollFloatOrder, stagger: number) => {
  const middle = (count - 1) / 2;
  const ranks = Array.from({ length: count }, (_, index) => {
    if (order === 'end') return count - 1 - index;
    if (order === 'center') return Math.abs(index - middle);
    if (order === 'edges') return middle - Math.abs(index - middle);
    return index;
  });
  if (order === 'random') {
    const shuffled = ranks.map((_, index) => index).sort((a, b) => random(a, 9) - random(b, 9));
    shuffled.forEach((target, rank) => {
      ranks[target] = rank;
    });
  }
  const first = Math.min(...ranks);
  return ranks.map(rank => (rank - first) * Math.max(0, stagger));
};

const ScrollFloat: React.FC<ScrollFloatProps> = ({
  children,
  scrollContainerRef,
  containerClassName = '',
  textClassName = '',
  effect = 'float',
  splitBy = 'chars',
  direction = 'up',
  order = 'start',
  fromColor = 'currentColor',
  animationDuration = 1,
  ease = 'back.inOut(2)',
  scrollStart = 'center bottom+=50%',
  scrollEnd = 'bottom bottom-=40%',
  stagger = 0.03,
  distance = 120,
  stretch = 2.3,
  smoothing = 0
}) => {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  const text = useMemo(() => {
    const parts = Children.toArray(children);
    return parts.every(part => typeof part === 'string' || typeof part === 'number') ? parts.join('') : null;
  }, [children]);

  const shiftColor = fromColor && fromColor !== 'currentColor' ? fromColor : null;
  const shiftStyle = useMemo<CSSProperties | undefined>(
    () =>
      shiftColor
        ? { color: `color-mix(in oklab, ${shiftColor} calc(var(--scroll-float-mix, 0) * 100%), currentColor)` }
        : undefined,
    [shiftColor]
  );

  const splitText = useMemo(() => {
    if (text === null) return null;
    return text.split(/(\s+)/).map((word, wordIndex) =>
      word.trim() === '' ? (
        word
      ) : (
        <span className="inline-block whitespace-nowrap" data-word key={wordIndex}>
          {Array.from(word).map((char, charIndex) => (
            <span className="inline-block" data-char key={charIndex} style={shiftStyle}>
              {char}
            </span>
          ))}
        </span>
      )
    );
  }, [text, shiftStyle]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useIsomorphicLayoutEffect(() => {
    const el = containerRef.current;
    const textEl = textRef.current;
    if (!el || !textEl) return;
    if (scrollContainerRef && !scrollContainerRef.current) return;

    const scroller = scrollContainerRef?.current || window;
    const pieces = el.querySelectorAll<HTMLElement>(splitBy === 'words' ? '[data-word]' : '[data-char]');
    const targets: HTMLElement[] = pieces.length ? Array.from(pieces) : [textEl];
    const indexOf = new Map<Element, number>(targets.map((target, index) => [target, index]));
    const at = (fn: (index: number) => number) => (_: number, target: Element) => fn(indexOf.get(target) ?? 0);
    const middle = (targets.length - 1) / 2;
    const edge = (index: number) => (middle > 0 ? (index - middle) / middle : 0);
    const delays = getDelays(targets.length, order, stagger);
    const sign = direction === 'down' ? -1 : 1;
    const reach = Math.max(0, Number(distance) || 0) / 120;
    const squeeze = stretch > 0 ? stretch ** -0.43 : 1;
    const baseEase = gsap.parseEase(ease) || ((p: number) => p);
    const timing = (p: number) => clamp01(baseEase(p));
    const size = () => parseFloat(getComputedStyle(textEl).fontSize) || 16;
    const swell = (p: number) => {
      const t = timing(p);
      return 1 - Math.cos(t * Math.PI * 2.5) * Math.pow(1 - t, 2.6);
    };
    const sway = (p: number) => {
      const t = timing(p);
      return Math.sin(t * Math.PI * 2.5) * Math.pow(1 - t, 2.6);
    };
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          scroller,
          start: scrollStart,
          end: clampToScroll(scrollEnd),
          scrub: smoothing > 0 ? smoothing : true,
          invalidateOnRefresh: true
        }
      });
      const add = (fromVars: gsap.TweenVars, toVars: gsap.TweenVars) => {
        gsap.set(targets, { willChange: 'opacity, transform', ...fromVars });
        return timeline.fromTo(
          targets,
          { willChange: 'opacity, transform', ...fromVars },
          { duration: animationDuration, stagger: (index: number) => delays[index] || 0, ...toVars },
          0
        );
      };

      if (effect === 'flip') {
        add(
          {
            rotationX: -90 * sign,
            transformPerspective: () => size() * 4,
            transformOrigin: () => `50% 50% ${(-size() * 0.55 * reach).toFixed(2)}`,
            backfaceVisibility: 'hidden'
          },
          { ease, rotationX: 0 }
        );
        add({ opacity: 0 }, { ease: (p: number) => smoothstep(0.05, 0.55, timing(p)), opacity: 1 });
      } else if (effect === 'scatter') {
        add(
          {
            x: at(index => ((random(index, 1) * 2 - 1) * 1.3 - edge(index) * 0.9) * size() * reach),
            y: at(index => sign * (0.35 + random(index, 2)) * size() * 1.1 * reach),
            rotation: at(index => (random(index, 3) < 0.5 ? -1 : 1) * (40 + random(index, 4) * 120)),
            scale: at(index => 0.35 + random(index, 5) * 0.9),
            transformOrigin: '50% 50%'
          },
          { ease, x: 0, y: 0, rotation: 0, scale: 1 }
        );
        add({ opacity: 0 }, { ease: (p: number) => smoothstep(0, 0.4, timing(p)), opacity: 1 });
      } else if (effect === 'blur') {
        add(
          {
            willChange: 'opacity, transform, filter',
            opacity: 0,
            y: () => sign * size() * 0.3 * reach,
            scale: 1.45,
            filter: () => `blur(${(size() * 0.2).toFixed(2)}px)`,
            transformOrigin: '50% 50%'
          },
          { ease, opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }
        );
      } else if (effect === 'wave') {
        add(
          {
            yPercent: 120 * reach * sign,
            scaleY: stretch,
            scaleX: squeeze,
            transformOrigin: sign > 0 ? '50% 100%' : '50% 0%'
          },
          { ease: swell, yPercent: 0, scaleY: 1, scaleX: 1 }
        );
        add({ rotation: 0 }, { ease: sway, rotation: -16 * sign });
        add({ opacity: 0 }, { ease: (p: number) => clamp01(timing(p) * 2.5), opacity: 1 });
      } else {
        add(
          {
            opacity: 0,
            yPercent: 120 * reach * sign,
            scaleY: stretch,
            scaleX: squeeze,
            transformOrigin: sign > 0 ? '50% 0%' : '50% 100%'
          },
          { ease, opacity: 1, yPercent: 0, scaleY: 1, scaleX: 1 }
        );
      }

      if (shiftColor) {
        add(
          { '--scroll-float-mix': 1 },
          { ease: (p: number) => smoothstep(0.5, 1, timing(p)), '--scroll-float-mix': 0 }
        );
      }
    });

    return () => mm.revert();
  }, [
    mounted,
    scrollContainerRef,
    text,
    effect,
    splitBy,
    direction,
    order,
    shiftColor,
    animationDuration,
    ease,
    scrollStart,
    scrollEnd,
    stagger,
    distance,
    stretch,
    smoothing
  ]);

  return (
    <h2
      ref={containerRef}
      className={`my-5 ${effect === 'float' ? 'overflow-hidden' : 'overflow-x-clip overflow-y-visible'} ${containerClassName}`}
    >
      {text !== null && <span className="sr-only">{text}</span>}
      <span
        ref={textRef}
        className={`inline-block text-[clamp(1.6rem,8vw,10rem)] font-black text-center leading-[1.5] ${textClassName}`}
        style={text === null ? shiftStyle : undefined}
        aria-hidden={text !== null ? true : undefined}
      >
        {splitText ?? children}
      </span>
    </h2>
  );
};

export default ScrollFloat;
