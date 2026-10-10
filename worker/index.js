import { findComponentBySlug } from '../src/utils/routeMatch.js';

const RESERVED_PREFIXES = new Set(['tools', 'guides', 'c', 'r', 'assets', 'og']);

export default {
  async fetch(request, env) {
    if (request.method === 'GET' || request.method === 'HEAD') {
      const url = new URL(request.url);
      const segments = url.pathname.split('/').filter(Boolean);
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
