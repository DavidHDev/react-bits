import { useCallback, useMemo, useReducer, useRef } from 'react';
import { EFFECTS, blendFor, defaultParams } from '../effects';

const HISTORY_LIMIT = 100;
const COALESCE_MS = 700;

let counter = 0;
const nextId = () => {
  counter += 1;
  return `layer-${Date.now().toString(36)}-${counter}`;
};

export const createLayer = (type, overrides = {}) => {
  const effect = EFFECTS[type];
  return {
    id: nextId(),
    type,
    visible: overrides.visible ?? true,
    mix: overrides.mix ?? 1,
    blend: overrides.blend || blendFor(type),
    params: { ...defaultParams(effect), ...(overrides.params || {}) }
  };
};

const strip = layers =>
  layers.map(({ id, type, visible, mix, blend, params }) => ({ id, type, visible, mix, blend, params }));

const reducer = (state, action) => {
  switch (action.type) {
    case 'commit': {
      const coalesce = action.key && state.key === action.key && action.time - state.time < COALESCE_MS;
      return {
        layers: action.layers,
        selected: action.selected === undefined ? state.selected : action.selected,
        look: action.look === undefined ? state.look : action.look,
        past: coalesce
          ? state.past
          : [...state.past, { layers: state.layers, selected: state.selected, look: state.look }].slice(-HISTORY_LIMIT),
        future: [],
        key: action.key || null,
        time: action.time
      };
    }
    case 'select':
      return { ...state, selected: action.selected };
    case 'undo': {
      if (!state.past.length) return state;
      const previous = state.past[state.past.length - 1];
      return {
        ...state,
        ...previous,
        past: state.past.slice(0, -1),
        future: [{ layers: state.layers, selected: state.selected, look: state.look }, ...state.future],
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
        past: [...state.past, { layers: state.layers, selected: state.selected, look: state.look }],
        future: state.future.slice(1),
        key: null,
        time: 0
      };
    }
    default:
      return state;
  }
};

export function useLayers(initial = []) {
  const [state, dispatch] = useReducer(reducer, null, () => ({
    layers: initial,
    selected: initial[initial.length - 1]?.id || null,
    look: null,
    past: [],
    future: [],
    key: null,
    time: 0
  }));
  const latest = useRef(state);
  latest.current = state;

  const commit = useCallback((layers, { selected, look = null, key = null } = {}) => {
    dispatch({ type: 'commit', layers, selected, look, key, time: performance.now() });
  }, []);

  const add = useCallback(
    (type, overrides) => {
      const layer = createLayer(type, overrides);
      commit([...latest.current.layers, layer], { selected: layer.id });
      return layer.id;
    },
    [commit]
  );

  const update = useCallback(
    (id, patch, key) => {
      const layers = latest.current.layers.map(layer =>
        layer.id === id
          ? { ...layer, ...patch, params: patch.params ? { ...layer.params, ...patch.params } : layer.params }
          : layer
      );
      commit(layers, { key: key ? `${id}:${key}` : null, look: latest.current.look });
    },
    [commit]
  );

  const setParam = useCallback((id, name, value) => update(id, { params: { [name]: value } }, name), [update]);

  const remove = useCallback(
    id => {
      const { layers, selected } = latest.current;
      const index = layers.findIndex(layer => layer.id === id);
      const next = layers.filter(layer => layer.id !== id);
      const fallback = next[Math.min(index, next.length - 1)]?.id || null;
      commit(next, { selected: selected === id ? fallback : selected });
    },
    [commit]
  );

  const duplicate = useCallback(
    id => {
      const { layers } = latest.current;
      const index = layers.findIndex(layer => layer.id === id);
      if (index < 0) return;
      const source = layers[index];
      const copy = { ...source, id: nextId(), params: JSON.parse(JSON.stringify(source.params)) };
      const next = [...layers.slice(0, index + 1), copy, ...layers.slice(index + 1)];
      commit(next, { selected: copy.id });
    },
    [commit]
  );

  const move = useCallback(
    (id, toIndex) => {
      const { layers } = latest.current;
      const from = layers.findIndex(layer => layer.id === id);
      if (from < 0 || from === toIndex) return;
      const next = layers.slice();
      const [item] = next.splice(from, 1);
      next.splice(Math.max(0, Math.min(next.length, toIndex)), 0, item);
      commit(next);
    },
    [commit]
  );

  const reset = useCallback(
    id => {
      const layer = latest.current.layers.find(item => item.id === id);
      if (!layer) return;
      update(id, { params: defaultParams(EFFECTS[layer.type]), mix: 1, blend: blendFor(layer.type) });
    },
    [update]
  );

  const applyLook = useCallback(
    look => {
      const layers = look.layers.map(item => createLayer(item.type, item));
      commit(layers, { selected: null, look: look.id });
    },
    [commit]
  );

  const replace = useCallback(
    layers => {
      const next = layers.filter(item => EFFECTS[item.type]).map(item => createLayer(item.type, item));
      commit(next, { selected: next[next.length - 1]?.id || null });
    },
    [commit]
  );

  const clear = useCallback(() => commit([], { selected: null }), [commit]);

  const select = useCallback(id => dispatch({ type: 'select', selected: id }), []);
  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);

  const selectedLayer = useMemo(
    () => state.layers.find(layer => layer.id === state.selected) || null,
    [state.layers, state.selected]
  );

  return {
    layers: state.layers,
    selected: state.selected,
    selectedLayer,
    look: state.look,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    serializable: () => strip(latest.current.layers),
    add,
    update,
    setParam,
    remove,
    duplicate,
    move,
    reset,
    applyLook,
    replace,
    clear,
    select,
    undo,
    redo
  };
}
