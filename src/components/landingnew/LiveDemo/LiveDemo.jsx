import { lazy, Suspense } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useColorMode } from '../../setup/color-mode';
import logo from '../../../assets/logos/react-bits-logo-small.svg';
import './LiveDemo.css';

const MicroSlats = lazy(() => import('../../../content/Backgrounds/MicroSlats/MicroSlats'));
const ElectricLogo = lazy(() => import('../../../content/Animations/ElectricLogo/ElectricLogo'));
const TechText = lazy(() => import('../../../content/TextAnimations/TechText/TechText'));
const CircularCarousel = lazy(() => import('../../../content/Components/CircularCarousel/CircularCarousel'));
const HoldButton = lazy(() => import('../../../content/Micro/HoldButton/HoldButton'));

const WELL = { dark: '#09080b', light: '#f7f7f8' };

const CARDS = [
  {
    category: 'Backgrounds',
    component: 'Micro Slats',
    href: '/backgrounds/micro-slats',
    span: 7,
    tall: true,
    render: light => (
      <MicroSlats
        preset="swell"
        color={light ? '#52525b' : '#a1a1aa'}
        glintColor={light ? '#18181b' : '#ffffff'}
        backgroundColor={light ? WELL.light : WELL.dark}
      />
    )
  },
  {
    category: 'Animations',
    component: 'Electric Logo',
    href: '/animations/electric-logo',
    span: 5,
    tall: true,
    render: light => (
      <ElectricLogo
        src={logo}
        theme={light ? 'light' : 'dark'}
        color={light ? '#27272a' : '#f4f4f5'}
        glowColor="#a1a1aa"
        scale={0.5}
      />
    )
  },
  {
    category: 'Text Animations',
    component: 'Tech Text',
    href: '/text-animations/tech-text',
    span: 4,
    render: light => (
      <TechText
        text="Bits"
        fontSize={120}
        color={light ? '#18181b' : '#ffffff'}
        accentColor={light ? '#18181b' : '#ffffff'}
      />
    )
  },
  {
    category: 'Components',
    component: 'Circular Carousel',
    href: '/components/circular-carousel',
    span: 5,
    render: light => <CircularCarousel cardWidth={132} fadeColor={light ? WELL.light : WELL.dark} />
  },
  {
    category: 'Micro',
    component: 'Hold Button',
    href: '/micro/hold-button',
    span: 3,
    render: light => (
      <div className="ln-demo-center">
        <HoldButton
          doneLabel="Confirmed"
          backgroundColor={light ? '#e4e4e7' : '#27272a'}
          fillColor={light ? '#18181b' : '#f4f4f5'}
          textColor={light ? '#3f3f46' : '#f5f5f5'}
          fillTextColor={light ? '#ffffff' : '#120f17'}
        >
          Hold to confirm
        </HoldButton>
      </div>
    )
  }
];

const LiveDemo = () => {
  const { resolvedTheme } = useColorMode();
  const light = resolvedTheme === 'light';

  return (
    <section className="ln-demo-section">
      <div className="ln-demo-inner">
        <h2 className="ln-demo-title">See them in action</h2>

        <div className="ln-demo-grid">
          {CARDS.map((card, i) => (
            <motion.article
              key={card.component}
              className={`ln-demo-card ln-demo-card--span-${card.span}${card.tall ? ' ln-demo-card--tall' : ''}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
              <div className="ln-demo-well">
                <Suspense fallback={null}>{card.render(light)}</Suspense>
              </div>
              <Link to={card.href} className="ln-demo-caption">
                <span className="ln-demo-caption-name">{card.component}</span>
                <span className="ln-demo-caption-meta">
                  {card.category}
                  <ArrowUpRight size={14} aria-hidden="true" />
                </span>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LiveDemo;
