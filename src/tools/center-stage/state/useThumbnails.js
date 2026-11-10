import { useCallback, useEffect, useRef, useState } from 'react';
import { Renderer } from '../engine/renderer';
import { TextCache, prepareShot, renderShot } from '../engine/shot';
import { PRESETS } from '../presets/index';
import { posterTime, surfaceRole } from '../engine/scene';
import { BACKGROUND_IMAGES, carryOver, elementFrame, mediaSizes, previewBitmap } from '../media';

const WIDTH = 400;
const HEIGHT = 250;
const IDLE = 30000;
const DETAIL = 1024;

const BY_ID = Object.fromEntries(PRESETS.map(preset => [preset.id, preset]));

const imageCache = new Map();

export const loadBackgroundImage = value => {
  const entry = BACKGROUND_IMAGES.find(item => item.value === value);
  if (!entry) return Promise.resolve(null);
  if (!imageCache.has(entry.url)) {
    imageCache.set(
      entry.url,
      new Promise(resolve => {
        const image = new Image();
        image.decoding = 'async';
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        image.src = entry.url;
      })
    );
  }
  return imageCache.get(entry.url);
};

const toBlob = canvas => new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.86));

const toUrl = blob =>
  new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });

const settled = gl =>
  new Promise(resolve => {
    const fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    if (!fence) {
      resolve();
      return;
    }
    gl.flush();
    const poll = () => {
      if (gl.isContextLost() || gl.getSyncParameter(fence, gl.SYNC_STATUS) === gl.SIGNALED) {
        gl.deleteSync(fence);
        resolve();
      } else setTimeout(poll, 4);
    };
    setTimeout(poll, 4);
  });

const sourceFor = async media => {
  const own = await previewBitmap(media, DETAIL);
  if (own) return { frame: { image: own, width: media.width, height: media.height }, own };
  return { frame: elementFrame(media), own: null };
};

export function useThumbnails(slots, version) {
  const [thumbs, setThumbs] = useState({});
  const work = useRef({
    slots: null,
    generation: 0,
    wanted: [],
    stack: [],
    done: new Set(),
    engine: null,
    booting: null,
    busy: false,
    idle: 0,
    alive: true
  });

  const release = useCallback(() => {
    const state = work.current;
    clearTimeout(state.idle);
    state.engine?.renderer.dispose();
    state.engine = null;
    state.booting = null;
  }, []);

  const sync = useCallback(async engine => {
    const state = work.current;
    const slots = state.slots;
    if (!slots || engine.slots === slots) return true;
    const length = Math.max(slots.length, engine.uploaded.length);
    const changed = [];
    for (let slot = 0; slot < length; slot += 1) {
      if (engine.uploaded[slot] !== (slots[slot] || null)) changed.push(slot);
    }
    const sources = await Promise.all(changed.map(slot => (slots[slot] ? sourceFor(slots[slot]) : null)));
    if (!state.alive || state.slots !== slots || state.engine !== engine) {
      sources.forEach(source => source?.own?.close());
      return false;
    }
    changed.forEach((slot, index) => {
      const source = sources[index];
      const frame = source?.frame;
      if (frame) engine.renderer.setMedia(slot, frame.image, frame.width, frame.height);
      else engine.renderer.clearMedia(slot);
      source?.own?.close();
      engine.uploaded[slot] = slots[slot] || null;
    });
    engine.slots = slots;
    engine.sizes = mediaSizes(slots);
    return true;
  }, []);

  const setup = useCallback(async () => {
    const state = work.current;
    if (state.engine) return state.engine;
    if (!state.booting) {
      const canvas = document.createElement('canvas');
      canvas.width = WIDTH;
      canvas.height = HEIGHT;
      const renderer = new Renderer(canvas, { preserve: true, samples: 4 });
      renderer.warm();
      const engine = {
        canvas,
        renderer,
        slots: null,
        uploaded: [],
        sizes: [],
        cache: new TextCache(2),
        background: null
      };
      state.engine = engine;
      state.booting = sync(engine).then(ok => (ok ? engine : null));
    }
    return state.booting;
  }, [sync]);

  const pump = useCallback(async () => {
    const state = work.current;
    if (state.busy || !state.slots) return;
    state.busy = true;
    clearTimeout(state.idle);
    let batch = {};
    const flush = () => {
      const add = batch;
      batch = {};
      if (state.alive && Object.keys(add).length) setThumbs(previous => ({ ...previous, ...add }));
    };
    while (state.alive && state.stack.length && state.slots) {
      const id = state.stack.pop();
      const preset = BY_ID[id];
      if (!preset || state.done.has(id)) continue;
      const generation = state.generation;
      let url = null;
      try {
        const engine = (await setup()) || null;
        if (!engine || !(await sync(engine))) {
          if (state.alive && generation === state.generation) state.stack.push(id);
          continue;
        }
        const doc = carryOver(preset.doc, state.slots, surfaceRole);
        await prepareShot(doc);
        const background = doc.background || {};
        if (background.kind === 'image') {
          const image = await loadBackgroundImage(background.image);
          if (image && engine.background !== background.image) {
            engine.renderer.setBackgroundImage(image, image.naturalWidth, image.naturalHeight);
            engine.background = background.image;
          }
        }
        if (!state.alive || generation !== state.generation || state.engine !== engine) continue;
        const scene = renderShot(engine.renderer, doc, engine.sizes, {
          width: WIDTH,
          height: HEIGHT,
          time: posterTime(doc, preset.poster),
          seed: 7,
          cache: engine.cache,
          defer: true
        });
        if (!scene.drawn) {
          state.stack.push(id);
          await new Promise(resolve => setTimeout(resolve, 40));
          continue;
        }
        await settled(engine.renderer.gl);
        if (!state.alive || generation !== state.generation || state.engine !== engine) continue;
        const blob = await toBlob(engine.canvas);
        if (!state.alive || generation !== state.generation) continue;
        url = blob ? await toUrl(blob) : null;
      } catch {
        url = null;
      }
      if (!state.alive || generation !== state.generation) continue;
      state.done.add(id);
      batch[id] = url;
      if (Object.keys(batch).length >= 4) flush();
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    flush();
    state.busy = false;
    if (state.stack.length && state.slots) pump();
    else state.idle = setTimeout(release, IDLE);
  }, [release, setup, sync]);

  useEffect(() => {
    const state = work.current;
    state.slots = slots && slots.some(Boolean) ? slots : null;
    state.generation += 1;
    state.done = new Set();
    state.stack = [...state.wanted];
    if (state.slots) pump();
  }, [slots, version, pump]);

  useEffect(() => {
    const state = work.current;
    state.alive = true;
    return () => {
      state.alive = false;
      release();
    };
  }, [release]);

  const request = useCallback(
    id => {
      const state = work.current;
      if (!state.wanted.includes(id)) state.wanted.push(id);
      if (state.done.has(id)) return;
      const at = state.stack.indexOf(id);
      if (at >= 0) state.stack.splice(at, 1);
      state.stack.push(id);
      pump();
    },
    [pump]
  );

  return { thumbs, request };
}
