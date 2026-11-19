import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { advAsset } from './assets';
import './AdventCalendar.css';

const loadCalendar = () => import('./AdventCalendar');
const loadStage = () => import('./stage');
const AdventCalendar = lazy(loadCalendar);

const LOOP = 5;

const readTheme = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

const whenIdle = callback => {
  if ('requestIdleCallback' in window) return window.requestIdleCallback(callback, { timeout: 2500 });
  return window.setTimeout(callback, 1200);
};

const AdventGift = () => {
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
    if (away) el.pause();
    else el.play?.().catch(() => {});
  }, [away, video, theme]);

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
    const rect = mediaRef.current.getBoundingClientRect();
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
    <div className={`adv-gift${away ? ' is-away' : ''}${back ? ' is-back' : ''}${busy ? ' is-busy' : ''}`}>
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
