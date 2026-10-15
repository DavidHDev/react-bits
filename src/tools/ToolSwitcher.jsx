import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Tick02Icon, UnfoldMoreIcon } from '@hugeicons/core-free-icons';
import { Icon } from './background-studio/components/ui';
import { TOOLS } from '../constants/Tools';
import { TOOL_ICONS as ICONS } from './toolIcons';

const GAP = 6;

export default function ToolSwitcher({ activeId }) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(-1);
  const [mounted, setMounted] = useState(false);
  const [place, setPlace] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const highlightRef = useRef(null);
  const itemsRef = useRef([]);
  const shownRef = useRef(false);
  const activeIndex = Math.max(
    0,
    TOOLS.findIndex(tool => tool.id === activeId)
  );
  const active = TOOLS[activeIndex];

  useEffect(() => setMounted(true), []);

  const close = useCallback(refocus => {
    setOpen(false);
    setHover(-1);
    if (refocus) triggerRef.current?.focus();
  }, []);

  const measure = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setPlace({ top: rect.bottom + GAP, left: rect.left, width: rect.width });
  }, []);

  useLayoutEffect(() => {
    if (open) measure();
  }, [open, measure]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = event => {
      if (triggerRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return;
      close(false);
    };
    document.addEventListener('pointerdown', onPointer);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, close, measure]);

  useLayoutEffect(() => {
    const highlight = highlightRef.current;
    if (!highlight) return;
    const item = open ? itemsRef.current[hover] : null;
    if (!item) {
      highlight.style.opacity = '0';
      shownRef.current = false;
      return;
    }
    highlight.style.height = `${item.offsetHeight}px`;
    if (!shownRef.current) {
      highlight.style.transition = 'none';
      highlight.style.transform = `translateY(${item.offsetTop}px)`;
      highlight.getBoundingClientRect();
      highlight.style.transition = '';
    } else {
      highlight.style.transform = `translateY(${item.offsetTop}px)`;
    }
    highlight.style.opacity = '1';
    shownRef.current = true;
  }, [hover, open]);

  const focusItem = index => {
    const next = (index + TOOLS.length) % TOOLS.length;
    setHover(next);
    itemsRef.current[next]?.focus();
  };

  const onTriggerKey = event => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    setOpen(true);
    const index = event.key === 'ArrowUp' ? TOOLS.length - 1 : activeIndex;
    requestAnimationFrame(() => focusItem(index));
  };

  const onMenuKey = event => {
    const moves = { ArrowDown: hover + 1, ArrowUp: hover - 1, Home: 0, End: TOOLS.length - 1 };
    if (event.key in moves) {
      event.preventDefault();
      focusItem(moves[event.key]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
    } else if (event.key === 'Tab') {
      close(false);
    }
  };

  const menu = (
    <div
      ref={menuRef}
      className="tool-switch-menu"
      role="menu"
      aria-label="Tools"
      data-open={open ? '' : undefined}
      style={place ? { top: place.top, left: place.left, width: place.width } : undefined}
      onKeyDown={onMenuKey}
      onPointerLeave={() => setHover(-1)}
    >
      <span className="tool-switch-highlight" ref={highlightRef} aria-hidden="true" />
      {TOOLS.map((tool, index) => (
        <Link
          key={tool.id}
          ref={node => {
            itemsRef.current[index] = node;
          }}
          to={tool.path}
          role="menuitemradio"
          aria-checked={tool.id === active.id}
          tabIndex={-1}
          className="tool-switch-item"
          onPointerEnter={() => setHover(index)}
          onFocus={() => setHover(index)}
          onClick={() => close(false)}
        >
          <Icon icon={ICONS[tool.id]} size={18} />
          <span className="tool-switch-text">
            <span className="tool-switch-name">{tool.label}</span>
            <span className="tool-switch-tagline">{tool.tagline}</span>
          </span>
          <span className="tool-switch-check">
            <Icon icon={Tick02Icon} size={16} />
          </span>
        </Link>
      ))}
    </div>
  );

  return (
    <div className="tool-switch" data-open={open ? '' : undefined}>
      <button
        ref={triggerRef}
        type="button"
        className="tool-switch-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? close(false) : setOpen(true))}
        onKeyDown={onTriggerKey}
      >
        <Icon icon={ICONS[active.id]} size={18} />
        <span className="tool-switch-label">{active.label}</span>
        <Icon icon={UnfoldMoreIcon} size={16} />
      </button>
      {mounted && createPortal(menu, document.body)}
    </div>
  );
}
