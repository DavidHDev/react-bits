import { getComponentCatalog } from './catalog';

const catalog = getComponentCatalog();

const squash = value =>
  String(value || '')
    .toLowerCase()
    .replace(/\.html?$/, '')
    .replace(/[^a-z0-9]/g, '');

const bySlug = new Map(catalog.map(item => [squash(item.slug), item]));

export const findComponentBySlug = slug => bySlug.get(squash(slug)) || null;

const editDistance = (a, b) => {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return row[b.length];
};

const similarity = (query, target) => {
  const ratio = Math.min(query.length, target.length) / Math.max(query.length, target.length);
  if (target.includes(query) || query.includes(target)) return 0.7 + 0.3 * ratio;
  return 1 - editDistance(query, target) / Math.max(query.length, target.length);
};

export const suggestComponents = (query, limit = 3) => {
  const needle = squash(query);
  if (needle.length < 3) return [];
  const threshold = needle.length <= 5 ? 0.7 : 0.6;
  return catalog
    .map(item => ({ item, score: similarity(needle, squash(item.slug)) }))
    .filter(entry => entry.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(entry => entry.item);
};
