export const PRO_ORIGIN = 'https://pro.reactbits.dev';

const UTM_SOURCE = 'reactbits.dev';
const UTM_CAMPAIGN = 'free-to-pro';

/**
 * Builds a pro.reactbits.dev URL tagged with UTM params so every outbound click
 * can be attributed to the exact placement that produced it.
 *
 * @param {string} [path] Path on the Pro app, e.g. '/components' or a full URL.
 * @param {string} placement Placement id, e.g. 'navbar', 'pro-section-blocks'.
 * @param {Record<string, string>} [extra] Additional query params.
 */
export const proUrl = (path = '/', placement = 'unknown', extra = {}) => {
  const url = new URL(/^https?:\/\//.test(path) ? path : path || '/', PRO_ORIGIN);

  url.searchParams.set('utm_source', UTM_SOURCE);
  url.searchParams.set('utm_medium', placement);
  url.searchParams.set('utm_campaign', UTM_CAMPAIGN);
  url.searchParams.set('utm_content', placement);

  for (const [key, value] of Object.entries(extra)) {
    if (value != null) url.searchParams.set(key, String(value));
  }

  return url.toString();
};

/**
 * Fires a GA4 event for an outbound Pro click. Safe to call when gtag is absent.
 *
 * @param {string} placement Placement id, matches the utm_medium value.
 * @param {Record<string, unknown>} [params] Extra event params (item, section...).
 */
export const trackProClick = (placement, params = {}) => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  window.gtag('event', 'pro_click', {
    placement,
    page_path: window.location?.pathname,
    ...params
  });
};

/**
 * Records that a Pro surface was actually seen, rather than merely rendered
 * somewhere below the fold. Click-through rate is only useful when its
 * denominator is a real, viewable impression.
 *
 * @param {string} placement Placement id, matches the click event.
 * @param {Record<string, unknown>} [params] Extra context (category, item...).
 */
export const trackProImpression = (placement, params = {}) => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  window.gtag('event', 'pro_impression', {
    placement,
    page_path: window.location?.pathname,
    ...params
  });
};

/**
 * Convenience spread for anchors pointing at the Pro app. Handles the href,
 * target/rel and the GA4 event in one place.
 *
 * @example <a {...proLinkProps('/blocks', 'sidebar')}>Blocks</a>
 */
export const proLinkProps = (path, placement, { params, extra, sameTab = false } = {}) => {
  const href = proUrl(path, placement, extra);
  const destination = new URL(href);

  return {
    href,
    ...(sameTab ? {} : { target: '_blank', rel: 'noopener noreferrer' }),
    onClick: () =>
      trackProClick(placement, {
        destination: `${destination.pathname}${destination.search}${destination.hash}`,
        ...params
      })
  };
};

/**
 * Local preview assets live under `public/assets/pro/<kind>/`, generated at a
 * uniform 16:9. We resolve them by convention rather than from the manifest's
 * `preview` fields, which point at the Pro app's own CDN layout.
 *
 *   components/<slug>.webp          animated webp (~25 frames)
 *   components/<slug>-poster.webp   static first frame
 *   blocks/<variant-slug>.webp      e.g. hero-1.webp
 *   app-ui/<variant-slug>.webp      e.g. ai-chat-1.webp
 *   agent-kit/<kind>-<slug>.webp    e.g. skill-apple-minimal.webp
 */
export const PRO_ASSET_BASE = '/assets/pro';

/** Static poster plus the animated clip used on hover. */
export const proComponentPreview = slug =>
  slug
    ? {
        poster: `${PRO_ASSET_BASE}/components/${slug}-poster.webp`,
        animated: `${PRO_ASSET_BASE}/components/${slug}.webp`
      }
    : null;

/** Flat `<dir>/<slug>.webp` lookup for blocks and app UI variants. */
export const proVariantPreview = (dir, slug) => (dir && slug ? `${PRO_ASSET_BASE}/${dir}/${slug}.webp` : null);

/** Agent Kit files are prefixed with their kind, since slugs repeat across kinds. */
export const proAgentKitPreview = item =>
  item?.slug && item?.kind ? `${PRO_ASSET_BASE}/agent-kit/${item.kind}-${item.slug}.webp` : null;

/**
 * Preview video playback.
 *
 * Cutting a clip dead on mouse-out feels abrupt, so leaving a tile ramps the
 * playback rate down before pausing. `playbackRate` can't reach 0, hence the
 * floor before the actual pause.
 */
const damping = new WeakMap();

const cancelDamping = video => {
  const frame = damping.get(video);
  if (frame) cancelAnimationFrame(frame);
  damping.delete(video);
};

export const playPreview = video => {
  if (!video) return;
  cancelDamping(video);
  video.playbackRate = 1;
  video.play?.().catch(() => {});
};

export const dampenPreview = (video, onSettled) => {
  if (!video) return;
  cancelDamping(video);

  if (video.paused) {
    onSettled?.();
    return;
  }

  const duration = 520;

  const floor = 0.25;
  const from = video.playbackRate || 1;
  const start = performance.now();

  const step = now => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    video.playbackRate = Math.max(floor, from - (from - floor) * eased);

    if (t < 1) {
      damping.set(video, requestAnimationFrame(step));
      return;
    }

    damping.delete(video);
    video.pause();
    video.playbackRate = 1;
    onSettled?.();
  };

  damping.set(video, requestAnimationFrame(step));
};
