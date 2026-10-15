import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ratioOf } from '../state/doc';
import {
  RAD,
  artboardHalf,
  copyBounds,
  halfExtents,
  hitCopy,
  hitLayer,
  intersects,
  layerBounds,
  movedSeed,
  positionFor,
  rotate,
  seedBounds,
  seedFrame,
  snapAxis,
  unionBounds,
  wrapDegrees
} from '../state/geometry';

const SNAP_PX = 6;
const DRAG_PX = 3;

const softSnapRotation = (rotation, shift) => {
  if (shift) return Math.round(rotation / 15) * 15;
  const nearest = Math.round(rotation / 45) * 45;
  return Math.abs(rotation - nearest) < 3 ? nearest : rotation;
};

export default function Stage({
  canvasRef,
  doc,
  selection,
  onSelect,
  onLayersChange,
  onDuplicate,
  onEditText,
  onMeasure,
  material,
  dropping,
  hint,
  snapping = true,
  padding = 40,
  onUpload,
  onPointerFeed
}) {
  const stageRef = useRef(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [hover, setHover] = useState(null);
  const [guides, setGuides] = useState(null);
  const [marquee, setMarquee] = useState(null);
  const ratio = ratioOf(doc.artboard);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const measure = () => setBox({ width: stage.clientWidth, height: stage.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const availW = Math.max(0, box.width - padding * 2);
  const availH = Math.max(0, box.height - padding * 2 - (hint ? 28 : 0));
  const fit = Math.min(availW / ratio.w, availH / ratio.h);
  const width = Math.max(0, Math.floor(ratio.w * fit));
  const height = Math.max(0, Math.floor(ratio.h * fit));
  const unit = Math.min(width, height) / 2;

  useLayoutEffect(() => {
    if (width && height) onMeasure({ width, height });
  }, [width, height, onMeasure]);

  const pointFrom = useCallback(
    (event, surface) => {
      const rect = surface.getBoundingClientRect();
      return [(event.clientX - rect.left - width / 2) / unit, (event.clientY - rect.top - height / 2) / unit];
    },
    [width, height, unit]
  );

  const mark = doc.mark;
  const visible = mark.layers.filter(layer => layer.visible !== false);
  const selectedLayers = visible.filter(layer => selection.includes(layer.id));
  const single = selectedLayers.length === 1 ? selectedLayers[0] : null;
  const group = selectedLayers.length > 1 ? unionBounds(selectedLayers.map(layer => layerBounds(layer, mark))) : null;

  const follow = (event, onMove, onEnd) => {
    const target = event.currentTarget;
    target.setPointerCapture?.(event.pointerId);
    const move = moveEvent => onMove(moveEvent);
    const end = endEvent => {
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', end);
      target.removeEventListener('pointercancel', end);
      target.removeEventListener('lostpointercapture', end);
      onEnd?.(endEvent);
    };
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', end);
    target.addEventListener('pointercancel', end);
    target.addEventListener('lostpointercapture', end);
  };

  const startMove = (event, layers, { surface, clickId = null } = {}) => {
    const start = pointFrom(event, surface);
    const key = `move-${Date.now()}`;
    let moving = layers;
    let duplicated = false;
    const solo = layers.length === 1;
    const hit = solo ? hitCopy(start, layers[0], mark) : null;
    const origins = layers.map(layer => seedFrame(layer, mark).center);
    const seeds = layers.map(layer => ({ x: layer.x ?? 0, y: layer.y ?? 0 }));
    const startBounds = solo
      ? copyBounds(layers[0], mark, hit)
      : unionBounds(layers.map(layer => layerBounds(layer, mark)));
    const others = visible.filter(layer => !layers.some(item => item.id === layer.id));
    const targetsX = [0];
    const targetsY = [0];
    others.forEach(layer => {
      const bounds = seedBounds(layer, mark);
      targetsX.push(bounds.minX, bounds.cx, bounds.maxX);
      targetsY.push(bounds.minY, bounds.cy, bounds.maxY);
    });
    let moved = false;
    follow(
      event,
      moveEvent => {
        const point = pointFrom(moveEvent, surface);
        let dx = point[0] - start[0];
        let dy = point[1] - start[1];
        if (!moved && Math.hypot(dx, dy) * unit < DRAG_PX) return;
        if (!moved && moveEvent.altKey && !duplicated) {
          duplicated = true;
          const copies = onDuplicate(
            layers.map(layer => layer.id),
            key
          );
          if (copies?.length) moving = copies;
        }
        moved = true;
        if (moveEvent.shiftKey) {
          if (Math.abs(dx) > Math.abs(dy)) dy = 0;
          else dx = 0;
        }
        let snapX = null;
        let snapY = null;
        if (snapping && !(moveEvent.metaKey || moveEvent.ctrlKey)) {
          const threshold = SNAP_PX / unit;
          if (!moveEvent.shiftKey || dx !== 0) {
            snapX = snapAxis([startBounds.minX + dx, startBounds.cx + dx, startBounds.maxX + dx], targetsX, threshold);
            if (snapX) dx += snapX.diff;
          }
          if (!moveEvent.shiftKey || dy !== 0) {
            snapY = snapAxis([startBounds.minY + dy, startBounds.cy + dy, startBounds.maxY + dy], targetsY, threshold);
            if (snapY) dy += snapY.diff;
          }
        }
        setGuides(snapX || snapY ? { x: snapX?.target ?? null, y: snapY?.target ?? null } : null);
        const patches = {};
        moving.forEach((layer, index) => {
          patches[layer.id] = solo
            ? movedSeed(layers[index], mark, seeds[index], [dx, dy], hit)
            : positionFor(layer, mark, [origins[index][0] + dx, origins[index][1] + dy]);
        });
        onLayersChange(patches, key);
      },
      () => {
        setGuides(null);
        if (!moved && clickId && selection.length > 1) onSelect([clickId]);
      }
    );
  };

  const startScale = (event, layers, pivot) => {
    event.preventDefault();
    event.stopPropagation();
    const surface = event.currentTarget.closest('.smg-artboard');
    const start = pointFrom(event, surface);
    const startDistance = Math.max(Math.hypot(start[0] - pivot[0], start[1] - pivot[1]), 1e-3);
    const origins = layers.map(layer => ({ center: seedFrame(layer, mark).center, size: layer.size ?? 1 }));
    const key = `scale-${Date.now()}`;
    follow(event, moveEvent => {
      const point = pointFrom(moveEvent, surface);
      const factor = Math.max(Math.hypot(point[0] - pivot[0], point[1] - pivot[1]), 1e-3) / startDistance;
      const patches = {};
      layers.forEach((layer, index) => {
        const origin = origins[index];
        const size = Math.min(3, Math.max(0.02, origin.size * factor));
        const scale = size / origin.size;
        const patch = { size: Math.round(size * 1000) / 1000 };
        if (layers.length > 1) {
          Object.assign(
            patch,
            positionFor(layer, mark, [
              pivot[0] + (origin.center[0] - pivot[0]) * scale,
              pivot[1] + (origin.center[1] - pivot[1]) * scale
            ])
          );
        }
        patches[layer.id] = patch;
      });
      onLayersChange(patches, key);
    });
  };

  const startRotate = (event, layers, pivot) => {
    event.preventDefault();
    event.stopPropagation();
    const surface = event.currentTarget.closest('.smg-artboard');
    const start = pointFrom(event, surface);
    const startAngle = Math.atan2(start[1] - pivot[1], start[0] - pivot[0]);
    const origins = layers.map(layer => ({ center: seedFrame(layer, mark).center, rotation: layer.rotation ?? 0 }));
    const key = `rotate-${Date.now()}`;
    follow(event, moveEvent => {
      const point = pointFrom(moveEvent, surface);
      let delta = (Math.atan2(point[1] - pivot[1], point[0] - pivot[0]) - startAngle) / RAD;
      if (layers.length > 1) delta = softSnapRotation(delta, moveEvent.shiftKey);
      const patches = {};
      layers.forEach((layer, index) => {
        const origin = origins[index];
        let rotation = origin.rotation + delta;
        if (layers.length === 1) rotation = softSnapRotation(rotation, moveEvent.shiftKey);
        const patch = { rotation: Math.round(wrapDegrees(rotation) * 10) / 10 };
        if (layers.length > 1) {
          const offset = rotate([origin.center[0] - pivot[0], origin.center[1] - pivot[1]], delta * RAD);
          Object.assign(patch, positionFor(layer, mark, [pivot[0] + offset[0], pivot[1] + offset[1]]));
        }
        patches[layer.id] = patch;
      });
      onLayersChange(patches, key);
    });
  };

  const startMarquee = (event, surface, additive) => {
    const start = pointFrom(event, surface);
    const base = additive ? selection : [];
    let dragged = false;
    follow(
      event,
      moveEvent => {
        const point = pointFrom(moveEvent, surface);
        if (!dragged && Math.hypot(point[0] - start[0], point[1] - start[1]) * unit < DRAG_PX) return;
        dragged = true;
        const rect = {
          minX: Math.min(start[0], point[0]),
          maxX: Math.max(start[0], point[0]),
          minY: Math.min(start[1], point[1]),
          maxY: Math.max(start[1], point[1])
        };
        setMarquee(rect);
        const hits = visible.filter(layer => intersects(layerBounds(layer, mark), rect)).map(layer => layer.id);
        onSelect([...new Set([...base, ...hits])]);
      },
      () => {
        setMarquee(null);
        if (!dragged && !additive) onSelect([]);
      }
    );
  };

  const feed = (type, event) => {
    if (!onPointerFeed) return;
    const rect = event.currentTarget.getBoundingClientRect();
    onPointerFeed(type, event.clientX - rect.left, event.clientY - rect.top, event.buttons);
  };

  const onPointerDown = event => {
    feed('down', event);
    if (event.button !== 0) return;
    const surface = event.currentTarget;
    const point = pointFrom(event, surface);
    const layer = hitLayer(point, mark);
    const toggle = event.shiftKey || event.metaKey || event.ctrlKey;
    if (!layer) {
      startMarquee(event, surface, toggle);
      return;
    }
    if (toggle) {
      const next = selection.includes(layer.id) ? selection.filter(id => id !== layer.id) : [...selection, layer.id];
      onSelect(next);
      return;
    }
    if (selection.includes(layer.id)) {
      startMove(event, selectedLayers, { surface, clickId: layer.id });
      return;
    }
    onSelect([layer.id]);
    startMove(event, [layer], { surface });
  };

  const onSelectionDown = event => {
    if (event.button !== 0) return;
    event.stopPropagation();
    const surface = event.currentTarget.closest('.smg-artboard');
    if (event.shiftKey || event.metaKey || event.ctrlKey) {
      const layer = hitLayer(pointFrom(event, surface), mark);
      if (layer) {
        onSelect(selection.includes(layer.id) ? selection.filter(id => id !== layer.id) : [...selection, layer.id]);
      }
      return;
    }
    const layer = hitLayer(pointFrom(event, surface), mark);
    if (layer && !selection.includes(layer.id)) {
      onSelect([layer.id]);
      startMove(event, [layer], { surface });
      return;
    }
    startMove(event, selectedLayers, { surface, clickId: layer?.id ?? null });
  };

  const onPointerMove = event => {
    feed('move', event);
    if (event.buttons) return;
    const layer = hitLayer(pointFrom(event, event.currentTarget), mark);
    setHover(layer && !selection.includes(layer.id) ? layer.id : null);
  };

  const onDoubleClick = event => {
    const layer = hitLayer(pointFrom(event, event.currentTarget), mark);
    if (layer?.type === 'text') onEditText?.(layer.id);
  };

  const toPx = ([x, y]) => [width / 2 + x * unit, height / 2 + y * unit];
  const transformFor = frame => {
    const [x, y] = toPx(frame.center);
    return `translate(${x} ${y}) rotate(${frame.angle / RAD})`;
  };

  const outlineFor = (layer, className) => {
    const frame = seedFrame(layer, mark);
    const [hw, hh] = halfExtents(layer);
    return (
      <g key={`${className}-${layer.id}`} transform={transformFor(frame)}>
        <rect
          className={className}
          x={-hw * frame.scale * unit}
          y={-hh * frame.scale * unit}
          width={hw * frame.scale * unit * 2}
          height={hh * frame.scale * unit * 2}
          rx="6"
        />
      </g>
    );
  };

  const hovered = hover ? visible.find(layer => layer.id === hover) : null;
  const [halfW, halfH] = artboardHalf(doc.artboard);
  const transparent = doc.artboard.background.kind === 'none';

  let handles = null;
  if (single) {
    const frame = seedFrame(single, mark);
    const [hw, hh] = halfExtents(single);
    const w = hw * frame.scale * unit;
    const h = hh * frame.scale * unit;
    handles = (
      <g transform={transformFor(frame)}>
        <rect
          className="smg-select"
          x={-w}
          y={-h}
          width={w * 2}
          height={h * 2}
          rx="6"
          onPointerDown={onSelectionDown}
        />
        <line className="smg-select-line" x1="0" y1={-h} x2="0" y2={-h - 22} />
        <circle
          className="smg-handle smg-handle--rotate"
          cx="0"
          cy={-h - 26}
          r="6"
          onPointerDown={event => startRotate(event, [single], frame.center)}
        />
        {[
          [1, 1],
          [-1, 1],
          [1, -1],
          [-1, -1]
        ].map(([sx, sy]) => (
          <rect
            key={`${sx}${sy}`}
            className="smg-handle"
            x={sx * w - 5}
            y={sy * h - 5}
            width="10"
            height="10"
            rx="3"
            onPointerDown={event => startScale(event, [single], frame.center)}
          />
        ))}
      </g>
    );
  } else if (group) {
    const [x0, y0] = toPx([group.minX, group.minY]);
    const [x1, y1] = toPx([group.maxX, group.maxY]);
    const pivot = [group.cx, group.cy];
    handles = (
      <g>
        {selectedLayers.map(layer => outlineFor(layer, 'smg-member'))}
        <rect
          className="smg-select smg-select--group"
          x={x0}
          y={y0}
          width={x1 - x0}
          height={y1 - y0}
          rx="6"
          onPointerDown={onSelectionDown}
        />
        <line className="smg-select-line" x1={(x0 + x1) / 2} y1={y0} x2={(x0 + x1) / 2} y2={y0 - 22} />
        <circle
          className="smg-handle smg-handle--rotate"
          cx={(x0 + x1) / 2}
          cy={y0 - 26}
          r="6"
          onPointerDown={event => startRotate(event, selectedLayers, pivot)}
        />
        {[
          [x0, y0],
          [x1, y0],
          [x0, y1],
          [x1, y1]
        ].map(([x, y]) => (
          <rect
            key={`${x}-${y}`}
            className="smg-handle"
            x={x - 5}
            y={y - 5}
            width="10"
            height="10"
            rx="3"
            onPointerDown={event => startScale(event, selectedLayers, pivot)}
          />
        ))}
      </g>
    );
  }

  return (
    <div
      className="lab-stage smg-stage"
      ref={stageRef}
      data-dragging={dropping ? '' : undefined}
      style={{ '--smg-aspect': ratio.w / ratio.h }}
    >
      {width > 0 && (
        <div
          className="smg-artboard"
          data-transparent={transparent ? '' : undefined}
          style={{ width, height }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerLeave={event => {
            setHover(null);
            feed('leave', event);
          }}
          onPointerUp={event => feed('up', event)}
          onDoubleClick={onDoubleClick}
        >
          <canvas ref={canvasRef} className="smg-canvas" />
          {material}
          <svg className="smg-overlay" width={width} height={height} aria-hidden="true">
            {hovered && outlineFor(hovered, 'smg-hover')}
            {guides?.x !== null && guides?.x !== undefined && (
              <line
                className="smg-guide"
                x1={toPx([guides.x, 0])[0]}
                x2={toPx([guides.x, 0])[0]}
                y1={toPx([0, -halfH])[1]}
                y2={toPx([0, halfH])[1]}
              />
            )}
            {guides?.y !== null && guides?.y !== undefined && (
              <line
                className="smg-guide"
                x1={toPx([-halfW, 0])[0]}
                x2={toPx([halfW, 0])[0]}
                y1={toPx([0, guides.y])[1]}
                y2={toPx([0, guides.y])[1]}
              />
            )}
            {handles}
            {marquee && (
              <rect
                className="smg-marquee"
                x={toPx([marquee.minX, 0])[0]}
                y={toPx([0, marquee.minY])[1]}
                width={(marquee.maxX - marquee.minX) * unit}
                height={(marquee.maxY - marquee.minY) * unit}
              />
            )}
          </svg>
        </div>
      )}
      {hint && (
        <button type="button" className="lab-hint" onClick={onUpload}>
          <span>Drop or paste an SVG or PNG logo to style it</span>
        </button>
      )}
      {dropping && (
        <div className="lab-drop">
          <span>Drop to add your logo</span>
        </div>
      )}
    </div>
  );
}
