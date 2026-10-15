import { LuArrowUpRight } from 'react-icons/lu';

import { PRO_COUNTS, PRO_SECTIONS, PRO_SHOWCASE_ITEMS } from '../../../constants/Pro';
import { proLinkProps } from '../../../utils/pro';
import { useColorModeValue } from '../../setup/color-mode';

const PILLAR_PICKS = {
  components: ['radial-liquid', 'orbit-reel', 'astral-shell'],
  'app-ui': ['app-ui-12', 'app-ui-10', 'app-ui-07']
};

const SHOT_SLOTS = ['front', 'left', 'right'];

const pillarShots = slug => {
  const items = PRO_SHOWCASE_ITEMS[slug] || [];
  const picks = PILLAR_PICKS[slug];
  if (!picks) return items.slice(0, 3);
  return picks.map(pick => items.find(item => item.slug === pick)).filter(Boolean);
};

const ProPillars = ({ placement, className = '' }) => {
  const light = useColorModeValue(true, false);

  return (
    <div className={`prox-pillars${className ? ` ${className}` : ''}`}>
      {PRO_SECTIONS.map(section => (
        <a
          key={section.slug}
          className="prox-pillar"
          {...proLinkProps(section.proPath, `${placement}-${section.slug}`, { sameTab: true })}
        >
          <span className="prox-pillar-media" aria-hidden="true">
            {pillarShots(section.slug).map((item, index) => (
              <img
                key={item.slug}
                className={`prox-pillar-shot is-${SHOT_SLOTS[index]}`}
                src={light ? item.imageLight || item.image : item.image}
                alt=""
                loading="lazy"
                decoding="async"
              />
            ))}
          </span>

          <span className="prox-pillar-body">
            <span className="prox-pillar-title">
              {PRO_COUNTS[section.countKey]} {section.countLabel}
              <LuArrowUpRight size={16} aria-hidden="true" />
            </span>
            <span className="prox-pillar-desc">{section.tagline}</span>
          </span>
        </a>
      ))}
    </div>
  );
};

export default ProPillars;
