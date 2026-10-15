import PreviewSlider from '../../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../../components/common/Preview/PreviewSelect';
import PreviewInput from '../../../components/common/Preview/PreviewInput';
import PreviewColorList from '../../../components/common/Preview/PreviewColorList';
import PreviewColorPickerCustom from '../../../components/common/Preview/PreviewColorPickerCustom';
import { BLEND_MODES } from '../engine/engine';

const BLEND_LABELS = {
  normal: 'Normal',
  screen: 'Screen',
  multiply: 'Multiply',
  overlay: 'Overlay',
  'soft-light': 'Soft light',
  add: 'Add',
  difference: 'Difference',
  lighten: 'Lighten',
  darken: 'Darken'
};

const BLEND_OPTIONS = BLEND_MODES.map(value => ({ value, label: BLEND_LABELS[value] }));

export const Control = ({ param, value, onChange }) => {
  switch (param.type) {
    case 'number':
      return (
        <PreviewSlider
          title={param.label}
          min={param.min}
          max={param.max}
          step={param.step}
          value={Number(value) || 0}
          onChange={next => onChange(param.key, next)}
        />
      );
    case 'boolean':
      return (
        <PreviewSwitch title={param.label} isChecked={Boolean(value)} onChange={next => onChange(param.key, next)} />
      );
    case 'select':
      return (
        <PreviewSelect
          title={param.label}
          options={param.options}
          value={value}
          onChange={next => onChange(param.key, next)}
        />
      );
    case 'color':
      return (
        <PreviewColorPickerCustom title={param.label} color={value} onChange={next => onChange(param.key, next)} />
      );
    case 'colors':
      return (
        <PreviewColorList
          title={param.label}
          colors={Array.isArray(value) ? value : []}
          min={param.min ?? 2}
          max={param.max ?? 8}
          onChange={next => onChange(param.key, next)}
        />
      );
    case 'text':
      return <PreviewInput title={param.label} value={value ?? ''} onChange={next => onChange(param.key, next)} />;
    default:
      return null;
  }
};

export default function ParamControls({ effect, layer, onParam, onLayer }) {
  const visible = effect.params.filter(param => !param.when || param.when(layer.params));
  return (
    <>
      <PreviewSlider
        title="Mix"
        min={0}
        max={100}
        step={1}
        value={Math.round(layer.mix * 100)}
        valueUnit="%"
        onChange={next => onLayer({ mix: next / 100 }, 'mix')}
      />
      <PreviewSelect
        title="Blend"
        options={BLEND_OPTIONS}
        value={layer.blend}
        onChange={next => onLayer({ blend: next })}
      />
      {visible.map(param => (
        <Control key={param.key} param={param} value={layer.params[param.key]} onChange={onParam} />
      ))}
    </>
  );
}
