import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import Navbar from '../components/landingnew/Navbar/Navbar';
import PowerCable from '../components/common/NotFound/PowerCable';
import FloatingShards from '../components/common/NotFound/FloatingShards';
import ElectricLogo from '../content/Animations/ElectricLogo/ElectricLogo';
import { useColorModeValue } from '../components/setup/color-mode';
import usePageSEO from '../hooks/usePageSEO';
import { findComponentBySlug, suggestComponents } from '../utils/routeMatch';
import markup from '../assets/svg/404.svg?raw';

const MARK_SRC = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
const MARK_VIEWBOX = markup.match(/viewBox="([^"]+)"/)[1];
const MARK_PATH = markup.match(/ d="([^"]+)"/)[1];
const CABLE_ANCHOR = { x: 1738, y: 726 };
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
const SPUTTER = [
  [0, 0.3],
  [60, 0.85],
  [120, 0.12],
  [190, 0.5],
  [240, 0]
];
const RECONNECT = [
  [0, 0.7],
  [70, 0.05],
  [240, 0.45],
  [300, 0],
  [470, 1]
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
  const [plugged, setPlugged] = useState(true);
  const [power, setPower] = useState(0);
  const stageRef = useRef(null);
  const anchorRef = useRef(null);
  const titleRef = useRef(null);
  const timers = useRef([]);

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
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setPower(plugged ? 1 : 0);
    };
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, [plugged]);

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
    const sync = () => stage.style.setProperty('--nf-glyph-w', `${title.getBoundingClientRect().width}px`);
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

  const handlePlugChange = useCallback(
    next => {
      setPlugged(next);
      play(next ? RECONNECT : SPUTTER);
    },
    [play]
  );

  const lit = plugged && power === 1;

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
    <div className="nf" style={{ '--nf-power': power }}>
      <Navbar showDocs />

      <main className="nf-main">
        <FloatingShards reducedMotion={reducedMotion} />
        <div ref={stageRef} className="nf-stage" style={{ '--nf-scale': STAGE_SCALE }} aria-hidden="true">
          <svg className="nf-tubes" viewBox={MARK_VIEWBOX} preserveAspectRatio="xMidYMid meet">
            <path d={MARK_PATH} />
            <circle ref={anchorRef} cx={CABLE_ANCHOR.x} cy={CABLE_ANCHOR.y} r="1" />
          </svg>
          <ElectricLogo
            src={MARK_SRC}
            theme={theme}
            color={palette.color}
            glowColor={palette.glowColor}
            bend={palette.bend}
            glow={palette.glow}
            intensity={plugged ? power : 0}
            interactive={!reducedMotion}
            speed={reducedMotion ? 0 : 2.5}
            arcs={reducedMotion ? 0 : 1}
            flicker={reducedMotion ? 0 : 0.6}
            scale={STAGE_SCALE}
            thickness={1.6}
            cursorRadius={90}
          />
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
      </main>

      <nav className="nf-categories" aria-label="Categories">
        {CATEGORY_LINKS.map(link => (
          <Link key={link.to} to={link.to}>
            {link.label}
          </Link>
        ))}
      </nav>

      <PowerCable
        layoutKey={pathname}
        stageRef={stageRef}
        anchorRef={anchorRef}
        plugged={plugged}
        powered={lit}
        onPlugChange={handlePlugChange}
        reducedMotion={reducedMotion}
      />
    </div>
  );
};

export default NotFoundPage;
