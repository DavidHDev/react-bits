'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useColorModeValue } from '../../setup/color-mode';

const FONT = 'Geist, "Geist Sans", system-ui, sans-serif';
const WORD = 'React Bits';
const SHOWN = 0.6;
const CAP = 0.9;
const FADE = 0.4;

const measureWord = () => {
  const context = document.createElement('canvas').getContext('2d');
  context.font = `600 100px ${FONT}`;
  const metrics = context.measureText(WORD);
  return {
    advance: metrics.width / 100,
    left: metrics.actualBoundingBoxLeft / 100,
    right: metrics.actualBoundingBoxRight / 100,
    ascent: metrics.actualBoundingBoxAscent / 100,
    descent: metrics.actualBoundingBoxDescent / 100
  };
};

export default function FooterWaves() {
  const rootRef = useRef(null);
  const id = useId().replace(/:/g, '');
  const [layout, setLayout] = useState(null);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [LiveWaves, setLiveWaves] = useState(null);
  const [failed, setFailed] = useState(false);
  const [cellSize, setCellSize] = useState(9);
  const [capabilities, setCapabilities] = useState({ gpu: false, fine: false, reduced: true });
  const color = useColorModeValue('#8d8498', '#655a72');
  const hoverColor = useColorModeValue('#7f4ecb', '#cba6f7');
  const backgroundColor = useColorModeValue('#f6f6f7', '#17141d');
  const handleError = useCallback(() => setFailed(true), []);
  const eligible = capabilities.gpu && !capabilities.reduced && !failed;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let cancelled = false;
    const update = () => {
      const width = root.clientWidth;
      if (cancelled || !width) return;
      const top = root.parentElement?.querySelector('.ln-footer-top');
      const inset = top ? parseFloat(getComputedStyle(top).paddingLeft) || 0 : 0;
      const word = measureWord();
      const font = Math.max(24, (width - inset * 2) / (word.left + word.right));
      const glyph = font * (word.ascent + word.descent);
      const above = Math.max(36, glyph * 0.46);
      const boxWidth = (font * word.advance) / CAP;
      const boxHeight = above * 2 + glyph;
      setCellSize(Math.min(9, Math.max(3, Math.round(width / 135))));
      setLayout({
        font,
        above,
        fade: above + glyph * FADE,
        boxWidth,
        boxHeight,
        left: (width - boxWidth) / 2,
        height: above + glyph * SHOWN,
        x: boxWidth / 2 + ((word.left - word.right) * font) / 2,
        y: boxHeight / 2 + ((word.ascent - word.descent) * font) / 2
      });
    };
    const observer = new ResizeObserver(update);
    observer.observe(root);
    document.fonts.ready.then(update);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () =>
      setCapabilities({
        gpu: Boolean(window.isSecureContext && navigator.gpu),
        fine: pointer.matches,
        reduced: motion.matches
      });
    const updateVisibility = () => setPageVisible(!document.hidden);
    update();
    updateVisibility();
    pointer.addEventListener('change', update);
    motion.addEventListener('change', update);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      pointer.removeEventListener('change', update);
      motion.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;
    const preload = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        preload.disconnect();
      },
      { rootMargin: '120px' }
    );
    const visibility = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
    });
    preload.observe(root);
    visibility.observe(root);
    return () => {
      preload.disconnect();
      visibility.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!near || !eligible || LiveWaves) return;
    let cancelled = false;
    import('../../../content/Backgrounds/ShapeWaves/ShapeWaves.jsx')
      .then(module => {
        if (!cancelled) setLiveWaves(() => module.default);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [near, eligible, LiveWaves]);

  const box = layout
    ? { left: layout.left, top: 0, right: 'auto', bottom: 'auto', width: layout.boxWidth, height: layout.boxHeight }
    : undefined;

  return (
    <div
      ref={rootRef}
      className="ln-footer-art"
      aria-hidden="true"
      style={layout ? { height: layout.height, '--art-fade': `${layout.fade}px` } : undefined}
    >
      <svg className="ln-footer-art-fallback" width="100%" height="100%" focusable="false" style={box}>
        <defs>
          <pattern
            id={`${id}-shapes`}
            width="36"
            height="36"
            patternUnits="userSpaceOnUse"
            patternTransform={`scale(${cellSize / 9})`}
          >
            <g fill="currentColor">
              {Array.from({ length: 16 }, (_, index) => {
                const x = (index % 4) * 9 + 4.5;
                const y = Math.floor(index / 4) * 9 + 4.5;
                const shape = (index + Math.floor(index / 4)) % 3;
                const opacity = 0.48 + ((index * 7) % 5) * 0.11;
                if (shape === 0) return <circle key={index} cx={x} cy={y} r="2.8" opacity={opacity} />;
                if (shape === 1)
                  return <rect key={index} x={x - 2.5} y={y - 2.5} width="5" height="5" opacity={opacity} />;
                return <path key={index} d={`M${x} ${y - 3}l3 5.5h-6z`} opacity={opacity} />;
              })}
            </g>
          </pattern>
          <mask id={`${id}-mask`}>
            <rect width="100%" height="100%" fill="white" />
            {layout && (
              <text
                x={layout.x}
                y={layout.y}
                textAnchor="middle"
                fill="black"
                fontFamily={FONT}
                fontWeight="600"
                fontSize={layout.font}
              >
                {WORD}
              </text>
            )}
          </mask>
        </defs>
        <g fill="currentColor">
          <rect width="100%" height="100%" fill={`url(#${id}-shapes)`} mask={`url(#${id}-mask)`} />
        </g>
      </svg>
      {eligible && visible && LiveWaves && layout && (
        <div className="ln-footer-art-live" style={box}>
          <LiveWaves
            text={WORD}
            fontFamily={FONT}
            fontWeight={600}
            textSize={2}
            shapes="mixed"
            cellSize={cellSize}
            dotSize={0.72}
            scale={1.2}
            fade={0}
            color={color}
            hoverColor={hoverColor}
            backgroundColor={backgroundColor}
            speed={0}
            flow={0}
            glow={0}
            intro={false}
            paused={!visible || !pageVisible}
            interactive={visible && pageVisible && capabilities.fine && !capabilities.reduced}
            onError={handleError}
          />
        </div>
      )}
    </div>
  );
}
