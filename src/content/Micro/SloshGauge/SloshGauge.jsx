import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import './SloshGauge.css';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const H = 1 / 120;
const DT_MAX = 0.05;
const TILT_GAIN = 0.07;
const TILT_MAX = 30;
const REST_POS = 0.05;
const REST_VEL = 2;
const STEP = 2;
const BIG = 10;
const BAND = 10;

const onColor = hex => {
  const raw = hex.replace('#', '');
  const full = raw.length === 3 ? [...raw].map(c => c + c).join('') : raw;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return '#ffffff';
  return (((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 >= 150 ? '#111111' : '#ffffff';
};

export default function SloshGauge({
  value,
  defaultValue = 60,
  onChange,
  interactive = false,
  showValue = true,
  disabled = false,
  liquidColor = '#f5f5f5',
  glassColor = '#27272a',
  width = 88,
  height = 180,
  radius = 20,
  ticks = 4,
  viscosity = 0.15,
  tilt = 0.45,
  splash = 0.42,
  unit = '%',
  ariaLabel = 'Level',
  className = ''
}) {
  const root = useRef(null);
  const liquid = useRef(null);
  const marker = useRef(null);
  const textA = useRef(null);
  const textB = useRef(null);
  const start = clamp(value ?? defaultValue, 0, 100);
  const sim = useRef({ x: start, v: 0, L: start, raf: 0, last: 0 });
  const grip = useRef(null);
  const reduce = useRef(false);
  const [held, setHeld] = useState(false);
  const live = useRef({});
  live.current = { viscosity, tilt, splash, width, height, value, onChange, unit };

  const paint = () => {
    const { x, v, L } = sim.current;
    const { tilt: t, width: W, height: Hh } = live.current;
    const th = reduce.current ? 0 : clamp(t * v * TILT_GAIN, -TILT_MAX, TILT_MAX);
    const lean = (Math.tan((th * Math.PI) / 180) * W) / 2;
    const top = 100 - x;
    if (liquid.current) {
      liquid.current.style.clipPath = `polygon(0 calc(${top}% + ${lean}px), 100% calc(${top}% - ${lean}px), 100% 100%, 0 100%)`;
    }
    if (marker.current) marker.current.style.transform = `translateY(${((100 - L) * Hh) / 100}px)`;
  };

  const say = () => {
    const n = Math.round(sim.current.L);
    const s = `${n}${live.current.unit}`;
    root.current?.setAttribute('aria-valuenow', String(n));
    if (textA.current) textA.current.textContent = s;
    if (textB.current) textB.current.textContent = s;
  };

  const tick = now => {
    const s = sim.current;
    const { viscosity: vis, splash: give } = live.current;
    const dt = s.last ? Math.min((now - s.last) / 1000, DT_MAX) : H;
    s.last = now;
    if (vis <= 0) {
      s.x = s.L;
      s.v = 0;
    } else {
      const k = 1224 - 1044 * vis;
      const zeta = reduce.current ? 1 : 0.26 - 0.17 * vis;
      const c = 2 * zeta * Math.sqrt(k);
      const rest = reduce.current ? 0 : give;
      for (let n = Math.ceil(dt / H), h = dt / n; n > 0; n -= 1) {
        s.v = s.v * Math.exp(-c * h) + k * (s.L - s.x) * h;
        s.x += s.v * h;
        if (s.x > 100) {
          s.x = 100;
          s.v = -s.v * rest;
        } else if (s.x < 0) {
          s.x = 0;
          s.v = -s.v * rest;
        }
      }
      if (!grip.current && Math.abs(s.L - s.x) < REST_POS && Math.abs(s.v) < REST_VEL) {
        s.x = s.L;
        s.v = 0;
      }
    }
    paint();
    const parked = !grip.current && s.x === s.L && s.v === 0;
    if (parked) {
      s.raf = 0;
      s.last = 0;
    } else {
      s.raf = requestAnimationFrame(tick);
    }
  };
  const wake = () => {
    if (!sim.current.raf) sim.current.raf = requestAnimationFrame(tick);
  };
  const setLevel = (L, instant) => {
    const s = sim.current;
    s.L = clamp(L, 0, 100);
    if (instant) {
      s.x = s.L;
      s.v = 0;
    }
    say();
    wake();
  };

  useLayoutEffect(() => {
    if (value === undefined) return;
    if (grip.current && Math.round(sim.current.L) === value) return;
    setLevel(value, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useLayoutEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      reduce.current = mq.matches;
    };
    sync();
    mq.addEventListener('change', sync);
    say();
    paint();
    const s = sim.current;
    return () => {
      mq.removeEventListener('change', sync);
      cancelAnimationFrame(s.raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    paint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, tilt, showValue, interactive, disabled]);

  const levelAt = (clientY, g) =>
    clamp(((g.rect.bottom - clientY) / g.scale / (root.current?.offsetHeight || g.rect.height)) * 100, 0, 100);
  const report = () => {
    const g = grip.current;
    const n = Math.round(sim.current.L);
    if (g && n !== g.sent) {
      g.sent = n;
      live.current.onChange?.(n);
    }
  };

  const down = e => {
    if (!interactive || disabled || grip.current || e.button !== 0) return;
    const el = root.current;
    const rect = el.getBoundingClientRect();
    const scale = rect.height / (el.offsetHeight || rect.height) || 1;
    const markerY = rect.top + ((100 - sim.current.L) / 100) * rect.height;
    const g = {
      id: e.pointerId,
      rect,
      scale,
      band: Math.abs(e.clientY - markerY) <= BAND * scale,
      grab: null,
      at: sim.current.L,
      sent: NaN
    };
    grip.current = g;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {}
    setHeld(true);
    if (g.band) {
      wake();
    } else {
      setLevel(levelAt(e.clientY, g));
      report();
    }
  };
  const move = e => {
    const g = grip.current;
    if (!g || g.id !== e.pointerId) return;
    const at = levelAt(e.clientY, g);
    if (g.band && g.grab === null) {
      g.grab = sim.current.L - at;
      return;
    }
    setLevel(at + (g.grab ?? 0));
    report();
  };
  const up = (e, reason) => {
    const g = grip.current;
    if (!g || g.id !== e.pointerId) return;
    grip.current = null;
    try {
      root.current?.releasePointerCapture(e.pointerId);
    } catch {}
    setHeld(false);
    if (reason === 'escape') {
      setLevel(g.at);
      live.current.onChange?.(Math.round(g.at));
    } else if (live.current.value !== undefined && Math.round(sim.current.L) !== live.current.value) {
      setLevel(live.current.value);
    }
    wake();
  };
  const key = e => {
    if (!interactive || disabled) return;
    if (e.key === 'Escape') {
      if (grip.current) up({ pointerId: grip.current.id }, 'escape');
      return;
    }
    const L = sim.current.L;
    const d = e.shiftKey ? BIG : STEP;
    const next = {
      ArrowUp: L + d,
      ArrowRight: L + d,
      ArrowDown: L - d,
      ArrowLeft: L - d,
      PageUp: L + BIG,
      PageDown: L - BIG,
      Home: 0,
      End: 100
    }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setLevel(next, true);
    live.current.onChange?.(Math.round(sim.current.L));
  };

  const r = Math.min(radius, width / 2, height / 2);
  const label = `${Math.round(start)}${unit}`;

  return (
    <div
      ref={root}
      className={`slosh-gauge${className ? ` ${className}` : ''}`}
      role={interactive ? 'slider' : 'meter'}
      tabIndex={interactive && !disabled ? 0 : undefined}
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(start)}
      aria-orientation={interactive ? 'vertical' : undefined}
      aria-disabled={disabled || undefined}
      data-interactive={interactive ? 'true' : 'false'}
      data-held={held ? 'true' : 'false'}
      data-disabled={disabled ? 'true' : 'false'}
      style={{
        '--sg-w': `${width}px`,
        '--sg-h': `${height}px`,
        '--sg-r': `${r}px`,
        '--sg-glass': glassColor,
        '--sg-liquid': liquidColor,
        '--sg-on-liquid': onColor(liquidColor),
        '--sg-ticks': ticks,
        '--sg-font': `${clamp(Math.round(width * 0.16), 12, 20)}px`
      }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={e => up(e)}
      onPointerCancel={e => up(e, 'cancel')}
      onLostPointerCapture={e => up(e, 'cancel')}
      onKeyDown={key}
    >
      {showValue ? (
        <span ref={textA} className="slosh-gauge__value" aria-hidden="true">
          {label}
        </span>
      ) : null}
      <div ref={liquid} className="slosh-gauge__liquid" aria-hidden="true">
        {showValue ? (
          <span ref={textB} className="slosh-gauge__value">
            {label}
          </span>
        ) : null}
      </div>
      {ticks > 0 ? <div className="slosh-gauge__ticks" aria-hidden="true" /> : null}
      {interactive && !disabled ? <div ref={marker} className="slosh-gauge__marker" aria-hidden="true" /> : null}
    </div>
  );
}
