import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ScreenShareIcon, Upload04Icon } from '@hugeicons/core-free-icons';
import { Icon } from '../../background-studio/components/ui';
import { Renderer } from '../engine/renderer';
import { aspectRatio, isLooping, pickFocus, screenPoint } from '../engine/scene';
import { TextCache, prepareShot, renderShot } from '../engine/shot';
import { clamp } from '../engine/math';
import { frameOf, mediaSizes } from '../media';
import { loadBackgroundImage } from '../state/useThumbnails';
import { createLiveBackdrop } from '../backdrop';

const MAX_SIDE = 3840;
const REPLAY_HOLD = 1.6;

const LIGHT_DEVICE =
  typeof window !== 'undefined' &&
  (Boolean(navigator.deviceMemory && navigator.deviceMemory <= 4) ||
    Boolean(window.matchMedia?.('(pointer: coarse)').matches));

const roundedScreen = (rx, ry, steps = 5) => {
  const points = [];
  const corner = (cx, cy, start) => {
    for (let i = 0; i <= steps; i += 1) {
      const angle = start + (i / steps) * (Math.PI / 2);
      points.push([cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry]);
    }
  };
  corner(1 - rx, ry, -Math.PI / 2);
  corner(1 - rx, 1 - ry, 0);
  corner(rx, 1 - ry, Math.PI / 2);
  corner(rx, ry, Math.PI);
  return points;
};

function outlinePath(scene, indices, width, height) {
  if (!scene || !indices?.length) return '';
  const vp = scene.camera.viewProj;
  const parts = [];
  indices.forEach(index => {
    const item = scene.devices[index];
    if (!item || (item.opacity ?? 1) < 0.05) return;
    const { screen } = item.layout;
    const rx = Math.min(0.5, (screen.radius || 0) / screen.w);
    const ry = Math.min(0.5, (screen.radius || 0) / screen.h);
    const points = [];
    for (const [u, v] of roundedScreen(rx, ry)) {
      const p = screenPoint(item.layout, item.model, u, v);
      const w = vp[3] * p[0] + vp[7] * p[1] + vp[11] * p[2] + vp[15];
      if (w <= 0.001) return;
      const x = (vp[0] * p[0] + vp[4] * p[1] + vp[8] * p[2] + vp[12]) / w;
      const y = (vp[1] * p[0] + vp[5] * p[1] + vp[9] * p[2] + vp[13]) / w;
      points.push(`${((x * 0.5 + 0.5) * width).toFixed(1)} ${((0.5 - y * 0.5) * height).toFixed(1)}`);
    }
    parts.push(`M${points.join('L')}Z`);
  });
  return parts.join('');
}

function paintOutline(path, canvas, scene, indices) {
  if (!path || !canvas) return;
  path.setAttribute('d', indices?.length ? outlinePath(scene, indices, canvas.clientWidth, canvas.clientHeight) : '');
}

const StageView = forwardRef(function StageView(
  {
    doc,
    slots,
    background,
    playing,
    timeRef,
    padding = 32,
    onTick,
    onCamera,
    onCameraEnd,
    onPick,
    onDropFiles,
    onResetCamera,
    loading,
    error,
    dropping,
    hint,
    onUpload,
    onUploadHint,
    onCapture,
    forwarding,
    hud,
    highlight,
    repeat = true,
    length = 6,
    onEnded
  },
  ref
) {
  const viewRef = useRef(null);
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [failed, setFailed] = useState(null);
  const [quality, setQuality] = useState(1);
  const live = useRef({});
  const dirty = useRef(true);
  const wake = useRef(null);
  const invalidate = () => {
    dirty.current = true;
    wake.current?.();
  };
  const uploaded = useRef([]);
  const backgroundShown = useRef(null);
  const backdrop = useRef(null);
  const backdropVersion = useRef(-1);
  const cache = useRef(new TextCache(4));
  const gesture = useRef(null);
  const outlineRef = useRef(null);
  const [dropTarget, setDropTarget] = useState(null);
  const lit = dropTarget !== null ? [dropTarget] : highlight;

  live.current = { doc, slots, background, playing, onTick, lit, repeat, length, onEnded, forwarding };

  useLayoutEffect(() => {
    const view = viewRef.current;
    if (!view) return undefined;
    const measure = () => setBox({ width: view.clientWidth, height: view.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(view);
    return () => observer.disconnect();
  }, []);

  const ratio = aspectRatio(doc.aspect);
  let width = 0;
  let height = 0;
  if (box.width && box.height) {
    const availableW = Math.max(40, box.width - padding);
    const availableH = Math.max(40, box.height - padding - (hint ? 40 : 0));
    width = Math.floor(Math.min(availableW, availableH * ratio));
    height = Math.floor(width / ratio);
  }

  useEffect(() => {
    invalidate();
  }, [doc, slots, background, width, height, playing]);

  useEffect(() => {
    prepareShot(doc).then(() => {
      invalidate();
    });
  }, [doc]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let renderer;
    try {
      renderer = new Renderer(canvas, { samples: LIGHT_DEVICE ? 4 : 8 });
    } catch (problem) {
      setFailed(problem.message);
      return undefined;
    }
    rendererRef.current = renderer;
    let raf = 0;
    let last = performance.now();
    let reported = 0;
    const pace = { cost: 1 / 60, lag: 0, calm: 0, quality: 1 };
    const keepAlive = () => {
      const state = live.current;
      if (state.playing || dirty.current) return true;
      if ((state.doc.background || {}).kind === 'reactbits') return true;
      return state.slots.some(media => media?.kind === 'video' || media?.kind === 'live');
    };
    const govern = gap => {
      if (gap > 0.25) return;
      pace.cost += (gap - pace.cost) * 0.05;
      pace.lag = pace.cost > 0.024 ? pace.lag + gap : 0;
      pace.calm = pace.cost < 0.0135 ? pace.calm + gap : 0;
      if (pace.lag > 1.5 && pace.quality > 0.55) {
        pace.quality = Math.max(0.55, pace.quality * 0.85);
        pace.lag = 0;
        setQuality(pace.quality);
      } else if (pace.calm > 5 && pace.quality < 1) {
        pace.quality = Math.min(1, pace.quality / 0.85);
        pace.calm = 0;
        setQuality(pace.quality);
      }
    };
    const step = now => {
      const state = live.current;
      const gap = (now - last) / 1000;
      const dt = Math.min(gap, 0.1);
      last = now;
      if (state.playing) govern(gap);
      if (state.playing) {
        timeRef.current += dt;
        const kind = state.doc.motion?.kind || 'none';
        if (!state.repeat) {
          const end = Math.max(0.5, state.length);
          if (timeRef.current >= end) {
            timeRef.current = end;
            state.onEnded?.();
          }
        } else if (kind !== 'none' && !isLooping(kind)) {
          const length = Math.max(0.5, state.doc.motion.duration || 6);
          if (timeRef.current > length + REPLAY_HOLD) timeRef.current = 0;
        }
        dirty.current = true;
      }
      const updated = new Set();
      state.slots.forEach((media, slot) => {
        const record = uploaded.current[slot];
        if (!media) {
          if (record) {
            renderer.clearMedia(slot);
            uploaded.current[slot] = null;
            dirty.current = true;
          }
          return;
        }
        if (media.kind === 'video' && !updated.has(media)) {
          media.player.update();
          updated.add(media);
        }
        const version = media.kind === 'video' ? media.player.version : media.kind === 'live' ? media.version : 0;
        if (record && record.media === media && record.version === version) return;
        const frame = frameOf(media);
        if (!frame) return;
        renderer.setMedia(slot, frame.image, frame.width, frame.height, { mips: true });
        uploaded.current[slot] = { media, version };
        dirty.current = true;
      });
      const bg = state.doc.background || {};
      if (bg.kind === 'reactbits' && backdrop.current) {
        backdrop.current.playing(state.playing);
        backdrop.current.capture();
        if (backdrop.current.version !== backdropVersion.current) {
          backdropVersion.current = backdrop.current.version;
          renderer.setBackgroundImage(
            backdrop.current.canvas,
            backdrop.current.canvas.width,
            backdrop.current.canvas.height
          );
          dirty.current = true;
        }
      }
      const wanted =
        bg.kind === 'image'
          ? bg.image === 'custom'
            ? state.background
            : bg.image
          : bg.kind === 'reactbits'
            ? 'reactbits'
            : null;
      if (wanted === 'reactbits') {
        if (backgroundShown.current !== wanted) {
          backgroundShown.current = wanted;
          backdropVersion.current = -1;
        }
      } else if (wanted !== backgroundShown.current) {
        backgroundShown.current = wanted;
        if (!wanted) renderer.setBackgroundImage(null);
        else if (typeof wanted === 'string') {
          loadBackgroundImage(wanted).then(image => {
            if (image && backgroundShown.current === wanted) {
              renderer.setBackgroundImage(image, image.naturalWidth, image.naturalHeight);
              invalidate();
            }
          });
        } else {
          const frame = frameOf(wanted);
          if (frame) renderer.setBackgroundImage(frame.image, frame.width, frame.height);
        }
        dirty.current = true;
      }
      if (now - reported > 90 && state.playing) {
        reported = now;
        state.onTick?.(timeRef.current);
      }
      if (!dirty.current) return;
      const canvasEl = canvasRef.current;
      if (!canvasEl || canvasEl.width < 4 || canvasEl.height < 4) return;
      dirty.current = false;
      try {
        sceneRef.current = renderShot(renderer, state.doc, mediaSizes(state.slots), {
          width: canvasEl.width,
          height: canvasEl.height,
          time: timeRef.current,
          cache: cache.current,
          preview: true
        });
      } catch (problem) {
        console.error(problem);
      }
      paintOutline(outlineRef.current, canvasRef.current, sceneRef.current, state.lit);
    };
    const tick = now => {
      raf = 0;
      step(now);
      if (keepAlive()) raf = requestAnimationFrame(tick);
    };
    wake.current = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      wake.current = null;
      cancelAnimationFrame(raf);
      renderer.dispose();
      rendererRef.current = null;
      uploaded.current = [];
      backgroundShown.current = null;
    };
  }, [timeRef]);

  useEffect(() => {
    paintOutline(outlineRef.current, canvasRef.current, sceneRef.current, live.current.lit);
  });

  const backdropKey = doc.background?.kind === 'reactbits' ? JSON.stringify(doc.background) : null;

  useEffect(() => {
    if (!backdropKey || !width || !height) return;
    if (!backdrop.current) backdrop.current = createLiveBackdrop();
    const scale = Math.min(1, 1600 / Math.max(width, height));
    backdrop.current.show(JSON.parse(backdropKey), width * scale, height * scale).catch(() => {});
  }, [backdropKey, width, height]);

  useEffect(
    () => () => {
      backdrop.current?.dispose();
      backdrop.current = null;
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width || !height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, LIGHT_DEVICE ? 1.5 : 2) * quality;
    const scale = Math.min(Math.max(1, dpr), MAX_SIDE / Math.max(width, height));
    canvas.width = Math.max(4, Math.round(width * scale));
    canvas.height = Math.max(4, Math.round(height * scale));
    invalidate();
  }, [width, height, quality]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const onWheel = event => {
      if (live.current.forwarding) return;
      event.preventDefault();
      const camera = live.current.doc.camera || {};
      const factor = Math.exp(-clamp(event.deltaY, -120, 120) * (event.ctrlKey ? 0.01 : 0.0016));
      onCamera({ zoom: clamp((camera.zoom || 1) * factor, 0.5, 4.5) }, 'zoom');
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [onCamera]);

  const ndc = event => {
    const rect = canvasRef.current.getBoundingClientRect();
    return [((event.clientX - rect.left) / rect.width) * 2 - 1, 1 - ((event.clientY - rect.top) / rect.height) * 2];
  };

  const onPointerDown = event => {
    if (event.button > 2) return;
    const canvas = canvasRef.current;
    canvas.setPointerCapture(event.pointerId);
    const current = gesture.current;
    if (current && current.pointers.size === 1 && event.pointerType === 'touch') {
      current.pointers.set(event.pointerId, [event.clientX, event.clientY]);
      const [a, b] = [...current.pointers.values()];
      current.pinch = { distance: Math.hypot(a[0] - b[0], a[1] - b[1]), zoom: live.current.doc.camera?.zoom || 1 };
      current.moved = true;
      return;
    }
    const camera = live.current.doc.camera || {};
    gesture.current = {
      pointers: new Map([[event.pointerId, [event.clientX, event.clientY]]]),
      start: [event.clientX, event.clientY],
      camera: { rx: camera.rx || 0, ry: camera.ry || 0, x: camera.x || 0, y: camera.y || 0 },
      pan: event.shiftKey || event.button === 1 || event.button === 2,
      moved: false,
      pinch: null
    };
  };

  const onPointerMove = event => {
    const current = gesture.current;
    if (!current || !current.pointers.has(event.pointerId)) return;
    current.pointers.set(event.pointerId, [event.clientX, event.clientY]);
    if (current.pinch && current.pointers.size === 2) {
      const [a, b] = [...current.pointers.values()];
      const distance = Math.hypot(a[0] - b[0], a[1] - b[1]);
      onCamera(
        { zoom: clamp((current.pinch.zoom * distance) / Math.max(current.pinch.distance, 1), 0.5, 4.5) },
        'zoom'
      );
      return;
    }
    const dx = event.clientX - current.start[0];
    const dy = event.clientY - current.start[1];
    if (!current.moved && Math.hypot(dx, dy) < 4) return;
    current.moved = true;
    const rect = canvasRef.current.getBoundingClientRect();
    if (current.pan) {
      onCamera(
        {
          x: clamp(current.camera.x - dx / rect.width / 2, -0.5, 0.5),
          y: clamp(current.camera.y + dy / rect.height / 2, -0.5, 0.5)
        },
        'pan'
      );
    } else {
      onCamera(
        { ry: clamp(current.camera.ry - dx * 0.28, -75, 75), rx: clamp(current.camera.rx + dy * 0.22, -40, 75) },
        'orbit'
      );
    }
  };

  const onPointerUp = event => {
    const current = gesture.current;
    if (!current) return;
    current.pointers.delete(event.pointerId);
    if (current.pointers.size) return;
    gesture.current = null;
    if (current.moved) {
      onCameraEnd?.();
      return;
    }
    if (event.type === 'pointercancel' || !sceneRef.current) return;
    const [x, y] = ndc(event);
    onPick?.(pickFocus(sceneRef.current, x, y));
  };

  const deviceAt = event => {
    if (!sceneRef.current) return null;
    const [x, y] = ndc(event);
    const hit = pickFocus(sceneRef.current, x, y);
    return hit ? hit.device : null;
  };

  const onDragOver = event => {
    event.preventDefault();
    const device = deviceAt(event);
    if (device !== dropTarget) setDropTarget(device);
  };

  const onDrop = event => {
    const files = [...(event.dataTransfer?.files || [])];
    setDropTarget(null);
    if (!files.length || !sceneRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    onDropFiles?.(files, deviceAt(event));
  };

  const transparent = doc.background?.kind === 'transparent';
  const hintProps = {
    onPointerEnter: () => onUploadHint?.(true),
    onPointerLeave: () => onUploadHint?.(false),
    onFocus: () => onUploadHint?.(true),
    onBlur: () => onUploadHint?.(false)
  };

  return (
    <div
      className="lab-stage cst-stage"
      ref={ref}
      data-dragging={dropping ? '' : undefined}
      style={{ '--cst-aspect': ratio }}
    >
      <div className="lab-view" ref={viewRef}>
        <div
          className="cst-canvas-wrap"
          data-transparent={transparent ? '' : undefined}
          style={{ width, height, marginBottom: hint ? 40 : undefined, visibility: width ? 'visible' : 'hidden' }}
        >
          <canvas
            ref={canvasRef}
            className="cst-canvas"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onDoubleClick={onResetCamera}
            onContextMenu={event => event.preventDefault()}
            onDragOver={onDragOver}
            onDragLeave={() => setDropTarget(null)}
            onDrop={onDrop}
          />
          <svg className="cst-outline" aria-hidden="true" data-on={lit?.length ? '' : undefined}>
            <path ref={outlineRef} />
          </svg>
        </div>
      </div>
      {loading && (
        <div className="lab-overlay">
          <span className="bs-spinner" />
        </div>
      )}
      {(failed || error) && !loading && (
        <div className="lab-overlay lab-error" role="alert">
          <p>{failed || error}</p>
        </div>
      )}
      {hint && !hud && !loading && !dropping && (
        <div className="cst-hints">
          <button type="button" className="lab-hint" onClick={onUpload} {...hintProps}>
            <Icon icon={Upload04Icon} size={14} />
            <span>Drop, paste or upload your own screenshot or recording</span>
          </button>
          {onCapture && (
            <button type="button" className="lab-hint" onClick={onCapture} {...hintProps}>
              <Icon icon={ScreenShareIcon} size={14} />
              <span>Capture a page</span>
            </button>
          )}
        </div>
      )}
      {hud && !dropping && hud}
      {dropping && (
        <div className="lab-drop">
          <span>Drop onto a device</span>
        </div>
      )}
    </div>
  );
});

export default StageView;
