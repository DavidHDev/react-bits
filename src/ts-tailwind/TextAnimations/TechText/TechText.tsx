'use client';

import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';

type Box = { x1: number; y1: number; x2: number; y2: number };
type Art = { image: HTMLCanvasElement; left: number; top: number };
type Shape = { char: string; x: number; box: Box };
type Cell = { x: number; y: number; size: number; dx: number; dy: number; start: number; land: number };
type Glyph = Shape & {
  offset: { x: number; y: number };
  velocity: { x: number; y: number };
  outline: number;
  shown: number;
  cells: Cell[] | null;
  assembled: number;
  index: number;
  fill: Art;
  dashes: Art;
};
type Line = { y: number; label: string };
type Band = { y0: number; y1: number; up: boolean; order: number };
type Word = {
  size: number;
  baseline: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  lines: Line[];
  bands: Band[];
};
type Kick = { index: number; at: number; velocity: number };

export interface TechTextProps {
  text?: string;
  fontFamily?: string;
  fontWeight?: number;
  fontSize?: number;
  letterSpacing?: number;
  color?: string;
  accentColor?: string;
  align?: 'left' | 'center' | 'right';
  reach?: number;
  softness?: number;
  dashLength?: number;
  dashGap?: number;
  strokeWidth?: number;
  lineStyle?: 'dashed' | 'solid';
  reveal?: 'area' | 'letter' | 'off';
  specks?: number;
  selection?: boolean;
  labels?: boolean;
  draggable?: boolean;
  bounce?: number;
  sweep?: boolean;
  speed?: number;
  clickKick?: boolean;
  intro?: 'none' | 'type' | 'assemble' | 'metrics';
  introDuration?: number;
  guides?: boolean;
  className?: string;
  style?: CSSProperties;
}

type Settings = Required<Omit<TechTextProps, 'className' | 'style'>>;

const LABEL_FONT = '10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const FALLOFF_STEPS = 8;
const SPRING = 320;
const INHERIT = /^(currentcolor|inherit)$/i;
const INTRO_DELAY = 0.15;
const KICK_DECAY = 0.62;

const approach = (current: number, target: number, dt: number, seconds: number) =>
  current + (target - current) * (1 - Math.exp(-dt / seconds));

const clamp01 = (value: number) => Math.min(1, Math.max(0, Number(value) || 0));

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const noise = (...values: number[]) => {
  let h = 2166136261;
  for (const value of values) {
    h = Math.imul(h ^ (value | 0), 16777619);
    h ^= h >>> 13;
    h = Math.imul(h, 0x5bd1e995);
    h ^= h >>> 15;
  }
  return (h >>> 0) / 4294967296;
};

const signed = (value: number) => (value > 0 ? `+${value}` : value < 0 ? `−${-value}` : '0');

const TechText = ({
  text = 'React Bits',
  fontFamily = '',
  fontWeight = 600,
  fontSize = 150,
  letterSpacing = -0.05,
  color = 'currentColor',
  accentColor = 'currentColor',
  align = 'center',
  reach = 200,
  softness = 0.7,
  dashLength = 4,
  dashGap = 2,
  strokeWidth = 1.5,
  lineStyle = 'dashed',
  reveal = 'letter',
  specks = 15,
  selection = true,
  labels = true,
  draggable = true,
  bounce = 0.4,
  sweep = true,
  speed = 1,
  clickKick = true,
  intro = 'none',
  introDuration = 2,
  guides = false,
  className = '',
  style
}: TechTextProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settingsRef = useRef<Settings | null>(null);
  const wakeRef = useRef<() => void>(() => {});

  useEffect(() => {
    settingsRef.current = {
      text,
      fontFamily,
      fontWeight,
      fontSize,
      letterSpacing,
      color,
      accentColor,
      align,
      reach,
      softness,
      dashLength,
      dashGap,
      strokeWidth,
      lineStyle,
      reveal,
      specks,
      selection,
      labels,
      draggable,
      bounce,
      sweep,
      speed,
      clickKick,
      intro,
      introDuration,
      guides
    };
    wakeRef.current();
  });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const scratch = document.createElement('canvas');
    const scratchCtx = scratch.getContext('2d');
    if (!container || !canvas || !ctx || !scratchCtx) return undefined;

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    let width = 1;
    let height = 1;
    let dpr = 1;
    let raf = 0;
    let last = performance.now();
    let visible = false;
    let alive = true;
    let layoutKey = '';
    let requestedFont = '';
    let word: Word | null = null;
    let glyphs: Glyph[] = [];
    let presence = 0;
    let clock = 0;
    let pulse = 0;
    let placed = false;
    let dragging = -1;
    let cursor = '';
    let introClock = 0;
    let introKind = '';
    let introducing = false;
    let fontsReady = !document.fonts;
    let guideAlpha = 0;
    const kicks: Kick[] = [];
    const press = { x: 0, y: 0, time: 0, index: -1 };
    const pointer = { x: 0, y: 0, inside: false };
    const grab = { x: 0, y: 0 };
    const lens = { x: 0, y: 0 };
    const frame = { x1: 0, y1: 0, x2: 0, y2: 0, alpha: 0, index: -1 };

    const refreshFonts = () => {
      layoutKey = '';
      wakeRef.current();
    };

    const fontsLoaded = () => {
      fontsReady = true;
      refreshFonts();
    };

    const family = (s: Settings) => s.fontFamily || getComputedStyle(container).fontFamily || 'sans-serif';
    const fontFor = (s: Settings, size: number) => `${s.fontWeight} ${size}px ${family(s)}`;

    const palette = (s: Settings) => {
      const current = getComputedStyle(container).color || '#000000';
      const pick = (value: string) => (!value || INHERIT.test(String(value).trim()) ? current : value);
      return { ink: pick(s.color), accent: pick(s.accentColor) };
    };

    const setFont = (target: CanvasRenderingContext2D, s: Settings, size: number) => {
      target.font = fontFor(s, size);
      if ('letterSpacing' in target) target.letterSpacing = `${s.letterSpacing * size}px`;
      target.textAlign = 'left';
      target.textBaseline = 'alphabetic';
    };

    const sprite = (s: Settings, view: Word, glyph: Shape, stroke: boolean, ink: string): Art => {
      const pad = Math.ceil(s.strokeWidth * 2 + 4);
      const left = glyph.box.x1 - pad;
      const top = glyph.box.y1 - pad;
      const w = glyph.box.x2 - glyph.box.x1 + pad * 2;
      const h = glyph.box.y2 - glyph.box.y1 + pad * 2;
      const image = document.createElement('canvas');
      image.width = Math.max(1, Math.ceil(w * dpr));
      image.height = Math.max(1, Math.ceil(h * dpr));
      const c = image.getContext('2d');
      if (!c) return { image, left, top };
      c.setTransform(dpr, 0, 0, dpr, -left * dpr, -top * dpr);
      setFont(c, s, view.size);
      if (stroke) {
        c.lineJoin = 'round';
        c.lineWidth = s.strokeWidth * 2;
        c.lineCap = 'butt';
        c.strokeStyle = ink;
        if (s.lineStyle !== 'solid') c.setLineDash([Math.max(1, s.dashLength), Math.max(1, s.dashGap)]);
        c.strokeText(glyph.char, glyph.x, view.baseline);
        c.setLineDash([]);
        c.globalCompositeOperation = 'destination-out';
        c.fillStyle = '#000000';
        c.fillText(glyph.char, glyph.x, view.baseline);
        c.globalCompositeOperation = 'source-over';
      } else {
        c.fillStyle = ink;
        c.fillText(glyph.char, glyph.x, view.baseline);
      }
      return { image, left, top };
    };

    const ensureLayout = (s: Settings, ink: string): Word => {
      const key = [
        s.text,
        family(s),
        s.fontWeight,
        s.fontSize,
        s.letterSpacing,
        s.align,
        ink,
        s.dashLength,
        s.dashGap,
        s.strokeWidth,
        s.lineStyle,
        width,
        height,
        dpr
      ].join('|');
      if (key === layoutKey && word) return word;
      layoutKey = key;
      const wanted = fontFor(s, 64);
      if (document.fonts && wanted !== requestedFont) {
        requestedFont = wanted;
        document.fonts.load(wanted, s.text).then(refreshFonts, refreshFonts);
      }

      const probe = scratchCtx;
      setFont(probe, s, s.fontSize);
      let m = probe.measureText(s.text);
      const fit = Math.min(
        1,
        (width * 0.9) / Math.max(m.actualBoundingBoxLeft + m.actualBoundingBoxRight, 1),
        (height * 0.66) / Math.max(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent, 1)
      );
      const size = s.fontSize * fit;
      setFont(probe, s, size);
      m = probe.measureText(s.text);
      const inkWidth = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
      const inkHeight = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
      const margin = width * 0.05;
      const start =
        s.align === 'left' ? margin : s.align === 'right' ? width - margin - inkWidth : (width - inkWidth) / 2;
      const x = start + m.actualBoundingBoxLeft;
      const baseline = (height - inkHeight) / 2 + m.actualBoundingBoxAscent;
      const xHeight = baseline - probe.measureText('x').actualBoundingBoxAscent;
      const capHeight = baseline - probe.measureText('H').actualBoundingBoxAscent;
      const ascender = baseline - probe.measureText('d').actualBoundingBoxAscent;
      const descender = baseline + probe.measureText('p').actualBoundingBoxDescent;
      const top = baseline - m.actualBoundingBoxAscent;
      const bottom = baseline + m.actualBoundingBoxDescent;
      const inkTop = Math.min(top, capHeight) - 2;
      const inkBottom = Math.max(bottom, baseline) + 2;
      const next: Word = {
        size,
        baseline,
        left: x - m.actualBoundingBoxLeft,
        right: x + m.actualBoundingBoxRight,
        top,
        bottom,
        lines: [
          { y: baseline, label: 'baseline' },
          { y: xHeight, label: 'x-height' },
          { y: capHeight, label: 'cap height' },
          ...(capHeight - ascender > Math.max(11, size * 0.06) ? [{ y: ascender, label: 'ascender' }] : []),
          { y: descender, label: 'descender' }
        ],
        bands: [
          { y0: xHeight, y1: baseline, up: true, order: 0 },
          { y0: capHeight, y1: xHeight, up: true, order: 1 },
          { y0: inkTop, y1: capHeight, up: true, order: 2 },
          { y0: baseline, y1: inkBottom, up: false, order: 1 }
        ].filter(band => band.y1 - band.y0 > 0.5)
      };
      word = next;

      const chars = Array.from(s.text);
      const previous = glyphs;
      glyphs = [];
      let prefix = '';
      chars.forEach((char, i) => {
        prefix += char;
        const own = probe.measureText(char);
        const gx = x + probe.measureText(prefix).width - own.width;
        if (!char.trim()) return;
        const base = {
          char,
          x: gx,
          box: {
            x1: gx - own.actualBoundingBoxLeft,
            y1: baseline - own.actualBoundingBoxAscent,
            x2: gx + own.actualBoundingBoxRight,
            y2: baseline + own.actualBoundingBoxDescent
          }
        };
        const kept = previous[glyphs.length];
        glyphs.push({
          ...base,
          offset: kept?.char === char ? kept.offset : { x: 0, y: 0 },
          velocity: { x: 0, y: 0 },
          outline: 0,
          shown: 1,
          cells: null,
          assembled: 0,
          index: i,
          fill: sprite(s, next, base, false, ink),
          dashes: sprite(s, next, base, true, ink)
        });
      });
      dragging = -1;
      frame.index = -1;
      return next;
    };

    const glyphAt = (x: number, y: number) => {
      if (!word || y < word.top - 24 || y > word.bottom + 24) return -1;
      let best = -1;
      let bestDistance = Infinity;
      glyphs.forEach((glyph, i) => {
        const x1 = glyph.box.x1 + glyph.offset.x;
        const x2 = glyph.box.x2 + glyph.offset.x;
        const d = x < x1 ? x1 - x : x > x2 ? x - x2 : 0;
        if (d < bestDistance) {
          bestDistance = d;
          best = i;
        }
      });
      return bestDistance < 28 ? best : -1;
    };

    const falloff = (
      target: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      radius: number,
      strength: number,
      softness: number
    ) => {
      const inner = Math.min(1, Math.max(0, 1 - softness));
      const gradient = target.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, `rgba(0, 0, 0, ${strength})`);
      if (inner > 0.995) {
        gradient.addColorStop(0.995, `rgba(0, 0, 0, ${strength})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        return gradient;
      }
      for (let i = 0; i <= FALLOFF_STEPS; i++) {
        const t = i / FALLOFF_STEPS;
        const eased = t * t * (3 - 2 * t);
        gradient.addColorStop(inner + (1 - inner) * t, `rgba(0, 0, 0, ${strength * (1 - eased)})`);
      }
      return gradient;
    };

    const blit = (
      target: CanvasRenderingContext2D,
      art: Art,
      dx: number,
      dy: number,
      originX: number,
      originY: number
    ) => {
      target.drawImage(
        art.image,
        Math.round((art.left + dx) * dpr - originX),
        Math.round((art.top + dy) * dpr - originY)
      );
    };

    const drawReveal = (s: Settings) => {
      const radius = s.reach * dpr;
      const cx = lens.x * dpr;
      const cy = lens.y * dpr;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = falloff(ctx, cx, cy, radius, presence, s.softness);
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      ctx.globalCompositeOperation = 'source-over';

      const x0 = Math.max(0, Math.floor(cx - radius));
      const y0 = Math.max(0, Math.floor(cy - radius));
      const x1 = Math.min(canvas.width, Math.ceil(cx + radius));
      const y1 = Math.min(canvas.height, Math.ceil(cy + radius));
      if (x1 <= x0 || y1 <= y0) return;
      const w = x1 - x0;
      const h = y1 - y0;
      if (scratch.width < w || scratch.height < h) {
        scratch.width = Math.max(scratch.width, w);
        scratch.height = Math.max(scratch.height, h);
      }
      scratchCtx.setTransform(1, 0, 0, 1, 0, 0);
      scratchCtx.globalCompositeOperation = 'source-over';
      scratchCtx.clearRect(0, 0, w, h);
      for (const glyph of glyphs) blit(scratchCtx, glyph.dashes, glyph.offset.x, glyph.offset.y, x0, y0);
      scratchCtx.globalCompositeOperation = 'destination-in';
      scratchCtx.fillStyle = falloff(scratchCtx, cx - x0, cy - y0, radius, 1, s.softness);
      scratchCtx.fillRect(0, 0, w, h);
      scratchCtx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = presence;
      ctx.drawImage(scratch, 0, 0, w, h, x0, y0, w, h);
      ctx.globalAlpha = 1;
    };

    const crisp = (value: number) => (Math.round(value * dpr) + 0.5) / dpr;

    const perimeterPoint = (distance: number, w: number, h: number): [number, number, number, number] => {
      let d = ((distance % (2 * (w + h))) + 2 * (w + h)) % (2 * (w + h));
      if (d < w) return [frame.x1 + d, frame.y1, 0, -1];
      d -= w;
      if (d < h) return [frame.x2, frame.y1 + d, 1, 0];
      d -= h;
      if (d < w) return [frame.x2 - d, frame.y2, 0, 1];
      d -= w;
      return [frame.x1, frame.y2 - d, -1, 0];
    };

    const drawSpecks = (s: Settings, a: number, accent: string) => {
      const w = frame.x2 - frame.x1;
      const h = frame.y2 - frame.y1;
      if (w < 2 || h < 2) return;
      const perimeter = 2 * (w + h);
      const seed = frame.index + 1;
      const grid = 3;
      ctx.fillStyle = accent;
      ctx.strokeStyle = accent;

      for (let k = 0; k < s.specks; k++) {
        const period = 0.5 + noise(seed, k, 11) * 1.2;
        const t = pulse / period + noise(seed, k, 17);
        const cycle = Math.floor(t);
        const life = t - cycle;
        if (life > 0.7) continue;
        const [px, py, nx, ny] = perimeterPoint(noise(seed, k, cycle) * perimeter, w, h);
        const pick = noise(seed, k, cycle, 2);
        const size = pick < 0.46 ? 2 : pick < 0.7 ? 3 : pick < 0.84 ? 5 : pick < 0.94 ? 8 : 11;
        const large = size >= 8;
        const out = (large ? 9 : 4) + Math.floor(noise(seed, k, cycle, 1) * 5) * grid;
        const x = frame.x1 + Math.round((px + nx * out - frame.x1) / grid) * grid;
        const y = frame.y1 + Math.round((py + ny * out - frame.y1) / grid) * grid;
        const tone = noise(seed, k, cycle, 3);
        const blink = life < 0.06 || (life > 0.32 && life < 0.36) ? 0.35 : 1;
        const alpha = a * (large ? 0.3 + 0.4 * tone : 0.3 + 0.6 * tone) * blink;
        const left = Math.round(x - size / 2);
        const top = Math.round(y - size / 2);
        ctx.globalAlpha = alpha;
        if (tone < 0.26 || (large && tone < 0.78)) {
          ctx.strokeRect(left + 0.5, top + 0.5, size, size);
          if (large && tone > 0.5) ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
        } else {
          ctx.fillRect(left, top, size, size);
        }
      }

      for (let j = 0; j < 2; j++) {
        const head = (pulse * 0.42 * s.speed + j * 0.5) * perimeter;
        for (let i = 0; i < 4; i++) {
          const [x, y] = perimeterPoint(head - i * 6, w, h);
          const size = i === 0 ? 3 : 2;
          ctx.globalAlpha = a * [0.95, 0.55, 0.32, 0.16][i];
          ctx.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size);
        }
      }
      ctx.globalAlpha = 1;
    };

    const drawFrame = (s: Settings, accent: string) => {
      const glyph = glyphs[frame.index];
      if (!glyph || frame.alpha < 0.01) return;
      const a = frame.alpha;
      const x1 = crisp(frame.x1);
      const y1 = crisp(frame.y1);
      const x2 = crisp(frame.x2);
      const y2 = crisp(frame.y2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = accent;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;

      const moved = Math.hypot(glyph.offset.x, glyph.offset.y);
      if (moved > 1) {
        const hx = (glyph.box.x1 + glyph.box.x2) / 2;
        const hy = (glyph.box.y1 + glyph.box.y2) / 2;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx + glyph.offset.x, hy + glyph.offset.y);
        ctx.setLineDash([3, 4]);
        ctx.globalAlpha = 0.45 * a;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.rect(Math.round(hx) - 2, Math.round(hy) - 2, 4, 4);
        ctx.globalAlpha = 0.7 * a;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.rect(x1, y1, x2 - x1, y2 - y1);
      ctx.globalAlpha = 0.5 * a;
      ctx.stroke();

      ctx.beginPath();
      for (const [cx, cy] of [
        [x1, y1],
        [x2, y1],
        [x2, y2],
        [x1, y2]
      ]) {
        ctx.rect(Math.round(cx) - 2, Math.round(cy) - 2, 5, 5);
      }
      ctx.globalAlpha = 0.95 * a;
      ctx.fill();
      ctx.globalAlpha = 1;

      if (s.specks > 0) drawSpecks(s, a, accent);

      if (!s.labels) return;
      ctx.font = LABEL_FONT;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.62 * a;
      const label =
        moved > 1
          ? `${signed(Math.round(glyph.offset.x))}, ${signed(Math.round(-glyph.offset.y))}`
          : `${glyph.char}  ${Math.round(glyph.box.x2 - glyph.box.x1)} × ${Math.round(glyph.box.y2 - glyph.box.y1)}`;
      ctx.fillText(label, Math.round(frame.x1), Math.round(frame.y1) - 7);
      ctx.globalAlpha = 1;
    };

    const drawLines = (s: Settings, view: Word, accent: string, alpha: number, growth: (k: number) => number) => {
      const pad = Math.max(12, view.size * 0.12);
      const x1 = Math.round(view.left - pad);
      const x2 = Math.round(view.right + pad);
      const room = width - x2 > x1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.strokeStyle = accent;
      ctx.fillStyle = accent;
      ctx.lineWidth = 1;
      ctx.font = LABEL_FONT;
      ctx.textBaseline = 'middle';
      ctx.textAlign = room ? 'left' : 'right';
      view.lines.forEach((line, k) => {
        const grow = growth(k);
        if (grow <= 0.001) return;
        const y = crisp(line.y);
        const end = x1 + (x2 - x1) * grow;
        ctx.globalAlpha = alpha * 0.4;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(end, y);
        ctx.stroke();
        ctx.globalAlpha = alpha * 0.9;
        ctx.fillRect(x1 - 1, Math.round(line.y) - 1, 3, 3);
        ctx.fillRect(Math.round(end) - 1, Math.round(line.y) - 1, 3, 3);
        if (s.labels) {
          ctx.globalAlpha = alpha * 0.62 * smoothstep(0.7, 1, grow);
          ctx.fillText(line.label, room ? x2 + 8 : x1 - 8, Math.round(line.y));
        }
      });
      ctx.textAlign = 'left';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
    };

    const ensureCells = (glyph: Glyph, view: Word): Cell[] => {
      if (glyph.cells) return glyph.cells;
      const art = glyph.fill;
      const size = Math.max(3, Math.round(view.size / 26));
      const w = art.image.width;
      const h = art.image.height;
      const source = art.image.getContext('2d');
      const cells: Cell[] = [];
      glyph.cells = cells;
      glyph.assembled = 0;
      if (!source || w < 2 || h < 2) return cells;
      const data = source.getImageData(0, 0, w, h).data;
      const gx = Math.floor(art.left / size) * size;
      const gy = Math.floor(art.top / size) * size;
      const cols = Math.ceil((art.left + w / dpr - gx) / size) + 1;
      const rows = Math.ceil((art.top + h / dpr - gy) / size) + 1;
      const hit = new Uint8Array(cols * rows);
      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          if (data[(py * w + px) * 4 + 3] < 24) continue;
          const cx = Math.floor((art.left + px / dpr - gx) / size);
          const cy = Math.floor((art.top + py / dpr - gy) / size);
          hit[cy * cols + cx] = 1;
        }
      }
      const center = (glyph.box.x1 + glyph.box.x2) / 2;
      const along = clamp01((center - view.left) / Math.max(1, view.right - view.left));
      for (let k = 0; k < hit.length; k++) {
        if (!hit[k]) continue;
        const angle = noise(glyph.index, k, 1) * Math.PI * 2;
        const distance = view.size * (0.25 + 0.6 * noise(glyph.index, k, 2));
        const start = 0.03 + 0.36 * along + 0.12 * noise(glyph.index, k, 3);
        const land = start + 0.3 + 0.14 * noise(glyph.index, k, 4);
        cells.push({
          x: gx + (k % cols) * size,
          y: gy + Math.floor(k / cols) * size,
          size,
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance * 0.7,
          start,
          land
        });
        glyph.assembled = Math.max(glyph.assembled, land);
      }
      return cells;
    };

    const cellRect = (x: number, y: number, size: number): [number, number, number, number] => {
      const left = Math.round(x * dpr);
      const top = Math.round(y * dpr);
      return [left, top, Math.round((x + size) * dpr) - left, Math.round((y + size) * dpr) - top];
    };

    const drawAssembling = (glyph: Glyph, progress: number, accent: string) => {
      const cells = glyph.cells || [];
      ctx.save();
      ctx.beginPath();
      let landed = 0;
      for (const cell of cells) {
        if (progress < cell.land) continue;
        const [x, y, w, h] = cellRect(cell.x, cell.y, cell.size);
        ctx.rect(x, y, w, h);
        landed++;
      }
      if (landed) {
        ctx.clip();
        blit(ctx, glyph.fill, 0, 0, 0, 0);
      }
      ctx.restore();
      ctx.fillStyle = accent;
      for (const cell of cells) {
        if (progress < cell.start || progress >= cell.land) continue;
        const u = (progress - cell.start) / (cell.land - cell.start);
        const eased = 1 - Math.pow(1 - u, 4);
        const size = cell.size * (0.4 + 0.6 * eased);
        const x = cell.x + (cell.size - size) / 2 + cell.dx * (1 - eased);
        const y = cell.y + (cell.size - size) / 2 + cell.dy * (1 - eased);
        const [left, top, w, h] = cellRect(x, y, size);
        ctx.globalAlpha = Math.min(1, u * 4) * (0.55 + 0.45 * eased);
        ctx.fillRect(left, top, Math.max(1, w), Math.max(1, h));
      }
      ctx.globalAlpha = 1;
    };

    const drawFilling = (glyph: Glyph, lead: number, progress: number, view: Word) => {
      const art = glyph.fill;
      const left = Math.floor(art.left * dpr);
      const top = Math.floor(art.top * dpr);
      const w = art.image.width + 2;
      const h = art.image.height + 2;
      const fill = clamp01((progress - 0.24 - 0.28 * lead) / 0.48);
      const rects: [number, number][] = [];
      for (const band of view.bands) {
        const amount = smoothstep(0.3 * band.order, 0.3 * band.order + 0.4, fill);
        if (amount <= 0) continue;
        const span = (band.y1 - band.y0) * amount;
        const y0 = Math.round((band.up ? band.y1 - span : band.y0) * dpr);
        const y1 = Math.round((band.up ? band.y1 : band.y0 + span) * dpr);
        if (y1 > y0) rects.push([y0, y1 - y0]);
      }
      const outline = smoothstep(0.08 + 0.2 * lead, 0.22 + 0.2 * lead, progress);
      if (outline > 0.001) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(left - 2, top - 2, w + 2, h + 2);
        for (const [y, span] of rects) ctx.rect(left - 2, y, w + 2, span);
        ctx.clip('evenodd');
        ctx.globalAlpha = outline;
        blit(ctx, glyph.dashes, 0, 0, 0, 0);
        ctx.restore();
      }
      if (rects.length) {
        ctx.save();
        ctx.beginPath();
        for (const [y, span] of rects) ctx.rect(left - 2, y, w + 2, span);
        ctx.clip();
        blit(ctx, glyph.fill, 0, 0, 0, 0);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    };

    const kick = (index: number) => {
      const strength = (word ? word.size : 120) * 11;
      kicks.push({ index, at: pulse, velocity: strength });
      for (let d = 1; d < glyphs.length; d++) {
        const velocity = strength * Math.pow(KICK_DECAY, d);
        if (velocity < 30) break;
        for (const j of [index - d, index + d]) {
          if (j >= 0 && j < glyphs.length) kicks.push({ index: j, at: pulse + d * 0.055, velocity });
        }
      }
      wakeRef.current();
    };

    const tick = (now: number) => {
      raf = 0;
      const s = settingsRef.current;
      if (!s) return;
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      const { ink, accent } = palette(s);
      const view = ensureLayout(s, ink);
      const damping = 2 * Math.sqrt(SPRING) * (1 - clamp01(s.bounce) * 0.96);

      if (s.intro !== introKind) {
        introKind = s.intro;
        introClock = 0;
      }
      const introOn = introKind !== 'none' && !reducedMotion && glyphs.length > 0;
      if (introOn && fontsReady) introClock += dt;
      const progress = introOn ? clamp01((introClock - INTRO_DELAY) / Math.max(0.3, s.introDuration)) : 1;
      introducing = introOn && progress < 1;

      const sweeping = !introducing && s.sweep && !reducedMotion && !pointer.inside && dragging < 0;
      if (sweeping) clock += dt * s.speed;
      pulse += dt;
      let targetX = pointer.x;
      let targetY = pointer.y;
      if (sweeping) {
        targetX = view.left + (view.right - view.left) * (0.5 - 0.5 * Math.cos(clock * 0.45));
        targetY = view.top + (view.bottom - view.top) * (0.45 + 0.1 * Math.sin(clock * 0.8));
      }
      const active = !introducing && (pointer.inside || sweeping || dragging >= 0);
      if (active && !placed) {
        lens.x = targetX;
        lens.y = targetY;
      }
      if (active) {
        const lag = pointer.inside ? 0.05 : 0.22;
        lens.x = approach(lens.x, targetX, dt, lag);
        lens.y = approach(lens.y, targetY, dt, lag);
      }
      placed = active;
      presence = approach(presence, s.reveal === 'area' && active && dragging < 0 ? 1 : 0, dt, 0.16);

      for (let k = kicks.length - 1; k >= 0; k--) {
        if (kicks[k].at > pulse) continue;
        const glyph = glyphs[kicks[k].index];
        if (glyph) glyph.velocity.y -= kicks[k].velocity;
        kicks.splice(k, 1);
      }

      let moving = false;
      glyphs.forEach((glyph, i) => {
        if (i === dragging) {
          glyph.offset.x = approach(glyph.offset.x, pointer.x - grab.x, dt, 0.03);
          glyph.offset.y = approach(glyph.offset.y, pointer.y - grab.y, dt, 0.03);
          glyph.velocity.x = 0;
          glyph.velocity.y = 0;
          moving = true;
          return;
        }
        const { offset, velocity } = glyph;
        if (Math.abs(offset.x) < 0.05 && Math.abs(offset.y) < 0.05 && Math.hypot(velocity.x, velocity.y) < 0.5) {
          offset.x = 0;
          offset.y = 0;
          velocity.x = 0;
          velocity.y = 0;
          return;
        }
        velocity.x += (-SPRING * offset.x - damping * velocity.x) * dt;
        velocity.y += (-SPRING * offset.y - damping * velocity.y) * dt;
        offset.x += velocity.x * dt;
        offset.y += velocity.y * dt;
        moving = true;
      });

      let typing = -1;
      if (introducing && introKind === 'type') {
        const step = 0.86 / glyphs.length;
        const cursorAt = Math.min(glyphs.length - 1, Math.floor(progress / step));
        typing = progress < 0.93 ? cursorAt : -1;
        glyphs.forEach((glyph, i) => {
          glyph.shown = i < cursorAt ? 1 : i === cursorAt ? smoothstep(0, step * 0.3, progress - i * step) : 0;
        });
      } else {
        glyphs.forEach(glyph => {
          glyph.shown = 1;
        });
      }

      const focus = introducing ? typing : dragging >= 0 ? dragging : active ? glyphAt(lens.x, lens.y) : -1;
      if (focus >= 0 && s.selection) {
        const glyph = glyphs[focus];
        const bx1 = glyph.box.x1 + glyph.offset.x - 6;
        const by1 = glyph.box.y1 + glyph.offset.y - 6;
        const bx2 = glyph.box.x2 + glyph.offset.x + 6;
        const by2 = glyph.box.y2 + glyph.offset.y + 6;
        if (frame.index < 0 || frame.alpha < 0.02) {
          frame.x1 = bx1;
          frame.y1 = by1;
          frame.x2 = bx2;
          frame.y2 = by2;
        }
        const glide = focus === dragging ? 0.02 : 0.08;
        frame.x1 = approach(frame.x1, bx1, dt, glide);
        frame.y1 = approach(frame.y1, by1, dt, glide);
        frame.x2 = approach(frame.x2, bx2, dt, glide);
        frame.y2 = approach(frame.y2, by2, dt, glide);
        frame.index = focus;
      }
      frame.alpha = approach(frame.alpha, focus >= 0 && s.selection ? 1 : 0, dt, 0.1);

      glyphs.forEach((glyph, i) => {
        const target = introducing
          ? introKind === 'type' && (i === typing || (typing >= 0 && i > typing))
            ? 1
            : 0
          : s.reveal === 'letter' && i === focus && i !== dragging
            ? 1
            : 0;
        if (introducing && glyph.shown === 0) glyph.outline = target;
        glyph.outline = approach(glyph.outline, target, dt, 0.09);
        if (Math.abs(glyph.outline - target) > 0.002) moving = true;
        else glyph.outline = target;
      });

      guideAlpha = approach(guideAlpha, s.guides && !introducing && (focus >= 0 || presence > 0.4) ? 1 : 0, dt, 0.14);

      const hovering = !introducing && focus >= 0 && pointer.inside;
      const nextCursor =
        dragging >= 0 ? 'grabbing' : hovering && s.draggable ? 'grab' : hovering && s.clickKick ? 'pointer' : '';
      if (nextCursor !== cursor) {
        cursor = nextCursor;
        container.style.cursor = nextCursor;
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const glyph of glyphs) {
        const moved = Math.hypot(glyph.offset.x, glyph.offset.y);
        if (moved > 1) {
          ctx.globalAlpha = Math.min(1, moved / 24) * 0.55;
          blit(ctx, glyph.dashes, 0, 0, 0, 0);
          ctx.globalAlpha = 1;
        }
      }
      if (introducing && introKind === 'metrics') {
        drawLines(s, view, accent, 1 - smoothstep(0.84, 1, progress), k =>
          smoothstep(0.02 + 0.04 * k, 0.2 + 0.04 * k, progress)
        );
      } else if (guideAlpha > 0.005) {
        drawLines(s, view, accent, guideAlpha * 0.6, () => 1);
      }
      glyphs.forEach((glyph, i) => {
        if (introducing && introKind === 'assemble') {
          ensureCells(glyph, view);
          if (progress < glyph.assembled) {
            drawAssembling(glyph, progress, accent);
            return;
          }
        }
        if (introducing && introKind === 'metrics') {
          const lead = glyphs.length > 1 ? i / (glyphs.length - 1) : 0;
          if (progress < 0.72 + 0.28 * lead) {
            drawFilling(glyph, lead, progress, view);
            return;
          }
        }
        if (glyph.shown < 0.001) return;
        if (glyph.outline < 0.999) {
          ctx.globalAlpha = (1 - glyph.outline) * glyph.shown;
          blit(ctx, glyph.fill, glyph.offset.x, glyph.offset.y, 0, 0);
        }
        if (glyph.outline > 0.001) {
          ctx.globalAlpha = glyph.outline * glyph.shown;
          blit(ctx, glyph.dashes, glyph.offset.x, glyph.offset.y, 0, 0);
        }
        ctx.globalAlpha = 1;
      });
      if (presence > 0.001) drawReveal(s);
      drawFrame(s, accent);

      const settling =
        moving ||
        introducing ||
        kicks.length > 0 ||
        (guideAlpha > 0.005 && guideAlpha < 0.995) ||
        Math.abs(presence - (s.reveal === 'area' && active && dragging < 0 ? 1 : 0)) > 0.002 ||
        (frame.alpha > 0.01 && frame.alpha < 0.99);
      if ((active || settling) && visible && alive) raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (raf || !visible || !alive) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    wakeRef.current = wake;

    const resize = () => {
      width = Math.max(1, container.clientWidth);
      height = Math.max(1, container.clientHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      layoutKey = '';
      wake();
    };

    const locate = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    };
    const onMove = (e: PointerEvent) => {
      locate(e);
      pointer.inside = true;
      wake();
    };
    const onLeave = () => {
      if (dragging >= 0) return;
      pointer.inside = false;
      wake();
    };
    const onDown = (e: PointerEvent) => {
      locate(e);
      pointer.inside = true;
      const s = settingsRef.current;
      const primary = e.pointerType !== 'mouse' || e.button === 0;
      const index = introducing || !primary ? -1 : glyphAt(pointer.x, pointer.y);
      press.x = pointer.x;
      press.y = pointer.y;
      press.time = performance.now();
      press.index = index;
      if (s?.draggable && index >= 0) {
        dragging = index;
        grab.x = pointer.x - glyphs[index].offset.x;
        grab.y = pointer.y - glyphs[index].offset.y;
        container.setPointerCapture?.(e.pointerId);
      }
      wake();
    };
    const onUp = (e: PointerEvent) => {
      if (dragging >= 0) {
        dragging = -1;
        container.releasePointerCapture?.(e.pointerId);
        const rect = container.getBoundingClientRect();
        pointer.inside =
          e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      }
      if (
        e.type === 'pointerup' &&
        press.index >= 0 &&
        settingsRef.current?.clickKick &&
        !reducedMotion &&
        performance.now() - press.time < 450
      ) {
        const rect = container.getBoundingClientRect();
        if (Math.hypot(e.clientX - rect.left - press.x, e.clientY - rect.top - press.y) < 6) kick(press.index);
      }
      press.index = -1;
      wake();
    };

    container.addEventListener('pointermove', onMove, { passive: true });
    container.addEventListener('pointerenter', onMove, { passive: true });
    container.addEventListener('pointerdown', onDown, { passive: true });
    container.addEventListener('pointerup', onUp, { passive: true });
    container.addEventListener('pointercancel', onUp, { passive: true });
    container.addEventListener('pointerleave', onLeave, { passive: true });

    const resizeObserver = new ResizeObserver(resize);
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
    if (document.fonts) document.fonts.ready.then(fontsLoaded, fontsLoaded);

    resize();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      wakeRef.current = () => {};
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      schemeQuery?.removeEventListener?.('change', wake);
      container.style.cursor = '';
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerenter', onMove);
      container.removeEventListener('pointerdown', onDown);
      container.removeEventListener('pointerup', onUp);
      container.removeEventListener('pointercancel', onUp);
      container.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full touch-pan-y select-none ${className}`.trim()}
      style={style}
      role="img"
      aria-label={text}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default TechText;
