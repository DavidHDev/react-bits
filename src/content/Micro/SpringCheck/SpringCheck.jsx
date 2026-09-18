import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animate, useMotionValue, useMotionValueEvent, useReducedMotion } from 'motion/react';
import { Tick02Icon } from '@hugeicons/core-free-icons';

import './SpringCheck.css';

const VISUAL_DURATION = 0.2;
const RULE_END = 0.84;
const SWELL = 0.35;
const TICK_PATH = String(Tick02Icon[0][1].d);
const ORIGIN = { left: 'left center', center: 'center', right: 'right center', none: 'left center' };

const clamp01 = value => Math.min(1, Math.max(0, value));
const zetaOf = bounce => (bounce <= 0 ? 1 : -Math.log(bounce) / Math.sqrt(Math.PI ** 2 + Math.log(bounce) ** 2));

const readings = (t, doneOpacity, strikeLag) => {
  const held = clamp01(t);
  return {
    fill: `scale(${Math.max(t, 0)})`,
    box: `scale(${1 + SWELL * Math.max(0, t - 1)})`,
    tick: 1 - held,
    word: 1 - (1 - doneOpacity) * held,
    rule: `scaleX(${clamp01((held - strikeLag) / (RULE_END - strikeLag))})`
  };
};

export default function SpringCheck({
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
}) {
  const controlled = checked !== undefined;
  const [inner, setInner] = useState(defaultChecked);
  const on = controlled ? checked : inner;
  const reduce = useReducedMotion();

  const t = useMotionValue(on ? 1 : 0);
  const viaPointer = useRef(false);
  const instant = useRef(false);
  const rowRef = useRef(null);
  const boxRef = useRef(null);
  const fillRef = useRef(null);
  const tickRef = useRef(null);
  const wordRef = useRef(null);
  const ruleRef = useRef(null);
  const cfg = useRef({ doneOpacity, strikeLag });
  cfg.current = { doneOpacity, strikeLag };

  const write = value => {
    const r = readings(value, cfg.current.doneOpacity, cfg.current.strikeLag);
    if (fillRef.current) fillRef.current.style.transform = r.fill;
    if (boxRef.current) boxRef.current.style.transform = r.box;
    if (tickRef.current) tickRef.current.style.strokeDashoffset = r.tick;
    if (wordRef.current) wordRef.current.style.opacity = r.word;
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

  const handlePointerDown = e => {
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

  return (
    <button
      ref={rowRef}
      type="button"
      role="checkbox"
      aria-checked={on}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`spring-check${className ? ` ${className}` : ''}`}
      style={{
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
        '--sc-origin': ORIGIN[strike] || ORIGIN.left
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerCancel}
      onClick={toggle}
    >
      <span className="spring-check__press">
        <span ref={boxRef} className="spring-check__box" style={{ transform: r.box }}>
          <span className="spring-check__ring" aria-hidden="true" />
          <span ref={fillRef} className="spring-check__fill" style={{ transform: r.fill }} />
          <svg className="spring-check__tick" viewBox="0 0 24 24" aria-hidden="true">
            <path ref={tickRef} d={TICK_PATH} pathLength={1} strokeDasharray={1} style={{ strokeDashoffset: r.tick }} />
          </svg>
        </span>
      </span>
      <span className="spring-check__label">
        <span ref={wordRef} className="spring-check__word" style={{ opacity: r.word }}>
          {label}
        </span>
        {strike !== 'none' ? (
          <span ref={ruleRef} className="spring-check__rule" aria-hidden="true" style={{ transform: r.rule }} />
        ) : null}
      </span>
    </button>
  );
}
