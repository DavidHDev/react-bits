import { LuCheck } from 'react-icons/lu';
import { TOTAL_COMPONENTS } from '../../../constants/Categories';
import { PRO_COUNTS, PRO_PLAN_ACCESS, PRO_TIERS } from '../../../constants/Pro';
import { proLinkProps } from '../../../utils/pro';
import './ProComparison.css';

const PLACEMENT = 'pro-hub-comparison';

const PLANS = [
  { id: 'free', name: 'Free', price: 0, detail: 'The library on this site' },
  ...PRO_TIERS.map(tier => ({
    id: tier.id,
    name: tier.name,
    price: tier.lifetime,
    cta: tier.ctaText,
    featured: tier.popular,
    detail: {
      starter: 'Every Pro component',
      pro: 'Components, sections, app UI and the Agent Kit',
      ultimate: 'Everything, including every template'
    }[tier.id]
  }))
];

const LOWEST_ANNUAL = Math.min(...PRO_TIERS.map(tier => tier.annual));

const TERMS = (
  <>
    <strong>Pay once, keep every update.</strong> Prefer yearly? Plans start at ${LOWEST_ANNUAL}. Regional pricing is
    applied automatically.
  </>
);

const reachOf = key => Object.fromEntries(PLANS.map(plan => [plan.id, PRO_PLAN_ACCESS[plan.id]?.[key] || 0]));

const componentsFor = id => {
  const pro = PRO_PLAN_ACCESS[id]?.components || 0;
  if (!pro) return { total: TOTAL_COMPONENTS };
  return { total: TOTAL_COMPONENTS + pro, note: `${TOTAL_COMPONENTS} free + ${pro} Pro` };
};

const ROWS = [
  {
    label: 'Components',
    detail: `${TOTAL_COMPONENTS} free on this site, ${PRO_COUNTS.components} more with Pro`,
    values: Object.fromEntries(PLANS.map(plan => [plan.id, componentsFor(plan.id)]))
  },
  {
    label: 'Page sections',
    detail: `${PRO_COUNTS.blockCategories} categories, from heroes to footers`,
    values: reachOf('blocks')
  },
  {
    label: 'App UI',
    detail: 'Dashboards, tables, AI chat, forms and auth',
    values: reachOf('appUi')
  },
  {
    label: 'Agent Kit',
    detail: 'Teaches your AI agent real design taste',
    values: reachOf('agentKit')
  },
  {
    label: 'Page builders',
    detail: 'Compose pages from blocks, then export the code',
    values: { free: 'Try', starter: 'Try', pro: true, ultimate: true }
  },
  {
    label: 'Templates',
    detail: 'Complete Next.js sites, ready to deploy',
    values: reachOf('templates')
  },
  {
    label: 'Priority support',
    detail: 'Your emails go to the front of the queue',
    values: { ultimate: true }
  }
];

const planClass = plan => (plan.featured ? ' is-featured' : plan.price ? '' : ' is-free');

const Value = ({ value }) => {
  if (value === true) {
    return (
      <>
        <LuCheck aria-hidden="true" />
        <span className="sr-only">Included</span>
      </>
    );
  }

  if (!value) {
    return (
      <>
        <span className="prox-cmp-dash" aria-hidden="true" />
        <span className="sr-only">Not included</span>
      </>
    );
  }

  if (typeof value === 'number') return value.toLocaleString('en-US');

  if (typeof value === 'object') {
    return (
      <span className="prox-cmp-count">
        <span>{value.total.toLocaleString('en-US')}</span>
        {value.note && <span className="prox-cmp-count-note">{value.note}</span>}
      </span>
    );
  }

  return <span className="prox-cmp-word">{value}</span>;
};

const ProComparison = () => (
  <div className="prox-cmp">
    <div className="prox-cmp-table" role="table" aria-label="React Bits Free and Pro plans compared">
      <div className="prox-cmp-panel" aria-hidden="true" />

      <div className="prox-cmp-head" role="rowgroup">
        <div className="prox-cmp-row" role="row">
          <div className="prox-cmp-corner" role="cell">
            <p className="prox-cmp-terms">{TERMS}</p>
          </div>

          {PLANS.map(plan => (
            <div key={plan.id} className={`prox-cmp-plan${planClass(plan)}`} role="columnheader">
              <span className="prox-cmp-plan-top">
                <span className="prox-cmp-plan-name">{plan.name}</span>
                {plan.featured && <span className="prox-cmp-plan-flag">Most popular</span>}
              </span>

              <span className="prox-cmp-price">
                <strong>${plan.price}</strong>
                <span>{plan.price ? 'one-time' : 'forever'}</span>
              </span>

              <span className="prox-cmp-plan-detail">{plan.detail}</span>

              {plan.cta ? (
                <a
                  className={`prox-btn prox-btn-sm ${plan.featured ? 'prox-btn-primary' : 'prox-btn-ghost'} prox-cmp-buy`}
                  {...proLinkProps('/#pricing', PLACEMENT, { params: { plan: plan.id }, sameTab: true })}
                >
                  {plan.cta}
                </a>
              ) : (
                <span className="prox-cmp-owned">Already yours</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="prox-cmp-body" role="rowgroup">
        {ROWS.map(row => (
          <div key={row.label} className="prox-cmp-row" role="row">
            <div className="prox-cmp-feature" role="rowheader">
              <span className="prox-cmp-feature-name">{row.label}</span>
              <span className="prox-cmp-feature-detail">{row.detail}</span>
            </div>

            {PLANS.map(plan => (
              <div key={plan.id} className={`prox-cmp-cell${planClass(plan)}`} role="cell">
                <Value value={row.values[plan.id]} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>

    <a
      className="prox-btn prox-btn-primary prox-cmp-choose"
      {...proLinkProps('/#pricing', PLACEMENT, { params: { plan: 'choose' }, sameTab: true })}
    >
      Choose your plan
    </a>

    <p className="prox-cmp-terms prox-cmp-note">{TERMS}</p>
  </div>
);

export default ProComparison;
