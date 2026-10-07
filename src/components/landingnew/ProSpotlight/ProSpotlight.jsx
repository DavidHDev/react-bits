import { motion } from 'motion/react';
import { LuArrowRight } from 'react-icons/lu';

import { PRO_SHOWCASE_ITEMS } from '../../../constants/Pro';
import useProImpression from '../../../hooks/useProImpression';
import { proLinkProps } from '../../../utils/pro';
import { useColorModeValue } from '../../setup/color-mode';
import './ProSpotlight.css';

const LIBRARY_PREVIEWS = [
  {
    label: 'Animated components',
    title: 'Motion and interaction',
    section: 'components',
    to: '/docs/components'
  },
  {
    label: 'Page blocks',
    title: 'Complete marketing sections',
    section: 'blocks',
    to: '/docs/blocks'
  },
  {
    label: 'App UI',
    title: 'Interfaces for real products',
    section: 'app-ui',
    to: '/docs/app-ui'
  },
  {
    label: 'Agent Kit',
    title: 'Prompts, skills & recipes',
    image: '/assets/pro/agent-kit/skill-terminal-dark.webp',
    to: '/docs/agent-kit'
  },
  {
    label: 'Templates',
    title: 'Complete Next.js websites',
    section: 'templates',
    to: '/docs/templates'
  }
];

const previewImage = (item, light) => {
  const shot = item.section ? PRO_SHOWCASE_ITEMS[item.section]?.[0] : null;
  if (!shot) return item.image;
  return light ? shot.imageLight || shot.image : shot.image;
};

const ProSpotlight = () => {
  const impressionRef = useProImpression('landing-pro-spotlight');
  const light = useColorModeValue(true, false);

  return (
    <section className="ln-prospot-section" ref={impressionRef}>
      <motion.div
        className="ln-prospot-inner"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        <header className="ln-prospot-header">
          <div className="ln-prospot-copy">
            <h2>Build the complete product.</h2>
            <p>
              React Bits Pro adds more components, page blocks, application UI, full Next.js templates and agent skills
              to the package you already use.
            </p>
          </div>
          <a
            className="ln-prospot-primary"
            {...proLinkProps('/docs/introduction', 'landing-pro-spotlight', { sameTab: true })}
          >
            Explore the library <LuArrowRight size={15} />
          </a>
        </header>

        <div className="ln-prospot-gallery" aria-label="Inside React Bits Pro">
          {LIBRARY_PREVIEWS.map(item => (
            <a
              className="browse-card ln-prospot-item"
              {...proLinkProps(item.to, 'landing-pro-preview', { params: { section: item.label }, sameTab: true })}
              key={item.label}
            >
              <span className="browse-card-well ln-prospot-media">
                <img src={previewImage(item, light)} alt="" loading="lazy" decoding="async" />
              </span>
              <span className="ln-prospot-item-copy">
                <strong className="browse-card-title">{item.title}</strong>
                <small>{item.label}</small>
              </span>
            </a>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default ProSpotlight;
