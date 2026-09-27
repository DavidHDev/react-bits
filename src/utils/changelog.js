import { getComponentCatalog, toSlug } from './catalog.js';

export const CHANGELOG_DESCRIPTION = 'Everything new in React Bits, newest first.';

const CHANGELOG_START = '2026-09-01';

const CATEGORY_LAUNCHES = [
  {
    category: 'Micro',
    date: '2026-09-18',
    note: 'A new category of small, satisfying interactions: switches, buttons, sliders, toasts, menus, loaders and more.'
  }
];

const TYPE_ORDER = { launch: 0, added: 1, updated: 2 };

const firstSentence = text => {
  const match = (text || '').match(/^.*?[.!?](?=\s|$)/);
  return (match ? match[0] : text || '').trim();
};

const byNewest = (a, b) => {
  if (a.date !== b.date) return b.date.localeCompare(a.date);
  if (a.type !== b.type) return TYPE_ORDER[a.type] - TYPE_ORDER[b.type];
  return a.name.localeCompare(b.name);
};

export const getChangelogEntries = () => {
  const catalog = getComponentCatalog();

  const launches = CATEGORY_LAUNCHES.map(({ category, date, note }) => ({
    id: `${category}@launch`,
    type: 'launch',
    date,
    name: category,
    category,
    path: `/c/${toSlug(category)}`,
    note,
    components: catalog
      .filter(entry => entry.category === category && entry.meta.added === date)
      .map(({ name, path }) => ({ name, path }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }));
  const launched = new Set(launches.flatMap(launch => launch.components.map(component => component.path)));

  const changes = catalog.flatMap(({ key, meta, name, category, path }) => {
    const base = { key, name, category, path };
    const added =
      meta.added && !launched.has(path)
        ? [{ ...base, id: `${key}@added`, type: 'added', date: meta.added, note: firstSentence(meta.description) }]
        : [];
    const updates = (meta.updates || []).map(update => ({
      ...base,
      id: `${key}@${update.date}`,
      type: 'updated',
      date: update.date,
      note: update.note
    }));
    return [...added, ...updates];
  });

  return [...launches, ...changes].filter(entry => entry.date >= CHANGELOG_START).sort(byNewest);
};
