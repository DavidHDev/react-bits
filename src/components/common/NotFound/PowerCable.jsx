import { useEffect, useLayoutEffect, useRef } from 'react';

const POINTS = 28;
const GRAVITY = 2600;
const ITERATIONS = 18;
const DAMPING = 0.985;
const FLOOR_FRICTION = 0.6;
const SNAP_RADIUS = 60;
const DRAG_THRESHOLD = 4;
const PLUG_BODY = 15;
const PLUG_HEIGHT = 9;
const PRONG = 5;
const OUTLET_W = 22;
const OUTLET_H = 18;
const CABLE_RADIUS = 1.2;
const EDGE = 12;
const SETTLE_FRAMES = 40;
const SLACK = 1.28;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const PowerCable = ({ stageRef, anchorRef, plugged, powered, onPlugChange, reducedMotion, layoutKey }) => {
  const rootRef = useRef(null);
  const svgRef = useRef(null);
  const cableRef = useRef(null);
  const shineRef = useRef(null);
  const plugRef = useRef(null);
  const outletRef = useRef(null);
  const ledRef = useRef(null);
  const floorRef = useRef(null);
  const handleRef = useRef(null);
  const sim = useRef(null);
  const raf = useRef(0);
  const wake = useRef(() => {});
  const settle = useRef(() => {});
  const pluggedRef = useRef(plugged);
  const onPlugChangeRef = useRef(onPlugChange);
  const reducedMotionRef = useRef(reducedMotion);

  onPlugChangeRef.current = onPlugChange;
  reducedMotionRef.current = reducedMotion;

  useLayoutEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return undefined;

    const x = new Float32Array(POINTS);
    const y = new Float32Array(POINTS);
    const px = new Float32Array(POINTS);
    const py = new Float32Array(POINTS);
    const s = {
      x,
      y,
      px,
      py,
      mode: pluggedRef.current ? 'plugged' : 'free',
      target: { x: 0, y: 0 },
      angle: 0,
      still: 0,
      geometry: null,
      drag: null,
      suppressClick: false
    };
    sim.current = s;

    const measure = () => {
      const anchorEl = anchorRef.current;
      if (!anchorEl) return null;
      const rootRect = root.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      const a = anchorEl.getBoundingClientRect();
      const width = rootRect.width;
      const anchor = { x: a.left + a.width / 2 - rootRect.left, y: a.top + a.height / 2 - rootRect.top };
      const glyph = anchorEl.ownerSVGElement?.getBoundingClientRect() ?? stageRect;
      const gap = clamp(glyph.height * 0.12, 8, 28);
      const floorY = anchor.y + gap;
      const reach = Math.max(56, glyph.width * 0.26);
      const room = width - EDGE - 8 - anchor.x;
      const side = room >= reach * 0.75 + OUTLET_W ? 1 : -1;
      const outletX =
        side > 0
          ? Math.min(anchor.x + reach, width - EDGE - 8 - OUTLET_W)
          : Math.max(anchor.x - reach - OUTLET_W, EDGE + 8);
      const seat = {
        x: side > 0 ? outletX - PLUG_BODY : outletX + OUTLET_W + PLUG_BODY,
        y: floorY - OUTLET_H / 2
      };
      stage.style.setProperty('--nf-reflect', `${Math.round(2 * (floorY - (stageRect.bottom - rootRect.top)))}px`);
      return {
        width,
        height: rootRect.height,
        anchor,
        floorY,
        outletX,
        seat,
        side,
        seated: side > 0 ? 0 : Math.PI,
        rest: Math.max(40, glyph.width * 0.16),
        floorFrom: Math.max(0, glyph.left - rootRect.left - glyph.width * 0.45),
        floorTo: Math.min(width, glyph.right - rootRect.left + glyph.width * 0.45)
      };
    };

    const step = dt => {
      const g = s.geometry;
      const free = s.mode === 'free';
      const end = free ? POINTS : POINTS - 1;
      const pull = GRAVITY * dt * dt;
      for (let i = 1; i < end; i++) {
        const vx = (x[i] - px[i]) * DAMPING;
        const vy = (y[i] - py[i]) * DAMPING;
        px[i] = x[i];
        py[i] = y[i];
        x[i] += vx;
        y[i] += vy + pull;
      }
      if (s.mode === 'snapping') {
        s.target.x += (g.seat.x - s.target.x) * 0.32;
        s.target.y += (g.seat.y - s.target.y) * 0.32;
        if (Math.hypot(g.seat.x - s.target.x, g.seat.y - s.target.y) < 0.5) {
          s.target.x = g.seat.x;
          s.target.y = g.seat.y;
          s.mode = 'plugged';
        }
      }
      const cableFloor = g.floorY - CABLE_RADIUS;
      const plugFloor = g.floorY - PLUG_HEIGHT / 2;
      for (let k = 0; k < ITERATIONS; k++) {
        x[0] = g.anchor.x;
        y[0] = g.anchor.y;
        if (!free) {
          x[POINTS - 1] = s.target.x;
          y[POINTS - 1] = s.target.y;
        }
        for (let i = 0; i < POINTS - 1; i++) {
          const dx = x[i + 1] - x[i];
          const dy = y[i + 1] - y[i];
          const dist = Math.hypot(dx, dy) || 1e-6;
          const diff = (dist - g.segment) / dist;
          const w0 = i === 0 ? 0 : 1;
          const w1 = i + 1 === POINTS - 1 && !free ? 0 : 1;
          const total = w0 + w1;
          if (!total) continue;
          x[i] += (dx * diff * w0) / total;
          y[i] += (dy * diff * w0) / total;
          x[i + 1] -= (dx * diff * w1) / total;
          y[i + 1] -= (dy * diff * w1) / total;
        }
        for (let i = 1; i < POINTS; i++) {
          const floor = i === POINTS - 1 ? plugFloor : cableFloor;
          if (y[i] > floor) y[i] = floor;
          x[i] = clamp(x[i], EDGE, g.width - EDGE);
        }
      }
      for (let i = 1; i < POINTS; i++) {
        const floor = i === POINTS - 1 ? plugFloor : cableFloor;
        if (y[i] >= floor - 0.01) {
          py[i] = y[i];
          px[i] = x[i] - (x[i] - px[i]) * FLOOR_FRICTION;
        }
      }
    };

    const render = () => {
      const g = s.geometry;
      if (!g) return;
      let d = `M${x[0].toFixed(1)} ${y[0].toFixed(1)}`;
      for (let i = 1; i < POINTS - 1; i++) {
        const mx = (x[i] + x[i + 1]) / 2;
        const my = (y[i] + y[i + 1]) / 2;
        d += `Q${x[i].toFixed(1)} ${y[i].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
      }
      const tailX = x[POINTS - 1];
      const tailY = y[POINTS - 1];
      d += `L${tailX.toFixed(1)} ${tailY.toFixed(1)}`;
      cableRef.current?.setAttribute('d', d);
      shineRef.current?.setAttribute('d', d);

      let aim = Math.atan2(tailY - y[POINTS - 2], tailX - x[POINTS - 2]);
      if (s.mode === 'plugged' || s.mode === 'snapping') aim = g.seated;
      else if (s.mode === 'free' && tailY >= g.floorY - PLUG_HEIGHT / 2 - 0.5) {
        aim = Math.cos(aim) >= 0 ? 0 : Math.PI;
      }
      let delta = aim - s.angle;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      s.angle += delta * (s.mode === 'dragging' ? 0.5 : 0.28);
      const degrees = (s.angle * 180) / Math.PI;
      plugRef.current?.setAttribute(
        'transform',
        `translate(${tailX.toFixed(1)} ${tailY.toFixed(1)}) rotate(${degrees.toFixed(1)})`
      );

      const cx = tailX + Math.cos(s.angle) * (PLUG_BODY / 2);
      const cy = tailY + Math.sin(s.angle) * (PLUG_BODY / 2);
      if (handleRef.current) handleRef.current.style.transform = `translate(${cx - 22}px, ${cy - 22}px)`;
    };

    const layout = ({ keepPlug }) => {
      const g = measure();
      if (!g) return;
      const previous = s.geometry;
      const span = Math.hypot(g.seat.x - g.anchor.x, g.seat.y - g.anchor.y);
      g.segment = (span * SLACK + 36) / (POINTS - 1);
      s.geometry = g;

      svgRef.current?.setAttribute('viewBox', `0 0 ${g.width} ${g.height}`);
      outletRef.current?.setAttribute(
        'transform',
        g.side > 0
          ? `translate(${g.outletX} ${g.floorY - OUTLET_H})`
          : `translate(${g.outletX + OUTLET_W} ${g.floorY - OUTLET_H}) scale(-1 1)`
      );
      if (floorRef.current) {
        floorRef.current.setAttribute('x1', String(g.floorFrom));
        floorRef.current.setAttribute('x2', String(g.floorTo));
        floorRef.current.setAttribute('y1', String(g.floorY));
        floorRef.current.setAttribute('y2', String(g.floorY));
      }

      let tail;
      if (s.mode === 'plugged' || s.mode === 'snapping' || !keepPlug || !previous) {
        tail = pluggedRef.current ? { ...g.seat } : { x: g.seat.x - g.rest * g.side, y: g.floorY - PLUG_HEIGHT / 2 };
        if (pluggedRef.current) s.mode = 'plugged';
      } else {
        tail = {
          x: clamp((x[POINTS - 1] / previous.width) * g.width, EDGE, g.width - EDGE),
          y: g.floorY - PLUG_HEIGHT / 2
        };
      }
      s.target = { ...tail };
      for (let i = 0; i < POINTS; i++) {
        const t = i / (POINTS - 1);
        x[i] = g.anchor.x + (tail.x - g.anchor.x) * t;
        y[i] = g.anchor.y + (tail.y - g.anchor.y) * t + Math.sin(Math.PI * t) * 24;
        px[i] = x[i];
        py[i] = y[i];
      }
      for (let n = 0; n < 240; n++) step(1 / 120);
      for (let i = 0; i < POINTS; i++) {
        px[i] = x[i];
        py[i] = y[i];
      }
      s.angle = s.mode === 'plugged' ? g.seated : s.angle;
      render();
    };

    let last = 0;
    const tick = now => {
      raf.current = 0;
      const dt = Math.min((now - (last || now)) / 1000, 1 / 30) || 1 / 60;
      last = now;
      const substeps = 2;
      for (let n = 0; n < substeps; n++) step(dt / substeps);
      render();
      let motion = 0;
      for (let i = 0; i < POINTS; i++) motion += Math.abs(x[i] - px[i]) + Math.abs(y[i] - py[i]);
      s.still = motion < 0.04 && s.mode !== 'dragging' && s.mode !== 'snapping' ? s.still + 1 : 0;
      if (s.still < SETTLE_FRAMES) raf.current = requestAnimationFrame(tick);
      else last = 0;
    };

    wake.current = () => {
      s.still = 0;
      if (!raf.current) raf.current = requestAnimationFrame(tick);
    };

    settle.current = () => {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
      last = 0;
      if (s.mode === 'snapping') {
        s.target = { ...s.geometry.seat };
        s.mode = 'plugged';
      }
      for (let n = 0; n < 240; n++) step(1 / 120);
      for (let i = 0; i < POINTS; i++) {
        px[i] = x[i];
        py[i] = y[i];
      }
      s.angle = s.mode === 'plugged' ? s.geometry.seated : s.angle;
      render();
    };

    layout({ keepPlug: false });

    const observer = new ResizeObserver(() => {
      layout({ keepPlug: true });
      if (reducedMotionRef.current) settle.current();
      else wake.current();
    });
    observer.observe(root);
    observer.observe(stage);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [anchorRef, stageRef, layoutKey]);

  useEffect(() => {
    pluggedRef.current = plugged;
    const s = sim.current;
    if (!s?.geometry) return;
    if (plugged && s.mode !== 'plugged' && s.mode !== 'snapping') {
      s.target = { x: s.x[POINTS - 1], y: s.y[POINTS - 1] };
      s.mode = 'snapping';
    }
    if (!plugged && (s.mode === 'plugged' || s.mode === 'snapping')) {
      s.mode = 'free';
      const kick = reducedMotion ? 0 : 1;
      s.px[POINTS - 1] = s.x[POINTS - 1] + 9 * kick;
      s.py[POINTS - 1] = s.y[POINTS - 1] + 7 * kick;
    }
    if (reducedMotion && s.mode !== 'dragging') settle.current();
    else wake.current();
  }, [plugged, reducedMotion]);

  useEffect(() => {
    ledRef.current?.setAttribute('data-on', powered ? 'true' : 'false');
  }, [powered]);

  const toRoot = event => {
    const rect = rootRef.current.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const onPointerDown = event => {
    if (event.button !== 0) return;
    const s = sim.current;
    if (!s?.geometry || s.drag) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    s.suppressClick = false;
    const point = toRoot(event);
    s.drag = {
      id: event.pointerId,
      start: point,
      offset: { x: s.x[POINTS - 1] - point.x, y: s.y[POINTS - 1] - point.y },
      moved: false
    };
  };

  const onPointerMove = event => {
    const s = sim.current;
    const drag = s?.drag;
    if (!drag || drag.id !== event.pointerId) return;
    const point = toRoot(event);
    if (!drag.moved && Math.hypot(point.x - drag.start.x, point.y - drag.start.y) < DRAG_THRESHOLD) return;
    if (!drag.moved) {
      drag.moved = true;
      s.mode = 'dragging';
      if (pluggedRef.current) {
        pluggedRef.current = false;
        onPlugChangeRef.current(false);
      }
    }
    const g = s.geometry;
    const reach = g.segment * (POINTS - 1) * 0.97;
    let tx = point.x + drag.offset.x;
    let ty = point.y + drag.offset.y;
    const dx = tx - g.anchor.x;
    const dy = ty - g.anchor.y;
    const dist = Math.hypot(dx, dy);
    if (dist > reach) {
      tx = g.anchor.x + (dx / dist) * reach;
      ty = g.anchor.y + (dy / dist) * reach;
    }
    s.target = { x: tx, y: Math.min(ty, g.floorY - PLUG_HEIGHT / 2) };
    wake.current();
  };

  const onPointerUp = event => {
    const s = sim.current;
    const drag = s?.drag;
    if (!drag || drag.id !== event.pointerId) return;
    s.drag = null;
    if (!drag.moved) return;
    s.suppressClick = true;
    const g = s.geometry;
    const tail = { x: s.x[POINTS - 1], y: s.y[POINTS - 1] };
    if (Math.hypot(tail.x - g.seat.x, tail.y - g.seat.y) < SNAP_RADIUS) {
      s.target = tail;
      s.mode = 'snapping';
      pluggedRef.current = true;
      onPlugChangeRef.current(true);
    } else {
      s.mode = 'free';
    }
    if (reducedMotion) settle.current();
    else wake.current();
  };

  const onPointerCancel = event => {
    const s = sim.current;
    const drag = s?.drag;
    if (!drag || drag.id !== event.pointerId) return;
    s.drag = null;
    s.suppressClick = false;
    if (!drag.moved) return;
    s.mode = 'free';
    if (reducedMotion) settle.current();
    else wake.current();
  };

  const onClick = event => {
    const s = sim.current;
    if (s?.drag) return;
    if (s?.suppressClick) {
      s.suppressClick = false;
      if (event.detail !== 0) return;
    }
    onPlugChangeRef.current(!pluggedRef.current);
  };

  return (
    <div ref={rootRef} className="nf-cable">
      <svg ref={svgRef} className="nf-cable-svg" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="nf-floor-fade" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="currentColor" stopOpacity="0" />
            <stop offset="0.5" stopColor="currentColor" stopOpacity="1" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line ref={floorRef} className="nf-floor" x1="0" x2="0" y1="0" y2="0" stroke="url(#nf-floor-fade)" />
        <path ref={cableRef} className="nf-cable-line" />
        <path ref={shineRef} className="nf-cable-shine" />
        <g ref={plugRef} className="nf-plug">
          <rect x={-4} y={-2.25} width={4.5} height={4.5} rx={1.2} className="nf-plug-neck" />
          <rect x={0} y={-PLUG_HEIGHT / 2} width={PLUG_BODY} height={PLUG_HEIGHT} rx={2} className="nf-plug-body" />
          <rect x={PLUG_BODY} y={-3} width={PRONG} height={1.2} rx={0.5} className="nf-plug-prong" />
          <rect x={PLUG_BODY} y={1.8} width={PRONG} height={1.2} rx={0.5} className="nf-plug-prong" />
        </g>
        <g ref={outletRef} className="nf-outlet">
          <rect width={OUTLET_W} height={OUTLET_H} rx={2.8} className="nf-outlet-body" />
          <rect x={-0.5} y={OUTLET_H / 2 - 3.75} width={2.4} height={7.5} rx={0.8} className="nf-outlet-slot" />
          <circle ref={ledRef} cx={OUTLET_W - 5.5} cy={5.5} r={1.4} className="nf-outlet-led" data-on="true" />
        </g>
      </svg>
      <button
        ref={handleRef}
        type="button"
        role="switch"
        aria-checked={plugged}
        aria-label="Sign power cable"
        className="nf-plug-handle"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onLostPointerCapture={onPointerCancel}
        onClick={onClick}
      />
    </div>
  );
};

export default PowerCable;
