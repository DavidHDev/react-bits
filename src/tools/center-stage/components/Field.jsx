import { useEffect, useMemo, useRef, useState } from 'react';
import PreviewSlider from '../../../components/common/Preview/PreviewSlider';
import PreviewSelect from '../../../components/common/Preview/PreviewSelect';
import PreviewSwitch from '../../../components/common/Preview/PreviewSwitch';
import PreviewInput from '../../../components/common/Preview/PreviewInput';
import PreviewColorPickerCustom from '../../../components/common/Preview/PreviewColorPickerCustom';
import { Track } from '../../background-studio/components/ui';
import PropControls from '../../background-studio/components/PropControls';
import { getPath } from '../state/useShot';
import { MOTION_GROUPS } from '../engine/scene';
import { DEFAULT_BACKDROP, backdropControls, backdropIsLight, backdropPresets, backdropProps } from '../backdrop';

export const Choice = ({ title, value, options, onChange }) => (
  <div className="scrubber">
    <div className="scrubber-track bs-choice">
      <span className="bs-choice-label">{title}</span>
      <Track label={title} value={value} options={options} onChange={onChange} />
    </div>
  </div>
);

function TextArea({ title, value, onChange, placeholder }) {
  const ref = useRef(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.style.height = '0px';
    element.style.height = `${Math.min(element.scrollHeight, 120)}px`;
  }, [value]);
  return (
    <div className="scrubber">
      <label className="scrubber-track scrubber-track--input cst-textarea">
        <span className="scrubber-label">{title}</span>
        <textarea
          ref={ref}
          className="scrubber-input"
          rows={1}
          value={value}
          placeholder={placeholder}
          spellCheck={false}
          onChange={event => onChange(event.target.value)}
          aria-label={title}
        />
      </label>
    </div>
  );
}

function Swatches({ title, value, options, custom, onPick, onCustom }) {
  const active = custom || options.find(option => option.value === value)?.hex;
  return (
    <div className="cst-swatches">
      <div className="cst-swatches-head">
        <span>{title}</span>
        <em>{custom ? 'Custom' : options.find(option => option.value === value)?.label}</em>
      </div>
      <div className="cst-swatch-row" role="radiogroup" aria-label={title}>
        {options.map(option => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={!custom && option.value === value}
            aria-label={option.label}
            title={option.label}
            className="cst-swatch"
            style={{ '--swatch': option.hex }}
            onClick={() => onPick(option.value)}
          />
        ))}
        <span className="cst-swatch-custom">
          <PreviewColorPickerCustom title="Custom" color={active || '#888888'} onChange={onCustom} variant="swatch" />
        </span>
      </div>
    </div>
  );
}

function ChipRow({ title, value, options, onChange }) {
  return (
    <div className="cst-chips" role="radiogroup" aria-label={title}>
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          className="cst-chip"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Chips({ title, value, options, onChange }) {
  return (
    <div className="cst-chips-field">
      <span className="cst-chips-title">{title}</span>
      <ChipRow title={title} value={value} options={options} onChange={onChange} />
    </div>
  );
}

function MotionPicker({ value, options, onChange }) {
  return (
    <div className="cst-chips-field cst-motion">
      {MOTION_GROUPS.map(group => {
        const items = options.filter(option => option.group === group.id);
        if (!items.length) return null;
        return (
          <div key={group.id} className="cst-motion-group">
            <span className="cst-chips-title">{group.label}</span>
            <ChipRow title={group.label} value={value} options={items} onChange={onChange} />
          </div>
        );
      })}
    </div>
  );
}

function BackdropPicker({ value, options, light, onChange }) {
  return (
    <div className="cst-chips-field cst-backdrops">
      <div className="cst-backdrop-grid" role="radiogroup" aria-label="React Bits backgrounds">
        {options.map(option => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            className="cst-backdrop"
            title={option.label}
            onClick={() => onChange(option.value)}
          >
            <img src={light ? option.thumbLight : option.thumb} alt="" loading="lazy" draggable={false} />
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function BackdropLooks({ component, value, onChange }) {
  const [options, setOptions] = useState([]);
  useEffect(() => {
    let alive = true;
    backdropPresets(component).then(list => {
      if (alive) setOptions(list);
    });
    return () => {
      alive = false;
    };
  }, [component]);
  if (!options.length) return null;
  return (
    <Chips
      title="Look"
      value={value || 'default'}
      options={[{ value: 'default', label: 'Default' }, ...options]}
      onChange={next => onChange(next === 'default' ? undefined : next)}
    />
  );
}

function BackdropProps({ doc, onSet }) {
  const background = doc.background || {};
  const component = background.component || DEFAULT_BACKDROP;
  const { definitions, ownBackground } = useMemo(() => backdropControls(component), [component]);
  const [resolved, setResolved] = useState(null);
  const latest = useRef(background);
  latest.current = background;
  const key = JSON.stringify([
    component,
    background.preset || null,
    background.props || null,
    backdropIsLight(background)
  ]);
  useEffect(() => {
    let alive = true;
    backdropProps(latest.current).then(result => {
      if (alive) setResolved(result?.props || null);
    });
    return () => {
      alive = false;
    };
  }, [key]);
  if (!resolved) return null;
  return (
    <>
      {!ownBackground && (
        <PreviewColorPickerCustom
          title="Background"
          color={background.colors?.[0] || '#000000'}
          onChange={next => onSet('background.colors.0', next, 'background.colors.0')}
        />
      )}
      <PropControls
        definitions={definitions}
        props={resolved}
        onChange={(name, next) => onSet(`background.props.${name}`, next, `background.props.${name}`)}
      />
    </>
  );
}

const format = (control, value) => {
  if (control.percent) return `${Math.round(value * 100)}%`;
  const decimals = control.step >= 1 ? 0 : control.step >= 0.1 ? 1 : 2;
  return `${Number(value.toFixed(decimals))}${control.unit || ''}`;
};

export default function Field({ control, doc, onSet, value: override }) {
  const raw = override !== undefined ? override : getPath(doc, control.path);
  const value = raw === undefined || raw === null ? control.fallback : raw;
  const set = next =>
    control.clear
      ? onSet({ [control.path]: next, [control.clear]: undefined }, undefined, control.key || control.path)
      : onSet(control.path, next, control.key || control.path);
  switch (control.type) {
    case 'number':
      return (
        <PreviewSlider
          title={control.label}
          min={control.min}
          max={control.max}
          step={control.step}
          value={Number(value) || 0}
          displayValue={next => format(control, next)}
          onChange={set}
        />
      );
    case 'select':
      return <PreviewSelect title={control.label} options={control.options} value={value} onChange={set} />;
    case 'choice':
      return <Choice title={control.label} value={value} options={control.options} onChange={set} />;
    case 'chips':
      return <Chips title={control.label} value={value} options={control.options} onChange={set} />;
    case 'motion':
      return <MotionPicker value={value} options={control.options} onChange={set} />;
    case 'backdrop':
      return (
        <BackdropPicker
          value={value}
          options={control.options}
          light={backdropIsLight(doc.background)}
          onChange={next =>
            onSet(
              { [control.path]: next, 'background.preset': undefined, 'background.props': undefined },
              undefined,
              control.key
            )
          }
        />
      );
    case 'backdropPreset':
      return (
        <BackdropLooks
          component={getPath(doc, 'background.component') || DEFAULT_BACKDROP}
          value={value}
          onChange={next =>
            onSet({ [control.path]: next, 'background.props': undefined }, undefined, control.key || control.path)
          }
        />
      );
    case 'backdropProps':
      return <BackdropProps doc={doc} onSet={onSet} />;
    case 'switch':
      return <PreviewSwitch title={control.label} isChecked={Boolean(value)} onChange={set} />;
    case 'color': {
      const color = value === 'auto' || !value ? control.autoColor || '#ffffff' : value;
      return <PreviewColorPickerCustom title={control.label} color={color} onChange={set} />;
    }
    case 'text':
      return control.multiline ? (
        <TextArea title={control.label} value={value ?? ''} placeholder={control.placeholder} onChange={set} />
      ) : (
        <PreviewInput title={control.label} value={value ?? ''} placeholder={control.placeholder} onChange={set} />
      );
    case 'swatches':
      return (
        <Swatches
          title={control.label}
          value={value}
          options={control.options}
          custom={getPath(doc, control.custom)}
          onPick={next => onSet({ [control.path]: next, [control.custom]: undefined })}
          onCustom={next => onSet(control.custom, next, control.custom)}
        />
      );
    default:
      return null;
  }
}
