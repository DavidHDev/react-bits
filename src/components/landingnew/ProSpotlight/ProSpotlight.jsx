import { m } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight02Icon } from '@hugeicons/core-free-icons';

import ProPillars from '../../common/Pro/ProPillars';
import useProImpression from '../../../hooks/useProImpression';
import { proLinkProps } from '../../../utils/pro';
import './ProSpotlight.css';

const PLACEMENT = 'landing-pro-spotlight';

const ProSpotlight = () => {
  const impressionRef = useProImpression(PLACEMENT);

  return (
    <section className="ln-prospot-section" ref={impressionRef}>
      <m.div
        className="ln-prospot-inner"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        <header className="ln-prospot-header">
          <div className="ln-prospot-copy">
            <h2>Build the whole product, not just the hero.</h2>
            <p>Page sections, app UI, full Next.js templates and agent skills, all as source you own.</p>
          </div>

          <a
            className="ln-prospot-btn ln-prospot-btn--primary"
            {...proLinkProps('/#pricing', PLACEMENT, { sameTab: true })}
          >
            Get React Bits Pro
            <HugeiconsIcon icon={ArrowRight02Icon} size={17} strokeWidth={1.8} />
          </a>
        </header>

        <ProPillars placement="landing-pro" />
      </m.div>
    </section>
  );
};

export default ProSpotlight;
