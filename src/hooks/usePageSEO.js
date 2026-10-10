import { useEffect } from 'react';
import { DEFAULT_DESCRIPTION, HOME_SEO, SITE_URL } from '../utils/seo';

const DEFAULT_IMAGE = '/og.jpg';
const DEFAULT_IMAGE_ALT = 'React Bits: free React components for creative websites.';

const setMeta = (attr, key, content) => {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

/**
 * Keeps title, meta description, social tags and the canonical URL in sync
 * with the current route. Updates the existing tags in <head> in place, so
 * crawlers never see duplicates.
 */
const usePageSEO = ({
  title = HOME_SEO.title,
  description = DEFAULT_DESCRIPTION,
  path,
  image,
  imageAlt,
  robots = 'index, follow'
}) => {
  useEffect(() => {
    document.title = title || HOME_SEO.title;
    setMeta('property', 'og:title', title || HOME_SEO.title);
    setMeta('name', 'twitter:title', title || HOME_SEO.title);

    setMeta('name', 'description', description || DEFAULT_DESCRIPTION);
    setMeta('property', 'og:description', description || DEFAULT_DESCRIPTION);
    setMeta('name', 'twitter:description', description || DEFAULT_DESCRIPTION);
    setMeta('name', 'robots', robots);

    const url = `${SITE_URL}${path ?? window.location.pathname}`;
    setMeta('property', 'og:url', url);

    const imageUrl = `${SITE_URL}${image || DEFAULT_IMAGE}`;
    const alt = imageAlt || DEFAULT_IMAGE_ALT;
    setMeta('property', 'og:image', imageUrl);
    setMeta('name', 'twitter:image', imageUrl);
    setMeta('property', 'og:image:alt', alt);
    setMeta('name', 'twitter:image:alt', alt);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
  }, [title, description, path, image, imageAlt, robots]);
};

export default usePageSEO;
