import { useCallback, useMemo, useReducer } from 'react';
import { normalizeDoc } from '../engine/scene';

const HISTORY_LIMIT = 120;
const COALESCE_MS = 650;

export const getPath = (object, path) =>
  path.split('.').reduce((value, key) => (value === undefined || value === null ? undefined : value[key]), object);

export const setPath = (object, path, value) => {
  const keys = path.split('.');
  const root = Array.isArray(object) ? [...object] : { ...object };
  let cursor = root;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      cursor[key] = value;
      return;
    }
    const next = cursor[key];
    const copy = Array.isArray(next)
      ? [...next]
      : next && typeof next === 'object'
        ? { ...next }
        : /^\d+$/.test(keys[index + 1])
          ? []
          : {};
    cursor[key] = copy;
    cursor = copy;
  });
  return root;
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'commit': {
      const coalesce = action.key && state.key === action.key && action.time - state.time < COALESCE_MS;
      return {
        doc: action.doc,
        preset: action.preset === undefined ? state.preset : action.preset,
        past: coalesce ? state.past : [...state.past, { doc: state.doc, preset: state.preset }].slice(-HISTORY_LIMIT),
        future: [],
        key: action.key || null,
        time: action.time
      };
    }
    case 'undo': {
      if (!state.past.length) return state;
      const previous = state.past[state.past.length - 1];
      return {
        ...state,
        ...previous,
        past: state.past.slice(0, -1),
        future: [{ doc: state.doc, preset: state.preset }, ...state.future],
        key: null,
        time: 0
      };
    }
    case 'redo': {
      if (!state.future.length) return state;
      const next = state.future[0];
      return {
        ...state,
        ...next,
        past: [...state.past, { doc: state.doc, preset: state.preset }],
        future: state.future.slice(1),
        key: null,
        time: 0
      };
    }
    default:
      return state;
  }
};

const KEEP = ['type.text', 'caption.title', 'caption.subtitle'];

export function useShot(initialDoc, initialPreset = null) {
  const [state, dispatch] = useReducer(reducer, null, () => ({
    doc: normalizeDoc(initialDoc),
    preset: initialPreset,
    past: [],
    future: [],
    key: null,
    time: 0
  }));

  const commit = useCallback(
    (doc, { key, preset } = {}) => dispatch({ type: 'commit', doc, key, preset, time: performance.now() }),
    []
  );

  const set = useCallback(
    (path, value, key) => {
      dispatch({
        type: 'commit',
        doc: normalizeDoc(setPath(state.doc, path, value)),
        key: key ?? path,
        time: performance.now()
      });
    },
    [state.doc]
  );

  const patch = useCallback(
    (changes, key) => {
      let next = state.doc;
      Object.entries(changes).forEach(([path, value]) => {
        next = setPath(next, path, value);
      });
      dispatch({ type: 'commit', doc: normalizeDoc(next), key, time: performance.now() });
    },
    [state.doc]
  );

  const applyPreset = useCallback(
    (preset, { keepText = true, map } = {}) => {
      let next = normalizeDoc({ ...preset.doc, aspect: state.doc.aspect });
      if (keepText) {
        KEEP.forEach(path => {
          const previous = getPath(state.doc, path);
          const presetValue = getPath(preset.doc, path);
          if (previous && presetValue) next = setPath(next, path, previous);
        });
        const urls = state.doc.devices.map(device => device.url).filter(url => url !== undefined);
        if (urls.length)
          next = {
            ...next,
            devices: next.devices.map(device =>
              device.url !== undefined || device.type === 'browser' ? { ...device, url: urls[0] } : device
            )
          };
      }
      if (map) next = normalizeDoc(map(next));
      dispatch({ type: 'commit', doc: next, preset: preset.id, time: performance.now() });
    },
    [state.doc]
  );

  const replace = useCallback(
    (doc, preset = null) => dispatch({ type: 'commit', doc: normalizeDoc(doc), preset, time: performance.now() }),
    []
  );
  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);

  return useMemo(
    () => ({
      doc: state.doc,
      preset: state.preset,
      set,
      patch,
      commit,
      applyPreset,
      replace,
      undo,
      redo,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0
    }),
    [state, set, patch, commit, applyPreset, replace, undo, redo]
  );
}
