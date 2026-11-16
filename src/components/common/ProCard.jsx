import { useLocation } from 'react-router-dom';
import useProImpression from '../../hooks/useProImpression';
import { PRO_COUNTS, PRO_UPSELLS } from '../../constants/Pro';
import { proLinkProps } from '../../utils/pro';
import ProCardDither from './ProCardDither';

const ProCard = () => {
  const { pathname } = useLocation();
  const category = pathname.split('/').filter(Boolean)[0];
  const config = PRO_UPSELLS.default;
  const isProRoute = pathname.startsWith('/pro');
  const destination = isProRoute ? '/#pricing' : config.path;
  const ctaLabel = isProRoute ? 'Get React Bits Pro' : 'Explore React Bits Pro';
  const impressionRef = useProImpression('right-panel-card', { category: category || 'unknown' });

  return (
    <a
      ref={impressionRef}
      {...proLinkProps(destination, 'right-panel-card', {
        params: { category: category || 'unknown' },
        sameTab: true
      })}
      className="pro-card-link"
    >
      <article className="pro-card">
        <div className="pro-card-preview" aria-hidden="true">
          <ProCardDither className="pro-card-dither" />
          <img
            className="pro-card-og pro-card-og-dark"
            src="/assets/pro-card/og-dark.webp"
            alt=""
            width={800}
            height={420}
            loading="lazy"
            decoding="async"
          />
          <img
            className="pro-card-og pro-card-og-light"
            src="/assets/pro-card/og-light.webp"
            alt=""
            width={800}
            height={420}
            loading="lazy"
            decoding="async"
          />
        </div>

        <div className="pro-card-content">
          <h3 className="pro-card-title">{config.title}</h3>
          <p className="pro-card-desc">{config.description}</p>
          <div className="pro-card-counts">
            <span>
              {PRO_COUNTS.components} Components · {PRO_COUNTS.blocks} Blocks
            </span>
            <span>
              {PRO_COUNTS.appUi} App UI · {PRO_COUNTS.templates} Templates · {PRO_COUNTS.agentKit} Agent Skills
            </span>
          </div>

          <div className="pro-card-cta ln-navbar-pro">
            <span>{ctaLabel}</span>
          </div>
        </div>
      </article>
    </a>
  );
};

export default ProCard;
