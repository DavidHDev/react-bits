'use client';

import { CSSProperties, HTMLAttributes, useEffect, useMemo, useRef, useState } from 'react';
import './SplitFlapText.css';

type TileState = {
  current: string;
  next: string;
  flipping: boolean;
  tick: number;
};

type AnimationPlan = {
  index: number;
  from: string;
  target: string;
  sequence: string[];
  start: number;
  step: number;
  done: boolean;
};

type TileUpdate = {
  index: number;
  current: string;
  next: string;
  done: boolean;
};

type Timing = {
  flipMs: number;
  staggerMs: number;
  holdMs: number;
  flips: number;
  glyphs: string;
  order: SplitFlapOrder;
};

export type SplitFlapAlign = 'left' | 'center' | 'right';

export type SplitFlapOrder = 'left' | 'right' | 'center' | 'random';

export type SplitFlapTileStyle = 'board' | 'minimal';

export interface SplitFlapTextProps extends HTMLAttributes<HTMLDivElement> {
  words?: string[];
  text?: string;
  flipDuration?: number;
  stagger?: number;
  cycleDelay?: number;
  charset?: 'alpha' | 'alphanumeric' | 'numeric' | (string & {});
  flipsPerChar?: number;
  tileColor?: string;
  textColor?: string;
  tileRadius?: number | string;
  gap?: number | string;
  fontSize?: number | string;
  loop?: boolean;
  padTo?: number;
  align?: SplitFlapAlign;
  intro?: boolean;
  glare?: number;
  depth?: number;
  order?: SplitFlapOrder;
  tileStyle?: SplitFlapTileStyle;
}

const DEFAULT_WORDS = ['LAUNCH READY', 'SYNC ONLINE', 'SIGNAL LIVE'];

const CHARSETS: Record<string, string> = {
  alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  numeric: '0123456789'
};

const toCssUnit = (value: number | string) => (typeof value === 'number' ? `${value}px` : value);

const resolveCharset = (charset: SplitFlapTextProps['charset']) => {
  if (charset && CHARSETS[charset]) return CHARSETS[charset];
  return typeof charset === 'string' && charset.length > 0 ? charset : CHARSETS.alphanumeric;
};

const normalizePhrase = (phrase: string, width: number, align: SplitFlapAlign = 'left') => {
  const safe = String(phrase ?? '').slice(0, width);
  if (align === 'right') return safe.padStart(width, ' ');
  if (align === 'center') {
    return safe.padStart(safe.length + Math.floor((width - safe.length) / 2), ' ').padEnd(width, ' ');
  }
  return safe.padEnd(width, ' ');
};

const createTiles = (phrase: string): TileState[] =>
  phrase.split('').map(char => ({
    current: char,
    next: char,
    flipping: false,
    tick: 0
  }));

const sampleChar = (charset: string) => charset.charAt(Math.floor(Math.random() * charset.length)) || ' ';

const buildSequence = (target: string, flips: number, charset: string) => {
  const steps: string[] = [];
  for (let i = 0; i < flips; i += 1) {
    steps.push(sampleChar(charset));
  }
  steps.push(target);
  return steps;
};

const toGlyph = (char: string) => (char === ' ' ? ' ' : char);

const shuffleIndices = (count: number) => {
  const list = Array.from({ length: count }, (_, index) => index);
  for (let i = count - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};

const cascadeStep = (index: number, width: number, order: SplitFlapOrder, randomOrder: number[] | null) => {
  if (order === 'right') return width - 1 - index;
  if (order === 'center') return Math.floor(Math.abs(index - (width - 1) / 2));
  if (order === 'random' && randomOrder) return randomOrder[index];
  return index;
};

const clampUnit = (value: number) => Math.min(1, Math.max(0, Number(value) || 0));

const round = (value: number) => Number(value.toFixed(3));

const getReducedMotion = () =>
  typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

const usePrefersReducedMotion = () => {
  const [prefersReduced, setPrefersReduced] = useState(getReducedMotion);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setPrefersReduced(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReduced;
};

const SplitFlapText = ({
  words = ['LAUNCH READY', 'SYNC ONLINE', 'SIGNAL LIVE'],
  text,
  flipDuration = 0.12,
  stagger = 0.06,
  cycleDelay = 2400,
  charset = 'alphanumeric',
  flipsPerChar = 8,
  tileColor = '#111827',
  textColor = '#f8fafc',
  tileRadius = 8,
  gap = 6,
  fontSize = 52,
  loop = true,
  padTo = 12,
  align = 'left',
  intro = true,
  glare = 0,
  depth = 0.5,
  order = 'left',
  tileStyle = 'board',
  className = '',
  style = {},
  ...props
}: SplitFlapTextProps) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const rafRef = useRef<number | null>(null);
  const shownRef = useRef<string | null>(null);
  const fromRef = useRef<string | null>(null);
  const indexRef = useRef(0);
  const phrasesRef = useRef<string[] | null>(null);

  const sourceWords = Array.isArray(words) && words.length > 0 ? words : DEFAULT_WORDS;
  const phrasesKey = typeof text === 'string' ? text : sourceWords.map(word => String(word ?? '')).join('\u001f');
  const phrases = useMemo(() => phrasesKey.split('\u001f'), [phrasesKey]);

  const width = useMemo(() => {
    const longest = phrases.reduce((max, phrase) => Math.max(max, phrase.length), 1);
    return Math.max(1, Math.ceil(Number(padTo) || 0), longest);
  }, [padTo, phrases]);

  const normalizedPhrases = useMemo(
    () => phrases.map(phrase => normalizePhrase(phrase, width, align)),
    [phrases, width, align]
  );

  const timing = useMemo<Timing>(
    () => ({
      flipMs: Math.max(40, (Number(flipDuration) || 0.12) * 1000),
      staggerMs: Math.max(0, (Number(stagger) || 0) * 1000),
      holdMs: Math.max(400, Number(cycleDelay) || 2400),
      flips: Math.max(0, Math.floor(Number(flipsPerChar) || 0)),
      glyphs: resolveCharset(charset),
      order
    }),
    [flipDuration, stagger, cycleDelay, flipsPerChar, charset, order]
  );
  const timingRef = useRef(timing);

  const [tiles, setTiles] = useState<TileState[]>(() => createTiles(intro ? ' '.repeat(width) : normalizedPhrases[0]));
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    timingRef.current = timing;
  }, [timing]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const stopFrame = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };

    const animateTo = (target: string) => {
      const { flipMs, staggerMs, flips, glyphs, order: cascade } = timingRef.current;
      const from = normalizePhrase(shownRef.current ?? target, target.length);
      const randomOrder = cascade === 'random' ? shuffleIndices(target.length) : null;

      stopFrame();
      shownRef.current = target;
      fromRef.current = null;

      const plans: AnimationPlan[] = [];
      if (!prefersReducedMotion) {
        for (let index = 0; index < target.length; index += 1) {
          if (from[index] === target[index]) continue;
          plans.push({
            index,
            from: from[index],
            target: target[index],
            sequence: buildSequence(target[index], flips, glyphs),
            start: cascadeStep(index, target.length, cascade, randomOrder) * staggerMs,
            step: -1,
            done: false
          });
        }
      }

      if (!plans.length) {
        setTiles(createTiles(target));
        return 0;
      }

      fromRef.current = from;
      setTiles(createTiles(from));

      const totalDuration = plans.reduce((max, plan) => Math.max(max, plan.start + plan.sequence.length * flipMs), 0);
      const startedAt = performance.now();

      const tick = (now: number) => {
        if (cancelled) return;

        const elapsed = now - startedAt;
        const updates: TileUpdate[] = [];
        let running = false;

        plans.forEach(plan => {
          const localElapsed = elapsed - plan.start;

          if (localElapsed < 0) {
            running = true;
            return;
          }

          const step = Math.floor(localElapsed / flipMs);

          if (step < plan.sequence.length) {
            running = true;

            if (step !== plan.step) {
              plan.step = step;
              updates.push({
                index: plan.index,
                current: step === 0 ? plan.from : plan.sequence[step - 1],
                next: plan.sequence[step],
                done: false
              });
            }
          } else if (!plan.done) {
            plan.done = true;
            updates.push({
              index: plan.index,
              current: plan.target,
              next: plan.target,
              done: true
            });
          }
        });

        if (updates.length > 0) {
          setTiles(previous => {
            const nextTiles = [...previous];
            updates.forEach(update => {
              const tile = nextTiles[update.index];
              if (!tile) return;

              nextTiles[update.index] = {
                current: update.current,
                next: update.next,
                flipping: !update.done,
                tick: tile.tick + 1
              };
            });
            return nextTiles;
          });
        }

        if (running) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          rafRef.current = null;
          fromRef.current = null;
        }
      };

      rafRef.current = requestAnimationFrame(tick);
      return totalDuration;
    };

    const show = (index: number) => {
      indexRef.current = index;
      setActiveIndex(index);
      return animateTo(normalizedPhrases[index]);
    };

    const scheduleNext = (delay: number) => {
      timer = setTimeout(() => {
        if (cancelled) return;

        if (document.hidden) {
          scheduleNext(timingRef.current.holdMs);
          return;
        }

        const nextIndex = indexRef.current + 1;
        if (nextIndex >= normalizedPhrases.length && !loop) return;

        const duration = show(nextIndex % normalizedPhrases.length);
        scheduleNext(timingRef.current.holdMs + duration);
      }, delay);
    };

    const samePhrases = phrasesRef.current === normalizedPhrases;
    phrasesRef.current = normalizedPhrases;

    if (shownRef.current === null) {
      shownRef.current = intro ? ' '.repeat(width) : normalizedPhrases[0];
    }

    if (!samePhrases || indexRef.current >= normalizedPhrases.length) {
      indexRef.current = 0;
    } else if (fromRef.current !== null) {
      shownRef.current = fromRef.current;
    }

    let startDuration = 0;
    if (shownRef.current === normalizedPhrases[indexRef.current]) {
      stopFrame();
      fromRef.current = null;
      setActiveIndex(indexRef.current);
      setTiles(createTiles(shownRef.current));
    } else {
      startDuration = show(indexRef.current);
    }

    if (normalizedPhrases.length > 1) {
      scheduleNext(timingRef.current.holdMs + startDuration);
    }

    return () => {
      cancelled = true;
      clearTimeout(timer);
      stopFrame();
    };
  }, [normalizedPhrases, width, loop, intro, prefersReducedMotion]);

  const label = String(phrases[activeIndex] ?? phrases[0] ?? '').trim();
  const minimal = tileStyle === 'minimal';
  const level = clampUnit(depth);
  const flat = Math.min(1, level * 2);
  const deep = Math.max(0, level - 0.5) * 2;
  const sheen = minimal ? 0 : clampUnit(glare);
  const shaded = !minimal && deep > 0;
  const rootClass = [
    'split-flap-text',
    minimal && 'split-flap-text--minimal',
    sheen > 0 && 'split-flap-text--glare',
    className
  ]
    .filter(Boolean)
    .join(' ');
  const componentStyle: CSSProperties & Record<string, string | number | undefined> = {
    '--split-flap-tile-color': tileColor,
    '--split-flap-text-color': textColor,
    '--split-flap-radius': toCssUnit(tileRadius),
    '--split-flap-gap': toCssUnit(gap),
    '--split-flap-font-size': toCssUnit(fontSize),
    '--split-flap-flip-duration': `${Math.max(0.04, Number(flipDuration) || 0.12)}s`,
    '--split-flap-front-from': round(1 + 0.08 * flat),
    '--split-flap-front-to': round(1 - 0.48 * flat - 0.3 * deep),
    '--split-flap-back-from': round(1 - 0.42 * flat - 0.3 * deep),
    '--split-flap-hinge': `calc(1px + ${round(deep * 0.05)}em)`,
    '--split-flap-hinge-shade': round(0.25 + 0.39 * flat + 0.21 * deep),
    '--split-flap-drop': round(0.28 * flat + 0.2 * deep),
    '--split-flap-lift': round(0.4 + 0.6 * flat + 0.7 * deep),
    '--split-flap-cast': round(deep * 0.62),
    '--split-flap-edge': `${round(deep * 0.035)}em`,
    '--split-flap-split': `${round(0.015 + level * 0.06)}em`,
    '--split-flap-glare': round(sheen * 0.55),
    ...style
  };

  return (
    <div className={rootClass} style={componentStyle} {...props}>
      <span className="split-flap-text__sr">{label}</span>
      {tiles.map((tile, index) => (
        <span
          className={`split-flap-text__tile${tile.flipping ? ' is-flipping' : ''}`}
          aria-hidden="true"
          key={`${index}-${tiles.length}`}
        >
          <span className="split-flap-text__half split-flap-text__half--top" key={minimal ? `top-${tile.tick}` : 'top'}>
            <span className="split-flap-text__char">{toGlyph(tile.flipping ? tile.next : tile.current)}</span>
          </span>
          <span
            className="split-flap-text__half split-flap-text__half--bottom"
            key={minimal ? `bottom-${tile.tick}` : 'bottom'}
          >
            <span className="split-flap-text__char">{toGlyph(tile.current)}</span>
          </span>

          {tile.flipping && (
            <>
              {shaded && (
                <>
                  <span className="split-flap-text__shade split-flap-text__shade--top" key={`shade-top-${tile.tick}`} />
                  <span
                    className="split-flap-text__shade split-flap-text__shade--bottom"
                    key={`shade-bottom-${tile.tick}`}
                  />
                </>
              )}
              <span className="split-flap-text__flap split-flap-text__flap--front" key={`front-${index}-${tile.tick}`}>
                <span className="split-flap-text__char">{toGlyph(tile.current)}</span>
              </span>
              <span className="split-flap-text__flap split-flap-text__flap--back" key={`back-${index}-${tile.tick}`}>
                <span className="split-flap-text__char">{toGlyph(tile.next)}</span>
              </span>
            </>
          )}
        </span>
      ))}
    </div>
  );
};

export default SplitFlapText;
