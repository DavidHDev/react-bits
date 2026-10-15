'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

type Direction = 'right' | 'left' | 'up' | 'down' | 'diagonal';
type Mode = 'entrance' | 'pointer' | 'both';
type Trail = 'pointer' | 'auto' | 'scroll';
type Ease = 'linear' | 'ease-out' | 'ease-in-out' | 'snappy';
type EchoStyle = 'solid' | 'outline';

type Vector = { x: number; y: number };

type Burst = { start: number; x: number; y: number; nodes: HTMLElement[] };

export interface EchoTextProps {
  text?: string;
  echoes?: number;
  lag?: number;
  offset?: number;
  direction?: Direction;
  fade?: number;
  blur?: number;
  tint?: string | false;
  echoColors?: [string, string];
  echoStyle?: EchoStyle;
  echoScale?: number;
  mode?: Mode;
  trail?: Trail;
  clickBurst?: boolean;
  cursorRadius?: number;
  duration?: number;
  ease?: Ease;
  fontSize?: string | number;
  fontWeight?: string | number;
  color?: string;
  className?: string;
  style?: CSSProperties;
}

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const directionVectors: Record<Direction, Vector> = {
  right: { x: 1, y: 0 },
  left: { x: -1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  diagonal: { x: 0.72, y: 0.72 }
};

const easing: Record<Ease, (t: number) => number> = {
  linear: t => t,
  'ease-out': t => 1 - Math.pow(1 - t, 3),
  'ease-in-out': t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  snappy: t => 1 - Math.pow(1 - t, 5)
};

const DRIFT_PERIOD = 7200;
const DRIFT_IDLE = 2600;
const BURST_LIFE = 1100;
const BURST_GAP = 80;

const readScroll = (target: Document | Element): [number, number] =>
  target instanceof Element ? [target.scrollLeft || 0, target.scrollTop || 0] : [window.scrollX, window.scrollY];

const EchoText = ({
  text = 'Motion Echo',
  echoes = 12,
  lag = 0.24,
  offset = 36,
  direction = 'right',
  fade = 0.72,
  blur = 3,
  tint = '#7dd3fc',
  echoColors,
  echoStyle = 'solid',
  echoScale = 1,
  mode = 'both',
  trail = 'pointer',
  clickBurst = true,
  cursorRadius = 320,
  duration = 900,
  ease = 'ease-out',
  fontSize = 'clamp(3rem, 9vw, 7rem)',
  fontWeight = 800,
  color = 'currentColor',
  className = '',
  style
}: EchoTextProps) => {
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const burstRef = useRef<HTMLSpanElement | null>(null);
  const copyRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const echoCount = prefersReducedMotion ? 0 : clamp(Math.round(echoes), 0, 24);
  const echoIndexes = useMemo(() => Array.from({ length: echoCount }, (_, index) => echoCount - index), [echoCount]);
  const ramp = Array.isArray(echoColors) && echoColors.length ? echoColors : null;
  const canBurst = clickBurst && echoCount > 0;

  const echoColor = (index: number) => {
    if (ramp) {
      const depth = echoCount > 1 ? (index - 1) / (echoCount - 1) : 0;
      return `color-mix(in srgb, ${ramp[ramp.length - 1]} ${Math.round(depth * 100)}%, ${ramp[0]})`;
    }
    return tint ? `color-mix(in srgb, ${tint} ${Math.min(72, 18 + index * 5)}%, currentColor)` : undefined;
  };

  useEffect(() => {
    if (!window.matchMedia) return undefined;

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = () => setPrefersReducedMotion(media.matches);
    updateMotionPreference();

    media.addEventListener?.('change', updateMotionPreference);
    return () => media.removeEventListener?.('change', updateMotionPreference);
  }, []);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    const vector = directionVectors[direction] || directionVectors.right;
    const safeOffset = clamp(Number(offset) || 0, 0, 120);
    const safeCursorRadius = clamp(Number(cursorRadius) || 320, 40, 1200);
    const safeLag = clamp(Number(lag) || 0.16, 0.02, 0.5);
    const safeFade = clamp(Number(fade) || 0.64, 0.1, 0.95);
    const safeBlur = clamp(Number(blur) || 0, 0, 16);
    const safeScale = clamp(Number(echoScale) || 1, 0.25, 2.5);
    const safeDuration = Math.max(0, Number(duration) || 0);
    const easeFn = easing[ease] || easing['ease-out'];
    const entranceEnabled = mode === 'entrance' || mode === 'both';
    const liveEnabled = mode === 'pointer' || mode === 'both';
    const canHover = Boolean(window.matchMedia?.('(hover: hover) and (pointer: fine)').matches);
    const drifting = liveEnabled && trail === 'auto';
    const scrolling = liveEnabled && trail === 'scroll';
    const following = liveEnabled && canHover && !scrolling;
    const driftSpacing = 0.12 + safeLag * 1.1;
    const burstReach = clamp(safeOffset / 36, 0.35, 2.5);
    const shiftLimit = safeOffset * 4;

    const state = {
      targetX: 0,
      targetY: 0,
      lastTargetX: 0,
      lastTargetY: 0,
      activity: entranceEnabled ? 1 : 0,
      positions: Array.from({ length: echoCount + 1 }, (_, index) => {
        const entranceAmount = entranceEnabled ? safeOffset * (index + 0.35) : 0;
        return { x: vector.x * entranceAmount, y: vector.y * entranceAmount };
      }),
      bends: Array.from({ length: echoCount + 1 }, () => ({ x: 0, y: 0 })),
      startTime: performance.now(),
      lastTime: 0,
      drift: 0,
      phase: 0,
      pointerNear: false,
      pointerTime: -Infinity,
      visible: true,
      pushX: 0,
      pushY: 0,
      velocityX: 0,
      velocityY: 0,
      bursts: [] as Burst[]
    };
    let frame = 0;

    for (let index = 1; index <= echoCount; index += 1) {
      const copy = copyRefs.current[index];
      if (copy) copy.style.filter = safeBlur > 0 ? `blur(${((safeBlur * index) / echoCount).toFixed(2)}px)` : 'none';
    }

    const renderBursts = (now: number) => {
      state.bursts = state.bursts.filter(burst => {
        const age = now - burst.start;
        let alive = false;

        burst.nodes.forEach((node, index) => {
          const local = (age - index * BURST_GAP) / BURST_LIFE;
          if (local < 1) alive = true;

          const progress = clamp(local, 0, 1);
          const spread = 1 - Math.pow(1 - progress, 3);
          const scale = 1 + spread * 0.34 * burstReach;
          const peak = 0.75 * Math.pow(safeFade, index * 0.5);
          const opacity = local <= 0 ? 0 : Math.min(1, progress * 8) * Math.pow(1 - progress, 1.5) * peak;

          node.style.transform = `translate3d(${burst.x.toFixed(2)}px, ${burst.y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
          node.style.opacity = opacity.toFixed(3);
          node.style.filter = safeBlur > 0 ? `blur(${(safeBlur * 0.3 * spread).toFixed(2)}px)` : 'none';
        });

        if (!alive) burst.nodes.forEach(node => node.remove());
        return alive;
      });
    };

    const renderFrame = (now: number) => {
      frame = 0;

      const dt = state.lastTime ? clamp(now - state.lastTime, 0, 64) : 16.67;
      const step = dt / 16.67;
      state.lastTime = now;

      const elapsed = now - state.startTime;
      const entranceProgress = entranceEnabled && safeDuration > 0 ? clamp(elapsed / safeDuration, 0, 1) : 1;
      const entranceRest = entranceEnabled ? 1 - easeFn(entranceProgress) : 0;
      const targetVelocity = Math.hypot(state.targetX - state.lastTargetX, state.targetY - state.lastTargetY);

      state.lastTargetX = state.targetX;
      state.lastTargetY = state.targetY;

      if (drifting) {
        const away = !following || !state.pointerNear || now - state.pointerTime > DRIFT_IDLE;
        state.drift += ((away ? 1 : 0) - state.drift) * (1 - Math.pow(0.965, step));
        state.phase += (dt / DRIFT_PERIOD) * Math.PI * 2;
      }

      if (scrolling) {
        const blend = 1 - Math.pow(0.7, step);
        state.velocityX += (state.pushX / Math.max(step, 0.25) - state.velocityX) * blend;
        state.velocityY += (state.pushY / Math.max(step, 0.25) - state.velocityY) * blend;
        state.pushX = 0;
        state.pushY = 0;
      }

      const speed = Math.hypot(state.velocityX, state.velocityY);
      const shiftX = clamp(-state.velocityX * 3.2, -shiftLimit, shiftLimit);
      const shiftY = clamp(-state.velocityY * 3.2, -shiftLimit, shiftLimit);
      const followX = state.targetX * (1 - state.drift);
      const followY = state.targetY * (1 - state.drift);

      let maxSeparation = 0;
      let maxGap = 0;

      for (let index = 0; index <= echoCount; index += 1) {
        const copy = copyRefs.current[index];
        const current = state.positions[index];
        const bend = state.bends[index];
        if (!copy || !current || !bend) continue;

        const depth = echoCount ? index / echoCount : 0;
        const entranceAmount = entranceRest * safeOffset * (index + 0.35);
        let desiredX = followX + vector.x * entranceAmount;
        let desiredY = followY + vector.y * entranceAmount;

        if (state.drift > 0.0005) {
          const phase = state.phase - index * driftSpacing;
          const swing = safeOffset * state.drift * (0.25 + 0.75 * depth);
          desiredX += Math.sin(phase) * swing;
          desiredY += Math.sin(phase) * Math.cos(phase) * swing * 1.3;
        }

        const lerp = 1 - Math.pow(1 - clamp(0.34 / (1 + index * safeLag * 4.2), 0.018, 0.36), step);
        const bendLerp = 1 - Math.pow(1 - 0.3 / (1 + depth * (1 + safeLag * 8)), step);

        current.x += (desiredX - current.x) * lerp;
        current.y += (desiredY - current.y) * lerp;
        bend.x += (shiftX * depth - bend.x) * bendLerp;
        bend.y += (shiftY * depth - bend.y) * bendLerp;
        maxGap = Math.max(
          maxGap,
          Math.abs(desiredX - current.x),
          Math.abs(desiredY - current.y),
          Math.abs(shiftX * depth - bend.x),
          Math.abs(shiftY * depth - bend.y)
        );

        const x = current.x + bend.x;
        const y = current.y + bend.y;
        const scale = 1 + (safeScale - 1) * depth;
        copy.style.transform = `translate3d(${x.toFixed(3)}px, ${y.toFixed(3)}px, 0) scale(${scale.toFixed(4)})`;

        if (index > 0) {
          const front = state.positions[0];
          maxSeparation = Math.max(maxSeparation, Math.hypot(x - front.x, y - front.y));
        }
      }

      const separationActivity = safeOffset > 0 ? clamp(maxSeparation / (safeOffset * 2.25), 0, 1) : 0;
      const targetActivity = safeOffset > 0 ? clamp(targetVelocity / (safeOffset * 0.35), 0, 1) : 0;
      const nextActivity = Math.max(
        entranceRest,
        separationActivity,
        targetActivity,
        state.drift * 0.9,
        clamp(speed / 5, 0, 1)
      );
      state.activity += (nextActivity - state.activity) * (1 - Math.pow(0.82, step));

      renderBursts(now);

      const running =
        entranceProgress < 1 ||
        state.activity > 0.002 ||
        maxGap > 0.05 ||
        speed > 0.02 ||
        state.bursts.length > 0 ||
        (drifting && state.visible);
      if (!running) state.activity = 0;

      for (let index = 1; index <= echoCount; index += 1) {
        const copy = copyRefs.current[index];
        if (copy) copy.style.opacity = String(Math.pow(safeFade, index) * state.activity);
      }

      if (running) frame = requestAnimationFrame(renderFrame);
    };

    const wake = () => {
      if (!frame) {
        state.lastTime = 0;
        frame = requestAnimationFrame(renderFrame);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const deltaX = event.clientX - (rect.left + rect.width / 2);
      const deltaY = event.clientY - (rect.top + rect.height / 2);
      const distance = Math.hypot(deltaX, deltaY);
      const reach = distance > 0 ? clamp(distance / safeCursorRadius, 0, 1) : 0;
      const dirX = distance > 0 ? deltaX / distance : 0;
      const dirY = distance > 0 ? deltaY / distance : 0;

      state.targetX = dirX * reach * safeOffset;
      state.targetY = dirY * reach * safeOffset * 0.72;
      state.pointerNear = distance <= safeCursorRadius;
      state.pointerTime = performance.now();
      wake();
    };

    const handlePointerOut = (event: PointerEvent) => {
      if (event.relatedTarget) return;
      state.targetX = 0;
      state.targetY = 0;
      state.pointerNear = false;
      wake();
    };

    const scrollMemory = new WeakMap<Document | Element, [number, number]>();

    const handleScroll = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Document) && !(target instanceof Element && target.contains(root))) return;

      const [x, y] = readScroll(target);
      const last = scrollMemory.get(target);
      scrollMemory.set(target, [x, y]);
      if (!last) return;

      state.pushX -= x - last[0];
      state.pushY -= y - last[1];
      wake();
    };

    const handleClick = (event: MouseEvent) => {
      const layer = burstRef.current;
      const rect = root.getBoundingClientRect();
      if (!layer || !echoCount || !rect.width || !rect.height) return;

      const originX = clamp((event.clientX - rect.left) / rect.width, 0, 1) * 100;
      const originY = clamp((event.clientY - rect.top) / rect.height, 0, 1) * 100;
      const count = clamp(Math.round(echoCount / 3) + 2, 3, 6);
      const front = state.positions[0];
      const nodes: HTMLElement[] = [];

      for (let index = 0; index < count; index += 1) {
        const source = copyRefs.current[1 + Math.round((index / Math.max(1, count - 1)) * (echoCount - 1))];
        if (!source) continue;
        const node = source.cloneNode(true) as HTMLSpanElement;
        node.removeAttribute('data-echo-index');
        node.style.transformOrigin = `${originX.toFixed(1)}% ${originY.toFixed(1)}%`;
        node.style.opacity = '0';
        layer.appendChild(node);
        nodes.push(node);
      }

      state.bursts.push({ start: performance.now(), x: front?.x || 0, y: front?.y || 0, nodes });
      while (state.bursts.length > 4) state.bursts.shift()?.nodes.forEach(node => node.remove());
      wake();
    };

    if (following) {
      window.addEventListener('pointermove', handlePointerMove, { passive: true });
      document.addEventListener('pointerout', handlePointerOut);
    }

    if (scrolling) {
      scrollMemory.set(document, readScroll(document));
      for (let node = root.parentElement; node; node = node.parentElement) scrollMemory.set(node, readScroll(node));
      document.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    }

    if (clickBurst) root.addEventListener('click', handleClick);

    let observer: IntersectionObserver | undefined;
    if (drifting && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(entries => {
        state.visible = entries[entries.length - 1].isIntersecting;
        if (state.visible) wake();
      });
      observer.observe(root);
    }

    renderFrame(state.startTime);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerout', handlePointerOut);
      document.removeEventListener('scroll', handleScroll, { capture: true });
      root.removeEventListener('click', handleClick);
      observer?.disconnect();
      state.bursts.forEach(burst => burst.nodes.forEach(node => node.remove()));
    };
  }, [
    blur,
    clickBurst,
    cursorRadius,
    direction,
    duration,
    ease,
    echoCount,
    echoScale,
    fade,
    lag,
    mode,
    offset,
    prefersReducedMotion,
    trail
  ]);

  const rootStyle: CSSProperties = {
    fontSize,
    fontWeight,
    color,
    cursor: canBurst ? 'pointer' : undefined,
    ...style
  };

  const echoClassName = [
    'pointer-events-none absolute inset-0 block origin-center transform-gpu backface-hidden will-change-[transform,opacity] motion-reduce:hidden',
    echoStyle === 'outline'
      ? '[-webkit-text-fill-color:transparent] [-webkit-text-stroke:max(1px,0.014em)_currentColor]'
      : ''
  ]
    .join(' ')
    .trim();

  return (
    <span
      ref={rootRef}
      className={`relative inline-block whitespace-nowrap select-none leading-[0.9] tracking-[-0.04em] [contain:layout_style] [font-kerning:normal] [text-rendering:geometricPrecision] ${className}`.trim()}
      style={rootStyle}
    >
      {echoIndexes.map(index => (
        <span
          aria-hidden="true"
          className={echoClassName}
          data-echo-index={index}
          key={`echo-${index}`}
          ref={element => {
            copyRefs.current[index] = element;
          }}
          style={{ color: echoColor(index), opacity: 0 }}
        >
          {text}
        </span>
      ))}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0" ref={burstRef} />
      <span
        className="pointer-events-none relative z-[2] block transform-gpu text-shadow-[0_0.035em_0_rgba(255,255,255,0.04)] will-change-transform motion-reduce:[transform:none]!"
        data-echo-index="0"
        ref={element => {
          copyRefs.current[0] = element;
        }}
      >
        {text}
      </span>
    </span>
  );
};

export default EchoText;
