import { useEffect, useRef, useState } from 'react';
import { createRenderer } from '../engine/renderer';
import { bindMasks, loadField, maskPlan, masksReady } from '../engine/masks';
import { PRIMITIVES } from '../engine/primitives';
import { MARKS } from '../presets/marks';
import { FILLS } from '../presets/materials';
import { createDoc, isMaskLayer } from './doc';
import { styleFor } from './style';

const SIZE = 220;
const ICON = 96;

let shared = null;
let captures = Promise.resolve();

const thumbRenderer = () => {
  if (shared) return shared;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  shared = { canvas, renderer: createRenderer(canvas, { preserve: true }) };
  return shared;
};

const snap = (doc, style, size = SIZE, time = 0) => {
  // The canvas is shared by both thumbnail hooks. Keep preparation, drawing,
  // and readback together so concurrent hooks cannot capture another mark.
  const capture = captures.then(async () => {
    const { canvas, renderer } = thumbRenderer();
    const plan = maskPlan([doc.mark.layers]);
    const scene = { a: doc.mark, maskSlots: plan.slots };
    await renderer.prepareScene(scene, style);
    bindMasks(renderer, plan.keys);
    renderer.draw({ scene, style, width: size, height: size, time });
    return canvas.toDataURL('image/png');
  });
  captures = capture.catch(() => {});
  return capture;
};

const waitMasks = async layers => {
  const masks = layers.filter(isMaskLayer);
  await Promise.all(masks.map(layer => loadField(layer).catch(() => null)));
};

const yieldTask = () => new Promise(resolve => setTimeout(resolve, 0));

const staticCache = {};

export function useStaticThumbs(light = false, active = true) {
  const theme = light ? 'light' : 'dark';
  const [thumbs, setThumbs] = useState(() => staticCache[theme] || staticCache.dark || {});
  useEffect(() => {
    if (!active) return undefined;
    if (staticCache[theme]) {
      setThumbs(staticCache[theme]);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      const next = {};
      const previous = staticCache.dark || staticCache.light;
      // Populate the visible mark gallery before compiling shape-picker icons.
      for (const [index, preset] of MARKS.entries()) {
        const doc = createDoc(preset, { light });
        await waitMasks(doc.mark.layers);
        if (cancelled) return;
        next[`mark:${preset.id}`] = await snap(doc, styleFor(doc));
        if (index % 4 === 3) setThumbs({ ...previous, ...next });
        await yieldTask();
      }
      for (const primitive of PRIMITIVES) {
        if (cancelled) return;
        const key = `shape:${primitive.id}`;
        const doc = createDoc({ mark: { layers: [{ type: primitive.id, size: 0.78 }] } });
        next[key] = previous?.[key] || (await snap(doc, { fill: { kind: 'solid', color1: '#ffffff' } }, ICON));
      }
      staticCache[theme] = next;
      if (!cancelled) setThumbs({ ...next });
    })();
    return () => {
      cancelled = true;
    };
  }, [theme, light, active]);
  return thumbs;
}

const luminance = hex => {
  const value = String(hex || '').replace('#', '');
  if (value.length < 6) return 0.5;
  const [r, g, b] = [0, 2, 4].map(i => parseInt(value.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export function useFillThumbs(doc, light, active) {
  const [thumbs, setThumbs] = useState({});
  const key = JSON.stringify([doc.mark, light]);
  const docRef = useRef(doc);
  docRef.current = doc;
  const doneKey = useRef(null);
  useEffect(() => {
    if (!active || doneKey.current === key) return undefined;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const doc = docRef.current;
      await waitMasks(doc.mark.layers);
      if (cancelled) return;
      const plan = maskPlan([doc.mark.layers]);
      if (!masksReady(plan.keys)) return;
      const next = { silhouette: await snap(doc, { fill: { kind: 'solid', color1: '#ffffff' } }, 160) };
      setThumbs(previous => ({ ...previous, silhouette: next.silhouette }));
      for (const item of FILLS) {
        await yieldTask();
        if (cancelled) return;
        const tone = (luminance(item.fill.color1) + luminance(item.fill.color2 || item.fill.color1)) / 2;
        const clash = light ? tone > 0.82 : tone < 0.16;
        const gloss = item.effects?.gloss || { on: false };
        const style = {
          fill: item.fill,
          glow: item.effects?.glow || { on: false },
          gloss,
          background: clash ? { kind: 'color', color1: light ? '#26232d' : '#e8e5ee' } : { kind: 'none' }
        };
        next[item.id] = await snap(doc, style);
      }
      if (cancelled) return;
      doneKey.current = key;
      setThumbs(next);
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [key, light, active]);
  return thumbs;
}
