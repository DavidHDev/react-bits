import React, { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { animate, motion, useMotionTemplate, useMotionValue, useReducedMotion } from 'motion/react';

export type DodgeAxis = 'both' | 'x' | 'y';
export type DodgeWall = 'clamp' | 'bounce';
export type DodgeFieldState = { dodges: number; gave: boolean; caught: boolean; fleeing: boolean };

export interface DodgeFieldProps {
  children?: ReactNode | ((state: DodgeFieldState) => ReactNode);
  taunts?: string[];
  notice?: string;
  inkColor?: string;
  contrastColor?: string;
  fieldHeight?: number;
  reach?: number;
  radius?: number;
  falloff?: number;
  fleeDuration?: number;
  returnDuration?: number;
  returnBounce?: number;
  axis?: DodgeAxis;
  wall?: DodgeWall;
  patience?: number;
  disabled?: boolean;
  onDodge?: (count: number) => void;
  onRelent?: () => void;
  onCatch?: () => void;
  className?: string;
  style?: CSSProperties;
}

interface Live {
  reach: number;
  radius: number;
  falloff: number;
  fleeDuration: number;
  returnDuration: number;
  returnBounce: number;
  axis: DodgeAxis;
  wall: DodgeWall;
  still: boolean;
  inside: boolean;
  reduce: boolean | null;
}

const COUNT_LINE = 0.55;
const DEAD_ZONE = 6;
const CAUGHT_HOLD_MS = 760;
const INSET = 12;
const DEFAULT_TAUNTS = ['Catch me', 'Nope', 'Too slow', 'Almost', 'Okay, okay'];

const wallIt = (t: number, room: number, wall: DodgeWall) => {
  if (wall === 'bounce') {
    if (t > room) return Math.max(-room, 2 * room - t);
    if (t < -room) return Math.min(room, -2 * room - t);
    return t;
  }
  return Math.min(room, Math.max(-room, t));
};
const bearingOf = (dx: number, dy: number, d: number, axis: DodgeAxis) => {
  if (axis === 'x') return { x: Math.sign(dx) || 1, y: 0 };
  if (axis === 'y') return { x: 0, y: Math.sign(dy) || 1 };
  return { x: dx / d, y: dy / d };
};

const DodgeField: React.FC<DodgeFieldProps> = ({
  children,
  taunts = DEFAULT_TAUNTS,
  notice = '',
  inkColor = '#f5f5f5',
  contrastColor = '#18181b',
  fieldHeight = 240,
  reach = 72,
  radius = 120,
  falloff = 2,
  fleeDuration = 130,
  returnDuration = 620,
  returnBounce = 0.1,
  axis = 'both',
  wall = 'clamp',
  patience = 4,
  disabled = false,
  onDodge,
  onRelent,
  onCatch,
  className = '',
  style
}) => {
  const fieldRef = useRef<HTMLDivElement>(null);
  const moverRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const transform = useMotionTemplate`translate(${x}px, ${y}px)`;
  const reduce = useReducedMotion();
  const [fine, setFine] = useState(true);
  const [inside, setInside] = useState(false);
  const [dodges, setDodges] = useState(0);
  const [caught, setCaught] = useState(false);
  const gave = dodges >= Math.max(1, patience);
  const still = gave || caught || disabled || !!reduce;

  const pointer = useRef<{ x: number; y: number } | null>(null);
  const bearing = useRef({ x: 1, y: 0 });
  const armed = useRef(true);
  const room = useRef({ x: 0, y: 0 });
  const raf = useRef(0);
  const hold = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const live = useRef<Live>({} as Live);
  live.current = {
    reach,
    radius,
    falloff,
    fleeDuration,
    returnDuration,
    returnBounce,
    axis,
    wall,
    still,
    inside,
    reduce
  };

  useEffect(() => {
    const field = fieldRef.current;
    const mover = moverRef.current;
    if (!field || !mover) return undefined;
    const measure = () => {
      room.current = {
        x: Math.max(0, (field.clientWidth - mover.offsetWidth) / 2 - INSET),
        y: Math.max(0, (field.clientHeight - mover.offsetHeight) / 2 - INSET)
      };
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(field);
    observer.observe(mover);
    return () => observer.disconnect();
  }, []);

  const frame = useCallback(() => {
    raf.current = 0;
    const field = fieldRef.current;
    const p = pointer.current;
    const L = live.current;
    if (!field) return;
    const rect = field.getBoundingClientRect();
    const zoom = rect.width / (field.offsetWidth || rect.width) || 1;
    const dx = p ? (p.x - (rect.left + rect.width / 2)) / zoom : Infinity;
    const dy = p ? (p.y - (rect.top + rect.height / 2)) / zoom : Infinity;
    const d = Math.hypot(dx, dy);
    const isInside = d <= L.radius;
    if (!isInside && !L.inside) return;
    if (!L.still) {
      if (d < L.radius * COUNT_LINE) {
        if (armed.current) {
          armed.current = false;
          setDodges(n => n + 1);
        }
      } else if (d > L.radius) {
        armed.current = true;
      }
    }
    if (Number.isFinite(d) && d > DEAD_ZONE) bearing.current = bearingOf(dx, dy, d, L.axis);
    const flee = isInside && !L.still ? (1 - d / L.radius) ** L.falloff : 0;
    const tx = wallIt(-bearing.current.x * flee * L.reach, room.current.x, L.wall);
    const ty = wallIt(-bearing.current.y * flee * L.reach, room.current.y, L.wall);
    if (L.reduce) {
      x.jump(0);
      y.jump(0);
    } else {
      const cfg =
        flee > 0
          ? { type: 'spring' as const, duration: L.fleeDuration / 1000, bounce: 0 }
          : { type: 'spring' as const, duration: L.returnDuration / 1000, bounce: L.returnBounce };
      animate(x, tx, cfg);
      animate(y, ty, cfg);
    }
    if (isInside !== L.inside) setInside(isInside);
  }, [x, y]);

  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)');
    const sync = () => setFine(query.matches);
    sync();
    query.addEventListener('change', sync);
    if (!query.matches || disabled) return () => query.removeEventListener('change', sync);
    const tick = () => {
      if (!raf.current) raf.current = requestAnimationFrame(frame);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      pointer.current = { x: e.clientX, y: e.clientY };
      tick();
    };
    const onLeave = () => {
      pointer.current = null;
      tick();
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', tick, { passive: true, capture: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    return () => {
      query.removeEventListener('change', sync);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', tick, { capture: true });
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [disabled, frame]);

  useEffect(() => {
    if (!raf.current) raf.current = requestAnimationFrame(frame);
  }, [still, frame]);
  useEffect(() => {
    if (dodges) onDodge?.(dodges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dodges]);
  useEffect(() => {
    if (gave) onRelent?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gave]);
  useEffect(() => () => clearTimeout(hold.current), []);

  const handleClick = () => {
    setCaught(true);
    onCatch?.();
    clearTimeout(hold.current);
    hold.current = setTimeout(() => {
      setCaught(false);
      setDodges(0);
      armed.current = false;
    }, CAUGHT_HOLD_MS);
  };

  const state: DodgeFieldState = { dodges, gave, caught, fleeing: inside && !still };
  const index = gave || caught ? taunts.length - 1 : Math.min(dodges, Math.max(0, taunts.length - 2));
  const content =
    typeof children === 'function'
      ? children(state)
      : (children ?? (
          <button
            type="button"
            className="m-0 inline-flex h-[52px] cursor-pointer touch-manipulation items-center justify-center rounded-full border-0 px-7 text-[18px] leading-none font-medium tracking-[-0.012em] select-none [font-family:inherit] [-webkit-tap-highlight-color:transparent] [background:color-mix(in_srgb,var(--df-ink)_8%,transparent)] [color:color-mix(in_srgb,var(--df-ink)_72%,transparent)] [transition:transform_160ms_var(--df-ease-out),background-color_220ms_ease,color_220ms_ease] active:[transform:scale(0.97)] motion-reduce:active:[transform:none] motion-reduce:[transition:background-color_220ms_ease,color_220ms_ease] [@media(hover:hover)_and_(pointer:fine)]:hover:[color:color-mix(in_srgb,var(--df-ink)_90%,transparent)] group-data-[relented=true]:[color:var(--df-ink)] group-data-[relented=true]:hover:[color:var(--df-ink)] group-data-[caught=true]:[background:var(--df-ink)] group-data-[caught=true]:[color:var(--df-contrast)] group-data-[caught=true]:hover:[color:var(--df-contrast)] focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-[3px] focus-visible:[outline-color:color-mix(in_srgb,var(--df-ink)_60%,transparent)]"
            aria-label={taunts[0]}
          >
            <span className="grid">
              {taunts.map((taunt, i) => (
                <span
                  key={`${taunt}-${i}`}
                  className="[grid-area:1/1] whitespace-nowrap [transition:opacity_200ms_ease,filter_200ms_ease] data-[active=false]:opacity-0 data-[active=false]:[filter:blur(2px)] motion-reduce:data-[active=false]:[filter:none]"
                  data-active={i === index ? 'true' : 'false'}
                  aria-hidden="true"
                >
                  {taunt}
                </span>
              ))}
            </span>
          </button>
        ));

  return (
    <div
      ref={fieldRef}
      className={`relative grid w-full place-items-center [height:var(--df-height)]${className ? ` ${className}` : ''}`}
      data-coarse={fine ? undefined : ''}
      data-flat={reduce ? '' : undefined}
      style={
        {
          '--df-ink': inkColor,
          '--df-contrast': contrastColor,
          '--df-height': `${fieldHeight}px`,
          '--df-ease-out': 'cubic-bezier(0.23, 1, 0.32, 1)',
          ...style
        } as CSSProperties
      }
    >
      <motion.div
        ref={moverRef}
        className="group inline-grid [will-change:transform]"
        style={{ transform }}
        data-fled={inside && !still ? 'true' : 'false'}
        data-relented={gave ? 'true' : 'false'}
        data-caught={caught ? 'true' : 'false'}
        onClick={handleClick}
      >
        {content}
      </motion.div>
      {!fine && notice ? (
        <p className="pointer-events-none absolute inset-x-0 bottom-3 m-0 text-center text-[12px] [color:color-mix(in_srgb,var(--df-ink)_55%,transparent)]">
          {notice}
        </p>
      ) : null}
    </div>
  );
};

export default DodgeField;
