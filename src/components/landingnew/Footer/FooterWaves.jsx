'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useColorModeValue } from '../../setup/color-mode';

export default function FooterWaves() {
  const rootRef = useRef(null);
  const fallbackTextRef = useRef(null);
  const id = useId().replace(/:/g, '');
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [LiveWaves, setLiveWaves] = useState(null);
  const [failed, setFailed] = useState(false);
  const [cellSize, setCellSize] = useState(9);
  const [capabilities, setCapabilities] = useState({ gpu: false, fine: false, reduced: true });
  const color = useColorModeValue('#8d8498', '#655a72');
  const hoverColor = useColorModeValue('#7f4ecb', '#cba6f7');
  const backgroundColor = useColorModeValue('#ffffff', '#120f17');
  const handleError = useCallback(() => setFailed(true), []);
  const eligible = capabilities.gpu && !capabilities.reduced && !failed;

  useEffect(() => {
    const root = rootRef.current;
    const text = fallbackTextRef.current;
    if (!root || !text) return;
    let cancelled = false;
    const centerText = () => {
      if (cancelled) return;
      setCellSize(Math.min(9, Math.max(3, Math.round(root.clientWidth / 135))));
      const bounds = text.getBBox();
      const x = root.clientWidth / 2 - bounds.x - bounds.width / 2;
      const y = root.clientHeight / 2 - bounds.y - bounds.height / 2;
      text.setAttribute('transform', `translate(${x} ${y})`);
    };
    const observer = new ResizeObserver(centerText);
    observer.observe(root);
    document.fonts.ready.then(centerText);
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

  return (
    <div ref={rootRef} className="ln-footer-art" aria-hidden="true">
      <svg className="ln-footer-art-fallback" width="100%" height="100%" focusable="false">
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
            <text
              ref={fallbackTextRef}
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="central"
              fill="black"
              fontFamily={'Geist, "Geist Sans", system-ui, sans-serif'}
              fontWeight="600"
              letterSpacing="-0.055em"
              style={{ fontSize: 'clamp(58px, 18vw, 220px)' }}
            >
              React Bits
            </text>
          </mask>
        </defs>
        <g fill="currentColor">
          <rect width="100%" height="100%" fill={`url(#${id}-shapes)`} mask={`url(#${id}-mask)`} />
        </g>
      </svg>
      {eligible && visible && LiveWaves && (
        <div className="ln-footer-art-live">
          <LiveWaves
            text="React Bits"
            fontWeight={600}
            textSize={0.8}
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
