'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import './ParticleText.css';

export interface ParticleTextProps {
  text?: string;
  particleSize?: number;
  density?: number;
  color?: string;
  highlightColor?: string;
  highlightMode?: 'motion' | 'gradient';
  shape?: 'circle' | 'square' | 'line';
  intro?: 'gather' | 'rain' | 'spiral' | 'scan';
  scatter?: number;
  gatherDuration?: number;
  stagger?: number;
  clickBurst?: boolean;
  burstStrength?: number;
  pointerRepel?: number;
  repelRadius?: number;
  idleDrift?: number;
  trigger?: 'mount' | 'hover' | 'click';
  fontSize?: number | string;
  fontWeight?: number | string;
  fontFamily?: string;
  glow?: boolean;
  className?: string;
  style?: CSSProperties;
}

type Settings = Required<Omit<ParticleTextProps, 'className' | 'style'>>;
type Intro = Settings['intro'];
type Shape = Settings['shape'];
type Rgb = { r: number; g: number; b: number };
type Target = { x: number; y: number; alpha: number };
type Particle = {
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  weight: number;
  tone: number;
  seed: number;
  depth: number;
  delay: number;
  ox: number;
  oy: number;
  vx: number;
  vy: number;
  angle: number;
  length: number;
  radius: number;
  heading: number;
  startRadius: number;
  swirl: number;
};

const INHERIT = /^(currentcolor|inherit)$/i;
const TONES = 12;
const FADES = 8;
const HEAT_RANGE = 36;
const HEAT_DEADZONE = 3;
const TAU = Math.PI * 2;
const REST_ANGLE = -Math.PI / 4;
const BURST_SPRING = 18;
const BURST_DAMPING = 7.5;
const SCAN_FADE = [0, 0.12, 0.42, 0.78, 1, 0.78, 0.42, 0.12, 0];
const FADE_FLOOR: Record<Intro, number> = { gather: 0, rain: 0.55, spiral: 0.45, scan: 0.35 };

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
const easeInFall = (t: number): number => Math.pow(t, 1.7);
const easeInOutCubic = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const fadeAlpha = (level: number): number => 0.35 + (0.65 * level) / (FADES - 1);
const wrapHalfTurn = (angle: number): number => (((angle % Math.PI) + Math.PI * 1.5) % Math.PI) - Math.PI / 2;

const resolveFontSize = (
  value: number | string,
  container: HTMLDivElement,
  fontWeight: number | string,
  fontFamily: string
): number => {
  if (typeof value === 'number') return value;

  const probe = document.createElement('span');
  probe.textContent = 'M';
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.fontSize = value;
  probe.style.fontWeight = String(fontWeight);
  probe.style.fontFamily = fontFamily;
  container.appendChild(probe);
  const size = parseFloat(window.getComputedStyle(probe).fontSize) || 96;
  probe.remove();
  return size;
};

const waitForFonts = async (font: string): Promise<void> => {
  if (!('fonts' in document)) return;

  try {
    await document.fonts.load(font);
  } catch {}

  await document.fonts.ready;
};

const ParticleText = ({
  text = 'React Bits',
  particleSize = 2,
  density = 4,
  color = 'currentColor',
  highlightColor = '#ff5a36',
  highlightMode = 'motion',
  shape = 'circle',
  intro = 'gather',
  scatter = 180,
  gatherDuration = 1600,
  stagger = 420,
  clickBurst = true,
  burstStrength = 1,
  pointerRepel = 40,
  repelRadius = 120,
  idleDrift = 0.7,
  trigger = 'mount',
  fontSize = 'clamp(3rem, 12vw, 8rem)',
  fontWeight = 800,
  fontFamily = 'inherit',
  glow = true,
  className = '',
  style
}: ParticleTextProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const settingsRef = useRef<Settings | null>(null);
  const wakeRef = useRef<() => void>(() => {});

  useEffect(() => {
    settingsRef.current = {
      text,
      particleSize,
      density,
      color,
      highlightColor,
      highlightMode,
      shape,
      intro,
      scatter,
      gatherDuration,
      stagger,
      clickBurst,
      burstStrength,
      pointerRepel,
      repelRadius,
      idleDrift,
      trigger,
      fontSize,
      fontWeight,
      fontFamily,
      glow
    };
    wakeRef.current();
  });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const layer = document.createElement('canvas');
    const layerCtx = layer.getContext('2d');
    const probe = document.createElement('canvas');
    probe.width = 1;
    probe.height = 1;
    const probeCtx = probe.getContext('2d', { willReadFrequently: true });
    if (!container || !canvas || !ctx || !layerCtx || !probeCtx) return undefined;

    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let reducedMotion = !!motionQuery?.matches;
    let particles: Particle[] = [];
    let raf = 0;
    let sampleFrame = 0;
    let buildId = 0;
    let introPending = true;
    let sampledKey = '';
    let sampledText = '';
    let requestedSize = '';
    let gathering = false;
    let gatherStart = 0;
    let introMode: Intro = 'gather';
    let bursting = false;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let last = 0;
    let visible = true;
    let alive = true;
    let colorKey = '';
    let palette: string[] = [];
    let glowColor = '#000000';
    let accent: Rgb = { r: 0, g: 0, b: 0 };
    const bounds = { left: 0, right: 0, top: 0, bottom: 0 };
    const swirl = { x: 0, y: 0, aspect: 1 };
    const scan = { from: 0, to: 0, top: 0, bottom: 0, duration: 1 };
    const buckets: Particle[][] = Array.from({ length: TONES * FADES }, () => []);
    const pointer = { active: false, x: 0, y: 0, smoothX: 0, smoothY: 0 };

    const family = (s: Settings): string =>
      !s.fontFamily || s.fontFamily === 'inherit'
        ? window.getComputedStyle(container).fontFamily || 'sans-serif'
        : s.fontFamily;
    const layoutKey = (s: Settings) => [s.text, s.fontSize, s.fontWeight, family(s), s.density].join('|');
    const sizeKey = () => {
      const rect = container.getBoundingClientRect();
      return `${Math.floor(rect.width)}x${Math.floor(rect.height)}@${Math.min(window.devicePixelRatio || 1, 2)}`;
    };

    const toRgb = (value: string): Rgb => {
      probeCtx.clearRect(0, 0, 1, 1);
      probeCtx.fillStyle = '#000000';
      probeCtx.fillStyle = value;
      probeCtx.fillRect(0, 0, 1, 1);
      const [r, g, b] = probeCtx.getImageData(0, 0, 1, 1).data;
      return { r, g, b };
    };

    const ensureColors = (s: Settings) => {
      const current = window.getComputedStyle(container).color || '#000000';
      const pick = (value: string) => (!value || INHERIT.test(String(value).trim()) ? current : value);
      const base = pick(s.color);
      const highlight = pick(s.highlightColor);
      const key = `${base}|${highlight}`;
      if (key === colorKey) return;
      colorKey = key;
      const from = toRgb(base);
      accent = toRgb(highlight);
      glowColor = `rgb(${accent.r}, ${accent.g}, ${accent.b})`;
      palette = Array.from({ length: TONES }, (_, i) => {
        const t = i / (TONES - 1);
        const r = Math.round(from.r + (accent.r - from.r) * t);
        const g = Math.round(from.g + (accent.g - from.g) * t);
        const b = Math.round(from.b + (accent.b - from.b) * t);
        return `rgb(${r}, ${g}, ${b})`;
      });
    };

    const travelTime = (s: Settings, particle: Particle): number => {
      if (reducedMotion) return 1;
      if (introMode === 'scan') return s.gatherDuration * 0.4;
      if (introMode === 'rain') return s.gatherDuration * (0.45 + particle.depth * 0.3);
      return s.gatherDuration;
    };

    const startIntro = (initial: boolean) => {
      const s = settingsRef.current;
      if (!particles.length || !s) return;
      introMode = s.intro;
      const spread = reducedMotion ? 0 : s.scatter;
      const tall = Math.max(1, bounds.bottom - bounds.top);
      swirl.x = (bounds.left + bounds.right) / 2;
      swirl.y = (bounds.top + bounds.bottom) / 2;
      swirl.aspect = clamp(width / Math.max(1, height), 1, 2.5);
      scan.from = bounds.left - 24;
      scan.to = bounds.right + 24;
      scan.top = bounds.top - tall * 0.3;
      scan.bottom = bounds.bottom + tall * 0.3;
      scan.duration = Math.max(200, s.gatherDuration * 0.8);
      let reach = 1;

      if (introMode === 'spiral') {
        for (const particle of particles) {
          const dx = particle.targetX - swirl.x;
          const dy = (particle.targetY - swirl.y) * swirl.aspect;
          particle.radius = Math.hypot(dx, dy);
          particle.heading = Math.atan2(dy, dx);
          reach = Math.max(reach, particle.radius);
        }
      }

      for (const particle of particles) {
        let delay = particle.seed * s.stagger;
        let startX;
        let startY;

        if (introMode === 'rain') {
          startX = particle.targetX + (particle.depth - 0.9) * 16;
          startY = -12 - particle.depth * 30 - particle.seed * height * 0.22;
          delay = particle.seed * s.stagger * 1.3;
        } else if (introMode === 'spiral') {
          particle.startRadius = particle.radius * (1.04 + particle.depth * 0.22) + spread * 0.3 * particle.seed;
          particle.swirl = (1.5 + 2.6 * (1 - particle.radius / reach)) * (0.85 + particle.seed * 0.3);
          const angle = particle.heading + particle.swirl;
          startX = swirl.x + Math.cos(angle) * particle.startRadius;
          startY = swirl.y + (Math.sin(angle) * particle.startRadius) / swirl.aspect;
          delay = particle.seed * s.stagger;
        } else if (introMode === 'scan') {
          const along = (particle.targetX - scan.from) / Math.max(1, scan.to - scan.from);
          startX = particle.targetX + 3 + particle.seed * 8;
          startY = scan.top + ((particle.seed * 7.31 + particle.depth * 3.7) % 1) * (scan.bottom - scan.top);
          delay = along * scan.duration + particle.seed * s.stagger * 0.15;
        } else {
          const angle = particle.seed * TAU;
          const distance = spread * (0.35 + particle.depth * 0.75);
          startX = particle.targetX + Math.cos(angle) * distance + (particle.seed - 0.5) * spread * 0.45;
          startY = particle.targetY + Math.sin(angle) * distance + (particle.depth - 0.9) * spread * 0.45;
        }

        particle.startX = startX;
        particle.startY = startY;
        particle.delay = reducedMotion ? 0 : delay;
        if (initial) {
          particle.x = startX;
          particle.y = startY;
        }
      }

      gatherStart = performance.now();
      gathering = true;
      wake();
    };

    const burst = (x: number, y: number) => {
      const s = settingsRef.current;
      if (!s || !particles.length) return;
      const strength = Math.max(0, Number(s.burstStrength) || 0);
      if (!strength) return;
      const radius = 90 + 70 * Math.sqrt(strength) + s.repelRadius * 0.25;

      for (const particle of particles) {
        const dx = particle.x - x;
        const dy = particle.y - y;
        const distance = Math.hypot(dx, dy);
        if (distance > radius) continue;
        const falloff = 1 - distance / radius;
        const power = 950 * strength * (0.2 + 0.8 * falloff * falloff) * (0.65 + particle.depth * 0.45);
        const angle = Math.atan2(dy, dx) + (particle.seed - 0.5) * 0.9;
        particle.vx += Math.cos(angle) * power;
        particle.vy += Math.sin(angle) * power;
      }

      bursting = true;
      wake();
    };

    const drawGroup = (target: CanvasRenderingContext2D, group: Particle[], base: number, shape: Shape) => {
      target.beginPath();
      if (shape === 'line') {
        for (const particle of group) {
          const dx = Math.cos(particle.angle) * particle.length * 0.5;
          const dy = Math.sin(particle.angle) * particle.length * 0.5;
          target.moveTo(particle.x - dx, particle.y - dy);
          target.lineTo(particle.x + dx, particle.y + dy);
        }
        target.stroke();
        return;
      }

      const square = shape === 'square';
      for (const particle of group) {
        const size = square ? base : Math.max(0.6, base * (0.75 + particle.weight * 0.45));
        if (square || size <= 2.1) {
          target.rect(particle.x - size / 2, particle.y - size / 2, size, size);
        } else {
          target.moveTo(particle.x + size / 2, particle.y);
          target.arc(particle.x, particle.y, size / 2, 0, TAU);
        }
      }
      target.fill();
    };

    const drawScan = (now: number, s: Settings): boolean => {
      const progress = (now - gatherStart) / scan.duration;
      if (introMode !== 'scan' || progress < 0 || progress > 1.3 || reducedMotion) return false;
      const x = scan.from + (scan.to - scan.from) * clamp(progress, 0, 1);
      const alpha = clamp(progress / 0.08, 0, 1) * clamp((1.3 - progress) / 0.3, 0, 1);
      const gradient = ctx.createLinearGradient(0, scan.top, 0, scan.bottom);
      SCAN_FADE.forEach((level, i) => {
        gradient.addColorStop(i / (SCAN_FADE.length - 1), `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${level})`);
      });
      ctx.globalAlpha = alpha * 0.85;
      ctx.fillStyle = gradient;
      if (s.glow) {
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 8 * dpr;
      }
      ctx.fillRect(x - 0.75, scan.top, 1.5, scan.bottom - scan.top);
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.globalAlpha = 1;
      return true;
    };

    const step = (now: number): boolean => {
      const s = settingsRef.current;
      if (!s) return false;
      const dt = last ? Math.min(0.05, Math.max(0, (now - last) / 1000)) : 1 / 60;
      last = now;
      ensureColors(s);

      const frames = Math.max(dt * 60, 0.001);
      const follow = reducedMotion ? 1 : 1 - Math.pow(0.78, frames);
      const chase = 1 - Math.pow(0.82, frames);
      const turn = 1 - Math.pow(0.72, frames);
      pointer.smoothX += (pointer.x - pointer.smoothX) * chase;
      pointer.smoothY += (pointer.y - pointer.smoothY) * chase;

      const repel = pointer.active && !reducedMotion && s.pointerRepel > 0 && s.repelRadius > 0;
      const drift = !reducedMotion && s.idleDrift > 0;
      const motionHeat = s.highlightMode !== 'gradient';
      const lines = s.shape === 'line';
      const floor = gathering ? (FADE_FLOOR[introMode] ?? 0) : 0;
      const time = now * 0.001;
      const sizeBase = Math.max(0.1, Number(s.particleSize) || 0);
      const restLength = Math.max(2, sizeBase * 0.8 + Math.max(2, Math.floor(Number(s.density) || 0)) * 0.7);
      let complete = true;
      let moving = false;
      let settling = false;

      for (const bucket of buckets) bucket.length = 0;

      for (const particle of particles) {
        let baseX = particle.targetX;
        let baseY = particle.targetY;
        let progress = 1;
        let hidden = false;

        if (gathering) {
          const local = (now - gatherStart - particle.delay) / Math.max(1, travelTime(s, particle));
          progress = clamp(local, 0, 1);
          if (introMode === 'scan' && local < 0) hidden = true;
          if (introMode === 'spiral') {
            const eased = easeInOutCubic(progress);
            const radius = particle.startRadius + (particle.radius - particle.startRadius) * eased;
            const angle = particle.heading + particle.swirl * (1 - eased);
            baseX = swirl.x + Math.cos(angle) * radius;
            baseY = swirl.y + (Math.sin(angle) * radius) / swirl.aspect;
          } else {
            const eased = introMode === 'rain' ? easeInFall(progress) : easeOutCubic(progress);
            baseX = particle.startX + (particle.targetX - particle.startX) * eased;
            baseY = particle.startY + (particle.targetY - particle.startY) * eased;
          }
          if (progress < 1) complete = false;
        } else if (drift) {
          baseX += Math.sin(time * 0.9 + particle.seed * 10) * s.idleDrift * particle.depth;
          baseY += Math.cos(time * 0.75 + particle.depth * 10) * s.idleDrift * particle.depth;
        }

        if (bursting) {
          particle.vx += (-BURST_SPRING * particle.ox - BURST_DAMPING * particle.vx) * dt;
          particle.vy += (-BURST_SPRING * particle.oy - BURST_DAMPING * particle.vy) * dt;
          particle.ox += particle.vx * dt;
          particle.oy += particle.vy * dt;
          if (
            Math.abs(particle.ox) + Math.abs(particle.oy) > 0.05 ||
            Math.abs(particle.vx) + Math.abs(particle.vy) > 1
          ) {
            settling = true;
          } else {
            particle.ox = 0;
            particle.oy = 0;
            particle.vx = 0;
            particle.vy = 0;
          }
          baseX += particle.ox;
          baseY += particle.oy;
        }

        if (repel) {
          const dx = baseX - pointer.smoothX;
          const dy = baseY - pointer.smoothY;
          const distance = Math.hypot(dx, dy);
          if (distance > 0 && distance < s.repelRadius) {
            const force = Math.pow(1 - distance / s.repelRadius, 2) * s.pointerRepel;
            baseX += (dx / distance) * force;
            baseY += (dy / distance) * force;
          }
        }

        const moveX = (baseX - particle.x) * follow;
        const moveY = (baseY - particle.y) * follow;
        particle.x += moveX;
        particle.y += moveY;
        if (Math.abs(moveX) + Math.abs(moveY) > 0.02) moving = true;

        if (lines) {
          const speed = Math.hypot(moveX, moveY) / frames;
          const aim = speed > 0.3 ? Math.atan2(moveY, moveX) : REST_ANGLE;
          const offset = wrapHalfTurn(aim - particle.angle);
          particle.angle += offset * turn;
          if (Math.abs(offset) > 0.01) moving = true;
          particle.length = restLength + Math.min(restLength * 4, speed * 1.6);
        }

        if (hidden) continue;

        const heat = motionHeat
          ? clamp(
              (Math.hypot(particle.x - particle.targetX, particle.y - particle.targetY) - HEAT_DEADZONE) / HEAT_RANGE,
              0,
              1
            )
          : particle.tone;
        const tone = Math.round(heat * (TONES - 1));
        const fade = Math.round((floor + (1 - floor) * progress) * (FADES - 1));
        buckets[fade * TONES + tone].push(particle);
      }

      if (gathering && complete) gathering = false;
      if (bursting && !settling) bursting = false;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const strokeWidth = Math.max(1, sizeBase * 0.65);
      if (lines) {
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
      }

      if (s.glow) {
        layerCtx.setTransform(1, 0, 0, 1, 0, 0);
        layerCtx.clearRect(0, 0, layer.width, layer.height);
        layerCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        layerCtx.fillStyle = glowColor;
        layerCtx.strokeStyle = glowColor;
        layerCtx.lineWidth = strokeWidth;
        layerCtx.lineCap = 'round';
        let lit = false;
        for (let fade = 0; fade < FADES; fade++) {
          for (let tone = 1; tone < TONES; tone++) {
            const group = buckets[fade * TONES + tone];
            if (!group.length) continue;
            layerCtx.globalAlpha = (tone / (TONES - 1)) * fadeAlpha(fade);
            drawGroup(layerCtx, group, sizeBase, s.shape);
            lit = true;
          }
        }
        layerCtx.globalAlpha = 1;
        if (lit) {
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = (3 + sizeBase * 1.5) * dpr;
          ctx.drawImage(layer, 0, 0, width, height);
          ctx.shadowBlur = 0;
          ctx.shadowColor = 'transparent';
        }
      }

      for (let fade = 0; fade < FADES; fade++) {
        ctx.globalAlpha = fadeAlpha(fade);
        for (let tone = 0; tone < TONES; tone++) {
          const group = buckets[fade * TONES + tone];
          if (!group.length) continue;
          if (lines) ctx.strokeStyle = palette[tone];
          else ctx.fillStyle = palette[tone];
          drawGroup(ctx, group, sizeBase, s.shape);
        }
      }
      ctx.globalAlpha = 1;

      const scanning = drawScan(now, s);

      return gathering || moving || repel || drift || bursting || scanning;
    };

    const frame = (now: number) => {
      raf = 0;
      if (!alive) return;
      const s = settingsRef.current;
      if (s) {
        const key = layoutKey(s);
        if (key !== sampledKey) {
          queueSample(s.text !== sampledText);
          sampledKey = key;
          sampledText = s.text;
        }
      }
      const busy = step(now);
      if (busy && visible && alive) raf = requestAnimationFrame(frame);
    };

    function wake(): void {
      if (raf || !visible || !alive) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    }
    wakeRef.current = wake;

    const sampleText = async (): Promise<void> => {
      const s = settingsRef.current;
      if (!s) return;
      const currentBuild = ++buildId;
      const rect = container.getBoundingClientRect();
      const nextWidth = Math.floor(rect.width);
      const nextHeight = Math.floor(rect.height);
      requestedSize = sizeKey();
      sampledKey = layoutKey(s);
      sampledText = s.text;

      if (nextWidth <= 0 || nextHeight <= 0) return;

      const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
      const resolvedFamily = family(s);
      let resolvedSize = resolveFontSize(s.fontSize, container, s.fontWeight, resolvedFamily);
      let font = `${s.fontWeight} ${resolvedSize}px ${resolvedFamily}`;

      await waitForFonts(font);
      if (currentBuild !== buildId || !alive) return;

      const offscreen = document.createElement('canvas');
      const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
      if (!offCtx) return;

      const content = String(s.text || ' ');
      const maxTextWidth = nextWidth * 0.92;
      offCtx.font = font;
      let metrics = offCtx.measureText(content);
      const measuredWidth = Math.max(1, metrics.width);
      if (measuredWidth > maxTextWidth) {
        resolvedSize = Math.max(18, resolvedSize * (maxTextWidth / measuredWidth));
        font = `${s.fontWeight} ${resolvedSize}px ${resolvedFamily}`;
        await waitForFonts(font);
        if (currentBuild !== buildId || !alive) return;
        offCtx.font = font;
        metrics = offCtx.measureText(content);
      }

      const left = Math.ceil(metrics.actualBoundingBoxLeft || 0);
      const right = Math.ceil(metrics.actualBoundingBoxRight || metrics.width);
      const ascent = Math.ceil(metrics.actualBoundingBoxAscent || resolvedSize * 0.78);
      const descent = Math.ceil(metrics.actualBoundingBoxDescent || resolvedSize * 0.22);
      const padding = Math.max(12, Math.ceil(resolvedSize * 0.08));
      const textWidth = Math.max(1, left + right);
      const textHeight = Math.max(1, ascent + descent);

      offscreen.width = textWidth + padding * 2;
      offscreen.height = textHeight + padding * 2;
      offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
      offCtx.font = font;
      offCtx.textAlign = 'left';
      offCtx.textBaseline = 'alphabetic';
      offCtx.fillStyle = '#ffffff';
      offCtx.fillText(content, padding - left, padding + ascent);

      const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
      const targets: Target[] = [];
      const sampleStep = Math.max(2, Math.floor(s.density));

      for (let y = 0; y < offscreen.height; y += sampleStep) {
        for (let x = 0; x < offscreen.width; x += sampleStep) {
          const alpha = imageData.data[(y * offscreen.width + x) * 4 + 3];
          if (alpha > 40) {
            targets.push({
              x: nextWidth / 2 - offscreen.width / 2 + x,
              y: nextHeight / 2 - offscreen.height / 2 + y,
              alpha: alpha / 255
            });
          }
        }
      }

      const maxParticles = Math.max(900, Math.min(5200, Math.floor((nextWidth * nextHeight) / 90)));
      const stride = Math.max(1, Math.ceil(targets.length / maxParticles));
      const selected = targets.filter((_, index) => index % stride === 0);
      const intro = introPending && !reducedMotion;
      introPending = false;

      width = nextWidth;
      height = nextHeight;
      dpr = nextDpr;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      layer.width = canvas.width;
      layer.height = canvas.height;

      bounds.left = Infinity;
      bounds.right = -Infinity;
      bounds.top = Infinity;
      bounds.bottom = -Infinity;
      for (const target of selected) {
        bounds.left = Math.min(bounds.left, target.x);
        bounds.right = Math.max(bounds.right, target.x);
        bounds.top = Math.min(bounds.top, target.y);
        bounds.bottom = Math.max(bounds.bottom, target.y);
      }
      if (!selected.length) {
        bounds.left = bounds.right = width / 2;
        bounds.top = bounds.bottom = height / 2;
      }

      particles = selected.map((target, index) => {
        const seed = ((index * 9301 + 49297) % 233280) / 233280;
        const depth = 0.45 + (((index * 233 + 97) % 1000) / 1000) * 0.9;

        return {
          x: target.x,
          y: target.y,
          startX: target.x,
          startY: target.y,
          targetX: target.x,
          targetY: target.y,
          weight: target.alpha,
          tone: clamp(target.x / Math.max(1, width) + (seed - 0.5) * 0.35, 0, 1),
          seed,
          depth,
          delay: 0,
          ox: 0,
          oy: 0,
          vx: 0,
          vy: 0,
          angle: REST_ANGLE,
          length: 0,
          radius: 0,
          heading: 0,
          startRadius: 0,
          swirl: 0
        };
      });
      bursting = false;

      if (!pointer.active) {
        pointer.x = width / 2;
        pointer.y = height / 2;
        pointer.smoothX = pointer.x;
        pointer.smoothY = pointer.y;
      }

      if (intro) {
        startIntro(true);
      } else {
        gathering = false;
      }

      step(performance.now());
      wake();
    };

    function queueSample(intro: boolean): void {
      if (intro) introPending = true;
      if (sampleFrame) cancelAnimationFrame(sampleFrame);
      sampleFrame = requestAnimationFrame(() => {
        sampleFrame = 0;
        void sampleText();
      });
    }

    const locate = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    };

    const handlePointerMove = (event: PointerEvent) => {
      locate(event);
      if (!pointer.active) {
        pointer.smoothX = pointer.x;
        pointer.smoothY = pointer.y;
      }
      pointer.active = true;
      wake();
    };

    const handlePointerLeave = () => {
      pointer.active = false;
      wake();
    };

    const handlePointerEnter = (event: PointerEvent) => {
      handlePointerMove(event);
      if (settingsRef.current?.trigger === 'hover') startIntro(false);
    };

    const handlePointerDown = (event: PointerEvent) => {
      const s = settingsRef.current;
      if (!s || s.trigger === 'click' || !s.clickBurst || reducedMotion) return;
      const rect = canvas.getBoundingClientRect();
      burst(event.clientX - rect.left, event.clientY - rect.top);
    };

    const handleClick = () => {
      if (settingsRef.current?.trigger === 'click') startIntro(false);
    };

    const handleReduceMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      if (reducedMotion) {
        gathering = false;
        bursting = false;
        particles.forEach(particle => {
          particle.x = particle.targetX;
          particle.y = particle.targetY;
          particle.ox = 0;
          particle.oy = 0;
          particle.vx = 0;
          particle.vy = 0;
        });
      }
      wake();
    };

    motionQuery?.addEventListener?.('change', handleReduceMotionChange);
    canvas.addEventListener('pointerenter', handlePointerEnter);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerleave', handlePointerLeave);
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('click', handleClick);

    const resizeObserver = new ResizeObserver(() => {
      if (sizeKey() !== requestedSize) queueSample(false);
    });
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    intersectionObserver.observe(container);

    const themeObserver = new MutationObserver(wake);
    for (const node of [document.documentElement, document.body]) {
      if (node) themeObserver.observe(node, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] });
    }
    const schemeQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    schemeQuery?.addEventListener?.('change', wake);

    void sampleText();

    return () => {
      alive = false;
      buildId += 1;
      wakeRef.current = () => {};
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      schemeQuery?.removeEventListener?.('change', wake);
      motionQuery?.removeEventListener?.('change', handleReduceMotionChange);
      canvas.removeEventListener('pointerenter', handlePointerEnter);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('click', handleClick);
      if (raf) cancelAnimationFrame(raf);
      if (sampleFrame) cancelAnimationFrame(sampleFrame);
    };
  }, []);

  return (
    <div ref={containerRef} className={`particle-text ${className}`.trim()} style={style}>
      <canvas ref={canvasRef} className="particle-text__canvas" aria-hidden="true" />
      <span className="particle-text__sr">{text}</span>
    </div>
  );
};

export default ParticleText;
