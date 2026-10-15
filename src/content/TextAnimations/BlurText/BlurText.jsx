'use client';

import { motion, MotionConfig } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';

const AXES = {
  top: ['y', -1],
  bottom: ['y', 1],
  left: ['x', -1],
  right: ['x', 1]
};

const EASE_OUT = [0.33, 1, 0.68, 1];
const EASE_IN_OUT = [0.65, 0, 0.35, 1];
const EASE_IN = [0.55, 0, 0.9, 0.45];
const CSS_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const MOVE_KEYS = ['x', 'y', 'scale', 'rotateX', 'rotateY', 'skewX'];
const INSTANT = { duration: 0 };

const SR_ONLY = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
  userSelect: 'none'
};

const PIECE_STYLE = { display: 'inline-block', willChange: 'transform, filter, opacity' };
const WORD_STYLE = { display: 'inline-flex' };

const blurTo = px => `blur(${Math.max(0, px)}px)`;

const buildEffect = (effect, direction, blur, distance) => {
  const [axis, sign] = AXES[direction] || AXES.top;
  const b = Math.max(0, blur);
  const d = distance;

  if (effect === 'zoom') {
    return {
      from: { filter: blurTo(b * 1.2), opacity: 0, scale: 1.4, [axis]: sign * d * 0.35 },
      steps: [
        { filter: blurTo(b * 0.2), opacity: 0.9, scale: 0.97, [axis]: -sign * d * 0.03 },
        { filter: blurTo(0), opacity: 1, scale: 1, [axis]: 0 }
      ],
      exit: { filter: blurTo(b), opacity: 0, scale: 0.82, [axis]: -sign * d * 0.2 },
      times: [0, 0.6, 1],
      fade: EASE_OUT,
      bounce: 0.25,
      settle: 0.5,
      exitEase: EASE_IN
    };
  }

  if (effect === 'tilt') {
    const rotate = axis === 'y' ? 'rotateX' : 'rotateY';
    const lean = axis === 'y' ? -sign : sign;
    return {
      from: { filter: blurTo(b), opacity: 0, [rotate]: lean * 55, [axis]: sign * d * 0.5, transformPerspective: 600 },
      steps: [
        {
          filter: blurTo(b * 0.15),
          opacity: 0.95,
          [rotate]: -lean * 8,
          [axis]: -sign * d * 0.04,
          transformPerspective: 600
        },
        { filter: blurTo(0), opacity: 1, [rotate]: 0, [axis]: 0, transformPerspective: 600 }
      ],
      exit: { filter: blurTo(b), opacity: 0, [rotate]: -lean * 40, [axis]: -sign * d * 0.3, transformPerspective: 600 },
      times: [0, 0.6, 1],
      fade: EASE_OUT,
      bounce: 0.3,
      settle: 0.8,
      origin: { originX: axis === 'x' ? (sign < 0 ? 0 : 1) : 0.5, originY: axis === 'y' ? (sign < 0 ? 0 : 1) : 0.5 },
      exitEase: EASE_IN
    };
  }

  if (effect === 'focus') {
    const soft = { filter: blurTo(b * 1.4), opacity: 0.32, scale: 1.12 };
    return {
      from: soft,
      steps: [
        { filter: blurTo(b * 0.1), opacity: 0.95, scale: 0.995 },
        { filter: blurTo(0), opacity: 1, scale: 1 }
      ],
      exit: soft,
      times: [0, 0.72, 1],
      fade: EASE_IN_OUT,
      bounce: null,
      settle: 1,
      exitEase: EASE_IN_OUT
    };
  }

  if (effect === 'drift') {
    const h = direction === 'right' ? 1 : -1;
    const v = axis === 'y' ? sign : 0;
    return {
      from: { filter: blurTo(b), opacity: 0, x: h * d * 1.6, y: v * d * 0.3, skewX: h * 28 },
      steps: [
        { filter: blurTo(b * 0.15), opacity: 0.95, x: -h * d * 0.06, y: 0, skewX: -h * 7 },
        { filter: blurTo(0), opacity: 1, x: 0, y: 0, skewX: 0 }
      ],
      exit: { filter: blurTo(b), opacity: 0, x: -h * d * 1.2, y: -v * d * 0.2, skewX: h * 20 },
      times: [0, 0.62, 1],
      fade: EASE_OUT,
      bounce: 0.3,
      settle: 0.55,
      exitEase: EASE_IN
    };
  }

  return {
    from: { filter: blurTo(b), opacity: 0, [axis]: sign * d },
    steps: [
      { filter: blurTo(b / 2), opacity: 0.5, [axis]: (-sign * d) / 10 },
      { filter: blurTo(0), opacity: 1, [axis]: 0 }
    ],
    exit: { filter: blurTo(b), opacity: 0, [axis]: -sign * d * 0.6 },
    times: [0, 0.5, 1],
    fade: 'linear',
    bounce: 0.35,
    settle: 0.5,
    exitEase: EASE_IN
  };
};

const buildKeyframes = (from, steps) => {
  const keys = new Set([...Object.keys(from), ...steps.flatMap(s => Object.keys(s))]);

  const keyframes = {};
  keys.forEach(k => {
    keyframes[k] = [from[k], ...steps.map(s => s[k])];
  });
  return keyframes;
};

const buildRanks = (count, staggerFrom, seedText) => {
  const ranks = Array.from({ length: count }, (_, i) => i);
  if (staggerFrom === 'end') return ranks.map(i => count - 1 - i);
  if (staggerFrom === 'center') {
    const mid = (count - 1) / 2;
    const offset = count % 2 === 0 ? 0.5 : 0;
    return ranks.map(i => Math.abs(i - mid) - offset);
  }
  if (staggerFrom === 'random') {
    let seed = 2166136261;
    for (let i = 0; i < seedText.length; i++) seed = Math.imul(seed ^ seedText.charCodeAt(i), 16777619) >>> 0;
    const next = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const order = ranks.slice();
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    order.forEach((piece, rank) => {
      ranks[piece] = rank;
    });
  }
  return ranks;
};

const startPhase = trigger =>
  trigger === 'load' ? 'in' : trigger === 'hover' || trigger === 'click' ? 'rest' : 'from';

const BlurText = ({
  text = '',
  delay = 200,
  className = '',
  animateBy = 'words',
  direction = 'top',
  threshold = 0.1,
  rootMargin = '0px',
  animationFrom,
  animationTo,
  easing,
  onAnimationComplete,
  stepDuration = 0.35,
  blur = 10,
  distance = 50,
  effect = 'blur',
  staggerFrom = 'start',
  trigger = 'view',
  loop = false,
  loopDelay = 2,
  color,
  fromColor,
  focusOnHover = false
}) => {
  const ref = useRef(null);
  const [phase, setPhase] = useState(() => startPhase(trigger));
  const firstPhase = useRef(phase).current;
  const [focusWord, setFocusWord] = useState(-1);
  const settledRef = useRef(phase === 'rest');
  const completeRef = useRef(onAnimationComplete);
  completeRef.current = onAnimationComplete;

  const fx = useMemo(() => buildEffect(effect, direction, blur, distance), [effect, direction, blur, distance]);

  const custom = Boolean(animationFrom || animationTo || easing);
  const fromSnapshot = animationFrom ?? fx.from;
  const toSnapshots = animationTo ?? fx.steps;
  const exitSnapshot = animationFrom ?? fx.exit;
  const restSnapshot = toSnapshots[toSnapshots.length - 1];
  const animateKeyframes = useMemo(
    () => buildKeyframes(fromSnapshot, custom ? toSnapshots : [restSnapshot]),
    [fromSnapshot, toSnapshots, restSnapshot, custom]
  );

  const stepCount = toSnapshots.length + 1;
  const totalDuration = stepDuration * (stepCount - 1);
  const times = animationTo
    ? Array.from({ length: stepCount }, (_, i) => (stepCount === 1 ? 0 : i / (stepCount - 1)))
    : fx.times;
  const stagger = Math.max(0, delay) / 1000;
  const exitDuration = stepDuration * 1.3;
  const exitStagger = stagger * 0.4;

  const words = useMemo(() => text.split(' '), [text]);

  const pieces = useMemo(() => {
    const list = [];
    words.forEach((word, w) => {
      const isLast = w === words.length - 1;
      if (animateBy === 'words') {
        list.push({ word: w, content: isLast ? word : `${word}\u00A0`, key: `word-${w}` });
        return;
      }
      Array.from(word).forEach((char, c) => list.push({ word: w, content: char, key: `char-${w}-${c}` }));
      if (!isLast) list.push({ word: w, content: '\u00A0', key: `space-${w}` });
    });
    return list;
  }, [words, animateBy]);

  const groups = useMemo(() => {
    const list = words.map(() => []);
    pieces.forEach((piece, index) => list[piece.word].push(index));
    return list;
  }, [words, pieces]);

  const ranks = useMemo(() => buildRanks(pieces.length, staggerFrom, text), [pieces.length, staggerFrom, text]);
  const maxRank = ranks.reduce((max, rank) => Math.max(max, rank), 0);
  const inTotal = (totalDuration * (custom ? 1 : Math.max(1, fx.settle * 2.2)) + maxRank * stagger) * 1000;
  const outTotal = (exitDuration + maxRank * exitStagger) * 1000;

  useEffect(() => {
    if (phase !== 'from') return undefined;
    if (trigger === 'load') {
      setPhase('in');
      return undefined;
    }
    if (trigger === 'hover' || trigger === 'click') {
      setPhase('rest');
      return undefined;
    }
    const element = ref.current;
    if (!element) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPhase(current => (current === 'from' ? 'in' : current));
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [phase, trigger, threshold, rootMargin]);

  useEffect(() => {
    let timer = 0;
    if (phase === 'in') {
      settledRef.current = false;
      timer = window.setTimeout(() => {
        settledRef.current = true;
        completeRef.current?.();
        if (loop) timer = window.setTimeout(() => setPhase('out'), Math.max(0, loopDelay) * 1000);
      }, inTotal);
    } else if (phase === 'rest') {
      settledRef.current = true;
      if (loop) timer = window.setTimeout(() => setPhase('out'), Math.max(0, loopDelay) * 1000);
    } else if (phase === 'out') {
      settledRef.current = false;
      timer = window.setTimeout(() => setPhase('in'), outTotal);
    }
    return () => window.clearTimeout(timer);
  }, [phase, loop, loopDelay, inTotal, outTotal]);

  const replay = () => {
    if (phase === 'out' || phase === 'from') return;
    setPhase('out');
  };

  const handleEnter = () => {
    if (settledRef.current) replay();
  };

  const inTransition = rank => {
    const delayed = rank * stagger;
    if (custom) return { duration: totalDuration, times, delay: delayed, ease: easing ?? 'linear' };
    const transition = { duration: totalDuration, delay: delayed, ease: fx.fade };
    if (fx.bounce === null) return transition;
    const move = { type: 'spring', visualDuration: totalDuration * fx.settle, bounce: fx.bounce, delay: delayed };
    MOVE_KEYS.forEach(key => {
      if (key in fromSnapshot) transition[key] = move;
    });
    return transition;
  };

  const target =
    phase === 'in' ? animateKeyframes : phase === 'out' ? exitSnapshot : phase === 'rest' ? restSnapshot : fromSnapshot;
  const tinted = Boolean(fromColor) && (phase === 'from' || phase === 'out');
  const dim = Math.min(6, Math.max(2, blur * 0.3));
  const pieceStyle = fx.origin && !custom ? { ...PIECE_STYLE, ...fx.origin } : PIECE_STYLE;

  const renderPiece = index => {
    const piece = pieces[index];
    const rank = ranks[index];
    const transition =
      phase === 'in'
        ? inTransition(rank)
        : phase === 'out'
          ? { duration: exitDuration, ease: fx.exitEase, delay: rank * exitStagger }
          : INSTANT;
    const style = fromColor
      ? {
          ...pieceStyle,
          color: tinted ? fromColor : undefined,
          transition:
            phase === 'in'
              ? `color ${totalDuration * 0.9}s ${CSS_EASE} ${rank * stagger}s`
              : phase === 'out'
                ? `color ${exitDuration}s ${CSS_EASE} ${rank * exitStagger}s`
                : 'none'
        }
      : pieceStyle;

    return (
      <motion.span
        aria-hidden="true"
        key={piece.key}
        style={style}
        initial={firstPhase === 'rest' ? false : fromSnapshot}
        animate={target}
        transition={transition}
      >
        {piece.content}
      </motion.span>
    );
  };

  const wordStyle = w => {
    if (!focusOnHover) return WORD_STYLE;
    const dimmed = focusWord !== -1 && focusWord !== w;
    return {
      ...WORD_STYLE,
      filter: dimmed ? `blur(${dim}px)` : 'blur(0px)',
      opacity: dimmed ? 0.3 : 1,
      transition: `filter 0.45s ${CSS_EASE}, opacity 0.45s ${CSS_EASE}`
    };
  };

  return (
    <MotionConfig reducedMotion="user">
      <p
        ref={ref}
        className={className}
        style={{ display: 'flex', flexWrap: 'wrap', color, cursor: trigger === 'click' ? 'pointer' : undefined }}
        onPointerEnter={trigger === 'hover' ? handleEnter : undefined}
        onClick={trigger === 'click' ? replay : undefined}
      >
        <span style={SR_ONLY}>{text}</span>
        {groups.map((indices, w) => (
          <span
            key={`word-${w}`}
            style={wordStyle(w)}
            onPointerEnter={focusOnHover ? () => setFocusWord(w) : undefined}
            onPointerLeave={focusOnHover ? () => setFocusWord(-1) : undefined}
          >
            {indices.map(renderPiece)}
          </span>
        ))}
      </p>
    </MotionConfig>
  );
};

export default BlurText;
