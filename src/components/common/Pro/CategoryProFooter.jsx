import { LuArrowUpRight } from 'react-icons/lu';

import proSummary from '../../../constants/pro-summary.generated.json';
import useProImpression from '../../../hooks/useProImpression';
import { proLinkProps } from '../../../utils/pro';
import ProMedia from './ProMedia';

const PLACEMENT = 'docs-related-pro';

const CategoryProFooter = ({ category }) => {
  const collection = proSummary.categories[category];
  const impressionRef = useProImpression(PLACEMENT, { category }, Boolean(collection));

  if (!collection?.items.length) return null;

  return (
    <section ref={impressionRef} className="cat-pro" aria-label="Related components from React Bits Pro">
      <div className="cat-pro-heading">
        <div>
          <h2>More {collection.noun} in Pro</h2>
          {collection.pitch && <p>{collection.pitch}</p>}
        </div>
        <a className="cat-pro-all" {...proLinkProps(collection.path, PLACEMENT, { params: { category } })}>
          View all {collection.count} <LuArrowUpRight size={14} aria-hidden="true" />
        </a>
      </div>
      <div className="cat-pro-grid">
        {collection.items.slice(0, 4).map(item => (
          <a
            key={item.slug}
            className="cat-pro-item"
            {...proLinkProps(item.href, PLACEMENT, { params: { category, item: item.slug } })}
          >
            <ProMedia item={item} baseUrl={proSummary.assets.baseUrl} />
            <span className="cat-pro-item-name">
              {item.name} <LuArrowUpRight size={14} aria-hidden="true" />
            </span>
          </a>
        ))}
      </div>
    </section>
  );
};

export default CategoryProFooter;
