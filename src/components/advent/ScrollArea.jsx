import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const MIN_THUMB = 32;
const LINE = 16;

const AXES = {
  x: {
    size: 'clientWidth',
    full: 'scrollWidth',
    scroll: 'scrollLeft',
    pointer: 'clientX',
    edge: 'left',
    length: 'width',
    shift: 'translateX'
  },
  y: {
    size: 'clientHeight',
    full: 'scrollHeight',
    scroll: 'scrollTop',
    pointer: 'clientY',
    edge: 'top',
    length: 'height',
    shift: 'translateY'
  }
};

const place = (view, track, thumb, axis) => {
  const visible = view[axis.size];
  const range = view[axis.full] - visible;
  if (range <= 1) return false;
  const room = track[axis.size];
  if (!room) return true;
  const length = Math.min(room, Math.max(MIN_THUMB, Math.round((room * visible) / view[axis.full])));
  const offset = (room - length) * Math.min(1, Math.max(0, view[axis.scroll] / range));
  thumb.style[axis.length] = `${length}px`;
  thumb.style.transform = `${axis.shift}(${offset.toFixed(2)}px)`;
  return true;
};

const ScrollArea = ({ className = '', label, resetKey, children }) => {
  const root = useRef(null);
  const view = useRef(null);
  const content = useRef(null);
  const trackX = useRef(null);
  const thumbX = useRef(null);
  const trackY = useRef(null);
  const thumbY = useRef(null);
  const drag = useRef(null);
  const [overflow, setOverflow] = useState({ x: false, y: false });
  const [dragging, setDragging] = useState(null);

  const measure = useCallback(() => {
    const node = view.current;
    if (!node) return;
    const x = place(node, trackX.current, thumbX.current, AXES.x);
    const y = place(node, trackY.current, thumbY.current, AXES.y);
    setOverflow(state => (state.x === x && state.y === y ? state : { x, y }));
  }, []);

  useEffect(() => {
    const node = view.current;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    observer.observe(content.current);
    node.addEventListener('scroll', measure, { passive: true });
    return () => {
      observer.disconnect();
      node.removeEventListener('scroll', measure);
    };
  }, [measure]);

  useEffect(() => {
    const node = root.current;
    const forward = event => {
      const target = view.current;
      if (event.ctrlKey || target.contains(event.target)) return;
      const unit = event.deltaMode === 1 ? LINE : 1;
      const left = target.scrollLeft;
      const top = target.scrollTop;
      target.scrollLeft += event.deltaX * unit;
      target.scrollTop += event.deltaY * unit;
      if (target.scrollLeft !== left || target.scrollTop !== top) event.preventDefault();
    };
    node.addEventListener('wheel', forward, { passive: false });
    return () => node.removeEventListener('wheel', forward);
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [measure, overflow]);

  useLayoutEffect(() => {
    view.current.scrollTop = 0;
    view.current.scrollLeft = 0;
    measure();
  }, [measure, resetKey]);

  const press = (name, track, thumb, event) => {
    if (event.button !== 0) return;
    const axis = AXES[name];
    const node = view.current;
    const rail = track.getBoundingClientRect();
    const grip = thumb.getBoundingClientRect();
    const travel = rail[axis.length] - grip[axis.length];
    const range = node[axis.full] - node[axis.size];
    if (travel <= 0 || range <= 0) return;
    event.preventDefault();
    const held = event.target === thumb;
    const hold = held ? event[axis.pointer] - grip[axis.edge] : grip[axis.length] / 2;
    const start = rail[axis.edge] + hold;
    const scale = range / travel;
    drag.current = { axis, start, scale };
    if (!held) node[axis.scroll] = (event[axis.pointer] - start) * scale;
    track.setPointerCapture(event.pointerId);
    setDragging(name);
  };

  const move = event => {
    const state = drag.current;
    if (!state) return;
    view.current[state.axis.scroll] = (event[state.axis.pointer] - state.start) * state.scale;
  };

  const release = () => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(null);
  };

  const bar = (name, track, thumb) => (
    <div
      ref={track}
      className={`agv-scroll-track agv-scroll-track--${name}${dragging === name ? ' is-dragging' : ''}`}
      aria-hidden="true"
      onPointerDown={event => press(name, track.current, thumb.current, event)}
      onPointerMove={move}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
    >
      <div ref={thumb} className="agv-scroll-thumb" />
    </div>
  );

  const state = `${overflow.x ? ' has-x' : ''}${overflow.y ? ' has-y' : ''}`;

  return (
    <div ref={root} className={`agv-scroll${state}${className ? ` ${className}` : ''}`}>
      <div ref={view} className="agv-scroll-view" tabIndex={0} role="region" aria-label={label}>
        <div ref={content} className="agv-scroll-content">
          {children}
        </div>
      </div>
      {bar('y', trackY, thumbY)}
      {bar('x', trackX, thumbX)}
    </div>
  );
};

export default ScrollArea;
