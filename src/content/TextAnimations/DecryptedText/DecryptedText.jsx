'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';

const styles = {
  wrapper: {
    display: 'inline-block',
    whiteSpace: 'pre-wrap'
  },
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0,0,0,0)',
    whiteSpace: 'nowrap',
    border: 0
  },
  word: {
    whiteSpace: 'nowrap'
  },
  cell: {
    position: 'relative',
    display: 'inline-block'
  },
  ghost: {
    visibility: 'hidden'
  },
  glyph: {
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)'
  }
};

const FADE_FLOOR = 0.16;
const FADE_PEAK = 0.62;
const FADE_LEAD = 6;
const SETTLE = 'color 0.7s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1)';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const isSpace = char => /\s/.test(char);

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

const glyphWidths = new Map();
let measureContext = null;

const readFont = node => {
  const style = window.getComputedStyle(node);
  return {
    font: `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
    spacing: parseFloat(style.letterSpacing) || 0
  };
};

const advance = (font, glyph) => {
  let widths = glyphWidths.get(font);
  if (!widths) {
    widths = new Map();
    glyphWidths.set(font, widths);
  }
  let width = widths.get(glyph);
  if (width === undefined) {
    measureContext = measureContext || document.createElement('canvas').getContext('2d');
    if (!measureContext) return 0;
    measureContext.font = font;
    width = measureContext.measureText(glyph).width;
    widths.set(glyph, width);
  }
  return width;
};

const flipFrames = (angle, opacity) => [
  { transform: `perspective(4em) translateZ(-0.42em) rotateX(${angle}deg) translateZ(0.42em)`, opacity },
  { transform: 'perspective(4em) translateZ(-0.42em) rotateX(0deg) translateZ(0.42em)', opacity: 1 }
];

export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = 'start',
  useOriginalCharsOnly = false,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+',
  className = '',
  parentClassName = '',
  encryptedClassName = '',
  animateOn = 'hover',
  clickMode = 'once',
  effect = 'scramble',
  scrambleColor = '',
  loop = false,
  loopDelay = 2000,
  hoverRadius = 0,
  ...props
}) {
  const chars = useMemo(() => Array.from(String(text ?? '')), [text]);

  const pool = useMemo(() => {
    const letters = chars.filter(char => !isSpace(char));
    const source = useOriginalCharsOnly ? Array.from(new Set(letters)) : Array.from(characters);
    return source.length ? source : letters;
  }, [useOriginalCharsOnly, chars, characters]);

  const startsHidden = animateOn === 'click' || animateOn === 'view' || animateOn === 'inViewHover';
  const hoverable = animateOn === 'hover' || animateOn === 'inViewHover';
  const local = hoverable && hoverRadius > 0;
  const step = Math.max(16, speed);

  const [frame, setFrame] = useState(() => {
    const revealed = chars.map(char => !startsHidden || isSpace(char));
    return {
      shown: chars.map((char, index) =>
        revealed[index] ? char : pool[(char.codePointAt(0) + index * 7) % pool.length]
      ),
      revealed,
      tint: revealed.map(shown => (shown ? 0 : 1)),
      dim: revealed.map(shown => (shown ? 1 : FADE_FLOOR)),
      squeeze: revealed.map(() => 1)
    };
  });

  const containerRef = useRef(null);
  const cellsRef = useRef([]);
  const centersRef = useRef([]);
  const maskRef = useRef(frame.revealed);
  const heatRef = useRef([]);
  const warmRef = useRef(false);
  const pointerRef = useRef(null);
  const runRef = useRef(null);
  const timerRef = useRef(null);
  const holdRef = useRef(null);
  const pendingRef = useRef(null);
  const visibleRef = useRef(true);
  const targetRef = useRef(!startsHidden);
  const playedRef = useRef(false);
  const previousRef = useRef(frame);
  const engineRef = useRef(null);
  const fontRef = useRef(null);

  const revealOrder = () => {
    const order = [];
    chars.forEach((char, index) => {
      if (!isSpace(char)) order.push(index);
    });
    if (revealDirection === 'end') return order.reverse();
    if (revealDirection === 'center') {
      const middle = Math.floor(chars.length / 2);
      return order.sort((a, b) => Math.abs(a - middle) - Math.abs(b - middle));
    }
    if (revealDirection === 'random') {
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
    }
    return order;
  };

  const fit = (index, glyph) => {
    const node = containerRef.current;
    if (!fontRef.current && node) fontRef.current = readFont(node);
    const metrics = fontRef.current;
    if (!metrics) return 1;
    const room = advance(metrics.font, chars[index] ?? glyph) + metrics.spacing;
    const need = advance(metrics.font, glyph) + metrics.spacing;
    return need > room + 0.01 ? Math.round(Math.max(0.05, room / need) * 1000) / 1000 : 1;
  };

  const paint = () => {
    const mask = maskRef.current;
    const heat = heatRef.current;
    const run = runRef.current;
    const ranks = run?.forward && sequential ? new Map(run.queue.map((index, rank) => [index, rank])) : null;
    const ramp = run?.forward && !sequential ? Math.min(1, run.iteration / Math.max(1, maxIterations)) : 0;
    const next = { shown: [], revealed: [], tint: [], dim: [], squeeze: [] };

    chars.forEach((char, index) => {
      const blank = isSpace(char);
      const hot = blank ? 0 : heat[index] || 0;
      const hidden = !blank && !mask[index];
      const scrambled = hidden || (hot > 0 && Math.random() < hot * 2);

      const glyph = scrambled ? pool[Math.floor(Math.random() * pool.length)] : char;
      next.revealed.push(!scrambled);
      next.shown.push(glyph);
      next.squeeze.push(scrambled ? fit(index, glyph) : 1);

      if (!scrambled) {
        next.tint.push(0);
        next.dim.push(1);
      } else if (!hidden) {
        const level = Math.min(1, hot * 1.5);
        next.tint.push(level);
        next.dim.push(1 - (1 - FADE_FLOOR) * level);
      } else {
        const rank = ranks?.get(index);
        const lift = rank === undefined ? ramp : Math.max(0, 1 - rank / FADE_LEAD);
        next.tint.push(1);
        next.dim.push(FADE_FLOOR + (FADE_PEAK - FADE_FLOOR) * lift);
      }
    });

    setFrame(next);
  };

  const refit = () => {
    setFrame(previous => ({
      ...previous,
      squeeze: previous.shown.map((glyph, index) => (previous.revealed[index] ? 1 : fit(index, glyph)))
    }));
  };

  const stopTicker = () => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const ensureTicker = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => engineRef.current?.tick(), step);
  };

  const stopRun = () => {
    runRef.current = null;
    clearTimeout(holdRef.current);
    holdRef.current = null;
    pendingRef.current = null;
  };

  const schedule = (task, delay) => {
    clearTimeout(holdRef.current);
    holdRef.current = setTimeout(() => {
      holdRef.current = null;
      if (visibleRef.current) task();
      else pendingRef.current = task;
    }, delay);
  };

  const startRun = (forward, { from, cycle = false, lead = 0 } = {}) => {
    stopRun();
    targetRef.current = forward;
    if (from) maskRef.current = from;

    if (prefersReducedMotion()) {
      maskRef.current = chars.map(char => forward || isSpace(char));
      paint();
      return;
    }

    const mask = maskRef.current;
    const order = forward ? revealOrder() : revealOrder().reverse();
    const queue = sequential ? order.filter(index => mask[index] !== forward) : [];

    runRef.current = {
      forward,
      cycle,
      iteration: 0,
      queue: [...new Array(lead).fill(null), ...queue]
    };
    paint();
    ensureTicker();
  };

  const finishRun = run => {
    if (!loop) return;
    if (run.forward) {
      schedule(() => engineRef.current?.startRun(false, { cycle: true }), Math.max(0, loopDelay));
    } else if (run.cycle) {
      startRun(true, { cycle: true, lead: sequential ? Math.max(2, Math.round(320 / step)) : 0 });
    }
  };

  const warm = () => {
    const heat = heatRef.current;
    const pointer = pointerRef.current;
    const box = pointer && containerRef.current ? containerRef.current.getBoundingClientRect() : null;
    const cool = 1 / Math.max(1, maxIterations);
    let active = false;

    chars.forEach((char, index) => {
      if (isSpace(char)) return;
      let target = 0;
      const center = centersRef.current[index];
      if (box && center) {
        const distance =
          Math.hypot(box.left + center.x - pointer.x, box.top + center.y - pointer.y) / Math.max(1, hoverRadius);
        if (distance < 1) target = 1 - distance * distance * (3 - 2 * distance);
      }
      const value = Math.max((heat[index] || 0) - cool, target);
      heat[index] = value > 0.001 ? value : 0;
      if (heat[index] > 0) active = true;
    });

    warmRef.current = active;
  };

  const tick = () => {
    const run = runRef.current;

    if (run) {
      run.iteration += 1;
      let mask = maskRef.current;
      let done;

      if (sequential) {
        const index = run.queue.shift();
        if (index !== undefined && index !== null) {
          mask = mask.slice();
          mask[index] = run.forward;
        }
        done = run.queue.length === 0;
      } else if (run.forward) {
        done = run.iteration >= maxIterations;
        if (done) mask = chars.map(() => true);
      } else {
        const visible = [];
        mask.forEach((shown, index) => {
          if (shown && !isSpace(chars[index])) visible.push(index);
        });
        const hideCount = Math.max(
          1,
          Math.ceil(chars.filter(char => !isSpace(char)).length / Math.max(1, maxIterations))
        );
        mask = mask.slice();
        for (let i = 0; i < hideCount && visible.length; i++) {
          mask[visible.splice(Math.floor(Math.random() * visible.length), 1)[0]] = false;
        }
        done = visible.length === 0 || run.iteration >= maxIterations;
        if (done) mask = chars.map(char => isSpace(char));
      }

      maskRef.current = mask;
      if (done) {
        runRef.current = null;
        finishRun(run);
      }
    }

    if (local) warm();
    else warmRef.current = false;

    paint();
    if (!runRef.current && !warmRef.current) stopTicker();
  };

  const measure = () => {
    const node = containerRef.current;
    if (!node) return;
    const box = node.getBoundingClientRect();
    centersRef.current = chars.map((char, index) => {
      const cell = cellsRef.current[index];
      if (isSpace(char) || !cell) return null;
      const rect = cell.getBoundingClientRect();
      return { x: rect.left - box.left + rect.width / 2, y: rect.top - box.top + rect.height / 2 };
    });
  };

  useIsomorphicLayoutEffect(() => {
    engineRef.current = { tick, paint, startRun, stopRun, ensureTicker, refit };
  });

  useIsomorphicLayoutEffect(() => {
    const engine = engineRef.current;
    engine.stopRun();
    playedRef.current = false;
    const hidden =
      animateOn === 'click' || ((animateOn === 'view' || animateOn === 'inViewHover') && !prefersReducedMotion());
    targetRef.current = !hidden;
    maskRef.current = chars.map(char => !hidden || isSpace(char));
    heatRef.current = chars.map(() => 0);
    pointerRef.current = null;
    engine.paint();
  }, [animateOn, chars]);

  useEffect(
    () => () => {
      clearInterval(timerRef.current);
      clearTimeout(holdRef.current);
    },
    []
  );

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      const metrics = readFont(node);
      glyphWidths.delete(metrics.font);
      fontRef.current = metrics;
      engineRef.current?.refit();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!timerRef.current) return;
    clearInterval(timerRef.current);
    timerRef.current = null;
    engineRef.current?.ensureTicker();
  }, [step]);

  useEffect(() => {
    if (loop) return;
    clearTimeout(holdRef.current);
    holdRef.current = null;
    pendingRef.current = null;
  }, [loop]);

  useEffect(() => {
    const viewTrigger = animateOn === 'view' || animateOn === 'inViewHover';
    if (!viewTrigger && !loop) return;
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.some(entry => entry.isIntersecting);
        visibleRef.current = visible;
        if (!visible) return;
        if (viewTrigger && !playedRef.current) {
          playedRef.current = true;
          engineRef.current?.startRun(true);
        }
        const resume = pendingRef.current;
        pendingRef.current = null;
        resume?.();
        if (!loop) observer.disconnect();
      },
      { threshold: 0.1 }
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      visibleRef.current = true;
    };
  }, [animateOn, loop, chars]);

  useIsomorphicLayoutEffect(() => {
    const previous = previousRef.current;
    previousRef.current = frame;
    if (effect !== 'flip' || previous.shown === frame.shown || prefersReducedMotion()) return;
    frame.revealed.forEach((revealed, index) => {
      const node = cellsRef.current[index];
      if (!node || typeof node.animate !== 'function' || isSpace(chars[index] ?? ' ')) return;
      if (!revealed) {
        node.animate(flipFrames(58 + Math.random() * 26, 0.3), {
          duration: Math.min(step * 0.92, 240),
          easing: 'cubic-bezier(0.3, 0.7, 0.4, 1)'
        });
      } else if (previous.revealed[index] === false) {
        node.animate(flipFrames(90, 0), {
          duration: Math.min(Math.max(step * 7, 360), 760),
          easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)'
        });
      }
    });
  }, [frame, effect, chars, step]);

  const trackPointer = event => {
    if (prefersReducedMotion()) return;
    if (!pointerRef.current) measure();
    pointerRef.current = { x: event.clientX, y: event.clientY };
    ensureTicker();
  };

  const handleMouseEnter = event => {
    if (local) {
      trackPointer(event);
      return;
    }
    if (runRef.current) return;
    startRun(true, { from: chars.map(char => isSpace(char)) });
  };

  const handleMouseMove = event => {
    if (local) trackPointer(event);
  };

  const handleMouseLeave = () => {
    if (local) {
      pointerRef.current = null;
      return;
    }
    stopRun();
    targetRef.current = true;
    maskRef.current = chars.map(() => true);
    paint();
    if (loop && animateOn === 'inViewHover') {
      schedule(() => engineRef.current?.startRun(false, { cycle: true }), Math.max(0, loopDelay));
    }
  };

  const handleClick = () => {
    if (clickMode === 'toggle') {
      startRun(!targetRef.current);
      return;
    }
    if (!targetRef.current) startRun(true);
  };

  const groups = useMemo(() => {
    const result = [];
    let word = null;
    chars.forEach((char, index) => {
      if (isSpace(char)) {
        result.push(char);
        word = null;
        return;
      }
      if (!word) {
        word = { key: index, letters: [] };
        result.push(word);
      }
      word.letters.push(index);
    });
    return result;
  }, [chars]);

  const tinted = Boolean(scrambleColor);
  const fading = effect === 'fade';
  const flipping = effect === 'flip';
  const settles = tinted || fading;

  const glyphStyle = index => {
    const squeeze = frame.squeeze[index] ?? 1;
    return squeeze < 1 ? { ...styles.glyph, transform: `translateX(-50%) scaleX(${squeeze})` } : styles.glyph;
  };

  const cellStyle = (index, revealed) => {
    const style = revealed && !flipping ? {} : { ...styles.cell };
    if (settles) style.transition = revealed ? SETTLE : `color 0.12s linear, opacity ${step}ms linear`;
    if (tinted && !revealed) {
      const amount = Math.round((frame.tint[index] ?? 1) * 100);
      style.color = amount >= 100 ? scrambleColor : `color-mix(in srgb, ${scrambleColor} ${amount}%, currentColor)`;
    }
    if (fading) style.opacity = revealed ? 1 : (frame.dim[index] ?? FADE_FLOOR);
    return style;
  };

  const animateProps = hoverable
    ? { onMouseEnter: handleMouseEnter, onMouseMove: handleMouseMove, onMouseLeave: handleMouseLeave }
    : animateOn === 'click'
      ? { onClick: handleClick }
      : {};

  return (
    <motion.span className={parentClassName} ref={containerRef} style={styles.wrapper} {...animateProps} {...props}>
      <span style={styles.srOnly}>{chars.join('')}</span>

      <span aria-hidden="true">
        {groups.map(group =>
          typeof group === 'string' ? (
            group
          ) : (
            <span key={group.key} style={styles.word}>
              {group.letters.map(index => {
                const char = chars[index];
                const revealed = frame.revealed[index] ?? true;
                return (
                  <span
                    key={index}
                    ref={node => {
                      cellsRef.current[index] = node;
                    }}
                    className={revealed ? className : encryptedClassName}
                    style={cellStyle(index, revealed)}
                  >
                    {revealed ? (
                      char
                    ) : (
                      <>
                        <span style={styles.ghost}>{char}</span>
                        <span style={glyphStyle(index)}>{frame.shown[index] ?? char}</span>
                      </>
                    )}
                  </span>
                );
              })}
            </span>
          )
        )}
      </span>
    </motion.span>
  );
}
