'use client';

import { useRef, useEffect } from 'react';

export default function MagnetLines({
  rows = 9,
  columns = 9,
  containerSize = '80vmin',
  lineColor = '#efefef',
  lineWidth = '1vmin',
  lineHeight = '6vmin',
  baseAngle = -10,
  className = '',
  style = {}
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = container.querySelectorAll('span');
    let frameId = 0;

    const onPointerMove = pointer => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        const rects = Array.from(items, item => item.getBoundingClientRect());

        items.forEach((item, index) => {
          const rect = rects[index];
          const centerX = rect.x + rect.width / 2;
          const centerY = rect.y + rect.height / 2;

          const b = pointer.x - centerX;
          const a = pointer.y - centerY;
          const c = Math.sqrt(a * a + b * b) || 1;
          const r = ((Math.acos(b / c) * 180) / Math.PI) * (pointer.y > centerY ? 1 : -1);

          item.style.setProperty('--rotate', `${r}deg`);
        });
      });
    };

    window.addEventListener('pointermove', onPointerMove);

    if (items.length) {
      const middleIndex = Math.floor(items.length / 2);
      const rect = items[middleIndex].getBoundingClientRect();
      onPointerMove({ x: rect.x, y: rect.y });
    }

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, [rows, columns]);

  const total = rows * columns;
  const spans = Array.from({ length: total }, (_, i) => (
    <span
      key={i}
      className="block origin-center"
      style={{
        backgroundColor: lineColor,
        width: lineWidth,
        height: lineHeight,
        '--rotate': `${baseAngle}deg`,
        transform: 'rotate(var(--rotate))',
        willChange: 'transform'
      }}
    />
  ));

  return (
    <div
      ref={containerRef}
      className={`grid place-items-center ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        width: containerSize,
        height: containerSize,
        ...style
      }}
    >
      {spans}
    </div>
  );
}
