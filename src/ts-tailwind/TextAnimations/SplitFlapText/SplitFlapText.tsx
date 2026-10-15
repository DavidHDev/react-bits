'use client';

import { CSSProperties, HTMLAttributes, useEffect, useMemo, useRef, useState } from 'react';

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

const styles = `
.split-flap-text{gap:var(--split-flap-gap,6px);font-family:'SFMono-Regular','Roboto Mono','Cascadia Code','Liberation Mono',Menlo,monospace;font-size:var(--split-flap-font-size,52px);font-weight:760;line-height:1;letter-spacing:.035em;font-variant-numeric:tabular-nums}
.split-flap-text__tile{position:relative;flex:none;width:.78em;height:1.08em;overflow:hidden;border-radius:var(--split-flap-radius,8px);background:radial-gradient(circle at 50% 0%,rgba(255,255,255,.16),transparent 44%),linear-gradient(180deg,color-mix(in srgb,var(--split-flap-tile-color,#111827) 82%,white),var(--split-flap-tile-color,#111827));box-shadow:0 .035em .08em rgba(255,255,255,.08) inset,0 -.05em .1em rgba(0,0,0,.38) inset,0 calc(.16em * var(--split-flap-lift,1)) calc(.38em * var(--split-flap-lift,1)) rgba(0,0,0,var(--split-flap-drop,.28));perspective:10em;transform-style:preserve-3d;isolation:isolate}
.split-flap-text__tile::before{content:'';position:absolute;z-index:8;top:calc(50% - var(--split-flap-hinge,1px) / 2);left:0;width:100%;height:var(--split-flap-hinge,1px);background:linear-gradient(90deg,transparent,rgba(255,255,255,.18) 18%,rgba(0,0,0,var(--split-flap-hinge-shade,.64)) 50%,rgba(255,255,255,.14) 82%,transparent);box-shadow:0 -1px 0 rgba(255,255,255,.08),0 1px 0 rgba(0,0,0,.5);pointer-events:none}
.split-flap-text__tile::after{content:'';position:absolute;inset:0;z-index:9;border:1px solid rgba(255,255,255,.08);border-radius:inherit;box-shadow:0 0 0 1px rgba(0,0,0,.2) inset;pointer-events:none}
.split-flap-text__half,.split-flap-text__flap{position:absolute;left:0;width:100%;height:50%;overflow:hidden;background:linear-gradient(180deg,rgba(255,255,255,.07),transparent 34%),var(--split-flap-tile-color,#111827);backface-visibility:hidden}
.split-flap-text__half--top,.split-flap-text__flap--front{top:0}
.split-flap-text__half--bottom,.split-flap-text__flap--back{bottom:0}
.split-flap-text__half--bottom,.split-flap-text__flap--back{background:linear-gradient(0deg,rgba(255,255,255,.06),transparent 38%),color-mix(in srgb,var(--split-flap-tile-color,#111827) 92%,black)}
.split-flap-text__char{position:absolute;left:0;width:100%;height:200%;display:flex;align-items:center;justify-content:center;color:var(--split-flap-text-color,#f8fafc);text-shadow:0 .025em 0 rgba(255,255,255,.16),0 .09em .16em rgba(0,0,0,.42)}
.split-flap-text__half--top .split-flap-text__char,.split-flap-text__flap--front .split-flap-text__char{top:0}
.split-flap-text__half--bottom .split-flap-text__char,.split-flap-text__flap--back .split-flap-text__char{bottom:0}
.split-flap-text__flap{z-index:6;will-change:transform,filter;transform-style:preserve-3d}
.split-flap-text__flap--front{transform-origin:center bottom;box-shadow:inset 0 var(--split-flap-edge,0em) 0 rgba(255,255,255,.16);animation:split-flap-front var(--split-flap-flip-duration,.12s) linear both}
.split-flap-text__flap--back{transform-origin:center top;transform:rotateX(90deg);box-shadow:inset 0 calc(var(--split-flap-edge,0em) * -1) 0 rgba(0,0,0,.4);animation:split-flap-back var(--split-flap-flip-duration,.12s) linear both}
.split-flap-text__shade{position:absolute;z-index:4;left:0;width:100%;height:50%;pointer-events:none;animation:split-flap-shade-top var(--split-flap-flip-duration,.12s) linear both}
.split-flap-text__shade--top{top:0;background:linear-gradient(0deg,rgba(0,0,0,var(--split-flap-cast,0)),transparent 85%)}
.split-flap-text__shade--bottom{bottom:0;background:linear-gradient(180deg,rgba(0,0,0,var(--split-flap-cast,0)),transparent 90%);animation-name:split-flap-shade-bottom}
.split-flap-text--glare .split-flap-text__flap::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,transparent 32%,rgba(255,255,255,var(--split-flap-glare,0)) 50%,transparent 68%) 0 100% / 100% 300% no-repeat;animation:split-flap-glare-front var(--split-flap-flip-duration,.12s) linear both}
.split-flap-text--glare .split-flap-text__flap--back::after{animation-name:split-flap-glare-back}
.split-flap-text--minimal .split-flap-text__tile{background:none;box-shadow:none;-webkit-mask:linear-gradient(#000 0 0) top / 100% calc(50% - var(--split-flap-split,.045em) / 2) no-repeat,linear-gradient(#000 0 0) bottom / 100% calc(50% - var(--split-flap-split,.045em) / 2) no-repeat;mask:linear-gradient(#000 0 0) top / 100% calc(50% - var(--split-flap-split,.045em) / 2) no-repeat,linear-gradient(#000 0 0) bottom / 100% calc(50% - var(--split-flap-split,.045em) / 2) no-repeat}
.split-flap-text--minimal .split-flap-text__tile::before,.split-flap-text--minimal .split-flap-text__tile::after,.split-flap-text--minimal .split-flap-text__flap::after{display:none}
.split-flap-text--minimal .split-flap-text__half,.split-flap-text--minimal .split-flap-text__flap{background:none;box-shadow:none}
.split-flap-text--minimal .split-flap-text__char{text-shadow:none}
.split-flap-text--minimal .split-flap-text__tile.is-flipping .split-flap-text__half--top{animation:split-flap-reveal var(--split-flap-flip-duration,.12s) linear both}
.split-flap-text--minimal .split-flap-text__tile.is-flipping .split-flap-text__half--bottom{animation:split-flap-cover var(--split-flap-flip-duration,.12s) linear both}
@keyframes split-flap-front{0%{transform:rotateX(0deg);filter:brightness(var(--split-flap-front-from,1.08));animation-timing-function:cubic-bezier(.55,.055,.675,.19)}50%,100%{transform:rotateX(-90deg);filter:brightness(var(--split-flap-front-to,.52))}}
@keyframes split-flap-back{0%,50%{transform:rotateX(90deg);filter:brightness(var(--split-flap-back-from,.58));animation-timing-function:cubic-bezier(.215,.61,.355,1)}100%{transform:rotateX(0deg);filter:brightness(1)}}
@keyframes split-flap-shade-top{0%,32%{opacity:1}50%,100%{opacity:0}}
@keyframes split-flap-shade-bottom{0%{opacity:0;animation-timing-function:cubic-bezier(.55,.055,.675,.19)}50%,100%{opacity:1}}
@keyframes split-flap-glare-front{0%{background-position:0 100%;opacity:0}30%{opacity:1}50%,100%{background-position:0 0%;opacity:.75}}
@keyframes split-flap-glare-back{0%,50%{background-position:0 100%;opacity:.75}100%{background-position:0 0%;opacity:0}}
@keyframes split-flap-reveal{0%{clip-path:inset(0 0 100% 0)}23.14%{clip-path:inset(0 0 99.21% 0)}29.67%{clip-path:inset(0 0 95.55% 0)}33.95%{clip-path:inset(0 0 89.09% 0)}37.41%{clip-path:inset(0 0 79.46% 0)}40.56%{clip-path:inset(0 0 66.05% 0)}43.73%{clip-path:inset(0 0 47.69% 0)}47.38%{clip-path:inset(0 0 21.22% 0)}50%,100%{clip-path:inset(0 0 0 0)}}
@keyframes split-flap-cover{0%,50%{clip-path:inset(0 0 0 0)}54.42%{clip-path:inset(35.75% 0 0 0)}57.44%{clip-path:inset(55.86% 0 0 0)}60.39%{clip-path:inset(70.63% 0 0 0)}63.65%{clip-path:inset(81.86% 0 0 0)}67.65%{clip-path:inset(90.23% 0 0 0)}73.17%{clip-path:inset(96% 0 0 0)}82.62%{clip-path:inset(99.25% 0 0 0)}100%{clip-path:inset(100% 0 0 0)}}
@media (prefers-reduced-motion: reduce){.split-flap-text__flap,.split-flap-text__flap::after,.split-flap-text__shade,.split-flap-text__half{animation:none !important}}
`;

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
    'relative inline-flex items-center whitespace-pre select-none',
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
    <>
      <style>{styles}</style>
      <div className={rootClass} style={componentStyle} {...props}>
        <span className="sr-only">{label}</span>
        {tiles.map((tile, index) => (
          <span
            className={`split-flap-text__tile${tile.flipping ? ' is-flipping' : ''}`}
            aria-hidden="true"
            key={`${index}-${tiles.length}`}
          >
            <span
              className="split-flap-text__half split-flap-text__half--top"
              key={minimal ? `top-${tile.tick}` : 'top'}
            >
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
                    <span
                      className="split-flap-text__shade split-flap-text__shade--top"
                      key={`shade-top-${tile.tick}`}
                    />
                    <span
                      className="split-flap-text__shade split-flap-text__shade--bottom"
                      key={`shade-bottom-${tile.tick}`}
                    />
                  </>
                )}
                <span
                  className="split-flap-text__flap split-flap-text__flap--front"
                  key={`front-${index}-${tile.tick}`}
                >
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
    </>
  );
};

export default SplitFlapText;
