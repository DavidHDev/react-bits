import { EFFECTS } from '../effects';
import { BLEND_MODES } from '../engine/engine';
import { LOOKS_BY_ID } from '../looks';
import { SAMPLES } from '../media';
import { decodeLook } from '../share';
import { createLayer } from './useLayers';

export const DEFAULT_LOOK = 'soft-type';

const COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isNumber = value => typeof value === 'number' && Number.isFinite(value);
const isColor = value => typeof value === 'string' && COLOR.test(value);
const has = (map, key) => typeof key === 'string' && Object.prototype.hasOwnProperty.call(map, key);
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const validParam = (param, value) => {
  switch (param.type) {
    case 'number':
      return isNumber(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'select':
      return param.options.some(option => option.value === value);
    case 'color':
      return isColor(value);
    case 'colors':
      return Array.isArray(value) && value.length > 0 && value.every(isColor);
    case 'text':
      return typeof value === 'string';
    default:
      return false;
  }
};

const restoreParams = (effect, params) =>
  isObject(params)
    ? Object.fromEntries(
        effect.params.filter(param => validParam(param, params[param.key])).map(param => [param.key, params[param.key]])
      )
    : {};

export const restoreLayers = items =>
  (Array.isArray(items) ? items : [])
    .filter(item => isObject(item) && has(EFFECTS, item.type))
    .map(item =>
      createLayer(item.type, {
        visible: item.visible !== false,
        mix: isNumber(item.mix) ? clamp(item.mix, 0, 1) : 1,
        blend: BLEND_MODES.includes(item.blend) ? item.blend : null,
        params: restoreParams(EFFECTS[item.type], item.params)
      })
    );

const lookStack = id => {
  const look = LOOKS_BY_ID[id];
  return { layers: look.layers.map(item => createLayer(item.type, item)), look: look.id, selected: null };
};

const restoreStack = state => {
  const look = has(LOOKS_BY_ID, state.look) ? state.look : null;
  if (!Array.isArray(state.layers)) return lookStack(look || DEFAULT_LOOK);
  const layers = restoreLayers(state.layers);
  if (!layers.length && state.layers.length) return lookStack(look || DEFAULT_LOOK);
  return { layers, look, selected: Number.isInteger(state.selected) ? layers[state.selected]?.id || null : null };
};

const restoreMedia = media => {
  if (!isObject(media)) return null;
  if (media.kind === 'sample' && SAMPLES.some(sample => sample.id === media.id)) {
    return { kind: 'sample', id: media.id };
  }
  if (media.kind === 'file' && typeof media.name === 'string' && isNumber(media.size)) {
    return { kind: 'file', name: media.name, size: media.size };
  }
  return null;
};

const restoreTrim = trim =>
  Array.isArray(trim) && trim.length === 2 && trim.every(isNumber) && trim[0] >= 0 && trim[1] > trim[0]
    ? [trim[0], trim[1]]
    : [0, 0];

export const trimFor = (range, duration) => {
  if (!Array.isArray(range) || !(range[1] > range[0])) return [0, duration];
  const start = clamp(range[0], 0, duration);
  const end = clamp(range[1], start, duration);
  return end > start ? [start, end] : [0, duration];
};

export const restoredFile = (record, media) => {
  const blob = record?.blob;
  if (!(blob instanceof Blob) || media?.kind !== 'file') return null;
  const file =
    blob instanceof File
      ? blob
      : new File([blob], record.meta?.name || media.name, { type: record.meta?.type || blob.type });
  return file.name === media.name && file.size === media.size ? file : null;
};

export function restoreState(saved, hash) {
  const state = isObject(saved) ? saved : {};
  const link = hash && hash !== state.share ? decodeLook(hash) : null;
  const shared = link && restoreLayers(link);
  return {
    stack: shared
      ? { layers: shared, look: null, selected: shared[shared.length - 1]?.id || null }
      : restoreStack(state),
    strength: !shared && isNumber(state.strength) ? clamp(state.strength, 0, 1) : 1,
    trim: restoreTrim(state.trim),
    media: restoreMedia(state.media),
    export: isObject(state.export) ? state.export : null,
    share: shared ? hash : typeof state.share === 'string' ? state.share : null
  };
}
