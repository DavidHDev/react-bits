import { useState } from 'react';
import { LuArrowUpRight, LuPlus } from 'react-icons/lu';

import Navbar from '../components/landingnew/Navbar/Navbar';
import Footer from '../components/landingnew/Footer/Footer';
import Testimonials from '../components/landingnew/Testimonials/Testimonials';
import ProCta from '../components/common/Pro/ProCta';
import ProShowcase from '../components/common/Pro/ProShowcase';
import ProComparison from '../components/common/Pro/ProComparison';
import ColorBends from '../content/Backgrounds/ColorBends/ColorBends';
import {
  PRO_COUNTS,
  PRO_SECTIONS,
  PRO_FAQ,
  PRO_TESTIMONIALS,
  PRO_FREE_COPY,
  PRO_SHOWCASE_ITEMS
} from '../constants/Pro';
import { proUrl, proLinkProps, trackProClick, proAgentKitPreview } from '../utils/pro';
import useProManifest from '../hooks/useProManifest';
import useProImpression from '../hooks/useProImpression';
import usePageSEO from '../hooks/usePageSEO';
import useScrollToTop from '../hooks/useScrollToTop';
import { useColorModeValue } from '../components/setup/color-mode';
import ReactBitsProLogo from '../assets/logos/react-bits-pro-logo.svg';

const HERO_PLACEMENT = 'pro-hub-hero';

const CTA_PLACEMENT = 'pro-hub-cta';

const PILLAR_PICKS = {
  components: ['radial-liquid', 'orbit-reel', 'astral-shell'],
  'app-ui': ['app-ui-12', 'app-ui-10', 'app-ui-07']
};

const pillarShots = slug => {
  const items = PRO_SHOWCASE_ITEMS[slug] || [];
  const picks = PILLAR_PICKS[slug];
  if (!picks) return items.slice(0, 3);
  return picks.map(pick => items.find(item => item.slug === pick)).filter(Boolean);
};

/** Template recordings often open on a black or half-painted frame. */
const VIDEO_START_TIME = 0.4;

const ProPage = () => {
  useScrollToTop();
  usePageSEO({
    title: 'React Bits Pro - Components, Blocks, App UI & Templates',
    description:
      'See everything that ships with React Bits Pro: animated components, marketing blocks, app UI blocks, complete Next.js templates and an Agent Kit for AI coding tools. Lifetime or annual, full source, yours to edit.',
    path: '/pro'
  });

  const [openFaq, setOpenFaq] = useState(null);
  const light = useColorModeValue(true, false);
  const heroImpressionRef = useProImpression(HERO_PLACEMENT);
  const comparisonImpressionRef = useProImpression('pro-hub-comparison');

  const { manifest } = useProManifest();

  const templates = manifest?.templates || [];

  // The free template and free skill are the strongest proof on the page, so
  // they get their own strip rather than hiding inside a grid.
  const freeTemplate = templates.find(t => t.isFree);
  const freeSkill = manifest?.agentKit?.find(a => a.tier === 'free');

  return (
    <>
      <Navbar showDocs />

      <main className="prox">
        <section className="prox-hero" ref={heroImpressionRef}>
          <div className="prox-hero-bg" aria-hidden="true">
            <div className="prox-hero-bands">
              <ColorBends rotation={90} speed={0.16} frequency={1} noise={0.12} intensity={1.2} colors={['#A855F7']} />
            </div>
          </div>

          <div className="prox-inner prox-hero-inner">
            <span
              className="prox-hero-mark"
              style={{ '--prox-mark': `url(${ReactBitsProLogo})` }}
              role="img"
              aria-label="React Bits Pro"
            />

            <h1 className="prox-hero-title">
              The complete React toolkit <br />
              for crafting memorable UI
            </h1>

            <p className="prox-hero-desc">
              React Bits stays free forever. Pro takes you from individual effects to complete pages, product UI,
              templates and an Agent Kit, all delivered as source you own.
            </p>

            <div className="prox-actions">
              <a
                className="prox-btn prox-btn-primary"
                {...proLinkProps('/#pricing', HERO_PLACEMENT, { sameTab: true })}
              >
                Get React Bits Pro
              </a>
              <a
                className="prox-btn prox-btn-ghost"
                {...proLinkProps('/docs/components', 'pro-hub-hero-catalogue', { sameTab: true })}
              >
                Browse the catalogue
              </a>
            </div>
          </div>

          <ProShowcase />
        </section>

        <section className="prox-section">
          <div className="prox-inner">
            <header className="prox-head">
              <h2 className="prox-title">Five libraries in one</h2>
              <p className="prox-sub">Every piece installs as source you own, ready to edit and ship.</p>
            </header>

            <div className="prox-pillars">
              {PRO_SECTIONS.map(section => (
                <a
                  key={section.slug}
                  className="prox-pillar"
                  {...proLinkProps(section.proPath, `pro-hub-${section.slug}`, { sameTab: true })}
                >
                  <span className="prox-pillar-media" aria-hidden="true">
                    {pillarShots(section.slug).map((item, index) => (
                      <img
                        key={item.slug}
                        className={`prox-pillar-shot is-${['front', 'left', 'right'][index]}`}
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
          </div>
        </section>

        <section className="prox-section prox-section-alt" ref={comparisonImpressionRef}>
          <div className="prox-inner">
            <header className="prox-head prox-head-centered">
              <h2 className="prox-title">Build the whole product, not just the hero.</h2>
              <p className="prox-sub">
                Free components make one section stand out. Pro covers everything else: page sections, app UI, full
                templates and an Agent Kit, plus {PRO_COUNTS.components} more components.
              </p>
            </header>

            <ProComparison />
          </div>
        </section>

        {(freeTemplate || freeSkill) && (
          <section className="prox-section">
            <div className="prox-inner">
              <header className="prox-head prox-free-head">
                <h2 className="prox-title">Try the workflow before you buy</h2>
                <p className="prox-sub">
                  Download a template and install an agent skill, no checkout needed. They show how Pro fits into your
                  project. To judge the full library, browse its{' '}
                  <a {...proLinkProps('/docs/components', 'pro-hub-free-previews', { sameTab: true })}>live previews</a>
                  .
                </p>
              </header>

              <div className="prox-free">
                {freeTemplate && (
                  <article className="prox-free-card">
                    {freeTemplate.videoUrl && (
                      <span className="prox-free-media">
                        <video
                          src={freeTemplate.videoUrl}
                          muted
                          loop
                          playsInline
                          autoPlay
                          preload="metadata"
                          aria-hidden="true"
                          onLoadedMetadata={e => {
                            e.currentTarget.currentTime = VIDEO_START_TIME;
                          }}
                        />
                      </span>
                    )}
                    <div className="prox-free-body">
                      <span className="prox-free-kind">Free template</span>
                      <h3 className="prox-free-title">{freeTemplate.name}</h3>
                      <p className="prox-free-desc">{PRO_FREE_COPY[freeTemplate.slug] || freeTemplate.description}</p>
                      <div className="prox-free-actions">
                        <a
                          className="prox-btn prox-btn-sm prox-btn-primary"
                          href={proUrl(freeTemplate.href, 'pro-hub-free-template', { rb_item: freeTemplate.slug })}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackProClick('pro-hub-free-template', { item: freeTemplate.slug })}
                        >
                          Download template
                        </a>
                        {freeTemplate.livePreviewUrl && (
                          <a
                            className="prox-free-link"
                            href={proUrl(freeTemplate.livePreviewUrl, 'pro-hub-free-template-live', {
                              rb_item: freeTemplate.slug
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackProClick('pro-hub-free-template-live', { item: freeTemplate.slug })}
                          >
                            Live site
                            <LuArrowUpRight size={14} aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                )}

                {freeSkill && (
                  <article className="prox-free-card">
                    <span className="prox-free-media">
                      <img src={proAgentKitPreview(freeSkill)} alt="" loading="lazy" decoding="async" />
                    </span>
                    <div className="prox-free-body">
                      <span className="prox-free-kind">Free agent skill</span>
                      <h3 className="prox-free-title">{freeSkill.name}</h3>
                      <p className="prox-free-desc">{PRO_FREE_COPY[freeSkill.slug] || freeSkill.summary}</p>
                      <div className="prox-free-actions">
                        <a
                          className="prox-btn prox-btn-sm prox-btn-primary"
                          href={proUrl(freeSkill.href, 'pro-hub-free-skill', { rb_item: freeSkill.slug })}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackProClick('pro-hub-free-skill', { item: freeSkill.slug })}
                        >
                          Install skill
                        </a>
                        <a
                          className="prox-free-link"
                          {...proLinkProps('/docs/agent-kit', 'pro-hub-free-skill-catalogue', { sameTab: true })}
                        >
                          All skills
                          <LuArrowUpRight size={14} aria-hidden="true" />
                        </a>
                      </div>
                    </div>
                  </article>
                )}
              </div>
            </div>
          </section>
        )}

        <Testimonials tweets={PRO_TESTIMONIALS} />

        <section className="prox-section">
          <div className="prox-inner prox-faq-layout">
            <div className="prox-faq-aside">
              <h2 className="prox-title">Questions, answered</h2>
              <p className="prox-sub">
                The things people ask before buying. If yours is not here, email{' '}
                <a href="mailto:pro@reactbits.dev">pro@reactbits.dev</a>.
              </p>
            </div>

            <div className="prox-faq">
              {PRO_FAQ.map((item, i) => {
                const isOpen = openFaq === i;
                return (
                  <div className={`prox-faq-item${isOpen ? ' open' : ''}`} key={item.q}>
                    <button
                      type="button"
                      className="prox-faq-q"
                      id={`prox-faq-q-${i}`}
                      aria-expanded={isOpen}
                      aria-controls={`prox-faq-panel-${i}`}
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                    >
                      <span>{item.q}</span>
                      <LuPlus className="prox-faq-icon" size={17} />
                    </button>

                    <div
                      className="prox-faq-panel"
                      id={`prox-faq-panel-${i}`}
                      role="region"
                      aria-labelledby={`prox-faq-q-${i}`}
                      aria-hidden={!isOpen}
                    >
                      <div className="prox-faq-panel-inner">
                        <p className="prox-faq-a">{item.a}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="prox-inner prox-cta-wrap">
          <ProCta
            title="Own the whole library."
            description="Every file is yours to edit, and lifetime access includes every future update."
            placement={CTA_PLACEMENT}
            secondary={{ to: 'https://pro.reactbits.dev/docs/introduction', label: 'Explore the library' }}
            showArrows={false}
          />
        </div>
      </main>

      <Footer />
    </>
  );
};

export default ProPage;
