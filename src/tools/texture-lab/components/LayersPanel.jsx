import { useRef, useState } from 'react';
import {
  Copy01Icon,
  Delete02Icon,
  DragDropVerticalIcon,
  PlusSignIcon,
  Redo02Icon,
  Undo02Icon,
  ViewIcon,
  ViewOffSlashIcon
} from '@hugeicons/core-free-icons';
import { RotateCcw } from 'lucide-react';
import { EFFECTS } from '../effects';
import ParamControls from './ParamControls';
import LookPanel from './LookPanel';
import { Icon, Tip } from '../../background-studio/components/ui';
import { useScrollEdges } from '../../background-studio/hooks/useScrollEdges';

const ROW = 44;

function LayerRow({ layer, index, count, selected, drag, onSelect, onToggle, onDragStart }) {
  const effect = EFFECTS[layer.type];
  let offset = 0;
  if (drag) {
    if (drag.index === index) offset = drag.dy;
    else {
      const target = Math.max(0, Math.min(count - 1, Math.round(drag.index + drag.dy / ROW)));
      if (drag.index < index && target >= index) offset = -ROW;
      if (drag.index > index && target <= index) offset = ROW;
    }
  }
  const dragging = drag?.index === index;
  return (
    <div
      className="lab-layer"
      role="option"
      aria-selected={selected}
      data-dragging={dragging ? '' : undefined}
      data-hidden={layer.visible ? undefined : ''}
      style={{ transform: offset ? `translateY(${offset}px)` : undefined }}
      onClick={() => onSelect(layer.id)}
    >
      <button
        type="button"
        className="lab-layer-grip"
        aria-label={`Reorder ${effect?.name || 'layer'}`}
        onPointerDown={event => onDragStart(event, index)}
        onClick={event => event.stopPropagation()}
      >
        <Icon icon={DragDropVerticalIcon} size={14} />
      </button>
      <span className="lab-layer-name">{effect?.name || layer.type}</span>
      {layer.mix < 1 && <span className="lab-layer-mix">{Math.round(layer.mix * 100)}%</span>}
      <Tip label={layer.visible ? 'Hide' : 'Show'}>
        <button
          type="button"
          className="lab-icon-button lab-layer-eye"
          aria-label={layer.visible ? `Hide ${effect?.name}` : `Show ${effect?.name}`}
          onClick={event => {
            event.stopPropagation();
            onToggle(layer.id, !layer.visible);
          }}
        >
          <Icon icon={layer.visible ? ViewIcon : ViewOffSlashIcon} size={15} />
        </button>
      </Tip>
    </div>
  );
}

export default function LayersPanel({ stack, look, strength, onStrength, onResetLook, onAdd }) {
  const [drag, setDrag] = useState(null);
  const listRef = useRef(null);
  const scrollRef = useRef(null);
  const edges = useScrollEdges(scrollRef, '.lab-settings .preview-options > *');
  const { layers, selectedLayer } = stack;
  const effect = selectedLayer ? EFFECTS[selectedLayer.type] : null;

  const startDrag = (event, index) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const startY = event.clientY;
    const id = layers[index].id;
    setDrag({ index, dy: 0 });
    const move = moveEvent => setDrag({ index, dy: moveEvent.clientY - startY });
    const end = endEvent => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      const dy = endEvent.clientY - startY;
      const target = Math.max(0, Math.min(layers.length - 1, Math.round(index + dy / ROW)));
      setDrag(null);
      if (target !== index) stack.move(id, target);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

  return (
    <aside className="lab-panel" aria-label="Layers and settings">
      <div
        className="lab-scroll-shell"
        data-top={edges.top ? '' : undefined}
        data-bottom={edges.bottom ? '' : undefined}
      >
        <div className="lab-scroll lab-panel-scroll" ref={scrollRef}>
          <LookPanel
            look={look}
            layers={layers}
            strength={strength}
            onStrength={onStrength}
            onParam={stack.setParam}
            onReset={onResetLook}
          />
          <section className="customize-frame lab-section">
            <div className="customize-heading">
              <h2>Layers</h2>
              <div className="customize-heading-actions">
                <Tip label="Undo" hint="⌘Z">
                  <button
                    type="button"
                    className="customize-heading-action lab-heading-icon"
                    aria-label="Undo"
                    onClick={stack.undo}
                    disabled={!stack.canUndo}
                  >
                    <Icon icon={Undo02Icon} size={15} />
                  </button>
                </Tip>
                <Tip label="Redo" hint="⇧⌘Z">
                  <button
                    type="button"
                    className="customize-heading-action lab-heading-icon"
                    aria-label="Redo"
                    onClick={stack.redo}
                    disabled={!stack.canRedo}
                  >
                    <Icon icon={Redo02Icon} size={15} />
                  </button>
                </Tip>
                <button type="button" className="customize-heading-action lab-add" onClick={onAdd}>
                  <Icon icon={PlusSignIcon} size={14} />
                  <span>Add</span>
                </button>
              </div>
            </div>
            <div className="preview-options lab-layers" role="listbox" aria-label="Effect layers" ref={listRef}>
              {layers.length ? (
                layers.map((layer, index) => (
                  <LayerRow
                    key={layer.id}
                    layer={layer}
                    index={index}
                    count={layers.length}
                    selected={layer.id === stack.selected}
                    drag={drag}
                    onSelect={stack.select}
                    onToggle={(id, visible) => stack.update(id, { visible })}
                    onDragStart={startDrag}
                  />
                ))
              ) : (
                <p className="lab-empty">Pick a style or add an effect to start.</p>
              )}
            </div>
          </section>

          {selectedLayer && effect && (
            <section className="customize-frame lab-section lab-settings">
              <div className="customize-heading">
                <h2>{effect.name}</h2>
                <div className="customize-heading-actions">
                  <Tip label="Reset settings">
                    <button
                      type="button"
                      className="customize-heading-action lab-heading-icon"
                      aria-label="Reset settings"
                      onClick={() => stack.reset(selectedLayer.id)}
                    >
                      <RotateCcw size={14} aria-hidden="true" />
                    </button>
                  </Tip>
                  <Tip label="Duplicate" hint="⌘D">
                    <button
                      type="button"
                      className="customize-heading-action lab-heading-icon"
                      aria-label="Duplicate layer"
                      onClick={() => stack.duplicate(selectedLayer.id)}
                    >
                      <Icon icon={Copy01Icon} size={15} />
                    </button>
                  </Tip>
                  <Tip label="Remove" hint="⌫">
                    <button
                      type="button"
                      className="customize-heading-action lab-heading-icon"
                      aria-label="Remove layer"
                      onClick={() => stack.remove(selectedLayer.id)}
                    >
                      <Icon icon={Delete02Icon} size={15} />
                    </button>
                  </Tip>
                </div>
              </div>
              <div className="preview-options lab-options">
                <ParamControls
                  effect={effect}
                  layer={selectedLayer}
                  onParam={(name, value) => stack.setParam(selectedLayer.id, name, value)}
                  onLayer={(patch, key) => stack.update(selectedLayer.id, patch, key)}
                />
              </div>
            </section>
          )}
        </div>
        <button
          type="button"
          className="lab-more"
          data-hidden={edges.bottom || !edges.below ? '' : undefined}
          tabIndex={edges.bottom || !edges.below ? -1 : 0}
          onClick={() => scrollRef.current?.scrollBy({ top: scrollRef.current.clientHeight * 0.7, behavior: 'smooth' })}
        >
          {edges.below} more
        </button>
      </div>
    </aside>
  );
}
