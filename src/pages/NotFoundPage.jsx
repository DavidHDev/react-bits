import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useMotionValueEvent, useSpring } from 'motion/react';
import Navbar from '../components/landingnew/Navbar/Navbar';
import FloatingShards from '../components/common/NotFound/FloatingShards';
import CategoryGallery from '../components/common/NotFound/CategoryGallery';
import ElectricLogo from '../content/Animations/ElectricLogo/ElectricLogo';
import { useColorModeValue } from '../components/setup/color-mode';
import usePageSEO from '../hooks/usePageSEO';
import { findComponentBySlug, suggestComponents } from '../utils/routeMatch';
import markup from '../assets/svg/404.svg?raw';

const MARK_SRC = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
const MARK_VIEWBOX = markup.match(/viewBox="([^"]+)"/)[1];
const MARK_PATH = markup.match(/ d="([^"]+)"/)[1];
const STAGE_SCALE = 0.56;

const PALETTES = {
  dark: { color: '#ecc7ff', glowColor: '#ad6dff', bend: 0.6, glow: 0.35 },
  light: { color: '#a953ff', glowColor: '#c79bff', bend: 0.5, glow: 0.7 }
};

const CATEGORY_LINKS = [
  { label: 'Text Animations', to: '/c/text-animations' },
  { label: 'Animations', to: '/c/animations' },
  { label: 'Components', to: '/c/components' },
  { label: 'Backgrounds', to: '/c/backgrounds' },
  { label: 'Micro', to: '/c/micro' }
];

const BOOT = [
  [420, 0.55],
  [500, 0.04],
  [760, 0.38],
  [820, 0],
  [1080, 1]
];
const BROWNOUT = [
  [0, 0.3],
  [70, 1],
  [150, 0.55],
  [210, 1]
];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

const NotFoundPage = () => {
  const { pathname, search, hash } = useLocation();
  const theme = useColorModeValue('light', 'dark');
  const palette = PALETTES[theme];
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  const [entering, setEntering] = useState(() => !prefersReducedMotion());
  const [power, setPower] = useState(0);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [focusedCategory, setFocusedCategory] = useState(null);
  const [galleryCategory, setGalleryCategory] = useState(null);
  const previewCategory = hoveredCategory || focusedCategory;
  const displayedCategory = previewCategory || galleryCategory;
  const previewActive = Boolean(previewCategory);
  const previewProgress = useSpring(0, { stiffness: 180, damping: 27, mass: 1 });
  const pageRef = useRef(null);
  const stageRef = useRef(null);
  const galleryRef = useRef(null);
  const reflectionRef = useRef(null);
  const galleryReflectionRef = useRef(null);
  const reflectElectricity = useCallback(canvas => reflectionRef.current?.(canvas), []);
  const reflectGallery = useCallback(canvas => galleryReflectionRef.current?.(canvas), []);
  const titleRef = useRef(null);
  const timers = useRef([]);
  const hoverExit = useRef(0);

  useMotionValueEvent(previewProgress, 'change', value => {
    pageRef.current?.style.setProperty('--nf-preview', Math.max(0, Math.min(1, value)));
  });

  useEffect(() => {
    if (previewCategory) {
      setGalleryCategory(previewCategory);
      setEntering(false);
    }
    if (reducedMotion) previewProgress.jump(previewActive ? 1 : 0);
    else previewProgress.set(previewActive ? 1 : 0);
  }, [previewCategory, previewActive, previewProgress, reducedMotion]);

  useEffect(() => {
    const clearPreview = () => {
      clearTimeout(hoverExit.current);
      setHoveredCategory(null);
      setFocusedCategory(null);
    };
    window.addEventListener('blur', clearPreview);
    return () => {
      clearTimeout(hoverExit.current);
      window.removeEventListener('blur', clearPreview);
    };
  }, []);

  const previewOnHover = (event, category) => {
    if (event.pointerType === 'touch') return;
    clearTimeout(hoverExit.current);
    setHoveredCategory(category);
  };
  const finishHover = () => {
    clearTimeout(hoverExit.current);
    hoverExit.current = setTimeout(() => setHoveredCategory(null), 100);
  };

  const segments = pathname.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1] || '';
  const direct = segments.length === 1 ? findComponentBySlug(lastSegment) : null;
  const suggestions = useMemo(() => suggestComponents(lastSegment), [lastSegment]);

  usePageSEO({
    title: 'Page not found - React Bits',
    description: 'This page does not exist. Browse free animated React components, backgrounds and micro-interactions.',
    path: pathname
  });

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      setReducedMotion(query.matches);
      if (query.matches) setEntering(false);
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setPower(1);
    };
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setEntering(false), 1900);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const robots = document.head.querySelector('meta[name="robots"]');
    if (!robots) return undefined;
    const previous = robots.getAttribute('content');
    robots.setAttribute('content', 'noindex');
    return () => robots.setAttribute('content', previous);
  }, []);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const title = titleRef.current;
    if (!stage || !title) return undefined;
    const sync = () => stage.style.setProperty('--nf-glyph-w', `${title.offsetWidth}px`);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(title);
    return () => observer.disconnect();
  }, []);

  const play = useCallback(sequence => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (prefersReducedMotion()) {
      setPower(sequence[sequence.length - 1][1]);
      return;
    }
    sequence.forEach(([at, level]) => {
      timers.current.push(setTimeout(() => setPower(level), at));
    });
  }, []);

  useEffect(() => {
    play(BOOT);
    const pending = timers;
    return () => pending.current.forEach(clearTimeout);
  }, [play]);

  const lit = power === 1;

  useEffect(() => {
    if (!lit || reducedMotion) return undefined;
    let timeout = 0;
    const schedule = () => {
      timeout = setTimeout(
        () => {
          play(BROWNOUT);
          schedule();
        },
        5200 + Math.random() * 7000
      );
    };
    schedule();
    return () => clearTimeout(timeout);
  }, [lit, play, reducedMotion]);

  if (direct) return <Navigate to={{ pathname: direct.path, search, hash }} replace />;

  return (
    <div
      ref={pageRef}
      className="nf"
      data-entering={entering ? '' : undefined}
      data-preview={previewActive ? '' : undefined}
      style={{ '--nf-power': power }}
    >
      <Navbar showDocs />

      <main className="nf-main">
        <FloatingShards
          reducedMotion={reducedMotion}
          theme={theme}
          stageRef={stageRef}
          galleryRef={galleryRef}
          reflectionRef={reflectionRef}
          galleryReflectionRef={galleryReflectionRef}
          previewProgress={previewProgress}
          layoutKey={`${pathname}:${suggestions.length}`}
        />
        <div className="nf-default" inert={previewActive} aria-hidden={previewActive || undefined}>
          <div ref={stageRef} className="nf-stage" style={{ '--nf-scale': STAGE_SCALE }} aria-hidden="true">
            <div className="nf-sign">
              <svg className="nf-tubes" viewBox={MARK_VIEWBOX} preserveAspectRatio="xMidYMid meet">
                <path d={MARK_PATH} />
              </svg>
              <ElectricLogo
                onRender={reflectElectricity}
                src={MARK_SRC}
                theme={theme}
                color={palette.color}
                glowColor={palette.glowColor}
                bend={palette.bend}
                glow={palette.glow}
                intensity={power}
                interactive={!reducedMotion}
                speed={reducedMotion ? 0 : 2.5}
                arcs={reducedMotion ? 0 : 1}
                flicker={reducedMotion ? 0 : 0.6}
                scale={STAGE_SCALE}
                thickness={1.6}
                cursorRadius={90}
              />
            </div>
          </div>

          <h1 ref={titleRef} className="nf-title">
            <span className="nf-sr-only">404. </span>
            This page doesn’t exist
          </h1>

          {suggestions.length > 0 && (
            <nav className="nf-suggest" aria-label="Suggested components">
              <span className="nf-suggest-label">Did you mean</span>
              {suggestions.map(item => (
                <Link key={item.path} to={item.path} className="nf-suggest-link">
                  <span className="nf-suggest-name">{item.name}</span>
                  <span className="nf-suggest-category">{item.category}</span>
                </Link>
              ))}
            </nav>
          )}

          <Link to="/get-started/index" className="nf-btn">
            Browse Components
          </Link>
        </div>

        <section
          className="nf-gallery"
          aria-label={`${displayedCategory || 'Category'} previews`}
          aria-hidden={!previewActive}
        >
          <div ref={galleryRef} className="nf-gallery-surface">
            <CategoryGallery
              category={displayedCategory}
              active={previewActive}
              reducedMotion={reducedMotion}
              theme={theme}
              onFrame={reflectGallery}
            />
          </div>
        </section>
      </main>

      <nav className="nf-categories" aria-label="Categories">
        {CATEGORY_LINKS.map((link, index) => (
          <Link
            key={link.to}
            to={link.to}
            style={{ '--nf-order': index }}
            data-previewing={previewCategory === link.label ? '' : undefined}
            onPointerEnter={event => previewOnHover(event, link.label)}
            onPointerLeave={finishHover}
            onFocus={event => {
              if (!event.currentTarget.matches(':focus-visible')) return;
              clearTimeout(hoverExit.current);
              setHoveredCategory(null);
              setFocusedCategory(link.label);
            }}
            onBlur={() => setFocusedCategory(null)}
            onKeyDown={event => {
              if (event.key !== 'Escape') return;
              clearTimeout(hoverExit.current);
              setHoveredCategory(null);
              setFocusedCategory(null);
            }}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default NotFoundPage;
