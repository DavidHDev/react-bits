import { useEffect, useLayoutEffect, useState } from 'react';
import Navbar from '@/components/landingnew/Navbar/Navbar';
import Hero from '@/components/landingnew/Hero/Hero';
import Features from '@/components/landingnew/Features/Features';
import Testimonials from '@/components/landingnew/Testimonials/Testimonials';
import LiveDemo from '@/components/landingnew/LiveDemo/LiveDemo';
import ProSpotlight from '@/components/landingnew/ProSpotlight/ProSpotlight';
import QuickStart from '@/components/landingnew/QuickStart/QuickStart';
import Ownership from '@/components/landingnew/Ownership/Ownership';
import Sponsors from '@/components/landingnew/Sponsors/Sponsors';
import CTA from '@/components/landingnew/CTA/CTA';
import Footer from '@/components/landingnew/Footer/Footer';
import LandingLoader from '@/components/landingnew/LandingLoader/LandingLoader';
import useScrollToTop from '../hooks/useScrollToTop';
import usePageSEO from '../hooks/usePageSEO';
import usePauseOffscreenAnimations from '../hooks/usePauseOffscreenAnimations';
import { HOME_SEO } from '../utils/seo';

const MIN_LOADER_MS = 800;
const MAX_FONT_WAIT_MS = 2500;
const LOADER_FADE_MS = 600;

const LandingPage = () => {
  const [phase, setPhase] = useState('loading');
  const [hidingLoader, setHidingLoader] = useState(false);
  const ready = phase === 'ready';

  useScrollToTop();
  usePageSEO(HOME_SEO);
  usePauseOffscreenAnimations(phase !== 'loading');

  useLayoutEffect(() => {
    if (ready) return;
    document.documentElement.setAttribute('data-rb-landing-loading', '');

    return () => {
      document.documentElement.removeAttribute('data-rb-landing-loading');
    };
  }, [ready]);

  useEffect(() => {
    let cancelled = false;
    let minimumTimer;
    let fontTimer;
    const started = performance.now();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fontDeadline = new Promise(resolve => {
      fontTimer = window.setTimeout(resolve, MAX_FONT_WAIT_MS);
    });
    const reveal = () => setPhase(reducedMotion ? 'ready' : 'revealing');

    Promise.race([document.fonts?.ready ?? Promise.resolve(), fontDeadline])
      .catch(() => {})
      .then(() => {
        window.clearTimeout(fontTimer);
        if (cancelled) return;
        const remaining = reducedMotion ? 0 : Math.max(0, MIN_LOADER_MS - (performance.now() - started));
        if (remaining > 0) minimumTimer = window.setTimeout(reveal, remaining);
        else reveal();
      });

    return () => {
      cancelled = true;
      window.clearTimeout(minimumTimer);
      window.clearTimeout(fontTimer);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'revealing') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('ready');
      return;
    }

    let secondFrame;
    let fadeTimer;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        setHidingLoader(true);
        fadeTimer = window.setTimeout(() => setPhase('ready'), LOADER_FADE_MS);
      });
    });

    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      window.clearTimeout(fadeTimer);
    };
  }, [phase]);

  return (
    <>
      {!ready && <LandingLoader hiding={hidingLoader} />}
      <section
        className={`landing-wrapper no-side-fades ${phase === 'loading' ? 'ln-loading' : 'ln-loaded'}`}
        inert={!ready}
      >
        <Navbar />
        <Hero />
        <Features />
        <LiveDemo />
        <ProSpotlight />
        <QuickStart />
        <Ownership />
        <Sponsors />
        <Testimonials />
        <CTA />
        <Footer />
      </section>
    </>
  );
};

export default LandingPage;
