import { Link } from 'react-router-dom';
import { LuArrowRight, LuArrowUpRight } from 'react-icons/lu';

import HeroBand from '../../landingnew/Hero/HeroBand';
import { useColorModeValue } from '../../setup/color-mode';
import { proLinkProps } from '../../../utils/pro';

const ProCta = ({ title, description, placement, secondary, trackParams, showShader = true, showArrows = true }) => {
  const light = useColorModeValue(true, false);

  return (
    <section className="pro-cta">
      <div className="pro-cta-card">
        {showShader && (
          <div className="pro-cta-bg" aria-hidden="true">
            <HeroBand
              className="pro-cta-band"
              color="#A855F7"
              speed={0.2}
              frequency={1}
              noise={0.15}
              bandWidth={0.14}
              rotation={90}
              fadeTop={0.75}
              iterations={1}
              intensity={1.25}
              scale={1}
              warpStrength={1}
              yOffset={0.3}
              mouseInfluence={0}
              lightMode={light}
            />
          </div>
        )}

        <h2 className="pro-cta-title">{title}</h2>
        <p className="pro-cta-desc">{description}</p>

        <div className="pro-cta-actions">
          <a
            className="pro-cta-btn pro-cta-btn-primary"
            {...proLinkProps('/#pricing', placement, { params: trackParams, sameTab: true })}
          >
            Get React Bits Pro
            {showArrows && <LuArrowUpRight size={15} />}
          </a>

          {secondary && (
            <Link className="pro-cta-btn pro-cta-btn-secondary" to={secondary.to}>
              {secondary.label}
              {showArrows && <LuArrowRight size={15} />}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProCta;
