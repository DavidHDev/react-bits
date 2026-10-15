import { levenshtein } from './fuzzy';

const normalize = value => (value || '').toString().toLowerCase().trim();

const compact = value => value.replace(/[^a-z0-9]/g, '');

const wordTails = value => {
  const words = value.split(/[^a-z0-9]+/).filter(Boolean);
  return words.map((_, index) => words.slice(index).join(''));
};

const tokenScore = (item, token) => {
  const name = normalize(item.title || item.name);
  const category = normalize(item.categoryLabel || item.category);
  const tags = (item.tags || []).map(normalize);
  const description = normalize(item.description);
  const flatToken = compact(token);
  const tails = flatToken ? wordTails(name) : [];
  const tagTails = flatToken ? tags.map(wordTails) : [];

  if (name === token || tails[0] === flatToken) return { score: 100, type: 'name' };
  if (name.startsWith(token) || tails[0]?.startsWith(flatToken)) return { score: 90, type: 'name' };
  if (name.includes(token) || tails.some(tail => tail.startsWith(flatToken))) return { score: 80, type: 'name' };
  if (tags.some(tag => tag === token) || tagTails.some(tail => tail[0] === flatToken))
    return { score: 72, type: 'tag' };
  if (
    tags.some(tag => tag.startsWith(token) || tag.includes(token)) ||
    tagTails.some(tail => tail.some(part => part.startsWith(flatToken)))
  )
    return { score: 62, type: 'tag' };
  if (category.includes(token)) return { score: 50, type: 'category' };
  if (description.includes(token)) return { score: 38, type: 'description' };

  if (flatToken.length >= 4) {
    const maxDistance = flatToken.length <= 5 ? 1 : 2;
    const words = name.split(/\s+/);
    const similar = [...words, compact(name)].some(word => levenshtein(word, flatToken) <= maxDistance);
    if (similar) return { score: 20, type: 'similar' };
  }

  return null;
};

export const rankComponentSearch = (item, query) => {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return { score: 1, type: 'name' };

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const matches = tokens.map(token => tokenScore(item, token));
  if (matches.some(match => !match)) return null;

  const score = matches.reduce((total, match) => total + match.score, 0) / matches.length;
  const weakestMatch = [...matches].sort((a, b) => a.score - b.score)[0];
  return { score, type: weakestMatch.type };
};

export const getComponentMatchLabel = (category, type) => {
  if (type === 'tag') return `${category} · tag match`;
  if (type === 'description') return `${category} · description match`;
  if (type === 'category') return `${category} · category match`;
  if (type === 'similar') return `${category} · similar name`;
  return `in ${category}`;
};
