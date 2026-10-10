import assert from 'node:assert/strict';
import test from 'node:test';
import { getSeoRoutes, getSeoAliases, getSeoRedirects, getRouteFile } from './seoRoutes.js';
import { getLastModified } from './generateSitemap.js';
import { escapeHtml, renderContent } from './prerenderContent.js';
import { getComponentCatalog } from '../src/utils/catalog.js';
import { CATEGORY_SEO, getComponentSEO, getComponentSEOByPath } from '../src/utils/seo.js';
import worker from '../worker/index.js';

const pages = getSeoRoutes();
const paths = new Set(pages.map(page => page.path));

test('covers every component, category, tool and core docs route without duplicates', () => {
  assert.equal(paths.size, pages.length);
  for (const item of getComponentCatalog()) assert.ok(paths.has(item.path), item.path);
  for (const page of Object.values(CATEGORY_SEO)) assert.ok(paths.has(page.path), page.path);
  for (const route of [
    '/get-started/index',
    '/get-started/introduction',
    '/get-started/installation',
    '/get-started/mcp',
    '/get-started/changelog',
    '/tools',
    '/tools/background-studio',
    '/tools/shape-magic',
    '/tools/texture-lab'
  ])
    assert.ok(paths.has(route), route);
});

test('aliases and redirects always lead to canonical routes', () => {
  const aliases = getSeoAliases(pages);
  assert.equal(new Set([...paths, ...aliases.map(page => page.path)]).size, pages.length + aliases.length);
  for (const alias of aliases) assert.ok(paths.has(alias.canonicalPath), alias.path);
  for (const redirect of getSeoRedirects(pages)) assert.ok(paths.has(redirect.to), redirect.from);
  assert.ok(
    aliases.some(
      page => page.path === '/c/text-animations/split-text' && page.canonicalPath === '/text-animations/split-text'
    )
  );
});

test('component text and related links match the shared catalog', () => {
  for (const item of getComponentCatalog()) {
    const seo = getComponentSEO(item);
    assert.deepEqual(getComponentSEOByPath(item.path), seo);
    assert.equal(seo.intro, item.meta.description);
    assert.ok(seo.title.includes(item.name));
    assert.ok(seo.title.includes('React'));
    assert.equal(new Set(seo.related.map(link => link.path)).size, seo.related.length);
    for (const link of seo.related) assert.ok(link.path !== item.path && paths.has(link.path));
  }
  assert.equal(getComponentSEOByPath('/get-started/introduction'), null);
  assert.equal(getComponentSEOByPath('/not-a-component'), null);
});

test('prerendered content is readable and escaped', () => {
  for (const page of pages) {
    const html = renderContent(page);
    assert.equal((html.match(/<h1>/g) ?? []).length, 1, page.path);
    assert.ok(html.includes(escapeHtml(page.heading)), page.path);
    assert.ok(html.includes(escapeHtml(page.intro ?? page.description)), page.path);
    assert.ok(!html.includes('undefined'), page.path);
  }
  assert.equal(escapeHtml('<script>"&\''), '&lt;script&gt;&quot;&amp;&#39;');
  assert.match(renderContent({ heading: '<script>alert(1)</script>', description: 'Safe & sound' }), /&lt;script&gt;/);
});

test('removed guides are absent from routes and prerendered navigation', () => {
  assert.ok(pages.every(page => !page.path.startsWith('/guides')));
  for (const page of pages) assert.ok(!renderContent(page).includes('href="/guides'), page.path);
});

test('lastmod uses recorded dates and omits absent, invalid and future dates', () => {
  assert.equal(getLastModified({ added: '2026-01-02', updates: [{ date: '2026-05-03' }] }, '2026-10-10'), '2026-05-03');
  assert.equal(getLastModified({}, '2026-10-10'), undefined);
  assert.equal(
    getLastModified({ added: '2026-02-31', updates: [{ date: '2027-01-01' }, { date: 'bad' }] }, '2026-10-10'),
    undefined
  );
  assert.equal(pages.find(page => page.path === '/favorites').robots, 'noindex, follow');
});

test('index URLs have their own asset directory instead of becoming the parent directory', () => {
  assert.equal(getRouteFile('/get-started/index'), 'get-started/index/index.html');
  assert.equal(getRouteFile('/c/get-started/index'), 'c/get-started/index/index.html');
  assert.equal(getRouteFile('/text-animations/split-text'), 'text-animations/split-text.html');
});

test('legacy component paths redirect on the server without losing query parameters', async () => {
  const env = { ASSETS: { fetch: () => new Response('Not found', { status: 404 }) } };
  for (const [from, to] of [
    ['/animations/split-text', '/text-animations/split-text'],
    ['/c/animations/split-text', '/c/text-animations/split-text'],
    ['/text-animations/splittext', '/text-animations/split-text'],
    ['/SplitText.html', '/text-animations/split-text']
  ]) {
    const response = await worker.fetch(new Request(`https://reactbits.dev${from}?variant=TS-TW`), env);
    assert.equal(response.status, 301, from);
    assert.equal(response.headers.get('location'), `https://reactbits.dev${to}?variant=TS-TW`);
  }
  for (const from of [
    '/not-a-page',
    '/tools/no-tool',
    '/guides',
    '/guides/animated-react-landing-page',
    '/guides/react-shader-background-performance',
    '/guides/accessible-react-text-animation',
    '/guides/no-guide',
    '/assets/missing.js',
    '/tools/split-text',
    '/guides/split-text',
    '/c/split-text',
    '/r/split-text',
    '/assets/split-text',
    '/og/split-text'
  ]) {
    const response = await worker.fetch(new Request(`https://reactbits.dev${from}`), env);
    assert.equal(response.status, 404, from);
  }
});
