const PresetTile = ({ option, active, colors, onSelect }) => (
  <button type="button" className="bs-preset" aria-pressed={active} onClick={() => onSelect(option.value)}>
    {colors.length > 0 && (
      <span className="bs-swatches" aria-hidden="true">
        {colors.map(color => (
          <i key={color} style={{ background: color }} />
        ))}
      </span>
    )}
    <span className="bs-preset-label">{option.label}</span>
  </button>
);

export default PresetTile;
