import { Minus, Plus } from 'lucide-react';
import PreviewColorPickerCustom from './PreviewColorPickerCustom';
import '../../../css/preview-slider.css';

const FRESH = ['#40ffaa', '#4079ff', '#ffd93d', '#ff6b6b', '#06b6d4', '#f97316', '#ec4899', '#a3e635'];

export default function PreviewColorList({ title = 'Colors', colors, onChange, min = 2, max = 8 }) {
  const update = (index, value) => {
    const next = [...colors];
    next[index] = value;
    onChange(next);
  };

  const add = () => {
    if (colors.length >= max) return;
    const used = colors.map(color => color.toLowerCase());
    onChange([...colors, FRESH.find(color => !used.includes(color)) ?? colors[colors.length - 1]]);
  };

  const remove = () => {
    if (colors.length > min) onChange(colors.slice(0, -1));
  };

  return (
    <div className="scrubber-palette">
      <span className="scrubber-palette-label">{title}</span>
      <div className="scrubber-palette-swatches">
        {colors.map((color, index) => (
          <PreviewColorPickerCustom
            key={index}
            variant="swatch"
            title={`${title} ${index + 1}`}
            color={color}
            onChange={value => update(index, value)}
          />
        ))}
      </div>
      <div className="scrubber-palette-actions">
        <button
          type="button"
          className="scrubber-palette-button"
          onClick={remove}
          disabled={colors.length <= min}
          aria-label="Remove a color"
        >
          <Minus size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="scrubber-palette-button"
          onClick={add}
          disabled={colors.length >= max}
          aria-label="Add a color"
        >
          <Plus size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
