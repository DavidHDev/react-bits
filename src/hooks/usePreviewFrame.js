import { useLayoutEffect, useState } from 'react';

export const MIN_PREVIEW_WIDTH = 320;

const sameFrame = (a, b) =>
  a !== null &&
  b !== null &&
  a.top === b.top &&
  a.left === b.left &&
  a.height === b.height &&
  a.fullWidth === b.fullWidth;

const readFrame = panel => {
  const demo = panel.querySelector('.demo-container');
  const parent = demo?.parentElement;
  if (!demo || !parent) return { demo: null, frame: null };
  const panelRect = panel.getBoundingClientRect();
  const demoRect = demo.getBoundingClientRect();
  if (panelRect.width === 0 || demoRect.width === 0) return { demo, frame: null };
  const parentRect = parent.getBoundingClientRect();
  const contentRight =
    parentRect.left + parent.clientLeft + parent.clientWidth - parseFloat(getComputedStyle(parent).paddingRight);
  return {
    demo,
    frame: {
      top: demoRect.top - panelRect.top - panel.clientTop,
      left: demoRect.left - panelRect.left - panel.clientLeft,
      height: demoRect.height,
      fullWidth: Math.max(MIN_PREVIEW_WIDTH, Math.floor(contentRight - demoRect.left))
    }
  };
};

export const usePreviewFrame = (panelRef, enabled) => {
  const [frame, setFrame] = useState(null);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!enabled || !panel) {
      setFrame(null);
      return undefined;
    }
    let observed = null;
    const measure = () => {
      const { demo, frame: next } = readFrame(panel);
      if (demo !== observed) {
        if (observed) observer.unobserve(observed);
        if (demo) observer.observe(demo);
        observed = demo;
      }
      setFrame(prev => (sameFrame(prev, next) ? prev : next));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    measure();
    return () => observer.disconnect();
  }, [enabled, panelRef]);

  return frame;
};
