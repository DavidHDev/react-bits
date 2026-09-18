import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CommandLineIcon,
  File02Icon,
  PencilEdit01Icon,
  RefreshIcon,
  Search01Icon,
  Tick02Icon
} from '@hugeicons/core-free-icons';

const HOLD_AT = 0.9;
const SHAKE = [0, -1, 1, -0.66, 0.66, -0.33, 0];
const ICONS = { terminal: CommandLineIcon, file: File02Icon, search: Search01Icon, edit: PencilEdit01Icon };
const WORDS = { running: 'running', done: 'done', error: 'failed', idle: 'queued' };

const fmt = ms => (ms < 10000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`);
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const glyphOf = s => (s === 'done' ? 'check' : s === 'error' ? 'retry' : 'tool');

export default function CallChip({
  icon = 'terminal',
  name = 'bash',
  argument = 'npm test',
  status = 'running',
  expectedMs = 2500,
  size = 34,
  radius = 10,
  color = 'currentColor',
  surfaceColor = '#27272a',
  progressColor = 'currentColor',
  progressOpacity = 0.08,
  doneColor = '#22c55e',
  errorColor = '#ef4444',
  washOpacity = 0.14,
  shake = 6,
  showTimer = true,
  onRetry,
  className = '',
  style
}) {
  const rootRef = useRef(null);
  const fillRef = useRef(null);
  const timerRef = useRef(null);
  const mountedRef = useRef(false);
  const fraction = useRef(0);
  const clock = useRef({ ms: 0 });
  const shakeAnim = useRef(null);
  const statusRef = useRef(status);
  statusRef.current = status;
  const [mounted, setMounted] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [announce, setAnnounce] = useState('');
  const roll = useRef({ cur: glyphOf(status), prev: null });
  if (glyphOf(status) !== roll.current.cur) roll.current = { cur: glyphOf(status), prev: roll.current.cur };

  const setFraction = (f, instant) => {
    const fill = fillRef.current;
    if (!fill) return;
    fraction.current = f;
    if (instant) fill.style.transition = 'none';
    fill.style.transform = `scaleX(${f})`;
    if (instant) {
      void fill.getBoundingClientRect();
      fill.style.transition = '';
    }
  };
  const apply = (s, animate) => {
    if (s === 'running') {
      shakeAnim.current?.cancel();
      setFraction(0, true);
      if (animate) setFraction(HOLD_AT, false);
    } else if (s === 'done') {
      setFraction(1, !animate);
    } else if (s === 'error') {
      const fill = fillRef.current;
      const live = fill ? new DOMMatrix(getComputedStyle(fill).transform).a : fraction.current;
      setFraction(Math.min(1, Math.max(0, live)), true);
      if (animate && shake > 0 && !reduceMotion() && rootRef.current) {
        shakeAnim.current = rootRef.current.animate(
          SHAKE.map(k => ({ transform: `translateX(${k * shake}px)`, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' })),
          { duration: 450, composite: 'add' }
        );
      }
    } else setFraction(0, true);
  };

  useEffect(() => {
    mountedRef.current = true;
    setMounted(true);
    apply(statusRef.current, statusRef.current === 'running');
    return () => {
      mountedRef.current = false;
      shakeAnim.current?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useLayoutEffect(() => {
    if (mountedRef.current) apply(status, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    const write = ms => {
      clock.current.ms = ms;
      if (timerRef.current) timerRef.current.textContent = fmt(ms);
    };
    if (status !== 'running') {
      if ((status === 'idle' || !clock.current.ms) && timerRef.current) timerRef.current.textContent = '—';
      return undefined;
    }
    const startedAt = performance.now();
    write(0);
    if (reduceMotion()) {
      const id = setInterval(() => write(performance.now() - startedAt), 100);
      return () => {
        clearInterval(id);
        write(performance.now() - startedAt);
      };
    }
    let raf = 0;
    const tick = () => {
      write(performance.now() - startedAt);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      write(performance.now() - startedAt);
    };
  }, [status]);
  useEffect(() => {
    const ms = showTimer && clock.current.ms ? Math.round(clock.current.ms) : 0;
    const when = status === 'done' && ms ? ` in ${ms} ms` : status === 'error' && ms ? ` after ${ms} ms` : '';
    setAnnounce(`${name} ${argument}, ${WORDS[status] ?? status}${when}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const font = Math.max(11, Math.round(size * 0.38));
  const glyphState = g => (g === roll.current.cur ? 'in' : g === roll.current.prev ? 'out' : undefined);
  const toolIcon = typeof icon === 'string' ? (ICONS[icon] ?? ICONS.terminal) : null;
  const iconSize = font + 2;

  return (
    <span
      ref={rootRef}
      role="status"
      aria-busy={status === 'running' || undefined}
      data-status={status}
      data-mounted={mounted ? '' : undefined}
      data-pressed={pressed ? '' : undefined}
      className={`group relative box-border inline-flex items-center overflow-hidden leading-none whitespace-nowrap select-none [-webkit-touch-callout:none] [height:var(--cc-size)] [padding:0_var(--cc-pad)] [gap:var(--cc-gap)] [border-radius:var(--cc-radius)] [background:var(--cc-surface)] [color:var(--cc-color)] [font-size:var(--cc-font)] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1)] data-[status=error]:cursor-pointer data-[pressed]:scale-[0.97] motion-reduce:data-[pressed]:scale-100${className ? ` ${className}` : ''}`}
      style={{
        '--cc-size': `${size}px`,
        '--cc-font': `${font}px`,
        '--cc-pad': `${Math.round(size * 0.35)}px`,
        '--cc-gap': `${Math.round(font * 0.55)}px`,
        '--cc-radius': `${radius}px`,
        '--cc-color': color,
        '--cc-surface': surfaceColor,
        '--cc-progress': progressColor,
        '--cc-progress-pct': `${progressOpacity * 100}%`,
        '--cc-done': doneColor,
        '--cc-error': errorColor,
        '--cc-wash-pct': `${washOpacity * 100}%`,
        '--cc-expected': `${expectedMs}ms`,
        ...style
      }}
    >
      <span
        ref={fillRef}
        className="pointer-events-none absolute inset-0 origin-left scale-x-0 [clip-path:inset(0_0_0_0)] [background:color-mix(in_srgb,var(--cc-progress)_var(--cc-progress-pct),transparent)] group-data-[status=running]:[transition:transform_var(--cc-expected)_linear] group-data-[status=done]:[clip-path:inset(100%_0_0_0)] group-data-[status=done]:[background:color-mix(in_srgb,var(--cc-done)_var(--cc-wash-pct),transparent)] group-data-[status=done]:[transition:transform_200ms_cubic-bezier(0.23,1,0.32,1),background-color_120ms_ease,clip-path_400ms_cubic-bezier(0.23,1,0.32,1)_200ms] group-data-[status=error]:[background:color-mix(in_srgb,var(--cc-error)_var(--cc-wash-pct),transparent)] group-data-[status=error]:[transition:background-color_200ms_ease] motion-reduce:group-data-[status=done]:[clip-path:inset(0_0_0_0)] motion-reduce:group-data-[status=done]:[transition:background-color_120ms_ease] group-not-data-[mounted]:transition-none!"
        aria-hidden="true"
      />
      <span
        className="relative flex-none overflow-hidden [width:calc(var(--cc-font)+2px)] [height:calc(var(--cc-font)+2px)]"
        aria-hidden="true"
      >
        <span
          className="absolute inset-0 grid place-items-center opacity-0 blur-[3px] [transform:translateY(70%)] data-[state=in]:opacity-100 data-[state=in]:blur-0 data-[state=in]:[transform:none] data-[state=in]:[transition:opacity_240ms_cubic-bezier(0.23,1,0.32,1),transform_240ms_cubic-bezier(0.23,1,0.32,1),filter_240ms_cubic-bezier(0.23,1,0.32,1)] data-[state=out]:[transform:translateY(-70%)] data-[state=out]:[transition:opacity_160ms_cubic-bezier(0.23,1,0.32,1),transform_160ms_cubic-bezier(0.23,1,0.32,1),filter_160ms_cubic-bezier(0.23,1,0.32,1)] group-data-[status=done]:data-[state=in]:[color:var(--cc-done)] group-data-[status=error]:data-[state=in]:[color:var(--cc-error)] motion-reduce:[transform:none]! motion-reduce:[filter:none]! group-not-data-[mounted]:transition-none!"
          data-state={glyphState('tool')}
        >
          {toolIcon ? <HugeiconsIcon icon={toolIcon} size={iconSize} strokeWidth={1.8} /> : icon}
        </span>
        <span
          className="absolute inset-0 grid place-items-center opacity-0 blur-[3px] [transform:translateY(70%)] data-[state=in]:opacity-100 data-[state=in]:blur-0 data-[state=in]:[transform:none] data-[state=in]:[transition:opacity_240ms_cubic-bezier(0.23,1,0.32,1),transform_240ms_cubic-bezier(0.23,1,0.32,1),filter_240ms_cubic-bezier(0.23,1,0.32,1)] data-[state=out]:[transform:translateY(-70%)] data-[state=out]:[transition:opacity_160ms_cubic-bezier(0.23,1,0.32,1),transform_160ms_cubic-bezier(0.23,1,0.32,1),filter_160ms_cubic-bezier(0.23,1,0.32,1)] group-data-[status=done]:data-[state=in]:[color:var(--cc-done)] group-data-[status=error]:data-[state=in]:[color:var(--cc-error)] motion-reduce:[transform:none]! motion-reduce:[filter:none]! group-not-data-[mounted]:transition-none!"
          data-state={glyphState('check')}
        >
          <HugeiconsIcon icon={Tick02Icon} size={iconSize} strokeWidth={2.2} />
        </span>
        <span
          className="absolute inset-0 grid place-items-center opacity-0 blur-[3px] [transform:translateY(70%)] data-[state=in]:opacity-100 data-[state=in]:blur-0 data-[state=in]:[transform:none] data-[state=in]:[transition:opacity_240ms_cubic-bezier(0.23,1,0.32,1),transform_240ms_cubic-bezier(0.23,1,0.32,1),filter_240ms_cubic-bezier(0.23,1,0.32,1)] data-[state=out]:[transform:translateY(-70%)] data-[state=out]:[transition:opacity_160ms_cubic-bezier(0.23,1,0.32,1),transform_160ms_cubic-bezier(0.23,1,0.32,1),filter_160ms_cubic-bezier(0.23,1,0.32,1)] group-data-[status=done]:data-[state=in]:[color:var(--cc-done)] group-data-[status=error]:data-[state=in]:[color:var(--cc-error)] motion-reduce:[transform:none]! motion-reduce:[filter:none]! group-not-data-[mounted]:transition-none!"
          data-state={glyphState('retry')}
        >
          <HugeiconsIcon icon={RefreshIcon} size={iconSize} strokeWidth={2} />
        </span>
      </span>
      <span className="relative font-medium" aria-hidden="true">
        {name}
      </span>
      <span className="relative opacity-[0.72]" aria-hidden="true">
        {argument}
      </span>
      {showTimer ? (
        <span ref={timerRef} className="relative min-w-[6ch] text-right tabular-nums opacity-50" aria-hidden="true">
          0 ms
        </span>
      ) : null}
      {status === 'error' && onRetry ? (
        <button
          type="button"
          className="absolute -inset-[5px] m-0 cursor-pointer touch-manipulation appearance-none border-0 bg-transparent p-0 outline-none [border-radius:var(--cc-radius)] [-webkit-tap-highlight-color:transparent]"
          aria-label={`Retry ${name} ${argument}`}
          onClick={() => onRetry()}
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          onPointerCancel={() => setPressed(false)}
        />
      ) : null}
      <span className="sr-only">{announce}</span>
    </span>
  );
}
