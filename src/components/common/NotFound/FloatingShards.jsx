import { useEffect, useRef } from 'react';

import { SHARDS, PANE_WIDTH, PANE_HEIGHT } from './shardGeometry';

const FloatingShards = ({ reducedMotion }) => {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const elements = [...root.querySelectorAll('.nf-shard')];
    const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const target = { x: 0, y: 0 };
    const position = { x: 0, y: 0 };
    let rect = root.getBoundingClientRect();
    let frame = 0;
    let last = 0;
    let inView = true;

    const render = () => {
      elements.forEach((element, index) => {
        const depth = SHARDS[index].depth;
        element.style.transform = `translate3d(${position.x * depth * 8}px, ${position.y * depth * 6}px, 0) rotateX(${-position.y * depth * 2}deg) rotateY(${position.x * depth * 2}deg)`;
      });
    };

    const tick = now => {
      frame = 0;
      const dt = Math.min((now - (last || now)) / 1000, 0.05) || 1 / 60;
      last = now;
      const blend = 1 - Math.exp(-5 * dt);
      position.x += (target.x - position.x) * blend;
      position.y += (target.y - position.y) * blend;
      const settled = Math.abs(target.x - position.x) + Math.abs(target.y - position.y) < 0.001;
      if (settled) Object.assign(position, target);
      render();
      if (!settled) frame = requestAnimationFrame(tick);
      else last = 0;
    };

    const wake = () => {
      if (!frame && !reducedMotion && inView && !document.hidden) frame = requestAnimationFrame(tick);
    };

    const reset = () => {
      target.x = 0;
      target.y = 0;
      wake();
    };

    const onPointerMove = event => {
      if (reducedMotion || !pointerQuery.matches || event.pointerType !== 'mouse') return;
      const nx = (event.clientX - rect.left) / rect.width;
      const ny = (event.clientY - rect.top) / rect.height;
      target.x = Math.max(-1, Math.min(1, nx * 2 - 1));
      target.y = Math.max(-1, Math.min(1, ny * 2 - 1));
      wake();
    };

    const onPointerOut = event => {
      if (!event.relatedTarget) reset();
    };

    const syncPlayback = () => {
      const paused = reducedMotion || !inView || document.hidden;
      root.dataset.paused = String(paused);
      if (paused) {
        cancelAnimationFrame(frame);
        frame = 0;
        last = 0;
        if (reducedMotion) {
          position.x = 0;
          position.y = 0;
          render();
        }
      } else wake();
    };

    const measure = () => {
      rect = root.getBoundingClientRect();
    };
    const resize = new ResizeObserver(measure);
    resize.observe(root);
    const visibility = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncPlayback();
    });
    visibility.observe(root);
    syncPlayback();

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerout', onPointerOut);
    window.addEventListener('blur', reset);
    window.addEventListener('scroll', measure, { passive: true });
    document.addEventListener('visibilitychange', syncPlayback);
    pointerQuery.addEventListener('change', reset);

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      visibility.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerout', onPointerOut);
      window.removeEventListener('blur', reset);
      window.removeEventListener('scroll', measure);
      document.removeEventListener('visibilitychange', syncPlayback);
      pointerQuery.removeEventListener('change', reset);
    };
  }, [reducedMotion]);

  return (
    <div ref={rootRef} className="nf-shards" aria-hidden="true" data-paused={reducedMotion}>
      {SHARDS.map((shard, index) => (
        <div
          key={index}
          className="nf-shard"
          style={{
            '--shard-x': `${((shard.x + shard.offsetX) / PANE_WIDTH) * 100}%`,
            '--shard-y': `${((shard.y + shard.offsetY) / PANE_HEIGHT) * 100}%`,
            '--shard-width': `${(shard.width / PANE_WIDTH) * 100}%`,
            '--shard-height': `${(shard.height / PANE_HEIGHT) * 100}%`,
            '--shard-rotation': `${shard.rotation}deg`,
            '--shard-drift-x': `${shard.driftX}px`,
            '--shard-drift-y': `${shard.driftY}px`,
            '--shard-turn': `${shard.turn}deg`,
            '--shard-duration': `${shard.duration}s`,
            '--shard-delay': `${shard.delay}s`,
            '--shard-opacity': 0.65 + shard.depth * 0.3
          }}
        >
          <svg viewBox={`0 0 ${shard.width} ${shard.height}`} focusable="false" className="nf-shard-face">
            <polygon points={shard.points} vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      ))}
    </div>
  );
};

export default FloatingShards;
