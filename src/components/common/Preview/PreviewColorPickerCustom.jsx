import { useRef, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../../../css/preview-slider.css';

function hsvToHex(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r, g, b;
  if (h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }
  const toHex = n =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHsv(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let hue = 0;
  if (d > 0) {
    if (max === r) hue = 60 * (((g - b) / d) % 6);
    else if (max === g) hue = 60 * ((b - r) / d + 2);
    else hue = 60 * ((r - g) / d + 4);
  }
  if (hue < 0) hue += 360;
  const sat = max === 0 ? 0 : d / max;
  return { h: hue, s: sat, v: max };
}

const SWATCH_PRESETS = [
  '#A855F7',
  '#7C3AED',
  '#6366F1',
  '#3B82F6',
  '#06B6D4',
  '#10B981',
  '#84CC16',
  '#EAB308',
  '#F97316',
  '#EF4444',
  '#EC4899',
  '#F43F5E',
  '#ffffff',
  '#94a3b8',
  '#000000'
];

export default function PreviewColorPickerCustom({ title, color, onChange, variant = 'row' }) {
  const [hsv, setHsv] = useState(() => {
    if (color && color.length >= 7) return hexToHsv(color);
    return { h: 270, s: 0.65, v: 0.97 };
  });
  const [textVal, setTextVal] = useState(color || '');
  const [open, setOpen] = useState(false);
  const [popoverRect, setPopoverRect] = useState(null);
  const areaRef = useRef(null);
  const hueRef = useRef(null);
  const wrapRef = useRef(null);
  const popoverRef = useRef(null);

  // Sync external color changes
  useEffect(() => {
    if (color && color.length >= 7) {
      const next = hexToHsv(color);
      setHsv(next);
      setTextVal(color);
    }
  }, [color]);

  const emitColor = useCallback(
    (h, s, v) => {
      const hex = hsvToHex(h, s, v);
      setTextVal(hex);
      onChange?.(hex);
    },
    [onChange]
  );

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = e => {
      const inTrigger = wrapRef.current && wrapRef.current.contains(e.target);
      const inPopover = popoverRef.current && popoverRef.current.contains(e.target);
      if (!inTrigger && !inPopover) setOpen(false);
    };
    document.addEventListener('pointerdown', onClick);
    return () => document.removeEventListener('pointerdown', onClick);
  }, [open]);

  // Position the portaled popover relative to the trigger, and keep it in sync
  // with scroll/resize so it never gets clipped by a scrollable ancestor.
  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      if (!wrapRef.current) return;
      setPopoverRect(wrapRef.current.getBoundingClientRect());
    };
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open]);

  // --- SV Area drag ---
  const dragArea = useCallback(
    e => {
      const rect = areaRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      const next = { ...hsv, s: x, v: 1 - y };
      setHsv(next);
      emitColor(next.h, next.s, next.v);
    },
    [hsv, emitColor]
  );

  const onAreaDown = useCallback(
    e => {
      e.preventDefault();
      dragArea(e);
      const onMove = ev => dragArea(ev);
      const onUp = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
      };
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    },
    [dragArea]
  );

  // --- Hue slider drag ---
  const dragHue = useCallback(
    e => {
      const rect = hueRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const next = { ...hsv, h: x * 360 };
      setHsv(next);
      emitColor(next.h, next.s, next.v);
    },
    [hsv, emitColor]
  );

  const onHueDown = useCallback(
    e => {
      e.preventDefault();
      dragHue(e);
      const onMove = ev => dragHue(ev);
      const onUp = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
      };
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    },
    [dragHue]
  );

  const handleTextChange = e => {
    const val = e.target.value;
    setTextVal(val);
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      const next = hexToHsv(val);
      setHsv(next);
      onChange?.(val);
    }
  };

  const currentHex = hsvToHex(hsv.h, hsv.s, hsv.v);
  const hueColor = hsvToHex(hsv.h, 1, 1);
  const chip = variant === 'swatch';
  const popoverWidth = chip ? 232 : popoverRect?.width;
  const popoverLeft = chip
    ? Math.min(Math.max(8, (popoverRect?.left ?? 0) + (popoverRect?.width ?? 0) / 2 - 116), window.innerWidth - 240)
    : popoverRect?.left;

  return (
    <div className={chip ? 'scrubber-chip-wrap' : 'scrubber'} ref={wrapRef} style={{ position: 'relative' }}>
      {chip ? (
        <button
          type="button"
          className="scrubber-color-chip"
          style={{ background: currentHex }}
          onClick={() => setOpen(o => !o)}
          aria-label={`${title}: ${currentHex}`}
          aria-expanded={open}
        />
      ) : (
        <div
          className="scrubber-track scrubber-track--color"
          onClick={() => setOpen(o => !o)}
          style={{ cursor: 'pointer' }}
        >
          <span className="scrubber-label">{title}</span>
          <div className="scrubber-color-controls">
            <span className="scrubber-color-swatch-preview" style={{ background: currentHex }} />
            <input
              className="scrubber-color-text"
              type="text"
              value={textVal}
              onChange={handleTextChange}
              onClick={e => e.stopPropagation()}
              maxLength={7}
              aria-label={`${title} hex value`}
            />
          </div>
        </div>
      )}
      {open &&
        popoverRect &&
        createPortal(
          <div
            ref={popoverRef}
            className="scrubber-popover"
            style={{
              position: 'fixed',
              top: popoverRect.bottom + 4,
              left: popoverLeft,
              width: popoverWidth,
              zIndex: 9999,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-sm)',
              padding: 12,
              boxShadow: 'var(--shadow-dropdown)'
            }}
          >
            {/* SV area */}
            <div
              ref={areaRef}
              onPointerDown={onAreaDown}
              style={{
                position: 'relative',
                width: '100%',
                height: 150,
                borderRadius: 8,
                cursor: 'crosshair',
                background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueColor})`,
                marginBottom: 10
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: `${hsv.s * 100}%`,
                  top: `${(1 - hsv.v) * 100}%`,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: '2px solid #fff',
                  boxShadow: '0 0 4px rgba(0,0,0,0.6)',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none'
                }}
              />
            </div>

            {/* Hue bar */}
            <div
              ref={hueRef}
              onPointerDown={onHueDown}
              style={{
                position: 'relative',
                width: '100%',
                height: 14,
                borderRadius: 7,
                cursor: 'pointer',
                background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
                marginBottom: 10
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: `${(hsv.h / 360) * 100}%`,
                  top: '50%',
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: '2px solid #fff',
                  boxShadow: '0 0 4px rgba(0,0,0,0.6)',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none'
                }}
              />
            </div>

            {/* Preset swatches */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SWATCH_PRESETS.map(c => (
                <button
                  key={c}
                  className="scrubber-preset-swatch"
                  onClick={() => {
                    const next = hexToHsv(c);
                    setHsv(next);
                    setTextVal(c);
                    onChange?.(c);
                  }}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    border:
                      currentHex.toLowerCase() === c.toLowerCase()
                        ? '2px solid #fff'
                        : '1px solid var(--border-primary)',
                    background: c,
                    cursor: 'pointer',
                    padding: 0
                  }}
                />
              ))}
            </div>
            {chip ? (
              <input
                className="scrubber-color-text"
                type="text"
                value={textVal}
                onChange={handleTextChange}
                maxLength={7}
                aria-label={`${title} hex value`}
                style={{ width: '100%', marginTop: 10 }}
              />
            ) : null}
          </div>,
          document.body
        )}
    </div>
  );
}
