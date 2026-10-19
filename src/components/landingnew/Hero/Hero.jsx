import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight02Icon, ArrowUpRight01Icon, Copy01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { useColorMode } from '../../setup/color-mode';
import useAdaptiveQuality from '../../../hooks/useAdaptiveQuality';
import { buildStudioUrl } from '../../common/Preview/studio-url';
import { TOTAL_COMPONENTS } from '../../../constants/Categories';
import { LOOK, PRESET_OPTIONS, presetProps } from '../../../demo/Backgrounds/presets/GradientWaves';
import HeroChip from './HeroChip';
import './HeroFrame.css';

const GradientWaves = lazy(() => import('../../../content/Backgrounds/GradientWaves/GradientWaves'));
const DotGrid = lazy(() => import('../../../content/Backgrounds/DotGrid/DotGrid'));

const ORDER = ['ocean', 'dune', 'dusk', 'silk', 'aurora'];
const OPTIONS = ORDER.map(value => PRESET_OPTIONS.find(option => option.value === value));
const FIRST = 'dusk';
const STAGE = { tilt: 40 };
const INSTALL = 'npx shadcn@latest add @react-bits/GradientWaves-TS-TW';
const FIELDS = [
  { name: 'waveColor', type: 'color', label: 'Wave color' },
  { name: 'amplitude', min: 0, max: 5, step: 0.05, label: 'Amplitude' },
  { name: 'swell', min: 0, max: 40, step: 0.5, label: 'Swell' },
  { name: 'lightAngle', min: -180, max: 180, step: 1, label: 'Light angle' },
  { name: 'speed', min: 0, max: 1.5, step: 0.01, label: 'Speed' }
];
const HINTS = ['amplitude', 'swell'];
const SWATCHES = {
  dark: ['#fb923c', '#f9a8d4', '#c4b5fd', '#38bdf8', '#34d399', '#fde68a', '#e4e4e7'],
  light: ['#fb923c', '#e879f9', '#a78bfa', '#38bdf8', '#34d399', '#facc15', '#a1a1aa']
};
const HEX = /^#[0-9a-f]{6}$/i;

const lookFor = (preset, light) => ({ ...presetProps(preset, { light, defaults: LOOK }), ...STAGE });

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const decimals = step => (String(step).split('.')[1] || '').length;

const roundTo = (value, step) => Number((Math.round(value / step) * step).toFixed(decimals(step)));

const toRgb = hex => {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const toHex = rgb => `#${rgb.map(channel => Math.round(channel).toString(16).padStart(2, '0')).join('')}`;

const mix = (from, to, t) => {
  if (typeof from === 'number' && typeof to === 'number') return from + (to - from) * t;
  if (typeof from === 'string' && typeof to === 'string' && HEX.test(from) && HEX.test(to)) {
    const a = toRgb(from);
    const b = toRgb(to);
    return toHex(a.map((channel, index) => channel + (b[index] - channel) * t));
  }
  return t < 0.5 ? from : to;
};

const tween = (from, to, onFrame, duration) => {
  let frame = 0;
  const start = performance.now();
  const step = now => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const next = { ...from };
    Object.keys(to).forEach(key => {
      next[key] = mix(from[key], to[key], eased);
    });
    onFrame(next);
    if (t < 1) frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
};

function useDismiss(ref, open, close) {
  useEffect(() => {
    if (!open) return undefined;
    const onDown = event => {
      if (!ref.current?.contains(event.target)) close();
    };
    const onKey = event => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, open, close]);
}

function ScrubNumber({ value, field, onChange }) {
  const drag = useRef(null);
  const [active, setActive] = useState(false);
  const range = field.max - field.min;

  const down = event => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, value };
    setActive(true);
  };
  const move = event => {
    if (!drag.current) return;
    const delta = ((event.clientX - drag.current.x) / 260) * range;
    onChange(roundTo(clamp(drag.current.value + delta, field.min, field.max), field.step));
  };
  const up = () => {
    drag.current = null;
    setActive(false);
  };
  const key = event => {
    const direction = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[event.key];
    if (!direction) return;
    event.preventDefault();
    const amount = field.step * (event.shiftKey ? 10 : 1) * direction;
    onChange(roundTo(clamp(value + amount, field.min, field.max), field.step));
  };

  return (
    <span
      className="lh-scrub lh-value"
      role="slider"
      tabIndex={0}
      aria-label={field.label}
      aria-valuemin={field.min}
      aria-valuemax={field.max}
      aria-valuenow={value}
      data-active={active ? '' : undefined}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onKeyDown={key}
    >
      {roundTo(value, field.step)}
    </span>
  );
}

function ScrubColor({ value, swatches, label, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  return (
    <span className="lh-color" ref={ref}>
      <button
        type="button"
        className="lh-scrub lh-value"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
      >
        <i style={{ background: value }} />
        {`"${value}"`}
      </button>
      {open && (
        <span className="lh-swatches">
          {swatches.map(color => (
            <button
              key={color}
              type="button"
              aria-label={color}
              aria-pressed={color.toLowerCase() === String(value).toLowerCase()}
              style={{ '--swatch': color }}
              onClick={() => onChange(color)}
            />
          ))}
        </span>
      )}
    </span>
  );
}

function Window({ title, className, status, action, children, ...rest }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef(null);

  const down = event => {
    if (event.button !== 0 || event.target.closest('button')) return;
    if (window.matchMedia('(max-width: 768px)').matches) return;
    drag.current = { x: event.clientX, y: event.clientY, start: offset };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = event => {
    if (!drag.current) return;
    setOffset({
      x: drag.current.start.x + event.clientX - drag.current.x,
      y: drag.current.start.y + event.clientY - drag.current.y
    });
  };
  const up = () => {
    drag.current = null;
  };

  return (
    <div {...rest} className={`lh-window ${className}`} style={{ '--wx': `${offset.x}px`, '--wy': `${offset.y}px` }}>
      <div className="lh-window-bar" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        {title}
        {action}
      </div>
      <div className="lh-well">{children}</div>
      {status && <div className="lh-window-status">{status}</div>}
    </div>
  );
}

const OUTPUT = ['✔ Checking registry.', '✔ Created 2 files.'];

function CopyCommand() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(INSTALL);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };
  return (
    <button type="button" className="lh-window-action" onClick={copy} aria-label="Copy install command">
      <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={13} strokeWidth={1.8} />
    </button>
  );
}

function Terminal() {
  const [typed, setTyped] = useState(0);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTyped(INSTALL.length);
      setShown(OUTPUT.length);
      return undefined;
    }
    let timer = 0;
    const later = (fn, ms) => {
      timer = window.setTimeout(fn, ms);
    };
    const reveal = count => {
      setShown(count);
      if (count < OUTPUT.length) later(() => reveal(count + 1), 560);
    };
    const type = count => {
      setTyped(count);
      if (count < INSTALL.length) later(() => type(count + 1), 18 + ((count * 37) % 29));
      else later(() => reveal(1), 480);
    };
    const begin = () => {
      if (document.querySelector('.landing-wrapper.ln-loading')) later(begin, 200);
      else later(() => type(1), 1500);
    };
    begin();
    return () => window.clearTimeout(timer);
  }, []);

  const typing = typed < INSTALL.length;
  const done = shown >= OUTPUT.length;

  return (
    <div className="lh-term">
      <div className="lh-term-line">
        <span className="lh-term-prompt">$</span> {INSTALL.slice(0, typed)}
        {typing && typed > 0 && <span className="lh-caret" />}
        <span className="lh-term-rest">{INSTALL.slice(typed)}</span>
      </div>
      {OUTPUT.map((line, index) => (
        <div key={line} className="lh-term-line lh-term-out" data-shown={index < shown ? '' : undefined}>
          <span className="lh-term-ok">{line.slice(0, 1)}</span>
          {line.slice(1)}
          {done && index === OUTPUT.length - 1 && <span className="lh-caret lh-caret--idle" />}
        </div>
      ))}
    </div>
  );
}

const DOT = { size: 2.6, gap: 22, radius: 360, strength: 0.264 };
const CYCLE_MS = 6000;

const luminance = hex => {
  const [r, g, b] = toRgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const dotTint = (wave, light) => {
  const base = light ? '#f5f5f5' : '#120f17';
  if (!HEX.test(String(wave))) return light ? '#c5c5cb' : '#4e4560';
  const delta = Math.abs(luminance(wave) - luminance(base)) || 1;
  return mix(base, wave, Math.min(1, Math.max(0.15, (light ? 48 : 54) / delta)));
};
const IDLE_MS = 2600;

const smootherstep = t => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
};

function useDotAlignment(ref) {
  useEffect(() => {
    const node = ref.current;
    const host = node?.parentElement;
    if (!node || !host) return undefined;
    const layout = () => {
      const cell = DOT.size + DOT.gap;
      const width = host.clientWidth;
      const height = host.clientHeight;
      const cols = Math.max(1, Math.floor((width + DOT.gap) / cell));
      const rows = Math.max(1, Math.floor((height + DOT.gap) / cell));
      const startX = (width - (cols * cell - DOT.gap)) / 2 + DOT.size / 2;
      const startY = (height - (rows * cell - DOT.gap)) / 2 + DOT.size / 2;
      node.style.backgroundSize = `${cell}px ${cell}px`;
      node.style.backgroundPosition = `${startX - cell / 2}px ${startY - cell / 2}px`;
    };
    const observer = new ResizeObserver(layout);
    observer.observe(host);
    layout();
    return () => observer.disconnect();
  }, [ref]);
}

function DotFrame({ color, live }) {
  const ref = useRef(null);
  useDotAlignment(ref);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const clear = () => {
      node.style.removeProperty('--hole-x');
      node.style.removeProperty('--hole-y');
    };
    if (!live) {
      clear();
      return undefined;
    }
    const move = event => {
      const bounds = node.getBoundingClientRect();
      node.style.setProperty('--hole-x', `${(event.clientX - bounds.left).toFixed(1)}px`);
      node.style.setProperty('--hole-y', `${(event.clientY - bounds.top).toFixed(1)}px`);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      clear();
    };
  }, [live]);

  return (
    <div
      ref={ref}
      className="lh-dotframe"
      aria-hidden="true"
      style={{ '--frame-color': color, '--frame-dot': `${DOT.size / 2 + 0.15}px` }}
    />
  );
}

function GhostReveal({ active, start, color }) {
  const ref = useRef(null);
  const spotRef = useRef(null);
  const dotsRef = useRef(null);
  const grid = useRef({ width: 0, originX: 0, originY: 0 });

  useEffect(() => {
    const host = ref.current?.parentElement;
    if (!host) return undefined;
    const layout = () => {
      const cell = DOT.size + DOT.gap;
      const width = host.clientWidth;
      const height = host.clientHeight;
      const cols = Math.max(1, Math.floor((width + DOT.gap) / cell));
      const rows = Math.max(1, Math.floor((height + DOT.gap) / cell));
      const startX = (width - (cols * cell - DOT.gap)) / 2 + DOT.size / 2;
      const startY = (height - (rows * cell - DOT.gap)) / 2 + DOT.size / 2;
      grid.current = { width, originX: startX - cell / 2, originY: startY - cell / 2 };
    };
    const observer = new ResizeObserver(layout);
    observer.observe(host);
    layout();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = ref.current;
    const host = node?.parentElement;
    const spot = spotRef.current;
    const dots = dotsRef.current;
    if (!node || !host || !spot || !dots || !active) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const cell = DOT.size + DOT.gap;
    const wrap = value => ((value % cell) + cell) % cell;
    const bounds = host.getBoundingClientRect();
    const stage = host.querySelector('.lh-stage')?.getBoundingClientRect();
    const band = Math.max(240, (stage ? stage.top : bounds.top + 400) - bounds.top);
    const from =
      start.current && start.current.y - bounds.top < band + DOT.radius * 0.5
        ? { x: start.current.x - bounds.left, y: start.current.y - bounds.top }
        : null;
    const began = performance.now();
    let frame = 0;
    const tick = now => {
      const t = (now - began) / 1000;
      const { width, originX, originY } = grid.current;
      const x = width * 0.58 + width * 0.36 * (0.62 * Math.sin(t * 0.16 + 0.4) + 0.38 * Math.sin(t * 0.07 + 2.2));
      const y = band * 0.52 + band * 0.3 * (0.6 * Math.sin(t * 0.12 + 1.1) + 0.4 * Math.sin(t * 0.05 + 0.3));
      const blend = from ? smootherstep(t / 3.2) : 1;
      const left = (from ? from.x + (x - from.x) * blend : x) - DOT.radius;
      const top = (from ? from.y + (y - from.y) * blend : y) - DOT.radius;
      spot.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`;
      dots.style.transform = `translate3d(${(wrap(originX - left) - cell).toFixed(1)}px, ${(wrap(originY - top) - cell).toFixed(1)}px, 0)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, start]);

  return (
    <div
      ref={ref}
      className="lh-ghost"
      data-on={active ? '' : undefined}
      aria-hidden="true"
      style={{
        '--ghost-color': color,
        '--ghost-dot': `${DOT.size / 2 + 0.15}px`,
        '--ghost-radius': `${DOT.radius}px`,
        '--ghost-cell': `${DOT.size + DOT.gap}px`,
        '--ghost-strength': DOT.strength
      }}
    >
      <div ref={spotRef} className="lh-ghost-spot">
        <div ref={dotsRef} className="lh-ghost-dots" />
      </div>
    </div>
  );
}

const Hero = () => {
  const { resolvedTheme } = useColorMode();
  const light = resolvedTheme === 'light';
  const [preset, setPreset] = useState(FIRST);
  const [values, setValues] = useState(() => lookFor(FIRST, light));
  const [visible, setVisible] = useState(true);
  const [hover] = useState(() => window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  const step = useAdaptiveQuality(visible);
  const [idle, setIdle] = useState(true);
  const [auto, setAuto] = useState(true);
  const [hold, setHold] = useState(false);
  const [focused, setFocused] = useState(true);
  const heroRef = useRef(null);
  const idleRef = useRef(true);
  const pointerRef = useRef(null);
  const stageRef = useRef(null);
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const stopRef = useRef(null);
  const presetRef = useRef(preset);
  presetRef.current = preset;

  useEffect(() => {
    stopRef.current?.();
    setValues(lookFor(presetRef.current || FIRST, light));
  }, [light]);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => setFocused(entry.isIntersecting), {
      rootMargin: '-45% 0px -54% 0px'
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (focused) root.style.setProperty('--pro-base', mix(values.horizonColor, values.waveColor, 0.5));
    else root.style.removeProperty('--pro-base');
  }, [focused, values.horizonColor, values.waveColor]);

  useEffect(() => () => document.documentElement.style.removeProperty('--pro-base'), []);

  useEffect(() => () => stopRef.current?.(), []);

  useEffect(() => {
    let timer = 0;
    const rest = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        idleRef.current = true;
        setIdle(true);
      }, IDLE_MS);
    };
    const move = event => {
      if (event.pointerType === 'touch') return;
      pointerRef.current = { x: event.clientX, y: event.clientY };
      if (idleRef.current) {
        idleRef.current = false;
        setIdle(false);
      }
      rest();
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointermove', move);
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '80px' });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const choose = value => {
    setPreset(value);
    stopRef.current?.();
    stopRef.current = tween(valuesRef.current, lookFor(value, light), setValues, 900);
  };
  const chooseRef = useRef(choose);
  chooseRef.current = choose;

  const pick = value => {
    setAuto(false);
    choose(value);
  };

  const set = (name, value) => {
    stopRef.current?.();
    setAuto(false);
    setPreset(null);
    setValues(current => ({ ...current, [name]: value }));
  };

  useEffect(() => {
    if (!auto || hold || !visible || !preset) return undefined;
    const timer = window.setTimeout(() => {
      const index = OPTIONS.findIndex(option => option.value === presetRef.current);
      chooseRef.current(OPTIONS[(index + 1) % OPTIONS.length].value);
    }, CYCLE_MS);
    return () => window.clearTimeout(timer);
  }, [auto, hold, visible, preset]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const state = { x: 0, y: 0, tx: 0, ty: 0, frame: 0 };
    const tick = () => {
      state.x += (state.tx - state.x) * 0.07;
      state.y += (state.ty - state.y) * 0.07;
      stage.style.setProperty('--lh-px', state.x.toFixed(4));
      stage.style.setProperty('--lh-py', state.y.toFixed(4));
      const moving = Math.abs(state.tx - state.x) + Math.abs(state.ty - state.y) > 0.0004;
      state.frame = moving ? requestAnimationFrame(tick) : 0;
    };
    const move = event => {
      if (event.pointerType === 'touch') return;
      state.tx = event.clientX / window.innerWidth - 0.5;
      state.ty = event.clientY / window.innerHeight - 0.5;
      if (!state.frame) state.frame = requestAnimationFrame(tick);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      cancelAnimationFrame(state.frame);
    };
  }, []);

  const presets = useMemo(
    () =>
      OPTIONS.map(option => {
        const look = lookFor(option.value, light);
        return {
          ...option,
          colors: [look.horizonColor, look.waveColor, look.crestColor],
          hint: HINTS.map(name => `${name} ${look[name]}`).join(' · ')
        };
      }),
    [light]
  );

  const activeIndex = OPTIONS.findIndex(option => option.value === preset);

  const studioUrl = buildStudioUrl(
    'gradient-waves',
    Object.fromEntries(FIELDS.map(field => [field.name, values[field.name]]).concat([['tilt', STAGE.tilt]])),
    LOOK
  );

  return (
    <section className="ln-hero lh" ref={heroRef} style={{ '--lh-accent': values.waveColor }}>
      {hover && !step.lite && (
        <div className="lh-dots" aria-hidden="true">
          <Suspense fallback={null}>
            <DotGrid
              dpr={Math.min(window.devicePixelRatio || 1, 1.5)}
              dotSize={DOT.size}
              gap={DOT.gap}
              baseColor={light ? '#f5f5f5' : '#120f17'}
              activeColor={dotTint(values.waveColor, light)}
              proximity={DOT.radius}
              strength={1.15}
              bounce={0.7}
              tension={0.35}
              swell={1.4}
              stretch={0.5}
              glow={0.15}
              opacity={0.55}
              shockRadius={380}
              shockStrength={4}
              intro={false}
              mouseInteraction={!idle}
            />
          </Suspense>
        </div>
      )}
      <DotFrame color={dotTint(values.waveColor, light)} live={!idle} />
      {!step.lite && (
        <GhostReveal active={idle && visible} start={pointerRef} color={dotTint(values.waveColor, light)} />
      )}
      <div className="lh-inner">
        <header className="lh-top">
          <HeroChip />
          <h1 className="lh-title">
            Animated React components for <br />
            websites people remember.
          </h1>
          <p className="lh-lede">
            <span>{TOTAL_COMPONENTS} animated components and backgrounds for React.</span>
            <span>Tune them yourself, or hand them to your agent.</span>
          </p>
          <div className="lh-actions">
            <Link to="/get-started/index" className="lh-btn lh-btn--primary">
              Browse components
              <HugeiconsIcon icon={ArrowRight02Icon} size={17} strokeWidth={1.8} />
            </Link>
            <a
              href="https://github.com/DavidHDev/react-bits"
              target="_blank"
              rel="noopener noreferrer"
              className="lh-btn lh-btn--ghost"
            >
              Star on GitHub
            </a>
          </div>
        </header>

        <div className="lh-stage" ref={stageRef}>
          <div className="lh-art" aria-hidden="true">
            <Suspense fallback={null}>
              <div className="lh-art-layer">
                <GradientWaves {...values} dpr={step.dpr} quality={step.quality} intro paused={!visible} />
              </div>
            </Suspense>
          </div>

          <Window title="Terminal" className="lh-terminal" action={<CopyCommand />}>
            <Terminal />
          </Window>

          <Window title="Hero.jsx" className="lh-code">
            <pre className="lh-pre">
              <code>
                <span className="lh-line">
                  <span className="lh-kw">import</span> GradientWaves <span className="lh-kw">from</span>{' '}
                  <span className="lh-str">&apos;./GradientWaves&apos;</span>;
                </span>
                <span className="lh-line"> </span>
                <span className="lh-line">
                  <span className="lh-kw">export default function</span> Hero() {'{'}
                </span>
                <span className="lh-line">
                  {'  '}
                  <span className="lh-kw">return</span> (
                </span>
                <span className="lh-line">{'    '}&lt;GradientWaves</span>
                {FIELDS.map(field => (
                  <span className="lh-line" key={field.name}>
                    {'      '}
                    <span className="lh-attr">{field.name}</span>
                    <span className="lh-punc">=</span>
                    {field.type === 'color' ? (
                      <ScrubColor
                        value={values[field.name]}
                        label={field.label}
                        swatches={SWATCHES[light ? 'light' : 'dark']}
                        onChange={value => set(field.name, value)}
                      />
                    ) : (
                      <>
                        <span className="lh-punc">{'{'}</span>
                        <ScrubNumber
                          value={values[field.name]}
                          field={field}
                          onChange={value => set(field.name, value)}
                        />
                        <span className="lh-punc">{'}'}</span>
                      </>
                    )}
                  </span>
                ))}
                <span className="lh-line">{'    '}/&gt;</span>
                <span className="lh-line">{'  '});</span>
                <span className="lh-line">{'}'}</span>
              </code>
            </pre>
          </Window>

          <Window
            title="Presets"
            className="lh-presets"
            onPointerEnter={() => setHold(true)}
            onPointerLeave={() => setHold(false)}
            status={
              <Link to={studioUrl} className="lh-studio">
                Open in Background Studio
                <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} strokeWidth={1.8} />
              </Link>
            }
          >
            <div className="lh-preset-list" role="radiogroup" aria-label="Presets">
              <span
                className="lh-preset-thumb"
                aria-hidden="true"
                data-hidden={activeIndex < 0 ? '' : undefined}
                style={{ '--i': Math.max(0, activeIndex) }}
              />
              {presets.map(option => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={preset === option.value}
                  className="lh-preset"
                  onClick={() => pick(option.value)}
                >
                  <span className="lh-preset-swatches" aria-hidden="true">
                    {option.colors.map((color, index) => (
                      <i key={`${color}-${index}`} style={{ background: color }} />
                    ))}
                  </span>
                  <span className="lh-preset-name">{option.label}</span>
                  <span className="lh-preset-hint">{option.hint}</span>
                </button>
              ))}
            </div>
          </Window>
        </div>
      </div>
    </section>
  );
};

export default Hero;
