import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { ColorPickerIcon, Copy01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { formatColor, hsvaToRgba, parseColor, rgbaToHsva, toHex } from './colorMath';
import '../../../css/preview-slider.css';
import '../../../css/color-picker.css';

const SWATCHES = [
  '#a855f7',
  '#7c3aed',
  '#6366f1',
  '#3b82f6',
  '#06b6d4',
  '#10b981',
  '#84cc16',
  '#eab308',
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#f43f5e',
  '#ffffff',
  '#94a3b8',
  '#000000'
];

const FORMATS = ['hex', 'rgb', 'hsl'];
const FORMAT_LABELS = { hex: 'Hex', rgb: 'RGB', hsl: 'HSL' };
const RECENT_KEY = 'rb-color-recent';
const RECENT_MAX = 10;
const FALLBACK = { h: 270, s: 0.65, v: 0.97, a: 1 };
const GAP = 6;
const MARGIN = 8;

let sharedFormat = 'hex';

const readRecent = () => {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(list) ? list.filter(item => typeof item === 'string').slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
};

const writeRecent = value => {
  try {
    const next = [value, ...readRecent().filter(item => item !== value)].slice(0, RECENT_MAX);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    return;
  }
};

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
const round = value => Math.round(value * 1000) / 1000;

const toState = (color, previous) => {
  const rgba = parseColor(color);
  return rgba ? rgbaToHsva(rgba, previous) : previous || FALLBACK;
};

const outputOf = (hsva, alpha) => toHex(hsvaToRgba(hsva), alpha);

const useDrag = (ref, onValue) => {
  const active = useRef(false);
  const read = event => {
    const rect = ref.current.getBoundingClientRect();
    return {
      x: clamp((event.clientX - rect.left) / Math.max(rect.width, 1)),
      y: clamp((event.clientY - rect.top) / Math.max(rect.height, 1))
    };
  };
  return {
    onPointerDown: event => {
      if (event.button !== 0) return;
      event.preventDefault();
      active.current = true;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        active.current = true;
      }
      event.currentTarget.focus({ preventScroll: true });
      onValue(read(event));
    },
    onPointerMove: event => {
      if (active.current) onValue(read(event));
    },
    onPointerUp: () => {
      active.current = false;
    },
    onPointerCancel: () => {
      active.current = false;
    },
    onLostPointerCapture: () => {
      active.current = false;
    }
  };
};

const stepFor = event => (event.shiftKey ? 10 : 1);

function ChannelInput({ label, value, min, max, onCommit, suffix }) {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);
  const commit = text => {
    const parsed = parseFloat(text);
    if (Number.isFinite(parsed)) onCommit(clamp(parsed, min, max));
    else setDraft(String(value));
  };
  return (
    <label className="cp-channel">
      <input
        className="cp-input cp-input--number"
        inputMode="decimal"
        value={draft}
        aria-label={label}
        onFocus={event => {
          setFocused(true);
          event.target.select();
        }}
        onChange={event => setDraft(event.target.value)}
        onBlur={() => {
          setFocused(false);
          commit(draft);
        }}
        onKeyDown={event => {
          if (event.key === 'Enter') {
            commit(draft);
            event.currentTarget.select();
          } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
            const delta = (event.key === 'ArrowUp' ? 1 : -1) * stepFor(event);
            const next = clamp((parseFloat(draft) || 0) + delta, min, max);
            setDraft(String(next));
            onCommit(next);
          }
        }}
      />
      <span className="cp-channel-label">
        {label}
        {suffix}
      </span>
    </label>
  );
}

export default function PreviewColorPickerCustom({ title, color, onChange, variant = 'row', alpha = false }) {
  const [hsva, setHsva] = useState(() => toState(color, null));
  const [open, setOpen] = useState(false);
  const [format, setFormatState] = useState(sharedFormat);
  const [anchor, setAnchor] = useState(null);
  const [placement, setPlacement] = useState('below');
  const [rowText, setRowText] = useState(null);
  const [hexText, setHexText] = useState(null);
  const [copied, setCopied] = useState(false);
  const [recent, setRecent] = useState(readRecent);
  const hsvaRef = useRef(hsva);
  const emitted = useRef(null);
  const onChangeRef = useRef(onChange);
  const openedWith = useRef(null);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const areaRef = useRef(null);
  const hueRef = useRef(null);
  const alphaRef = useRef(null);
  hsvaRef.current = hsva;
  onChangeRef.current = onChange;

  const hasDropper = typeof window !== 'undefined' && 'EyeDropper' in window;
  const output = outputOf(hsva, alpha);
  const rgba = hsvaToRgba(hsva);
  const opaque = toHex({ ...rgba, a: 1 });
  const hueColor = toHex(hsvaToRgba({ h: hsva.h, s: 1, v: 1, a: 1 }));

  useEffect(() => {
    if (color === undefined || color === null) return;
    const incoming = parseColor(color);
    if (!incoming) return;
    if (emitted.current && toHex(incoming, alpha) === emitted.current) return;
    emitted.current = null;
    setHsva(previous => rgbaToHsva(incoming, previous));
  }, [color, alpha]);

  const commit = useCallback(
    next => {
      const value = {
        h: clamp(next.h, 0, 360),
        s: clamp(next.s),
        v: clamp(next.v),
        a: alpha ? clamp(next.a) : 1
      };
      hsvaRef.current = value;
      setHsva(value);
      const hex = outputOf(value, alpha);
      if (hex === emitted.current) return;
      emitted.current = hex;
      onChangeRef.current?.(hex);
    },
    [alpha]
  );

  const commitColor = useCallback(
    rgbaColor => commit(rgbaToHsva({ ...rgbaColor, a: alpha ? rgbaColor.a : 1 }, hsvaRef.current)),
    [alpha, commit]
  );

  const setFormat = value => {
    sharedFormat = value;
    setFormatState(value);
  };

  const close = useCallback((focusTrigger = false) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (open) {
      openedWith.current = outputOf(hsvaRef.current, alpha);
      setRecent(readRecent());
      return undefined;
    }
    if (openedWith.current && openedWith.current !== outputOf(hsvaRef.current, alpha)) {
      writeRecent(outputOf(hsvaRef.current, alpha));
    }
    openedWith.current = null;
    return undefined;
  }, [open, alpha]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = event => {
      if (wrapRef.current?.contains(event.target) || popoverRef.current?.contains(event.target)) return;
      close();
    };
    const onKey = event => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close(true);
      }
    };
    const update = () => {
      if (wrapRef.current) setAnchor(wrapRef.current.getBoundingClientRect());
    };
    update();
    document.addEventListener('pointerdown', onPointer, true);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      document.removeEventListener('pointerdown', onPointer, true);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, close]);

  useLayoutEffect(() => {
    if (!open || !anchor || !popoverRef.current) return;
    const height = popoverRef.current.offsetHeight;
    const below = window.innerHeight - anchor.bottom - GAP - MARGIN;
    const above = anchor.top - GAP - MARGIN;
    setPlacement(height > below && above > below ? 'above' : 'below');
  }, [open, anchor, format, alpha, recent.length]);

  const areaDrag = useDrag(areaRef, ({ x, y }) => commit({ ...hsvaRef.current, s: x, v: 1 - y }));
  const hueDrag = useDrag(hueRef, ({ x }) => commit({ ...hsvaRef.current, h: x * 360 }));
  const alphaDrag = useDrag(alphaRef, ({ x }) => commit({ ...hsvaRef.current, a: x }));

  const onAreaKey = event => {
    const step = stepFor(event) / 100;
    const moves = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step]
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    commit({ ...hsvaRef.current, s: hsvaRef.current.s + move[0], v: hsvaRef.current.v + move[1] });
  };

  const onSliderKey = (event, key, scale) => {
    const delta = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[event.key];
    if (delta === undefined && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const current = hsvaRef.current[key];
    const next =
      event.key === 'Home' ? 0 : event.key === 'End' ? scale : current + (delta * stepFor(event) * scale) / 100;
    commit({ ...hsvaRef.current, [key]: key === 'h' ? clamp(next, 0, 360) : clamp(next) });
  };

  const pick = async () => {
    try {
      const result = await new window.EyeDropper().open();
      const picked = parseColor(result.sRGBHex);
      if (picked) commitColor({ ...picked, a: hsvaRef.current.a });
    } catch {
      return;
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(formatColor(hsvaRef.current, format, alpha));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const applyText = (text, revert) => {
    const parsed = parseColor(text);
    if (parsed) commitColor(parsed);
    revert();
  };

  const chip = variant === 'swatch';
  const width = chip ? 260 : clamp(anchor?.width ?? 260, 260, 320);
  const left = anchor
    ? clamp(chip ? anchor.left + anchor.width / 2 - width / 2 : anchor.left, MARGIN, window.innerWidth - width - MARGIN)
    : 0;
  const top = anchor ? (placement === 'below' ? anchor.bottom + GAP : anchor.top - GAP) : 0;
  const hsl = (() => {
    const max = Math.max(rgba.r, rgba.g, rgba.b);
    const min = Math.min(rgba.r, rgba.g, rgba.b);
    const l = (max + min) / 2;
    const d = max - min;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    return { h: Math.round(hsva.h), s: Math.round(clamp(s) * 100), l: Math.round(l * 100) };
  })();
  const checker = alpha && hsva.a < 1;
  const swatchStyle = { '--cp-color': output };

  return (
    <div className={chip ? 'scrubber-chip-wrap' : 'scrubber'} ref={wrapRef}>
      {chip ? (
        <button
          type="button"
          ref={triggerRef}
          className="scrubber-color-chip cp-chip"
          data-checker={checker || undefined}
          style={swatchStyle}
          onClick={() => setOpen(value => !value)}
          aria-label={`${title}: ${output}`}
          aria-haspopup="dialog"
          aria-expanded={open}
        />
      ) : (
        <div className="scrubber-track scrubber-track--color cp-row">
          <button
            type="button"
            ref={triggerRef}
            className="cp-row-trigger"
            onClick={() => setOpen(value => !value)}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={`${title}: ${output}`}
          >
            <span className="scrubber-label">{title}</span>
          </button>
          <div className="scrubber-color-controls">
            <button
              type="button"
              className="scrubber-color-swatch-preview cp-preview"
              data-checker={checker || undefined}
              style={swatchStyle}
              tabIndex={-1}
              aria-hidden="true"
              onClick={() => setOpen(value => !value)}
            />
            <input
              className="scrubber-color-text cp-row-input"
              type="text"
              value={rowText ?? output}
              spellCheck={false}
              autoComplete="off"
              aria-label={`${title} value`}
              onFocus={event => {
                setRowText(output);
                event.target.select();
              }}
              onChange={event => setRowText(event.target.value)}
              onBlur={() => applyText(rowText ?? output, () => setRowText(null))}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  applyText(rowText ?? output, () => setRowText(outputOf(hsvaRef.current, alpha)));
                  event.currentTarget.select();
                } else if (event.key === 'Escape') {
                  setRowText(null);
                  event.currentTarget.blur();
                }
              }}
            />
          </div>
        </div>
      )}
      {open &&
        anchor &&
        createPortal(
          <div
            ref={popoverRef}
            className="cp-popover"
            role="dialog"
            aria-label={`${title} color`}
            data-placement={placement}
            style={{ left, width, top, '--cp-hue': hueColor, '--cp-opaque': opaque }}
          >
            <div
              ref={areaRef}
              className="cp-area"
              role="slider"
              tabIndex={0}
              aria-label="Saturation and brightness"
              aria-valuetext={`Saturation ${Math.round(hsva.s * 100)}%, brightness ${Math.round(hsva.v * 100)}%`}
              onKeyDown={onAreaKey}
              {...areaDrag}
            >
              <span
                className="cp-area-thumb"
                style={{ left: `${hsva.s * 100}%`, top: `${(1 - hsva.v) * 100}%`, background: opaque }}
              />
            </div>

            <div className="cp-sliders">
              {hasDropper && (
                <button
                  type="button"
                  className="cp-icon-button"
                  aria-label="Pick a color from the screen"
                  onClick={pick}
                >
                  <HugeiconsIcon icon={ColorPickerIcon} size={16} strokeWidth={1.6} aria-hidden="true" />
                </button>
              )}
              <div className="cp-slider-stack">
                <div
                  ref={hueRef}
                  className="cp-slider cp-slider--hue"
                  role="slider"
                  tabIndex={0}
                  aria-label="Hue"
                  aria-valuemin={0}
                  aria-valuemax={360}
                  aria-valuenow={Math.round(hsva.h)}
                  onKeyDown={event => onSliderKey(event, 'h', 360)}
                  {...hueDrag}
                >
                  <span
                    className="cp-slider-thumb"
                    style={{ left: `${(hsva.h / 360) * 100}%`, background: hueColor }}
                  />
                </div>
                {alpha && (
                  <div
                    ref={alphaRef}
                    className="cp-slider cp-slider--alpha"
                    role="slider"
                    tabIndex={0}
                    aria-label="Opacity"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(hsva.a * 100)}
                    onKeyDown={event => onSliderKey(event, 'a', 1)}
                    {...alphaDrag}
                  >
                    <span className="cp-slider-fill" />
                    <span className="cp-slider-thumb" style={{ left: `${hsva.a * 100}%`, '--cp-thumb': output }} />
                  </div>
                )}
              </div>
            </div>

            <div className="cp-fields">
              <button
                type="button"
                className="cp-format"
                aria-label={`Color format: ${FORMAT_LABELS[format]}. Change format`}
                onClick={() => setFormat(FORMATS[(FORMATS.indexOf(format) + 1) % FORMATS.length])}
              >
                {FORMAT_LABELS[format]}
              </button>
              {format === 'hex' && (
                <label className="cp-channel cp-channel--wide">
                  <input
                    className="cp-input"
                    value={hexText ?? toHex(rgba, false)}
                    spellCheck={false}
                    autoComplete="off"
                    aria-label="Hex"
                    onFocus={event => {
                      setHexText(toHex(rgba, false));
                      event.target.select();
                    }}
                    onChange={event => setHexText(event.target.value)}
                    onBlur={() => applyText(hexText ?? '', () => setHexText(null))}
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        applyText(hexText ?? '', () => setHexText(toHex(hsvaToRgba(hsvaRef.current), false)));
                        event.currentTarget.select();
                      }
                    }}
                  />
                  <span className="cp-channel-label">Hex</span>
                </label>
              )}
              {format === 'rgb' &&
                ['r', 'g', 'b'].map(key => (
                  <ChannelInput
                    key={key}
                    label={key.toUpperCase()}
                    value={Math.round(rgba[key] * 255)}
                    min={0}
                    max={255}
                    onCommit={next => commitColor({ ...rgba, [key]: next / 255 })}
                  />
                ))}
              {format === 'hsl' && (
                <>
                  <ChannelInput
                    label="H"
                    value={hsl.h}
                    min={0}
                    max={360}
                    onCommit={next => commit({ ...hsvaRef.current, h: next })}
                  />
                  <ChannelInput
                    label="S"
                    value={hsl.s}
                    min={0}
                    max={100}
                    onCommit={next =>
                      commitColor({
                        ...(parseColor(`hsl(${hsl.h}, ${next}%, ${hsl.l}%)`) || rgba),
                        a: hsvaRef.current.a
                      })
                    }
                  />
                  <ChannelInput
                    label="L"
                    value={hsl.l}
                    min={0}
                    max={100}
                    onCommit={next =>
                      commitColor({
                        ...(parseColor(`hsl(${hsl.h}, ${hsl.s}%, ${next}%)`) || rgba),
                        a: hsvaRef.current.a
                      })
                    }
                  />
                </>
              )}
              {alpha && (
                <ChannelInput
                  label="A"
                  suffix=" %"
                  value={Math.round(hsva.a * 100)}
                  min={0}
                  max={100}
                  onCommit={next => commit({ ...hsvaRef.current, a: round(next / 100) })}
                />
              )}
              <button
                type="button"
                className="cp-icon-button"
                aria-label={copied ? 'Copied' : 'Copy color'}
                onClick={copy}
              >
                <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={15} strokeWidth={1.6} aria-hidden="true" />
              </button>
            </div>

            <div className="cp-swatches" role="group" aria-label="Swatches">
              {SWATCHES.map(swatch => (
                <button
                  key={swatch}
                  type="button"
                  className="cp-swatch"
                  style={{ '--cp-color': swatch }}
                  aria-label={swatch}
                  aria-pressed={toHex(rgba, false) === swatch}
                  onClick={() => commitColor({ ...parseColor(swatch), a: hsvaRef.current.a })}
                />
              ))}
            </div>

            {recent.length > 0 && (
              <div className="cp-recent">
                <span className="cp-recent-label">Recent</span>
                <div className="cp-swatches" role="group" aria-label="Recent colors">
                  {recent.map(item => (
                    <button
                      key={item}
                      type="button"
                      className="cp-swatch"
                      data-checker={item.length > 7 || undefined}
                      style={{ '--cp-color': item }}
                      aria-label={item}
                      aria-pressed={output === item}
                      onClick={() => {
                        const parsed = parseColor(item);
                        if (parsed) commitColor(parsed);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
