'use client';

import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react';

export interface ChromaItem {
  image: string;
  title?: string;
  subtitle?: string;
  accent?: string;
  url?: string;
  alt?: string;
  borderColor?: string;
}

export interface ChromaGridProps {
  items?: ChromaItem[];
  columns?: number;
  minCardWidth?: number;
  gap?: number;
  radius?: number;
  softness?: number;
  damping?: number;
  fadeOut?: number;
  grayscale?: number;
  dim?: number;
  glow?: number;
  borderGlow?: number;
  reveal?: 'spotlight' | 'card';
  aspectRatio?: string;
  cardRadius?: number;
  showInfo?: boolean;
  frame?: boolean;
  theme?: 'dark' | 'light';
  className?: string;
}

const THEMES: Record<'dark' | 'light', Record<string, string>> = {
  dark: {
    '--chroma-frame': 'rgba(38, 35, 46, 0.66)',
    '--chroma-frame-edge': 'rgba(255, 255, 255, 0.08)',
    '--chroma-frame-highlight': 'rgba(255, 255, 255, 0.07)',
    '--chroma-frame-shadow': '0 22px 44px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)',
    '--chroma-tile': 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
    '--chroma-tile-edge': 'rgba(255, 255, 255, 0.07)',
    '--chroma-tile-highlight': 'rgba(255, 255, 255, 0.12)',
    '--chroma-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    '--chroma-media-edge': 'rgba(255, 255, 255, 0.06)',
    '--chroma-well': 'rgba(255, 255, 255, 0.08)',
    '--chroma-ink': '#f4f4f5',
    '--chroma-muted': 'rgba(244, 244, 245, 0.55)',
    '--chroma-hover': 'brightness(1.12)',
    '--chroma-press': 'brightness(0.85)'
  },
  light: {
    '--chroma-frame': 'rgba(240, 240, 243, 0.8)',
    '--chroma-frame-edge': 'rgba(24, 24, 27, 0.07)',
    '--chroma-frame-highlight': 'rgba(255, 255, 255, 0.95)',
    '--chroma-frame-shadow': '0 22px 44px -22px rgba(24, 24, 27, 0.3), 0 6px 16px -10px rgba(24, 24, 27, 0.16)',
    '--chroma-tile': 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
    '--chroma-tile-edge': 'rgba(24, 24, 27, 0.08)',
    '--chroma-tile-highlight': 'rgba(255, 255, 255, 1)',
    '--chroma-tile-shadow': '0 4px 10px -5px rgba(24, 24, 27, 0.25)',
    '--chroma-media-edge': 'rgba(24, 24, 27, 0.06)',
    '--chroma-well': 'rgba(24, 24, 27, 0.05)',
    '--chroma-ink': '#27272a',
    '--chroma-muted': 'rgba(39, 39, 42, 0.55)',
    '--chroma-hover': 'brightness(0.97)',
    '--chroma-press': 'brightness(0.92)'
  }
};

const DEFAULT_ITEMS: ChromaItem[] = [
  {
    image: 'https://images.unsplash.com/photo-1514519334989-3d5c8b1a9f91?w=800&q=80&auto=format&fit=crop',
    title: 'Golden Hour',
    subtitle: 'Sky study',
    accent: '#ff8a4c'
  },
  {
    image: 'https://images.unsplash.com/photo-1520930528075-4ea5ead759f5?w=800&q=80&auto=format&fit=crop',
    title: 'Steel Arches',
    subtitle: 'Sculpture',
    accent: '#ff5a36'
  },
  {
    image: 'https://images.unsplash.com/photo-1511300636408-a63a89df3482?w=800&q=80&auto=format&fit=crop',
    title: 'Black Beach',
    subtitle: 'Landscape',
    accent: '#a98bff'
  },
  {
    image: 'https://images.unsplash.com/photo-1524400968894-6e997a66e03f?w=800&q=80&auto=format&fit=crop',
    title: 'Cloud Front',
    subtitle: 'Weather',
    accent: '#ffb27a'
  },
  {
    image: 'https://images.unsplash.com/photo-1778849097774-0ab2a873a858?w=800&q=80&auto=format&fit=crop',
    title: 'Pink Drift',
    subtitle: 'Sky study',
    accent: '#ff7eb6'
  },
  {
    image: 'https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?w=800&q=80&auto=format&fit=crop',
    title: 'Cumulus',
    subtitle: 'Weather',
    accent: '#7cc4ff'
  }
];

const SPOT_MASK =
  'radial-gradient(circle var(--chroma-r) at calc(var(--chroma-x, -9999px) - var(--chroma-ox, 0px)) calc(var(--chroma-y, -9999px) - var(--chroma-oy, 0px)), var(--chroma-stops))';
const GRID_COLUMNS =
  'repeat(auto-fill, minmax(min(100%, max(var(--chroma-min), calc((100% - (var(--chroma-cols) - 1) * var(--chroma-gap)) / var(--chroma-cols)))), 1fr))';
const WASH = 'radial-gradient(130% 70% at 50% 100%, var(--chroma-accent), transparent 72%)';
const TILE_RIM = 'inset 0 0 0 1px var(--chroma-tile-edge), inset 0 1px 0 var(--chroma-tile-highlight)';
const GLOW_RIM = 'inset 0 0 0 1px var(--chroma-accent), inset 0 0 16px -8px var(--chroma-accent)';
const FRAME_RIM = 'inset 0 0 0 1px var(--chroma-frame-edge), inset 0 1px 0 var(--chroma-frame-highlight)';
const IMAGE_CLASS = 'absolute inset-0 block h-full w-full select-none object-cover [-webkit-user-drag:none]';
const CARD_CLASS =
  'group relative box-border flex min-w-0 flex-col gap-[10px] overflow-hidden p-2 no-underline [isolation:isolate] transition-[filter] duration-[250ms] ease-[ease] hover:[filter:var(--chroma-hover)]';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const falloffStops = (softness: number) => {
  const core = clamp(1 - softness, 0, 0.95);
  const stops = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const u = clamp((t - core) / Math.max(0.0001, 1 - core), 0, 1);
    const alpha = 1 - u * u * u * (u * (u * 6 - 15) + 10);
    stops.push(`rgba(0, 0, 0, ${alpha.toFixed(3)}) ${(t * 100).toFixed(1)}%`);
  }
  return stops.join(', ');
};

export const ChromaGrid = ({
  items,
  columns = 3,
  minCardWidth = 180,
  gap = 12,
  radius = 260,
  softness = 0.6,
  damping = 0.45,
  fadeOut = 0.6,
  grayscale = 1,
  dim = 0.12,
  glow = 0.5,
  borderGlow = 1,
  reveal = 'spotlight',
  aspectRatio = '3 / 2',
  cardRadius = 22,
  showInfo = true,
  frame = false,
  theme = 'dark',
  className = ''
}: ChromaGridProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<{ damping: number; fadeOut: number; spotlight: boolean } | null>(null);
  const placeRef = useRef<(() => void) | null>(null);
  const data = items?.length ? items : DEFAULT_ITEMS;
  settingsRef.current = { damping, fadeOut, spotlight: reveal !== 'card' };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const state = { x: 0, y: 0, tx: 0, ty: 0, power: 0, target: 0, primed: false };
    let raf = 0;
    let last = 0;

    const place = () => {
      const box = root.getBoundingClientRect();
      root.querySelectorAll<HTMLElement>('[data-chroma-area]').forEach(node => {
        const rect = node.getBoundingClientRect();
        node.style.setProperty('--chroma-ox', `${rect.left - box.left}px`);
        node.style.setProperty('--chroma-oy', `${rect.top - box.top}px`);
      });
    };
    placeRef.current = place;

    const frame = (now: number) => {
      raf = 0;
      const s = settingsRef.current;
      if (!s) return;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const follow = reduce ? 1 : 1 - Math.exp(-dt / Math.max(0.01, s.damping * 0.32));
      state.x += (state.tx - state.x) * follow;
      state.y += (state.ty - state.y) * follow;
      const span = state.target > state.power ? 0.1 : Math.max(0.02, s.fadeOut * 0.35);
      state.power += (state.target - state.power) * (reduce ? 1 : 1 - Math.exp(-dt / span));
      root.style.setProperty('--chroma-x', `${state.x.toFixed(2)}px`);
      root.style.setProperty('--chroma-y', `${state.y.toFixed(2)}px`);
      root.style.setProperty('--chroma-power', state.power.toFixed(4));
      const settled =
        Math.abs(state.tx - state.x) < 0.1 &&
        Math.abs(state.ty - state.y) < 0.1 &&
        Math.abs(state.target - state.power) < 0.002;
      if (settled) {
        state.power = state.target;
        root.style.setProperty('--chroma-power', state.power.toFixed(4));
        last = 0;
      } else {
        raf = requestAnimationFrame(frame);
      }
    };

    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onMove = (event: PointerEvent) => {
      if (!settingsRef.current?.spotlight) return;
      const box = root.getBoundingClientRect();
      state.tx = event.clientX - box.left;
      state.ty = event.clientY - box.top;
      if (!state.primed || state.power < 0.02) {
        state.x = state.tx;
        state.y = state.ty;
        state.primed = true;
      }
      state.target = 1;
      wake();
    };

    const onLeave = () => {
      state.target = 0;
      wake();
    };

    const resizeObserver = new ResizeObserver(place);
    resizeObserver.observe(root);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerdown', onMove);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('pointercancel', onLeave);
    place();

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerdown', onMove);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('pointercancel', onLeave);
      placeRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    placeRef.current?.();
  });

  const spotlight = reveal !== 'card';
  const rootStyle = {
    ...(THEMES[theme] ?? THEMES.dark),
    '--chroma-cols': Math.max(1, Math.round(columns)),
    '--chroma-min': `${Math.max(80, minCardWidth)}px`,
    '--chroma-gap': `${Math.max(0, gap)}px`,
    '--chroma-r': `${Math.max(20, radius)}px`,
    '--chroma-stops': falloffStops(clamp(softness, 0, 1)),
    '--chroma-gray': clamp(grayscale, 0, 1),
    '--chroma-dim': clamp(dim, 0, 0.9),
    '--chroma-glow': clamp(glow, 0, 1),
    '--chroma-border': clamp(borderGlow, 0, 1),
    '--chroma-fade': `${Math.max(0, fadeOut)}s`,
    '--chroma-ratio': aspectRatio,
    '--chroma-radius': `${Math.max(0, cardRadius)}px`,
    ...(frame
      ? {
          padding: 10,
          borderRadius: 'calc(var(--chroma-radius) + 10px)',
          background: 'var(--chroma-frame)',
          boxShadow: 'var(--chroma-frame-shadow)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
          backdropFilter: 'blur(20px) saturate(1.6)'
        }
      : {})
  } as CSSProperties;
  const washStyle: CSSProperties = spotlight
    ? {
        background: WASH,
        opacity: 'calc(var(--chroma-glow) * var(--chroma-power, 0) * 0.45)',
        WebkitMaskImage: SPOT_MASK,
        maskImage: SPOT_MASK
      }
    : { background: WASH };
  const colorStyle: CSSProperties = spotlight
    ? { opacity: 'var(--chroma-power, 0)', WebkitMaskImage: SPOT_MASK, maskImage: SPOT_MASK }
    : {};
  const glowStyle: CSSProperties = spotlight
    ? {
        boxShadow: GLOW_RIM,
        opacity: 'calc(var(--chroma-border) * var(--chroma-power, 0))',
        WebkitMaskImage: SPOT_MASK,
        maskImage: SPOT_MASK
      }
    : { boxShadow: GLOW_RIM };
  const fadeClass = 'opacity-0 transition-opacity duration-[var(--chroma-fade)] ease-[ease] group-hover:duration-300';

  return (
    <div
      ref={rootRef}
      className={`relative box-border w-full [-webkit-tap-highlight-color:transparent] ${className}`.trim()}
      style={rootStyle}
    >
      <div className="grid" style={{ gap: 'var(--chroma-gap)', gridTemplateColumns: GRID_COLUMNS }}>
        {data.map((item, index) => {
          const accent = item.accent ?? item.borderColor ?? '#ffffff';
          const key = `${item.title}-${index}`;
          const cardStyle = {
            '--chroma-accent': accent,
            borderRadius: 'var(--chroma-radius)',
            background: 'var(--chroma-tile)',
            boxShadow: 'var(--chroma-tile-shadow)',
            color: 'var(--chroma-ink)'
          } as CSSProperties;
          const body = (
            <>
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 z-0 ${spotlight ? '' : `${fadeClass} group-hover:opacity-[calc(var(--chroma-glow)*0.45)]`}`}
                style={washStyle}
              />
              <div
                data-chroma-area=""
                className="relative z-[1] overflow-hidden"
                style={{
                  aspectRatio: 'var(--chroma-ratio)',
                  borderRadius: 'max(0px, calc(var(--chroma-radius) - 8px))',
                  background: 'var(--chroma-well)'
                }}
              >
                <img
                  className={IMAGE_CLASS}
                  style={{ filter: 'grayscale(var(--chroma-gray)) brightness(calc(1 - var(--chroma-dim)))' }}
                  src={item.image}
                  alt={item.alt ?? item.title ?? ''}
                  loading="lazy"
                />
                <img
                  className={`${IMAGE_CLASS} ${spotlight ? '' : `${fadeClass} group-hover:opacity-100`}`}
                  style={colorStyle}
                  src={item.image}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-[inherit]"
                  style={{ boxShadow: 'inset 0 0 0 1px var(--chroma-media-edge)' }}
                />
              </div>
              {showInfo && (item.title || item.subtitle) && (
                <div className="relative z-[1] flex min-w-0 flex-col gap-0.5 px-1.5 pt-0.5 pb-1">
                  {item.title && (
                    <span className="overflow-hidden text-[15px] leading-[1.3] font-semibold tracking-[-0.01em] text-ellipsis whitespace-nowrap">
                      {item.title}
                    </span>
                  )}
                  {item.subtitle && (
                    <span
                      className="overflow-hidden text-[13px] leading-[1.35] text-ellipsis whitespace-nowrap"
                      style={{ color: 'var(--chroma-muted)' }}
                    >
                      {item.subtitle}
                    </span>
                  )}
                </div>
              )}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-[2] rounded-[inherit]"
                style={{ boxShadow: TILE_RIM }}
              />
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 z-[2] rounded-[inherit] ${spotlight ? '' : `${fadeClass} group-hover:opacity-[var(--chroma-border)]`}`}
                style={glowStyle}
              />
            </>
          );
          return item.url ? (
            <a
              key={key}
              data-chroma-area=""
              className={`${CARD_CLASS} active:[filter:var(--chroma-press)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:[outline-color:var(--chroma-ink)]`}
              style={cardStyle}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {body}
            </a>
          ) : (
            <article key={key} data-chroma-area="" className={CARD_CLASS} style={cardStyle}>
              {body}
            </article>
          );
        })}
      </div>
      {frame && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{ boxShadow: FRAME_RIM }}
        />
      )}
    </div>
  );
};

export default ChromaGrid;
