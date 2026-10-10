'use client';

import {
  Children,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode
} from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ArrowRight01Icon, Tick02Icon } from '@hugeicons/core-free-icons';

import './Stepper.css';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export interface StepProps {
  children?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
}

interface StepIndicatorProps {
  step: number;
  currentStep: number;
  onStepClick: (step: number) => void;
}

interface StepperProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'className' | 'style'> {
  children?: ReactNode;
  step?: number;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  indicator?: 'numbers' | 'dots' | 'bars';
  orientation?: 'horizontal' | 'vertical';
  transition?: 'slide' | 'fade' | 'none';
  linear?: boolean;
  disableStepIndicators?: boolean;
  renderStepIndicator?: (props: StepIndicatorProps) => ReactNode;
  showFooter?: boolean;
  backButtonText?: string;
  nextButtonText?: string;
  completeButtonText?: string;
  backButtonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  nextButtonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  completedContent?: ReactNode;
  theme?: 'dark' | 'light';
  accentColor?: string;
  frame?: boolean;
  radius?: number;
  width?: number | string;
  className?: string;
  stepCircleContainerClassName?: string;
  stepContainerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  style?: CSSProperties;
}

interface View {
  step: number;
  previous: number | null;
  direction: number;
  id: number;
}

const THEMES: Record<string, Record<string, string>> = {
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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const size = (value: number | string) => (typeof value === 'number' ? `${value}px` : value);

const readableOn = (color: string) => {
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

function Check() {
  const ref = useRef<HTMLSpanElement>(null);

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
    <span ref={ref} className="stepper__check">
      <HugeiconsIcon icon={Tick02Icon} size={16} strokeWidth={2.4} />
    </span>
  );
}

export function Step({ children }: StepProps) {
  return <div className="stepper__step">{children}</div>;
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
}: StepperProps) {
  const steps = Children.toArray(children).filter(isValidElement) as ReactElement<StepProps>[];
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

  const [view, setView] = useState<View>({ step: current, previous: null, direction: 1, id: 0 });
  if (view.step !== current) {
    setView({ step: current, previous: view.step, direction: current > view.step ? 1 : -1, id: view.id + 1 });
  }

  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const gliderRef = useRef<HTMLSpanElement>(null);
  const markerRefs = useRef<(HTMLElement | null)[]>([]);
  const titleRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const leavingRef = useRef<HTMLDivElement>(null);
  const heightRef = useRef(0);
  const labelWidths = useRef<number[]>([]);
  const tightRef = useRef(false);
  tightRef.current = tight;
  const placedRef = useRef(false);

  const go = (target: number) => {
    const next = clamp(target, 1, total + 1);
    if (next === current) return;
    if (!controlled) setInternal(next);
    if (next > total) onFinalStepCompleted();
    else onStepChange(next);
  };

  const reachable = (number: number) =>
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
    const place = (animate: boolean) => {
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

  const paneContent = (number: number) => (number > total ? (completedContent ?? null) : steps[number - 1]);
  const accentVars: Record<string, string> = accentColor
    ? { '--stepper-solid': accentColor, '--stepper-solid-ink': readableOn(accentColor) }
    : {};

  const badge = (entry: ReactElement<StepProps>, number: number, status: 'complete' | 'active' | 'upcoming') => (
    <span className="stepper__badge" data-status={status}>
      {status === 'complete' ? (
        <Check />
      ) : entry.props.icon ? (
        <span className="stepper__glyph">{entry.props.icon}</span>
      ) : (
        number
      )}
    </span>
  );

  const header = () => {
    if (kind === 'dots') {
      return (
        <div className="stepper__dots">
          {steps.map((entry, index) => {
            const number = index + 1;
            const status = completed || number < current ? 'complete' : number === current ? 'active' : 'upcoming';
            return (
              <button
                key={number}
                type="button"
                className="stepper__dot"
                data-status={status}
                aria-label={entry.props.title ? `Step ${number}: ${entry.props.title}` : `Step ${number}`}
                aria-current={number === current ? 'step' : undefined}
                disabled={!reachable(number)}
                onClick={() => go(number)}
              >
                <span className="stepper__dot-mark" data-status={status} />
              </button>
            );
          })}
        </div>
      );
    }
    if (kind === 'bars') {
      return (
        <div className="stepper__bars">
          {steps.map((entry, index) => {
            const number = index + 1;
            const filled = completed || number <= current;
            return (
              <button
                key={number}
                type="button"
                className="stepper__bar"
                data-status={completed || number < current ? 'complete' : number === current ? 'active' : 'upcoming'}
                aria-label={entry.props.title ? `Step ${number}: ${entry.props.title}` : `Step ${number}`}
                aria-current={number === current ? 'step' : undefined}
                disabled={!reachable(number)}
                onClick={() => go(number)}
              >
                <span className="stepper__bar-track">
                  <span className="stepper__bar-fill" data-filled={filled ? '' : undefined} />
                </span>
              </button>
            );
          })}
        </div>
      );
    }
    return (
      <div ref={trackRef} className="stepper__track" data-layout={rail ? 'rail' : 'row'}>
        <span ref={gliderRef} className="stepper__glider" aria-hidden="true" />
        {steps.map((entry, index) => {
          const number = index + 1;
          const status = completed || number < current ? 'complete' : number === current ? 'active' : 'upcoming';
          const title = entry.props.title;
          const text = title && !(tight && !rail) && (
            <span className="stepper__text">
              <span
                ref={element => {
                  titleRefs.current[index] = element;
                }}
                className="stepper__title"
                data-status={status}
              >
                {title}
              </span>
              {rail && entry.props.description && (
                <span className="stepper__description">{entry.props.description}</span>
              )}
            </span>
          );
          const ref = (element: HTMLElement | null) => {
            markerRefs.current[index] = element;
          };
          if (renderStepIndicator) {
            return (
              <div key={number} ref={ref} className="stepper__segment" data-status={status}>
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
              className="stepper__segment"
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
      className={`stepper stepper--${rail ? 'vertical' : 'horizontal'}${frame ? ' stepper--framed' : ''} ${stepCircleContainerClassName} ${className}`
        .replace(/\s+/g, ' ')
        .trim()}
      data-completed={completed ? '' : undefined}
      style={
        {
          ...(THEMES[theme] ?? THEMES.dark),
          '--stepper-radius': `${Math.max(0, radius)}px`,
          '--stepper-spring': SPRING,
          '--stepper-width': size(width),
          ...accentVars,
          ...style
        } as CSSProperties
      }
    >
      <div className={`stepper__header stepper__header--${kind} ${stepContainerClassName}`.trim()}>{header()}</div>
      <div className="stepper__body">
        <div ref={viewportRef} className={`stepper__viewport ${contentClassName}`.trim()} aria-live="polite">
          {view.previous !== null && (
            <div key={view.id - 1} ref={leavingRef} className="stepper__pane stepper__pane--leaving" aria-hidden="true">
              {paneContent(view.previous)}
            </div>
          )}
          <div key={view.id} ref={paneRef} className="stepper__pane" tabIndex={-1}>
            {paneContent(view.step)}
          </div>
        </div>
        {showFooter && (
          <div
            className="stepper__footer-wrap"
            data-hidden={completed ? '' : undefined}
            aria-hidden={completed ? true : undefined}
          >
            <div className="stepper__footer-clip">
              <div className={`stepper__footer ${footerClassName}`.trim()}>
                <button
                  type="button"
                  {...backRest}
                  className={`stepper__button stepper__button--back ${backClass}`.trim()}
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
                  className={`stepper__button stepper__button--next ${nextClass}`.trim()}
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
      {frame && <span className="stepper__rim" aria-hidden="true" />}
    </div>
  );
}
