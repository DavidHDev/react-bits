import { useLayoutEffect, useRef, useState } from 'react';
import { Menu, useMenuContext } from '@chakra-ui/react';
import { motion, useReducedMotion } from 'motion/react';

const FluidMenuContent = ({ children, ...props }) => {
  const menu = useMenuContext();
  const contentRef = useRef(null);
  const [highlight, setHighlight] = useState(null);
  const reduceMotion = useReducedMotion();

  useLayoutEffect(() => {
    if (!menu.open) {
      setHighlight(null);
      return;
    }

    if (!menu.highlightedValue) return;

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
  }, [menu.open, menu.highlightedValue]);

  const revealHighlight = () => {
    setHighlight(previous => (previous && !previous.visible ? { ...previous, visible: true } : previous));
  };

  return (
    <Menu.Content
      {...props}
      ref={contentRef}
      position="relative"
      isolation="isolate"
      onPointerMove={event => {
        if (event.pointerType === 'mouse' && event.target.closest('[data-part="item"]:not([data-disabled])')) {
          revealHighlight();
        }
      }}
      onKeyDown={revealHighlight}
      onPointerLeave={() => setHighlight(previous => (previous ? { ...previous, visible: false } : previous))}
      css={{
        '& [data-part="item"]': {
          position: 'relative',
          zIndex: 1,
          bg: 'transparent',
          _hover: { bg: 'transparent' },
          _highlighted: { bg: 'transparent' }
        }
      }}
    >
      {highlight && (
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
            borderRadius: 6,
            background: 'var(--bg-hover)',
            pointerEvents: 'none'
          }}
        />
      )}
      {children}
    </Menu.Content>
  );
};

export default FluidMenuContent;
