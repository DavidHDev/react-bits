import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { getSeoRoutes, getSeoAliases, getSeoRedirects } from './seoRoutes.js';
import { SITE_URL } from '../src/utils/seo.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = new URL(process.env.SEO_BASE_URL || 'http://localhost:8788');
const query = '?utm_source=seo-http-audit&query=retained';
const pages = getSeoRoutes();
const aliases = getSeoAliases(pages);
const redirects = getSeoRedirects(pages);
const redirectTargets = new Map(redirects.map(redirect => [redirect.from, redirect.to]));
let checked = 0;

const request = (url, options = {}) =>
  fetch(url, {
    redirect: 'manual',
    signal: AbortSignal.timeout(15000),
    ...options
  });

const follow = async pathname => {
  let url = new URL(pathname, base);
  const hops = [];
  const seen = new Set();
  for (let index = 0; index < 8; index += 1) {
    assert.equal(url.origin, base.origin, `${pathname}: unexpected external redirect ${url}`);
    assert.ok(!seen.has(url.href), `${pathname}: redirect loop at ${url}`);
    seen.add(url.href);
    const response = await request(url, { headers: { 'Sec-Fetch-Mode': 'navigate' } });
    const html = await response.text();
    hops.push({ status: response.status, url: url.href });
    const location = response.headers.get('location');
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      assert.ok(location, `${pathname}: redirect missing Location`);
      url = new URL(location, url);
      continue;
    }
    return { response, html, url, hops };
  }
  throw new Error(`${pathname}: too many redirects`);
};

const verifyPage = async (pathname, page, finalPath, redirected = false) => {
  const result = await follow(`${pathname}${query}`);
  assert.equal(result.response.status, 200, `${pathname}: HTTP status`);
  assert.equal(result.url.pathname, finalPath, `${pathname}: final path`);
  assert.equal(result.url.searchParams.get('utm_source'), 'seo-http-audit', `${pathname}: lost UTM query`);
  assert.equal(result.url.searchParams.get('query'), 'retained', `${pathname}: lost query`);
  assert.match(result.response.headers.get('content-type') || '', /^text\/html\b/, `${pathname}: content type`);
  assert.ok(
    result.html.includes(`<link rel="canonical" href="${SITE_URL}${page.canonicalPath}"`),
    `${pathname}: canonical metadata`
  );
  assert.ok(result.html.includes('data-prerendered="true"'), `${pathname}: readable initial document`);
  assert.ok(
    result.html.includes(`name="robots" content="${page.robots || 'index, follow'}"`),
    `${pathname}: robots metadata`
  );
  if (redirected) assert.equal(result.hops[0].status, 301, `${pathname}: expected permanent redirect`);
  checked += 1;
};

const main = async () => {
  const jobs = pages.flatMap(page => [
    () => verifyPage(page.path, page, page.path),
    ...(page.path === '/' ? [] : [() => verifyPage(`${page.path}/`, page, page.path)])
  ]);
  for (const alias of aliases) {
    const destination = redirectTargets.get(alias.path);
    jobs.push(() => verifyPage(alias.path, alias, destination || alias.path, Boolean(destination)));
  }
  for (const redirect of redirects) {
    const page = pages.find(candidate => candidate.path === redirect.to);
    assert.ok(page, `${redirect.from}: redirect target is not a canonical route`);
    jobs.push(() => verifyPage(redirect.from, page, redirect.to, true));
  }
  let nextJob = 0;
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      while (nextJob < jobs.length) await jobs[nextJob++]();
    })
  );

  const splitText = pages.find(page => page.path === '/text-animations/split-text');
  assert.ok(splitText, 'Split Text alias fixture is missing');
  for (const [pathname, destination] of [
    ['/splittext', splitText.path],
    ['/SplitText.html', splitText.path],
    ['/animations/split-text', splitText.path],
    ['/text-animations/splittext', splitText.path],
    ['/text-animations/SplitText.htm', splitText.path],
    ['/c/animations/split-text', `/c${splitText.path}`],
    ['/c/text-animations/Split_Text', `/c${splitText.path}`]
  ]) {
    await verifyPage(pathname, splitText, destination, true);
  }

  for (const pathname of [
    '/this-route-does-not-exist-seo-audit',
    '/backgrounds/this-component-does-not-exist',
    '/c/backgrounds/this-component-does-not-exist',
    '/tools/no-such-tool',
    '/guides',
    '/guides/animated-react-landing-page',
    '/guides/react-shader-background-performance',
    '/guides/accessible-react-text-animation',
    '/guides/no-such-guide',
    '/r/no-such-item.json',
    '/assets/no-such-file.js',
    '/tools/split-text',
    '/guides/split-text',
    '/c/split-text',
    '/r/split-text',
    '/assets/split-text',
    '/og/split-text'
  ]) {
    const result = await follow(pathname);
    assert.equal(result.response.status, 404, `${pathname}: must be a real HTTP 404`);
    assert.equal(result.hops.length, 1, `${pathname}: unknown path must not redirect`);
    assert.match(result.html, /name="robots" content="noindex, follow"/, `${pathname}: 404 must be noindex`);
    checked += 1;
  }

  const index = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
  const script = index.match(/<script\b[^>]*src="(\/assets\/[^"?]+\.js)"/)?.[1];
  const stylesheet = index.match(/<link\b[^>]*href="(\/assets\/[^"?]+\.css)"/)?.[1];
  assert.ok(script && stylesheet, 'Built document must reference JavaScript and CSS assets');
  for (const [pathname, type] of [
    ['/r/SplitText-TS-TW.json', /^application\/json\b/],
    ['/og/text-animations/split-text.jpg', /^image\/jpeg\b/],
    [script, /^(?:application|text)\/javascript\b/],
    [stylesheet, /^text\/css\b/]
  ]) {
    const response = await request(new URL(pathname, base));
    assert.equal(response.status, 200, `${pathname}: asset status`);
    assert.match(response.headers.get('content-type') || '', type, `${pathname}: asset content type`);
    if (pathname.endsWith('.json')) {
      const registry = await response.json();
      assert.equal(registry.name, 'SplitText-TS-TW', 'Registry must serve the actual item');
      assert.ok(registry.files?.length, 'Registry item must contain source files');
    } else {
      assert.ok((await response.arrayBuffer()).byteLength > 0, `${pathname}: empty asset`);
    }
    checked += 1;
  }

  for (const section of ['components', 'blocks', 'app-ui', 'templates', 'agent-kit']) {
    for (const suffix of ['', '/']) {
      const pathname = `/pro/${section}${suffix}`;
      const response = await request(new URL(`${pathname}${query}`, base));
      await response.text();
      assert.equal(response.status, 301, `${pathname}: Pro redirect status`);
      const destination = new URL(response.headers.get('location'), base);
      assert.equal(destination.origin, 'https://pro.reactbits.dev', `${pathname}: Pro redirect origin`);
      assert.equal(destination.pathname, `/docs/${section}`, `${pathname}: Pro redirect path`);
      for (const [key, value] of Object.entries({
        utm_source: 'reactbits.dev',
        utm_medium: 'pro-redirect',
        utm_campaign: 'free-to-pro',
        utm_content: 'pro-redirect'
      })) {
        assert.equal(destination.searchParams.get(key), value, `${pathname}: ${key}`);
      }
      checked += 1;
    }
  }
  console.log(
    `SEO HTTP verification passed at ${base.origin}: ${checked} checks covering canonical routes, aliases, redirects, query preservation, real 404s, registry/media assets and Pro tracking.`
  );
};

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
