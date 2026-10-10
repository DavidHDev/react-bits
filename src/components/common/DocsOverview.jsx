import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import '../../css/docs-overview.css';

export const DocsOverview = ({ seo }) => (
  <header className="docs-overview">
    <h1 className="sub-category">{seo.heading}</h1>
    <p className="docs-overview-description" title={seo.intro}>
      {seo.intro}
    </p>
  </header>
);

export const RelatedComponents = ({ seo }) => (
  <section className="docs-related customize-frame" aria-labelledby="related-components-heading">
    <div className="customize-heading">
      <h2 id="related-components-heading">Related components</h2>
      <Link
        to={seo.category.path}
        className="customize-heading-action"
        aria-label={`View all ${seo.category.name.toLowerCase()}`}
      >
        View all <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </div>
    <div className="docs-related-grid">
      {seo.related.map(item => (
        <Link key={item.path} to={item.path} className="docs-related-card component-pager-link" title={item.name}>
          <span className="component-pager-name">{item.name}</span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      ))}
    </div>
  </section>
);
