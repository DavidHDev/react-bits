import { useCallback, useReducer } from 'react';

const LIMIT = 120;
const COALESCE_MS = 650;

const reducer = (state, action) => {
  switch (action.type) {
    case 'set': {
      const next = typeof action.update === 'function' ? action.update(state.present) : action.update;
      if (next === state.present) return state;
      const now = Date.now();
      const merge = action.key && action.key === state.key && now - state.at < COALESCE_MS;
      return {
        past: merge ? state.past : [...state.past, state.present].slice(-LIMIT),
        present: next,
        future: [],
        key: action.key || null,
        at: now
      };
    }
    case 'replace': {
      const value = typeof action.value === 'function' ? action.value(state.present) : action.value;
      return value === state.present ? state : { ...state, present: value, key: null };
    }
    case 'undo': {
      if (!state.past.length) return state;
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
        key: null,
        at: 0
      };
    }
    case 'redo': {
      if (!state.future.length) return state;
      const [next, ...rest] = state.future;
      return { past: [...state.past, state.present], present: next, future: rest, key: null, at: 0 };
    }
    default:
      return state;
  }
};

export function useHistory(initial) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    past: [],
    present: typeof initial === 'function' ? initial() : initial,
    future: [],
    key: null,
    at: 0
  }));
  const set = useCallback((update, key) => dispatch({ type: 'set', update, key }), []);
  const replace = useCallback(value => dispatch({ type: 'replace', value }), []);
  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);
  return {
    doc: state.present,
    set,
    replace,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0
  };
}
