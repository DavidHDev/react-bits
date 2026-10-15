import { useMemo, useRef } from 'react';
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  Redo02Icon,
  Undo02Icon
} from '@hugeicons/core-free-icons';
import { RotateCcw } from 'lucide-react';
import PropControls from './PropControls';
import { useScrollEdges } from '../hooks/useScrollEdges';
import { Icon, Tip } from './ui';
import PresetTile from './PresetTile';
import { colorsOf } from '../utils/presetColors';

const NONE = [];

export default function Panel({ state, toolSelector, docsHref, onStep }) {
  const { entry, presets, activePreset, defaults, light, props } = state;
  const scrollRef = useRef(null);
  const edges = useScrollEdges(scrollRef, '.bs-options > *');
  const definitions = useMemo(() => (entry.props || NONE).filter(definition => definition.name !== 'paused'), [entry]);

  const tiles = useMemo(() => {
    if (!presets?.options?.length) return [];
    return presets.options.map(option => {
      const resolved = { ...defaults, ...presets.resolve(option.value, { light, defaults, props: defaults }) };
      return { option, colors: colorsOf(resolved, definitions) };
    });
  }, [presets, defaults, light, definitions]);

  return (
    <aside className="bs-panel" aria-label="Background settings">
      {toolSelector && <div className="bs-panel-tool">{toolSelector}</div>}

      <header className="bs-head">
        <div className="bs-head-row">
          <h1 className="bs-title">{entry.label}</h1>
          <div className="bs-head-actions">
            <Tip label="Previous background" hint="←">
              <button
                type="button"
                className="bs-icon-button"
                aria-label="Previous background"
                onClick={() => onStep(-1)}
              >
                <Icon icon={ArrowLeft01Icon} />
              </button>
            </Tip>
            <Tip label="Next background" hint="→">
              <button type="button" className="bs-icon-button" aria-label="Next background" onClick={() => onStep(1)}>
                <Icon icon={ArrowRight01Icon} />
              </button>
            </Tip>
          </div>
        </div>
        {entry.description && <p className="bs-desc">{entry.description}</p>}
        <a className="bs-docs-link" href={docsHref} target="_blank" rel="noreferrer">
          Open in docs
          <Icon icon={ArrowUpRight01Icon} size={14} />
        </a>
      </header>

      <div
        className="bs-scroll-shell"
        data-top={edges.top ? '' : undefined}
        data-bottom={edges.bottom ? '' : undefined}
      >
        <div className="bs-panel-scroll" ref={scrollRef}>
          {tiles.length > 0 && (
            <section className="customize-frame bs-section">
              <div className="customize-heading">
                <h2>Presets</h2>
              </div>
              <div className="preview-options bs-presets">
                {tiles.map(({ option, colors }) => (
                  <PresetTile
                    key={option.value}
                    option={option}
                    colors={colors}
                    active={activePreset === option.value}
                    onSelect={state.applyPreset}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="customize-frame bs-section">
            <div className="customize-heading">
              <h2>Customize</h2>
              <div className="customize-heading-actions">
                <button
                  type="button"
                  className={`customize-heading-action customize-reset-action${state.canReset ? ' is-visible' : ''}`}
                  onClick={state.reset}
                  disabled={!state.canReset}
                  aria-hidden={!state.canReset}
                  tabIndex={state.canReset ? 0 : -1}
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  <span>Reset</span>
                </button>
                <Tip label="Undo" hint="⌘Z">
                  <button
                    type="button"
                    className="customize-heading-action bs-heading-icon"
                    aria-label="Undo"
                    onClick={state.undo}
                    disabled={!state.canUndo}
                  >
                    <Icon icon={Undo02Icon} size={15} />
                  </button>
                </Tip>
                <Tip label="Redo" hint="⇧⌘Z">
                  <button
                    type="button"
                    className="customize-heading-action bs-heading-icon"
                    aria-label="Redo"
                    onClick={state.redo}
                    disabled={!state.canRedo}
                  >
                    <Icon icon={Redo02Icon} size={15} />
                  </button>
                </Tip>
              </div>
            </div>
            <div className="preview-options bs-options">
              {definitions.length ? (
                <PropControls definitions={definitions} props={props} onChange={state.setProp} />
              ) : (
                <p className="bs-empty">This background has no settings.</p>
              )}
            </div>
          </section>
        </div>
        <button
          type="button"
          className="bs-more"
          data-hidden={edges.bottom || !edges.below ? '' : undefined}
          tabIndex={edges.bottom || !edges.below ? -1 : 0}
          onClick={() => scrollRef.current?.scrollBy({ top: scrollRef.current.clientHeight * 0.7, behavior: 'smooth' })}
        >
          {edges.below} more
          <Icon icon={ArrowDown01Icon} size={14} />
        </button>
      </div>
    </aside>
  );
}
