import { useEffect, useRef, useState } from 'react';

import { useColorModeValue } from '../../setup/color-mode';

const resolveMedia = (path, baseUrl) =>
  path?.startsWith('/') ? path : path ? new URL(path, `${baseUrl.replace(/\/$/, '')}/`).href : '';

const ProMedia = ({ item, baseUrl = 'https://reactbits.dev/rbp', className = '' }) => {
  const ref = useRef(null);
  const light = useColorModeValue(true, false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState([]);
  const still = resolveMedia(light ? item?.media?.light : item?.media?.dark, baseUrl);
  const poster = resolveMedia(item?.media?.poster, baseUrl);
  const animated = resolveMedia(item?.media?.animated, baseUrl);
  const moving = playing && animated && !failed.includes(animated) ? animated : poster;
  const source = still && !failed.includes(still) ? still : moving;

  useEffect(() => {
    const node = ref.current;
    if (!node || still) return undefined;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    const update = () => setPlaying(visible && !motion.matches && !document.hidden);
    const observer = new IntersectionObserver(
      entries => {
        visible = entries.some(entry => entry.isIntersecting);
        update();
      },
      { rootMargin: '80px' }
    );
    observer.observe(node);
    motion.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      observer.disconnect();
      motion.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, [still]);

  return (
    <span ref={ref} className={`pro-media ${className}`} aria-hidden="true">
      {source && !failed.includes(source) ? (
        <img
          src={source}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(previous => [...new Set([...previous, source])])}
        />
      ) : (
        <span className="pro-media-fallback">{item?.name}</span>
      )}
    </span>
  );
};

export default ProMedia;
