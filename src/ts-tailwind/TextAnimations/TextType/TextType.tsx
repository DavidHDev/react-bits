'use client';

import {
  type ElementType,
  createElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { gsap } from 'gsap';

interface TextTypeProps {
  className?: string;
  showCursor?: boolean;
  hideCursorWhileTyping?: boolean;
  cursorStyle?: 'character' | 'bar' | 'block' | 'underscore';
  cursorCharacter?: string | React.ReactNode;
  cursorColor?: string;
  cursorBlinkDuration?: number;
  cursorClassName?: string;
  cursorGlide?: boolean;
  text: string | string[];
  as?: ElementType;
  typingSpeed?: number;
  initialDelay?: number;
  pauseDuration?: number;
  deletingSpeed?: number;
  deleteMode?: 'backspace' | 'select';
  typeEffect?: 'none' | 'fade' | 'blur' | 'rise';
  mistakes?: number;
  prefix?: string;
  prefixColor?: string;
  loop?: boolean;
  textColors?: string[];
  variableSpeed?: { min: number; max: number };
  onSentenceComplete?: (sentence: string, index: number) => void;
  startOnVisible?: boolean;
  reverseMode?: boolean;
}

type Effect = { keyframes: Keyframe[]; options: KeyframeAnimationOptions };
type Typo = { plan: string[]; tail: string[]; fixing: boolean };

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const NEIGHBORS: Record<string, string> = {
  a: 'qwsz',
  b: 'vghn',
  c: 'xdfv',
  d: 'serfcx',
  e: 'wsdr',
  f: 'drtgvc',
  g: 'ftyhbv',
  h: 'gyujnb',
  i: 'ujko',
  j: 'huikmn',
  k: 'jiolm',
  l: 'kop',
  m: 'njk',
  n: 'bhjm',
  o: 'iklp',
  p: 'ol',
  q: 'wa',
  r: 'edft',
  s: 'awedxz',
  t: 'rfgy',
  u: 'yhji',
  v: 'cfgb',
  w: 'qase',
  x: 'zsdc',
  y: 'tghu',
  z: 'asx',
  0: '9p',
  1: '2q',
  2: '13w',
  3: '24e',
  4: '35r',
  5: '46t',
  6: '57y',
  7: '68u',
  8: '79i',
  9: '80o'
};

const EFFECTS: Record<'fade' | 'blur' | 'rise', Effect> = {
  fade: {
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
    options: { duration: 360, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' }
  },
  blur: {
    keyframes: [
      { opacity: 0, filter: 'blur(0.3em)' },
      { opacity: 1, filter: 'blur(0em)' }
    ],
    options: { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
  },
  rise: {
    keyframes: [
      { opacity: 0, top: '0.6em' },
      { opacity: 1, top: '0em' }
    ],
    options: { duration: 480, easing: 'cubic-bezier(0.34, 1.4, 0.64, 1)' }
  }
};

const SHAPES: Record<'bar' | 'block' | 'underscore', string> = {
  bar: 'ml-[0.06em] inline-block h-[1.1em] w-[max(2px,0.07em)] rounded-[1px] bg-current align-[-0.2em]',
  block: 'ml-[0.06em] inline-block h-[1.1em] w-[0.56em] rounded-[0.06em] bg-current align-[-0.2em]',
  underscore: 'ml-[0.06em] inline-block h-[max(2px,0.075em)] w-[0.56em] rounded-[1px] bg-current align-[-0.12em]'
};

const graphemes = (value: string): string[] => {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value), part => part.segment);
  }
  return Array.from(value);
};

const typoFor = (char: string): string | null => {
  const keys = NEIGHBORS[char.toLowerCase()];
  if (!keys) return null;
  const pick = keys[Math.floor(Math.random() * keys.length)];
  return char === char.toLowerCase() ? pick : pick.toUpperCase();
};

const TextType = ({
  text,
  as: Component = 'div',
  typingSpeed = 50,
  initialDelay = 0,
  pauseDuration = 2000,
  deletingSpeed = 30,
  deleteMode = 'backspace',
  loop = true,
  className = '',
  showCursor = true,
  hideCursorWhileTyping = false,
  cursorStyle = 'character',
  cursorCharacter = '|',
  cursorColor = 'currentColor',
  cursorClassName = '',
  cursorBlinkDuration = 0.5,
  cursorGlide = true,
  typeEffect = 'none',
  mistakes = 0,
  prefix = '',
  prefixColor = 'currentColor',
  textColors = [],
  variableSpeed,
  onSentenceComplete,
  startOnVisible = false,
  reverseMode = false,
  ...props
}: TextTypeProps & React.HTMLAttributes<HTMLElement>) => {
  const [textIndex, setTextIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [selected, setSelected] = useState(0);
  const [typo, setTypo] = useState<Typo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVisible, setIsVisible] = useState(!startOnVisible);
  const [reduceMotion, setReduceMotion] = useState(false);
  const containerRef = useRef<HTMLElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const blinkRef = useRef<HTMLSpanElement>(null);
  const blinkTimeline = useRef<ReturnType<typeof gsap.timeline> | null>(null);
  const blinkResume = useRef<ReturnType<typeof gsap.delayedCall> | null>(null);
  const caretPosition = useRef<{ x: number; y: number } | null>(null);
  const placeCursor = useRef<(instant: boolean) => void>(() => {});
  const lastTypo = useRef(-1);
  const onSentenceCompleteRef = useRef(onSentenceComplete);

  const textKey = Array.isArray(text) ? text.join('\u0000') : String(text ?? '');
  const textArray = useMemo(() => textKey.split('\u0000'), [textKey]);
  const index = textIndex % textArray.length;
  const chars = useMemo(() => graphemes(textArray[index]), [textArray, index]);
  const total = chars.length;
  const shown = Math.min(count, total);
  const minSpeed = variableSpeed?.min ?? typingSpeed;
  const maxSpeed = variableSpeed?.max ?? typingSpeed;
  const pace = (minSpeed + maxSpeed) / 2;
  const glideTime = Math.min(0.18, Math.max(0.06, pace * 0.0016));

  useEffect(() => {
    onSentenceCompleteRef.current = onSentenceComplete;
  }, [onSentenceComplete]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!startOnVisible || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [startOnVisible]);

  useEffect(() => {
    const blink = blinkRef.current;
    if (!showCursor || !blink) return;
    gsap.set(blink, { opacity: 1 });
    if (reduceMotion || cursorBlinkDuration <= 0) return;

    const hold = cursorBlinkDuration * 0.7;
    const fade = cursorBlinkDuration * 0.45;
    const timeline = gsap.timeline({ repeat: -1 });
    timeline
      .to(blink, { opacity: 0, duration: fade, ease: 'sine.inOut' }, hold)
      .to(blink, { opacity: 1, duration: fade, ease: 'sine.inOut' }, hold + fade + cursorBlinkDuration * 0.4);
    blinkTimeline.current = timeline;

    return () => {
      timeline.kill();
      blinkResume.current?.kill();
      gsap.killTweensOf(blink);
      blinkTimeline.current = null;
    };
  }, [showCursor, cursorBlinkDuration, reduceMotion]);

  useIsomorphicLayoutEffect(() => {
    caretPosition.current = null;
  }, [showCursor]);

  useIsomorphicLayoutEffect(() => {
    placeCursor.current = (instant: boolean) => {
      const caret = caretRef.current;
      const cursor = cursorRef.current;
      if (!caret || !cursor) return;

      const x = caret.offsetLeft;
      const y = caret.offsetTop;
      const last = caretPosition.current;
      if (last && Math.abs(last.x - x) < 0.5 && Math.abs(last.y - y) < 0.5) return;
      caretPosition.current = { x, y };

      if (instant || !last || !cursorGlide || reduceMotion || Math.abs(last.y - y) > 1) {
        gsap.killTweensOf(cursor);
        gsap.set(cursor, { x, y });
      } else {
        gsap.to(cursor, { x, y, duration: glideTime, ease: 'power3.out', overwrite: true });
      }

      const timeline = blinkTimeline.current;
      const blink = blinkRef.current;
      if (instant || !timeline || !blink) return;
      timeline.pause();
      blinkResume.current?.kill();
      gsap.to(blink, { opacity: 1, duration: 0.12, ease: 'power1.out' });
      blinkResume.current = gsap.delayedCall(0.12, () => timeline.restart());
    };
    placeCursor.current(false);
  });

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => placeCursor.current(true));
    observer.observe(node);
    return () => observer.disconnect();
  }, [Component]);

  useEffect(() => {
    if (!isVisible) return;

    let timeout: ReturnType<typeof setTimeout> | undefined;
    const wait = (ms: number, next: () => void) => {
      timeout = setTimeout(next, ms);
    };
    const speed = () => minSpeed + Math.random() * (maxSpeed - minSpeed);

    if (!isDeleting) {
      if (typo) {
        if (reduceMotion) {
          wait(0, () => setTypo(null));
        } else if (!typo.fixing) {
          if (typo.tail.length < typo.plan.length) {
            wait(speed(), () => setTypo({ ...typo, tail: typo.plan.slice(0, typo.tail.length + 1) }));
          } else {
            wait(260 + Math.random() * 320, () => setTypo({ ...typo, fixing: true }));
          }
        } else if (typo.tail.length) {
          wait(Math.max(45, deletingSpeed), () => setTypo({ ...typo, tail: typo.tail.slice(0, -1) }));
        } else {
          wait(90 + Math.random() * 140, () => setTypo(null));
        }
      } else if (shown < total) {
        const lead = shown === 0 ? initialDelay : 0;
        const next = reverseMode ? total - shown - 1 : shown;
        const wrong = mistakes > 0 && shown > 0 && lastTypo.current !== next ? typoFor(chars[next]) : null;

        if (reduceMotion) {
          wait(lead, () => setCount(total));
        } else if (wrong && Math.random() < Math.min(1, mistakes) * 0.16) {
          lastTypo.current = next;
          const plan = [wrong];
          const follow = chars[reverseMode ? next - 1 : next + 1];
          if (follow && follow.trim() && Math.random() < 0.4) plan.push(follow);
          wait(lead + speed(), () => setTypo({ plan, tail: [wrong], fixing: false }));
        } else {
          wait(lead + speed(), () => setCount(shown + 1));
        }
      } else if (loop || index < textArray.length - 1) {
        wait(pauseDuration, () => setIsDeleting(true));
      }
    } else if (shown > 0) {
      if (reduceMotion) {
        wait(0, () => setCount(0));
      } else if (deleteMode === 'select') {
        if (selected < shown) {
          wait(deletingSpeed, () => setSelected(selected + 1));
        } else {
          wait(Math.max(160, deletingSpeed * 8), () => {
            setSelected(0);
            setCount(0);
          });
        }
      } else {
        wait(deletingSpeed, () => setCount(shown - 1));
      }
    } else {
      onSentenceCompleteRef.current?.(textArray[index], index);
      lastTypo.current = -1;
      setSelected(0);
      setIsDeleting(false);
      setTextIndex((index + 1) % textArray.length);
    }

    return () => clearTimeout(timeout);
  }, [
    isVisible,
    isDeleting,
    shown,
    total,
    chars,
    selected,
    typo,
    index,
    textArray,
    loop,
    deletingSpeed,
    deleteMode,
    pauseDuration,
    initialDelay,
    minSpeed,
    maxSpeed,
    mistakes,
    reverseMode,
    reduceMotion
  ]);

  const animateChar = useCallback(
    (node: HTMLSpanElement | null) => {
      const effect = typeEffect === 'none' ? undefined : EFFECTS[typeEffect];
      if (!node || !effect || reduceMotion || typeof node.animate !== 'function') return;
      node.animate(effect.keyframes, effect.options);
    },
    [typeEffect, reduceMotion]
  );

  const start = reverseMode ? total - shown : 0;
  const marked = Math.min(selected, shown);
  const correct = chars.slice(start, start + shown).map((char, i) => {
    const isMarked = reverseMode ? i < marked : i >= shown - marked;
    return (
      <span
        key={start + i}
        ref={animateChar}
        className={isMarked ? 'relative bg-[color:color-mix(in_srgb,currentColor_25%,transparent)]' : 'relative'}
      >
        {char}
      </span>
    );
  });
  const mistyped = (typo?.tail ?? []).map((char, i) => (
    <span key={`typo-${i}`} ref={animateChar} className="relative">
      {char}
    </span>
  ));
  if (reverseMode) mistyped.reverse();

  const caret = (
    <span ref={caretRef} className="inline-block w-0">
      {'\u200B'}
    </span>
  );
  const color = textColors.length ? textColors[index % textColors.length] : 'inherit';
  const typing = shown < total || isDeleting || typo !== null;
  const hideCursor = hideCursorWhileTyping && typing;
  const customCursorColor = cursorColor && cursorColor !== 'currentColor' ? { color: cursorColor } : undefined;

  return createElement(
    Component,
    {
      ref: containerRef,
      className: `relative inline-block whitespace-pre-wrap ${className}`,
      ...props
    },
    <span className="sr-only">{prefix + textArray.join(' ')}</span>,
    <span aria-hidden="true">
      {prefix ? <span style={{ color: prefixColor }}>{prefix}</span> : null}
      {reverseMode && caret}
      <span style={{ color }}>{reverseMode ? [...mistyped, ...correct] : [...correct, ...mistyped]}</span>
      {!reverseMode && caret}
    </span>,
    showCursor && (
      <span
        ref={cursorRef}
        aria-hidden="true"
        className={`pointer-events-none absolute left-0 top-0 whitespace-pre transition-opacity duration-200 will-change-transform ${hideCursor ? 'opacity-0' : ''} ${cursorClassName}`}
        style={customCursorColor}
      >
        <span ref={blinkRef} className={cursorStyle === 'character' ? 'ml-1 inline-block' : 'inline-block'}>
          {cursorStyle === 'character' ? cursorCharacter : <span className={SHAPES[cursorStyle] ?? SHAPES.bar} />}
        </span>
      </span>
    )
  );
};

export default TextType;
