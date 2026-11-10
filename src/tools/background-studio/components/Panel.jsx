import { memo, useMemo, useRef } from 'react';
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

const HeadActions = memo(function HeadActions({ onStep, onStepIntent }) {
  const point = event => {
    if (event.pointerType === 'touch') return;
    const button = event.target.closest?.('button');
    const index = button ? Array.prototype.indexOf.call(event.currentTarget.children, button) : -1;
    onStepIntent?.(index === 0 ? -1 : index === 1 ? 1 : 0);
  };
  const leave = () => onStepIntent?.(0);

  return (
    <div className="bs-head-actions" onPointerOver={point} onPointerLeave={leave} onFocus={point} onBlur={leave}>
      <Tip label="Previous background" hint="←">
        <button type="button" className="bs-icon-button" aria-label="Previous background" onClick={() => onStep(-1)}>
          <Icon icon={ArrowLeft01Icon} />
        </button>
      </Tip>
      <Tip label="Next background" hint="→">
        <button type="button" className="bs-icon-button" aria-label="Next background" onClick={() => onStep(1)}>
          <Icon icon={ArrowRight01Icon} />
        </button>
      </Tip>
    </div>
  );
});

const PanelHead = memo(function PanelHead({ entry, docsHref, onStep, onStepIntent }) {
  return (
    <header className="bs-head">
      <div className="bs-head-row">
        <h1 className="bs-title">{entry.label}</h1>
        <HeadActions onStep={onStep} onStepIntent={onStepIntent} />
      </div>
      {entry.description && <p className="bs-desc">{entry.description}</p>}
      <a className="bs-docs-link" href={docsHref} target="_blank" rel="noreferrer">
        Open in docs
        <Icon icon={ArrowUpRight01Icon} size={14} />
      </a>
    </header>
  );
});

const PresetSection = memo(function PresetSection({ tiles, activePreset, onSelect }) {
  return (
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
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
});

const CustomizeHeading = memo(function CustomizeHeading({ canReset, canUndo, canRedo, onReset, onUndo, onRedo }) {
  return (
    <div className="customize-heading">
      <h2>Customize</h2>
      <div className="customize-heading-actions">
        <button
          type="button"
          className={`customize-heading-action customize-reset-action${canReset ? ' is-visible' : ''}`}
          onClick={onReset}
          disabled={!canReset}
          aria-hidden={!canReset}
          tabIndex={canReset ? 0 : -1}
        >
          <RotateCcw size={14} aria-hidden="true" />
          <span>Reset</span>
        </button>
        <Tip label="Undo" hint="⌘Z">
          <button
            type="button"
            className="customize-heading-action bs-heading-icon"
            aria-label="Undo"
            onClick={onUndo}
            disabled={!canUndo}
          >
            <Icon icon={Undo02Icon} size={15} />
          </button>
        </Tip>
        <Tip label="Redo" hint="⇧⌘Z">
          <button
            type="button"
            className="customize-heading-action bs-heading-icon"
            aria-label="Redo"
            onClick={onRedo}
            disabled={!canRedo}
          >
            <Icon icon={Redo02Icon} size={15} />
          </button>
        </Tip>
      </div>
    </div>
  );
});

function PanelScroll({ children }) {
  const scrollRef = useRef(null);
  const edges = useScrollEdges(scrollRef, '.bs-options > *');
  const hidden = edges.bottom || !edges.below;

  return (
    <div className="bs-scroll-shell" data-top={edges.top ? '' : undefined} data-bottom={edges.bottom ? '' : undefined}>
      <div className="bs-panel-scroll" ref={scrollRef}>
        {children}
      </div>
      <button
        type="button"
        className="bs-more"
        data-hidden={hidden ? '' : undefined}
        tabIndex={hidden ? -1 : 0}
        onClick={() => scrollRef.current?.scrollBy({ top: scrollRef.current.clientHeight * 0.7, behavior: 'smooth' })}
      >
        {edges.below} more
        <Icon icon={ArrowDown01Icon} size={14} />
      </button>
    </div>
  );
}

export default function Panel({ state, toolSelector, docsHref, onStep, onStepIntent }) {
  const { entry, presets, activePreset, defaults, light, props } = state;
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

      <PanelHead entry={entry} docsHref={docsHref} onStep={onStep} onStepIntent={onStepIntent} />

      <PanelScroll>
        {tiles.length > 0 && <PresetSection tiles={tiles} activePreset={activePreset} onSelect={state.applyPreset} />}

        <section className="customize-frame bs-section">
          <CustomizeHeading
            canReset={state.canReset}
            canUndo={state.canUndo}
            canRedo={state.canRedo}
            onReset={state.reset}
            onUndo={state.undo}
            onRedo={state.redo}
          />
          <div className="preview-options bs-options">
            {definitions.length ? (
              <PropControls definitions={definitions} props={props} onChange={state.setProp} />
            ) : (
              <p className="bs-empty">This background has no settings.</p>
            )}
          </div>
        </section>
      </PanelScroll>
    </aside>
  );
}
