import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useColorMode } from '../../../components/setup/color-mode';
import { CATALOG, DEFAULT_BACKGROUND, findEntry, themeDefaults } from '../utils/catalog';
import { readDocument, sameValue, writeDocument } from '../utils/params';
import { loadPresets } from '../utils/presets';

const HISTORY_LIMIT = 80;
const COALESCE_MS = 700;
const URL_DELAY = 160;

const reducer = (state, action) => {
  switch (action.type) {
    case 'commit': {
      if (sameValue(action.doc, state.doc)) return state;
      const coalesce = action.key && state.key === action.key && action.time - state.time < COALESCE_MS;
      return {
        doc: action.doc,
        past: coalesce ? state.past : [...state.past, state.doc].slice(-HISTORY_LIMIT),
        future: [],
        key: action.key,
        time: action.time
      };
    }
    case 'undo': {
      if (!state.past.length) return state;
      return {
        doc: state.past[state.past.length - 1],
        past: state.past.slice(0, -1),
        future: [state.doc, ...state.future],
        key: null,
        time: 0
      };
    }
    case 'redo': {
      if (!state.future.length) return state;
      return {
        doc: state.future[0],
        past: [...state.past, state.doc],
        future: state.future.slice(1),
        key: null,
        time: 0
      };
    }
    case 'replace':
      return sameValue(action.doc, state.doc) ? state : { ...state, doc: action.doc, key: null, time: 0 };
    default:
      return state;
  }
};

const usePresets = entry => {
  const [state, setState] = useState({ id: null, presets: undefined });

  useEffect(() => {
    let alive = true;
    loadPresets(entry).then(presets => {
      if (alive) setState({ id: entry.id, presets });
    });
    return () => {
      alive = false;
    };
  }, [entry]);

  return state.id === entry.id ? state.presets : undefined;
};

export function useStudioState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { colorMode } = useColorMode();
  const light = colorMode === 'light';
  const [store, dispatch] = useReducer(reducer, null, () => ({
    doc: readDocument(searchParams, DEFAULT_BACKGROUND, findEntry),
    past: [],
    future: [],
    key: null,
    time: 0
  }));
  const { doc } = store;
  const entry = findEntry(doc.id) || findEntry(DEFAULT_BACKGROUND);
  const presets = usePresets(entry);
  const written = useRef(null);

  const defaults = useMemo(() => themeDefaults(entry, light), [entry, light]);

  const layer = useMemo(() => {
    if (!doc.preset || !presets) return {};
    return presets.resolve(doc.preset, { light, defaults, props: defaults });
  }, [doc.preset, presets, light, defaults]);

  const base = useMemo(() => ({ ...defaults, ...layer }), [defaults, layer]);
  const props = useMemo(() => ({ ...base, ...doc.changes }), [base, doc.changes]);
  const renderProps = useMemo(() => ({ ...props, ...(entry.fixedProps || null) }), [props, entry]);
  const ready = presets !== undefined || !doc.preset;

  const latest = useRef({ doc, base });
  latest.current = { doc, base };

  const commit = useCallback((next, key = null) => {
    dispatch({ type: 'commit', doc: next, key, time: performance.now() });
  }, []);

  const setProp = useCallback(
    (name, value) => {
      const { doc: current, base: currentBase } = latest.current;
      const changes = { ...current.changes };
      if (sameValue(value, currentBase[name])) delete changes[name];
      else changes[name] = value;
      commit({ ...current, changes }, `${current.id}:${name}`);
    },
    [commit]
  );

  const applyPreset = useCallback(
    value => {
      const { doc: current } = latest.current;
      commit({ id: current.id, preset: value, changes: {} });
    },
    [commit]
  );

  const reset = useCallback(() => {
    const { doc: current } = latest.current;
    commit({ id: current.id, preset: null, changes: {} });
  }, [commit]);

  const selectBackground = useCallback(
    id => {
      if (!findEntry(id) || id === latest.current.doc.id) return;
      commit({ id, preset: null, changes: {} });
    },
    [commit]
  );

  const step = useCallback(
    direction => {
      const index = CATALOG.findIndex(item => item.id === latest.current.doc.id);
      const next = CATALOG[(index + direction + CATALOG.length) % CATALOG.length];
      selectBackground(next.id);
    },
    [selectBackground]
  );

  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);

  const url = useRef({ searchParams, setSearchParams });
  url.current = { searchParams, setSearchParams };

  useEffect(() => {
    const params = writeDocument(doc, entry);
    const text = params.toString();
    if (text === url.current.searchParams.toString()) {
      written.current = text;
      return undefined;
    }
    const timer = setTimeout(() => {
      written.current = text;
      url.current.setSearchParams(params, { replace: true });
    }, URL_DELAY);
    return () => clearTimeout(timer);
  }, [doc, entry]);

  useEffect(() => {
    const text = searchParams.toString();
    if (text === written.current) return;
    const incoming = readDocument(searchParams, DEFAULT_BACKGROUND, findEntry);
    if (written.current !== null) dispatch({ type: 'replace', doc: incoming });
    written.current = text;
  }, [searchParams]);

  return {
    entry,
    doc,
    light,
    defaults,
    props,
    renderProps,
    ready,
    presets,
    activePreset: doc.preset,
    changedCount: Object.keys(doc.changes).length,
    canReset: Boolean(doc.preset) || Object.keys(doc.changes).length > 0,
    canUndo: store.past.length > 0,
    canRedo: store.future.length > 0,
    setProp,
    applyPreset,
    reset,
    selectBackground,
    step,
    undo,
    redo
  };
}
