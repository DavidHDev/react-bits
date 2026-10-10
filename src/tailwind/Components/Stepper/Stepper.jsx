'use client';

import { Children, isValidElement, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ArrowRight01Icon, Tick02Icon } from '@hugeicons/core-free-icons';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const THEMES = {
  dark: {
    '--stepper-frame': 'rgba(38, 35, 46, 0.66)',
    '--stepper-frame-edge': 'rgba(255, 255, 255, 0.08)',
    '--stepper-frame-highlight': 'rgba(255, 255, 255, 0.07)',
    '--stepper-frame-shadow': '0 22px 44px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)',
    '--stepper-tile': 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
    '--stepper-tile-edge': 'rgba(255, 255, 255, 0.07)',
    '--stepper-tile-highlight': 'rgba(255, 255, 255, 0.12)',
    '--stepper-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    '--stepper-well': 'rgba(255, 255, 255, 0.07)',
    '--stepper-track': 'rgba(255, 255, 255, 0.1)',
    '--stepper-ink': '#f4f4f5',
    '--stepper-muted': 'rgba(244, 244, 245, 0.55)',
    '--stepper-faint': 'rgba(255, 255, 255, 0.22)',
    '--stepper-ring': 'rgba(244, 244, 245, 0.3)',
    '--stepper-solid': '#f4f4f5',
    '--stepper-solid-ink': '#18181b',
    '--stepper-hover': 'brightness(1.12)',
    '--stepper-hover-fill': 'rgba(255, 255, 255, 0.04)',
    '--stepper-solid-hover': 'brightness(0.9)',
    '--stepper-press': 'brightness(0.85)'
  },
  light: {
    '--stepper-frame': 'rgba(240, 240, 243, 0.8)',
    '--stepper-frame-edge': 'rgba(24, 24, 27, 0.07)',
    '--stepper-frame-highlight': 'rgba(255, 255, 255, 0.95)',
    '--stepper-frame-shadow': '0 22px 44px -22px rgba(24, 24, 27, 0.3), 0 6px 16px -10px rgba(24, 24, 27, 0.16)',
    '--stepper-tile': 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
    '--stepper-tile-edge': 'rgba(24, 24, 27, 0.08)',
    '--stepper-tile-highlight': 'rgba(255, 255, 255, 1)',
    '--stepper-tile-shadow': '0 4px 10px -5px rgba(24, 24, 27, 0.25)',
    '--stepper-well': 'rgba(24, 24, 27, 0.05)',
    '--stepper-track': 'rgba(24, 24, 27, 0.08)',
    '--stepper-ink': '#27272a',
    '--stepper-muted': 'rgba(39, 39, 42, 0.55)',
    '--stepper-faint': 'rgba(24, 24, 27, 0.16)',
    '--stepper-ring': 'rgba(24, 24, 27, 0.28)',
    '--stepper-solid': '#27272a',
    '--stepper-solid-ink': '#ffffff',
    '--stepper-hover': 'brightness(0.97)',
    '--stepper-hover-fill': 'rgba(24, 24, 27, 0.035)',
    '--stepper-solid-hover': 'brightness(1.3)',
    '--stepper-press': 'brightness(0.92)'
  }
};

const SPRING =
  'linear(0, 0.0603, 0.2033, 0.3821, 0.5633, 0.7258, 0.8584, 0.9574, 1.0242, 1.0634, 1.0809, 1.0828, 1.0747, 1.0613, 1.046, 1.0313, 1.0186, 1.0085, 1.0012, 0.9965, 0.994, 0.9931, 0.9933, 0.9941, 0.9953, 0.9966, 0.9978, 0.9988, 1)';
const SETTLE = 'cubic-bezier(0.22, 1, 0.36, 1)';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const size = value => (typeof value === 'number' ? `${value}px` : value);

const readableOn = color => {
  let hex = String(color || '')
    .trim()
    .replace('#', '');
  if (hex.length === 3) hex = hex.replace(/./g, c => c + c);
  if (!/^[0-9a-f]{6}$/i.test(hex)) return '#ffffff';
  const [r, g, b] = [0, 2, 4].map(index => {
    const c = parseInt(hex.slice(index, index + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#18181b' : '#ffffff';
};

const ease = () =>
  typeof CSS !== 'undefined' && CSS.supports?.('transition-timing-function', 'linear(0, 1)')
    ? SPRING
    : 'cubic-bezier(0.34, 1.4, 0.64, 1)';

const INK = 'text-[color:var(--stepper-ink)]';
const MUTED = 'text-[color:var(--stepper-muted)]';
const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--stepper-ink)]';
const ROOT_CLASS =
  'relative box-border flex w-[min(100%,var(--stepper-width))] max-w-full min-w-0 rounded-[var(--stepper-radius)] text-[color:var(--stepper-ink)] [-webkit-tap-highlight-color:transparent] [--stepper-tile-radius:max(4px,calc(var(--stepper-well-radius)-4px))] [--stepper-well-radius:max(6px,calc(var(--stepper-radius)-8px))]';
const FRAMED_CLASS =
  '[--stepper-bleed:20px] [--stepper-inset:12px] [--stepper-pad:8px] p-[var(--stepper-pad)] [background:var(--stepper-frame)] [box-shadow:var(--stepper-frame-shadow)] backdrop-blur-[20px] backdrop-saturate-[1.6]';
const BARE_CLASS = '[--stepper-bleed:8px] [--stepper-inset:0px] [--stepper-pad:0px]';
const RIM_CLASS =
  'pointer-events-none absolute inset-0 z-[2] rounded-[inherit] [box-shadow:inset_0_0_0_1px_var(--stepper-frame-edge),inset_0_1px_0_var(--stepper-frame-highlight)]';
const TRACK_CLASS = 'relative flex gap-1 rounded-[var(--stepper-well-radius)] p-1 [background:var(--stepper-well)]';
const GLIDER_CLASS =
  'pointer-events-none absolute top-0 left-0 rounded-[var(--stepper-tile-radius)] opacity-0 [background:var(--stepper-tile)] [box-shadow:inset_0_0_0_1px_var(--stepper-tile-edge),inset_0_1px_0_var(--stepper-tile-highlight),var(--stepper-tile-shadow)]';
const SEGMENT_CLASS = `relative box-border flex min-w-0 cursor-pointer rounded-[var(--stepper-tile-radius)] border-none bg-transparent font-[inherit] ${MUTED} [transition:background-color_0.2s_ease] disabled:cursor-default [@media(hover:hover)]:[&:not(:disabled):hover]:[background:var(--stepper-hover-fill)] ${FOCUS}`;
const SEGMENT_ROW = 'h-10 flex-[1_1_auto] items-center justify-center gap-2 px-2.5';
const SEGMENT_RAIL = 'h-auto flex-none items-start justify-start gap-2.5 p-2.5';
const BADGE_CLASS = `grid h-[22px] w-[22px] flex-none place-items-center rounded-full text-[11.5px] leading-none font-semibold tabular-nums ${MUTED} [box-shadow:inset_0_0_0_1px_var(--stepper-faint)] [transition:background-color_0.15s_ease,box-shadow_0.15s_ease,color_0.15s_ease] data-[status=active]:text-[color:var(--stepper-ink)] data-[status=active]:[box-shadow:inset_0_0_0_1.5px_var(--stepper-ink)] data-[status=complete]:text-[color:var(--stepper-solid-ink)] data-[status=complete]:[background:var(--stepper-solid)] data-[status=complete]:[box-shadow:none]`;
const TITLE_CLASS =
  'overflow-hidden text-[13px] leading-[1.2] font-semibold text-ellipsis whitespace-nowrap transition-colors duration-200';
const DESCRIPTION_CLASS = `overflow-hidden text-[12px] leading-[1.35] text-ellipsis whitespace-nowrap ${MUTED}`;
const DOT_CLASS = `group/dot grid h-[22px] w-[22px] cursor-pointer place-items-center rounded-full border-none bg-transparent p-0 disabled:cursor-default ${FOCUS}`;
const DOT_MARK_CLASS =
  'h-2 w-2 rounded-full [background:var(--stepper-faint)] [transition:background-color_0.25s_ease,transform_0.45s_var(--stepper-spring)] data-[status=active]:[background:var(--stepper-solid)] data-[status=active]:[transform:scale(1.3)] data-[status=complete]:[background:var(--stepper-muted)] motion-reduce:[transition-duration:0.01ms] [@media(hover:hover)]:group-[:not(:disabled):hover]/dot:[transform:scale(1.3)]';
const BAR_CLASS = `group/bar flex h-[18px] flex-1 cursor-pointer items-center border-none bg-transparent p-0 disabled:cursor-default ${FOCUS}`;
const BAR_TRACK_CLASS =
  'relative h-1 w-full overflow-hidden rounded-[4px] [background:var(--stepper-track)] [@media(hover:hover)]:group-[:not(:disabled):hover]/bar:[background:var(--stepper-faint)]';
const BAR_FILL_CLASS =
  'absolute inset-0 origin-left [background:var(--stepper-solid)] [transform:scaleX(0)] [transition:transform_560ms_var(--stepper-spring)] data-[filled]:[transform:none] motion-reduce:[transition-duration:0.01ms]';
const VIEWPORT_CLASS = 'relative -my-1.5 mx-[calc(var(--stepper-bleed)*-1)] overflow-hidden';
const PANE_CLASS = 'box-border px-[var(--stepper-bleed)] py-1.5 outline-none';
const LEAVING_CLASS = 'pointer-events-none absolute top-0 right-0 left-0';
const FOOTER_WRAP_CLASS =
  'group/footer grid grid-rows-[1fr] [transition:grid-template-rows_480ms_var(--stepper-spring),opacity_0.2s_ease] data-[hidden]:pointer-events-none data-[hidden]:grid-rows-[0fr] data-[hidden]:opacity-0 motion-reduce:[transition-duration:0.01ms]';
const FOOTER_CLIP_CLASS = 'min-h-0 group-data-[hidden]/footer:overflow-hidden';
const FOOTER_CLASS = 'flex items-center justify-between gap-3 pt-5';
const BUTTON_CLASS = `inline-flex h-[38px] flex-none cursor-pointer items-center gap-1.5 rounded-[max(8px,calc(var(--stepper-radius)*0.5))] border-none px-3.5 font-[inherit] text-[13.5px] leading-none font-semibold [transition:filter_0.2s_ease,transform_0.2s_ease,opacity_0.2s_ease] disabled:cursor-not-allowed disabled:opacity-40 active:enabled:[filter:var(--stepper-press)] active:enabled:[transform:scale(0.96)] active:enabled:duration-0 ${FOCUS}`;
const BACK_CLASS = `pl-2.5 ${INK} [background:var(--stepper-tile)] [box-shadow:inset_0_0_0_1px_var(--stepper-tile-edge),inset_0_1px_0_var(--stepper-tile-highlight),var(--stepper-tile-shadow)] hover:enabled:[filter:var(--stepper-hover)] data-[hidden]:invisible data-[hidden]:opacity-0 data-[hidden]:[transition:opacity_0.2s_ease,visibility_0s_0.2s]`;
const NEXT_CLASS =
  'ml-auto pr-[11px] text-[color:var(--stepper-solid-ink)] [background:var(--stepper-solid)] [box-shadow:0_4px_12px_-6px_rgba(0,0,0,0.5)] hover:enabled:[filter:var(--stepper-solid-hover)]';

function Check() {
  const ref = useRef(null);

  useIsomorphicLayoutEffect(() => {
    const path = ref.current?.querySelector('path');
    if (!path || typeof path.animate !== 'function') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    path.style.strokeDasharray = '24';
    path.animate([{ strokeDashoffset: 24 }, { strokeDashoffset: 0 }], {
      duration: 360,
      easing: SETTLE
    });
  }, []);

  return (
    <span ref={ref} className="grid place-items-center">
      <HugeiconsIcon icon={Tick02Icon} size={16} strokeWidth={2.4} />
    </span>
  );
}

export function Step({ children }) {
  return <div className="min-w-0">{children}</div>;
}

export default function Stepper({
  children,
  step,
  initialStep = 1,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  indicator = 'numbers',
  orientation = 'horizontal',
  transition = 'slide',
  linear = false,
  disableStepIndicators = false,
  renderStepIndicator,
  showFooter = true,
  backButtonText = 'Back',
  nextButtonText = 'Continue',
  completeButtonText = 'Complete',
  backButtonProps = {},
  nextButtonProps = {},
  completedContent,
  theme = 'dark',
  accentColor,
  frame = true,
  radius = 24,
  width = 440,
  className = '',
  stepCircleContainerClassName = '',
  stepContainerClassName = '',
  contentClassName = '',
  footerClassName = '',
  style,
  ...rest
}) {
  const steps = Children.toArray(children).filter(isValidElement);
  const total = steps.length;
  const controlled = typeof step === 'number';
  const [internal, setInternal] = useState(initialStep);
  const current = clamp(Math.round(controlled ? step : internal), 1, total + 1);
  const completed = current > total;
  const vertical = orientation === 'vertical';
  const kind = vertical ? 'numbers' : indicator;
  const labelled = steps.some(entry => entry.props.title);

  const [compact, setCompact] = useState(false);
  const [tight, setTight] = useState(false);
  const rail = vertical && !compact;
  const [reached, setReached] = useState(current);
  if (current > reached) setReached(current);

  const [view, setView] = useState({ step: current, previous: null, direction: 1, id: 0 });
  if (view.step !== current) {
    setView({ step: current, previous: view.step, direction: current > view.step ? 1 : -1, id: view.id + 1 });
  }

  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const gliderRef = useRef(null);
  const markerRefs = useRef([]);
  const titleRefs = useRef([]);
  const viewportRef = useRef(null);
  const paneRef = useRef(null);
  const leavingRef = useRef(null);
  const heightRef = useRef(0);
  const labelWidths = useRef([]);
  const tightRef = useRef(false);
  tightRef.current = tight;
  const placedRef = useRef(false);

  const go = target => {
    const next = clamp(target, 1, total + 1);
    if (next === current) return;
    if (!controlled) setInternal(next);
    if (next > total) onFinalStepCompleted();
    else onStepChange(next);
  };

  const reachable = number =>
    !disableStepIndicators && number !== current && (!linear || number <= Math.min(reached, total));

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => {
      const folded = vertical && root.clientWidth < 520;
      setCompact(folded);
      const track = trackRef.current;
      if (!track || !labelled || (vertical && !folded)) {
        setTight(false);
        return;
      }
      const segments = markerRefs.current.slice(0, total);
      if (!tightRef.current) {
        segments.forEach((segment, index) => {
          const title = titleRefs.current[index];
          labelWidths.current[index] = title && segment?.contains(title) ? title.scrollWidth + 8 : 0;
        });
      }
      const badges = segments.reduce(
        (sum, segment) => sum + (segment?.firstElementChild?.getBoundingClientRect().width ?? 22) + 20,
        0
      );
      const labels = labelWidths.current.slice(0, total).reduce((sum, value) => sum + (value || 0), 0);
      const room = track.clientWidth - 8 - 4 * Math.max(0, total - 1);
      setTight(badges + labels > room + 0.5);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [vertical, labelled, frame, total, kind]);

  useIsomorphicLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    heightRef.current = viewport.offsetHeight;
    const observer = new ResizeObserver(() => {
      heightRef.current = viewport.offsetHeight;
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (view.id === 0) return;
    const viewport = viewportRef.current;
    const pane = paneRef.current;
    const leaving = leavingRef.current;
    const id = view.id;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mode = transition === 'none' ? 'none' : reduced ? 'fade' : transition;
    const finish = () => setView(state => (state.id === id ? { ...state, previous: null } : state));
    if (leaving && pane && leaving.contains(document.activeElement)) pane.focus({ preventScroll: true });
    if (!viewport || typeof viewport.animate !== 'function' || mode === 'none') {
      finish();
      return;
    }
    for (const element of [viewport, pane, leaving]) element?.getAnimations().forEach(animation => animation.cancel());
    const from = heightRef.current;
    const to = viewport.offsetHeight;
    const spring = ease();
    if (Math.abs(from - to) > 0.5) {
      viewport.animate([{ height: `${from}px` }, { height: `${to}px` }], {
        duration: reduced ? 200 : 560,
        easing: reduced ? SETTLE : spring
      });
    }
    const axis = vertical ? 'Y' : 'X';
    const shift = mode === 'slide' ? 36 : 0;
    if (pane) {
      if (shift) {
        pane.animate([{ transform: `translate${axis}(${view.direction * shift}px)` }, { transform: 'none' }], {
          duration: 560,
          easing: spring
        });
      }
      pane.animate([{ opacity: 0 }, { opacity: 0, offset: 0.25 }, { opacity: 1 }], {
        duration: 420,
        easing: 'ease-out'
      });
    }
    if (leaving) {
      leaving.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 140,
        easing: 'cubic-bezier(0.2, 0, 0.4, 1)',
        fill: 'forwards'
      });
      const exit = leaving.animate(
        [{ transform: 'none' }, { transform: `translate${axis}(${-view.direction * shift}px)` }],
        { duration: 200, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' }
      );
      exit.onfinish = finish;
    } else finish();
  }, [view.id]);

  useIsomorphicLayoutEffect(() => {
    const track = trackRef.current;
    const glider = gliderRef.current;
    if (!track || !glider) return;
    const place = animate => {
      const segment = markerRefs.current[Math.min(current, total) - 1];
      if (!segment) return;
      const spring = ease();
      glider.style.transition = animate
        ? `transform 560ms ${spring}, width 560ms ${spring}, height 560ms ${spring}, opacity 200ms ease`
        : 'opacity 200ms ease';
      glider.style.transform = `translate3d(${segment.offsetLeft}px, ${segment.offsetTop}px, 0)`;
      glider.style.width = `${segment.offsetWidth}px`;
      glider.style.height = `${segment.offsetHeight}px`;
      glider.style.opacity = completed ? '0' : '1';
    };
    place(placedRef.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    placedRef.current = true;
    const observer = new ResizeObserver(() => place(false));
    observer.observe(track);
    return () => observer.disconnect();
  }, [current, total, completed, kind, labelled, vertical, compact, tight]);

  const paneContent = number => (number > total ? (completedContent ?? null) : steps[number - 1]);
  const accentVars = accentColor
    ? { '--stepper-solid': accentColor, '--stepper-solid-ink': readableOn(accentColor) }
    : {};

  const badge = (entry, number, status) => (
    <span className={BADGE_CLASS} data-status={status}>
      {status === 'complete' ? (
        <Check />
      ) : entry.props.icon ? (
        <span className="grid place-items-center">{entry.props.icon}</span>
      ) : (
        number
      )}
    </span>
  );

  const header = () => {
    if (kind === 'dots') {
      return (
        <div className="flex justify-center gap-[2px]">
          {steps.map((entry, index) => {
            const number = index + 1;
            const status = completed || number < current ? 'complete' : number === current ? 'active' : 'upcoming';
            return (
              <button
                key={number}
                type="button"
                className={DOT_CLASS}
                data-status={status}
                aria-label={entry.props.title ? `Step ${number}: ${entry.props.title}` : `Step ${number}`}
                aria-current={number === current ? 'step' : undefined}
                disabled={!reachable(number)}
                onClick={() => go(number)}
              >
                <span className={DOT_MARK_CLASS} data-status={status} />
              </button>
            );
          })}
        </div>
      );
    }
    if (kind === 'bars') {
      return (
        <div className="flex gap-1.5">
          {steps.map((entry, index) => {
            const number = index + 1;
            const filled = completed || number <= current;
            return (
              <button
                key={number}
                type="button"
                className={BAR_CLASS}
                data-status={completed || number < current ? 'complete' : number === current ? 'active' : 'upcoming'}
                aria-label={entry.props.title ? `Step ${number}: ${entry.props.title}` : `Step ${number}`}
                aria-current={number === current ? 'step' : undefined}
                disabled={!reachable(number)}
                onClick={() => go(number)}
              >
                <span className={BAR_TRACK_CLASS}>
                  <span className={BAR_FILL_CLASS} data-filled={filled ? '' : undefined} />
                </span>
              </button>
            );
          })}
        </div>
      );
    }
    return (
      <div
        ref={trackRef}
        className={`${TRACK_CLASS} ${rail ? 'flex-1 flex-col' : ''}`}
        data-layout={rail ? 'rail' : 'row'}
      >
        <span ref={gliderRef} className={GLIDER_CLASS} aria-hidden="true" />
        {steps.map((entry, index) => {
          const number = index + 1;
          const status = completed || number < current ? 'complete' : number === current ? 'active' : 'upcoming';
          const title = entry.props.title;
          const text = title && !(tight && !rail) && (
            <span className={`flex min-w-0 flex-col gap-[2px] text-left ${rail ? 'pt-[3px]' : ''}`}>
              <span
                ref={element => {
                  titleRefs.current[index] = element;
                }}
                className={`${TITLE_CLASS} ${status === 'upcoming' ? MUTED : INK}`}
                data-status={status}
              >
                {title}
              </span>
              {rail && entry.props.description && <span className={DESCRIPTION_CLASS}>{entry.props.description}</span>}
            </span>
          );
          const ref = element => {
            markerRefs.current[index] = element;
          };
          if (renderStepIndicator) {
            return (
              <div
                key={number}
                ref={ref}
                className={`${SEGMENT_CLASS} ${rail ? SEGMENT_RAIL : SEGMENT_ROW}`}
                data-status={status}
              >
                {renderStepIndicator({ step: number, currentStep: current, onStepClick: clicked => go(clicked) })}
                {text}
              </div>
            );
          }
          return (
            <button
              key={number}
              ref={ref}
              type="button"
              className={`${SEGMENT_CLASS} ${rail ? SEGMENT_RAIL : SEGMENT_ROW}`}
              data-status={status}
              aria-label={typeof title === 'string' ? `Step ${number}: ${title}` : `Step ${number}`}
              aria-current={number === current ? 'step' : undefined}
              disabled={!reachable(number)}
              onClick={() => go(number)}
            >
              {badge(entry, number, status)}
              {text}
            </button>
          );
        })}
      </div>
    );
  };

  const isLast = current === total;
  const nextLabel = isLast ? completeButtonText : nextButtonText;
  const { className: backClass = '', onClick: onBackClick, ...backRest } = backButtonProps;
  const { className: nextClass = '', onClick: onNextClick, ...nextRest } = nextButtonProps;

  return (
    <div
      {...rest}
      ref={rootRef}
      className={`${ROOT_CLASS} ${rail ? 'flex-row items-stretch' : 'flex-col'} ${frame ? FRAMED_CLASS : BARE_CLASS} ${stepCircleContainerClassName} ${className}`
        .replace(/\s+/g, ' ')
        .trim()}
      data-completed={completed ? '' : undefined}
      style={{
        ...(THEMES[theme] ?? THEMES.dark),
        '--stepper-radius': `${Math.max(0, radius)}px`,
        '--stepper-spring': SPRING,
        '--stepper-width': size(width),
        ...accentVars,
        ...style
      }}
    >
      <div
        className={`${kind === 'numbers' ? '' : 'px-[var(--stepper-inset)] pt-[var(--stepper-inset)]'} ${rail ? 'flex w-[212px] max-w-[42%] flex-none' : ''} ${stepContainerClassName}`
          .replace(/\s+/g, ' ')
          .trim()}
      >
        {header()}
      </div>
      <div
        className={`flex min-w-0 flex-col ${rail ? 'flex-1 pt-[var(--stepper-inset)] pr-[var(--stepper-inset)] pb-[var(--stepper-inset)] pl-5' : 'px-[var(--stepper-inset)] pt-5 pb-[var(--stepper-inset)]'}`}
      >
        <div ref={viewportRef} className={`${VIEWPORT_CLASS} ${contentClassName}`.trim()} aria-live="polite">
          {view.previous !== null && (
            <div key={view.id - 1} ref={leavingRef} className={`${PANE_CLASS} ${LEAVING_CLASS}`} aria-hidden="true">
              {paneContent(view.previous)}
            </div>
          )}
          <div key={view.id} ref={paneRef} className={PANE_CLASS} tabIndex={-1}>
            {paneContent(view.step)}
          </div>
        </div>
        {showFooter && (
          <div
            className={FOOTER_WRAP_CLASS}
            data-hidden={completed ? '' : undefined}
            aria-hidden={completed ? true : undefined}
          >
            <div className={FOOTER_CLIP_CLASS}>
              <div className={`${FOOTER_CLASS} ${footerClassName}`.trim()}>
                <button
                  type="button"
                  {...backRest}
                  className={`${BUTTON_CLASS} ${BACK_CLASS} ${backClass}`.trim()}
                  data-hidden={current <= 1 ? '' : undefined}
                  tabIndex={completed ? -1 : backRest.tabIndex}
                  onClick={event => {
                    onBackClick?.(event);
                    if (!event.defaultPrevented) go(current - 1);
                  }}
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2} />
                  <span>{backButtonText}</span>
                </button>
                <button
                  type="button"
                  {...nextRest}
                  className={`${BUTTON_CLASS} ${NEXT_CLASS} ${nextClass}`.trim()}
                  tabIndex={completed ? -1 : nextRest.tabIndex}
                  onClick={event => {
                    onNextClick?.(event);
                    if (!event.defaultPrevented) go(current + 1);
                  }}
                >
                  <span>{nextLabel}</span>
                  <HugeiconsIcon icon={isLast ? Tick02Icon : ArrowRight01Icon} size={16} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {frame && <span className={RIM_CLASS} aria-hidden="true" />}
    </div>
  );
}
