import { readSession } from '../../session';
import { sameValue } from './params';

export const SESSION_TOOL = 'background-studio';

const listeners = new Set();
let remembered = null;

export const getRemembered = () => {
  if (!remembered) {
    const saved = readSession(SESSION_TOOL)?.remembered;
    remembered = saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  }
  return remembered;
};

export const recall = name => getRemembered()[name];

export const oneOf = (value, options, fallback) => (options.some(option => option.value === value) ? value : fallback);

export const remember = (name, value) => {
  if (sameValue(getRemembered()[name], value)) return;
  remembered = { ...remembered, [name]: value };
  listeners.forEach(listener => listener());
};

export const subscribeRemembered = listener => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
