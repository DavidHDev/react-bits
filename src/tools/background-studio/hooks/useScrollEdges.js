import { useEffect, useState } from 'react';

const EDGE = 2;

export function useScrollEdges(ref, itemSelector) {
  const [edges, setEdges] = useState({ top: true, bottom: true, below: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const remaining = element.scrollHeight - element.scrollTop - element.clientHeight;
      const limit = element.getBoundingClientRect().bottom - 8;
      const below = itemSelector
        ? [...element.querySelectorAll(itemSelector)].filter(item => item.getBoundingClientRect().top > limit).length
        : 0;
      const next = { top: element.scrollTop <= EDGE, bottom: remaining <= EDGE, below };
      setEdges(previous =>
        previous.top === next.top && previous.bottom === next.bottom && previous.below === next.below ? previous : next
      );
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    element.addEventListener('scroll', schedule, { passive: true });
    const resize = new ResizeObserver(schedule);
    resize.observe(element);
    const mutations = new MutationObserver(() => {
      resize.disconnect();
      resize.observe(element);
      [...element.children].forEach(child => resize.observe(child));
      schedule();
    });
    [...element.children].forEach(child => resize.observe(child));
    mutations.observe(element, { childList: true });

    return () => {
      element.removeEventListener('scroll', schedule);
      resize.disconnect();
      mutations.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [ref, itemSelector]);

  return edges;
}
