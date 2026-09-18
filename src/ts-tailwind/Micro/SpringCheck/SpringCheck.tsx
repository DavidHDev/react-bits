import React, { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { animate, useMotionValue, useMotionValueEvent, useReducedMotion } from 'motion/react';
import { Tick02Icon } from '@hugeicons/core-free-icons';

export type StrikeSide = 'left' | 'center' | 'right' | 'none';

export interface SpringCheckProps {
  label?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  color?: string;
  fillColor?: string;
  checkColor?: string;
  boxSize?: number;
  boxRadius?: number;
  fontSize?: number;
  bounce?: number;
  strikeLag?: number;
  doneOpacity?: number;
  strike?: StrikeSide;
  ariaLabel?: string;
  className?: string;
}

const VISUAL_DURATION = 0.2;
const RULE_END = 0.84;
const SWELL = 0.35;
const TICK_PATH = String(Tick02Icon[0][1].d);
const ORIGIN: Record<StrikeSide, string> = {
  left: 'left center',
  center: 'center',
  right: 'right center',
  none: 'left center'
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const zetaOf = (bounce: number) =>
  bounce <= 0 ? 1 : -Math.log(bounce) / Math.sqrt(Math.PI ** 2 + Math.log(bounce) ** 2);

const readings = (t: number, doneOpacity: number, strikeLag: number) => {
  const held = clamp01(t);
  return {
    fill: `scale(${Math.max(t, 0)})`,
    box: `scale(${1 + SWELL * Math.max(0, t - 1)})`,
    tick: 1 - held,
    word: 1 - (1 - doneOpacity) * held,
    rule: `scaleX(${clamp01((held - strikeLag) / (RULE_END - strikeLag))})`
  };
};

const SpringCheck: React.FC<SpringCheckProps> = ({
  label = 'Ship the build',
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  color = '#ffffff',
  fillColor = '#ffffff',
  checkColor = '#0b0b0f',
  boxSize = 28,
  boxRadius = 9,
  fontSize = 18,
  bounce = 0.2,
  strikeLag = 0.12,
  doneOpacity = 0.42,
  strike = 'left',
  ariaLabel,
  className = ''
}) => {
  const controlled = checked !== undefined;
  const [inner, setInner] = useState(defaultChecked);
  const on = controlled ? checked : inner;
  const reduce = useReducedMotion();

  const t = useMotionValue(on ? 1 : 0);
  const viaPointer = useRef(false);
  const instant = useRef(false);
  const rowRef = useRef<HTMLButtonElement>(null);
  const boxRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const tickRef = useRef<SVGPathElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const ruleRef = useRef<HTMLSpanElement>(null);
  const cfg = useRef({ doneOpacity, strikeLag });
  cfg.current = { doneOpacity, strikeLag };

  const write = (value: number) => {
    const r = readings(value, cfg.current.doneOpacity, cfg.current.strikeLag);
    if (fillRef.current) fillRef.current.style.transform = r.fill;
    if (boxRef.current) boxRef.current.style.transform = r.box;
    if (tickRef.current) tickRef.current.style.strokeDashoffset = String(r.tick);
    if (wordRef.current) wordRef.current.style.opacity = String(r.word);
    if (ruleRef.current) ruleRef.current.style.transform = r.rule;
  };
  useMotionValueEvent(t, 'change', write);
  useLayoutEffect(() => {
    write(t.get());
  });

  useEffect(() => {
    const target = on ? 1 : 0;
    if (reduce || instant.current) {
      instant.current = false;
      t.jump(target);
      return undefined;
    }
    if (t.get() === target && t.getVelocity() === 0) return undefined;
    const controls = animate(t, target, {
      type: 'spring',
      visualDuration: VISUAL_DURATION,
      bounce: 1 - zetaOf(bounce)
    });
    return () => controls.stop();
  }, [on, reduce, bounce, t]);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 || disabled) return;
    viaPointer.current = true;
    if (!reduce && rowRef.current) rowRef.current.dataset.pressed = '';
  };
  const handlePointerUp = () => {
    if (rowRef.current) delete rowRef.current.dataset.pressed;
  };
  const handlePointerCancel = () => {
    viaPointer.current = false;
    handlePointerUp();
  };
  const toggle = () => {
    if (disabled) return;
    instant.current = !viaPointer.current;
    viaPointer.current = false;
    const next = !on;
    if (!controlled) setInner(next);
    onChange?.(next);
  };

  const r = readings(t.get(), doneOpacity, strikeLag);
  const ring = boxSize >= 24 ? 2 : 1.5;
  const gap = Math.min(16, Math.max(8, Math.round(boxSize * 0.43)));
  const ruleHeight = Math.max(1.5, Math.round(fontSize / 6) / 2);

  const cssVars = {
    '--sc-ink': color,
    '--sc-fill': fillColor,
    '--sc-check': checkColor,
    '--sc-box': `${boxSize}px`,
    '--sc-radius': `${boxRadius}px`,
    '--sc-font': `${fontSize}px`,
    '--sc-ring': `${ring}px`,
    '--sc-gap': `${gap}px`,
    '--sc-row': `${Math.max(44, boxSize + 16)}px`,
    '--sc-rule': `${ruleHeight}px`,
    '--sc-origin': ORIGIN[strike] || ORIGIN.left,
    '--sc-ease-out': 'cubic-bezier(0.23, 1, 0.32, 1)'
  } as CSSProperties;

  return (
    <button
      ref={rowRef}
      type="button"
      role="checkbox"
      aria-checked={on}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`group relative inline-flex cursor-pointer touch-manipulation select-none items-center gap-[var(--sc-gap)] border-0 bg-transparent p-0 text-left font-medium leading-[1.2] tracking-[-0.01em] outline-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] [color:var(--sc-ink)] text-[length:var(--sc-font)] min-h-[var(--sc-row)] disabled:cursor-not-allowed disabled:opacity-50${className ? ` ${className}` : ''}`}
      style={cssVars}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerCancel}
      onClick={toggle}
    >
      <span className="flex-none h-[var(--sc-box)] w-[var(--sc-box)] rounded-[var(--sc-radius)] [transition:transform_160ms_var(--sc-ease-out)] group-data-[pressed]:[transform:scale(0.95)] group-focus-visible:outline-offset-[3px] group-focus-visible:[outline:2px_solid_color-mix(in_srgb,var(--sc-ink)_45%,transparent)] motion-reduce:transition-none">
        <span
          ref={boxRef}
          className="relative grid h-full w-full origin-center place-items-center overflow-hidden rounded-[inherit]"
          style={{ transform: r.box }}
        >
          <span
            className="absolute inset-0 rounded-[inherit] opacity-[0.28] [transition:opacity_120ms_ease] [box-shadow:inset_0_0_0_var(--sc-ring)_var(--sc-ink)] [@media(hover:hover)_and_(pointer:fine)]:group-enabled:group-hover:opacity-50"
            aria-hidden="true"
          />
          <span
            ref={fillRef}
            className="absolute inset-0 origin-center rounded-[inherit] [background:var(--sc-fill)]"
            style={{ transform: r.fill }}
          />
          <svg
            className="relative h-[68%] w-[68%] overflow-visible fill-none [stroke:var(--sc-check)] [stroke-width:2.6] [stroke-linecap:round] [stroke-linejoin:round]"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path ref={tickRef} d={TICK_PATH} pathLength={1} strokeDasharray={1} style={{ strokeDashoffset: r.tick }} />
          </svg>
        </span>
      </span>
      <span className="relative inline-block">
        <span ref={wordRef} className="inline-block" style={{ opacity: r.word }}>
          {label}
        </span>
        {strike !== 'none' ? (
          <span
            ref={ruleRef}
            className="pointer-events-none absolute inset-x-0 top-[46%] h-[var(--sc-rule)] rounded-[2px] bg-current [transform-origin:var(--sc-origin)]"
            aria-hidden="true"
            style={{ transform: r.rule }}
          />
        ) : null}
      </span>
    </button>
  );
};

export default SpringCheck;
