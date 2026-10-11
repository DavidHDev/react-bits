'use client';

import { useEffect, useRef, useState, type CSSProperties, type FocusEvent, type ReactNode } from 'react';

const CARD =
  'group relative grid place-items-center w-[300px] h-[400px] overflow-hidden rounded-[var(--pixel-card-radius,24px)] isolate outline-none select-none [-webkit-tap-highlight-color:transparent] [&>:not(canvas):not([data-rim])]:relative [&>:not(canvas):not([data-rim])]:z-[1]';

const SURFACE: Record<Tone, string> = {
  dark: 'bg-[linear-gradient(180deg,#17151c_0%,#0f0e13_100%)] shadow-[0_24px_48px_-24px_rgba(0,0,0,0.85),0_8px_18px_-10px_rgba(0,0,0,0.6)] focus-visible:shadow-[0_24px_48px_-24px_rgba(0,0,0,0.85),0_8px_18px_-10px_rgba(0,0,0,0.6),0_0_0_3px_rgba(127,127,140,0.45)]',
  light:
    'bg-[linear-gradient(180deg,#ffffff_0%,#f6f6f8_100%)] shadow-[0_24px_48px_-26px_rgba(24,24,27,0.32),0_8px_18px_-12px_rgba(24,24,27,0.18)] focus-visible:shadow-[0_24px_48px_-26px_rgba(24,24,27,0.32),0_8px_18px_-12px_rgba(24,24,27,0.18),0_0_0_3px_rgba(127,127,140,0.45)]'
};

const RIM: Record<Tone, string> = {
  dark: 'pointer-events-none absolute inset-0 z-[2] rounded-[inherit] transition-shadow duration-[260ms] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.06)] group-data-[active]:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16),inset_0_1px_0_rgba(255,255,255,0.06)]',
  light:
    'pointer-events-none absolute inset-0 z-[2] rounded-[inherit] transition-shadow duration-[260ms] shadow-[inset_0_0_0_1px_rgba(24,24,27,0.08),inset_0_1px_0_rgba(255,255,255,1)] group-data-[active]:shadow-[inset_0_0_0_1px_rgba(24,24,27,0.16),inset_0_1px_0_rgba(255,255,255,1)]'
};

export interface PixelCardProps {
  variant?: 'default' | 'blue' | 'yellow' | 'pink';
  colors?: string | string[];
  gap?: number;
  speed?: number;
  pixelSize?: number;
  shape?: 'square' | 'circle' | 'diamond';
  origin?: 'center' | 'pointer';
  revealDuration?: number;
  spotlight?: number;
  glow?: number;
  glowColor?: string;
  opacity?: number;
  fade?: number;
  trigger?: 'hover' | 'click' | 'always';
  clickPulse?: boolean;
  intro?: boolean;
  introDelay?: number;
  noFocus?: boolean;
  theme?: 'dark' | 'light';
  radius?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

type Tone = 'dark' | 'light';

interface VariantConfig {
  gap: number;
  speed: number;
  colors: Record<Tone, string[]>;
  glow: Record<Tone, string>;
  noFocus: boolean;
}

interface Settings {
  colors: string[];
  gap: number;
  speed: number;
  pixelSize: number;
  shape: number;
  origin: string;
  revealDuration: number;
  spotlight: number;
  glow: number;
  glowColor: number[];
  opacity: number;
  fade: number;
  trigger: string;
  clickPulse: boolean;
  intro: boolean;
  introDelay: number;
}

interface Pulse {
  x: number;
  y: number;
  radius: number;
  power: number;
}

interface Engine {
  onFocus: (event: FocusEvent<HTMLDivElement>) => void;
  onBlur: (event: FocusEvent<HTMLDivElement>) => void;
  wake: () => void;
  sync: () => void;
}

const VARIANTS: Record<string, VariantConfig> = {
  default: {
    gap: 5,
    speed: 35,
    colors: { dark: ['#f8fafc', '#f1f5f9', '#cbd5e1'], light: ['#18181b', '#52525b', '#a1a1aa'] },
    glow: { dark: '#cbd5e1', light: '#71717a' },
    noFocus: false
  },
  blue: {
    gap: 10,
    speed: 25,
    colors: { dark: ['#e0f2fe', '#7dd3fc', '#0ea5e9'], light: ['#0c4a6e', '#0369a1', '#0284c7'] },
    glow: { dark: '#0ea5e9', light: '#0284c7' },
    noFocus: false
  },
  yellow: {
    gap: 3,
    speed: 20,
    colors: { dark: ['#fef08a', '#fde047', '#eab308'], light: ['#713f12', '#a16207', '#ca8a04'] },
    glow: { dark: '#eab308', light: '#ca8a04' },
    noFocus: false
  },
  pink: {
    gap: 6,
    speed: 80,
    colors: { dark: ['#fecdd3', '#fda4af', '#e11d48'], light: ['#831843', '#be123c', '#e11d48'] },
    glow: { dark: '#e11d48', light: '#be123c' },
    noFocus: true
  }
};

const SHAPES: Record<string, number> = { square: 0, circle: 1, diamond: 2 };
const TRIGGERS = ['hover', 'click', 'always'];
const APPEAR = 0.26;
const EXIT = 0.22;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

const easeOutBack = (t: number) => {
  const c = 1.9;
  const u = t - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
};

const toList = (value: string | string[] | undefined): string[] =>
  (Array.isArray(value) ? value : String(value ?? '').split(',')).map(color => color.trim()).filter(Boolean);

const toRgb = (() => {
  let context: CanvasRenderingContext2D | null = null;
  return (color: string): number[] => {
    if (typeof document === 'undefined') return [255, 255, 255];
    if (!context) {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      context = canvas.getContext('2d', { willReadFrequently: true });
    }
    if (!context) return [255, 255, 255];
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = '#fff';
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
    return [r, g, b];
  };
})();

export default function PixelCard({
  variant = 'default',
  colors,
  gap,
  speed,
  pixelSize = 2,
  shape = 'square',
  origin = 'center',
  revealDuration = 600,
  spotlight = 0.5,
  glow = 0.5,
  glowColor,
  opacity = 1,
  fade = 0,
  trigger = 'hover',
  clickPulse = true,
  intro = true,
  introDelay = 0,
  noFocus,
  theme = 'dark',
  radius = 24,
  className = '',
  style,
  children
}: PixelCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const settingsRef = useRef<Settings>(null as unknown as Settings);
  const [active, setActive] = useState(false);

  const tone: Tone = theme === 'light' ? 'light' : 'dark';
  const preset = VARIANTS[variant] || VARIANTS.default;
  const palette = colors ? toList(colors) : preset.colors[tone];
  const focusOff = noFocus ?? preset.noFocus;

  settingsRef.current = {
    colors: palette.length ? palette : preset.colors[tone],
    gap: Math.max(2, Number(gap ?? preset.gap) || preset.gap),
    speed: clamp(Number(speed ?? preset.speed) || 0, 0, 100),
    pixelSize: Math.max(0.5, pixelSize),
    shape: SHAPES[shape] ?? 0,
    origin,
    revealDuration: Math.max(50, revealDuration),
    spotlight: clamp(spotlight, 0, 1),
    glow: clamp(glow, 0, 1),
    glowColor: toRgb(glowColor || preset.glow[tone]),
    opacity: clamp(opacity, 0, 1),
    fade: clamp(fade, 0, 1),
    trigger: TRIGGERS.includes(trigger) ? trigger : 'hover',
    clickPulse,
    intro,
    introDelay: Math.max(0, introDelay)
  };

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    const state = {
      alive: true,
      raf: 0,
      last: 0,
      time: 0,
      visible: true,
      width: 0,
      height: 0,
      ratio: 1,
      key: '',
      count: 0,
      x: new Float32Array(0),
      y: new Float32Array(0),
      tint: new Uint8Array(0),
      size: new Float32Array(0),
      phase: new Float32Array(0),
      rate: new Float32Array(0),
      jitter: new Float32Array(0),
      presence: new Float32Array(0),
      delay: new Float32Array(0),
      mask: new Float32Array(0),
      maskKey: '',
      mode: '',
      active: false,
      changedAt: 0,
      originX: 0,
      originY: 0,
      maxDistance: 1,
      pointerX: 0,
      pointerY: 0,
      spotX: 0,
      spotY: 0,
      spotVX: 0,
      spotVY: 0,
      spotPower: 0,
      hovering: false,
      pulses: [] as Pulse[],
      dt: 1 / 60,
      releaseAt: -1,
      introAt: -1
    };

    const build = () => {
      const s = settingsRef.current;
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const key = [width, height, ratio, s.gap, s.pixelSize, s.colors.join(',')].join('|');
      if (key === state.key) return;
      state.key = key;
      state.width = width;
      state.height = height;
      state.ratio = ratio;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);

      const columns = Math.floor((width - 1) / s.gap) + 1;
      const rows = Math.floor((height - 1) / s.gap) + 1;
      const offsetX = (width - (columns - 1) * s.gap) / 2;
      const offsetY = (height - (rows - 1) * s.gap) / 2;
      const count = columns * rows;
      const previous = state.presence;
      state.count = count;
      state.x = new Float32Array(count);
      state.y = new Float32Array(count);
      state.tint = new Uint8Array(count);
      state.size = new Float32Array(count);
      state.phase = new Float32Array(count);
      state.rate = new Float32Array(count);
      state.jitter = new Float32Array(count);
      state.presence = new Float32Array(count);
      state.delay = new Float32Array(count);
      let i = 0;
      for (let column = 0; column < columns; column++) {
        for (let row = 0; row < rows; row++) {
          state.x[i] = offsetX + column * s.gap;
          state.y[i] = offsetY + row * s.gap;
          state.tint[i] = Math.floor(Math.random() * s.colors.length);
          state.size[i] = s.pixelSize * (0.25 + Math.random() * 0.75);
          state.phase[i] = Math.random() * Math.PI * 2;
          state.rate[i] = 0.55 + Math.random() * 0.9;
          state.jitter[i] = Math.random();
          if (previous.length) state.presence[i] = previous[Math.min(i, previous.length - 1)];
          i++;
        }
      }
      state.maxDistance = Math.hypot(width, height);
      schedule();
    };

    const schedule = () => {
      const s = settingsRef.current;
      const span = s.revealDuration / 1000;
      let far = 1;
      for (let i = 0; i < state.count; i++) {
        far = Math.max(far, Math.hypot(state.x[i] - state.originX, state.y[i] - state.originY));
      }
      state.maxDistance = far;
      for (let i = 0; i < state.count; i++) {
        const distance = Math.hypot(state.x[i] - state.originX, state.y[i] - state.originY) / far;
        state.delay[i] = state.active
          ? distance * span * 0.82 + state.jitter[i] * span * 0.18
          : (1 - distance) * span * 0.45 + state.jitter[i] * span * 0.1;
      }
    };

    const setActiveState = (value: boolean, x?: number, y?: number) => {
      if (state.active === value) return;
      const s = settingsRef.current;
      state.active = value;
      state.changedAt = state.time;
      if (value) {
        const usePointer = s.origin === 'pointer' && x !== undefined && y !== undefined;
        state.originX = usePointer ? x : state.width / 2;
        state.originY = usePointer ? y : state.height / 2;
      }
      schedule();
      setActive(value);
      wake();
    };

    const draw = () => {
      const s = settingsRef.current;
      const { width, height, ratio } = state;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const maskKey = `${state.count}|${width}|${height}|${s.fade}`;
      if (state.maskKey !== maskKey) {
        state.maskKey = maskKey;
        state.mask = new Float32Array(state.count);
        const near = Math.min(width, height) * 0.05;
        const far = Math.min(width, height) * 0.42;
        for (let i = 0; i < state.count; i++) {
          const edge = Math.min(state.x[i], width - state.x[i], state.y[i], height - state.y[i]);
          const t = clamp((edge - near) / (far - near), 0, 1);
          state.mask[i] = 1 - s.fade * t * t * t * (t * (t * 6 - 15) + 10);
        }
      }

      let presenceSum = 0;
      const elapsed = state.time - state.changedAt;
      const appearStep = state.dt / APPEAR;
      const exitStep = state.dt / EXIT;
      for (let i = 0; i < state.count; i++) {
        const current = state.presence[i];
        const ready = elapsed >= state.delay[i] || reduce;
        const target = state.active ? (ready ? 1 : 0) : ready ? 0 : current;
        if (reduce) state.presence[i] = target;
        else if (target > current) state.presence[i] = Math.min(1, current + appearStep);
        else if (target < current) state.presence[i] = Math.max(0, current - exitStep);
        presenceSum += state.presence[i];
      }
      const presenceAvg = state.count ? presenceSum / state.count : 0;

      if (s.glow > 0 && presenceAvg > 0.001) {
        const [r, g, b] = s.glowColor;
        const cx = state.spotPower > 0.01 ? state.spotX : state.originX;
        const cy = state.spotPower > 0.01 ? state.spotY : state.originY;
        const reach = Math.max(width, height) * 0.85;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, reach);
        const strength = s.glow * s.opacity * 0.32 * Math.min(1, presenceAvg * 1.4);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${strength})`);
        gradient.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, ${strength * 0.35})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      const spotRadius = Math.min(width, height) * 0.38 + 30;
      const spotStrength = s.spotlight * state.spotPower;
      const pulses = state.pulses;
      const twinkle = reduce ? 0 : smoothstep(0, 100, s.speed) > 0 ? 1 : 0;
      const frequency = (s.speed / 35) * 1.35;

      for (let color = 0; color < s.colors.length; color++) {
        ctx.fillStyle = s.colors[color];
        for (let i = 0; i < state.count; i++) {
          if (state.tint[i] !== color) continue;
          const presence = state.presence[i];
          if (presence <= 0.002) continue;
          const x = state.x[i];
          const y = state.y[i];
          let size = state.size[i];
          let alpha = 0.5 + presence * 0.38;
          if (twinkle) {
            const wave = Math.sin(state.phase[i] + state.time * frequency * state.rate[i]);
            size *= 0.62 + 0.38 * wave;
            alpha += 0.12 * wave + (state.jitter[i] > 0.92 ? 0.35 * Math.max(0, wave) : 0);
          }
          size *= easeOutBack(presence);
          const flash = presence < 1 && state.active ? Math.sin(presence * Math.PI) : 0;
          size *= 1 + flash * 0.9;
          alpha += flash * 0.6;
          if (spotStrength > 0.001) {
            const near = smoothstep(spotRadius, 0, Math.hypot(x - state.spotX, y - state.spotY));
            size *= 1 + spotStrength * near * near * 2.4;
            alpha += spotStrength * near * 0.45;
          }
          alpha = Math.min(1, alpha) * state.mask[i] * s.opacity;
          if (alpha <= 0.004) continue;
          for (let p = 0; p < pulses.length; p++) {
            const pulse = pulses[p];
            const band = (Math.hypot(x - pulse.x, y - pulse.y) - pulse.radius) / 26;
            const wave = Math.exp(-band * band) * pulse.power;
            size *= 1 + wave * 1.4;
            alpha = Math.min(1, alpha + wave * 0.5);
          }
          if (size <= 0.05) continue;
          ctx.globalAlpha = alpha;
          if (s.shape === 1) {
            ctx.beginPath();
            ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (s.shape === 2) {
            const half = size * 0.62;
            ctx.beginPath();
            ctx.moveTo(x, y - half);
            ctx.lineTo(x + half, y);
            ctx.lineTo(x, y + half);
            ctx.lineTo(x - half, y);
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.fillRect(x - size * 0.5, y - size * 0.5, size, size);
          }
        }
      }
      ctx.globalAlpha = 1;
      return presenceSum;
    };

    const frame = (now: number) => {
      state.raf = 0;
      if (!state.alive) return;
      const s = settingsRef.current;
      const dt = state.last ? Math.min(0.05, (now - state.last) / 1000) : 1 / 60;
      state.last = now;
      state.dt = dt;
      state.time += dt;
      build();

      if (state.introAt >= 0 && state.time >= state.introAt) {
        state.introAt = -1;
        if (!state.active) {
          setActiveState(true);
          if (state.mode !== 'always') state.releaseAt = state.time + s.revealDuration / 1000 + 0.7;
        }
      }

      if (state.releaseAt >= 0 && state.time >= state.releaseAt && !state.hovering && state.mode !== 'always') {
        state.releaseAt = -1;
        setActiveState(false);
      }

      const want = state.hovering && !reduce ? 1 : 0;
      state.spotPower += (want - state.spotPower) * (1 - Math.exp(-(want ? 6 : 3) * dt));
      const stiffness = 120;
      const damping = 2 * Math.sqrt(stiffness) * 0.9;
      state.spotVX += (stiffness * (state.pointerX - state.spotX) - damping * state.spotVX) * dt;
      state.spotVY += (stiffness * (state.pointerY - state.spotY) - damping * state.spotVY) * dt;
      state.spotX += state.spotVX * dt;
      state.spotY += state.spotVY * dt;

      const pulseSpeed = state.maxDistance / Math.max(0.35, (s.revealDuration / 1000) * 0.9);
      state.pulses = state.pulses.filter(pulse => {
        pulse.radius += pulseSpeed * dt;
        pulse.power = Math.max(0, 1 - pulse.radius / (state.maxDistance + 40));
        return pulse.power > 0;
      });

      const presence = draw();
      const settling =
        state.active ||
        state.introAt >= 0 ||
        presence > 0 ||
        state.pulses.length > 0 ||
        state.spotPower > 0.002 ||
        Math.abs(state.spotVX) + Math.abs(state.spotVY) > 0.5;
      if (settling && state.visible) state.raf = requestAnimationFrame(frame);
      else state.last = 0;
    };

    const wake = () => {
      if (!state.raf && state.alive && state.visible) state.raf = requestAnimationFrame(frame);
    };

    const local = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      return [event.clientX - rect.left, event.clientY - rect.top];
    };

    const onEnter = (event: PointerEvent) => {
      const [x, y] = local(event);
      state.hovering = event.pointerType !== 'touch';
      state.pointerX = x;
      state.pointerY = y;
      if (state.spotPower < 0.01) {
        state.spotX = x;
        state.spotY = y;
        state.spotVX = 0;
        state.spotVY = 0;
      }
      if (state.mode === 'hover') {
        state.releaseAt = -1;
        state.introAt = -1;
        setActiveState(true, x, y);
      }
      wake();
    };

    const onMove = (event: PointerEvent) => {
      const [x, y] = local(event);
      state.pointerX = x;
      state.pointerY = y;
      wake();
    };

    const onLeave = (event: PointerEvent) => {
      state.hovering = false;
      if (state.mode === 'hover') {
        if (event.pointerType === 'touch') state.releaseAt = state.time + 1.2;
        else setActiveState(false);
      }
      wake();
    };

    const onDown = (event: PointerEvent) => {
      const [x, y] = local(event);
      if (state.mode === 'click') {
        state.introAt = -1;
        state.releaseAt = -1;
        setActiveState(!state.active, x, y);
      } else if (!state.active) {
        setActiveState(true, x, y);
      }
      if (settingsRef.current.clickPulse && !reduce && state.active) {
        state.pulses.push({ x, y, radius: 0, power: 1 });
      }
      wake();
    };

    const onOutside = (event: PointerEvent) => {
      if (state.mode === 'click' && state.active && !container.contains(event.target as Node)) setActiveState(false);
    };

    const onKey = (event: KeyboardEvent) => {
      if (state.mode !== 'click' || event.target !== container) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      setActiveState(!state.active);
    };

    const onFocus = (event: FocusEvent<HTMLDivElement>) => {
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
      if (state.mode === 'hover') setActiveState(true);
    };

    const onBlur = (event: FocusEvent<HTMLDivElement>) => {
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
      if (state.mode === 'hover' && !state.hovering) setActiveState(false);
    };

    const sync = () => {
      const mode = settingsRef.current.trigger;
      if (state.mode === mode) return;
      const previous = state.mode;
      state.mode = mode;
      if (!previous) return;
      if (mode === 'always') {
        state.releaseAt = -1;
        setActiveState(true);
      } else if (previous === 'always' && !state.hovering) {
        setActiveState(false);
      }
    };

    container.addEventListener('pointerenter', onEnter);
    container.addEventListener('pointermove', onMove);
    container.addEventListener('pointerleave', onLeave);
    container.addEventListener('pointerdown', onDown);
    container.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onOutside);

    const resizeObserver = new ResizeObserver(() => {
      build();
      wake();
    });
    resizeObserver.observe(container);

    let introStarted = false;
    const visibility = new IntersectionObserver(entries => {
      state.visible = entries.some(entry => entry.isIntersecting);
      const s = settingsRef.current;
      if (state.visible && !introStarted && (s.trigger === 'always' || (s.intro && !reduce))) {
        introStarted = true;
        build();
        state.introAt = state.time + s.introDelay / 1000;
      }
      if (state.visible) wake();
    });
    visibility.observe(container);

    engineRef.current = { onFocus, onBlur, wake, sync };
    state.mode = settingsRef.current.trigger;
    build();
    state.pointerX = state.width / 2;
    state.pointerY = state.height / 2;
    state.spotX = state.pointerX;
    state.spotY = state.pointerY;
    state.originX = state.width / 2;
    state.originY = state.height / 2;

    return () => {
      state.alive = false;
      cancelAnimationFrame(state.raf);
      resizeObserver.disconnect();
      visibility.disconnect();
      container.removeEventListener('pointerenter', onEnter);
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerleave', onLeave);
      container.removeEventListener('pointerdown', onDown);
      container.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onOutside);
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.sync();
    engineRef.current?.wake();
  });

  return (
    <div
      ref={containerRef}
      className={`${CARD} ${SURFACE[tone]} ${className}`.trim()}
      data-theme={tone}
      data-active={active || undefined}
      style={{ '--pixel-card-radius': `${radius}px`, ...style } as CSSProperties}
      onFocus={focusOff ? undefined : event => engineRef.current?.onFocus(event)}
      onBlur={focusOff ? undefined : event => engineRef.current?.onBlur(event)}
      tabIndex={focusOff ? -1 : 0}
    >
      <canvas
        className="pointer-events-none absolute inset-0 z-0 block h-full w-full"
        ref={canvasRef}
        aria-hidden="true"
      />
      {children}
      <span data-rim aria-hidden="true" className={RIM[tone]} />
    </div>
  );
}
