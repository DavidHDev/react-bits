import { useEffect, useId, useRef, useState } from 'react';
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform
} from 'motion/react';

const SPRING_UI = { type: 'spring', duration: 0.3, bounce: 0 };
const LEAN = 4;
const SIZES = {
  sm: { height: 28, font: 12, radius: 6, width: 104 },
  md: { height: 34, font: 13, radius: 8, width: 128 },
  lg: { height: 44, font: 16, radius: 10, width: 160 }
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const decimalsOf = n => {
  const s = String(n);
  const i = s.indexOf('.');
  return i < 0 ? 0 : s.length - i - 1;
};
const onColor = hex => {
  const raw = hex.replace('#', '');
  const full = raw.length === 3 ? [...raw].map(ch => ch + ch).join('') : raw.slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return '#ffffff';
  const yiq = (((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000;
  return yiq >= 128 ? '#111111' : '#ffffff';
};

export default function ScrubField({
  label = 'Radius',
  suffix = 'px',
  value: valueProp,
  defaultValue = 24,
  min = 0,
  max = 100,
  step = 1,
  size = 'md',
  sensitivity = 2,
  rubberReach = 8,
  returnDuration = 300,
  coarseMultiplier = 10,
  fineMultiplier = 0.1,
  showDelta = true,
  showDirty = false,
  showFill = true,
  accent = '#f5f5f5',
  chipColor = '#27272a',
  disabled = false,
  onChange,
  onCommit,
  className = ''
}) {
  const id = useId();
  const reduce = useReducedMotion();
  const controlled = valueProp !== undefined;
  const [value, setValue] = useState(controlled ? valueProp : defaultValue);
  const [dragging, setDragging] = useState(false);
  const [draft, setDraft] = useState(null);
  const display = useMotionValue(value);
  const chipRef = useRef(null);
  const inputRef = useRef(null);
  const ghostRef = useRef(null);
  const drag = useRef(null);
  const valueRef = useRef(value);
  const typingRef = useRef(false);
  const movedRef = useRef(false);
  const endRef = useRef(() => {});
  const escRef = useRef(null);
  const mounted = useRef(false);

  const baseDecimals = decimalsOf(step);
  const fineDecimals = Math.min(6, baseDecimals + decimalsOf(fineMultiplier));
  const preset = SIZES[size] || SIZES.md;

  const fmt = v => {
    const scaled = v * 10 ** baseDecimals;
    return v.toFixed(Math.abs(scaled - Math.round(scaled)) < 1e-6 ? baseDecimals : fineDecimals);
  };
  const signed = d => (d < 0 ? '−' : '+') + fmt(Math.abs(d));

  const reach = (rubberReach / 100) * Math.max(max - min, Number.EPSILON);
  const bend = raw => (reach ? Math.sign(raw) * reach * Math.log1p(Math.abs(raw) / reach) : 0);
  const unbend = over => (reach ? Math.sign(over) * reach * Math.expm1(Math.abs(over) / reach) : 0);
  const toShown = raw => {
    const c = clamp(raw, min, max);
    return c + bend(raw - c);
  };
  const toRaw = shown => {
    const c = clamp(shown, min, max);
    return c + unbend(shown - c);
  };
  const multiplierOf = e => (e.shiftKey ? coarseMultiplier : e.altKey ? fineMultiplier : 1);

  const commit = next => {
    const rounded = clamp(Number(next.toFixed(fineDecimals)), min, max);
    if (rounded === valueRef.current) return;
    valueRef.current = rounded;
    setValue(rounded);
    onChange?.(rounded);
  };

  useMotionValueEvent(display, 'change', d => {
    if (!typingRef.current && inputRef.current) inputRef.current.value = fmt(d);
    if (chipRef.current) chipRef.current.dataset.over = d < min || d > max ? 'true' : 'false';
  });
  const lean = useTransform(display, d =>
    reduce || !reach ? 0 : clamp((d - clamp(d, min, max)) / reach, -1, 1) * LEAN
  );
  const chipTransform = useMotionTemplate`translateX(${lean}px)`;
  const fill = useTransform(display, d => (clamp(d, min, max) - min) / Math.max(max - min, Number.EPSILON));
  const fillTransform = useMotionTemplate`scaleX(${fill})`;

  const adopt = next => {
    valueRef.current = next;
    setValue(next);
    display.jump(next);
    if (!typingRef.current && inputRef.current) inputRef.current.value = fmt(next);
  };

  useEffect(() => {
    if (controlled && !drag.current && valueProp !== valueRef.current) adopt(clamp(valueProp, min, max));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueProp]);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (!controlled && !drag.current) adopt(clamp(defaultValue, min, max));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue]);
  useEffect(() => {
    if (!typingRef.current && inputRef.current) inputRef.current.value = fmt(valueRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseDecimals, fineDecimals]);

  const handlePointerDown = e => {
    if (disabled || drag.current || e.button !== 0 || typingRef.current) return;
    if (e.pointerType !== 'touch') e.preventDefault();
    display.stop();
    movedRef.current = false;
    drag.current = {
      id: e.pointerId,
      x: e.clientX,
      raw: toRaw(display.get()),
      mult: multiplierOf(e),
      moved: false,
      before: valueRef.current,
      slack: e.pointerType === 'touch' ? 8 : 3,
      left: chipRef.current ? chipRef.current.getBoundingClientRect().left : 0
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    escRef.current = ev => {
      if (ev.key === 'Escape') endRef.current(true);
    };
    window.addEventListener('keydown', escRef.current);
  };

  const handlePointerMove = e => {
    const g = drag.current;
    if (!g || e.pointerId !== g.id) return;
    if (!g.moved) {
      if (Math.abs(e.clientX - g.x) < g.slack) return;
      g.moved = true;
      movedRef.current = true;
      g.x = e.clientX;
      setDragging(true);
      document.documentElement.style.cursor = 'ew-resize';
    }
    const m = multiplierOf(e);
    if (m !== g.mult) {
      g.mult = m;
      g.raw = toRaw(display.get());
      g.x = e.clientX;
    }
    const raw = g.raw + Math.round((e.clientX - g.x) / sensitivity) * step * m;
    const shown = toShown(raw);
    display.set(shown);
    commit(clamp(raw, min, max));
    if (ghostRef.current) {
      ghostRef.current.style.translate = `calc(${e.clientX - g.left}px - 50%) -100%`;
      ghostRef.current.textContent = signed(shown - g.before);
    }
  };

  const end = (cancel = false) => {
    const g = drag.current;
    if (!g) return;
    drag.current = null;
    setDragging(false);
    document.documentElement.style.cursor = '';
    if (escRef.current) {
      window.removeEventListener('keydown', escRef.current);
      escRef.current = null;
    }
    if (cancel) {
      commit(g.before);
      display.jump(g.before);
      return;
    }
    if (!g.moved) {
      inputRef.current?.focus();
      return;
    }
    const bound = clamp(display.get(), min, max);
    if (display.get() !== bound) {
      if (reduce) display.jump(bound);
      else animate(display, bound, { ...SPRING_UI, duration: returnDuration / 1000 });
    }
    if (g.moved && valueRef.current !== g.before) onCommit?.(valueRef.current);
  };
  endRef.current = end;

  const leaveTyping = () => {
    typingRef.current = false;
    setDraft(null);
    if (inputRef.current) inputRef.current.value = fmt(valueRef.current);
  };

  const handleKeyDown = e => {
    const typedNumber = draft !== null && draft.trim() !== '' ? Number(draft) : NaN;
    const from = Number.isNaN(typedNumber) ? valueRef.current : typedNumber;
    const deltas = {
      ArrowUp: step * multiplierOf(e),
      ArrowDown: -step * multiplierOf(e),
      PageUp: step * coarseMultiplier,
      PageDown: -step * coarseMultiplier
    };
    const delta = deltas[e.key];
    if (delta !== undefined || e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      leaveTyping();
      commit(delta !== undefined ? from + delta : e.key === 'Home' ? min : max);
      display.jump(valueRef.current);
      if (inputRef.current) inputRef.current.value = fmt(valueRef.current);
      onCommit?.(valueRef.current);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      leaveTyping();
      e.currentTarget.blur();
    }
  };

  const handleFocus = e => {
    typingRef.current = true;
    setDraft(e.target.value);
    e.target.select();
  };

  const handleBlur = () => {
    const n = draft === null ? NaN : parseFloat(draft.replace(/[^\d.-]/g, ''));
    if (!Number.isNaN(n)) {
      commit(n);
      onCommit?.(valueRef.current);
    }
    leaveTyping();
    display.jump(valueRef.current);
  };

  useEffect(
    () => () => {
      document.documentElement.style.cursor = '';
      if (escRef.current) window.removeEventListener('keydown', escRef.current);
    },
    []
  );

  const dirty = showDirty && value !== defaultValue;

  return (
    <motion.div
      ref={chipRef}
      className={`group relative inline-flex h-[var(--sf-h)] w-[var(--sf-w)] items-center gap-1 rounded-[var(--sf-r)] pl-1 pr-2 leading-none select-none isolate [font-family:inherit] [font-size:var(--sf-fs)] [background:var(--sf-chip)] [box-shadow:0_0_0_1px_transparent] cursor-ew-resize touch-pan-y data-[typing=true]:cursor-text data-[disabled=true]:cursor-default [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] [transition:background-color_200ms_ease,box-shadow_200ms_ease] data-[dirty=true]:[box-shadow:0_0_0_1px_color-mix(in_srgb,var(--sf-accent)_55%,transparent)] data-[dirty=true]:[transition-duration:0ms] data-[typing=true]:[background:color-mix(in_srgb,currentColor_7%,var(--sf-chip))] data-[disabled=true]:opacity-50${className ? ` ${className}` : ''}`}
      data-dirty={dirty ? 'true' : 'false'}
      data-dragging={dragging ? 'true' : 'false'}
      data-typing={draft !== null ? 'true' : 'false'}
      data-disabled={disabled ? 'true' : 'false'}
      aria-disabled={disabled || undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={() => end()}
      onPointerCancel={() => end(true)}
      onLostPointerCapture={() => end()}
      style={{
        '--sf-accent': accent,
        '--sf-chip': chipColor,
        '--sf-ghost-ink': onColor(accent),
        '--sf-h': `${preset.height}px`,
        '--sf-fs': `${preset.font}px`,
        '--sf-r': `${preset.radius}px`,
        '--sf-w': `${preset.width}px`,
        '--sf-ease-out': 'cubic-bezier(0.23, 1, 0.32, 1)',
        transform: chipTransform
      }}
    >
      {showFill ? (
        <span
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]"
          aria-hidden="true"
        >
          <motion.span
            className="absolute inset-0 origin-left [background:color-mix(in_srgb,var(--sf-accent)_16%,transparent)]"
            style={{ transform: fillTransform }}
          />
        </span>
      ) : null}
      <label
        htmlFor={id}
        className="inline-flex h-full cursor-[inherit] items-center whitespace-nowrap rounded-[calc(var(--sf-r)-2px)] px-1.5 font-medium [color:color-mix(in_srgb,currentColor_55%,transparent)] [transition:color_120ms_ease,transform_160ms_var(--sf-ease-out)] [@media(hover:hover)_and_(pointer:fine)]:group-data-[disabled=false]:group-hover:[color:color-mix(in_srgb,currentColor_85%,transparent)] group-data-[disabled=false]:group-data-[typing=false]:group-active:[transform:scale(0.96)] group-data-[disabled=false]:group-data-[typing=false]:group-active:[color:currentColor] group-data-[dragging=true]:[transform:scale(0.96)] group-data-[dragging=true]:[color:currentColor] motion-reduce:[transition:color_120ms_ease] motion-reduce:group-data-[dragging=true]:[transform:none] motion-reduce:group-data-[disabled=false]:group-data-[typing=false]:group-active:[transform:none]"
        onClick={e => {
          if (movedRef.current) e.preventDefault();
        }}
      >
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        className="m-0 w-full min-w-0 flex-1 cursor-[inherit] border-0 bg-transparent p-0 text-right font-medium tabular-nums outline-0 [color:inherit] [font-family:inherit] [font-size:inherit] [transition:color_120ms_ease] group-data-[typing=true]:cursor-text group-data-[over=true]:[color:color-mix(in_srgb,currentColor_55%,transparent)]"
        type="text"
        inputMode="decimal"
        role="spinbutton"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={`${fmt(value)}${suffix ? ` ${suffix}` : ''}`}
        defaultValue={fmt(value)}
        disabled={disabled}
        onFocus={handleFocus}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      />
      {suffix ? (
        <span className="font-medium [color:color-mix(in_srgb,currentColor_45%,transparent)]" aria-hidden="true">
          {suffix}
        </span>
      ) : null}
      {showDelta ? (
        <span
          ref={ghostRef}
          className="pointer-events-none absolute -top-1.5 left-0 origin-bottom whitespace-nowrap rounded-full px-1.5 py-0.5 text-[11px] leading-[1.4] font-semibold tabular-nums opacity-0 [color:var(--sf-ghost-ink)] [translate:0_-100%] [scale:0.95] [background:var(--sf-accent)] [transition:opacity_125ms_var(--sf-ease-out),scale_125ms_var(--sf-ease-out)] group-data-[dragging=true]:opacity-100 group-data-[dragging=true]:[scale:1] motion-reduce:[scale:1] motion-reduce:[transition:opacity_200ms_ease]"
          aria-hidden="true"
        />
      ) : null}
    </motion.div>
  );
}
