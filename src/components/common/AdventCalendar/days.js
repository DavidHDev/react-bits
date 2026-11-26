export const YEAR = 2026;

export const DAYS = 24;

const STORAGE_KEY = `rb-advent-${YEAR}-opened`;

export const LAYOUT_WIDE = [
  [0, 0, 0, 1, 2, 2, 3],
  [4, 5, 6, 7, 8, 9, 10],
  [11, 12, 13, 14, 14, 15, 16],
  [17, 17, 18, 19, 24, 24, 24],
  [20, 21, 22, 23, 24, 24, 24]
];

export const LAYOUT_NARROW = [
  [0, 0, 0, 0, 0],
  [1, 2, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 17, 14],
  [18, 19, 20, 24, 24],
  [21, 22, 23, 24, 24]
];

export const areas = layout => layout.map(row => `"${row.map(day => (day ? `d${day}` : 'info')).join(' ')}"`).join(' ');

export const weekdayOf = day => new Date(YEAR, 11, day).toLocaleDateString('en-US', { weekday: 'short' });

export const dateLabel = day =>
  new Date(YEAR, 11, day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

export const nextUnlock = () => {
  const today = currentDay();
  if (today <= 0) return new Date(YEAR, 11, 1);
  if (today >= DAYS) return null;
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
};

export const spanOf = (layout, day) => {
  let cols = 0;
  let rows = 0;
  layout.forEach(row => {
    const count = row.filter(value => value === day).length;
    if (count) rows += 1;
    cols = Math.max(cols, count);
  });
  return { cols, rows };
};

export const currentDay = () => {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    const param = new URLSearchParams(window.location.search).get('advent');
    const forced = param === null || param === '' ? 25 : Number(param);
    if (Number.isFinite(forced) && forced >= 0) return Math.min(25, forced);
  }
  const now = new Date();
  if (now.getFullYear() < YEAR || (now.getFullYear() === YEAR && now.getMonth() < 11)) return 0;
  if (now.getFullYear() > YEAR) return 25;
  return Math.min(25, now.getDate());
};

export const daysUntilStart = () => {
  const now = new Date();
  const start = new Date(YEAR, 11, 1);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((start - today) / 86400000));
};

export const readOpened = () => {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return new Set(Array.isArray(value) ? value.filter(Number.isFinite) : []);
  } catch {
    return new Set();
  }
};

export const writeOpened = opened => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...opened]));
  } catch {
    return;
  }
};
