import { fuzzyMatch } from './fuzzy';

/**
 * Searches the Pro catalogue for the site search dialog.
 *
 * The free search only matches component names, which is fine when every result
 * is a named component. Pro is browsed by intent instead - people search for
 * "pricing table", "dashboard" or "auth", none of which are names - so this
 * matches names, tags, categories and descriptions, and scores them so a name
 * hit always outranks a description hit.
 */

/** Where a match landed, highest signal first. */
const FIELD_SCORE = {
  nameExact: 100,
  namePrefix: 88,
  nameIncludes: 76,
  tagExact: 70,
  tagPrefix: 58,
  categoryIncludes: 46,
  descriptionIncludes: 34,
  fuzzyName: 20
};

/** A token has to reach at least this to count as the anchor of a match, so a
 *  query never matches on stray description words alone. */
const ANCHOR_SCORE = FIELD_SCORE.categoryIncludes;

const SECTIONS = [
  { key: 'components', label: 'Components', kind: 'item' },
  { key: 'blocks', label: 'Blocks', kind: 'category' },
  { key: 'appUi', label: 'App UI', kind: 'category' },
  { key: 'templates', label: 'Templates', kind: 'item' },
  { key: 'agentKit', label: 'Agent Kit', kind: 'item' }
];

const lower = value => (value || '').toString().toLowerCase();

const compact = value => value.replace(/[^a-z0-9]/g, '');

const wordTails = value => {
  const words = value.split(/[^a-z0-9]+/).filter(Boolean);
  return words.map((_, index) => words.slice(index).join(''));
};

function scoreToken(item, token) {
  const name = lower(item.name);
  const flatToken = compact(token);
  const tails = flatToken ? wordTails(name) : [];

  if (name === token || tails[0] === flatToken) return FIELD_SCORE.nameExact;
  if (name.startsWith(token) || tails[0]?.startsWith(flatToken)) return FIELD_SCORE.namePrefix;
  if (name.includes(token) || tails.some(tail => tail.startsWith(flatToken))) return FIELD_SCORE.nameIncludes;

  const tags = (item.tags || []).map(lower);
  const flatTags = flatToken ? tags.map(compact) : [];
  if (tags.some(tag => tag === token) || flatTags.some(tag => tag === flatToken)) return FIELD_SCORE.tagExact;
  if (tags.some(tag => tag.startsWith(token)) || flatTags.some(tag => tag.startsWith(flatToken)))
    return FIELD_SCORE.tagPrefix;

  const grouping = `${lower(item.category)} ${lower(item.group)}`;
  if (grouping.includes(token)) return FIELD_SCORE.categoryIncludes;

  const description = `${lower(item.description)} ${lower(item.summary)}`;
  if (description.includes(token)) return FIELD_SCORE.descriptionIncludes;

  // Last resort, so "carrousel" still finds Carousel. Only ever applied to the
  // name; fuzzy-matching prose produces noise.
  if (token.length > 3 && (fuzzyMatch(name, token) || fuzzyMatch(compact(name), flatToken)))
    return FIELD_SCORE.fuzzyName;

  return 0;
}

/**
 * Every token has to match something, and at least one has to match strongly.
 * That is what stops "pricing table" from matching anything that merely says
 * "table" while still letting it match the Pricing block.
 */
function scoreItem(item, tokens) {
  let total = 0;
  let best = 0;

  for (const token of tokens) {
    const score = scoreToken(item, token);
    if (!score) return 0;
    total += score;
    best = Math.max(best, score);
  }

  if (best < ANCHOR_SCORE) return 0;

  // Average keeps multi-token queries comparable with single-token ones, and the
  // bonus rewards a query that matched on several tokens rather than one.
  return total / tokens.length + (tokens.length > 1 ? 6 : 0);
}

function contextLabel(item, section) {
  if (section.kind === 'category') {
    const count = item.count ?? item.variants?.length ?? 0;
    return count ? `${count} variant${count === 1 ? '' : 's'} in ${section.label}` : section.label;
  }

  if (section.key === 'templates') return item.isFree ? 'Free template' : 'Template';
  if (section.key === 'agentKit') {
    const kind = item.kind ? item.kind[0].toUpperCase() + item.kind.slice(1) : 'Item';
    return item.tier === 'free' ? `Free ${item.kind || 'item'}` : kind;
  }

  return item.group ? `${item.group} in ${section.label}` : section.label;
}

/**
 * @param {object|null} manifest Parsed pro-manifest.json.
 * @param {string} query Raw search input.
 * @param {{ limit?: number }} [options]
 * @returns {Array<{ id, name, href, context, section, sectionLabel, isFree }>}
 */
export function searchPro(manifest, query, { limit = 6 } = {}) {
  const normalized = lower(query).trim();
  if (!manifest || normalized.length < 2) return [];

  const tokens = normalized.split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];

  const matches = [];

  for (const section of SECTIONS) {
    for (const item of manifest[section.key] || []) {
      if (!item?.href) continue;

      const score = scoreItem(item, tokens);
      if (!score) continue;

      matches.push({
        id: `${section.key}-${item.slug || item.name}`,
        name: item.name,
        href: item.href,
        context: contextLabel(item, section),
        section: section.key,
        sectionLabel: section.label,
        isFree: Boolean(item.isFree) || item.tier === 'free',
        score
      });
    }
  }

  return matches
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map(match => {
      const result = { ...match };
      delete result.score;
      return result;
    });
}

export default searchPro;
