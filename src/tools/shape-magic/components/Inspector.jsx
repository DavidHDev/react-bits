import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignBottomIcon,
  AlignHorizontalCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  AlignTopIcon,
  AlignVerticalCenterIcon,
  Copy01Icon,
  Delete02Icon,
  DistributeHorizontalCenterIcon,
  DistributeVerticalCenterIcon,
  DragDropVerticalIcon,
  FlipHorizontalIcon,
  FlipVerticalIcon,
  PlusSignIcon,
  Redo02Icon,
  Undo02Icon,
  ViewIcon,
  ViewOffSlashIcon
} from '@hugeicons/core-free-icons';
import PreviewSlider from '../../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../../components/common/Preview/PreviewSelect';
import PreviewInput from '../../../components/common/Preview/PreviewInput';
import PreviewColorPickerCustom from '../../../components/common/Preview/PreviewColorPickerCustom';
import PropControls from '../../../tools/background-studio/components/PropControls';
import { Icon, Tip, Track } from '../../../tools/background-studio/components/ui';
import { useScrollEdges } from '../../../tools/background-studio/hooks/useScrollEdges';
import { PRIMITIVES_BY_ID } from '../engine/primitives';
import { DEFAULT_EFFECTS, FONTS, OPS, RATIOS, layerName, smoothFor } from '../state/doc';
import { MARKS } from '../presets/marks';
import { METAL_DEFINITIONS, backgroundDefaults, backgroundValues, materialFor } from '../presets/materials';
import PresetTile from '../../../tools/background-studio/components/PresetTile';
import { colorsOf } from '../../../tools/background-studio/utils/presetColors';
import { loadPresets } from '../../../tools/background-studio/utils/presets';
import ShapePicker from './ShapePicker';

const ROW = 44;

const FILL_KINDS = [
  { value: 'solid', label: 'Solid' },
  { value: 'linear', label: 'Linear' },
  { value: 'radial', label: 'Radial' },
  { value: 'conic', label: 'Conic' }
];

const BACKGROUND_KINDS = [
  { value: 'none', label: 'None' },
  { value: 'color', label: 'Color' },
  { value: 'linear', label: 'Gradient' }
];

const PATTERNS = [
  { value: 'none', label: 'None' },
  { value: 'lines', label: 'Lines' },
  { value: 'rings', label: 'Rings' },
  { value: 'rays', label: 'Rays' },
  { value: 'grid', label: 'Grid' },
  { value: 'dots', label: 'Dots' },
  { value: 'halftone', label: 'Halftone' }
];

const LAYOUTS = [
  { value: 'radial', label: 'Around center' },
  { value: 'row', label: 'Row' },
  { value: 'column', label: 'Column' }
];

const OUTLINE_MODES = [
  { value: 'outside', label: 'Outside' },
  { value: 'center', label: 'Centered' }
];

const useBackgroundPresets = entry => {
  const [state, setState] = useState({ id: null, presets: null });
  useEffect(() => {
    if (!entry) return undefined;
    let alive = true;
    loadPresets(entry).then(presets => {
      if (alive) setState({ id: entry.id, presets });
    });
    return () => {
      alive = false;
    };
  }, [entry]);
  return entry && state.id === entry.id ? state.presets : null;
};

function BackgroundPresets({ material, onSelect }) {
  const presets = useBackgroundPresets(material.entry);
  const tiles = useMemo(() => {
    if (!presets?.options?.length) return [];
    const defaults = backgroundDefaults(material.entry);
    return presets.options.map(option => ({
      option,
      colors: colorsOf(
        { ...defaults, ...presets.resolve(option.value, { light: false, defaults, props: defaults }) },
        material.entry.props
      )
    }));
  }, [presets, material.entry]);
  if (!tiles.length) return null;
  return (
    <section className="customize-frame lab-section">
      <div className="customize-heading">
        <h2>Presets</h2>
      </div>
      <div className="preview-options bs-presets">
        {tiles.map(({ option, colors }) => (
          <PresetTile
            key={option.value}
            option={option}
            colors={colors}
            active={material.look === option.value}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}

function Section({ title, actions, children, className = '' }) {
  return (
    <section className={`customize-frame lab-section ${className}`}>
      <div className="customize-heading">
        <h2>{title}</h2>
        {actions && <div className="customize-heading-actions">{actions}</div>}
      </div>
      <div className="preview-options lab-options">{children}</div>
    </section>
  );
}

function HeadingButton({ label, hint, icon, onClick, disabled }) {
  return (
    <Tip label={label} hint={hint}>
      <button
        type="button"
        className="customize-heading-action lab-heading-icon"
        aria-label={label}
        onClick={onClick}
        disabled={disabled}
      >
        <Icon icon={icon} size={15} />
      </button>
    </Tip>
  );
}

const ALIGN_TOOLS = [
  { value: 'left', label: 'Align left', hint: '⌥A', icon: AlignLeftIcon },
  { value: 'hcenter', label: 'Align centers', hint: '⌥H', icon: AlignHorizontalCenterIcon },
  { value: 'right', label: 'Align right', hint: '⌥D', icon: AlignRightIcon },
  { value: 'top', label: 'Align top', hint: '⌥W', icon: AlignTopIcon },
  { value: 'vcenter', label: 'Align middles', hint: '⌥V', icon: AlignVerticalCenterIcon },
  { value: 'bottom', label: 'Align bottom', hint: '⌥S', icon: AlignBottomIcon }
];

function ToolButton({ label, hint, icon, onClick, disabled }) {
  return (
    <Tip label={label} hint={hint}>
      <button
        type="button"
        className="docs-segment docs-segment--icon smg-arrange-button"
        aria-label={label}
        onClick={onClick}
        disabled={disabled}
      >
        <Icon icon={icon} size={15} />
      </button>
    </Tip>
  );
}

function ArrangeBar({ count, actions }) {
  const many = count > 1;
  return (
    <div className="smg-arrange smg-full">
      <div
        className="docs-track smg-arrange-group"
        role="group"
        aria-label={many ? 'Align layers' : 'Align to artboard'}
      >
        {ALIGN_TOOLS.map(tool => (
          <ToolButton
            key={tool.value}
            label={many ? tool.label : `${tool.label} to artboard`}
            hint={tool.hint}
            icon={tool.icon}
            onClick={() => actions.alignSelection(tool.value)}
          />
        ))}
      </div>
      <div className="docs-track smg-arrange-group" role="group" aria-label="Distribute and flip">
        {many && (
          <>
            <ToolButton
              label="Distribute horizontally"
              icon={DistributeHorizontalCenterIcon}
              onClick={() => actions.distributeSelection('x')}
              disabled={count < 3}
            />
            <ToolButton
              label="Distribute vertically"
              icon={DistributeVerticalCenterIcon}
              onClick={() => actions.distributeSelection('y')}
              disabled={count < 3}
            />
          </>
        )}
        <ToolButton
          label="Flip horizontal"
          hint="⇧H"
          icon={FlipHorizontalIcon}
          onClick={() => actions.flipSelection('x')}
        />
        <ToolButton
          label="Flip vertical"
          hint="⇧V"
          icon={FlipVerticalIcon}
          onClick={() => actions.flipSelection('y')}
        />
      </div>
    </div>
  );
}

function LayerRow({ layer, index, count, selected, drag, thumb, onSelect, onToggle, onDragStart }) {
  let offset = 0;
  if (drag) {
    if (drag.index === index) offset = drag.dy;
    else {
      const target = Math.max(0, Math.min(count - 1, Math.round(drag.index + drag.dy / ROW)));
      if (drag.index < index && target >= index) offset = -ROW;
      if (drag.index > index && target <= index) offset = ROW;
    }
  }
  const name = layerName(layer);
  return (
    <div
      className="lab-layer smg-layer"
      role="option"
      aria-selected={selected}
      data-dragging={drag?.index === index ? '' : undefined}
      data-hidden={layer.visible === false ? '' : undefined}
      style={{ transform: offset ? `translateY(${offset}px)` : undefined }}
      onClick={event => onSelect(layer.id, { toggle: event.shiftKey || event.metaKey || event.ctrlKey })}
    >
      <button
        type="button"
        className="lab-layer-grip"
        aria-label={`Reorder ${name}`}
        onPointerDown={event => onDragStart(event, index)}
        onClick={event => event.stopPropagation()}
      >
        <Icon icon={DragDropVerticalIcon} size={14} />
      </button>
      <span className="smg-layer-icon" aria-hidden="true">
        {layer.type === 'image' && layer.image?.src ? (
          <img src={layer.image.src} alt="" draggable={false} data-logo="" />
        ) : thumb ? (
          <img src={thumb} alt="" draggable={false} />
        ) : (
          <span>{layer.type === 'text' ? 'T' : ''}</span>
        )}
      </span>
      <span className="lab-layer-name">{name}</span>
      {index > 0 && layer.op !== 'add' && (
        <span className="lab-layer-mix">{OPS.find(op => op.value === layer.op)?.label}</span>
      )}
      <Tip label={layer.visible === false ? 'Show' : 'Hide'}>
        <button
          type="button"
          className="lab-icon-button lab-layer-eye"
          aria-label={layer.visible === false ? `Show ${name}` : `Hide ${name}`}
          onClick={event => {
            event.stopPropagation();
            onToggle(layer.id, layer.visible === false);
          }}
        >
          <Icon icon={layer.visible === false ? ViewOffSlashIcon : ViewIcon} size={15} />
        </button>
      </Tip>
    </div>
  );
}

function LayerControls({ layer, index, onLayer, onParam, onText, onReplaceImage, textRef }) {
  const primitive = PRIMITIVES_BY_ID[layer.type];
  const pattern = layer.pattern || 'none';
  const font = FONTS.find(item => item.value === layer.text?.font) || FONTS[0];
  const combined = index > 0;
  return (
    <>
      {layer.type === 'text' && (
        <>
          <div className="smg-text-field" ref={textRef}>
            <PreviewInput
              title="Text"
              value={layer.text?.value ?? ''}
              maxLength={24}
              onChange={value => onText({ value })}
            />
          </div>
          <PreviewSelect
            title="Font"
            options={FONTS.map(item => ({ value: item.value, label: item.label }))}
            value={layer.text?.font}
            onChange={value => {
              const next = FONTS.find(item => item.value === value);
              const weight = next?.weights.includes(layer.text?.weight) ? layer.text.weight : next?.weights.at(-1);
              onText({ font: value, weight });
            }}
          />
          <PreviewSelect
            title="Weight"
            options={font.weights.map(weight => ({ value: weight, label: String(weight) }))}
            value={layer.text?.weight}
            onChange={value => onText({ weight: Number(value) })}
          />
          <PreviewSlider
            title="Spacing"
            min={-0.12}
            max={0.4}
            step={0.01}
            value={layer.text?.tracking ?? 0}
            onChange={value => onText({ tracking: value }, 'tracking')}
          />
        </>
      )}
      {layer.type === 'image' && (
        <button type="button" className="docs-tool smg-wide" onClick={onReplaceImage}>
          Replace logo
        </button>
      )}
      {primitive?.params.map(param => (
        <PreviewSlider
          key={param.key}
          title={param.label}
          min={param.min}
          max={param.max}
          step={param.step}
          value={layer.params?.[param.key] ?? param.default}
          onChange={value => onParam(param.key, value)}
        />
      ))}
      {combined && (
        <div className="smg-full">
          <Track label="Combine" value={layer.op} options={OPS} onChange={op => onLayer({ op })} className="smg-ops" />
        </div>
      )}
      {combined && ['merge', 'cut', 'keep'].includes(layer.op) && (
        <PreviewSlider
          title="Smoothness"
          min={0}
          max={0.6}
          step={0.005}
          value={smoothFor(layer)}
          onChange={smooth => onLayer({ smooth }, 'smooth')}
        />
      )}
      <PreviewSlider
        title="Size"
        min={0.05}
        max={1.6}
        step={0.005}
        value={layer.size}
        onChange={size => onLayer({ size }, 'size')}
      />
      <PreviewSlider
        title="Rotation"
        min={-180}
        max={180}
        step={1}
        valueUnit="°"
        value={layer.rotation}
        onChange={rotation => onLayer({ rotation }, 'rotation')}
      />
      <PreviewSlider
        title="Position X"
        min={-1.2}
        max={1.2}
        step={0.005}
        value={layer.x}
        onChange={x => onLayer({ x }, 'x')}
      />
      <PreviewSlider
        title="Position Y"
        min={-1.2}
        max={1.2}
        step={0.005}
        value={layer.y}
        onChange={y => onLayer({ y }, 'y')}
      />
      <PreviewSelect
        title="Pattern"
        options={PATTERNS}
        value={layer.pattern || 'none'}
        onChange={pattern => onLayer({ pattern })}
      />
      {pattern !== 'none' && (
        <>
          <PreviewSlider
            title={pattern === 'rays' ? 'Rays' : 'Density'}
            min={2}
            max={pattern === 'rays' ? 48 : 40}
            step={1}
            value={layer.density ?? 8}
            onChange={density => onLayer({ density }, 'density')}
          />
          <PreviewSlider
            title="Weight"
            min={0.05}
            max={0.95}
            step={0.01}
            value={layer.weight ?? 0.5}
            onChange={weight => onLayer({ weight }, 'weight')}
          />
          {pattern !== 'rings' && pattern !== 'halftone' && (
            <PreviewSlider
              title="Pattern angle"
              min={0}
              max={180}
              step={1}
              valueUnit="°"
              value={layer.patternAngle ?? 0}
              onChange={patternAngle => onLayer({ patternAngle }, 'pattern-angle')}
            />
          )}
          {(pattern === 'lines' || pattern === 'grid') && (
            <PreviewSlider
              title="Bulge"
              min={0}
              max={1}
              step={0.01}
              value={layer.bulge ?? 0}
              onChange={bulge => onLayer({ bulge }, 'bulge')}
            />
          )}
          <PreviewSlider
            title="Taper"
            min={0}
            max={1}
            step={0.01}
            value={layer.taper ?? 0}
            onChange={taper => onLayer({ taper }, 'taper')}
          />
          <PreviewSwitch title="Cut out" isChecked={Boolean(layer.invert)} onChange={invert => onLayer({ invert })} />
        </>
      )}
      <PreviewSlider
        title="Repeat"
        min={1}
        max={16}
        step={1}
        value={layer.repeat}
        onChange={repeat => onLayer({ repeat }, 'repeat')}
      />
      {layer.repeat > 1 && (
        <PreviewSelect
          title="Layout"
          options={LAYOUTS}
          value={layer.layout || 'radial'}
          onChange={layout => onLayer({ layout })}
        />
      )}
      {layer.repeat > 1 && (layer.layout || 'radial') === 'radial' && (
        <PreviewSlider
          title="Spin"
          min={-180}
          max={180}
          step={1}
          valueUnit="°"
          value={layer.spin}
          onChange={spin => onLayer({ spin }, 'spin')}
        />
      )}
      {layer.repeat > 1 && (layer.layout || 'radial') !== 'radial' && (
        <PreviewSlider
          title="Gap"
          min={0.5}
          max={6}
          step={0.05}
          value={layer.gap ?? 2.3}
          onChange={gap => onLayer({ gap }, 'gap')}
        />
      )}
      <PreviewSlider
        title="Hollow"
        min={0}
        max={0.3}
        step={0.002}
        value={layer.outline}
        onChange={outline => onLayer({ outline }, 'outline')}
      />
      <PreviewSlider
        title="Round"
        min={0}
        max={0.3}
        step={0.002}
        value={layer.round}
        onChange={round => onLayer({ round }, 'round')}
      />
      <PreviewSwitch title="Mirror" isChecked={Boolean(layer.mirror)} onChange={mirror => onLayer({ mirror })} />
    </>
  );
}

function FillControls({ fill, onFill, hasLogo }) {
  const gradient = !['solid', 'none', 'logo'].includes(fill.kind);
  const kinds = hasLogo ? [...FILL_KINDS, { value: 'logo', label: 'Logo' }] : FILL_KINDS;
  return (
    <>
      <div className="smg-full">
        <Track
          label="Fill type"
          value={fill.kind}
          options={kinds}
          onChange={kind => onFill({ kind })}
          className="smg-kinds"
        />
      </div>
      <PreviewColorPickerCustom
        title={gradient ? 'Start' : fill.kind === 'logo' ? 'Other shapes' : 'Color'}
        color={fill.color1}
        alpha
        onChange={color1 => onFill({ color1 }, 'color1')}
      />
      {gradient && (
        <PreviewColorPickerCustom
          title={fill.stops === 3 ? 'Middle' : 'End'}
          color={fill.color2}
          alpha
          onChange={color2 => onFill({ color2 }, 'color2')}
        />
      )}
      {gradient && fill.stops === 3 && (
        <PreviewColorPickerCustom
          title="End"
          color={fill.color3}
          alpha
          onChange={color3 => onFill({ color3 }, 'color3')}
        />
      )}
      {gradient && (
        <PreviewSwitch
          title="Three colors"
          isChecked={fill.stops === 3}
          onChange={on => onFill({ stops: on ? 3 : 2 })}
        />
      )}
      {(fill.kind === 'linear' || fill.kind === 'conic') && (
        <PreviewSlider
          title="Angle"
          min={0}
          max={360}
          step={1}
          valueUnit="°"
          value={fill.angle ?? 0}
          onChange={angle => onFill({ angle }, 'angle')}
        />
      )}
      {(fill.kind === 'linear' || fill.kind === 'radial') && (
        <PreviewSlider
          title="Spread"
          min={0.3}
          max={2}
          step={0.01}
          value={fill.extent ?? 1}
          onChange={extent => onFill({ extent }, 'extent')}
        />
      )}
    </>
  );
}

const DEPTH_LABELS = ['Bevel', 'Puffiness', 'Roundness', 'Relief', 'Height'];

const surfaceNote = material => {
  if (material.kind === 'metal') return 'Liquid metal builds its own 3D edge. Edge bend above sets how far it wraps.';
  if (material.kind !== 'procedural' || material.def.kind === 'fill') return null;
  const depth = material.def.params.find(param => DEPTH_LABELS.includes(param.label));
  return depth
    ? `${material.def.name} builds its own 3D surface. ${depth.label} above sets its depth.`
    : `${material.def.name} is shaded by its own settings above, so it has no bevel.`;
};

function EffectControls({ effects, accent, onEffect, bevel = true, surfaceNote = null }) {
  const { outline, shadow, glow, gloss } = effects;
  return (
    <>
      <PreviewSwitch title="Outline" isChecked={outline.on} onChange={on => onEffect('outline', { on })} />
      {outline.on && (
        <>
          <PreviewSlider
            title="Outline width"
            min={0.005}
            max={0.2}
            step={0.001}
            value={outline.width}
            onChange={width => onEffect('outline', { width }, 'outline-width')}
          />
          <PreviewSelect
            title="Outline position"
            options={OUTLINE_MODES}
            value={outline.mode}
            onChange={mode => onEffect('outline', { mode })}
          />
          <PreviewColorPickerCustom
            title="Outline color"
            color={outline.color}
            alpha
            onChange={color => onEffect('outline', { color }, 'outline-color')}
          />
        </>
      )}
      <PreviewSwitch title="Shadow" isChecked={shadow.on} onChange={on => onEffect('shadow', { on })} />
      {shadow.on && (
        <>
          <PreviewSlider
            title="Shadow opacity"
            min={0}
            max={1}
            step={0.01}
            value={shadow.opacity}
            onChange={opacity => onEffect('shadow', { opacity }, 'shadow-opacity')}
          />
          <PreviewSlider
            title="Shadow blur"
            min={0}
            max={0.4}
            step={0.005}
            value={shadow.blur}
            onChange={blur => onEffect('shadow', { blur }, 'shadow-blur')}
          />
          <PreviewSlider
            title="Shadow distance"
            min={-0.3}
            max={0.3}
            step={0.005}
            value={shadow.y}
            onChange={y => onEffect('shadow', { y }, 'shadow-y')}
          />
          <PreviewColorPickerCustom
            title="Shadow color"
            color={shadow.color}
            alpha
            onChange={color => onEffect('shadow', { color }, 'shadow-color')}
          />
        </>
      )}
      <PreviewSwitch
        title="Glow"
        isChecked={glow.on}
        onChange={on =>
          onEffect('glow', on && glow.color === DEFAULT_EFFECTS.glow.color && accent ? { on, color: accent } : { on })
        }
      />
      {glow.on && (
        <>
          <PreviewSlider
            title="Glow strength"
            min={0}
            max={1.5}
            step={0.01}
            value={glow.intensity}
            onChange={intensity => onEffect('glow', { intensity }, 'glow-intensity')}
          />
          <PreviewSlider
            title="Glow size"
            min={0.01}
            max={0.5}
            step={0.005}
            value={glow.radius}
            onChange={radius => onEffect('glow', { radius }, 'glow-radius')}
          />
          <PreviewColorPickerCustom
            title="Glow color"
            color={glow.color}
            alpha
            onChange={color => onEffect('glow', { color }, 'glow-color')}
          />
        </>
      )}
      {bevel && <PreviewSwitch title="Bevel" isChecked={gloss.on} onChange={on => onEffect('gloss', { on })} />}
      {!bevel && surfaceNote && <p className="smg-note smg-full">{surfaceNote}</p>}
      {bevel && gloss.on && (
        <>
          <PreviewSlider
            title="Bevel size"
            min={0.02}
            max={0.5}
            step={0.005}
            value={gloss.bevel ?? 0.4}
            onChange={value => onEffect('gloss', { bevel: value }, 'gloss-bevel')}
          />
          <PreviewSlider
            title="Bend"
            min={0}
            max={3}
            step={0.05}
            value={gloss.bend ?? 2.5}
            onChange={bend => onEffect('gloss', { bend }, 'gloss-bend')}
          />
          <PreviewSlider
            title="Light"
            min={0}
            max={1}
            step={0.01}
            value={gloss.strength ?? 0.25}
            onChange={strength => onEffect('gloss', { strength }, 'gloss-strength')}
          />
          <PreviewSlider
            title="Light angle"
            min={0}
            max={360}
            step={1}
            valueUnit="°"
            value={gloss.angle ?? 225}
            onChange={angle => onEffect('gloss', { angle }, 'gloss-angle')}
          />
        </>
      )}
    </>
  );
}

export default function Inspector({ doc, selection, thumbs, history, actions, focusText }) {
  const [drag, setDrag] = useState(null);
  const [picking, setPicking] = useState(false);
  const scrollRef = useRef(null);
  const textRef = useRef(null);
  const edges = useScrollEdges(scrollRef, '.preview-options > *');
  const layers = doc.mark.layers;
  const chosen = layers.filter(layer => selection.includes(layer.id));
  const selectedIndex = chosen.length === 1 ? layers.indexOf(chosen[0]) : -1;
  const selected = selectedIndex >= 0 ? layers[selectedIndex] : null;
  const material = materialFor(doc);
  const commonOp = chosen.length > 1 && chosen.every(layer => layer.op === chosen[0].op) ? chosen[0].op : null;

  useEffect(() => {
    if (!focusText) return;
    const frame = requestAnimationFrame(() => {
      const input = textRef.current?.querySelector('input');
      if (!input) return;
      input.focus();
      input.select();
      input.closest('.lab-section')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [focusText]);

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
      const target = Math.max(0, Math.min(layers.length - 1, Math.round(index + (endEvent.clientY - startY) / ROW)));
      setDrag(null);
      if (target !== index) actions.moveLayer(id, target);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

  const background = doc.artboard.background;

  return (
    <aside className="lab-panel smg-panel" aria-label="Mark settings">
      <div
        className="lab-scroll-shell"
        data-top={edges.top ? '' : undefined}
        data-bottom={edges.bottom ? '' : undefined}
      >
        <div className="lab-scroll lab-panel-scroll" ref={scrollRef}>
          <Section
            title="Layers"
            actions={
              <>
                <HeadingButton
                  label="Undo"
                  hint="⌘Z"
                  icon={Undo02Icon}
                  onClick={history.undo}
                  disabled={!history.canUndo}
                />
                <HeadingButton
                  label="Redo"
                  hint="⇧⌘Z"
                  icon={Redo02Icon}
                  onClick={history.redo}
                  disabled={!history.canRedo}
                />
                <HeadingButton
                  label="Duplicate"
                  hint="⌘D"
                  icon={Copy01Icon}
                  onClick={actions.duplicateSelection}
                  disabled={!chosen.length}
                />
                <HeadingButton
                  label="Delete"
                  hint="⌫"
                  icon={Delete02Icon}
                  onClick={actions.removeSelection}
                  disabled={!chosen.length || chosen.length >= layers.length}
                />
              </>
            }
            className="smg-layers-section"
          >
            <div className="lab-layers smg-layers" role="listbox" aria-label="Shape layers">
              {[...layers].reverse().map(layer => {
                const index = layers.indexOf(layer);
                return (
                  <LayerRow
                    key={layer.id}
                    layer={layer}
                    index={index}
                    count={layers.length}
                    selected={selection.includes(layer.id)}
                    drag={drag}
                    thumb={thumbs[`shape:${layer.type}`]}
                    onSelect={actions.selectLayer}
                    onToggle={actions.toggleLayer}
                    onDragStart={startDrag}
                  />
                );
              })}
            </div>
            <div className="smg-add-row smg-full">
              <button
                type="button"
                className="docs-tool smg-add"
                onClick={() => setPicking(value => !value)}
                aria-expanded={picking}
              >
                <Icon icon={PlusSignIcon} size={15} />
                <span>Add shape</span>
              </button>
              {picking && (
                <ShapePicker
                  thumbs={thumbs}
                  onPick={type => {
                    setPicking(false);
                    actions.addShape(type);
                  }}
                  onText={() => {
                    setPicking(false);
                    actions.addText();
                  }}
                  onLogo={() => {
                    setPicking(false);
                    actions.upload();
                  }}
                  onClose={() => setPicking(false)}
                />
              )}
            </div>
          </Section>

          {chosen.length > 1 && (
            <Section title={`${chosen.length} layers`}>
              <ArrangeBar count={chosen.length} actions={actions} />
              {chosen.some(layer => layers.indexOf(layer) > 0) && (
                <div className="smg-full">
                  <Track
                    label="Combine"
                    value={commonOp}
                    options={OPS}
                    onChange={op => actions.setSelectionOp(op)}
                    className="smg-ops"
                  />
                </div>
              )}
            </Section>
          )}

          {selected && (
            <Section title={layerName(selected)}>
              <ArrangeBar count={1} actions={actions} />
              <LayerControls
                layer={selected}
                index={selectedIndex}
                textRef={textRef}
                onLayer={(patch, key) => actions.updateLayer(selected.id, patch, key)}
                onParam={(name, value) =>
                  actions.updateLayer(
                    selected.id,
                    layer => ({ params: { ...layer.params, [name]: value } }),
                    `param-${name}`
                  )
                }
                onText={(patch, key) =>
                  actions.updateLayer(
                    selected.id,
                    layer => ({ text: { ...layer.text, ...patch } }),
                    key ? `text-${key}` : undefined
                  )
                }
                onReplaceImage={actions.upload}
              />
            </Section>
          )}

          {material.kind === 'flat' && (
            <Section title="Fill">
              <FillControls
                fill={doc.fill}
                onFill={actions.setFill}
                hasLogo={layers.some(layer => layer.type === 'image')}
              />
            </Section>
          )}

          {material.kind === 'metal' && (
            <Section title="Liquid metal">
              <PropControls
                definitions={METAL_DEFINITIONS}
                props={material.props}
                onChange={(name, value) => actions.setMaterialProp(name, value)}
              />
            </Section>
          )}

          {material.kind === 'procedural' && (
            <Section title={material.def.name}>
              <PropControls
                definitions={material.def.params}
                props={{
                  ...Object.fromEntries(material.def.params.map(item => [item.name, item.default])),
                  ...material.props
                }}
                onChange={(name, value) => actions.setMaterialProp(name, value)}
              />
            </Section>
          )}

          {material.kind === 'background' && <BackgroundPresets material={material} onSelect={actions.applyLook} />}

          {material.kind === 'background' && (
            <Section title={material.entry.label}>
              <PreviewColorPickerCustom
                title="Base color"
                color={doc.material.base ?? '#0c0b10'}
                alpha
                onChange={base => actions.setMaterialBase(base)}
              />
              <PropControls
                definitions={material.entry.props}
                props={backgroundValues(material)}
                onChange={(name, value) => actions.setMaterialProp(name, value)}
              />
            </Section>
          )}

          <Section title="Effects">
            <EffectControls
              effects={doc.effects}
              accent={material.kind === 'flat' && doc.fill.kind !== 'logo' ? doc.fill.color1 : null}
              onEffect={actions.setEffect}
              bevel={material.kind !== 'metal' && !(material.kind === 'procedural' && material.def.kind !== 'fill')}
              surfaceNote={surfaceNote(material)}
            />
          </Section>

          <Section title="Artboard">
            <PreviewSlider
              title="Mark size"
              min={0.2}
              max={1.6}
              step={0.005}
              value={doc.mark.scale}
              onChange={scale => actions.setMark({ scale }, 'mark-scale')}
            />
            <PreviewSlider
              title="Mark rotation"
              min={-180}
              max={180}
              step={1}
              valueUnit="°"
              value={doc.mark.rotation}
              onChange={rotation => actions.setMark({ rotation }, 'mark-rotation')}
            />
            <PreviewSelect
              title="Shape"
              options={RATIOS.map(item => ({ value: item.value, label: item.label }))}
              value={doc.artboard.ratio}
              onChange={ratio => actions.setArtboard({ ratio })}
            />
            <div className="smg-full">
              <Track
                label="Background"
                value={background.kind}
                options={BACKGROUND_KINDS}
                onChange={kind => actions.setBackground({ kind })}
                className="smg-kinds"
              />
            </div>
            {background.kind !== 'none' && (
              <PreviewColorPickerCustom
                title={background.kind === 'linear' ? 'Top' : 'Background color'}
                color={background.color1}
                alpha
                onChange={color1 => actions.setBackground({ color1 }, 'bg-color1')}
              />
            )}
            {background.kind === 'linear' && (
              <PreviewColorPickerCustom
                title="Bottom"
                color={background.color2}
                alpha
                onChange={color2 => actions.setBackground({ color2 }, 'bg-color2')}
              />
            )}
          </Section>

          <Section title="Morph">
            <PreviewSwitch title="Morph" isChecked={doc.morph.on} onChange={on => actions.setMorph({ on })} />
            {doc.morph.on && material.kind === 'metal' && (
              <p className="smg-note smg-full">Liquid metal pauses while morph plays. It returns when morph is off.</p>
            )}
            {doc.morph.on && (
              <>
                <PreviewSelect
                  title="Into"
                  options={MARKS.map(mark => ({ value: mark.id, label: mark.name }))}
                  value={doc.morph.target?.preset || ''}
                  onChange={id => actions.setMorphTarget(id)}
                />
                <PreviewSlider
                  title="Morph time"
                  min={0.3}
                  max={4}
                  step={0.05}
                  valueUnit="s"
                  value={doc.morph.duration}
                  onChange={duration => actions.setMorph({ duration }, 'morph-duration')}
                />
                <PreviewSlider
                  title="Hold"
                  min={0}
                  max={3}
                  step={0.05}
                  valueUnit="s"
                  value={doc.morph.hold}
                  onChange={hold => actions.setMorph({ hold }, 'morph-hold')}
                />
              </>
            )}
          </Section>
        </div>
      </div>
    </aside>
  );
}
