'use client';

import { useEffect, useLayoutEffect, useRef, useState, type FC } from 'react';
import { motion, useReducedMotion, type Transition } from 'motion/react';

interface TrueFocusProps {
  sentence?: string;
  separator?: string;
  manualMode?: boolean;
  focusStyle?: 'brackets' | 'box' | 'underline' | 'highlight';
  order?: 'sequential' | 'random';
  easing?: 'smooth' | 'spring';
  blurAmount?: number;
  focusScale?: number;
  borderColor?: string;
  highlightColor?: string;
  glowColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
  cornerSize?: number;
  borderWidth?: number;
  unfocusedOpacity?: number;
}

interface FocusRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

const CORNERS: Corner[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
const FRAME_GAP = 10;
const SMOOTH_EASE = [0.65, 0, 0.35, 1] as const;
const SMOOTH_CSS = 'cubic-bezier(0.65, 0, 0.35, 1)';
const SPRING_CSS = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const TrueFocus: FC<TrueFocusProps> = ({
  sentence = 'True Focus',
  separator = ' ',
  manualMode = false,
  focusStyle = 'brackets',
  order = 'sequential',
  easing = 'smooth',
  blurAmount = 5,
  focusScale = 1,
  borderColor = 'green',
  highlightColor,
  glowColor = 'transparent',
  animationDuration = 0.5,
  pauseBetweenAnimations = 1,
  cornerSize = 16,
  borderWidth = 3,
  unfocusedOpacity = 1
}) => {
  const words = sentence.split(separator).filter(word => word.trim() !== '');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [focusRect, setFocusRect] = useState<FocusRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const reduceMotion = useReducedMotion();
  const duration = reduceMotion ? 0 : animationDuration;
  const activeIndex = words.length ? currentIndex % words.length : -1;
  const spring = easing === 'spring' && !reduceMotion;
  const transition: Transition = spring
    ? { type: 'spring', visualDuration: duration, bounce: 0.38 }
    : { duration, ease: SMOOTH_EASE };

  useEffect(() => {
    if (manualMode || words.length < 2) return;
    const interval = setInterval(
      () => {
        const roll = Math.random();
        setCurrentIndex(prev => {
          const current = prev % words.length;
          if (order !== 'random') return (current + 1) % words.length;
          const next = Math.floor(roll * (words.length - 1));
          return next >= current ? next + 1 : next;
        });
      },
      (animationDuration + pauseBetweenAnimations) * 1000
    );
    return () => clearInterval(interval);
  }, [manualMode, animationDuration, pauseBetweenAnimations, words.length, order]);

  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current;
    const word = wordRefs.current[activeIndex];
    if (!container || !word) return;

    const measure = () => {
      const next = { x: word.offsetLeft, y: word.offsetTop, width: word.offsetWidth, height: word.offsetHeight };
      setFocusRect(prev =>
        prev && prev.x === next.x && prev.y === next.y && prev.width === next.width && prev.height === next.height
          ? prev
          : next
      );
    };

    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    wordRefs.current.forEach(node => node && observer.observe(node));
    return () => observer.disconnect();
  }, [activeIndex, sentence, separator]);

  const frame: FocusRect | null = focusRect && {
    x: focusRect.x - (focusRect.width * (focusScale - 1)) / 2,
    y: focusRect.y - (focusRect.height * (focusScale - 1)) / 2,
    width: focusRect.width * focusScale,
    height: focusRect.height * focusScale
  };

  const corners: Record<Corner, { x: number; y: number }> | null = frame && {
    'top-left': { x: frame.x - FRAME_GAP, y: frame.y - FRAME_GAP },
    'top-right': { x: frame.x + frame.width + FRAME_GAP - cornerSize, y: frame.y - FRAME_GAP },
    'bottom-left': { x: frame.x - FRAME_GAP, y: frame.y + frame.height + FRAME_GAP - cornerSize },
    'bottom-right': {
      x: frame.x + frame.width + FRAME_GAP - cornerSize,
      y: frame.y + frame.height + FRAME_GAP - cornerSize
    }
  };

  const shapes = frame && {
    box: {
      x: frame.x - FRAME_GAP,
      y: frame.y - FRAME_GAP,
      width: frame.width + FRAME_GAP * 2,
      height: frame.height + FRAME_GAP * 2
    },
    underline: {
      x: frame.x,
      y: frame.y + frame.height + FRAME_GAP * 0.4,
      width: frame.width,
      height: borderWidth
    },
    highlight: {
      x: frame.x - frame.height * 0.14,
      y: frame.y + frame.height * 0.04,
      width: frame.width + frame.height * 0.28,
      height: frame.height * 0.92
    }
  };

  const glow = `drop-shadow(0 0 4px ${glowColor})`;

  return (
    <div
      className="relative flex gap-[1em] justify-center items-center flex-wrap outline-none select-none"
      ref={containerRef}
    >
      {focusStyle === 'highlight' && shapes && (
        <motion.span
          className="pointer-events-none absolute left-0 top-0 rounded-md"
          aria-hidden="true"
          style={{ backgroundColor: `color-mix(in srgb, ${highlightColor ?? borderColor} 30%, transparent)` }}
          initial={{ ...shapes.highlight, opacity: 0 }}
          animate={{ ...shapes.highlight, opacity: 1 }}
          transition={transition}
        />
      )}

      {words.map((word, index) => {
        const isActive = index === activeIndex;
        return (
          <span
            key={index}
            ref={el => {
              wordRefs.current[index] = el;
            }}
            className="relative text-[3rem] font-black cursor-pointer outline-none select-none"
            style={{
              filter: `blur(${isActive ? 0 : blurAmount}px)`,
              opacity: isActive ? 1 : unfocusedOpacity,
              transform: focusScale !== 1 ? `scale(${isActive ? focusScale : 1})` : undefined,
              transition: `filter ${duration}s ease, opacity ${duration}s ease, transform ${duration}s ${spring ? SPRING_CSS : SMOOTH_CSS}`
            }}
            onMouseEnter={() => {
              if (manualMode) setCurrentIndex(index);
            }}
          >
            {word}
          </span>
        );
      })}

      {shapes && corners && focusStyle !== 'highlight' && (
        <div className="absolute top-0 left-0 pointer-events-none" aria-hidden="true">
          {focusStyle === 'box' && (
            <motion.span
              className="absolute left-0 top-0 box-border rounded-md"
              style={{ border: `${borderWidth}px solid ${borderColor}`, filter: glow }}
              initial={{ ...shapes.box, opacity: 0 }}
              animate={{ ...shapes.box, opacity: 1 }}
              transition={transition}
            />
          )}
          {focusStyle === 'underline' && (
            <motion.span
              className="absolute left-0 top-0"
              style={{ backgroundColor: borderColor, borderRadius: borderWidth / 2, filter: glow }}
              initial={{ ...shapes.underline, opacity: 0 }}
              animate={{ ...shapes.underline, opacity: 1 }}
              transition={transition}
            />
          )}
          {focusStyle !== 'box' &&
            focusStyle !== 'underline' &&
            CORNERS.map(corner => {
              const top = corner.startsWith('top');
              const left = corner.endsWith('left');
              return (
                <motion.span
                  key={corner}
                  className="absolute top-0 left-0 box-border rounded-[3px]"
                  style={{
                    width: cornerSize,
                    height: cornerSize,
                    borderStyle: 'solid',
                    borderColor,
                    borderTopWidth: top ? borderWidth : 0,
                    borderBottomWidth: top ? 0 : borderWidth,
                    borderLeftWidth: left ? borderWidth : 0,
                    borderRightWidth: left ? 0 : borderWidth,
                    filter: glow
                  }}
                  initial={{ ...corners[corner], opacity: 0 }}
                  animate={{ ...corners[corner], opacity: 1 }}
                  transition={transition}
                />
              );
            })}
        </div>
      )}
    </div>
  );
};

export default TrueFocus;
