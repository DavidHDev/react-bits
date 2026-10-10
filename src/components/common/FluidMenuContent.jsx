import { useLayoutEffect, useRef, useState } from 'react';
import { Menu, Select, useMenuContext, useSelectContext } from '@chakra-ui/react';
import { motion, useReducedMotion } from 'motion/react';

const ITEM_CSS = {
  '& [data-part="item"]': {
    position: 'relative',
    zIndex: 1,
    bg: 'transparent',
    _hover: { bg: 'transparent' },
    _highlighted: { bg: 'transparent' }
  }
};

const useFluidHighlight = (open, highlightedValue) => {
  const contentRef = useRef(null);
  const [highlight, setHighlight] = useState(null);

  useLayoutEffect(() => {
    if (!open) {
      setHighlight(null);
      return;
    }

    if (!highlightedValue) return;

    const content = contentRef.current;
    const item = content?.querySelector('[data-part="item"][data-highlighted]');
    if (!item) return;

    const update = activate => {
      setHighlight(previous => {
        const next = {
          x: item.offsetLeft,
          y: item.offsetTop,
          width: item.offsetWidth,
          height: item.offsetHeight,
          visible: activate || previous?.visible || false
        };

        return previous && Object.keys(next).every(key => previous[key] === next[key]) ? previous : next;
      });
    };

    update(true);
    const observer = new ResizeObserver(() => update(false));
    observer.observe(content);
    observer.observe(item);
    return () => observer.disconnect();
  }, [open, highlightedValue]);

  const reveal = () => {
    setHighlight(previous => (previous && !previous.visible ? { ...previous, visible: true } : previous));
  };

  const handlers = {
    onPointerMove: event => {
      if (event.pointerType === 'mouse' && event.target.closest('[data-part="item"]:not([data-disabled])')) {
        reveal();
      }
    },
    onKeyDown: reveal,
    onPointerLeave: () => setHighlight(previous => (previous ? { ...previous, visible: false } : previous))
  };

  return { contentRef, highlight, handlers };
};

const Highlight = ({ highlight }) => {
  const reduceMotion = useReducedMotion();
  if (!highlight) return null;
  return (
    <motion.div
      aria-hidden="true"
      data-menu-highlight=""
      initial={false}
      animate={{
        x: highlight.x,
        y: highlight.y,
        width: highlight.width,
        height: highlight.height,
        opacity: highlight.visible ? 1 : 0
      }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { type: 'spring', stiffness: 550, damping: 42, mass: 0.7, opacity: { duration: 0.12 } }
      }
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 0,
        borderRadius: 9,
        background: 'var(--menu-highlight)',
        pointerEvents: 'none'
      }}
    />
  );
};

const withMenuClass = className => (className ? `docs-menu ${className}` : 'docs-menu');

export const FluidSelectContent = ({ children, className, ...props }) => {
  const select = useSelectContext();
  const { contentRef, highlight, handlers } = useFluidHighlight(select.open, select.highlightedValue);

  return (
    <Select.Content
      {...props}
      {...handlers}
      className={withMenuClass(className)}
      ref={contentRef}
      position="relative"
      isolation="isolate"
      css={ITEM_CSS}
    >
      {children}
      <Highlight highlight={highlight} />
    </Select.Content>
  );
};

const FluidMenuContent = ({ children, className, ...props }) => {
  const menu = useMenuContext();
  const { contentRef, highlight, handlers } = useFluidHighlight(menu.open, menu.highlightedValue);

  return (
    <Menu.Content
      {...props}
      {...handlers}
      className={withMenuClass(className)}
      ref={contentRef}
      position="relative"
      isolation="isolate"
      css={ITEM_CSS}
    >
      {children}
      <Highlight highlight={highlight} />
    </Menu.Content>
  );
};

export default FluidMenuContent;
