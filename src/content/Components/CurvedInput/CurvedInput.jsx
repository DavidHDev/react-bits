'use client';

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import './CurvedInput.css';

const DEG = 180 / Math.PI;

const round2 = n => Math.round(n * 100) / 100;

const hexToRgba = (hex, alpha) => {
  let h = String(hex).replace('#', '');
  if (h.length === 3)
    h = h
      .split('')
      .map(c => c + c)
      .join('');
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return hex;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

const SHADOWS = { sm: [5, 12, 0.3], md: [10, 24, 0.4], lg: [16, 40, 0.52] };

const THEMES = {
  dark: {
    backgroundColor: '#1B1722',
    textColor: '#f5f5f5',
    placeholderColor: '#a1a1aa',
    borderColor: '#392e4e',
    buttonColor: '#A855F7',
    buttonTextColor: '#ffffff',
    shadowColor: '#000000'
  },
  light: {
    backgroundColor: '#ffffff',
    textColor: '#1d2050',
    placeholderColor: '#9aa0b6',
    borderColor: '#262a56',
    buttonColor: '#4763eb',
    buttonTextColor: '#ffffff',
    shadowColor: '#0b0e2a'
  }
};

// Maps the flat coordinate space (u: 0..W along the bar, v: offset from the
// centerline, positive down) onto a circular arc with the given sagitta
// (`bend`, in px). Positive bend arches up, negative sags down, 0 is flat.
const buildGeometry = (width, bend, thickness, pad) => {
  const W = width;
  const T = thickness;
  const s = Math.max(-W * 0.35, Math.min(bend, W * 0.35));
  const a = Math.abs(s);
  const dir = s >= 0 ? 1 : -1;
  const svgH = T + a + pad * 2;

  if (a < 0.75) {
    const midY = pad + T / 2;
    return {
      straight: true,
      W,
      T,
      svgH,
      uPerLen: 1,
      point: (u, v) => [u, midY + v],
      angleAt: () => 0,
      uFromPoint: x => x
    };
  }

  const R = (W * W * 0.25 + a * a) / (2 * a);
  const cx = W / 2;
  const apexY = pad + T / 2 + (dir > 0 ? 0 : a);
  const cy = apexY + dir * R;
  const phi = Math.asin(Math.min(1, W / (2 * R)));

  return {
    straight: false,
    W,
    T,
    svgH,
    R,
    dir,
    uPerLen: W / (2 * R * phi),
    point: (u, v) => {
      const th = ((u - cx) / cx) * phi;
      const rho = R - dir * v;
      return [cx + rho * Math.sin(th), cy - dir * rho * Math.cos(th)];
    },
    angleAt: u => dir * ((u - cx) / cx) * phi * DEG,
    uFromPoint: (x, y) => {
      const th = Math.atan2(x - cx, dir * (cy - y));
      return cx + (th / phi) * cx;
    }
  };
};

const fmt = (g, u, v) => {
  const [x, y] = g.point(u, v);
  return `${round2(x)} ${round2(y)}`;
};

// Segment along a constant-v edge, as a circular arc (or a line when flat)
const edgeSeg = (g, uTo, v, ltr) => {
  if (g.straight) return `L ${fmt(g, uTo, v)}`;
  const rho = round2(g.R - g.dir * v);
  const sweep = ltr === g.dir > 0 ? 1 : 0;
  return `A ${rho} ${rho} 0 0 ${sweep} ${fmt(g, uTo, v)}`;
};

// A rectangle bent along the arc: circular top/bottom edges, radial end caps
// and quadratic rounded corners.
const bentRectPath = (g, u0, u1, vTop, vBot, radius) => {
  const rc = Math.max(0, Math.min(radius, (vBot - vTop) / 2, (u1 - u0) / 2));
  return [
    `M ${fmt(g, u0 + rc, vTop)}`,
    edgeSeg(g, u1 - rc, vTop, true),
    `Q ${fmt(g, u1, vTop)} ${fmt(g, u1, vTop + rc)}`,
    `L ${fmt(g, u1, vBot - rc)}`,
    `Q ${fmt(g, u1, vBot)} ${fmt(g, u1 - rc, vBot)}`,
    edgeSeg(g, u0 + rc, vBot, false),
    `Q ${fmt(g, u0, vBot)} ${fmt(g, u0, vBot - rc)}`,
    `L ${fmt(g, u0, vTop + rc)}`,
    `Q ${fmt(g, u0, vTop)} ${fmt(g, u0 + rc, vTop)}`,
    'Z'
  ].join(' ');
};

const bentLinePath = (g, u0, u1, v) => `M ${fmt(g, u0, v)} ${edgeSeg(g, u1, v, true)}`;

const SELECTABLE_TYPES = ['text', 'search', 'tel', 'url', 'password'];

const CurvedInput = ({
  value,
  defaultValue = '',
  onChange,
  onSubmit,
  placeholder = 'Enter your email',
  buttonText = 'Get Started',
  type = 'email',
  name,
  ariaLabel,
  theme = 'dark',
  width = 450,
  bend = 28,
  height = 64,
  cornerRadius = 18,
  borderWidth = 1.5,
  fontSize = 16,
  backgroundColor,
  textColor,
  placeholderColor,
  borderColor,
  buttonColor,
  buttonTextColor,
  iconColor,
  shadowSize = 'md',
  shadowColor,
  showButton = true,
  showIcon = true,
  icon,
  className = '',
  style
}) => {
  const uid = useId().replace(/:/g, '');
  const layoutPathId = `ci-text-${uid}`;
  const buttonPathId = `ci-btn-${uid}`;
  const clipId = `ci-clip-${uid}`;

  const rootRef = useRef(null);
  const svgRef = useRef(null);
  const inputRef = useRef(null);
  const textRef = useRef(null);
  const btnMeasureRef = useRef(null);
  const scrollRef = useRef(0);

  const [w, setW] = useState(0);
  const [innerValue, setInnerValue] = useState(defaultValue);
  const [caretIndex, setCaretIndex] = useState(defaultValue.length);
  const [focused, setFocused] = useState(false);
  const [caretU, setCaretU] = useState(0);
  const [scrollLen, setScrollLen] = useState(0);
  const [btnTextW, setBtnTextW] = useState(0);
  const [, setFontTick] = useState(0);

  const val = value !== undefined ? value : innerValue;
  const display = type === 'password' ? '•'.repeat(val.length) : val;

  const palette = THEMES[theme] || THEMES.dark;
  const bgColor = backgroundColor ?? palette.backgroundColor;
  const fgColor = textColor ?? palette.textColor;
  const phColor = placeholderColor ?? palette.placeholderColor;
  const strokeColor = borderColor ?? palette.borderColor;
  const accentColor = buttonColor ?? palette.buttonColor;
  const btnFgColor = buttonTextColor ?? palette.buttonTextColor;
  const shColor = shadowColor ?? palette.shadowColor;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const cw = entries[0]?.contentRect?.width ?? el.clientWidth;
      setW(Math.round(cw));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Re-measure once webfonts finish loading
  useEffect(() => {
    let alive = true;
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (alive) setFontTick(t => t + 1);
      });
    }
    return () => {
      alive = false;
    };
  }, []);

  const pad = Math.ceil(borderWidth / 2) + 6;
  const geom = useMemo(() => (w > 2 ? buildGeometry(w, bend, height, pad) : null), [w, bend, height, pad]);

  const layout = useMemo(() => {
    if (!geom) return null;
    const T = height;
    const btnInset = Math.max(5, borderWidth + 4);
    const chipH = Math.min(34, Math.max(16, T * 0.34));
    const chipW = chipH * 1.25;
    const iconU = 22 + chipW / 2;
    const textStartU = showIcon ? 22 + chipW + 13 : 24;
    const btnW = showButton ? Math.max(btnTextW + fontSize * 2.7, T * 1.35) : 0;
    const btnU1 = geom.W - btnInset;
    const btnU0 = btnU1 - btnW;
    const textEndU = Math.max(textStartU + 20, showButton ? btnU0 - 14 : geom.W - 24);
    const winLen = (textEndU - textStartU) / geom.uPerLen;
    return { btnInset, chipH, chipW, iconU, textStartU, textEndU, btnU0, btnU1, winLen };
  }, [geom, height, borderWidth, btnTextW, fontSize, showIcon, showButton]);

  // Measure rendered text to keep the caret on the curve and scroll long
  // values along the arc, exactly like a native input would.
  useLayoutEffect(() => {
    if (btnMeasureRef.current) {
      const bw = btnMeasureRef.current.getComputedTextLength();
      setBtnTextW(prev => (Math.abs(prev - bw) > 0.5 ? bw : prev));
    }
    if (!geom || !layout) return;
    const textEl = textRef.current;
    const caret = Math.min(caretIndex, display.length);
    let caretLen = 0;
    let totalLen = 0;
    if (textEl && display.length) {
      try {
        totalLen = textEl.getSubStringLength(0, display.length);
        caretLen = caret > 0 ? textEl.getSubStringLength(0, caret) : 0;
      } catch {
        totalLen = 0;
        caretLen = 0;
      }
    }
    let next = scrollRef.current;
    if (caretLen - next > layout.winLen - 2) next = caretLen - layout.winLen + 2;
    if (caretLen - next < 0) next = caretLen;
    if (totalLen - next < layout.winLen) next = Math.max(0, totalLen - layout.winLen);
    next = Math.max(0, next);
    if (Math.abs(next - scrollRef.current) > 0.5) {
      scrollRef.current = next;
      setScrollLen(next);
    }
    setCaretU(layout.textStartU + (caretLen - next) * geom.uPerLen);
  });

  const commitValue = v => {
    if (value === undefined) setInnerValue(v);
    onChange?.(v);
  };

  const handleInputChange = e => {
    commitValue(e.target.value);
    setCaretIndex(e.target.selectionStart ?? e.target.value.length);
  };

  const handleSelect = e => {
    setCaretIndex(e.target.selectionStart ?? e.target.value.length);
  };

  const handleSubmit = e => {
    if (e?.preventDefault) e.preventDefault();
    if (onSubmit) onSubmit(val);
  };

  // Click on the curve: focus the hidden input and drop the caret on the
  // character closest to the click, measured in arc length.
  const handleSurfaceClick = e => {
    const input = inputRef.current;
    if (!input) return;
    let idx = display.length;
    const svg = svgRef.current;
    const textEl = textRef.current;
    if (svg && geom && layout && textEl && display.length) {
      try {
        const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
        const target = scrollRef.current + (geom.uFromPoint(pt.x, pt.y) - layout.textStartU) / geom.uPerLen;
        let best = 0;
        let bestDist = Infinity;
        for (let i = 0; i <= display.length; i++) {
          const li = i === 0 ? 0 : textEl.getSubStringLength(0, i);
          const d = Math.abs(li - target);
          if (d < bestDist) {
            bestDist = d;
            best = i;
          }
        }
        idx = best;
      } catch {
        idx = display.length;
      }
    }
    input.focus();
    try {
      input.setSelectionRange(idx, idx);
    } catch {
      /* selection API unavailable for this input type */
    }
    setCaretIndex(idx);
  };

  const safeType = SELECTABLE_TYPES.includes(type) ? type : 'text';
  const inputMode = type === 'email' ? 'email' : type === 'number' ? 'decimal' : undefined;

  const shadow = SHADOWS[shadowSize];
  const svgStyle = shadow
    ? { filter: `drop-shadow(0 ${shadow[0]}px ${shadow[1]}px ${hexToRgba(shColor, shadow[2])})` }
    : undefined;

  let content = null;
  if (geom && layout) {
    const T = height;
    const vBase = fontSize * 0.34;
    const scrollU = scrollLen * geom.uPerLen;
    const bandPath = bentRectPath(geom, 0, geom.W, -T / 2, T / 2, cornerRadius);
    const layoutPath = bentLinePath(geom, layout.textStartU - scrollU, geom.W, vBase);
    const clipPath = bentRectPath(geom, layout.textStartU - 6, layout.textEndU + 8, -T / 2, T / 2, 0);

    const chipFill = iconColor || accentColor;
    const { chipW, chipH } = layout;
    const ew = chipW * 0.5;
    const eh = chipH * 0.5;
    const sw = Math.max(1.1, chipH * 0.075);
    const [ix, iy] = geom.point(layout.iconU, 0);
    const iconAngle = geom.angleAt(layout.iconU);

    const [caretX, caretY] = geom.point(caretU, 0);
    const caretAngle = geom.angleAt(caretU);
    const caretH = Math.min(T * 0.58, fontSize * 1.45);

    const btnH = T - layout.btnInset * 2;
    const buttonPath = showButton
      ? bentRectPath(geom, layout.btnU0, layout.btnU1, -T / 2 + layout.btnInset, T / 2 - layout.btnInset, Math.min(cornerRadius * 0.72, btnH / 2))
      : '';
    const buttonTextPath = showButton ? bentLinePath(geom, layout.btnU0, layout.btnU1, vBase) : '';

    content = (
      <svg
        ref={svgRef}
        className="curved-input__svg"
        width={geom.W}
        height={round2(geom.svgH)}
        viewBox={`0 0 ${geom.W} ${round2(geom.svgH)}`}
        style={svgStyle}
        onPointerDown={e => e.preventDefault()}
        onClick={handleSurfaceClick}
      >
        <defs>
          <clipPath id={clipId}>
            <path d={clipPath} />
          </clipPath>
        </defs>

        <path className="curved-input__ring" d={bandPath} fill="none" stroke={accentColor} strokeWidth={borderWidth + 6} />
        <path d={bandPath} fill={bgColor} stroke={strokeColor} strokeWidth={borderWidth} />

        <path id={layoutPathId} d={layoutPath} fill="none" />

        {showIcon && (
          <g transform={`translate(${round2(ix)} ${round2(iy)}) rotate(${round2(iconAngle)})`} aria-hidden="true">
            {icon || (
              <>
                <rect x={-chipW / 2} y={-chipH / 2} width={chipW} height={chipH} rx={chipH * 0.27} fill={chipFill} />
                <rect
                  x={-ew / 2}
                  y={-eh / 2}
                  width={ew}
                  height={eh}
                  rx={1.4}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={sw}
                  strokeLinejoin="round"
                />
                <path
                  d={`M ${round2(-ew / 2)} ${round2(-eh / 2 + sw * 0.4)} L 0 ${round2(eh * 0.14)} L ${round2(ew / 2)} ${round2(-eh / 2 + sw * 0.4)}`}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={sw}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </>
            )}
          </g>
        )}

        <g clipPath={`url(#${clipId})`}>
          <text ref={textRef} style={{ fontSize: `${fontSize}px`, fontWeight: 500 }} fill={fgColor} xmlSpace="preserve" aria-hidden="true">
            <textPath href={`#${layoutPathId}`}>{display}</textPath>
          </text>
          {!display && placeholder && (
            <text style={{ fontSize: `${fontSize}px`, fontWeight: 500 }} fill={phColor} xmlSpace="preserve" aria-hidden="true">
              <textPath href={`#${layoutPathId}`}>{placeholder}</textPath>
            </text>
          )}
          {focused && (
            <g
              key={`${display}-${Math.min(caretIndex, display.length)}`}
              transform={`translate(${round2(caretX)} ${round2(caretY)}) rotate(${round2(caretAngle)})`}
            >
              <line y1={-caretH / 2} y2={caretH / 2} stroke={fgColor} strokeWidth="1.5" strokeLinecap="round">
                <animate attributeName="opacity" values="1;0" dur="1.06s" calcMode="discrete" repeatCount="indefinite" />
              </line>
            </g>
          )}
        </g>

        {showButton && (
          <g
            className="curved-input__button"
            role="button"
            tabIndex={0}
            aria-label={buttonText}
            onClick={e => {
              e.stopPropagation();
              handleSubmit();
            }}
            onPointerDown={e => e.stopPropagation()}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSubmit();
              }
            }}
          >
            <path className="curved-input__button-bg" d={buttonPath} fill={accentColor} />
            <path id={buttonPathId} d={buttonTextPath} fill="none" />
            <text
              fill={btnFgColor}
              textAnchor="middle"
              style={{ fontSize: `${fontSize}px`, fontWeight: 600, pointerEvents: 'none' }}
            >
              <textPath href={`#${buttonPathId}`} startOffset="50%">
                {buttonText}
              </textPath>
            </text>
          </g>
        )}

        <text
          ref={btnMeasureRef}
          style={{ fontSize: `${fontSize}px`, fontWeight: 600 }}
          x="-9999"
          y="-9999"
          visibility="hidden"
          aria-hidden="true"
        >
          {buttonText}
        </text>
      </svg>
    );
  }

  return (
    <form
      ref={rootRef}
      className={`curved-input ${focused ? 'curved-input--focused' : ''} ${className}`.trim()}
      style={{ width: typeof width === 'number' ? `${width}px` : width, ...style }}
      onSubmit={handleSubmit}
      noValidate
    >
      {content}
      <input
        ref={inputRef}
        className="curved-input__field"
        type={safeType}
        inputMode={inputMode}
        name={name}
        value={val}
        onChange={handleInputChange}
        onSelect={handleSelect}
        onKeyUp={handleSelect}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label={ariaLabel || placeholder || 'Curved input'}
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
      />
    </form>
  );
};

export default CurvedInput;
