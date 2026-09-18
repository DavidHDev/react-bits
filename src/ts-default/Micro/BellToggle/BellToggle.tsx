import React, { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
  type MotionStyle
} from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Notification03Icon } from '@hugeicons/core-free-icons';
import './BellToggle.css';

export type BellToggleSize = 'sm' | 'md' | 'lg';

export interface BellToggleProps {
  offLabel?: string;
  onLabel?: string;
  icon?: ReactNode;
  label?: string;
  color?: string;
  background?: string;
  onColor?: string;
  onBackground?: string;
  size?: BellToggleSize;
  radius?: number;
  ringAmplitude?: number;
  ringPasses?: number;
  ringDecay?: number;
  ringDuration?: number;
  ringPivot?: number;
  crossfadeMs?: number;
  revealBounce?: number;
  count?: number;
  badge?: boolean;
  badgeColor?: string;
  badgeTextColor?: string;
  waves?: boolean;
  clapper?: boolean;
  pressed?: boolean;
  defaultPressed?: boolean;
  onChange?: (pressed: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const SPRING_UI = { type: 'spring' as const, duration: 0.3, bounce: 0 };
const SEG_EASE = 'cubic-bezier(0.77, 0, 0.175, 1)';
const WARP = 0.6;
const SIZES: Record<string, [number, number, number, number, number]> = {
  sm: [36, 12.5, 14, 15, 8],
  md: [44, 13.5, 16, 19, 9],
  lg: [52, 15, 18, 23, 10]
};
const WOBBLE = { amplitude: 0.4, passes: 3, duration: 420 };
const BELL_BODY = 'M6 16.5V10a6 6 0 0 1 12 0v6.5l1.6 2.3H4.4L6 16.5z';

const passOffset = (k: number, passes: number) => 1 - Math.pow(1 - (k + 2 / 3) / (passes + 1), WARP);
const ringKeyframes = (from: number, amplitude: number, passes: number, decay: number): Keyframe[] => {
  const frames: Keyframe[] = [{ transform: `rotate(${from}deg)`, offset: 0, easing: SEG_EASE }];
  for (let k = 0; k < passes; k++) {
    const angle = amplitude * Math.pow(1 - k / passes, decay) * (k % 2 ? 1 : -1);
    frames.push({ transform: `rotate(${angle.toFixed(2)}deg)`, offset: passOffset(k, passes), easing: SEG_EASE });
  }
  frames.push({ transform: 'rotate(0deg)', offset: 1 });
  return frames;
};
const liveAngle = (el: Element) => {
  const tf = getComputedStyle(el).transform;
  if (!tf || tf === 'none') return 0;
  const m = new DOMMatrix(tf);
  return (Math.atan2(m.b, m.a) * 180) / Math.PI;
};

const BellToggle: React.FC<BellToggleProps> = ({
  offLabel = 'Notify me',
  onLabel = "You'll be notified",
  icon,
  label,
  color = '#f5f5f5',
  background = '#27272a',
  onColor = '#18181b',
  onBackground = '#f5f5f5',
  size = 'md',
  radius = 22,
  ringAmplitude = 17,
  ringPasses = 5,
  ringDecay = 1,
  ringDuration = 820,
  ringPivot = 16,
  crossfadeMs = 200,
  revealBounce = 0,
  count = 0,
  badge = true,
  badgeColor = '#ef4444',
  badgeTextColor = '#ffffff',
  waves = true,
  clapper = false,
  pressed,
  defaultPressed = false,
  onChange,
  disabled = false,
  className = ''
}) => {
  const [inner, setInner] = useState(defaultPressed);
  const on = pressed ?? inner;
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLSpanElement>(null);
  const glyphRef = useRef<HTMLSpanElement>(null);
  const clapperRef = useRef<HTMLSpanElement>(null);
  const waveLeft = useRef<SVGSVGElement>(null);
  const waveRight = useRef<SVGSVGElement>(null);
  const offRef = useRef<HTMLSpanElement>(null);
  const onRef = useRef<HTMLSpanElement>(null);
  const lastInput = useRef<'pointer' | 'keyboard'>('pointer');
  const pending = useRef<'pointer' | 'keyboard' | null>(null);
  const spring = useRef<AnimationPlaybackControls | null>(null);
  const prevCount = useRef(count);
  const [h, fs, iconSize, px, gap] = SIZES[size] ?? SIZES.md;

  const t = useMotionValue(on ? 1 : 0);
  const wOff = useMotionValue(0);
  const wOn = useMotionValue(0);
  const clip = useTransform([t, wOff, wOn], ([v, a, b]: number[]) => `${Math.max(a, b) - (a + (b - a) * v)}px`);

  useLayoutEffect(() => {
    const measure = () => {
      if (offRef.current) wOff.set(offRef.current.offsetWidth);
      if (onRef.current) wOn.set(onRef.current.offsetWidth);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (offRef.current) observer.observe(offRef.current);
    if (onRef.current) observer.observe(onRef.current);
    document.fonts?.ready.then(measure);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offLabel, onLabel, size]);

  const swing = (amplitude: number, passes: number, duration: number) => {
    const el = glyphRef.current;
    if (!el) return;
    el.getAnimations().forEach(a => a.cancel());
    el.animate(ringKeyframes(liveAngle(el), amplitude, passes, ringDecay), { duration, easing: 'linear' });
    const c = clapperRef.current;
    if (c) {
      c.getAnimations().forEach(a => a.cancel());
      c.animate(ringKeyframes(liveAngle(c), amplitude * 1.6, passes, ringDecay), {
        duration,
        delay: 70,
        easing: 'linear'
      });
    }
    if (!waves) return;
    for (let k = 0; k < passes; k++) {
      const side = k % 2 ? waveRight.current : waveLeft.current;
      if (!side) continue;
      const strength = Math.pow(1 - k / passes, ringDecay);
      side.animate(
        [
          { opacity: 0, transform: 'scale(0.55)' },
          { opacity: 0.9 * strength, offset: 0.3 },
          { opacity: 0, transform: 'scale(1.25)' }
        ],
        { duration: 380, delay: passOffset(k, passes) * duration, easing: 'ease-out' }
      );
    }
  };

  useLayoutEffect(() => {
    const pointer = pending.current === 'pointer' && !reduce;
    pending.current = null;
    spring.current?.stop();
    if (pointer) spring.current = animate(t, on ? 1 : 0, { ...SPRING_UI, bounce: revealBounce });
    else t.jump(on ? 1 : 0);
    if (on && pointer) swing(ringAmplitude, ringPasses, ringDuration);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);
  useLayoutEffect(() => () => spring.current?.stop(), []);

  useEffect(() => {
    const was = prevCount.current;
    prevCount.current = count;
    if (count > was && on && !reduce) swing(ringAmplitude * WOBBLE.amplitude, WOBBLE.passes, WOBBLE.duration);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  const toggle = () => {
    pending.current = lastInput.current;
    if (pressed === undefined) setInner(!on);
    onChange?.(!on);
  };
  const press = (e: React.PointerEvent<HTMLButtonElement>) => {
    lastInput.current = 'pointer';
    if (e.button === 0 && !disabled && rootRef.current) rootRef.current.dataset.pressed = '';
  };
  const release = () => {
    if (rootRef.current) delete rootRef.current.dataset.pressed;
  };
  const key = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') lastInput.current = 'keyboard';
  };

  const showBadge = badge && on && count > 0;

  return (
    <motion.span
      ref={rootRef}
      className={`bell-toggle${className ? ` ${className}` : ''}`}
      data-on={on ? 'true' : 'false'}
      data-disabled={disabled ? '' : undefined}
      style={
        {
          '--bt-clip': clip,
          '--bt-color': color,
          '--bt-bg': background,
          '--bt-on-color': onColor,
          '--bt-on-bg': onBackground,
          '--bt-badge': badgeColor,
          '--bt-badge-ink': badgeTextColor,
          '--bt-radius': `${radius}px`,
          '--bt-fade': `${crossfadeMs}ms`,
          '--bt-pivot': `${ringPivot}%`,
          '--bt-h': `${h}px`,
          '--bt-fs': `${fs}px`,
          '--bt-icon': `${iconSize}px`,
          '--bt-px': `${px}px`,
          '--bt-gap': `${gap}px`
        } as MotionStyle & CSSProperties
      }
    >
      <button
        type="button"
        className="bell-toggle__button"
        aria-pressed={on}
        aria-label={label ?? offLabel}
        disabled={disabled}
        onPointerDown={press}
        onPointerUp={release}
        onPointerCancel={release}
        onPointerLeave={release}
        onKeyDown={key}
        onClick={toggle}
      >
        <span className="bell-toggle__bell" aria-hidden="true">
          <span ref={glyphRef} className="bell-toggle__glyph">
            {clapper ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={BELL_BODY} />
                <path d="M12 2.5V4" />
              </svg>
            ) : (
              (icon ?? <HugeiconsIcon icon={Notification03Icon} size={iconSize} strokeWidth={2} />)
            )}
          </span>
          {clapper ? (
            <span ref={clapperRef} className="bell-toggle__clapper">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="20.4" r="1.7" fill="currentColor" />
              </svg>
            </span>
          ) : null}
          {waves ? (
            <>
              <svg ref={waveLeft} className="bell-toggle__wave bell-toggle__wave--left" viewBox="0 0 14 14">
                <path d="M14 8a6 6 0 0 0-6 6" />
                <path d="M14 4A10 10 0 0 0 4 14" />
              </svg>
              <svg ref={waveRight} className="bell-toggle__wave bell-toggle__wave--right" viewBox="0 0 14 14">
                <path d="M0 8a6 6 0 0 1 6 6" />
                <path d="M0 4a10 10 0 0 1 10 10" />
              </svg>
            </>
          ) : null}
          {badge ? (
            <span className="bell-toggle__badge" data-show={showBadge ? '' : undefined}>
              <span key={count} className="bell-toggle__digit">
                {count > 9 ? '9+' : count}
              </span>
            </span>
          ) : null}
        </span>
        <span className="bell-toggle__say" aria-hidden="true">
          <span ref={offRef} className="bell-toggle__face bell-toggle__face--off">
            {offLabel}
          </span>
          <span ref={onRef} className="bell-toggle__face bell-toggle__face--on">
            {onLabel}
          </span>
        </span>
      </button>
    </motion.span>
  );
};

export default BellToggle;
