import { useEffect } from 'react';

const BASE_URL = 'https://reactbits.dev';
const DEFAULT_IMAGE = '/og.jpg';
const DEFAULT_IMAGE_ALT = 'React Bits: React components that stand out. 200+ free creative components.';

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
const usePageSEO = ({ title, description, path, image, imageAlt }) => {
  useEffect(() => {
    if (title) {
      document.title = title;
      setMeta('property', 'og:title', title);
      setMeta('name', 'twitter:title', title);
    }

    if (description) {
      setMeta('name', 'description', description);
      setMeta('property', 'og:description', description);
      setMeta('name', 'twitter:description', description);
    }

    const url = `${BASE_URL}${path ?? window.location.pathname}`;
    setMeta('property', 'og:url', url);

    const imageUrl = `${BASE_URL}${image || DEFAULT_IMAGE}`;
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
  }, [title, description, path, image, imageAlt]);
};

export default usePageSEO;
