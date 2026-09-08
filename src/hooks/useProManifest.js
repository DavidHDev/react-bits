import { useEffect, useState } from 'react';

import { HIDDEN_TEMPLATE_SLUGS } from '../constants/Pro';

const MANIFEST_URL = '/pro-manifest.json';

let cache = null;
let inFlight = null;

/** Floats free items to the front. Sort is stable, so the rest keep their order. */
const freeFirst = (items, isFree) => [...items].sort((a, b) => Number(isFree(b)) - Number(isFree(a)));

/**
 * Applies on-domain curation to the generated manifest: drops withheld
 * templates and leads with the free items, since anything free is the
 * strongest entry point into Pro.
 *
 * `counts` is deliberately left untouched. It reflects what Pro actually
 * sells, so the headline total stays accurate even when a preview is withheld.
 */
const curate = json => {
  if (!json) return json;

  const next = { ...json };

  // The manifest ships components in curation order, which reads as random on a
  // component gallery. Alphabetical gives the grid a predictable scan order.
  if (Array.isArray(json.components)) {
    next.components = [...json.components].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', 'en', { numeric: true, sensitivity: 'base' })
    );
  }

  if (Array.isArray(json.templates)) {
    const hidden = new Set(HIDDEN_TEMPLATE_SLUGS);
    next.templates = freeFirst(
      json.templates.filter(template => !hidden.has(template.slug)),
      template => Boolean(template.isFree)
    );
  }

  if (Array.isArray(json.agentKit)) {
    next.agentKit = freeFirst(json.agentKit, item => item.tier === 'free');
  }

  return next;
};

const load = () => {
  if (cache) return Promise.resolve(cache);
  if (inFlight) return inFlight;

  inFlight = fetch(MANIFEST_URL)
    .then(res => {
      if (!res.ok) throw new Error(`Failed to load Pro manifest (${res.status})`);
      return res.json();
    })
    .then(json => {
      cache = curate(json);
      inFlight = null;
      return cache;
    })
    .catch(err => {
      inFlight = null;
      throw err;
    });

  return inFlight;
};

/**
 * Loads the generated Pro catalogue from /pro-manifest.json.
 *
 * The manifest is fetched (not bundled) so replacing the file republishes the
 * whole showcase without a rebuild. Result is cached for the page session.
 *
 * @param {{ enabled?: boolean }} [options] Pass `enabled: false` to defer the
 *   fetch. Used by the search dialog, which is mounted on every page but only
 *   needs the catalogue once someone actually opens it.
 */
export const useProManifest = ({ enabled = true } = {}) => {
  const [manifest, setManifest] = useState(cache);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) return;

    if (cache) {
      setManifest(cache);
      return;
    }

    let active = true;
    load()
      .then(json => active && setManifest(json))
      .catch(err => active && setError(err));

    return () => {
      active = false;
    };
  }, [enabled]);

  return { manifest, loading: enabled && !manifest && !error, error };
};

export default useProManifest;
