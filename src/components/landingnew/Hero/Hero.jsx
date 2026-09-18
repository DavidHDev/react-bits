import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import DotField from './DotField';
import HeroBand from './HeroBand';
import { FaArrowRight } from 'react-icons/fa6';
import { LuRotateCcw, LuMoveHorizontal } from 'react-icons/lu';
import { useStars } from '@/hooks/useStars';
import { COMPONENT_COUNT } from '@/constants/Categories';
import { useColorMode } from '../../setup/color-mode';
import './Hero.css';

/* ── Color conversion helpers ── */

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
  const toH = n =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toH(r)}${toH(g)}${toH(b)}`;
}

function hexToHsv(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min;
  let hue = 0;
  if (d > 0) {
    if (max === r) hue = 60 * (((g - b) / d) % 6);
    else if (max === g) hue = 60 * ((b - r) / d + 2);
    else hue = 60 * ((r - g) / d + 4);
  }
  if (hue < 0) hue += 360;
  return { h: hue, s: max === 0 ? 0 : d / max, v: max };
}

function parseHexRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

const SNIPPET_DEFS = [
  {
    label: 'ColorBends',
    component: 'ColorBends',
    props: [
      { name: 'color', type: 'color', default: '#A855F7' },
      { name: 'speed', type: 'number', default: 0.2, min: 0.1, max: 1, step: 0.1 },
      { name: 'frequency', type: 'number', default: 1, min: 1, max: 3, step: 0.1 },
      { name: 'noise', type: 'number', default: 0.15, min: 0, max: 0.9, step: 0.01 },
      { name: 'bandWidth', type: 'number', default: 0.14, min: 0.1, max: 1, step: 0.01 },
      { name: 'rotation', type: 'number', default: 90, min: 0, max: 360, step: 1 },
      { name: 'fadeTop', type: 'number', default: 0.75, min: 0.4, max: 1, step: 0.05 },
      { name: 'iterations', type: 'number', default: 1, min: 1, max: 2, step: 1 },
      { name: 'intensity', type: 'number', default: 1.25, min: 0.1, max: 2, step: 0.1 }
    ]
  },
  {
    label: 'DotField',
    component: 'DotField',
    props: [
      { name: 'dotRadius', type: 'number', default: 1.5, min: 1, max: 3, step: 0.1 },
      { name: 'dotSpacing', type: 'number', default: 14, min: 10, max: 40, step: 1 },
      { name: 'cursorRadius', type: 'number', default: 500, min: 50, max: 1000, step: 10 },
      { name: 'cursorForce', type: 'number', default: 0.1, min: 0, max: 1, step: 0.01 },
      { name: 'bulgeOnly', type: 'boolean', default: true },
      { name: 'bulgeStrength', type: 'number', default: 67, min: 1, max: 200, step: 1 },
      { name: 'glowRadius', type: 'number', default: 160, min: 50, max: 500, step: 10 },
      { name: 'sparkle', type: 'boolean', default: false },
      { name: 'waveAmplitude', type: 'number', default: 0, min: 0, max: 20, step: 1 }
    ]
  }
];

const SCENE_PRESETS = [
  {
    label: 'Nebula',
    values: [
      {
        color: '#A855F7',
        speed: 0.2,
        frequency: 1,
        noise: 0.15,
        bandWidth: 0.14,
        rotation: 90,
        fadeTop: 0.75,
        iterations: 1,
        intensity: 1.25
      },
      {
        cursorRadius: 500,
        cursorForce: 0.1,
        bulgeOnly: true,
        bulgeStrength: 67,
        glowRadius: 160,
        sparkle: false,
        waveAmplitude: 0
      }
    ]
  },
  {
    label: 'Aurora',
    values: [
      {
        color: '#10B981',
        speed: 0.35,
        frequency: 1.5,
        noise: 0.08,
        bandWidth: 0.3,
        rotation: 60,
        fadeTop: 0.8,
        iterations: 2,
        intensity: 1.15
      },
      {
        cursorRadius: 620,
        cursorForce: 0.18,
        bulgeOnly: true,
        bulgeStrength: 45,
        glowRadius: 280,
        sparkle: false,
        waveAmplitude: 5
      }
    ]
  },
  {
    label: 'Ember',
    values: [
      {
        color: '#F97316',
        speed: 0.4,
        frequency: 1.8,
        noise: 0.18,
        bandWidth: 0.22,
        rotation: 115,
        fadeTop: 0.7,
        iterations: 1,
        intensity: 1.4
      },
      {
        cursorRadius: 420,
        cursorForce: 0.26,
        bulgeOnly: true,
        bulgeStrength: 105,
        glowRadius: 210,
        sparkle: true,
        waveAmplitude: 0
      }
    ]
  },
  {
    label: 'Ice',
    values: [
      {
        color: '#06B6D4',
        speed: 0.15,
        frequency: 1.2,
        noise: 0.06,
        bandWidth: 0.4,
        rotation: 45,
        fadeTop: 0.95,
        iterations: 2,
        intensity: 1.1
      },
      {
        cursorRadius: 750,
        cursorForce: 0.08,
        bulgeOnly: true,
        bulgeStrength: 35,
        glowRadius: 340,
        sparkle: false,
        waveAmplitude: 7
      }
    ]
  }
];

const EASE_IN_OUT = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpColor(from, to, t) {
  const a = hexToHsv(from);
  const b = hexToHsv(to);
  let dh = b.h - a.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  let h = a.h + dh * t;
  if (h < 0) h += 360;
  if (h >= 360) h -= 360;
  return hsvToHex(h, lerp(a.s, b.s, t), lerp(a.v, b.v, t));
}

const PRESET_DURATION = 1100;

function tweenScene({ from, target, onFrame, onDone }) {
  const start = performance.now();
  let raf = null;

  const step = now => {
    const t = Math.min(1, (now - start) / PRESET_DURATION);

    if (t >= 1) {
      onFrame(
        from.map((vals, i) => ({ ...vals, ...target[i] })),
        1
      );
      onDone?.();
      return;
    }

    const e = EASE_IN_OUT(t);
    onFrame(
      SNIPPET_DEFS.map((def, i) => {
        const a = from[i];
        const b = target[i];
        const out = { ...a };
        for (const prop of def.props) {
          if (!(prop.name in b)) continue;
          if (prop.type === 'boolean') out[prop.name] = e >= 0.5 ? b[prop.name] : a[prop.name];
          else if (prop.type === 'color') out[prop.name] = lerpColor(a[prop.name], b[prop.name], e);
          else {
            const v = lerp(a[prop.name], b[prop.name], e);
            out[prop.name] = prop.step >= 1 ? Math.round(v) : v;
          }
        }
        return out;
      }),
      e
    );

    raf = requestAnimationFrame(step);
  };

  raf = requestAnimationFrame(step);
  return () => {
    if (raf !== null) cancelAnimationFrame(raf);
  };
}

const CHIP_IDLE_RGB = [255, 255, 255];
const CHIP_IDLE_ALPHA = 0.45;

function chipTint(accentHex, weight) {
  const [r, g, b] = parseHexRgb(accentHex);
  const mix = (from, to) => Math.round(lerp(from, to, weight));
  const alpha = lerp(CHIP_IDLE_ALPHA, 1, weight);
  return `rgba(${mix(CHIP_IDLE_RGB[0], r)}, ${mix(CHIP_IDLE_RGB[1], g)}, ${mix(CHIP_IDLE_RGB[2], b)}, ${alpha.toFixed(3)})`;
}

/* ── Helpers ── */

function formatValue(val, step) {
  if (step >= 1) return String(Math.round(val));
  const d = Math.max(0, Math.ceil(-Math.log10(step)));
  return val.toFixed(d);
}

function startDrag(onMove, onEnd) {
  document.addEventListener('pointermove', onMove);
  const onUp = () => {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onUp);
    onEnd?.();
  };
  document.addEventListener('pointerup', onUp);
  // A touch handed over to the browser for panning ends in pointercancel, never pointerup,
  // so without this the move listener would outlive the gesture.
  document.addEventListener('pointercancel', onUp);
}

/* ── Audio ── */

let _audioCtx;
const _buffers = {};
const _sounds = {
  tick: '/assets/sounds/click-004.mp3',
  color: '/assets/sounds/drop-003.mp3',
  toggle: '/assets/sounds/switch-007.mp3'
};
const _lastPlayed = {};

function preloadSounds() {
  if (_audioCtx) return;
  try {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    return;
  }
  for (const [key, url] of Object.entries(_sounds)) {
    fetch(url)
      .then(r => r.arrayBuffer())
      .then(buf => _audioCtx.decodeAudioData(buf))
      .then(decoded => {
        _buffers[key] = decoded;
      })
      .catch(() => {});
  }
}

function playSound(name, volume = 0.25, cooldown = 0) {
  if (!_audioCtx) preloadSounds();
  const buf = _buffers[name];
  if (!buf) return;
  if (cooldown > 0) {
    const now = performance.now();
    if (now - (_lastPlayed[name] || 0) < cooldown) return;
    _lastPlayed[name] = now;
  }
  const src = _audioCtx.createBufferSource();
  const gain = _audioCtx.createGain();
  gain.gain.value = volume;
  src.buffer = buf;
  src.connect(gain);
  gain.connect(_audioCtx.destination);
  src.start(0);
}

/* ── Editable value components ── */

function EditableValue({ type, value, onChange, min, max, step }) {
  const numRef = useRef(null);
  const stateRef = useRef({ value, onChange, min, max, step });
  stateRef.current = { value, onChange, min, max, step };

  useEffect(() => {
    const el = numRef.current;
    if (!el) return;
    const onWheel = e => {
      e.preventDefault();
      const { value: v, onChange: oc, min: mn, max: mx, step: s } = stateRef.current;
      const dir = e.deltaY < 0 ? 1 : -1;
      let next = v + dir * s;
      next = Math.round(next / s) * s;
      const clamped = Math.max(mn, Math.min(mx, next));
      if (clamped !== v) playSound('tick', 0.25, 60);
      oc(clamped);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  if (type === 'color') {
    return <ColorValue value={value} onChange={onChange} />;
  }

  if (type === 'boolean') {
    return (
      <button
        className="ln-hero-code-value ln-hero-code-value--bool"
        onClick={() => {
          playSound('toggle');
          onChange(!value);
        }}
      >
        {String(value)}
      </button>
    );
  }

  const handlePointerDown = e => {
    // Preventing the default on touch would also cancel the page scroll this gesture might
    // turn out to be. The |dx| > 2 threshold below keeps the value safe until it commits.
    const isTouch = e.pointerType === 'touch';
    if (!isTouch) e.preventDefault();
    const startX = e.clientX;
    const { value: startVal, step: s, min: mn, max: mx } = stateRef.current;
    let moved = false;
    let lastVal = startVal;

    if (!isTouch) {
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    startDrag(
      ev => {
        const dx = ev.clientX - startX;
        if (!moved && Math.abs(dx) > 2) moved = true;
        if (!moved) return;
        const sens = ev.shiftKey ? 0.02 : 0.15;
        let next = startVal + dx * s * sens;
        next = Math.round(next / s) * s;
        const clamped = Math.max(mn, Math.min(mx, next));
        if (clamped !== lastVal) playSound('tick', 0.25, 60);
        lastVal = clamped;
        stateRef.current.onChange(clamped);
      },
      () => {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    );
  };

  return (
    <span ref={numRef} className="ln-hero-code-value ln-hero-code-value--number" onPointerDown={handlePointerDown}>
      {formatValue(value, step)}
    </span>
  );
}

const COLOR_PRESETS = [
  '#A855F7',
  '#7C3AED',
  '#6366F1',
  '#3B82F6',
  '#06B6D4',
  '#10B981',
  '#EAB308',
  '#F97316',
  '#EF4444',
  '#EC4899'
];

function ColorValue({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const wrapRef = useRef(null);
  const areaRef = useRef(null);
  const hueRef = useRef(null);
  const hsvRef = useRef(hsv);
  hsvRef.current = hsv;

  useEffect(() => {
    if (open) return;
    const next = hexToHsv(value);
    setHsv(next);
    hsvRef.current = next;
  }, [value, open]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onClickOutside);
    return () => document.removeEventListener('pointerdown', onClickOutside);
  }, [open]);

  const applyHsv = useCallback(
    next => {
      hsvRef.current = next;
      setHsv(next);
      onChange(hsvToHex(next.h, next.s, next.v));
    },
    [onChange]
  );

  const onAreaDown = useCallback(
    e => {
      e.preventDefault();
      e.stopPropagation();
      const update = ev => {
        const rect = areaRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height));
        applyHsv({ h: hsvRef.current.h, s: x, v: 1 - y });
      };
      update(e);
      startDrag(update);
    },
    [applyHsv]
  );

  const onHueDown = useCallback(
    e => {
      e.preventDefault();
      e.stopPropagation();
      const update = ev => {
        const rect = hueRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
        applyHsv({ s: hsvRef.current.s, v: hsvRef.current.v, h: x * 360 });
      };
      update(e);
      startDrag(update);
    },
    [applyHsv]
  );

  const hueColor = hsvToHex(hsv.h, 1, 1);

  return (
    <span ref={wrapRef} className="ln-hero-code-value ln-hero-code-value--color" style={{ position: 'relative' }}>
      <span
        className="ln-hero-code-swatch"
        style={{ background: value, cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}
      />
      <span style={{ cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        &quot;{value}&quot;
      </span>

      {open && (
        <div className="ln-hero-color-picker">
          <div
            ref={areaRef}
            className="ln-hero-color-picker-area"
            onPointerDown={onAreaDown}
            style={{
              background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueColor})`
            }}
          >
            <div
              className="ln-hero-color-picker-thumb"
              style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
            />
          </div>
          <div ref={hueRef} className="ln-hero-color-picker-hue" onPointerDown={onHueDown}>
            <div className="ln-hero-color-picker-thumb" style={{ left: `${(hsv.h / 360) * 100}%`, top: '50%' }} />
          </div>
          <div className="ln-hero-color-picker-presets">
            {COLOR_PRESETS.map(c => (
              <button
                key={c}
                className="ln-hero-color-picker-preset"
                style={{
                  background: c,
                  borderColor: value.toLowerCase() === c.toLowerCase() ? '#fff' : 'rgba(255,255,255,0.12)'
                }}
                onClick={() => {
                  playSound('color');
                  const next = hexToHsv(c);
                  setHsv(next);
                  onChange(c);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </span>
  );
}

function InteractiveCode({ def, values, onChange }) {
  return (
    <pre className="ln-hero-code-pre">
      <code>
        <span className="c-kw">import</span>
        <span className="c-punc">{' { '}</span>
        <span className="c-comp">{def.component}</span>
        <span className="c-punc">{' } '}</span>
        <span className="c-kw">from</span>
        <span className="c-str"> {"'@components/"}</span>
        <span className="c-str">{def.component}</span>
        <span className="c-str">{"';"}</span>
        {'\n\n'}
        <span className="c-kw">function</span>
        <span className="c-fn"> App</span>
        <span className="c-punc">() {'{'}</span>
        {'\n  '}
        <span className="c-kw">return</span>
        <span className="c-punc"> (</span>
        {'\n    '}
        <span className="c-comp">{'<'}</span>
        <span className="c-comp">{def.component}</span>
        {def.props.map(prop => (
          <span key={prop.name}>
            {'\n      '}
            <span className="c-attr">{prop.name}</span>
            <span className="c-punc">=</span>
            {prop.type === 'color' ? (
              <EditableValue type="color" value={values[prop.name]} onChange={v => onChange(prop.name, v)} />
            ) : (
              <>
                <span className="c-punc">{'{'}</span>
                <EditableValue
                  type={prop.type}
                  value={values[prop.name]}
                  onChange={v => onChange(prop.name, v)}
                  min={prop.min}
                  max={prop.max}
                  step={prop.step}
                />
                <span className="c-punc">{'}'}</span>
              </>
            )}
          </span>
        ))}
        {'\n    '}
        <span className="c-comp">/{'>'}</span>
        {'\n  '}
        <span className="c-punc">)</span>
        {'\n'}
        <span className="c-punc">{'}'}</span>
      </code>
    </pre>
  );
}

/* ── Hero ── */

const Hero = () => {
  const { resolvedTheme } = useColorMode();
  const isLightTheme = resolvedTheme === 'light';
  const [activeSnippet, setActiveSnippet] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const activeRef = useRef(activeSnippet);
  activeRef.current = activeSnippet;

  const stars = useStars();

  const [propValues, setPropValues] = useState(() =>
    SNIPPET_DEFS.map(def => Object.fromEntries(def.props.map(p => [p.name, p.default])))
  );

  const [activePreset, setActivePreset] = useState(0);
  const [presetFade, setPresetFade] = useState({ from: null, to: 0, e: 1 });
  const propValuesRef = useRef(propValues);
  propValuesRef.current = propValues;
  const activePresetRef = useRef(activePreset);
  activePresetRef.current = activePreset;
  const stopTweenRef = useRef(null);

  const handlePropChange = useCallback((name, value) => {
    stopTweenRef.current?.();
    stopTweenRef.current = null;
    setActivePreset(null);
    setPresetFade({ from: null, to: null, e: 1 });
    setPropValues(prev => {
      const idx = activeRef.current;
      const next = [...prev];
      next[idx] = { ...next[idx], [name]: value };
      return next;
    });
  }, []);

  const applyPreset = useCallback(presetIndex => {
    const preset = SCENE_PRESETS[presetIndex];
    if (!preset) return;

    playSound('color');
    stopTweenRef.current?.();

    const previous = activePresetRef.current;
    setActivePreset(presetIndex);
    setPresetFade({ from: previous, to: presetIndex, e: 0 });

    stopTweenRef.current = tweenScene({
      from: propValuesRef.current,
      target: preset.values,
      onFrame: (values, e) => {
        setPropValues(values);
        setPresetFade({ from: previous, to: presetIndex, e });
      },
      onDone: () => {
        stopTweenRef.current = null;
        setPresetFade({ from: null, to: presetIndex, e: 1 });
      }
    });
  }, []);

  const toggleDropdown = useCallback(() => setDropdownOpen(prev => !prev), []);

  const hasChanges = useMemo(() => {
    const def = SNIPPET_DEFS[activeSnippet];
    const vals = propValues[activeSnippet];
    return def.props.some(p => vals[p.name] !== p.default);
  }, [activeSnippet, propValues]);

  const resetProps = useCallback(() => {
    stopTweenRef.current?.();
    stopTweenRef.current = null;
    setActivePreset(0);
    setPresetFade({ from: null, to: 0, e: 1 });
    setPropValues(SNIPPET_DEFS.map(def => Object.fromEntries(def.props.map(p => [p.name, p.default]))));
  }, []);

  useEffect(() => () => stopTweenRef.current?.(), []);

  useEffect(() => {
    const onClickOutside = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('pointerdown', onClickOutside);
    return () => document.removeEventListener('pointerdown', onClickOutside);
  }, []);

  const accentColor = propValues[0].color;
  const { accentFg, accentText, accentGlow, dotGradientFrom, dotGradientTo } = useMemo(() => {
    const [ar, ag, ab] = parseHexRgb(accentColor);
    const lum = (0.2126 * ar + 0.7152 * ag + 0.0722 * ab) / 255;
    const hsv = hexToHsv(accentColor);
    return {
      accentFg: lum > 0.5 ? '#000' : '#fff',
      accentText: hsvToHex(hsv.h, Math.min(hsv.s, 0.7), Math.max(hsv.v, 0.92)),
      accentGlow: `0 0 24px rgba(${ar}, ${ag}, ${ab}, 0.3), 0 0 64px rgba(${ar}, ${ag}, ${ab}, 0.14)`,
      dotGradientFrom: `rgba(${ar}, ${ag}, ${ab}, 0.35)`,
      dotGradientTo: `rgba(${Math.min(ar + 12, 255)}, ${Math.min(ag + 66, 255)}, ${Math.min(ab + 16, 255)}, 0.25)`
    };
  }, [accentColor]);

  const presetStyle = useCallback(
    index => {
      const fading = presetFade.from !== null;
      let weight;
      if (!fading) weight = activePreset === index ? 1 : 0;
      else if (index === presetFade.to) weight = presetFade.e;
      else if (index === presetFade.from) weight = 1 - presetFade.e;
      else weight = 0;

      if (weight <= 0) return undefined;
      if (isLightTheme) {
        return {
          color: '#52525b',
          background: `rgba(39, 39, 42, ${(0.055 * weight).toFixed(4)})`,
          transition: fading ? 'none' : undefined
        };
      }
      return {
        color: chipTint(accentText, weight),
        background: `rgba(255, 255, 255, ${(0.07 * weight).toFixed(4)})`,
        transition: fading ? 'none' : undefined
      };
    },
    [presetFade, activePreset, accentText, isLightTheme]
  );

  const componentCount = COMPONENT_COUNT;

  const formattedStars = useMemo(
    () => (stars >= 1000 ? `${(stars / 1000).toFixed(1).replace(/\.0$/, '')}k` : stars),
    [stars]
  );

  useEffect(() => {
    const hsv = hexToHsv(accentColor);
    const dark = hsvToHex(hsv.h, Math.min(hsv.s + 0.1, 1), Math.max(hsv.v * 0.7, 0));
    const light = hsvToHex((hsv.h + 30) % 360, Math.max(hsv.s * 0.8, 0), Math.min(hsv.v * 1.15, 1));
    const [r, g, b] = parseHexRgb(accentColor);
    const root = document.documentElement;
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    root.style.setProperty('--pro-dark', dark);
    root.style.setProperty('--pro-base', accentColor);
    root.style.setProperty('--pro-light', light);
    root.style.setProperty('--pro-glow', `${r}, ${g}, ${b}`);
    root.style.setProperty('--pro-fg', lum > 0.5 ? '#000' : '#fff');
    return () => {
      root.style.removeProperty('--pro-dark');
      root.style.removeProperty('--pro-base');
      root.style.removeProperty('--pro-light');
      root.style.removeProperty('--pro-glow');
      root.style.removeProperty('--pro-fg');
    };
  }, [accentColor]);

  return (
    <section className="ln-hero">
      <DotField {...propValues[1]} gradientFrom={dotGradientFrom} gradientTo={dotGradientTo} />
      <HeroBand
        className="ln-hero-band"
        {...propValues[0]}
        lightMode={isLightTheme}
        scale={1}
        warpStrength={1}
        yOffset={0.3}
        mouseInfluence={0.3}
      />
      <svg className="ln-hero-bottom-fade" preserveAspectRatio="none" viewBox="0 0 1 1">
        <defs>
          <linearGradient id="hero-bottom-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#120F17" stopOpacity="0" />
            <stop offset="50%" stopColor="#120F17" stopOpacity="0" />
            <stop offset="60%" stopColor="#120F17" stopOpacity="0.03" />
            <stop offset="68%" stopColor="#120F17" stopOpacity="0.1" />
            <stop offset="74%" stopColor="#120F17" stopOpacity="0.22" />
            <stop offset="80%" stopColor="#120F17" stopOpacity="0.38" />
            <stop offset="85%" stopColor="#120F17" stopOpacity="0.55" />
            <stop offset="90%" stopColor="#120F17" stopOpacity="0.72" />
            <stop offset="94%" stopColor="#120F17" stopOpacity="0.87" />
            <stop offset="97%" stopColor="#120F17" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#120F17" stopOpacity="1" />
          </linearGradient>
        </defs>
        <rect width="1" height="1" fill="url(#hero-bottom-fade)" />
      </svg>

      <div className="ln-hero-content">
        <div className="ln-hero-left">
          <Link to="/c/micro" className="ln-hero-tag">
            <span className="ln-hero-tag-new" style={{ background: accentColor, color: accentFg }}>
              New Category
            </span>
            Micro-interactions <FaArrowRight size={10} />
          </Link>

          <h1 className="ln-hero-headline">
            <span className="ln-hero-headline-line">React components for</span>
            <br />
            <span className="ln-hero-headline-line" style={{ color: accentText, textShadow: accentGlow }}>
              creative developers
            </span>
          </h1>

          <p className="ln-hero-description">
            Highly customizable animated components &amp; backgrounds that drop into your project and instantly make it
            stand out
          </p>

          <div className="ln-hero-buttons">
            <Link
              to="/get-started/index"
              className="ln-hero-btn ln-hero-btn-primary"
              style={{ background: accentColor, borderColor: accentColor, color: accentFg }}
            >
              Browse Components <FaArrowRight size={12} />
            </Link>
            <a
              href="https://github.com/DavidHDev/react-bits"
              target="_blank"
              rel="noopener noreferrer"
              className="ln-hero-btn ln-hero-btn-secondary"
            >
              Star on GitHub
              <span className="ln-hero-btn-count">{formattedStars}</span>
            </a>
          </div>

          <ul className="ln-hero-proof">
            <li>{componentCount}+ components</li>
            <li aria-hidden="true" className="ln-hero-proof-sep" />
            <li>Free forever</li>
          </ul>
        </div>

        <div className="ln-hero-right">
          <div className="ln-hero-code-window" onPointerEnter={preloadSounds}>
            <div className="ln-hero-code-titlebar">
              <div className="ln-hero-code-dots">
                <span />
                <span />
                <span />
              </div>
              <div className="ln-hero-code-titlebar-actions">
                {hasChanges && (
                  <button className="ln-hero-code-reset" onClick={resetProps} aria-label="Reset to defaults">
                    <LuRotateCcw size={14} strokeWidth={1.5} />
                  </button>
                )}
                <div className="ln-hero-code-dropdown" ref={dropdownRef}>
                  <button className="ln-hero-code-dropdown-trigger" onClick={toggleDropdown}>
                    {SNIPPET_DEFS[activeSnippet].label}
                    <svg
                      className={`ln-hero-code-caret${dropdownOpen ? ' open' : ''}`}
                      width="8"
                      height="5"
                      viewBox="0 0 8 5"
                      fill="none"
                    >
                      <path
                        d="M1 1L4 4L7 1"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <div className={`ln-hero-code-dropdown-menu${dropdownOpen ? ' open' : ''}`}>
                    {SNIPPET_DEFS.map((def, i) => (
                      <button
                        key={def.label}
                        className={`ln-hero-code-dropdown-item${i === activeSnippet ? ' active' : ''}`}
                        onClick={() => {
                          setActiveSnippet(i);
                          setDropdownOpen(false);
                        }}
                      >
                        {def.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="ln-hero-code-body">
              <InteractiveCode
                def={SNIPPET_DEFS[activeSnippet]}
                values={propValues[activeSnippet]}
                onChange={handlePropChange}
              />
            </div>
            <div className="ln-hero-code-footer">
              <div className="ln-hero-code-presets" role="group" aria-label="Presets">
                {SCENE_PRESETS.map((preset, i) => (
                  <button
                    key={preset.label}
                    className={`ln-hero-code-preset${activePreset === i ? ' active' : ''}`}
                    style={presetStyle(i)}
                    aria-pressed={activePreset === i}
                    onClick={() => applyPreset(i)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <p className="ln-hero-code-hint">
                <LuMoveHorizontal size={13} strokeWidth={1.75} />
                Every value is editable
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
