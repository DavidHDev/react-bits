import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { advAsset } from './assets';
import './AdventCalendar.css';

const loadCalendar = () => import('./AdventCalendar');
const loadStage = () => import('./stage');
const AdventCalendar = lazy(loadCalendar);

const LOOP = 8;
const AVOID = '.sc-card, .ln-sp-card';

const readTheme = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

const whenIdle = callback => {
  if ('requestIdleCallback' in window) return window.requestIdleCallback(callback, { timeout: 2500 });
  return window.setTimeout(callback, 1200);
};

const AdventGift = () => {
  const { pathname } = useLocation();
  const hostRef = useRef(null);
  const mediaRef = useRef(null);
  const videoRef = useRef(null);
  const buttonRef = useRef(null);
  const stageRef = useRef(null);
  const prepareRef = useRef(0);
  const [theme, setTheme] = useState(readTheme);
  const [video, setVideo] = useState(false);
  const [origin, setOrigin] = useState(null);
  const [away, setAway] = useState(false);
  const [back, setBack] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tucked, setTucked] = useState(false);
  const reduce = useMemo(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false, []);
  const apple = useMemo(() => /Apple/.test(navigator.vendor || ''), []);

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(readTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduce) return undefined;
    let id = 0;
    const start = () => {
      id = whenIdle(() => setVideo(true));
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => {
      window.removeEventListener('load', start);
      if ('cancelIdleCallback' in window) window.cancelIdleCallback(id);
      window.clearTimeout(id);
    };
  }, [reduce]);

  useEffect(() => () => window.clearTimeout(prepareRef.current), []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (away || tucked) el.pause();
    else el.play?.().catch(() => {});
  }, [away, tucked, video, theme]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !('IntersectionObserver' in window)) return undefined;
    const watched = new Set();
    const hits = new Map();
    let observer = null;
    const update = entries => {
      entries.forEach(entry => hits.set(entry.target, entry.isIntersecting));
      setTucked([...hits.values()].some(Boolean));
    };
    const build = () => {
      observer?.disconnect();
      hits.clear();
      const r = host.getBoundingClientRect();
      const inset = [r.top, window.innerWidth - r.right, window.innerHeight - r.bottom, r.left];
      const rootMargin = inset.map(v => `${Math.min(0, -Math.round(v - 10))}px`).join(' ');
      observer = new IntersectionObserver(update, { rootMargin });
      watched.forEach(el => el.isConnected && observer.observe(el));
    };
    const scan = () => {
      document.querySelectorAll(AVOID).forEach(el => {
        if (watched.has(el)) return;
        watched.add(el);
        observer.observe(el);
      });
    };
    build();
    scan();
    const timers = [400, 1200, 3000, 6000].map(ms => window.setTimeout(scan, ms));
    window.addEventListener('resize', build);
    return () => {
      timers.forEach(id => window.clearTimeout(id));
      window.removeEventListener('resize', build);
      observer.disconnect();
      setTucked(false);
    };
  }, [pathname]);

  const prepare = useCallback(() => {
    if (prepareRef.current) return;
    prepareRef.current = window.setTimeout(() => {
      loadCalendar().catch(() => {});
      if (reduce) return;
      loadStage()
        .then(module => {
          stageRef.current = module;
          module.prepareStage(readTheme());
        })
        .catch(() => {});
    }, 700);
  }, [reduce]);

  const cancelPrepare = useCallback(() => {
    window.clearTimeout(prepareRef.current);
    prepareRef.current = 0;
  }, []);

  const open = useCallback(async () => {
    if (origin || busy) return;
    cancelPrepare();
    setBusy(true);
    try {
      await loadCalendar();
      if (!reduce) {
        const module = await loadStage();
        stageRef.current = module;
        await module.prepareStage(readTheme(), { urgent: true }).ready;
      }
    } catch {
      stageRef.current = null;
    }
    const media = mediaRef.current;
    const host = hostRef.current;
    let rect = media.getBoundingClientRect();
    if (host.classList.contains('is-tucked')) {
      const box = host.getBoundingClientRect();
      const scale = host.offsetWidth ? box.width / host.offsetWidth : 1;
      rect = {
        left: box.left + media.offsetLeft * scale,
        top: box.top + media.offsetTop * scale,
        width: media.offsetWidth * scale
      };
    }
    const el = videoRef.current;
    const time = el && el.readyState >= 2 ? el.currentTime % LOOP : 0;
    setBusy(false);
    setOrigin({ rect: { x: rect.left, y: rect.top, size: rect.width }, time, theme: readTheme() });
  }, [busy, cancelPrepare, origin, reduce]);

  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    if (window.location.hash !== '#advent') return undefined;
    const id = window.setTimeout(() => {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      openRef.current();
    }, 900);
    return () => window.clearTimeout(id);
  }, []);

  const started = useCallback(() => setAway(true), []);

  const closed = useCallback(() => {
    setOrigin(null);
    setAway(false);
    setBack(true);
    window.setTimeout(() => setBack(false), 720);
    requestAnimationFrame(() => buttonRef.current?.focus({ preventScroll: true }));
  }, []);

  const poster = advAsset(`gift-${theme}.webp`);

  return (
    <div
      ref={hostRef}
      className={`adv-gift${away ? ' is-away' : ''}${back ? ' is-back' : ''}${busy ? ' is-busy' : ''}${
        tucked && !origin ? ' is-tucked' : ''
      }`}
    >
      <button
        ref={buttonRef}
        type="button"
        className="adv-gift-hit"
        onClick={open}
        onPointerEnter={prepare}
        onPointerLeave={cancelPrepare}
        onFocus={prepare}
        aria-label="Open the React Bits advent calendar"
        aria-haspopup="dialog"
      >
        <span ref={mediaRef} className="adv-gift-media" aria-hidden="true">
          {video ? (
            <video
              key={theme}
              ref={videoRef}
              className="adv-gift-video"
              poster={poster}
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              preload="auto"
            >
              {apple ? (
                <source src={advAsset(`gift-${theme}.mov`)} type='video/mp4; codecs="hvc1"' />
              ) : (
                <source src={advAsset(`gift-${theme}.webm`)} type="video/webm" />
              )}
            </video>
          ) : (
            <img className="adv-gift-video" src={poster} alt="" draggable="false" />
          )}
        </span>
        <span className="adv-gift-label">Advent Calendar 2026</span>
      </button>
      {origin && (
        <Suspense fallback={null}>
          <AdventCalendar origin={origin} stageModule={stageRef.current} onStarted={started} onClosed={closed} />
        </Suspense>
      )}
    </div>
  );
};

export default AdventGift;
