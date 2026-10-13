import { useEffect } from 'react';

const TAU = 0.055;

const useSmoothScroll = (scroller, enabled) => {
  useEffect(() => {
    if (!scroller || !enabled) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    let target = scroller.scrollTop;
    let middle = target;
    let current = target;
    let written = target;
    let raf = 0;
    let last = 0;

    const sync = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
      target = middle = current = written = scroller.scrollTop;
    };

    const step = now => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
      last = now;
      const blend = 1 - Math.exp(-dt / TAU);
      middle += (target - middle) * blend;
      current += (middle - current) * blend;
      if (Math.abs(target - current) < 0.3 && Math.abs(target - middle) < 0.3) {
        current = middle = target;
        raf = 0;
        last = 0;
      } else {
        raf = requestAnimationFrame(step);
      }
      written = current;
      scroller.scrollTop = current;
    };

    const onWheel = event => {
      if (event.ctrlKey) return;
      if (!raf && Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (!event.cancelable) {
        sync();
        return;
      }
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? scroller.clientHeight : 1;
      const delta = event.deltaY * unit;
      const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight - 1);
      if (!raf) target = middle = current = written = scroller.scrollTop;
      if (!raf && ((delta < 0 && target <= 1) || (delta > 0 && target >= max - 1))) return;
      event.preventDefault();
      target = Math.min(max, Math.max(0, target + delta));
      if (!raf && Math.abs(target - current) >= 0.3) raf = requestAnimationFrame(step);
    };

    const onScroll = () => {
      if (raf && Math.abs(scroller.scrollTop - written) < 2) return;
      sync();
    };

    scroller.addEventListener('wheel', onWheel, { passive: false });
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      scroller.removeEventListener('wheel', onWheel);
      scroller.removeEventListener('scroll', onScroll);
    };
  }, [scroller, enabled]);
};

export default useSmoothScroll;
