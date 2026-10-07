import { useEffect, useMemo, useRef, useState } from 'react';

import CircularCarousel from '../../../content/Components/CircularCarousel/CircularCarousel';
import { PRO_SHOWCASE_ITEMS } from '../../../constants/Pro';
import { proUrl, trackProClick } from '../../../utils/pro';
import { useColorModeValue } from '../../setup/color-mode';

const PLACEMENT = 'pro-hub-showcase';
const CYCLE_MS = 6000;
const CARD_SHARE = 0.2;
const RING_SIZE = 12;

const TABS = [
  { id: 'components', label: 'Components' },
  { id: 'blocks', label: 'Blocks' },
  { id: 'app-ui', label: 'App UI' },
  { id: 'templates', label: 'Templates' },
  { id: 'agent-kit', label: 'Agent Kit' }
].filter(tab => PRO_SHOWCASE_ITEMS[tab.id]?.length);

const fillRing = list =>
  list.length >= RING_SIZE || !list.length
    ? list.slice(0, RING_SIZE)
    : Array.from({ length: RING_SIZE }, (_, slot) =>
        slot < list.length ? list[slot] : list[(((slot - RING_SIZE / 2) % list.length) + list.length) % list.length]
      );

const itemsFor = (section, light) =>
  fillRing(PRO_SHOWCASE_ITEMS[section] || []).map(item => ({
    src: light ? item.imageLight || item.image : item.image,
    alt: item.name,
    title: item.name,
    href: item.href,
    slug: item.slug,
    section
  }));

const ProShowcase = () => {
  const hostRef = useRef(null);
  const frontRef = useRef(0);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [cardWidth, setCardWidth] = useState(360);
  const light = useColorModeValue(true, false);
  const fadeColor = light ? '#ffffff' : '#120f17';

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!query) return undefined;
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(node);
    const resize = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      if (width) setCardWidth(Math.round(Math.min(400, Math.max(220, width * CARD_SHARE))));
    });
    resize.observe(node);
    return () => {
      observer.disconnect();
      resize.disconnect();
    };
  }, []);

  const cycling = inView && !paused && !reduced && TABS.length > 1;

  const items = useMemo(() => itemsFor(TABS[active]?.id, light), [active, light]);

  const openItem = (item, index) => {
    if (index !== frontRef.current || !item?.href) return;
    trackProClick(PLACEMENT, { section: item.section, item: item.slug });
    window.open(proUrl(item.href, PLACEMENT, { rb_item: item.slug }), '_blank', 'noopener,noreferrer');
  };

  if (!items.length) return null;

  return (
    <div className="prox-showcase" ref={hostRef}>
      <div
        className="prox-showcase-stage"
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
      >
        <CircularCarousel
          items={items}
          preset="cylinder"
          cardWidth={cardWidth}
          aspectRatio={1.5}
          gap={22}
          curve={1}
          intro="spin"
          tilt={-8}
          perspective={2200}
          speed={7}
          parallax={0.2}
          stretch={0.3}
          depthFade={0.6}
          fadeColor={fadeColor}
          innerShade={0.7}
          cornerRadius={12}
          onChange={index => {
            frontRef.current = index;
          }}
          onItemClick={openItem}
        />
      </div>

      <div
        className="prox-showcase-tabs"
        role="tablist"
        aria-label="Preview category"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {TABS.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={index === active}
            className={`prox-showcase-tab${index === active ? ' is-active' : ''}`}
            onClick={() => setActive(index)}
          >
            {tab.label}
            {index === active && (
              <span
                key={active}
                className={`prox-showcase-bar${reduced ? '' : ' is-running'}`}
                style={{ animationDuration: `${CYCLE_MS}ms`, animationPlayState: cycling ? 'running' : 'paused' }}
                onAnimationEnd={() => setActive(current => (current + 1) % TABS.length)}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProShowcase;
