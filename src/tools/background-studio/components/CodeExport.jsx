import { useEffect, useMemo, useState } from 'react';
import CodeExample, { injectPropsIntoCode } from '../../../components/code/CodeExample';
import CopyForAIMenu from '../../../components/common/CopyForAIMenu';
import { ComponentPropsProvider } from '../../../components/context/ComponentPropsContext';
import { ActiveRouteContext } from '../../../components/context/ActiveRouteContext/ActiveRouteContext';
import { useOptions } from '../../../components/context/OptionsContext/useOptions';
import { useAIExportActions } from '../../../hooks/useAIExportActions';
import { buildPrompt, getActiveCode } from '../../../utils/aiPrompt';
import { getDefaultProps } from '../backgrounds';
import { loadCode } from '../utils/catalog';
import { sameValue } from '../utils/params';
import { Track } from './ui';

const PLACEMENTS = [
  { value: 'section', label: 'Section' },
  { value: 'page', label: 'Page background' }
];

const WRAPPER = /<div style=\{\{[^}]*\}\}>/;
const PAGE_WRAPPER = "<div style={{ position: 'fixed', inset: 0, zIndex: -1 }}>";

const noop = () => {};

let rememberedPlacement = 'section';

export default function CodeExport({ state }) {
  const { entry, props } = state;
  const [code, setCode] = useState(undefined);
  const [placement, setPlacementState] = useState(rememberedPlacement);
  const { languagePreset, stylePreset } = useOptions();

  const setPlacement = value => {
    rememberedPlacement = value;
    setPlacementState(value);
  };

  useEffect(() => {
    let alive = true;
    setCode(undefined);
    loadCode(entry)
      .then(result => {
        if (alive) setCode(result);
      })
      .catch(() => {
        if (alive) setCode(null);
      });
    return () => {
      alive = false;
    };
  }, [entry]);

  const changed = useMemo(() => {
    const defaults = getDefaultProps(entry);
    return Object.fromEntries(
      Object.entries(props).filter(([name, value]) => value !== undefined && !sameValue(value, defaults[name]))
    );
  }, [entry, props]);

  const codeObject = useMemo(() => {
    if (!code) return null;
    const usage =
      placement === 'page' && WRAPPER.test(code.usage) ? code.usage.replace(WRAPPER, PAGE_WRAPPER) : code.usage;
    return { ...code, usage };
  }, [code, placement]);

  const configuredUsage = useMemo(
    () => (codeObject ? injectPropsIntoCode(codeObject.usage, changed, {}, entry.name) : ''),
    [codeObject, changed, entry.name]
  );

  const route = useMemo(
    () => ({ category: entry.category, subcategory: entry.id, isCategoryRoute: true }),
    [entry.category, entry.id]
  );

  const ai = useMemo(() => {
    if (!codeObject) return {};
    const { source, css } = getActiveCode(codeObject, languagePreset, stylePreset);
    return {
      componentName: entry.name,
      category: entry.category,
      subcategory: entry.id,
      fullPrompt: buildPrompt(entry.name, { ...codeObject, usage: configuredUsage }, [], languagePreset, stylePreset),
      configuredUsage,
      componentSource: source,
      componentCss: css,
      dependencies: codeObject.dependencies || ''
    };
  }, [codeObject, configuredUsage, entry, languagePreset, stylePreset]);

  const actions = useAIExportActions(ai);

  if (code === undefined) {
    return (
      <div className="bs-code-state">
        <span className="bs-spinner" />
      </div>
    );
  }

  if (!codeObject) {
    return <p className="bs-code-state">The code for this background is not available here. Open the docs instead.</p>;
  }

  return (
    <ActiveRouteContext.Provider value={route}>
      <ComponentPropsProvider
        props={changed}
        defaultProps={{}}
        hasChanges={Object.keys(changed).length > 0}
        resetProps={noop}
      >
        <div className="bs-code">
          <div className="bs-code-bar">
            <Track label="Placement" value={placement} options={PLACEMENTS} onChange={setPlacement} />
            <CopyForAIMenu {...actions} zIndex={1700} />
          </div>
          <CodeExample codeObject={codeObject} componentName={entry.name} />
        </div>
      </ComponentPropsProvider>
    </ActiveRouteContext.Provider>
  );
}
