import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSeoRoutes, getSeoAliases, getSeoRedirects, getRouteFile } from './seoRoutes.js';
import { escapeHtml } from './prerenderContent.js';
import { SITE_URL } from '../src/utils/seo.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const pages = getSeoRoutes();
const aliases = getSeoAliases(pages);
const routes = [...pages, ...aliases];
const validPaths = new Set([...routes.map(page => page.path), ...getSeoRedirects(pages).map(item => item.from)]);

for (const page of routes) {
  const file = path.join(dist, getRouteFile(page.path));
  const html = fs.readFileSync(file, 'utf8');
  assert.equal((html.match(/rel="canonical"/g) ?? []).length, 1, `${page.path}: canonical count`);
  assert.ok(html.includes(`<link rel="canonical" href="${SITE_URL}${page.canonicalPath}"`), `${page.path}: canonical`);
  assert.ok(html.includes(`<title>${escapeHtml(page.title)}</title>`), `${page.path}: title`);
  assert.ok(
    html.match(/<meta\s+name="description"\s+content="([^"]*)"/)?.[1] === escapeHtml(page.description),
    `${page.path}: description`
  );
  assert.equal((html.match(/<h1>/g) ?? []).length, 1, `${page.path}: H1`);
  assert.ok(html.includes('data-prerendered="true"'), `${page.path}: body`);
  assert.ok(html.includes(`content="${page.robots || 'index, follow'}"`), `${page.path}: robots`);
  for (const [, href] of html.matchAll(/<a\b[^>]*href="(\/[^"?#]*)/g)) {
    assert.ok(validPaths.has(href), `${page.path}: broken internal link ${href}`);
  }
}

const notFound = fs.readFileSync(path.join(dist, '404.html'), 'utf8');
assert.match(notFound, /name="robots" content="noindex, follow"/);
assert.match(notFound, /<h1>This page doesn/);
assert.equal(
  JSON.parse(fs.readFileSync(path.join(root, 'wrangler.jsonc'), 'utf8')).assets.not_found_handling,
  '404-page'
);
const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
const expected = pages.filter(page => !page.robots?.includes('noindex')).map(page => `${SITE_URL}${page.path}`);
assert.deepEqual(
  sitemapUrls,
  expected,
  'Sitemap should contain canonical public pages, not aliases or private utility pages'
);
console.log(
  `SEO verification passed: ${routes.length} route documents, internal links, canonical metadata, sitemap and 404 configuration.`
);
