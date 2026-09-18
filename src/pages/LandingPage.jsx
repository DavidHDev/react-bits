import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
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

const MIN_LOADER_MS = 800;

const LandingPage = () => {
  useScrollToTop();
  usePageSEO({
    title: 'React Bits - Animated UI Components For React',
    description:
      'An open source collection of 200+ high quality, animated, interactive & fully customizable React components and micro interactions for building stunning, memorable user interfaces.',
    path: '/'
  });
  const [loaded, setLoaded] = useState(false);
  const [hiding, setHiding] = useState(false);

  usePauseOffscreenAnimations(loaded);

  const reveal = useCallback(() => {
    setHiding(true);
    // after the loader fade-out finishes, mark fully loaded & unlock scroll
    setTimeout(() => setLoaded(true), 600);
  }, []);

  useLayoutEffect(() => {
    if (loaded) return;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [loaded]);

  useEffect(() => {
    const start = Date.now();

    document.fonts.ready.then(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, MIN_LOADER_MS - elapsed);
      setTimeout(reveal, remaining);
    });
  }, [reveal]);

  return (
    <>
      {!loaded && <LandingLoader hiding={hiding} />}
      <section className={`landing-wrapper no-side-fades${loaded ? ' ln-loaded' : ' ln-loading'}`}>
        <Navbar />
        <Hero />
        <Features />
        <LiveDemo />
        <ProSpotlight />
        <QuickStart />
        <Ownership />
        <Testimonials />
        <Sponsors />
        <CTA />
        <Footer />
      </section>
    </>
  );
};

export default LandingPage;
