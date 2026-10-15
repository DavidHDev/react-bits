'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText as GSAPSplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, GSAPSplitText, useGSAP);

const FONT_WEIGHTS = new Set([
  'thin',
  'extralight',
  'light',
  'normal',
  'medium',
  'semibold',
  'bold',
  'extrabold',
  'black'
]);

const hasFontFamilyClass = (className: string) =>
  className.split(/\s+/).some(name => {
    const utility = name.split(':').pop() ?? '';
    return utility.startsWith('font-') && !FONT_WEIGHTS.has(utility.slice(5));
  });

export interface ShuffleProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  shuffleDirection?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  maxDelay?: number;
  ease?: string | ((t: number) => number);
  threshold?: number;
  rootMargin?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  textAlign?: React.CSSProperties['textAlign'];
  onShuffleComplete?: () => void;
  shuffleTimes?: number;
  animationMode?: 'evenodd' | 'sequence' | 'center' | 'random';
  loop?: boolean;
  loopDelay?: number;
  stagger?: number;
  scrambleCharset?: string;
  colorFrom?: string;
  colorTo?: string;
  triggerOnce?: boolean;
  respectReducedMotion?: boolean;
  triggerOnHover?: boolean;
  effect?: 'slide' | 'flip' | 'blur';
  hoverRadius?: number;
  motionBlur?: boolean;
  color?: string;
  accentColor?: string;
}

interface ShuffleCell {
  wrap: HTMLSpanElement;
  inner: HTMLSpanElement;
  orig: HTMLElement;
  text: string;
  w: number;
  h: number;
  size: number;
  mids: HTMLElement[];
  seq: string[];
  shown: number;
  from: number;
  to: number;
  speed: number;
  lastValue: number;
  lastTime: number;
  blurLevel: number;
  busy: boolean;
  near: boolean;
  travel: number;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const BLUR_STEPS = 12;

const Shuffle: React.FC<ShuffleProps> = ({
  text,
  className = '',
  style = {},
  shuffleDirection = 'right',
  duration = 0.35,
  maxDelay = 0,
  ease = 'power3.out',
  threshold = 0.1,
  rootMargin = '-100px',
  tag = 'p',
  textAlign = 'center',
  onShuffleComplete,
  shuffleTimes = 1,
  animationMode = 'evenodd',
  loop = false,
  loopDelay = 0,
  stagger = 0.03,
  scrambleCharset = '',
  colorFrom,
  colorTo,
  triggerOnce = true,
  respectReducedMotion = true,
  triggerOnHover = true,
  effect = 'slide',
  hoverRadius = 0,
  motionBlur = false,
  color,
  accentColor
}) => {
  const ref = useRef<HTMLElement>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [ready, setReady] = useState(false);

  const splitRef = useRef<GSAPSplitText | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const playingRef = useRef(false);
  const onCompleteRef = useRef(onShuffleComplete);

  useEffect(() => {
    onCompleteRef.current = onShuffleComplete;
  }, [onShuffleComplete]);

  useEffect(() => {
    if ('fonts' in document) {
      if (document.fonts.status === 'loaded') setFontsLoaded(true);
      else document.fonts.ready.then(() => setFontsLoaded(true));
    } else setFontsLoaded(true);
  }, []);

  const scrollTriggerStart = useMemo(() => {
    const startPct = (1 - threshold) * 100;
    const mm = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin || '');
    const mv = mm ? parseFloat(mm[1]) : 0;
    const mu = mm ? mm[2] || 'px' : 'px';
    const sign = mv === 0 ? '' : mv < 0 ? `-=${Math.abs(mv)}${mu}` : `+=${mv}${mu}`;
    return `top ${startPct}%${sign}`;
  }, [threshold, rootMargin]);

  useGSAP(
    () => {
      if (!ref.current || !text || !fontsLoaded) return;
      if (respectReducedMotion && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setReady(true);
        onCompleteRef.current?.();
        return;
      }

      const el = ref.current as HTMLElement;
      const mode = effect === 'flip' || effect === 'blur' ? effect : 'slide';
      const isVertical = shuffleDirection === 'up' || shuffleDirection === 'down';
      const axis = isVertical ? 'y' : 'x';
      const forward = shuffleDirection === 'right' || shuffleDirection === 'down';
      const rolls = Math.max(1, Math.floor(shuffleTimes));
      const blurred = mode === 'blur' || (mode === 'slide' && motionBlur);
      const local = triggerOnHover && hoverRadius > 0;
      const uid = Math.random().toString(36).slice(2, 9);
      const running = new Set<gsap.core.Timeline>();
      const pointer = { x: 0, y: 0, lastX: 0, lastY: 0, seen: false };
      let cells: ShuffleCell[] = [];
      let baseColor = '';
      let svg: SVGSVGElement | null = null;
      let blurMax = 0;
      let moveFrame = 0;
      let unhover: (() => void) | null = null;

      const pick = (fallback: string) =>
        scrambleCharset ? scrambleCharset.charAt(Math.floor(Math.random() * scrambleCharset.length)) : fallback;

      const ensureFilters = (unit: number) => {
        if (svg || !blurred) return;
        blurMax = Math.max(2, unit * (mode === 'blur' ? 0.26 : 0.24));
        svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('width', '0');
        svg.setAttribute('height', '0');
        Object.assign(svg.style, { position: 'absolute', width: '0', height: '0', overflow: 'hidden' });
        for (let k = 1; k <= BLUR_STEPS; k++) {
          const filter = document.createElementNS(SVG_NS, 'filter');
          filter.setAttribute('id', `shuffle-${uid}-${k}`);
          filter.setAttribute('x', isVertical ? '-10%' : '-100%');
          filter.setAttribute('y', isVertical ? '-100%' : '-10%');
          filter.setAttribute('width', isVertical ? '120%' : '300%');
          filter.setAttribute('height', isVertical ? '300%' : '120%');
          filter.setAttribute('color-interpolation-filters', 'sRGB');
          const blur = document.createElementNS(SVG_NS, 'feGaussianBlur');
          const amount = (blurMax * Math.pow(k / BLUR_STEPS, 1.5)).toFixed(2);
          blur.setAttribute('stdDeviation', isVertical ? `0 ${amount}` : `${amount} 0`);
          filter.appendChild(blur);
          svg.appendChild(filter);
        }
        document.body.appendChild(svg);
      };

      const setBlur = (cell: ShuffleCell, amount: number) => {
        if (!svg) return;
        const level = Math.round(BLUR_STEPS * Math.pow(Math.min(1, Math.max(0, amount) / blurMax), 1 / 1.5));
        if (level === cell.blurLevel) return;
        cell.blurLevel = level;
        const node = mode === 'slide' ? cell.inner : cell.orig;
        node.style.filter = level ? `url(#shuffle-${uid}-${level})` : '';
      };

      const trackSpeed = (cell: ShuffleCell, value: number) => {
        const now = gsap.ticker.time;
        const dt = now - cell.lastTime;
        if (dt > 0) cell.speed = cell.speed * 0.35 + (Math.abs(value - cell.lastValue) / dt) * 0.65;
        cell.lastValue = value;
        cell.lastTime = now;
        return cell.speed;
      };

      const teardown = () => {
        if (tlRef.current) {
          tlRef.current.kill();
          tlRef.current = null;
        }
        running.forEach(tl => tl.kill());
        running.clear();
        cells.forEach(cell => {
          if (cell.wrap.parentNode) cell.wrap.parentNode.replaceChild(cell.orig, cell.wrap);
        });
        cells = [];
        try {
          splitRef.current?.revert();
        } catch {}
        splitRef.current = null;
        playingRef.current = false;
      };

      const build = () => {
        teardown();

        splitRef.current = new GSAPSplitText(el, {
          type: 'chars',
          charsClass: 'shuffle-char',
          wordsClass: 'shuffle-word',
          linesClass: 'shuffle-line',
          smartWrap: true,
          reduceWhiteSpace: false
        });

        const chars = (splitRef.current.chars || []) as HTMLElement[];
        const strip = mode === 'slide';
        const metricsContext = strip && isVertical ? document.createElement('canvas').getContext('2d') : null;
        baseColor = window.getComputedStyle(el).color;

        const measureVerticalCell = (node: HTMLElement, lineBoxHeight: number) => {
          const computed = window.getComputedStyle(node);
          let fontHeight = 0;

          if (metricsContext) {
            metricsContext.font = [
              computed.fontStyle,
              computed.fontVariant,
              computed.fontWeight,
              computed.fontSize,
              computed.fontFamily
            ].join(' ');

            const sample = `${node.textContent || 'M'}${scrambleCharset}`;
            const metrics = metricsContext.measureText(sample);
            const ascent = metrics.fontBoundingBoxAscent;
            const descent = metrics.fontBoundingBoxDescent;
            if (Number.isFinite(ascent) && Number.isFinite(descent)) fontHeight = ascent + descent;
          }

          if (!fontHeight) {
            const probe = node.cloneNode(true) as HTMLElement;
            probe.textContent = `${node.textContent || 'M'}${scrambleCharset}`;
            Object.assign(probe.style, {
              position: 'absolute',
              visibility: 'hidden',
              pointerEvents: 'none',
              width: 'auto',
              height: 'auto',
              whiteSpace: 'nowrap',
              lineHeight: 'normal',
              fontFamily: computed.fontFamily,
              fontSize: computed.fontSize,
              fontStyle: computed.fontStyle,
              fontVariant: computed.fontVariant,
              fontWeight: computed.fontWeight,
              fontStretch: computed.fontStretch
            });
            document.body.appendChild(probe);
            fontHeight = probe.getBoundingClientRect().height;
            probe.remove();
          }

          const overflow = Math.max(0, Math.ceil(fontHeight - lineBoxHeight));
          const padTop = Math.floor(overflow / 2);
          return { cellHeight: lineBoxHeight + overflow, padTop, padBottom: overflow - padTop };
        };

        chars.forEach(ch => {
          const parent = ch.parentElement;
          if (!parent) return;

          const w = ch.getBoundingClientRect().width;
          const h = ch.getBoundingClientRect().height;
          if (!w) return;

          const { cellHeight, padTop, padBottom } = metricsContext
            ? measureVerticalCell(ch, h)
            : { cellHeight: h, padTop: 0, padBottom: 0 };
          const tall = strip && isVertical;

          const wrap = document.createElement('span');
          Object.assign(wrap.style, {
            display: 'inline-block',
            overflow: strip ? 'hidden' : 'visible',
            width: w + 'px',
            height: tall ? cellHeight + 'px' : 'auto',
            marginTop: tall ? -padTop + 'px' : '0',
            marginBottom: tall ? -padBottom + 'px' : '0',
            verticalAlign: 'bottom',
            perspective: mode === 'flip' ? Math.round(h * 3.2) + 'px' : ''
          });

          const inner = document.createElement('span');
          Object.assign(inner.style, {
            display: 'inline-block',
            whiteSpace: isVertical ? 'normal' : 'nowrap',
            willChange: mode === 'slide' ? 'transform' : 'transform, opacity'
          });

          parent.insertBefore(wrap, ch);
          wrap.appendChild(inner);

          Object.assign(ch.style, {
            display: tall ? 'flex' : 'inline-block',
            alignItems: tall ? 'center' : '',
            justifyContent: tall ? 'center' : '',
            height: tall ? cellHeight + 'px' : '',
            lineHeight: tall ? h + 'px' : '',
            width: w + 'px',
            textAlign: 'center'
          });
          inner.appendChild(ch);

          if (colorFrom) wrap.style.color = colorFrom;
          cells.push({
            wrap,
            inner,
            orig: ch,
            text: ch.textContent || '',
            w,
            h,
            size: isVertical ? cellHeight : w,
            mids: [],
            seq: [],
            shown: -1,
            from: 0,
            to: 0,
            speed: 0,
            lastValue: 0,
            lastTime: 0,
            blurLevel: 0,
            busy: false,
            near: false,
            travel: 0
          });
        });

        if (cells.length) ensureFilters(isVertical ? cells[0].size : cells[0].h);
      };

      const fillStrip = (cell: ShuffleCell, count: number) => {
        const head = cell.orig.cloneNode(true) as HTMLElement;
        const mids: HTMLElement[] = [];
        for (let k = 0; k < count; k++) {
          const node = cell.orig.cloneNode(true) as HTMLElement;
          node.textContent = pick(cell.text);
          if (accentColor) node.style.color = accentColor;
          mids.push(node);
        }
        cell.mids = mids;
        cell.inner.replaceChildren(...(forward ? [cell.orig, ...mids, head] : [head, ...mids, cell.orig]));
        const span = (count + 1) * cell.size;
        cell.from = forward ? -span : 0;
        cell.to = forward ? 0 : -span;
        gsap.set(cell.inner, { x: 0, y: 0, [axis]: cell.from, force3D: true });
      };

      const fillSequence = (cell: ShuffleCell, count: number) => {
        cell.seq = [cell.text];
        for (let k = 0; k < count; k++) cell.seq.push(pick(cell.text));
        cell.seq.push(cell.text);
        cell.shown = -1;
      };

      const reroll = (cell: ShuffleCell) => {
        if (mode === 'slide') cell.mids.forEach(node => (node.textContent = pick(cell.text)));
        else for (let k = 1; k < cell.seq.length - 1; k++) cell.seq[k] = pick(cell.text);
      };

      const showGlyph = (cell: ShuffleCell, index: number) => {
        if (cell.shown === index) return;
        cell.shown = index;
        cell.orig.textContent = cell.seq[index];
        cell.orig.style.color = accentColor && index > 0 && index < cell.seq.length - 1 ? accentColor : '';
      };

      const renderFlip = (cell: ShuffleCell, t: number) => {
        const last = cell.seq.length - 1;
        const nearest = Math.round(t);
        showGlyph(cell, Math.max(0, Math.min(last, nearest)));
        const angle = (t - nearest) * 180;
        const facing = Math.abs(Math.cos((angle * Math.PI) / 180));
        const turn = isVertical ? (forward ? -angle : angle) : forward ? angle : -angle;
        gsap.set(cell.inner, {
          [isVertical ? 'rotationX' : 'rotationY']: turn,
          z: Math.sin(Math.PI * Math.min(1, Math.max(0, t / last))) * cell.h * 0.22,
          opacity: 0.22 + 0.78 * Math.pow(facing, 1.5)
        });
      };

      const renderBlur = (cell: ShuffleCell, t: number) => {
        const last = cell.seq.length - 1;
        const nearest = Math.round(t);
        const phase = Math.max(-0.5, Math.min(0.5, t - nearest));
        showGlyph(cell, Math.max(0, Math.min(last, nearest)));
        const speed = trackSpeed(cell, t);
        gsap.set(cell.inner, {
          [axis]: (forward ? 1 : -1) * phase * cell.size * 0.42,
          opacity: 0.5 + 0.5 * Math.pow(Math.cos(phase * Math.PI), 0.7)
        });
        setBlur(cell, speed * cell.size * 0.012);
      };

      const animateCell = (cell: ShuffleCell, count: number, dur: number) => {
        const tl = gsap.timeline();
        if (mode === 'slide') {
          fillStrip(cell, count);
          tl.fromTo(
            cell.inner,
            { [axis]: cell.from },
            {
              [axis]: cell.to,
              duration: dur,
              ease,
              force3D: true,
              immediateRender: false,
              onStart: () => {
                cell.speed = 0;
                cell.lastValue = cell.from;
                cell.lastTime = gsap.ticker.time;
              },
              onUpdate: blurred
                ? () => setBlur(cell, trackSpeed(cell, Number(gsap.getProperty(cell.inner, axis))) * 0.0065)
                : undefined,
              onComplete: () => setBlur(cell, 0)
            },
            0
          );
        } else {
          fillSequence(cell, count);
          const proxy = { t: 0 };
          const render = mode === 'flip' ? renderFlip : renderBlur;
          tl.fromTo(
            proxy,
            { t: 0 },
            {
              t: count + 1,
              duration: dur,
              ease,
              immediateRender: false,
              onStart: () => {
                cell.speed = 0;
                cell.lastValue = 0;
                cell.lastTime = gsap.ticker.time;
              },
              onUpdate: () => render(cell, proxy.t),
              onComplete: () => setBlur(cell, 0)
            },
            0
          );
        }
        if (colorFrom || colorTo) {
          tl.fromTo(
            cell.wrap,
            { color: colorFrom || baseColor },
            { color: colorTo || baseColor, duration: dur, ease, immediateRender: false },
            0
          );
        }
        return tl;
      };

      const settle = (cell: ShuffleCell) => {
        if (mode === 'slide') {
          cell.inner.replaceChildren(cell.orig);
          cell.mids = [];
        } else {
          cell.orig.textContent = cell.text;
          cell.orig.style.color = '';
          cell.shown = -1;
        }
        gsap.set(cell.inner, { clearProps: 'transform,opacity' });
        setBlur(cell, 0);
        cell.wrap.style.color = colorTo || '';
      };

      const startOffsets = (): number[] => {
        if (animationMode === 'evenodd') {
          const oddCount = Math.floor(cells.length / 2);
          const evenStart = oddCount ? (duration + Math.max(0, oddCount - 1) * stagger) * 0.7 : 0;
          return cells.map((_, i) => (i % 2 === 1 ? Math.floor(i / 2) * stagger : evenStart + (i / 2) * stagger));
        }
        if (animationMode === 'center') {
          const spread = gsap.utils.distribute({ each: stagger, from: 'center' });
          return cells.map((cell, i) => spread(i, cell, cells));
        }
        if (animationMode === 'sequence') return cells.map((_, i) => i * stagger);
        return cells.map(() => Math.random() * maxDelay);
      };

      const play = () => {
        if (!cells.length) return;
        playingRef.current = true;
        const offsets = startOffsets();

        const tl = gsap.timeline({
          repeat: loop ? -1 : 0,
          repeatDelay: loop ? loopDelay : 0,
          onRepeat: () => {
            cells.forEach(reroll);
            onCompleteRef.current?.();
          },
          onComplete: () => {
            playingRef.current = false;
            if (loop) return;
            cells.forEach(settle);
            onCompleteRef.current?.();
            armHover();
          }
        });

        cells.forEach((cell, i) => tl.add(animateCell(cell, rolls, duration), offsets[i]));
        tlRef.current = tl;
      };

      const shuffleNear = (cell: ShuffleCell, strength: number) => {
        cell.busy = true;
        const tl = animateCell(
          cell,
          Math.max(1, Math.round(rolls * (0.35 + 0.65 * strength))),
          duration * (0.5 + 0.5 * strength)
        );
        tl.delay((1 - strength) * 0.08);
        tl.eventCallback('onComplete', () => {
          running.delete(tl);
          cell.busy = false;
          settle(cell);
        });
        running.add(tl);
      };

      const scan = () => {
        moveFrame = 0;
        if (playingRef.current || !cells.length) return;
        const moved = pointer.seen ? Math.hypot(pointer.x - pointer.lastX, pointer.y - pointer.lastY) : 0;
        pointer.lastX = pointer.x;
        pointer.lastY = pointer.y;
        pointer.seen = true;
        const box = el.getBoundingClientRect();
        const outside =
          pointer.x < box.left - hoverRadius ||
          pointer.x > box.right + hoverRadius ||
          pointer.y < box.top - hoverRadius ||
          pointer.y > box.bottom + hoverRadius;

        cells.forEach(cell => {
          let distance = Infinity;
          if (!outside) {
            const rect = cell.wrap.getBoundingClientRect();
            distance = Math.hypot(pointer.x - (rect.left + rect.width / 2), pointer.y - (rect.top + rect.height / 2));
          }
          if (distance >= hoverRadius) {
            cell.near = false;
            cell.travel = 0;
            return;
          }
          const reach = 1 - distance / hoverRadius;
          const strength = reach * reach * (3 - 2 * reach);
          const entered = !cell.near;
          cell.near = true;
          cell.travel += moved * (0.35 + strength);
          if (cell.busy || (!entered && cell.travel < cell.w * 1.4)) return;
          cell.travel = 0;
          shuffleNear(cell, strength);
        });
      };

      const handlePointerMove = (event: PointerEvent) => {
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        if (!moveFrame) moveFrame = requestAnimationFrame(scan);
      };

      const removeHover = () => {
        unhover?.();
        unhover = null;
      };

      const armHover = () => {
        if (!triggerOnHover) return;
        removeHover();
        if (local) {
          window.addEventListener('pointermove', handlePointerMove, { passive: true });
          unhover = () => {
            window.removeEventListener('pointermove', handlePointerMove);
            cancelAnimationFrame(moveFrame);
            moveFrame = 0;
          };
          return;
        }
        const handleEnter = () => {
          if (playingRef.current) return;
          build();
          play();
        };
        el.addEventListener('mouseenter', handleEnter);
        unhover = () => el.removeEventListener('mouseenter', handleEnter);
      };

      const create = () => {
        build();
        play();
        armHover();
        setReady(true);
      };

      const st = ScrollTrigger.create({
        trigger: el,
        start: scrollTriggerStart,
        once: triggerOnce,
        onEnter: create
      });

      return () => {
        st.kill();
        removeHover();
        teardown();
        svg?.remove();
        svg = null;
        setReady(false);
      };
    },
    {
      dependencies: [
        text,
        duration,
        maxDelay,
        ease,
        scrollTriggerStart,
        fontsLoaded,
        shuffleDirection,
        shuffleTimes,
        animationMode,
        loop,
        loopDelay,
        stagger,
        scrambleCharset,
        colorFrom,
        colorTo,
        triggerOnce,
        respectReducedMotion,
        triggerOnHover,
        effect,
        hoverRadius,
        motionBlur,
        color,
        accentColor
      ],
      scope: ref
    }
  );

  const userHasFont = hasFontFamilyClass(className);

  const commonStyle: React.CSSProperties = useMemo(
    () => ({
      textAlign,
      ...(userHasFont ? {} : { fontFamily: "'Press Start 2P', sans-serif" }),
      ...(color ? { color } : {}),
      ...style
    }),
    [textAlign, userHasFont, color, style]
  );

  const classes = `inline-block whitespace-normal break-words will-change-transform uppercase text-[4rem] leading-none ${ready ? 'visible' : 'invisible'} ${className}`;

  const Tag = (tag || 'p') as React.ElementType;
  return React.createElement(Tag, { ref, className: classes, style: commonStyle }, text);
};

export default Shuffle;
