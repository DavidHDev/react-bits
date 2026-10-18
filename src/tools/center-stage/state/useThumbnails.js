import { useCallback, useEffect, useRef, useState } from 'react';
import { Renderer } from '../engine/renderer';
import { TextCache, prepareShot, renderShot } from '../engine/shot';
import { PRESETS } from '../presets/index';
import { posterTime, surfaceRole } from '../engine/scene';
import { BACKGROUND_IMAGES, carryOver, frameOf, mediaSizes } from '../media';

const WIDTH = 400;
const HEIGHT = 250;
const IDLE = 2500;

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

export function useThumbnails(slots, version) {
  const [thumbs, setThumbs] = useState({});
  const work = useRef({
    slots: null,
    generation: 0,
    wanted: [],
    stack: [],
    done: new Set(),
    urls: {},
    engine: null,
    busy: false,
    idle: 0,
    alive: true
  });

  const release = useCallback(() => {
    const state = work.current;
    clearTimeout(state.idle);
    state.engine?.renderer.dispose();
    state.engine = null;
  }, []);

  const setup = useCallback(() => {
    const state = work.current;
    if (state.engine) return state.engine;
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const renderer = new Renderer(canvas, { preserve: true, samples: 4 });
    state.slots.forEach((media, slot) => {
      const frame = frameOf(media);
      if (frame) renderer.setMedia(slot, frame.image, frame.width, frame.height);
    });
    state.engine = {
      canvas,
      renderer,
      sizes: mediaSizes(state.slots),
      cache: new TextCache(2),
      background: null
    };
    return state.engine;
  }, []);

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
        const engine = setup();
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
        if (!state.alive || generation !== state.generation) continue;
        renderShot(engine.renderer, doc, engine.sizes, {
          width: WIDTH,
          height: HEIGHT,
          time: posterTime(doc, preset.poster),
          seed: 7,
          cache: engine.cache
        });
        const blob = await toBlob(engine.canvas);
        if (!state.alive || generation !== state.generation) continue;
        url = blob ? URL.createObjectURL(blob) : null;
      } catch {
        url = null;
      }
      if (!state.alive || generation !== state.generation) {
        if (url) URL.revokeObjectURL(url);
        continue;
      }
      if (state.urls[id]) URL.revokeObjectURL(state.urls[id]);
      state.urls[id] = url;
      state.done.add(id);
      batch[id] = url;
      if (Object.keys(batch).length >= 4) flush();
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    flush();
    state.busy = false;
    if (state.stack.length && state.slots) pump();
    else state.idle = setTimeout(release, IDLE);
  }, [release, setup]);

  useEffect(() => {
    const state = work.current;
    state.slots = slots && slots.some(Boolean) ? slots : null;
    state.generation += 1;
    state.done = new Set();
    state.stack = [...state.wanted];
    release();
    if (state.slots) pump();
  }, [slots, version, pump, release]);

  useEffect(() => {
    const state = work.current;
    state.alive = true;
    return () => {
      state.alive = false;
      release();
      Object.values(state.urls).forEach(url => url && URL.revokeObjectURL(url));
      state.urls = {};
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
