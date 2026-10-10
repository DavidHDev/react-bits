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
import useScrollToTop from '../hooks/useScrollToTop';
import usePageSEO from '../hooks/usePageSEO';
import usePauseOffscreenAnimations from '../hooks/usePauseOffscreenAnimations';
import { HOME_SEO } from '../utils/seo';

const LandingPage = () => {
  useScrollToTop();
  usePageSEO(HOME_SEO);
  usePauseOffscreenAnimations(true);

  return (
    <>
      <section className="landing-wrapper no-side-fades ln-loaded">
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
