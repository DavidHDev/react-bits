import { findComponentBySlug } from '../src/utils/routeMatch.js';
import { serveAdvent } from './advent.js';

const RESERVED_PREFIXES = new Set(['tools', 'guides', 'c', 'r', 'assets', 'og', 'advent', 'api']);

const ADVENT_TITLE = 'React Bits Advent Calendar';
const ADVENT_DESCRIPTION = 'A new door opens every day until Christmas Eve.';

class SetContent {
  constructor(value) {
    this.value = value;
  }
  element(element) {
    element.setAttribute('content', this.value);
  }
}

const adventPage = async (request, env, day) => {
  const page = await env.ASSETS.fetch(new Request(new URL('/', request.url), request));
  const title = `Day ${day} | ${ADVENT_TITLE}`;
  return new globalThis.HTMLRewriter()
    .on('title', { element: element => element.setInnerContent(title) })
    .on('meta[property="og:title"], meta[name="twitter:title"]', new SetContent(title))
    .on(
      'meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]',
      new SetContent(ADVENT_DESCRIPTION)
    )
    .on('meta[name="robots"]', new SetContent('noindex, follow'))
    .on('link[rel="canonical"]', {
      element: element => element.setAttribute('href', `https://reactbits.dev/advent/${day}`)
    })
    .transform(page);
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);
    if (segments[0] === 'api' && segments[1] === 'advent') {
      return serveAdvent(request, env, segments.slice(2));
    }
    if (request.method === 'GET' || request.method === 'HEAD') {
      if (segments[0] === 'advent' && segments.length === 2 && /^\d{1,2}$/.test(segments[1])) {
        return adventPage(request, env, Number(segments[1]));
      }
      const isAlias =
        segments.length === 1 ||
        (segments.length === 2 && !RESERVED_PREFIXES.has(segments[0])) ||
        (segments.length === 3 && segments[0] === 'c');
      const match = isAlias ? findComponentBySlug(segments.at(-1)) : null;
      if (match) {
        const destination = `${segments[0] === 'c' && segments.length === 3 ? '/c' : ''}${match.path}`;
        if (url.pathname !== destination) {
          url.pathname = destination;
          return Response.redirect(url.toString(), 301);
        }
      }
    }
    return env.ASSETS.fetch(request);
  }
};
