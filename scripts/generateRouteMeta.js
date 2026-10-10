import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { SITE_URL } from '../src/utils/seo.js';
import { getSeoRoutes, getSeoAliases, getSeoRedirects, getRouteFile } from './seoRoutes.js';
import { escapeHtml, renderContent } from './prerenderContent.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const DEFAULT_IMAGE = '/og.jpg';

const setTag = (html, attribute, key, value) => {
  const pattern = new RegExp(`(<meta\\s+${attribute}="${key}"\\s+content=")[^"]*(")`);
  if (!pattern.test(html)) throw new Error(`dist/index.html has no <meta ${attribute}="${key}">`);
  return html.replace(pattern, (_, start, end) => `${start}${escapeHtml(value)}${end}`);
};

const renderPage = (template, page, style) => {
  const url = `${SITE_URL}${page.canonicalPath}`;
  const hasImage = page.image && fs.existsSync(path.join(DIST, page.image));
  const image = `${SITE_URL}${hasImage ? page.image : DEFAULT_IMAGE}`;
  const imageAlt = page.imageAlt || 'React Bits: free animated React components for creative websites.';
  const contentPage = { ...page, previewImage: hasImage ? page.image : null };
  if (page.item) {
    const registryName = `${page.item.key.split('/')[1]}-TS-TW`;
    if (fs.existsSync(path.join(DIST, 'r', `${registryName}.json`))) {
      contentPage.installCommand = `npx shadcn@latest add @react-bits/${registryName}`;
    }
  }
  let html = template.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`);
  for (const [attribute, key, value] of [
    ['name', 'description', page.description],
    ['name', 'robots', page.robots || 'index, follow'],
    ['property', 'og:title', page.title],
    ['property', 'og:description', page.description],
    ['property', 'og:url', url],
    ['property', 'og:image', image],
    ['property', 'og:image:alt', imageAlt],
    ['name', 'twitter:title', page.title],
    ['name', 'twitter:description', page.description],
    ['name', 'twitter:image', image],
    ['name', 'twitter:image:alt', imageAlt]
  ])
    html = setTag(html, attribute, key, value);
  html = html.replace(/<link\b[^>]*rel="canonical"[^>]*>/g, '');
  html = html.replace(/<style id="rb-static-style">[\s\S]*?<\/style>/g, '');
  html = html.replace(
    '</head>',
    `<link rel="canonical" href="${escapeHtml(url)}" /><style id="rb-static-style">${style}</style></head>`
  );
  const marker = /<!--rb-app-start-->[\s\S]*?<!--rb-app-end-->/;
  if (!marker.test(html)) throw new Error('Missing app HTML markers in dist/index.html');
  return html.replace(
    marker,
    () => `<!--rb-app-start--><div id="root">${renderContent(contentPage)}</div><!--rb-app-end-->`
  );
};

const main = () => {
  const indexFile = path.join(DIST, 'index.html');
  if (!fs.existsSync(indexFile)) throw new Error('Run vite build before generating static pages.');
  const template = fs.readFileSync(indexFile, 'utf8');
  const style = fs.readFileSync(path.join(ROOT, 'src/css/prerender.css'), 'utf8');
  const pages = getSeoRoutes();
  const routes = [
    ...pages,
    ...getSeoAliases(pages),
    {
      path: '/404',
      canonicalPath: '/404',
      title: 'Page not found - React Bits',
      heading: 'This page doesn’t exist',
      description:
        'This page does not exist. Browse free animated React components, backgrounds and micro-interactions.',
      robots: 'noindex, follow',
      kind: 'not-found'
    }
  ];
  const seen = new Set();
  for (const page of routes) {
    if (!/^\/(?:[a-z0-9-]+\/?)*$/.test(page.path) || seen.has(page.path))
      throw new Error(`Invalid or duplicate static route: ${page.path}`);
    seen.add(page.path);
    const file = path.join(DIST, getRouteFile(page.path));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, renderPage(template, page, style));
  }
  const redirects = fs.readFileSync(path.join(ROOT, 'public/_redirects'), 'utf8').trim();
  const aliases = getSeoRedirects(pages)
    .map(({ from, to }) => `${from} ${to} 301`)
    .join('\n');
  fs.writeFileSync(path.join(DIST, '_redirects'), `${redirects}\n${aliases}\n`);
  console.log(`Static SEO: ${routes.length} readable pages, canonical metadata, explicit redirects and a 404 page.`);
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
