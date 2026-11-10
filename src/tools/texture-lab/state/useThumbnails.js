import { useCallback, useEffect, useRef, useState } from 'react';
import { EFFECT_LIST, EFFECTS, lookPrimary } from '../effects';
import { LOOKS } from '../looks';
import { createLayer } from './useLayers';
import { mediaFrame } from '../media';

const THUMB_WIDTH = 320;
const THUMB_HEIGHT = 220;
const ZOOM = 2.5;
const ZOOMED_GROUPS = new Set(['type', 'print', 'art']);
const ZOOMED_CATEGORIES = new Set(['type', 'art', 'analog']);
const SLICE_MS = 6;
const SPARE_MS = 2;
const FLUSH_MS = 120;
const VISIBLE_MS = 24;
const READBACKS = 6;
const AHEAD = 4;
const STILL = { rotation: 0, flip: false };
const BYTES = THUMB_WIDTH * THUMB_HEIGHT * 4;
const ROW = THUMB_WIDTH * 4;

const thumbLayout = (media, zoom) => {
  const tile = THUMB_WIDTH / THUMB_HEIGHT;
  const cover = media.width / media.height >= tile ? media.height * tile : media.width;
  const scale = (THUMB_WIDTH * zoom) / cover;
  const width = Math.max(THUMB_WIDTH, Math.round(media.width * scale));
  const height = Math.max(THUMB_HEIGHT, Math.round(media.height * scale));
  return { width, height, x: Math.round((width - THUMB_WIDTH) / 2), y: Math.round((height - THUMB_HEIGHT) / 2) };
};

const lookZoom = look =>
  look.preview?.zoom ??
  EFFECTS[look.layers[lookPrimary(look)]?.type]?.preview?.zoom ??
  (ZOOMED_GROUPS.has(look.group) ? ZOOM : 1);

const lookJobs = () =>
  LOOKS.map(look => ({
    key: `look:${look.id}`,
    zoom: lookZoom(look),
    layers: look.layers.map(item => createLayer(item.type, item))
  }));

const effectJobs = () =>
  EFFECT_LIST.map(effect => ({
    key: `fx:${effect.id}`,
    zoom: effect.preview?.zoom ?? (ZOOMED_CATEGORIES.has(effect.category) ? ZOOM : 1),
    layers: [createLayer(effect.id, { params: effect.preview?.params })]
  }));

const createStore = () => {
  const listeners = new Set();
  const store = {
    map: {},
    get: () => store.map,
    subscribe: listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    merge: batch => {
      store.map = { ...store.map, ...batch };
      listeners.forEach(listener => listener());
    }
  };
  return store;
};

const idle =
  typeof window !== 'undefined' && window.requestIdleCallback
    ? callback => {
        const id = window.requestIdleCallback(callback, { timeout: 48 });
        return () => window.cancelIdleCallback(id);
      }
    : callback => {
        const id = setTimeout(callback, 4);
        return () => clearTimeout(id);
      };

export function useThumbnails(media, version, engineRef, first = 'looks') {
  const [store] = useState(createStore);
  const jobs = useRef(null);
  const view = useRef(null);
  const visible = useRef(new Set());
  const observer = useRef(null);
  const refs = useRef(new Map());
  const order = useRef(first);
  order.current = first;

  const watch = useCallback(key => {
    let ref = refs.current.get(key);
    if (ref) return ref;
    let node = null;
    ref = element => {
      if (!observer.current && typeof IntersectionObserver !== 'undefined') {
        observer.current = new IntersectionObserver(
          entries => {
            entries.forEach(entry => {
              const id = entry.target.dataset.thumb;
              if (entry.isIntersecting) visible.current.add(id);
              else visible.current.delete(id);
            });
          },
          { rootMargin: '160px 0px' }
        );
      }
      if (node) {
        observer.current?.unobserve(node);
        visible.current.delete(key);
      }
      node = element;
      if (node) {
        node.dataset.thumb = key;
        observer.current?.observe(node);
      }
    };
    refs.current.set(key, ref);
    return ref;
  }, []);

  useEffect(
    () => () => {
      observer.current?.disconnect();
      observer.current = null;
      view.current?.resetStates(EFFECTS);
      view.current?.dispose();
      view.current = null;
    },
    []
  );

  useEffect(() => {
    const engine = engineRef?.current;
    if (!media?.width || !engine || engine.lost) return undefined;
    let fork = view.current;
    if (!fork || fork.parent !== engine) {
      fork?.dispose();
      fork = view.current = engine.fork();
    }
    const gl = fork.gl;
    const shared = media.kind === 'image' && engine.source?.owner === media ? engine.source : null;
    let orient = STILL;
    try {
      fork.resetStates(EFFECTS);
      if (shared) fork.borrow(shared);
      else {
        const frame = mediaFrame(media);
        if (!frame) throw new Error('No frame');
        fork.setSource(frame.image, frame.width, frame.height, { bottomUp: frame.bottomUp });
        orient = frame;
      }
    } catch {
      return undefined;
    }
    if (!jobs.current) jobs.current = { looks: lookJobs(), effects: effectJobs() };
    const queue =
      order.current === 'effects'
        ? [...jobs.current.effects, ...jobs.current.looks]
        : [...jobs.current.looks, ...jobs.current.effects];
    const crop = document.createElement('canvas');
    crop.width = THUMB_WIDTH;
    crop.height = THUMB_HEIGHT;
    const cropContext = crop.getContext('2d', { willReadFrequently: true });
    const image = cropContext.createImageData(THUMB_WIDTH, THUMB_HEIGHT);
    const bytes = new Uint8Array(BYTES);
    const buffers = [];
    const inflight = [];
    let cancelled = false;
    let encoding = 0;
    let stop = null;
    let timer = 0;
    let pending = {};
    let flushed = 0;
    let due = 0;

    const flush = () => {
      timer = 0;
      flushed = performance.now();
      const batch = pending;
      pending = {};
      if (!cancelled && Object.keys(batch).length) store.merge(batch);
    };

    const deliver = (key, url) => {
      if (cancelled) return;
      pending[key] = url;
      const wait = Math.max(0, (visible.current.has(key) ? VISIBLE_MS : FLUSH_MS) - (performance.now() - flushed));
      if (!queue.length && !inflight.length && !encoding) {
        clearTimeout(timer);
        flush();
      } else if (!timer || wait < due - performance.now()) {
        clearTimeout(timer);
        due = performance.now() + wait;
        timer = setTimeout(flush, wait);
      }
    };

    const optionsFor = job => {
      const layout = thumbLayout(media, job.zoom);
      return {
        layout,
        options: {
          width: layout.width,
          height: layout.height,
          time: 1.2,
          frame: 36,
          mirror: Boolean(media.mirror),
          rotation: orient.rotation,
          flip: orient.flip
        }
      };
    };

    const start = job => {
      const { layout, options } = optionsFor(job);
      const { width, height, x, y } = layout;
      let target = null;
      try {
        target = fork.target(width, height, { float: false });
        fork.render(job.layers, EFFECTS, { ...options, output: target });
        const buffer = buffers.pop() || gl.createBuffer();
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buffer);
        gl.bufferData(gl.PIXEL_PACK_BUFFER, BYTES, gl.STREAM_READ);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
        gl.readPixels(x, height - y - THUMB_HEIGHT, THUMB_WIDTH, THUMB_HEIGHT, gl.RGBA, gl.UNSIGNED_BYTE, 0);
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        inflight.push({ key: job.key, buffer, sync: gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) });
        gl.flush();
      } catch {
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
        deliver(job.key, null);
      } finally {
        if (target) fork.release(target);
      }
    };

    const finish = item => {
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, item.buffer);
      gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, bytes);
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
      gl.deleteSync(item.sync);
      buffers.push(item.buffer);
      const pixels = image.data;
      for (let row = 0; row < THUMB_HEIGHT; row += 1) {
        const from = (THUMB_HEIGHT - 1 - row) * ROW;
        pixels.set(bytes.subarray(from, from + ROW), row * ROW);
      }
      cropContext.putImageData(image, 0, 0);
      encoding += 1;
      crop.toBlob(
        blob => {
          if (!blob || cancelled) {
            encoding -= 1;
            deliver(item.key, null);
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
            encoding -= 1;
            deliver(item.key, typeof reader.result === 'string' ? reader.result : null);
          };
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        0.86
      );
    };

    const drain = () => {
      for (let index = 0; index < inflight.length; ) {
        const item = inflight[index];
        if (gl.getSyncParameter(item.sync, gl.SYNC_STATUS) !== gl.SIGNALED) {
          index += 1;
          continue;
        }
        inflight.splice(index, 1);
        finish(item);
      }
    };

    const schedule = () => {
      if (stop || cancelled) return;
      if (queue.length || inflight.length) stop = idle(slice);
      else {
        fork.resetStates(EFFECTS);
        fork.trim();
      }
    };

    const slice = deadline => {
      stop = null;
      if (cancelled || fork.parent?.lost) return;
      if (shared && (engine.source !== shared || shared.owner !== media)) return;
      const end = performance.now() + SLICE_MS;
      const spare =
        deadline && !deadline.didTimeout ? () => deadline.timeRemaining() > SPARE_MS : () => performance.now() < end;
      drain();
      const seen = visible.current;
      const hot = queue.filter(job => seen.has(job.key));
      const ordered = hot.concat(queue.filter(job => !seen.has(job.key)));
      let ahead = hot.length ? 0 : -Infinity;
      for (const job of ordered) {
        if (inflight.length >= READBACKS || !spare()) break;
        if (!seen.has(job.key) && (ahead += 1) > AHEAD) break;
        if (!job.names) job.names = fork.collect(job.layers, EFFECTS, optionsFor(job).options);
        if (!fork.ready(job.names)) continue;
        queue.splice(queue.indexOf(job), 1);
        start(job);
      }
      schedule();
    };

    const delay = setTimeout(schedule, 60);

    return () => {
      cancelled = true;
      clearTimeout(delay);
      clearTimeout(timer);
      stop?.();
      inflight.forEach(item => {
        gl.deleteSync(item.sync);
        buffers.push(item.buffer);
      });
      inflight.length = 0;
      buffers.forEach(buffer => gl.deleteBuffer(buffer));
      pending = {};
    };
  }, [media, version, engineRef, store]);

  return { store, watch };
}
