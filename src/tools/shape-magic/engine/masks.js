import { FONTS, isMaskLayer, maskKey } from '../state/doc';
import { imageField, textField } from './field';
import { MASK_SLOTS } from './shader';

const resolved = new Map();
const pending = new Map();
const fontLinks = new Map();

export const ensureFont = value => {
  const font = FONTS.find(item => item.value === value);
  if (!font?.google || typeof document === 'undefined') return Promise.resolve();
  if (fontLinks.has(value)) return fontLinks.get(value);
  const promise = new Promise(resolve => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${font.google}&display=block`;
    link.onload = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
  fontLinks.set(value, promise);
  return promise;
};

export const fieldFor = key => resolved.get(key) || null;

export const loadField = layer => {
  const key = maskKey(layer);
  if (!key) return Promise.resolve(null);
  if (resolved.has(key)) return Promise.resolve(resolved.get(key));
  if (pending.has(key)) return pending.get(key);
  const job = (async () => {
    if (layer.type === 'text') {
      const text = layer.text || {};
      await ensureFont(text.font);
      return textField({ text: text.value, font: text.font, weight: text.weight, tracking: text.tracking, key });
    }
    return imageField(layer.image.src, key);
  })()
    .then(field => {
      resolved.set(key, field);
      pending.delete(key);
      return field;
    })
    .catch(error => {
      pending.delete(key);
      throw error;
    });
  pending.set(key, job);
  return job;
};

export const maskPlan = lists => {
  const keys = [];
  const slots = {};
  lists
    .filter(Boolean)
    .flat()
    .filter(layer => layer && isMaskLayer(layer) && layer.visible !== false)
    .forEach(layer => {
      const key = maskKey(layer);
      let slot = keys.indexOf(key);
      if (slot < 0 && keys.length < MASK_SLOTS) {
        keys.push(key);
        slot = keys.length - 1;
      }
      if (slot >= 0) slots[layer.id] = slot;
    });
  return { keys, slots };
};

export const bindMasks = (renderer, keys) => {
  for (let slot = 0; slot < MASK_SLOTS; slot++) renderer.setMask(slot, keys[slot] ? fieldFor(keys[slot]) : null);
};

export const masksReady = keys => keys.every(key => resolved.has(key));
