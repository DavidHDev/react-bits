import { CATEGORIES, SOUNDS } from './catalog';

export const formatSeconds = seconds => {
  if (!Number.isFinite(seconds)) return '';
  return seconds < 1 ? `${Math.round(seconds * 1000)} ms` : `${seconds.toFixed(seconds < 10 ? 1 : 0)} s`;
};

const matches = (query, fields) => {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const text = fields.filter(Boolean).join(' ').toLowerCase();
  return words.every(word => text.includes(word));
};

export const visibleSounds = (library, category, query) =>
  SOUNDS.filter(sound => {
    if (query.trim()) {
      const group = CATEGORIES.find(item => item.id === sound.category);
      return matches(query, [sound.name, sound.description, sound.tags, group?.label, sound.library]);
    }
    return sound.library === library && (category === 'all' || sound.category === category);
  });
