import { useState, useEffect } from 'react';
import { Box, Text } from '@chakra-ui/react';
import SimpleMarquee from './SimpleMarquee';
import '../../css/category.css';
import {
  diamondSponsors,
  platinumSponsors,
  silverSponsors,
  hasDiamondSponsors,
  hasPlatinumSponsors,
  hasSilverSponsors
} from '../../constants/Sponsors';

const DIAMOND_SLOTS = 2;
const PLATINUM_SLOTS = 5;
const SILVER_SLOTS = 10;

const tierStyles = {
  diamond: {
    container: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '160px',
      height: '100%',
      minHeight: '50px',
      borderRadius: '10px',
      border: '1px solid #170d27',
      background: 'rgba(6, 0, 16, 0.4)',
      overflow: 'hidden',
      flexShrink: 0,
      marginRight: '12px',
      cursor: 'pointer',
      transition: 'all 0.25s ease'
    },
    containerHover: {
      borderColor: '#b19eef',
      background: 'rgba(82, 39, 255, 0.1)',
      boxShadow: '0 0 12px rgba(82, 39, 255, 0.25)'
    },
    image: {
      display: 'block',
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      padding: '8px 24px',
      transition: 'transform 0.25s ease'
    },
    imageHover: {
      transform: 'scale(1.05)'
    }
  },
  platinum: {
    container: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      border: '1px solid #170d27',
      background: 'rgba(6, 0, 16, 0.4)',
      overflow: 'hidden',
      flexShrink: 0,
      marginRight: '12px',
      cursor: 'pointer',
      transition: 'all 0.25s ease',
      position: 'relative'
    },
    containerHover: {
      borderColor: '#b19eef',
      background: 'rgba(82, 39, 255, 0.1)',
      boxShadow: '0 0 12px rgba(82, 39, 255, 0.25)'
    },
    image: {
      display: 'block',
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      padding: '8px',
      transition: 'transform 0.25s ease'
    },
    imageHover: {
      transform: 'scale(1.05)'
    }
  },
  silver: {
    container: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      border: '1px solid #170d27',
      background: 'rgba(6, 0, 16, 0.4)',
      overflow: 'hidden',
      flexShrink: 0,
      marginRight: '12px',
      cursor: 'pointer',
      transition: 'all 0.25s ease',
      position: 'relative'
    },
    containerHover: {
      borderColor: '#b19eef',
      background: 'rgba(82, 39, 255, 0.1)',
      boxShadow: '0 0 12px rgba(82, 39, 255, 0.25)'
    },
    image: {
      display: 'block',
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      padding: '6px',
      transition: 'transform 0.25s ease'
    },
    imageHover: {
      transform: 'scale(1.05)'
    }
  }
};

const tooltipStyle = {
  position: 'absolute',
  left: '100%',
  top: '50%',
  transform: 'translateY(-50%) translateX(0)',
  background: 'rgba(20, 10, 40, 0.95)',
  color: '#fff',
  padding: '5px 12px',
  borderRadius: '999px',
  fontSize: '11px',
  fontWeight: 500,
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
  zIndex: 1000,
  border: '1px solid rgba(152, 139, 199, 0.2)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  opacity: 1,
  animation: 'tooltipFadeIn 0.2s ease-out'
};

const injectTooltipAnimation = () => {
  if (typeof document !== 'undefined' && !document.getElementById('sponsor-tooltip-styles')) {
    const style = document.createElement('style');
    style.id = 'sponsor-tooltip-styles';
    style.textContent = `
      @keyframes tooltipFadeIn {
        from {
          opacity: 0;
          transform: translateY(-50%) translateX(-4px);
        }
        to {
          opacity: 1;
          transform: translateY(-50%) translateX(0);
        }
      }
    `;
    document.head.appendChild(style);
  }
};

const buildSponsorUrl = (url, tier) => {
  if (!url) return null;
  try {
    const sponsorUrl = new URL(url);
    sponsorUrl.searchParams.set('utm_source', 'reactbits');
    sponsorUrl.searchParams.set('utm_medium', 'sponsor');
    sponsorUrl.searchParams.set('utm_campaign', tier);
    sponsorUrl.searchParams.set('ref', 'reactbits');
    return sponsorUrl.toString();
  } catch {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}utm_source=reactbits&utm_medium=sponsor&utm_campaign=${tier}&ref=reactbits`;
  }
};

const SponsorItem = ({ sponsor, tier, fullWidth = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const showTooltip = tier === 'platinum' || tier === 'silver';
  const styles = tierStyles[tier];

  useEffect(() => {
    injectTooltipAnimation();
  }, []);
  
  let containerStyle = fullWidth && tier === 'diamond' 
    ? { ...styles.container, flex: 1, width: '100%' }
    : { ...styles.container };
  
  if (isHovered) {
    containerStyle = { ...containerStyle, ...styles.containerHover };
  }
  
  const imageStyle = isHovered 
    ? { ...styles.image, ...styles.imageHover }
    : styles.image;

  const wrapperStyle = {
    position: 'relative',
    display: tier === 'diamond' ? 'flex' : 'inline-block',
    height: tier === 'diamond' ? '100%' : 'auto'
  };

  const content = (
    <div style={wrapperStyle}>
      <div 
        style={containerStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img 
          src={sponsor.imageUrl} 
          alt={sponsor.name}
          width={tier === 'diamond' ? 160 : tier === 'platinum' ? 50 : 40}
          height={tier === 'diamond' ? 50 : tier === 'platinum' ? 50 : 40}
          style={imageStyle}
          loading="eager"
        />
      </div>
      {showTooltip && isHovered && (
        <div style={tooltipStyle}>{sponsor.name}</div>
      )}
    </div>
  );

  if (sponsor.url) {
    const trackedUrl = buildSponsorUrl(sponsor.url, tier);
    let linkStyle = { textDecoration: 'none', display: 'block' };
    
    if (fullWidth && tier === 'diamond') {
      linkStyle = { ...linkStyle, flex: 1, width: '100%', height: '100%' };
    } else if (tier === 'diamond') {
      linkStyle = { ...linkStyle, height: '100%' };
    }
    
    return (
      <a
        href={trackedUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={linkStyle}
      >
        {content}
      </a>
    );
  }

  return content;
};

const TierSection = ({ label, availableSlots, children, hasSponsors }) => (
  <div className="sponsor-tier-section">
    <div className="sponsor-tier-header">
      <Text className="sponsor-tier-label">{label}</Text>
      {availableSlots > 0 && (
        <Text className="sponsor-tier-available">
          {availableSlots} {availableSlots === 1 ? 'spot left' : 'spots left'}
        </Text>
      )}
    </div>
    {hasSponsors && children}
  </div>
);

const StaticSponsorsRow = ({ sponsors, tier }) => {
  const isDiamond = tier === 'diamond';
  const isSingleSponsor = sponsors.length === 1;
  
  const rowStyle = {
    display: 'flex',
    alignItems: 'stretch',
    gap: '10px',
    padding: '0 1.25em',
    flexWrap: isDiamond ? 'nowrap' : 'wrap',
    height: isDiamond ? '50px' : 'auto'
  };
  
  return (
    <div style={rowStyle}>
      {sponsors.map(sponsor => (
        <SponsorItem 
          key={sponsor.id} 
          sponsor={sponsor} 
          tier={tier} 
          fullWidth={isDiamond && isSingleSponsor}
        />
      ))}
    </div>
  );
};

const MIN_FOR_MARQUEE = 5;

const SponsorsCircle = () => {
  const diamondAvailable = DIAMOND_SLOTS - diamondSponsors.length;
  const platinumAvailable = PLATINUM_SLOTS - platinumSponsors.length;
  const silverAvailable = SILVER_SLOTS - silverSponsors.length;

  const useDiamondMarquee = diamondSponsors.length >= MIN_FOR_MARQUEE;
  const usePlatinumMarquee = platinumSponsors.length >= MIN_FOR_MARQUEE;
  const useSilverMarquee = silverSponsors.length >= MIN_FOR_MARQUEE;

  return (
    <div className="sponsors-marquee-container">
      {/* Diamond Sponsors */}
      <TierSection label="Diamond" availableSlots={diamondAvailable} hasSponsors={hasDiamondSponsors}>
        {useDiamondMarquee ? (
          <div className="sponsors-marquee-wrapper">
            <SimpleMarquee
              direction="left"
              baseVelocity={4}
              slowdownOnHover={true}
              slowDownFactor={0.15}
              repeat={4}
              className="overflow-hidden"
            >
              <Box className="flex" userSelect="none">
                {diamondSponsors.map(sponsor => (
                  <SponsorItem key={sponsor.id} sponsor={sponsor} tier="diamond" />
                ))}
              </Box>
            </SimpleMarquee>
          </div>
        ) : (
          <StaticSponsorsRow sponsors={diamondSponsors} tier="diamond" />
        )}
      </TierSection>

      {/* Platinum Sponsors */}
      <TierSection label="Platinum" availableSlots={platinumAvailable} hasSponsors={hasPlatinumSponsors}>
        {usePlatinumMarquee ? (
          <div className="sponsors-marquee-wrapper">
            <SimpleMarquee
              direction="right"
              baseVelocity={3}
              slowdownOnHover={true}
              slowDownFactor={0.15}
              repeat={4}
              className="overflow-hidden"
            >
              <Box className="flex" userSelect="none">
                {platinumSponsors.map(sponsor => (
                  <SponsorItem key={sponsor.id} sponsor={sponsor} tier="platinum" />
                ))}
              </Box>
            </SimpleMarquee>
          </div>
        ) : (
          <StaticSponsorsRow sponsors={platinumSponsors} tier="platinum" />
        )}
      </TierSection>

      {/* Silver Sponsors */}
      <TierSection label="Silver" availableSlots={silverAvailable} hasSponsors={hasSilverSponsors}>
        {useSilverMarquee ? (
          <div className="sponsors-marquee-wrapper">
            <SimpleMarquee
              direction="left"
              baseVelocity={5}
              slowdownOnHover={true}
              slowDownFactor={0.15}
              repeat={4}
              className="overflow-hidden"
            >
              <Box className="flex" userSelect="none">
                {silverSponsors.map(sponsor => (
                  <SponsorItem key={sponsor.id} sponsor={sponsor} tier="silver" />
                ))}
              </Box>
            </SimpleMarquee>
          </div>
        ) : (
          <StaticSponsorsRow sponsors={silverSponsors} tier="silver" />
        )}
      </TierSection>
    </div>
  );
};

export default SponsorsCircle;
