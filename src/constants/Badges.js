import { componentMetadata } from './Information.js';
import { CATEGORIES } from './Categories.js';

const NEW_FOR_DAYS = 30;
const UPDATED_FOR_DAYS = 14;
const DAY_MS = 86400000;
const now = Date.now();
const isRecent = (date, days) => Boolean(date) && now - Date.parse(`${date}T00:00:00Z`) < days * DAY_MS;
const toSlug = value => value.replace(/\s+/g, '-').toLowerCase();
const latestUpdate = meta =>
  (meta.updates || []).reduce((latest, update) => (update.date > latest ? update.date : latest), '');

const metadataByPath = new Map(
  Object.entries(componentMetadata).map(([key, meta]) => [new URL(meta.docsUrl).pathname, { key, meta }])
);

const catalog = CATEGORIES.filter(category => category.name !== 'Get Started').flatMap(category =>
  category.subcategories
    .map(name => ({ name, entry: metadataByPath.get(`/${toSlug(category.name)}/${toSlug(name)}`) }))
    .filter(({ entry }) => entry)
);

const recentlyAdded = catalog.filter(({ entry }) => isRecent(entry.meta.added, NEW_FOR_DAYS));
const recentlyUpdated = catalog.filter(
  ({ entry }) => !isRecent(entry.meta.added, NEW_FOR_DAYS) && isRecent(latestUpdate(entry.meta), UPDATED_FOR_DAYS)
);

export const NEW = recentlyAdded.map(({ name }) => name);
export const NEW_KEYS = new Set(recentlyAdded.map(({ entry }) => entry.key));
export const UPDATED = recentlyUpdated.map(({ name }) => name);
export const UPDATED_KEYS = new Set(recentlyUpdated.map(({ entry }) => entry.key));
