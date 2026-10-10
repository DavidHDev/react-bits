import { getComponentCatalog } from '../src/utils/catalog.js';
import { CATEGORY_SEO, HOME_SEO, INDEX_SEO, getComponentSEO } from '../src/utils/seo.js';
import { PAGE_METADATA, getToolSEO } from '../src/constants/pageMetadata.js';
import { TOOLS } from '../src/constants/Tools.js';

export const getRouteFile = route =>
  route === '/' ? 'index.html' : `${route.slice(1)}${route.endsWith('/index') ? '/index.html' : '.html'}`;

export const getSeoRoutes = () => {
  const catalog = getComponentCatalog();
  const pages = [
    { ...HOME_SEO, kind: 'home' },
    { ...INDEX_SEO, kind: 'catalog', items: catalog },
    ...Object.values(CATEGORY_SEO).map(page => ({
      ...page,
      kind: 'catalog',
      items: catalog.filter(item => page.path === `/c/${item.categorySlug}`)
    })),
    ...catalog.map(item => ({ ...getComponentSEO(item), kind: 'component', item })),
    ...Object.entries(PAGE_METADATA).map(([path, page]) => ({ ...page, path, kind: 'page' })),
    ...TOOLS.map(tool => ({ ...getToolSEO(tool), kind: 'tool' }))
  ];
  return pages.map(page => ({ ...page, canonicalPath: page.path }));
};

export const getSeoAliases = pages => {
  const aliases = [];
  for (const page of pages) {
    if (page.kind === 'component' || page.path.startsWith('/get-started/')) {
      aliases.push({ ...page, path: `/c${page.path}` });
    }
    if (page.kind === 'catalog' && page.path.startsWith('/c/')) {
      const category = page.path.slice(3);
      aliases.push({ ...page, path: `/${category}/index` }, { ...page, path: `/c/${category}/index` });
    }
  }
  const changelog = pages.find(page => page.path === '/get-started/changelog');
  aliases.push({ ...changelog, path: '/changelog' });
  return aliases;
};

export const getSeoRedirects = pages => [
  { from: '/changelog', to: '/get-started/changelog' },
  ...pages.filter(page => page.kind === 'component').map(page => ({ from: `/${page.item.slug}`, to: page.path })),
  ...Object.entries(CATEGORY_SEO).flatMap(([slug, page]) => [
    { from: `/${slug}/index`, to: page.path },
    { from: `/c/${slug}/index`, to: page.path }
  ])
];
