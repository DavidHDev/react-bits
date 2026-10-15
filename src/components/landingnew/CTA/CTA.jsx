import { lazy, Suspense, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'motion/react';
import { FiArrowRight } from 'react-icons/fi';
import { useColorModeValue } from '../../setup/color-mode';
import { LOOK, presetProps } from '../../../demo/Backgrounds/presets/GradientWaves';
import useProImpression from '../../../hooks/useProImpression';
import useNearOnce from '../../../hooks/useNearOnce';
import { proLinkProps } from '../../../utils/pro';
import './CTA.css';

const GradientWaves = lazy(() => import('../../../content/Backgrounds/GradientWaves/GradientWaves'));

const CTA = () => {
  const prefersReducedMotion = useReducedMotion();
  const impressionRef = useProImpression('landing-final-cta');
  const light = useColorModeValue(true, false);
  const [nearRef, near] = useNearOnce();
  const lite = typeof document !== 'undefined' && document.documentElement.hasAttribute('data-lite');
  const setRefs = useCallback(
    node => {
      impressionRef.current = node;
      nearRef.current = node;
    },
    [impressionRef, nearRef]
  );

  return (
    <div className="ln-cta-card" ref={setRefs}>
      {near && !prefersReducedMotion && (
        <div className="ln-cta-bg" aria-hidden="true">
          <Suspense fallback={null}>
            <GradientWaves
              {...presetProps('dusk', { light, defaults: LOOK })}
              tilt={58}
              dpr={lite ? 0.75 : 1.25}
              quality={lite ? 'low' : 'medium'}
              intro
            />
          </Suspense>
        </div>
      )}
      <h2 className="ln-cta-headline">Build something people remember.</h2>

      <p className="ln-cta-sub">
        Start with the free library. When you need the complete page, product UI and tools to ship it, React Bits Pro is
        ready.
      </p>

      <div className="ln-cta-buttons">
        <a
          {...proLinkProps('/#pricing', 'landing-final-cta', { sameTab: true })}
          className="ln-cta-btn ln-cta-btn--primary"
        >
          Get React Bits Pro <FiArrowRight size={15} />
        </a>
        <Link to="/get-started/index" className="ln-cta-btn ln-cta-btn--secondary">
          Browse free components
        </Link>
      </div>
    </div>
  );
};

export default CTA;
