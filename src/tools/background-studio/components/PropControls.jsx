import PreviewSlider from '../../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../../components/common/Preview/PreviewSelect';
import PreviewInput from '../../../components/common/Preview/PreviewInput';
import PreviewColorList from '../../../components/common/Preview/PreviewColorList';
import PreviewColorPickerCustom from '../../../components/common/Preview/PreviewColorPickerCustom';

const toHex = channel =>
  Math.round(Math.max(0, Math.min(1, channel)) * 255)
    .toString(16)
    .padStart(2, '0');

const rgbToHex = rgb => `#${rgb.map(toHex).join('')}`;

const hexToRgb = hex => {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return match ? match.slice(1).map(part => parseInt(part, 16) / 255) : [0.5, 0.5, 0.5];
};

const PropControl = ({ definition, value, onChange }) => {
  const { name, label, type } = definition;
  const set = next => onChange(name, next);

  switch (type) {
    case 'number':
      return (
        <PreviewSlider
          title={label}
          min={definition.min ?? 0}
          max={definition.max ?? 100}
          step={definition.step ?? 1}
          value={Number(value) || 0}
          onChange={set}
        />
      );
    case 'boolean':
      return <PreviewSwitch title={label} isChecked={Boolean(value)} onChange={set} />;
    case 'color':
      return <PreviewColorPickerCustom title={label} color={value} onChange={set} />;
    case 'colorArray':
      return (
        <PreviewColorList
          title={label}
          colors={Array.isArray(value) ? value : [value]}
          min={definition.minItems ?? 1}
          max={definition.maxItems ?? 5}
          onChange={set}
        />
      );
    case 'select':
      return <PreviewSelect title={label} options={definition.options || []} value={value} onChange={set} />;
    case 'rgbArray':
      return (
        <PreviewColorPickerCustom
          title={label}
          color={rgbToHex(Array.isArray(value) ? value : [0.5, 0.5, 0.5])}
          onChange={hex => set(hexToRgb(hex))}
        />
      );
    case 'text':
      return <PreviewInput title={label} value={value ?? ''} onChange={set} />;
    default:
      return null;
  }
};

export default function PropControls({ definitions, props, onChange }) {
  return definitions.map(definition => (
    <PropControl key={definition.name} definition={definition} value={props[definition.name]} onChange={onChange} />
  ));
}
