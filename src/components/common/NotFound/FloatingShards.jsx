import { useEffect, useRef } from 'react';
import { createGlassScene } from './glassScene';

const FloatingShards = ({ reducedMotion, theme, stageRef, reflectionRef, layoutKey }) => {
  const rootRef = useRef(null);
  const measureRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const plane = root.querySelector('.nf-shard-plane');
    const glass = createGlassScene(plane, theme);
    if (!glass) return undefined;

    const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const target = { x: 0, y: 0 };
    const pointer = { x: 0, y: 0, vx: 0, vy: 0 };
    let rect;
    let frame = 0;
    let last = 0;
    let time = 0;
    let sourceElapsed = 0;
    let sourceLast = 0;
    let sourceWidth = 0;
    let sourceHeight = 0;
    let inView = true;
    let disposed = false;
    const active = () => !disposed && inView && !document.hidden;

    const tick = now => {
      frame = 0;
      if (!active()) return;
      const dt = Math.min((now - (last || now)) / 1000, 0.032);
      last = now;
      if (!reducedMotion) {
        time += dt;
        // A critically damped spring keeps changes in direction continuous.
        for (const axis of ['x', 'y']) {
          const velocity = `v${axis}`;
          pointer[velocity] += ((target[axis] - pointer[axis]) * 36 - pointer[velocity] * 12) * dt;
          pointer[axis] += pointer[velocity] * dt;
        }
      }
      glass.render(time, pointer);
      if (!reducedMotion) frame = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!frame && active()) frame = requestAnimationFrame(tick);
    };
    const capture = canvas => {
      if (!active()) return;
      if (reducedMotion) {
        if (canvas.width !== sourceWidth || canvas.height !== sourceHeight) {
          sourceElapsed = 0;
          sourceLast = 0;
          sourceWidth = canvas.width;
          sourceHeight = canvas.height;
        }
        if (sourceElapsed >= 1.6) return;
        const now = performance.now();
        sourceElapsed += sourceLast ? Math.min((now - sourceLast) / 1000, 0.05) : 1 / 60;
        sourceLast = now;
      }
      glass.capture(canvas);
      wake();
    };
    reflectionRef.current = capture;

    const measure = () => {
      rect = root.getBoundingClientRect();
      glass.resize(plane.getBoundingClientRect(), stageRef.current?.getBoundingClientRect());
      wake();
    };
    measureRef.current = measure;
    const reset = () => {
      target.x = 0;
      target.y = 0;
    };
    const onMove = event => {
      if (reducedMotion || !pointerQuery.matches || event.pointerType !== 'mouse') return;
      target.x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1));
      target.y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1));
    };
    const onOut = event => {
      if (!event.relatedTarget) reset();
    };
    const playback = () => {
      root.dataset.paused = String(!active() || reducedMotion);
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      wake();
    };
    const resize = new ResizeObserver(measure);
    resize.observe(root);
    resize.observe(plane);
    if (stageRef.current) resize.observe(stageRef.current);
    const visibility = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      playback();
    });
    visibility.observe(root);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerout', onOut);
    window.addEventListener('blur', reset);
    window.addEventListener('scroll', measure, { passive: true });
    document.addEventListener('visibilitychange', playback);
    pointerQuery.addEventListener('change', reset);
    measure();

    return () => {
      disposed = true;
      if (measureRef.current === measure) measureRef.current = null;
      if (reflectionRef.current === capture) reflectionRef.current = null;
      cancelAnimationFrame(frame);
      resize.disconnect();
      visibility.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerout', onOut);
      window.removeEventListener('blur', reset);
      window.removeEventListener('scroll', measure);
      document.removeEventListener('visibilitychange', playback);
      pointerQuery.removeEventListener('change', reset);
      glass.dispose();
    };
  }, [reducedMotion, theme, stageRef, reflectionRef]);

  useEffect(() => {
    measureRef.current?.();
  }, [layoutKey]);

  return (
    <div ref={rootRef} className="nf-shards" aria-hidden="true" data-paused={reducedMotion}>
      <div className="nf-shard-plane" />
    </div>
  );
};

export default FloatingShards;
