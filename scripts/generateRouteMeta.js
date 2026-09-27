import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import { componentMetadata } from '../src/constants/Information.js';
import { getComponentCatalog } from '../src/utils/catalog.js';
import { CHANGELOG_DESCRIPTION } from '../src/utils/changelog.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SITE = 'https://reactbits.dev';
const DEFAULT_IMAGE = '/og.jpg';

const escapeAttribute = value =>
  String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const setTag = (html, attribute, key, value) => {
  const pattern = new RegExp(`(<meta\\s+${attribute}="${key}"\\s+content=")[^"]*(")`);
  if (!pattern.test(html)) throw new Error(`dist/index.html has no <meta ${attribute}="${key}">`);
  return html.replace(pattern, (_, start, end) => `${start}${escapeAttribute(value)}${end}`);
};

const renderPage = (template, { title, description, url, image, imageAlt }) => {
  let html = template.replace(/<title>[^<]*<\/title>/, `<title>${escapeAttribute(title)}</title>`);
  html = setTag(html, 'name', 'description', description);
  html = setTag(html, 'property', 'og:title', title);
  html = setTag(html, 'property', 'og:description', description);
  html = setTag(html, 'property', 'og:url', url);
  html = setTag(html, 'property', 'og:image', image);
  html = setTag(html, 'property', 'og:image:alt', imageAlt);
  html = setTag(html, 'name', 'twitter:title', title);
  html = setTag(html, 'name', 'twitter:description', description);
  html = setTag(html, 'name', 'twitter:image', image);
  html = setTag(html, 'name', 'twitter:image:alt', imageAlt);
  return html.replace('</head>', `  <link rel="canonical" href="${escapeAttribute(url)}" />\n  </head>`);
};

const writePage = (route, html) => {
  const file = path.join(DIST, `${route.replace(/^\//, '')}.html`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
};

const main = () => {
  const indexFile = path.join(DIST, 'index.html');
  if (!fs.existsSync(indexFile)) throw new Error('Run vite build before generating route meta.');
  const template = fs.readFileSync(indexFile, 'utf8');
  let pages = 0;
  let withFallbackImage = 0;

  getComponentCatalog().forEach(({ key, name, categorySlug, slug, path: route }) => {
    const ogImage = `/og/${categorySlug}/${slug}.jpg`;
    const hasImage = fs.existsSync(path.join(DIST, ogImage));
    if (!hasImage) withFallbackImage += 1;
    const html = renderPage(template, {
      title: `React Bits - ${name}`,
      description: componentMetadata[key].description,
      url: `${SITE}${route}`,
      image: `${SITE}${hasImage ? ogImage : DEFAULT_IMAGE}`,
      imageAlt: `${name}, a React Bits component`
    });
    writePage(route, html);
    writePage(`/c${route}`, html);
    pages += 2;
  });

  const changelog = renderPage(template, {
    title: 'React Bits - Changelog',
    description: CHANGELOG_DESCRIPTION,
    url: `${SITE}/get-started/changelog`,
    image: `${SITE}${DEFAULT_IMAGE}`,
    imageAlt: 'React Bits: React components that stand out. 200+ free creative components.'
  });
  writePage('/get-started/changelog', changelog);
  writePage('/changelog', changelog);
  pages += 2;

  console.log(
    `Route meta: ${pages} pages written${withFallbackImage ? `, ${withFallbackImage} using the default image` : ''}.`
  );
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
