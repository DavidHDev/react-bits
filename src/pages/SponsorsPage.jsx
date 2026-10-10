import { LuArrowRight, LuCheck } from 'react-icons/lu';
import useScrollToTop from '../hooks/useScrollToTop';
import usePageSEO from '../hooks/usePageSEO';
import { PAGE_METADATA } from '../constants/pageMetadata';
import { useStars } from '../hooks/useStars';
import Navbar from '../components/landingnew/Navbar/Navbar';
import Footer from '../components/landingnew/Footer/Footer';
import { SponsorGrid } from '../components/landingnew/Sponsors/Sponsors';
import { TOTAL_COMPONENTS } from '../constants/Categories';

import '../css/site-page.css';
import '../css/sponsors-page.css';

const CONTACT_URL = 'mailto:contact@davidhaz.com?subject=React%20Bits%20Sponsorship%20Inquiry';

const PLANS = [
  {
    key: 'diamond',
    label: 'Diamond',
    price: 500,
    checkoutUrl: 'https://buy.polar.sh/polar_cl_CAKYEZJI4v1T5QdfNfAVAmDhyNVfPVBj6lNaF0H6bII',
    featured: true,
    benefits: [
      'Largest logo on the docs sidebar',
      'Largest logo in the README',
      'Shoutout on X',
      'Featured on the sponsors page',
      'Direct line for feedback and requests'
    ]
  },
  {
    key: 'platinum',
    label: 'Platinum',
    price: 250,
    checkoutUrl: 'https://buy.polar.sh/polar_cl_d9UlbstPFQlba5YiLjFHjfhQ8LwVfhQTZKGxf1HiJZ7',
    benefits: ['Larger logo in the README', 'Larger logo on the docs sidebar', 'Shoutout on X']
  },
  {
    key: 'silver',
    label: 'Silver',
    price: 100,
    checkoutUrl: 'https://buy.polar.sh/polar_cl_XQulCE8GgwOmHo7wLjdDYkMZFm6nYogF3Igfl4cqAfM',
    benefits: ['Logo in the README', 'Logo on the docs sidebar', 'Listed on the sponsors page']
  }
];

const formatStars = stars => (stars >= 1000 ? `${(stars / 1000).toFixed(1).replace(/\.0$/, '')}K` : String(stars));

const SponsorsPage = () => {
  useScrollToTop();
  usePageSEO({ ...PAGE_METADATA['/sponsors'], path: '/sponsors' });

  const stars = useStars();

  const stats = [
    { value: '500K+', label: 'Monthly visitors' },
    { value: formatStars(stars), label: 'GitHub stars' },
    { value: `${TOTAL_COMPONENTS}+`, label: 'Docs pages that show your logo' }
  ];

  return (
    <>
      <Navbar showDocs />

      <main className="pg spx">
        <div className="pg-inner">
          <header className="pg-head">
            <div>
              <h1 className="pg-title">Sponsors</h1>
              <p className="pg-sub">
                React Bits is free and open source. These teams help keep it that way, and their logos sit beside every
                page of the docs.
              </p>
            </div>

            <div className="pg-actions">
              <a href="#sponsor-plans" className="pg-btn pg-btn-primary">
                Become a sponsor
                <LuArrowRight size={16} aria-hidden="true" />
              </a>
              <a href={CONTACT_URL} className="pg-btn pg-btn-secondary">
                Email us
              </a>
            </div>
          </header>

          <SponsorGrid detailed />

          <section className="pg-section">
            <header className="pg-section-head">
              <h2 className="pg-section-title">Reach developers while they build</h2>
              <p className="pg-section-sub">
                Your logo appears in the README and on every docs page, right where React developers come looking for
                UI.
              </p>
            </header>

            <div className="spx-stats">
              {stats.map(stat => (
                <div className="pg-tile spx-stat" key={stat.label}>
                  <div className="pg-well spx-stat-well">
                    <span className="spx-stat-value">{stat.value}</span>
                  </div>
                  <span className="spx-stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="pg-section" id="sponsor-plans">
            <header className="pg-section-head">
              <h2 className="pg-section-title">Become a sponsor</h2>
              <p className="pg-section-sub">Monthly plans, billed through Polar. Cancel anytime.</p>
            </header>

            <div className="spx-plans">
              {PLANS.map(plan => (
                <article className={`pg-tile spx-plan${plan.featured ? ' is-featured' : ''}`} key={plan.key}>
                  <div className="pg-well spx-plan-well">
                    <div className="spx-plan-top">
                      <h3 className="spx-plan-name">{plan.label}</h3>
                      {plan.featured && <span className="spx-plan-note">Most visible</span>}
                    </div>

                    <p className="spx-plan-price">
                      ${plan.price}
                      <span>/month</span>
                    </p>

                    <a
                      href={plan.checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`pg-btn ${plan.featured ? 'pg-btn-primary' : 'pg-btn-secondary'} spx-plan-btn`}
                    >
                      Sponsor as {plan.label}
                    </a>
                  </div>

                  <ul className="spx-plan-benefits">
                    {plan.benefits.map(benefit => (
                      <li key={benefit}>
                        <LuCheck size={15} aria-hidden="true" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <div className="pg-tile spx-contact">
              <div className="pg-well spx-contact-well">
                <div>
                  <h3 className="spx-contact-title">Need a different package?</h3>
                  <p className="spx-contact-sub">
                    Questions, or a plan that doesn&apos;t fit the tiers above. Email us and we&apos;ll work it out.
                  </p>
                </div>
                <a href={CONTACT_URL} className="pg-btn pg-btn-secondary">
                  Email us
                  <LuArrowRight size={16} aria-hidden="true" />
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default SponsorsPage;
