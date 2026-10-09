import { useQueryStates } from 'nuqs';
import { useCallback, useMemo, useRef } from 'react';
import { useColorMode } from '../components/setup/color-mode';
import { getBackgroundLightProps } from '../constants/backgroundThemeProps';

const isHexColor = value => typeof value === 'string' && /^#?[0-9a-fA-F]{3,8}$/.test(value);

const sameValue = (a, b) => (Array.isArray(a) || Array.isArray(b) ? JSON.stringify(a) === JSON.stringify(b) : a === b);

const createParser = defaultValue => {
  if (Array.isArray(defaultValue)) {
    return {
      parse: v =>
        v === null || v === ''
          ? null
          : v.split(',').map(item => (isHexColor(item) && !item.startsWith('#') ? `#${item}` : item)),
      serialize: v =>
        Array.isArray(v) ? v.map(item => (isHexColor(item) ? item.replace(/^#/, '') : item)).join(',') : String(v),
      eq: sameValue
    };
  }
  if (typeof defaultValue === 'number') {
    return {
      parse: v => (v === null || v === '' ? null : Number(v)),
      serialize: v => String(v),
      eq: (a, b) => a === b
    };
  }
  if (typeof defaultValue === 'boolean') {
    return {
      parse: v => (v === null || v === '' ? null : v === 'true'),
      serialize: v => String(v),
      eq: (a, b) => a === b
    };
  }
  if (isHexColor(defaultValue)) {
    return {
      parse: v => (v === null || v === '' ? null : `#${v}`),
      serialize: v => v.replace(/^#/, ''),
      eq: (a, b) => a === b
    };
  }
  return {
    parse: v => (v === null || v === '' ? null : v),
    serialize: v => String(v),
    eq: (a, b) => a === b
  };
};

export function useComponentProps(defaultProps) {
  const defaultPropsRef = useRef(defaultProps);
  const { colorMode } = useColorMode();
  const lightProps = useMemo(() => getBackgroundLightProps(), []);

  const effectiveDefaultProps = useMemo(
    () =>
      colorMode === 'light' && lightProps ? { ...defaultPropsRef.current, ...lightProps } : defaultPropsRef.current,
    [colorMode, lightProps]
  );

  const parsers = useMemo(() => {
    const result = {};
    for (const [key, defaultValue] of Object.entries(defaultPropsRef.current)) {
      result[key] = createParser(defaultValue);
    }
    return result;
  }, []);

  const [queryState, setQueryState] = useQueryStates(parsers);

  const props = useMemo(() => {
    const merged = { ...effectiveDefaultProps };
    for (const [key, value] of Object.entries(queryState)) {
      if (value !== null) {
        merged[key] = value;
      }
    }
    return merged;
  }, [effectiveDefaultProps, queryState]);

  const hasChanges = useMemo(() => {
    return Object.values(queryState).some(v => v !== null);
  }, [queryState]);

  const updateProp = useCallback(
    (name, value) => {
      const newValue = sameValue(value, effectiveDefaultProps[name]) ? null : value;
      setQueryState({ [name]: newValue });
    },
    [effectiveDefaultProps, setQueryState]
  );

  const updateProps = useCallback(
    updates => {
      const newState = {};
      for (const [name, value] of Object.entries(updates)) {
        newState[name] = sameValue(value, effectiveDefaultProps[name]) ? null : value;
      }
      setQueryState(newState);
    },
    [effectiveDefaultProps, setQueryState]
  );

  const resetProps = useCallback(() => {
    const resetState = {};
    for (const key of Object.keys(defaultPropsRef.current)) {
      resetState[key] = null;
    }
    setQueryState(resetState);
  }, [setQueryState]);

  const getShareUrl = useCallback(() => {
    return window.location.href;
  }, []);

  return {
    props,
    defaultProps: effectiveDefaultProps,
    updateProp,
    updateProps,
    resetProps,
    hasChanges,
    getShareUrl
  };
}

export default useComponentProps;
