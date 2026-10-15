import { useEffect } from 'react';

export default function usePrefetchOnIntent(rules) {
  useEffect(() => {
    const done = new Set();

    const prefetch = event => {
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!anchor) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      const rule = rules.find(item => item.test(url.pathname));
      if (!rule || done.has(rule)) return;
      done.add(rule);
      rule.load().catch(() => done.delete(rule));
    };

    const options = { capture: true, passive: true };
    document.addEventListener('pointerover', prefetch, options);
    document.addEventListener('focusin', prefetch, options);
    document.addEventListener('touchstart', prefetch, options);
    return () => {
      document.removeEventListener('pointerover', prefetch, options);
      document.removeEventListener('focusin', prefetch, options);
      document.removeEventListener('touchstart', prefetch, options);
    };
  }, [rules]);
}
