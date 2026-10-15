'use client';

import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef } from 'react';
import type { CSSProperties, ElementType } from 'react';
import { gsap } from 'gsap';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const clamp = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v);

const SPOT_MASK = `radial-gradient(circle var(--mh-spot-r, 160px) at var(--mh-spot-x, 50%) var(--mh-spot-y, 50%), ${Array.from(
  { length: 9 },
  (_, i) => {
    const t = i / 8;
    const u = clamp((t - 0.1) / 0.9, 0, 1);
    return `rgba(0, 0, 0, ${(u * u * u * (u * (u * 6 - 15) + 10)).toFixed(3)}) ${(t * 100).toFixed(1)}%`;
  }
).join(', ')})`;

type Reveal = 'rise' | 'scale' | 'blur' | 'wipe' | 'fade' | 'none';
type Trigger = 'view' | 'mount' | 'hover';

export interface MaskedHeadingProps {
  text?: string;
  tag?: ElementType;
  mediaType?: 'image' | 'video';
  src?: string;
  poster?: string;
  fillScale?: number;
  parallax?: number;
  drift?: number;
  hoverZoom?: number;
  brightness?: number;
  saturation?: number;
  grayscale?: boolean;
  tint?: string;
  spotlight?: boolean;
  spotlightRadius?: number;
  outline?: boolean;
  outlineColor?: string;
  outlineWidth?: number;
  reveal?: Reveal;
  duration?: number;
  stagger?: number;
  trigger?: Trigger;
  align?: 'left' | 'center' | 'right';
  weight?: number;
  tracking?: number;
  lineHeight?: number;
  textScale?: number;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}

interface Settings {
  fillScale: number;
  parallax: number;
  drift: number;
  hoverZoom: number;
  brightness: number;
  saturation: number;
  grayscale: boolean;
  textScale: number;
  spotlight: boolean;
}

interface GlyphBox {
  x: number;
  y: number;
  w: number;
  cx: number;
  cy: number;
  lc: number;
}

interface GlyphState {
  x: number;
  y: number;
  s: number;
}

const MaskedHeading: React.FC<MaskedHeadingProps> = ({
  text = 'Designed in the details',
  tag = 'h2',
  mediaType = 'image',
  src = '',
  poster = '',
  fillScale = 1.25,
  parallax = 26,
  drift = 18,
  hoverZoom = 0,
  brightness = 1,
  saturation = 1,
  grayscale = false,
  tint = '',
  spotlight = false,
  spotlightRadius = 160,
  outline = false,
  outlineColor = '',
  outlineWidth = 1,
  reveal = 'rise',
  duration = 1.1,
  stagger = 0.09,
  trigger = 'view',
  align = 'center',
  weight = 700,
  tracking = -0.03,
  lineHeight = 1.06,
  textScale = 0.115,
  className = '',
  style,
  ...rest
}: MaskedHeadingProps) => {
  const rootRef = useRef<HTMLElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const revealRef = useRef<HTMLSpanElement | null>(null);
  const clipRef = useRef<HTMLSpanElement | null>(null);
  const mediaRef = useRef<HTMLSpanElement | null>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const baseRefs = useRef<(HTMLElement | null)[]>([]);
  const glyphRefs = useRef<(SVGTextElement | null)[]>([]);
  const lineRefs = useRef<(SVGTextElement | null)[]>([]);
  const boxesRef = useRef<GlyphBox[]>([]);
  const statesRef = useRef<GlyphState[]>([]);
  const tweenRef = useRef<gsap.core.Animation | null>(null);
  const offsetRef = useRef({ x: 0, y: 0, tx: 0, ty: 0, zoom: 0, px: 0, py: 0, sx: 0, sy: 0, lit: false });
  const paintRef = useRef({ transform: '', filter: '', spot: '' });
  const wakeRef = useRef<() => void>(() => {});

  const clipId = `mh-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const words = useMemo(() => String(text).split(/\s+/).filter(Boolean), [text]);
  const glyphs = useMemo(() => words.flatMap((word, w) => Array.from(word).map(char => ({ char, w }))), [words]);

  const settingsRef = useRef<Settings>({
    fillScale: 1,
    parallax: 0,
    drift: 0,
    hoverZoom: 0,
    brightness: 1,
    saturation: 1,
    grayscale: false,
    textScale: 0.115,
    spotlight: false
  });
  settingsRef.current = {
    fillScale,
    parallax,
    drift,
    hoverZoom,
    brightness,
    saturation,
    grayscale,
    textScale,
    spotlight
  };

  const place = useCallback(() => {
    const root = rootRef.current;
    const media = mediaRef.current;
    if (!root || !media) return;
    const s = settingsRef.current;
    const off = offsetRef.current;
    const scale = s.fillScale * (1 + Math.max(0, off.zoom));
    const maxX = Math.max(0, ((scale - 1) / 2) * root.clientWidth);
    const maxY = Math.max(0, ((scale - 1) / 2) * root.clientHeight);

    const transform = `translate3d(${clamp(off.x, -maxX, maxX).toFixed(2)}px, ${clamp(off.y, -maxY, maxY).toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
    const filter = `brightness(${s.brightness}) saturate(${s.saturation})${s.grayscale ? ' grayscale(1)' : ''}`;
    const paint = paintRef.current;
    if (paint.transform !== transform) {
      paint.transform = transform;
      media.style.transform = transform;
    }
    if (paint.filter !== filter) {
      paint.filter = filter;
      media.style.filter = filter;
    }

    const clip = clipRef.current;
    if (clip && s.spotlight) {
      const spot = `${off.sx.toFixed(1)}px ${off.sy.toFixed(1)}px`;
      if (paint.spot !== spot) {
        paint.spot = spot;
        clip.style.setProperty('--mh-spot-x', `${off.sx.toFixed(1)}px`);
        clip.style.setProperty('--mh-spot-y', `${off.sy.toFixed(1)}px`);
      }
    }
  }, []);

  const renderGlyphs = useCallback(() => {
    const boxes = boxesRef.current;
    const states = statesRef.current;
    for (let i = 0; i < glyphRefs.current.length; i += 1) {
      const glyph = glyphRefs.current[i];
      if (!glyph) continue;
      const box = boxes[i];
      const st = states[i];
      if (!box || !st || (st.x === 0 && st.y === 0 && st.s === 1)) {
        if (glyph.hasAttribute('transform')) glyph.removeAttribute('transform');
        continue;
      }
      const s = Math.max(st.s, 0.0001);
      const tx = box.cx * (1 - s) + st.x * (box.cx - box.lc);
      const ty = box.cy * (1 - s) + st.y;
      glyph.setAttribute('transform', `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)})`);
    }
  }, []);

  const sync = useCallback(() => {
    const root = rootRef.current;
    const measure = measureRef.current;
    if (!root || !measure) return;
    const s = settingsRef.current;

    root.style.fontSize = `${clamp(root.clientWidth * s.textScale, 20, 200).toFixed(1)}px`;

    const cs = window.getComputedStyle(measure);
    const fontPx = parseFloat(cs.fontSize) || 48;
    const rootRect = root.getBoundingClientRect();
    const ratio = root.offsetWidth ? rootRect.width / root.offsetWidth || 1 : 1;
    const range = document.createRange();
    const boxes: GlyphBox[] = [];
    let index = 0;

    for (let w = 0; w < wordRefs.current.length; w += 1) {
      const box = wordRefs.current[w];
      const base = baseRefs.current[w];
      const node = box?.firstChild as Text | null | undefined;
      if (!box || !base || !node || node.nodeType !== 3) {
        index += Array.from(box?.textContent ?? '').length;
        continue;
      }
      const boxRect = box.getBoundingClientRect();
      const baseline = base.offsetTop;
      let offset = 0;
      for (const char of Array.from(node.data)) {
        range.setStart(node, offset);
        range.setEnd(node, offset + char.length);
        offset += char.length;
        const r = range.getBoundingClientRect();
        const x = box.offsetLeft + (r.left - boxRect.left) / ratio;
        const width = r.width / ratio;
        boxes[index] = { x, y: baseline, w: width, cx: x + width / 2, cy: baseline - fontPx * 0.36, lc: 0 };
        index += 1;
      }
    }
    const lines = new Map<number, { left: number; right: number }>();
    for (const box of boxes) {
      if (!box) continue;
      const line = lines.get(box.y) ?? { left: Infinity, right: -Infinity };
      line.left = Math.min(line.left, box.x);
      line.right = Math.max(line.right, box.x + box.w);
      lines.set(box.y, line);
    }
    for (const box of boxes) {
      if (!box) continue;
      const line = lines.get(box.y);
      if (line) box.lc = (line.left + line.right) / 2;
    }
    boxesRef.current = boxes;

    const write = (el: SVGTextElement) => {
      if (!el) return;
      el.style.fontFamily = cs.fontFamily;
      el.style.fontSize = cs.fontSize;
      el.style.fontWeight = cs.fontWeight;
      el.style.fontStyle = cs.fontStyle;
      el.style.letterSpacing = cs.letterSpacing;
    };
    for (let i = 0; i < boxes.length; i += 1) {
      const box = boxes[i];
      for (const el of [glyphRefs.current[i], lineRefs.current[i]]) {
        if (!el || !box) continue;
        el.setAttribute('x', box.x.toFixed(2));
        el.setAttribute('y', `${box.y}`);
        write(el);
      }
    }
    renderGlyphs();
    place();
  }, [place, renderGlyphs]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    let alive = true;
    const ro = new ResizeObserver(() => sync());
    ro.observe(root);
    if (document.fonts?.ready) document.fonts.ready.then(() => alive && sync()).catch(() => {});

    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const off = offsetRef.current;
    let raf = 0;
    let last = 0;
    let clock = 0;
    let visible = true;
    let hovering = false;

    const frame = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      const s = settingsRef.current;
      const still = !!motionQuery?.matches;

      if (still) {
        off.x = 0;
        off.y = 0;
        off.zoom = 0;
      } else {
        clock += dt;
        const dx = Math.sin(clock * 0.21) * s.drift;
        const dy = Math.cos(clock * 0.17) * s.drift * 0.6;
        const ease = 1 - Math.exp(-dt / 0.18);
        off.x += (off.tx + dx - off.x) * ease;
        off.y += (off.ty + dy - off.y) * ease;
        off.zoom += ((hovering ? s.hoverZoom : 0) - off.zoom) * (1 - Math.exp(-dt / 0.35));
      }

      if (s.spotlight) {
        const w = root.clientWidth;
        const h = root.clientHeight;
        let gx = w / 2;
        let gy = h / 2;
        if (hovering) {
          gx = off.px;
          gy = off.py;
        } else if (!still) {
          gx = w * (0.5 + 0.36 * Math.sin(clock * 0.37));
          gy = h * (0.5 + 0.22 * Math.sin(clock * 0.61 + 0.9));
        }
        if (!off.lit || still) {
          off.sx = gx;
          off.sy = gy;
          off.lit = true;
        } else {
          const follow = 1 - Math.exp(-dt / (hovering ? 0.12 : 0.6));
          off.sx += (gx - off.sx) * follow;
          off.sy += (gy - off.sy) * follow;
        }
      } else {
        off.lit = false;
      }

      place();
      if (visible && !still && alive) raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (raf || !alive) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    wakeRef.current = wake;

    const onMove = (e: PointerEvent) => {
      const s = settingsRef.current;
      const r = root.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / (r.width || 1)) * 2 - 1;
      const ny = ((e.clientY - r.top) / (r.height || 1)) * 2 - 1;
      off.tx = clamp(nx, -1, 1) * -Math.max(0, s.parallax);
      off.ty = clamp(ny, -1, 1) * -Math.max(0, s.parallax);
      off.px = ((e.clientX - r.left) / (r.width || 1)) * root.clientWidth;
      off.py = ((e.clientY - r.top) / (r.height || 1)) * root.clientHeight;
      if (s.spotlight) wake();
    };

    const onEnter = (e: PointerEvent) => {
      hovering = e.pointerType !== 'touch';
      onMove(e);
      wake();
    };

    const onLeave = () => {
      hovering = false;
      off.tx = 0;
      off.ty = 0;
      wake();
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
    });
    io.observe(root);

    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerenter', onEnter);
    root.addEventListener('pointerleave', onLeave);
    wake();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      raf = 0;
      wakeRef.current = () => {};
      ro.disconnect();
      io.disconnect();
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointerleave', onLeave);
    };
  }, [place, sync]);

  useEffect(() => {
    wakeRef.current();
  });

  useEffect(() => {
    const video = mediaRef.current?.querySelector('video');
    if (video && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) video.pause();
  }, [mediaType, src]);

  useIsomorphicLayoutEffect(() => {
    sync();
  }, [sync, words, tag, align, weight, tracking, lineHeight, textScale, outline]);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    const layer = revealRef.current;
    if (!root || !layer) return undefined;
    const states: GlyphState[] = glyphs.map(() => ({ x: 0, y: 0, s: 1 }));
    statesRef.current = states;
    if (!states.length) return undefined;

    const em = () => parseFloat(window.getComputedStyle(root).fontSize) || 48;
    const wordDelay = (i: number) => glyphs[i].w * stagger;
    const letterDelay = (i: number) => i * stagger * 0.35;

    const clearLayer = () => {
      gsap.set(layer, { opacity: 1, scale: 1 });
      layer.style.clipPath = '';
      layer.style.filter = '';
    };

    const settle = () => {
      states.forEach(st => {
        st.x = 0;
        st.y = 0;
        st.s = 1;
      });
      renderGlyphs();
      clearLayer();
    };

    const rest = () => {
      const size = em();
      if (reveal === 'rise') {
        states.forEach(st => {
          st.y = size * 1.15;
        });
      } else if (reveal === 'scale') {
        states.forEach(st => {
          st.y = size * 0.1;
          st.s = 0;
        });
      } else if (reveal === 'blur') {
        states.forEach(st => {
          st.x = 0.22;
        });
        gsap.set(layer, { opacity: 0 });
        layer.style.filter = `blur(${(size * 0.3).toFixed(2)}px)`;
      } else if (reveal === 'wipe') {
        layer.style.clipPath = 'inset(0% 100% 0% 0%)';
      } else if (reveal === 'fade') {
        gsap.set(layer, { opacity: 0, scale: 1.08 });
      }
      renderGlyphs();
    };

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reveal === 'none' || reduce) {
      settle();
      return undefined;
    }

    const play = () => {
      tweenRef.current?.kill();
      const size = em();
      if (reveal === 'rise') {
        clearLayer();
        tweenRef.current = gsap.fromTo(
          states,
          { x: 0, y: size * 1.15, s: 1 },
          { y: 0, duration, stagger: wordDelay, ease: 'power4.out', overwrite: 'auto', onUpdate: renderGlyphs }
        );
        renderGlyphs();
      } else if (reveal === 'scale') {
        clearLayer();
        tweenRef.current = gsap.fromTo(
          states,
          { x: 0, y: size * 0.1, s: 0 },
          { y: 0, s: 1, duration, stagger: letterDelay, ease: 'expo.out', overwrite: 'auto', onUpdate: renderGlyphs }
        );
        renderGlyphs();
      } else if (reveal === 'blur') {
        const focus = { blur: size * 0.3, opacity: 0 };
        gsap.set(layer, { scale: 1, opacity: 0 });
        layer.style.clipPath = '';
        layer.style.filter = `blur(${focus.blur.toFixed(2)}px)`;
        const timeline = gsap.timeline({ onUpdate: renderGlyphs });
        timeline.fromTo(states, { x: 0.22, y: 0, s: 1 }, { x: 0, duration: duration * 1.2, ease: 'expo.out' }, 0);
        timeline.to(
          focus,
          {
            blur: 0,
            opacity: 1,
            duration: duration * 1.2,
            ease: 'power2.out',
            onUpdate: () => {
              layer.style.filter = focus.blur > 0.05 ? `blur(${focus.blur.toFixed(2)}px)` : '';
              layer.style.opacity = focus.opacity.toFixed(3);
            }
          },
          0
        );
        tweenRef.current = timeline;
        renderGlyphs();
      } else if (reveal === 'wipe') {
        settle();
        layer.style.clipPath = 'inset(0% 100% 0% 0%)';
        const state = { p: 100 };
        tweenRef.current = gsap.to(state, {
          p: 0,
          duration,
          ease: 'power3.inOut',
          overwrite: 'auto',
          onUpdate: () => {
            layer.style.clipPath = `inset(0% ${state.p}% 0% 0%)`;
          }
        });
      } else {
        settle();
        tweenRef.current = gsap.fromTo(
          layer,
          { opacity: 0, scale: 1.08 },
          { opacity: 1, scale: 1, duration, ease: 'power3.out', overwrite: 'auto' }
        );
      }
    };

    if (trigger === 'hover') {
      settle();
      root.addEventListener('pointerenter', play);
      return () => {
        root.removeEventListener('pointerenter', play);
        tweenRef.current?.kill();
      };
    }

    if (trigger === 'view') {
      settle();
      rest();
      const io = new IntersectionObserver(
        entries => {
          if (entries.some(e => e.isIntersecting)) {
            play();
            io.disconnect();
          }
        },
        { threshold: 0.25 }
      );
      io.observe(root);
      return () => {
        io.disconnect();
        tweenRef.current?.kill();
      };
    }

    play();
    return () => tweenRef.current?.kill();
  }, [reveal, trigger, duration, stagger, glyphs, renderGlyphs]);

  const Tag = tag;

  return (
    <Tag
      ref={rootRef}
      className={`relative w-full m-0 p-0 antialiased [text-wrap:balance] ${className}`.trim()}
      style={{
        textAlign: align,
        fontWeight: weight,
        letterSpacing: `${tracking}em`,
        lineHeight,
        ...style
      }}
      {...rest}
    >
      <span ref={measureRef} className="text-transparent">
        {words.map((word, i) => (
          <span
            key={`${word}-${i}`}
            ref={(el: HTMLSpanElement | null) => {
              wordRefs.current[i] = el;
            }}
            className="inline-block whitespace-pre [&:not(:last-child)]:after:content-['_']"
          >
            {word}
            <i
              ref={(el: HTMLElement | null) => {
                baseRefs.current[i] = el;
              }}
              className="inline-block w-0 h-0"
            />
          </span>
        ))}
      </span>

      <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            {glyphs.map((glyph, i) => (
              <text
                key={i}
                ref={(el: SVGTextElement | null) => {
                  glyphRefs.current[i] = el;
                }}
              >
                {glyph.char}
              </text>
            ))}
          </clipPath>
        </defs>
      </svg>

      <span ref={revealRef} className="absolute inset-0 block pointer-events-none">
        <span
          ref={clipRef}
          className="absolute inset-0 block"
          style={
            {
              clipPath: `url(#${clipId})`,
              ['--mh-spot-r' as string]: `${Math.max(1, spotlightRadius)}px`
            } as CSSProperties
          }
        >
          <span
            ref={mediaRef}
            className="absolute inset-0 block [background:color-mix(in_srgb,currentColor_10%,transparent)] [will-change:transform,filter]"
          >
            {mediaType === 'video' ? (
              <video
                className="block w-full h-full object-cover select-none"
                src={src || undefined}
                poster={poster || undefined}
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img
                className="block w-full h-full object-cover select-none"
                src={src || undefined}
                alt=""
                draggable={false}
              />
            )}
          </span>
          {tint ? (
            <span className="absolute inset-0 block mix-blend-color pointer-events-none" style={{ background: tint }} />
          ) : null}
          {spotlight ? (
            <>
              <span
                className="absolute inset-0 block pointer-events-none bg-[#808080] mix-blend-saturation"
                style={{ maskImage: SPOT_MASK, WebkitMaskImage: SPOT_MASK }}
              />
              <span
                className="absolute inset-0 block pointer-events-none bg-black opacity-55"
                style={{ maskImage: SPOT_MASK, WebkitMaskImage: SPOT_MASK }}
              />
            </>
          ) : null}
        </span>
      </span>

      {outline ? (
        <svg
          className="absolute inset-0 w-full h-full overflow-visible pointer-events-none fill-none [stroke-linejoin:round]"
          aria-hidden="true"
          focusable="false"
          style={{ stroke: outlineColor || 'currentColor', strokeWidth: Math.max(0, outlineWidth) }}
        >
          {glyphs.map((glyph, i) => (
            <text
              key={i}
              ref={(el: SVGTextElement | null) => {
                lineRefs.current[i] = el;
              }}
            >
              {glyph.char}
            </text>
          ))}
        </svg>
      ) : null}
    </Tag>
  );
};

export default MaskedHeading;
