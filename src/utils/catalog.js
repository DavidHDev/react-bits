import { CATEGORIES } from '../constants/Categories.js';
import { componentMetadata } from '../constants/Information.js';

export const toSlug = value => value.replace(/\s+/g, '-').toLowerCase();

export const getComponentCatalog = () => {
  const metadataByPath = new Map(
    Object.entries(componentMetadata).map(([key, meta]) => [new URL(meta.docsUrl).pathname, { key, meta }])
  );

  return CATEGORIES.filter(category => category.name !== 'Get Started').flatMap(category =>
    category.subcategories.flatMap(name => {
      const categorySlug = toSlug(category.name);
      const slug = toSlug(name);
      const path = `/${categorySlug}/${slug}`;
      const found = metadataByPath.get(path);
      return found ? [{ ...found, name, category: category.name, categorySlug, slug, path }] : [];
    })
  );
};
