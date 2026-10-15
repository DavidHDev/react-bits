'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { cancelFrame, frame, motion, useMotionValue, useReducedMotion, useSpring, type FrameData } from 'motion/react';

import './CircularText.css';

type HoverMode = 'slowDown' | 'speedUp' | 'pause' | 'goBonkers';

interface CircularTextProps {
  text: string;
  spinDuration?: number;
  onHover?: HoverMode;
  direction?: 'clockwise' | 'counterclockwise';
  size?: number;
  fontSize?: number;
  fontWeight?: number;
  letterSpacing?: number;
  color?: string;
  startAngle?: number;
  fill?: boolean;
  repeat?: number;
  ring?: boolean;
  ringColor?: string;
  tilt?: number;
  hoverTilt?: number;
  draggable?: boolean;
  children?: React.ReactNode;
  className?: string;
}

interface SpinState {
  dragging: boolean;
  hovering: boolean;
  fling: number;
  cruise: number;
  angle: number | null;
  travel: number;
  samples: [number, number][];
}

const HOVER_SPEED: Record<HoverMode, number> = { slowDown: 0.5, speedUp: 4, pause: 0, goBonkers: 20 };
const MAX_FLING = 1440;

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const clamp = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v);

const CircularText: React.FC<CircularTextProps> = ({
  text,
  spinDuration = 20,
  onHover = 'speedUp',
  direction = 'clockwise',
  size = 200,
  fontSize = 24,
  fontWeight = 900,
  letterSpacing = 0,
  color = '',
  startAngle = 0,
  fill = true,
  repeat = 1,
  ring = false,
  ringColor = '',
  tilt = 0,
  hoverTilt = 0,
  draggable = false,
  children,
  className = ''
}: CircularTextProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const glyphRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const stateRef = useRef<SpinState>({
    dragging: false,
    hovering: false,
    fling: 0,
    cruise: 0,
    angle: null,
    travel: 0,
    samples: []
  });
  const [advances, setAdvances] = useState<number[] | null>(null);
  const [settled, setSettled] = useState(false);
  const [dragging, setDragging] = useState(false);
  const reduceMotion = useReducedMotion();
  const rotation = useMotionValue(0);
  const speed = useSpring(1, { stiffness: 60, damping: 18 });
  const scale = useSpring(1, { stiffness: 300, damping: 20 });
  const tiltX = useSpring(0, { stiffness: 150, damping: 18 });
  const tiltY = useSpring(0, { stiffness: 150, damping: 18 });

  const glyphs = useMemo(() => Array.from(text ?? ''), [text]);
  const copies = Math.max(1, Math.round(repeat) || 1);
  const letters = useMemo(() => Array.from({ length: copies }, () => glyphs).flat(), [glyphs, copies]);

  const angles = useMemo(() => {
    const count = glyphs.length;
    if (!count) return [];
    if (fill) return letters.map((_, i) => startAngle + (360 / letters.length) * i);
    const known = advances && advances.length === count ? advances : null;
    const toDegrees = 180 / (Math.PI * Math.max(size / 2 - fontSize * 0.6, 1));
    const arcs = glyphs.map((glyph, i) => {
      const width = known ? known[i] : fontSize * (glyph === ' ' ? 0.3 : 0.6);
      return Math.max(0, width + letterSpacing * fontSize) * toDegrees;
    });
    const span = arcs.reduce((sum, arc) => sum + arc, 0);
    const fit = span > 0 ? Math.min(1, 360 / (span * copies)) : 1;
    const result: number[] = [];
    for (let copy = 0; copy < copies; copy += 1) {
      let cursor = startAngle + (360 / copies) * copy - (arcs[0] * fit) / 2;
      for (let i = 0; i < count; i += 1) {
        const arc = arcs[i] * fit;
        result.push(cursor + arc / 2);
        cursor += arc;
      }
    }
    return result;
  }, [glyphs, letters, copies, fill, startAngle, size, fontSize, letterSpacing, advances]);

  useIsomorphicLayoutEffect(() => {
    if (fill) return undefined;
    let alive = true;
    const measure = () => {
      if (!alive) return;
      const widths = glyphs.map((_, i) => glyphRefs.current[i]?.offsetWidth ?? 0);
      setAdvances(prev =>
        prev && prev.length === widths.length && prev.every((width, i) => width === widths[i]) ? prev : widths
      );
    };
    measure();
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      alive = false;
    };
  }, [fill, glyphs, fontSize, fontWeight, className]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const state = stateRef.current;
    const turn = direction === 'counterclockwise' ? -1 : 1;
    state.cruise = spinDuration > 0 && !reduceMotion ? (360 / spinDuration) * turn : 0;
    if (!root || reduceMotion) return undefined;

    const spin = ({ delta }: FrameData) => {
      if (state.dragging) return;
      const dt = Math.min(delta, 100) / 1000;
      state.fling *= Math.exp(-dt / 0.7);
      if (Math.abs(state.fling) < 1) state.fling = 0;
      const velocity = state.cruise * speed.get() + state.fling;
      if (velocity) rotation.set((rotation.get() + velocity * dt) % 360);
    };

    let running = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting === running) return;
      running = entry.isIntersecting;
      if (running) frame.update(spin, true);
      else cancelFrame(spin);
    });
    observer.observe(root);

    return () => {
      observer.disconnect();
      cancelFrame(spin);
    };
  }, [spinDuration, direction, reduceMotion, rotation, speed]);

  useEffect(() => {
    if (hoverTilt && !reduceMotion) return;
    tiltX.set(0);
    tiltY.set(0);
  }, [hoverTilt, reduceMotion, tiltX, tiltY]);

  const applyScale = () => {
    const state = stateRef.current;
    const bonkers = state.hovering && onHover === 'goBonkers' && !reduceMotion;
    scale.set((bonkers ? 0.8 : 1) * (state.dragging ? 0.96 : 1));
  };

  const pointerAngle = (e: React.PointerEvent<HTMLDivElement>): number | null => {
    const root = rootRef.current;
    if (!root) return null;
    const rect = root.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    if (Math.hypot(dx, dy) < rect.width * 0.06) return null;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  };

  const handleEnter = () => {
    stateRef.current.hovering = true;
    if (onHover && !reduceMotion) speed.set(HOVER_SPEED[onHover] ?? 1);
    applyScale();
  };

  const handleLeave = () => {
    stateRef.current.hovering = false;
    speed.set(1);
    tiltX.set(0);
    tiltY.set(0);
    applyScale();
  };

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = stateRef.current;
    const root = rootRef.current;
    if (!root) return;

    if (state.dragging) {
      const angle = pointerAngle(e);
      if (angle !== null) {
        if (state.angle !== null) {
          let delta = angle - state.angle;
          if (delta > 180) delta -= 360;
          if (delta < -180) delta += 360;
          state.travel += delta;
          rotation.set((rotation.get() + delta) % 360);
          state.samples.push([e.timeStamp, state.travel]);
          while (state.samples.length > 2 && e.timeStamp - state.samples[0][0] > 100) state.samples.shift();
        }
        state.angle = angle;
      }
    }

    if (!hoverTilt || reduceMotion || e.pointerType === 'touch') return;
    const rect = root.getBoundingClientRect();
    const nx = clamp(((e.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    const ny = clamp(((e.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
    tiltX.set(-ny * hoverTilt);
    tiltY.set(nx * hoverTilt);
  };

  const handleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggable || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const state = stateRef.current;
    state.dragging = true;
    state.fling = 0;
    state.angle = pointerAngle(e);
    state.travel = 0;
    state.samples = [[e.timeStamp, 0]];
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDragging(true);
    applyScale();
  };

  const handleUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = stateRef.current;
    if (!state.dragging) return;
    state.dragging = false;
    setDragging(false);
    applyScale();
    const [startTime, startTravel] = state.samples[0];
    const lastTime = state.samples[state.samples.length - 1][0];
    const elapsed = e.timeStamp - startTime;
    const velocity = elapsed > 0 && e.timeStamp - lastTime < 80 ? ((state.travel - startTravel) / elapsed) * 1000 : 0;
    state.fling = reduceMotion ? 0 : clamp(velocity, -MAX_FLING, MAX_FLING) - state.cruise * speed.get();
  };

  return (
    <div
      ref={rootRef}
      className={`circular-text ${className}`}
      data-settled={settled ? '' : undefined}
      style={{
        width: size,
        height: size,
        fontSize,
        fontWeight,
        color: color || undefined,
        perspective: size * 2.5,
        cursor: draggable ? (dragging ? 'grabbing' : 'grab') : undefined,
        touchAction: draggable ? 'none' : undefined,
        userSelect: draggable ? 'none' : undefined,
        WebkitUserSelect: draggable ? 'none' : undefined
      }}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
      onPointerMove={handleMove}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
    >
      <motion.div className="circular-text__tilt" style={{ rotateX: tiltX, rotateY: tiltY, scale }}>
        <div className="circular-text__plane" style={{ transform: tilt ? `rotateX(${tilt}deg)` : undefined }}>
          <span
            className="circular-text__line"
            style={{
              borderWidth: Math.max(1, fontSize / 16),
              borderColor: ringColor || undefined,
              opacity: ring ? 1 : 0
            }}
          />
          <motion.div className="circular-text__ring" role="img" aria-label={text} style={{ rotate: rotation }}>
            {letters.map((letter, i) => (
              <span key={i} className="circular-text__letter" style={{ transform: `rotate(${angles[i] ?? 0}deg)` }}>
                <span
                  ref={
                    i < glyphs.length
                      ? (el: HTMLSpanElement | null) => {
                          glyphRefs.current[i] = el;
                        }
                      : undefined
                  }
                >
                  {letter}
                </span>
              </span>
            ))}
          </motion.div>
        </div>
        {children != null && children !== false ? <div className="circular-text__center">{children}</div> : null}
      </motion.div>
    </div>
  );
};

export default CircularText;
