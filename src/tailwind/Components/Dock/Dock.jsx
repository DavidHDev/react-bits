'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const SIDES = ['bottom', 'top', 'left', 'right'];
const EDGE = 12;
const HOP = 0.4;
const HOP_TIME = 0.38;
const HOLD_TIME = 450;
const TAIL = 9;
const TAIL_HALF = 9;
const MENU_RADIUS = 10;
const MENU_GAP = 8;
const MARGIN = 8;
const POP = 'cubic-bezier(0.2, 1.25, 0.4, 1)';

const ROOT =
  'absolute z-10 flex box-border gap-[var(--dock-gap)] p-[var(--dock-pad)] rounded-[calc(var(--dock-base)*var(--dock-round)*0.5_+_var(--dock-pad))] [background:var(--dock-panel)] [box-shadow:inset_0_0_0_1px_var(--dock-panel-edge),inset_0_1px_0_var(--dock-panel-highlight),var(--dock-panel-shadow)] backdrop-blur-[20px] backdrop-saturate-[1.6] touch-none [transition:translate_0.5s_cubic-bezier(0.22,1,0.36,1),opacity_0.2s_ease] data-[hidden]:pointer-events-none data-[hidden]:opacity-0 data-[hidden]:[transition:translate_0.36s_cubic-bezier(0.55,0,0.75,0.15),opacity_0.24s_ease_0.1s] motion-reduce:!transition-none before:absolute before:-z-10 before:hidden before:content-[""] hover:before:block';

const ROOT_SIDES = {
  bottom:
    'bottom-[12px] left-1/2 h-[var(--dock-thickness)] items-end [transform:translateX(-50%)] data-[hidden]:[translate:0_calc(100%_+_12px)] before:inset-x-0 before:bottom-full before:h-[calc(var(--dock-reach)_+_8px)]',
  top: 'top-[12px] left-1/2 h-[var(--dock-thickness)] items-start [transform:translateX(-50%)] data-[hidden]:[translate:0_calc(-100%_-_12px)] before:inset-x-0 before:top-full before:h-[calc(var(--dock-reach)_+_8px)]',
  left: 'left-[12px] top-1/2 w-[var(--dock-thickness)] flex-col items-start [transform:translateY(-50%)] data-[hidden]:[translate:calc(-100%_-_12px)_0] before:inset-y-0 before:left-full before:w-[calc(var(--dock-reach)_+_8px)]',
  right:
    'right-[12px] top-1/2 w-[var(--dock-thickness)] flex-col items-end [transform:translateY(-50%)] data-[hidden]:[translate:calc(100%_+_12px)_0] before:inset-y-0 before:right-full before:w-[calc(var(--dock-reach)_+_8px)]'
};

const ITEM =
  'group relative m-0 flex-none cursor-pointer select-none border-0 bg-transparent p-0 outline-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] [font:inherit] w-[var(--dock-base)] h-[var(--dock-base)] text-[color:var(--dock-ink)] hover:z-[1] focus-visible:z-[1]';

const TILE = 'pointer-events-none absolute left-0 top-0 w-[var(--dock-base)] h-[var(--dock-base)] origin-top-left';

const FACE =
  'absolute inset-0 flex items-center justify-center leading-none rounded-[calc(var(--dock-base)*var(--dock-round)*0.5)] [transition:filter_0.2s_ease] group-active:[filter:var(--dock-press)] group-active:[transition-duration:0s] group-data-[open]:[filter:var(--dock-press)] group-data-[open]:[transition-duration:0s] group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-[3px] group-focus-visible:outline-[color:var(--dock-accent)]';

const FACE_TILE =
  'overflow-hidden [background:var(--dock-tile)] [box-shadow:inset_0_0_0_1px_var(--dock-tile-edge),inset_0_1px_0_var(--dock-tile-highlight),var(--dock-tile-shadow)] [font-size:calc(var(--dock-base)*0.44)]';

const FACE_BARE = '[font-size:calc(var(--dock-base)*0.62)]';

const BADGE =
  'pointer-events-none absolute box-border text-center font-semibold tabular-nums text-white [background:var(--dock-badge)] [box-shadow:0_1px_3px_rgba(0,0,0,0.3)]';

const BADGE_COUNT =
  'top-[calc(var(--dock-base)*(0.1465*var(--dock-round)_-_0.19))] right-[calc(var(--dock-base)*(0.1465*var(--dock-round)_-_0.19))] h-[calc(var(--dock-base)*0.38)] min-w-[calc(var(--dock-base)*0.38)] px-[calc(var(--dock-base)*0.1)] rounded-[calc(var(--dock-base)*0.19)] [font-size:calc(var(--dock-base)*0.22)] [line-height:calc(var(--dock-base)*0.38)]';

const BADGE_DOT =
  'top-[calc(var(--dock-base)*(0.1465*var(--dock-round)_-_0.11))] right-[calc(var(--dock-base)*(0.1465*var(--dock-round)_-_0.11))] h-[calc(var(--dock-base)*0.22)] w-[calc(var(--dock-base)*0.22)] rounded-full';

const DOT = 'pointer-events-none absolute h-1 w-1 rounded-full [background:var(--dock-dot)]';

const DOT_SIDES = {
  bottom: 'left-1/2 -ml-[2px] top-[calc(100%_+_max(var(--dock-pad)/2,5px)_-_2px)]',
  top: 'left-1/2 -ml-[2px] bottom-[calc(100%_+_max(var(--dock-pad)/2,5px)_-_2px)]',
  left: 'top-1/2 -mt-[2px] right-[calc(100%_+_max(var(--dock-pad)/2,5px)_-_2px)]',
  right: 'top-1/2 -mt-[2px] left-[calc(100%_+_max(var(--dock-pad)/2,5px)_-_2px)]'
};

const SEPARATOR = 'flex-none self-center rounded-[1px] [background:var(--dock-separator)]';

const LABEL =
  'pointer-events-none absolute whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[12px] font-medium leading-none opacity-0 [background:var(--dock-label)] text-[color:var(--dock-label-ink)] [box-shadow:inset_0_0_0_1px_var(--dock-panel-edge),0_8px_20px_-8px_rgba(0,0,0,0.35)] [transition:opacity_0.16s_ease,transform_0.16s_ease] group-hover:opacity-100 group-focus-visible:opacity-100 group-data-[hop]:!opacity-0';

const LABEL_SIDES = {
  bottom:
    'bottom-[calc(100%_+_12px)] left-1/2 [transform:translate(-50%,4px)] group-hover:[transform:translate(-50%,0)] group-focus-visible:[transform:translate(-50%,0)]',
  top: 'top-[calc(100%_+_12px)] left-1/2 [transform:translate(-50%,-4px)] group-hover:[transform:translate(-50%,0)] group-focus-visible:[transform:translate(-50%,0)]',
  left: 'left-[calc(100%_+_12px)] top-1/2 [transform:translate(-4px,-50%)] group-hover:[transform:translate(0,-50%)] group-focus-visible:[transform:translate(0,-50%)]',
  right:
    'right-[calc(100%_+_12px)] top-1/2 [transform:translate(4px,-50%)] group-hover:[transform:translate(0,-50%)] group-focus-visible:[transform:translate(0,-50%)]'
};

const MENU = 'invisible fixed left-0 top-0 z-[1000] text-[13px] leading-none text-[color:var(--dock-menu-ink)]';

const MENU_SHADOW = 'pointer-events-none absolute inset-0 rounded-[10px] [box-shadow:var(--dock-menu-shadow)]';

const MENU_GLASS = 'pointer-events-none absolute -inset-[9px] backdrop-blur-[24px] backdrop-saturate-[1.8]';

const MENU_SHAPE =
  'pointer-events-none absolute -left-[9px] -top-[9px] h-[calc(100%_+_18px)] w-[calc(100%_+_18px)] overflow-visible';

const MENU_PATH = '[fill:var(--dock-menu)] [stroke:var(--dock-menu-edge)] [stroke-width:1px]';

const MENU_LIST = 'relative box-border flex min-w-[172px] max-w-[280px] flex-col p-[5px] outline-none';

const MENU_HIGHLIGHT =
  'pointer-events-none absolute left-[5px] right-[5px] top-0 h-6 rounded-md opacity-0 [background:var(--dock-accent)] [transition:transform_0.16s_cubic-bezier(0.3,0.8,0.3,1),height_0.16s_cubic-bezier(0.3,0.8,0.3,1),opacity_0.12s_ease] motion-reduce:!transition-none';

const MENU_ROW =
  'relative m-0 box-border flex h-6 w-full cursor-default items-center gap-[5px] whitespace-nowrap rounded-md border-0 bg-transparent pl-[7px] pr-2.5 text-left outline-none [-webkit-tap-highlight-color:transparent] [font:inherit]';

const MENU_SEPARATOR = 'mx-2.5 my-[5px] h-px flex-none [background:var(--dock-menu-separator)]';

const MUTED = 'text-[color:var(--dock-menu-muted)]';

const THEMES = {
  dark: {
    '--dock-panel': 'rgba(38, 35, 46, 0.66)',
    '--dock-panel-edge': 'rgba(255, 255, 255, 0.08)',
    '--dock-panel-highlight': 'rgba(255, 255, 255, 0.07)',
    '--dock-panel-shadow': '0 22px 44px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)',
    '--dock-tile': 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
    '--dock-tile-edge': 'rgba(255, 255, 255, 0.07)',
    '--dock-tile-highlight': 'rgba(255, 255, 255, 0.12)',
    '--dock-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    '--dock-ink': '#f4f4f5',
    '--dock-label': '#2a2731',
    '--dock-label-ink': '#f4f4f5',
    '--dock-dot': 'rgba(255, 255, 255, 0.72)',
    '--dock-separator': 'rgba(255, 255, 255, 0.12)',
    '--dock-press': 'brightness(0.75)',
    '--dock-menu': 'rgba(40, 37, 47, 0.8)',
    '--dock-menu-edge': 'rgba(255, 255, 255, 0.13)',
    '--dock-menu-ink': '#f4f4f5',
    '--dock-menu-muted': 'rgba(244, 244, 245, 0.42)',
    '--dock-menu-separator': 'rgba(255, 255, 255, 0.1)',
    '--dock-menu-shadow': '0 18px 40px -12px rgba(0, 0, 0, 0.65), 0 3px 10px rgba(0, 0, 0, 0.3)'
  },
  light: {
    '--dock-panel': 'rgba(240, 240, 243, 0.8)',
    '--dock-panel-edge': 'rgba(24, 24, 27, 0.07)',
    '--dock-panel-highlight': 'rgba(255, 255, 255, 0.95)',
    '--dock-panel-shadow': '0 22px 44px -22px rgba(24, 24, 27, 0.3), 0 6px 16px -10px rgba(24, 24, 27, 0.16)',
    '--dock-tile': 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
    '--dock-tile-edge': 'rgba(24, 24, 27, 0.08)',
    '--dock-tile-highlight': 'rgba(255, 255, 255, 1)',
    '--dock-tile-shadow': '0 4px 10px -5px rgba(24, 24, 27, 0.25)',
    '--dock-ink': '#27272a',
    '--dock-label': '#ffffff',
    '--dock-label-ink': '#18181b',
    '--dock-dot': 'rgba(24, 24, 27, 0.55)',
    '--dock-separator': 'rgba(24, 24, 27, 0.12)',
    '--dock-press': 'brightness(0.9)',
    '--dock-menu': 'rgba(248, 248, 250, 0.86)',
    '--dock-menu-edge': 'rgba(24, 24, 27, 0.1)',
    '--dock-menu-ink': '#18181b',
    '--dock-menu-muted': 'rgba(24, 24, 27, 0.4)',
    '--dock-menu-separator': 'rgba(24, 24, 27, 0.1)',
    '--dock-menu-shadow': '0 18px 40px -14px rgba(24, 24, 27, 0.3), 0 3px 10px rgba(24, 24, 27, 0.1)'
  }
};

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const hasBadge = badge => badge !== undefined && badge !== null && badge !== false;
const usable = row => !!row && !row.separator && !row.disabled;
const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));

const menuPath = (width, height, side, at) => {
  const r = MENU_RADIUS;
  const p = (x, y) => `${(x + TAIL).toFixed(2)} ${(y + TAIL).toFixed(2)}`;
  const tail = (x, y, dx, dy, nx, ny) => {
    const q = (u, v) => p(x + dx * u + nx * v, y + dy * u + ny * v);
    return `L ${q(-TAIL_HALF, 0)} L ${q(-TAIL_HALF * 0.18, TAIL * 0.82)} Q ${q(0, TAIL)} ${q(TAIL_HALF * 0.18, TAIL * 0.82)} L ${q(TAIL_HALF, 0)}`;
  };
  return [
    `M ${p(r, 0)}`,
    side === 'top' ? tail(at, 0, 1, 0, 0, -1) : '',
    `L ${p(width - r, 0)} A ${r} ${r} 0 0 1 ${p(width, r)}`,
    side === 'right' ? tail(width, at, 0, 1, 1, 0) : '',
    `L ${p(width, height - r)} A ${r} ${r} 0 0 1 ${p(width - r, height)}`,
    side === 'bottom' ? tail(at, height, -1, 0, 0, 1) : '',
    `L ${p(r, height)} A ${r} ${r} 0 0 1 ${p(0, height - r)}`,
    side === 'left' ? tail(0, at, 0, -1, -1, 0) : '',
    `L ${p(0, r)} A ${r} ${r} 0 0 1 ${p(r, 0)} Z`
  ].join(' ');
};

const CheckGlyph = () => (
  <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronGlyph = () => (
  <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 3.5L10.5 8 6 12.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function DockMenu({
  rows,
  label,
  side = null,
  point,
  edge,
  tokens,
  nested = false,
  focusFirst = false,
  closing = false,
  pressingRef,
  onSelect,
  onDismiss,
  onBack,
  onEnter,
  onExited
}) {
  const outerRef = useRef(null);
  const listRef = useRef(null);
  const glassRef = useRef(null);
  const shapeRef = useRef(null);
  const pathRef = useRef(null);
  const highlightRef = useRef(null);
  const rowRefs = useRef([]);
  const frameRef = useRef(null);
  const timerRef = useRef(0);
  const aliveRef = useRef(true);
  const reduceRef = useRef(false);
  const callbacks = useRef({});
  const [active, setActive] = useState(-1);
  const [sub, setSub] = useState(null);
  const [blink, setBlink] = useState(false);
  const [chosen, setChosen] = useState(false);
  const checks = rows.some(row => row && !row.separator && row.checked !== undefined);

  callbacks.current = { onSelect, onDismiss, onBack, onExited };

  useIsomorphicLayoutEffect(() => {
    const outer = outerRef.current;
    const list = listRef.current;
    const glass = glassRef.current;
    const shape = pathRef.current;
    if (!outer || !list || !glass || !shape) return undefined;
    aliveRef.current = true;
    const layers = [outer.firstElementChild, glass, shapeRef.current, list].filter(Boolean);
    const { x, y } = point ?? { x: 0, y: 0 };
    const box = edge ?? { left: 0, right: 0, top: 0 };
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    reduceRef.current = reduce;
    const width = list.offsetWidth;
    const height = list.offsetHeight;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    let left;
    let top;
    let at = 0;
    let origin;
    if (side === 'bottom' || side === 'top') {
      left = clamp(x - width / 2, MARGIN, vw - MARGIN - width);
      top = side === 'bottom' ? y - TAIL - height : y + TAIL;
      at = clamp(x - left, MENU_RADIUS + TAIL_HALF, width - MENU_RADIUS - TAIL_HALF);
      origin = `${at}px ${side === 'bottom' ? height + TAIL : -TAIL}px`;
    } else if (side === 'left' || side === 'right') {
      top = clamp(y - height / 2, MARGIN, vh - MARGIN - height);
      left = side === 'right' ? x - TAIL - width : x + TAIL;
      at = clamp(y - top, MENU_RADIUS + TAIL_HALF, height - MENU_RADIUS - TAIL_HALF);
      origin = `${side === 'right' ? width + TAIL : -TAIL}px ${at}px`;
    } else {
      const flip = box.right - 4 + width > vw - MARGIN && box.left + 4 - width >= MARGIN;
      left = flip ? box.left + 4 - width : box.right - 4;
      top = clamp(box.top - 5, MARGIN, vh - MARGIN - height);
      origin = flip ? 'right top' : 'left top';
    }
    const path = menuPath(width, height, side, at);
    frameRef.current = { left, top, width, height };
    outer.style.left = `${left}px`;
    outer.style.top = `${top}px`;
    outer.style.transformOrigin = origin;
    outer.style.visibility = 'visible';
    glass.style.clipPath = `path('${path}')`;
    shape.setAttribute('d', path);
    if (reduce) {
      layers.forEach(layer => layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120, easing: 'ease-out' }));
    } else {
      outer.animate([{ transform: `scale(${nested ? 0.94 : 0.82})` }, { transform: 'scale(1)' }], {
        duration: nested ? 220 : 340,
        easing: POP
      });
      layers.forEach(layer =>
        layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: nested ? 120 : 160, easing: 'ease-out' })
      );
    }
    const first = rows.findIndex(usable);
    if (focusFirst && first >= 0) {
      setActive(first);
      rowRefs.current[first]?.focus({ preventScroll: true });
    } else {
      list.focus({ preventScroll: true });
    }
    return () => {
      aliveRef.current = false;
      window.clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!closing) return undefined;
    const outer = outerRef.current;
    const layers = [outer?.firstElementChild, glassRef.current, shapeRef.current, listRef.current].filter(Boolean);
    const duration = reduceRef.current ? 100 : 150;
    let done = false;
    const finish = () => {
      if (done || !aliveRef.current) return;
      done = true;
      callbacks.current.onExited?.();
    };
    if (outer && !reduceRef.current) {
      outer.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.96)' }], {
        duration,
        easing: 'ease-in',
        fill: 'forwards'
      });
    }
    layers.forEach(layer =>
      layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration, easing: 'ease-in', fill: 'forwards' })
    );
    const timer = window.setTimeout(finish, duration);
    return () => window.clearTimeout(timer);
  }, [closing]);

  useIsomorphicLayoutEffect(() => {
    const highlight = highlightRef.current;
    if (!highlight) return;
    const row = rowRefs.current[active];
    if (!row || blink) {
      if (blink) highlight.style.transition = 'none';
      highlight.style.opacity = '0';
      return;
    }
    const jump = highlight.style.opacity !== '1' || reduceRef.current;
    if (jump) highlight.style.transition = 'none';
    highlight.style.transform = `translateY(${row.offsetTop}px)`;
    highlight.style.height = `${row.offsetHeight}px`;
    highlight.style.opacity = '1';
    if (jump) {
      void highlight.offsetHeight;
      highlight.style.transition = '';
    }
  }, [active, blink]);

  const activate = index => {
    setActive(index);
    rowRefs.current[index]?.focus({ preventScroll: true });
  };

  const openSub = (index, keyboard) => {
    window.clearTimeout(timerRef.current);
    const frame = frameRef.current;
    const row = rowRefs.current[index];
    if (!frame || !row) return;
    setSub({
      index,
      keyboard,
      edge: { left: frame.left, right: frame.left + frame.width, top: frame.top + row.offsetTop }
    });
  };

  const closeSub = () => {
    window.clearTimeout(timerRef.current);
    setSub(null);
  };

  const choose = (index, keyboard) => {
    if (chosen) return;
    const row = rows[index];
    setChosen(true);
    setActive(index);
    window.clearTimeout(timerRef.current);
    if (reduceRef.current) {
      callbacks.current.onSelect?.(row, keyboard);
      return;
    }
    setBlink(true);
    window.setTimeout(() => aliveRef.current && setBlink(false), 70);
    window.setTimeout(() => aliveRef.current && callbacks.current.onSelect?.(row, keyboard), 150);
  };

  const enterRow = index => {
    if (chosen || active === index || !usable(rows[index])) return;
    activate(index);
    window.clearTimeout(timerRef.current);
    if (rows[index].items?.length) {
      if (sub?.index !== index) timerRef.current = window.setTimeout(() => openSub(index, false), 120);
    } else if (sub) {
      timerRef.current = window.setTimeout(closeSub, 220);
    }
  };

  const onKeyDown = event => {
    if (chosen) return;
    const { key } = event;
    const order = rows.flatMap((row, i) => (usable(row) ? [i] : []));
    let handled = true;
    if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Home' || key === 'End') {
      if (order.length) {
        const at = order.indexOf(active);
        let next = order[0];
        if (key === 'End') next = order[order.length - 1];
        else if (key === 'ArrowDown') next = order[(at + 1) % order.length];
        else if (key === 'ArrowUp') next = order[at <= 0 ? order.length - 1 : at - 1];
        if (sub) closeSub();
        activate(next);
      }
    } else if (key === 'ArrowRight' && rows[active]?.items?.length) {
      openSub(active, true);
    } else if ((key === 'ArrowLeft' || key === 'Escape') && nested) {
      callbacks.current.onBack?.();
    } else if (key === 'Escape' || key === 'Tab') {
      callbacks.current.onDismiss?.(true);
    } else {
      handled = false;
    }
    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const subRow = sub ? rows[sub.index] : null;

  return (
    <>
      {createPortal(
        <div ref={outerRef} className={MENU} style={tokens} data-dock-menu="">
          <span className={MENU_SHADOW} />
          <span ref={glassRef} className={MENU_GLASS} />
          <svg ref={shapeRef} className={MENU_SHAPE} aria-hidden="true">
            <path ref={pathRef} className={MENU_PATH} />
          </svg>
          <div
            ref={listRef}
            className={MENU_LIST}
            role="menu"
            aria-label={label}
            tabIndex={-1}
            onKeyDown={onKeyDown}
            onPointerEnter={() => onEnter?.()}
            onPointerLeave={() => {
              if (sub || chosen) return;
              setActive(-1);
              listRef.current?.focus({ preventScroll: true });
            }}
          >
            <span ref={highlightRef} className={MENU_HIGHLIGHT} />
            {rows.map((row, index) => {
              if (!row) return null;
              if (row.separator) return <span key={index} className={MENU_SEPARATOR} role="separator" />;
              const lit = index === active && !blink;
              const submenu = Boolean(row.items?.length);
              return (
                <button
                  key={index}
                  ref={node => {
                    rowRefs.current[index] = node;
                  }}
                  type="button"
                  className={`${MENU_ROW} ${lit ? 'text-white' : row.disabled ? MUTED : 'text-inherit'}`}
                  role={row.checked !== undefined ? 'menuitemcheckbox' : 'menuitem'}
                  aria-checked={row.checked !== undefined ? Boolean(row.checked) : undefined}
                  aria-disabled={row.disabled ? true : undefined}
                  aria-haspopup={submenu ? 'menu' : undefined}
                  aria-expanded={submenu ? sub?.index === index : undefined}
                  tabIndex={-1}
                  data-dock-row={index}
                  data-active={lit ? '' : undefined}
                  onPointerMove={() => enterRow(index)}
                  onPointerUp={() => {
                    if (!pressingRef?.current || !usable(row) || submenu) return;
                    pressingRef.current = false;
                    choose(index, false);
                  }}
                  onClick={event => {
                    if (chosen || !usable(row)) return;
                    if (submenu) openSub(index, event.detail === 0);
                    else choose(index, event.detail === 0);
                  }}
                >
                  {checks ? (
                    <span className="flex w-[14px] flex-none items-center justify-center">
                      {row.checked ? <CheckGlyph /> : null}
                    </span>
                  ) : null}
                  {row.icon ? (
                    <span className="mr-px flex flex-none items-center justify-center text-[15px]">{row.icon}</span>
                  ) : null}
                  <span className="min-w-0 flex-1 overflow-hidden text-ellipsis">{row.label}</span>
                  {row.shortcut ? (
                    <span className={`ml-[18px] flex-none ${lit ? 'text-white/70' : MUTED}`}>{row.shortcut}</span>
                  ) : null}
                  {submenu ? (
                    <span className={`ml-[14px] flex flex-none ${lit ? 'text-inherit' : MUTED}`}>
                      <ChevronGlyph />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
      {sub ? (
        <DockMenu
          key={sub.index}
          rows={subRow?.items ?? []}
          label={typeof subRow?.label === 'string' ? subRow.label : undefined}
          edge={sub.edge}
          tokens={tokens}
          nested
          focusFirst={sub.keyboard}
          closing={closing}
          pressingRef={pressingRef}
          onSelect={(row, keyboard) => callbacks.current.onSelect?.(row, keyboard)}
          onDismiss={restore => callbacks.current.onDismiss?.(restore)}
          onBack={() => {
            const index = sub.index;
            closeSub();
            activate(index);
          }}
          onEnter={() => {
            window.clearTimeout(timerRef.current);
            setActive(sub.index);
          }}
        />
      ) : null}
    </>
  );
}

export default function Dock({
  items = [],
  position = 'bottom',
  theme = 'dark',
  baseItemSize = 50,
  magnification = 70,
  distance = 200,
  panelHeight = 68,
  gap = 10,
  roundness = 0.5,
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  bounce = true,
  autoHide = false,
  tiles = true,
  showLabels = true,
  showIndicators = true,
  showBadges = true,
  badgeColor = '#ff453a',
  accentColor = '#0a84ff',
  className = '',
  style
}) {
  const rootRef = useRef(null);
  const itemRefs = useRef([]);
  const wakeRef = useRef(null);
  const actionsRef = useRef(null);
  const menuRef = useRef(null);
  const serialRef = useRef(0);
  const pressRef = useRef(null);
  const pressingRef = useRef(false);
  const skipRef = useRef(-1);
  const [fit, setFit] = useState(1);
  const [menu, setMenu] = useState(null);
  const side = SIDES.includes(position) ? position : 'bottom';
  const vertical = side === 'left' || side === 'right';
  const rawBase = Math.max(16, baseItemSize);
  const rawPeak = Math.max(rawBase, magnification);
  const rawThickness = Math.max(rawBase, panelHeight);
  const rawGap = Math.max(0, gap);
  const length =
    items.reduce((sum, item) => sum + (item?.separator ? 1 : rawBase), 0) +
    rawGap * Math.max(0, items.length - 1) +
    rawThickness -
    rawBase;
  const base = rawBase * fit;
  const peak = rawPeak * fit;
  const thickness = rawThickness * fit;
  const tokens = { ...(THEMES[theme] ?? THEMES.dark), '--dock-accent': accentColor, '--dock-badge': badgeColor };

  const settings = {
    items,
    side,
    vertical,
    length: length + rawPeak - rawBase,
    base,
    peak,
    thickness,
    gap: rawGap * fit,
    distance: Math.max(1, distance) * fit,
    mass: Math.max(0.01, spring?.mass ?? 0.1),
    stiffness: Math.max(1, spring?.stiffness ?? 150),
    damping: Math.max(0, spring?.damping ?? 12),
    bounce,
    autoHide
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  menuRef.current = menu;

  useEffect(() => {
    wakeRef.current?.();
  });

  useIsomorphicLayoutEffect(() => {
    if (autoHide) rootRef.current?.setAttribute('data-hidden', '');
  }, []);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const host = root.offsetParent ?? document.documentElement;
    const measure = () => {
      const s = settingsRef.current;
      const room = (s.vertical ? host.clientHeight : host.clientWidth) - EDGE * 2;
      const next = s.length > 0 ? Math.min(1, Math.max(0.4, room / s.length)) : 1;
      setFit(Math.round(next * 1000) / 1000);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, [length, vertical, rawPeak, rawBase]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const motion = new Map();
    const pointer = { x: 0, y: 0, inside: false };
    let focused = -1;
    let held = null;
    let lastFocus = null;
    let lastRest = [];
    let lastBase = settingsRef.current.base;
    let hidden = root.hasAttribute('data-hidden');
    let hiding = settingsRef.current.autoHide;
    let hideTimer = 0;
    let raf = 0;
    let last = 0;
    let alive = true;

    const entry = index => {
      let state = motion.get(index);
      if (!state) {
        state = {
          size: settingsRef.current.base,
          velocity: 0,
          lift: 0,
          rise: 0,
          launch: 0,
          gravity: 0,
          hopping: false,
          drawn: '',
          node: null
        };
        motion.set(index, state);
      }
      return state;
    };

    const tick = now => {
      raf = 0;
      if (!alive) return;
      const s = settingsRef.current;
      const dt = Math.min(1 / 30, Math.max(0.001, (now - last) / 1000));
      last = now;
      if (s.base !== lastBase) {
        const ratio = s.base / lastBase;
        motion.forEach(state => {
          state.size *= ratio;
          state.velocity *= ratio;
        });
        lastBase = s.base;
      }
      const rect = root.getBoundingClientRect();
      const center = s.vertical ? rect.top + rect.height / 2 : rect.left + rect.width / 2;
      const spans = s.items.map(item => (item?.separator ? 1 : s.base));
      let cursor = -(spans.reduce((sum, span) => sum + span, 0) + s.gap * Math.max(0, spans.length - 1)) / 2;
      const rest = spans.map(span => {
        const middle = cursor + span / 2;
        cursor += span + s.gap;
        return middle;
      });
      let focus = null;
      if (held !== null) focus = held;
      else if (pointer.inside) focus = (s.vertical ? pointer.y : pointer.x) - center;
      else if (rest[focused] !== undefined) focus = rest[focused];
      lastFocus = focus;
      lastRest = rest;
      const steps = Math.max(1, Math.ceil(dt * 240));
      const h = dt / steps;
      const k = s.stiffness / s.mass;
      const c = s.damping / s.mass;
      let moving = false;

      s.items.forEach((item, index) => {
        const node = itemRefs.current[index];
        if (!node || item?.separator) return;
        const state = entry(index);
        const reach = focus === null ? 1 : Math.abs(focus - rest[index]) / s.distance;
        const target = s.base + (s.peak - s.base) * (reach < 1 ? Math.cos((reach * Math.PI) / 2) ** 2 : 0);
        if (reduce) {
          state.size = target;
          state.velocity = 0;
        } else {
          for (let i = 0; i < steps; i++) {
            state.velocity = (state.velocity + h * k * (target - state.size)) / (1 + h * c + h * h * k);
            state.size += state.velocity * h;
            if (!state.hopping) continue;
            state.rise -= state.gravity * h;
            state.lift += state.rise * h;
            if (state.lift > 0) continue;
            state.lift = 0;
            state.rise *= -0.36;
            if (state.rise < state.launch * 0.2) {
              state.rise = 0;
              state.hopping = false;
              node.removeAttribute('data-hop');
            }
          }
        }
        if (Math.abs(state.velocity) < 0.01 && Math.abs(target - state.size) < 0.01) {
          state.size = target;
          state.velocity = 0;
        } else {
          moving = true;
        }
        if (state.hopping) moving = true;
        const size = Math.max(1, state.size);
        const drawn = `${size.toFixed(2)} ${state.lift.toFixed(2)} ${s.side}`;
        if (drawn === state.drawn && node === state.node) return;
        state.drawn = drawn;
        state.node = node;
        const lift = s.side === 'bottom' || s.side === 'right' ? -state.lift : state.lift;
        const tile = node.firstElementChild;
        node.style.width = `${size}px`;
        node.style.height = `${size}px`;
        if (tile)
          tile.style.transform = `translate(${s.vertical ? `${lift}px, 0` : `0, ${lift}px`}) scale(${size / s.base})`;
      });

      if (moving) raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (raf || !alive) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const show = () => {
      window.clearTimeout(hideTimer);
      hideTimer = 0;
      if (!hidden) return;
      hidden = false;
      root.removeAttribute('data-hidden');
    };

    const hide = () => {
      window.clearTimeout(hideTimer);
      hideTimer = 0;
      const blocked = pointer.inside || held !== null || root.contains(document.activeElement);
      if (hidden || !settingsRef.current.autoHide || blocked) return;
      hidden = true;
      root.setAttribute('data-hidden', '');
    };

    const hideLater = () => {
      if (hidden || hideTimer || !settingsRef.current.autoHide) return;
      hideTimer = window.setTimeout(hide, 600);
    };

    wakeRef.current = () => {
      const enabled = settingsRef.current.autoHide;
      if (enabled !== hiding) {
        hiding = enabled;
        if (enabled) hide();
        else show();
      }
      wake();
    };

    actionsRef.current = {
      hop: index => {
        const node = itemRefs.current[index];
        if (reduce || !settingsRef.current.bounce || !node) return;
        const state = entry(index);
        if (state.hopping) return;
        const height = state.size * HOP;
        state.gravity = (8 * height) / (HOP_TIME * HOP_TIME);
        state.launch = (state.gravity * HOP_TIME) / 2;
        state.rise = state.launch;
        state.hopping = true;
        node.setAttribute('data-hop', '');
        wake();
      },
      focus: index => {
        focused = index;
        wake();
      },
      hold: index => {
        if (index === null) {
          held = null;
          wake();
          hideLater();
          return;
        }
        held = lastFocus ?? lastRest[index] ?? 0;
        show();
        wake();
      }
    };

    const onMove = event => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.inside = true;
      show();
      wake();
    };
    const onLeave = () => {
      pointer.inside = false;
      wake();
      hideLater();
    };
    const onFocusOut = event => {
      if (!root.contains(event.relatedTarget)) hideLater();
    };
    const onWindowMove = event => {
      const s = settingsRef.current;
      if (!s.autoHide || pointer.inside) return;
      const host = root.offsetParent;
      const rect = host
        ? host.getBoundingClientRect()
        : { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
      const zone = EDGE + s.thickness * 0.6;
      const x = event.clientX;
      const y = event.clientY;
      const within = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      const near = {
        bottom: y >= rect.bottom - zone,
        top: y <= rect.top + zone,
        left: x <= rect.left + zone,
        right: x >= rect.right - zone
      }[s.side];
      if (within && near) show();
      else hideLater();
    };

    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerdown', onMove);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('pointercancel', onLeave);
    root.addEventListener('focusin', show);
    root.addEventListener('focusout', onFocusOut);
    window.addEventListener('pointermove', onWindowMove);
    window.addEventListener('pointerdown', onWindowMove);
    wake();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(hideTimer);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerdown', onMove);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('pointercancel', onLeave);
      root.removeEventListener('focusin', show);
      root.removeEventListener('focusout', onFocusOut);
      window.removeEventListener('pointermove', onWindowMove);
      window.removeEventListener('pointerdown', onWindowMove);
      wakeRef.current = null;
      actionsRef.current = null;
      const press = pressRef.current;
      if (press) {
        window.clearTimeout(press.timer);
        press.cleanup();
      }
    };
  }, []);

  const closeMenu = useCallback(restore => {
    const current = menuRef.current;
    if (!current || current.closing) return;
    const rows = settingsRef.current.items[current.index]?.menu ?? [];
    const next = { ...current, closing: true, restore, rows };
    menuRef.current = next;
    setMenu(next);
  }, []);

  const finishMenu = useCallback(() => {
    const current = menuRef.current;
    menuRef.current = null;
    setMenu(null);
    actionsRef.current?.hold(null);
    if (current?.restore) itemRefs.current[current.index]?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!menu || menu.closing) return undefined;
    const owner = itemRefs.current[menu.index];
    const onDown = event => {
      const target = event.target;
      if (target instanceof Element && (target.closest('[data-dock-menu]') || owner?.contains(target))) return;
      closeMenu(false);
    };
    const onScroll = event => {
      if (event.target instanceof Element && event.target.closest('[data-dock-menu]')) return;
      closeMenu(false);
    };
    const onAway = () => closeMenu(false);
    document.addEventListener('pointerdown', onDown, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onAway);
    window.addEventListener('blur', onAway);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onAway);
      window.removeEventListener('blur', onAway);
    };
  }, [menu, closeMenu]);

  const openMenu = (index, mode) => {
    const node = itemRefs.current[index];
    if (!node || !items[index]?.menu?.length) return false;
    const current = menuRef.current;
    if (current && current.index === index && !current.closing) return true;
    actionsRef.current?.hold(index);
    const rect = node.getBoundingClientRect();
    const point = {
      bottom: { x: rect.left + rect.width / 2, y: rect.top - MENU_GAP },
      top: { x: rect.left + rect.width / 2, y: rect.bottom + MENU_GAP },
      left: { x: rect.right + MENU_GAP, y: rect.top + rect.height / 2 },
      right: { x: rect.left - MENU_GAP, y: rect.top + rect.height / 2 }
    }[side];
    serialRef.current += 1;
    const next = {
      id: serialRef.current,
      index,
      point,
      keyboard: mode === 'keyboard',
      closing: false,
      restore: false
    };
    menuRef.current = next;
    setMenu(next);
    return true;
  };

  const endPress = () => {
    const press = pressRef.current;
    if (!press) return;
    window.clearTimeout(press.timer);
    press.cleanup();
    pressRef.current = null;
  };

  const startPress = (event, index) => {
    endPress();
    const target = event.currentTarget;
    const press = { id: event.pointerId, x: event.clientX, y: event.clientY, timer: 0, cleanup: () => {} };
    if (target.hasPointerCapture?.(event.pointerId)) target.releasePointerCapture(event.pointerId);
    const onMove = moved => {
      if (moved.pointerId !== press.id) return;
      if (Math.hypot(moved.clientX - press.x, moved.clientY - press.y) > 8) endPress();
    };
    const onUp = released => {
      if (released.pointerId === press.id) endPress();
    };
    press.cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    press.timer = window.setTimeout(() => {
      press.cleanup();
      pressRef.current = null;
      if (!openMenu(index, 'press')) return;
      skipRef.current = index;
      pressingRef.current = true;
      window.addEventListener(
        'pointerup',
        () => {
          pressingRef.current = false;
        },
        { once: true }
      );
    }, HOLD_TIME);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    pressRef.current = press;
  };

  const onItemKeyDown = (event, index) => {
    const toward = { bottom: 'ArrowUp', top: 'ArrowDown', left: 'ArrowRight', right: 'ArrowLeft' }[side];
    if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10') || event.key === toward) {
      if (openMenu(index, 'keyboard')) event.preventDefault();
      return;
    }
    const order = items.flatMap((item, i) => (item?.separator ? [] : [i]));
    const at = order.indexOf(index);
    const keys = vertical ? ['ArrowUp', 'ArrowDown'] : ['ArrowLeft', 'ArrowRight'];
    let next;
    if (event.key === keys[0]) next = order[(at - 1 + order.length) % order.length];
    else if (event.key === keys[1]) next = order[(at + 1) % order.length];
    else if (event.key === 'Home') next = order[0];
    else if (event.key === 'End') next = order[order.length - 1];
    if (next === undefined) return;
    event.preventDefault();
    itemRefs.current[next]?.focus();
  };

  const openIndex = menu && !menu.closing ? menu.index : -1;

  return (
    <div
      ref={rootRef}
      className={`${ROOT} ${ROOT_SIDES[side]}${className ? ` ${className}` : ''}`}
      role="toolbar"
      aria-label="Dock"
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      style={{
        ...tokens,
        '--dock-base': `${base}px`,
        '--dock-thickness': `${thickness}px`,
        '--dock-gap': `${rawGap * fit}px`,
        '--dock-pad': `${(thickness - base) / 2}px`,
        '--dock-reach': `${peak - base}px`,
        '--dock-round': clamp(roundness, 0, 1),
        ...style
      }}
    >
      {items.map((item, index) =>
        item?.separator ? (
          <span
            key={index}
            className={`${SEPARATOR} ${vertical ? 'h-px w-[calc(var(--dock-base)*0.72)]' : 'h-[calc(var(--dock-base)*0.72)] w-px'}`}
            aria-hidden="true"
          />
        ) : (
          <button
            key={index}
            ref={node => {
              itemRefs.current[index] = node;
            }}
            type="button"
            className={`${ITEM}${item.className ? ` ${item.className}` : ''}`}
            aria-label={item.label}
            aria-haspopup={item.menu?.length ? 'menu' : undefined}
            aria-expanded={item.menu?.length ? openIndex === index : undefined}
            data-open={openIndex === index ? '' : undefined}
            onPointerDown={event => {
              skipRef.current = -1;
              const current = menuRef.current;
              if (current && !current.closing) {
                if (event.button === 2 || event.ctrlKey) return;
                skipRef.current = index;
                closeMenu(false);
                return;
              }
              if (item.menu?.length && event.button === 0 && !event.ctrlKey) startPress(event, index);
            }}
            onContextMenu={event => {
              if (!item.menu?.length) return;
              event.preventDefault();
              endPress();
              openMenu(index, 'pointer');
            }}
            onClick={() => {
              if (skipRef.current === index) {
                skipRef.current = -1;
                return;
              }
              actionsRef.current?.hop(index);
              item.onClick?.();
            }}
            onFocus={event => {
              if (event.currentTarget.matches(':focus-visible')) actionsRef.current?.focus(index);
            }}
            onBlur={() => actionsRef.current?.focus(-1)}
            onKeyDown={event => onItemKeyDown(event, index)}
          >
            <span className={TILE}>
              <span className={`${FACE} ${tiles ? FACE_TILE : FACE_BARE}`}>{item.icon}</span>
              {showBadges && hasBadge(item.badge) ? (
                <span className={`${BADGE} ${item.badge === true ? BADGE_DOT : BADGE_COUNT}`}>
                  {item.badge === true ? null : item.badge}
                </span>
              ) : null}
            </span>
            {showIndicators && item.active ? <span className={`${DOT} ${DOT_SIDES[side]}`} aria-hidden="true" /> : null}
            {showLabels && item.label && !menu ? (
              <span className={`${LABEL} ${LABEL_SIDES[side]}`} aria-hidden="true">
                {item.label}
              </span>
            ) : null}
          </button>
        )
      )}
      {menu ? (
        <DockMenu
          key={menu.id}
          rows={menu.rows ?? items[menu.index]?.menu ?? []}
          label={items[menu.index]?.label}
          side={side}
          point={menu.point}
          tokens={tokens}
          focusFirst={menu.keyboard}
          closing={menu.closing}
          pressingRef={pressingRef}
          onSelect={(row, keyboard) => {
            closeMenu(keyboard || Boolean(menuRef.current?.keyboard));
            row.onClick?.();
          }}
          onDismiss={closeMenu}
          onExited={finishMenu}
        />
      ) : null}
    </div>
  );
}
