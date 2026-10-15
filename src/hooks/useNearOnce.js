import { useEffect, useRef, useState } from 'react';

export default function useNearOnce(rootMargin = '600px 0px') {
  const ref = useRef(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || near) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [near, rootMargin]);

  return [ref, near];
}
