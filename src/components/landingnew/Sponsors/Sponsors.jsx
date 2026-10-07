import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { diamondSponsors, platinumSponsors, silverSponsors } from '../../../constants/Sponsors';
import { useColorModeValue } from '../../setup/color-mode';
import './Sponsors.css';

const TIERS = [
  { tier: 'diamond', label: 'Diamond', sponsors: diamondSponsors },
  { tier: 'platinum', label: 'Platinum', sponsors: platinumSponsors },
  { tier: 'silver', label: 'Silver', sponsors: silverSponsors }
];

const buildSponsorUrl = (url, tier) => {
  if (!url) return null;
  try {
    const u = new URL(url);
    u.searchParams.set('utm_source', 'reactbits');
    u.searchParams.set('utm_medium', 'sponsor');
    u.searchParams.set('utm_campaign', tier);
    u.searchParams.set('ref', 'reactbits');
    return u.toString();
  } catch {
    return `${url}${url.includes('?') ? '&' : '?'}utm_source=reactbits&utm_medium=sponsor&utm_campaign=${tier}&ref=reactbits`;
  }
};

const SponsorCard = ({ sponsor, tier, label, detailed }) => {
  const imageUrl = useColorModeValue(sponsor.lightImageUrl || sponsor.imageUrl, sponsor.imageUrl);

  return (
    <a
      href={buildSponsorUrl(sponsor.url, tier)}
      target="_blank"
      rel="noopener noreferrer"
      className={`browse-card ln-sp-card ln-sp-card--${tier}`}
    >
      <span className="ln-sp-well">
        <img className="ln-sp-logo" src={imageUrl} alt={sponsor.name} loading="lazy" />
      </span>
      <span className="ln-sp-meta">
        {detailed ? (
          <>
            <span className="ln-sp-name">{sponsor.name}</span>
            <span className="ln-sp-tier">
              {label}
              <ArrowUpRight size={14} aria-hidden="true" />
            </span>
          </>
        ) : (
          <>
            <span>{label}</span>
            <ArrowUpRight size={14} aria-hidden="true" />
          </>
        )}
      </span>
    </a>
  );
};

export const SponsorGrid = ({ detailed = false }) => (
  <div className={`ln-sp-grid${detailed ? ' ln-sp-grid--detailed' : ''}`}>
    {TIERS.flatMap(({ tier, label, sponsors }) =>
      sponsors.map(sponsor => (
        <SponsorCard key={`${tier}-${sponsor.id}`} sponsor={sponsor} tier={tier} label={label} detailed={detailed} />
      ))
    )}
  </div>
);

const Sponsors = () => (
  <section className="ln-sp-section">
    <motion.div
      className="ln-sp-inner"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      <header className="ln-sp-header">
        <div className="ln-sp-copy">
          <h2 className="ln-sp-title">Sponsors</h2>
          <p>React Bits stays free thanks to these teams.</p>
        </div>
        <Link to="/sponsors#sponsor-plans" className="ln-sp-cta">
          Become a sponsor <ArrowRight size={15} />
        </Link>
      </header>

      <SponsorGrid />
    </motion.div>
  </section>
);

export default Sponsors;
