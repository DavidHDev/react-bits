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

const thumbRenderer = () => {
  if (shared) return shared;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  shared = { canvas, renderer: createRenderer(canvas, { preserve: true }) };
  return shared;
};

const snap = (doc, style, size = SIZE, time = 0) => {
  const { canvas, renderer } = thumbRenderer();
  const plan = maskPlan([doc.mark.layers]);
  bindMasks(renderer, plan.keys);
  renderer.draw({ scene: { a: doc.mark, maskSlots: plan.slots }, style, width: size, height: size, time });
  return canvas.toDataURL('image/png');
};

const waitMasks = async layers => {
  const masks = layers.filter(isMaskLayer);
  await Promise.all(masks.map(layer => loadField(layer).catch(() => null)));
};

const yieldTask = () => new Promise(resolve => setTimeout(resolve, 0));

const staticCache = {};

export function useStaticThumbs(light = false) {
  const theme = light ? 'light' : 'dark';
  const [thumbs, setThumbs] = useState(() => staticCache[theme] || staticCache.dark || {});
  useEffect(() => {
    if (staticCache[theme]) {
      setThumbs(staticCache[theme]);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      const next = {};
      for (const primitive of PRIMITIVES) {
        const doc = createDoc({ mark: { layers: [{ type: primitive.id, size: 0.78 }] } });
        next[`shape:${primitive.id}`] = snap(doc, { fill: { kind: 'solid', color1: '#ffffff' } }, ICON);
      }
      const previous = staticCache.dark || staticCache.light;
      if (!cancelled) setThumbs(previous ? { ...previous, ...next } : { ...next });
      for (const [index, preset] of MARKS.entries()) {
        const doc = createDoc(preset, { light });
        await waitMasks(doc.mark.layers);
        if (cancelled) return;
        next[`mark:${preset.id}`] = snap(doc, styleFor(doc));
        if (index % 8 === 7 && !previous) setThumbs({ ...next });
        await yieldTask();
      }
      staticCache[theme] = next;
      if (!cancelled) setThumbs({ ...next });
    })();
    return () => {
      cancelled = true;
    };
  }, [theme, light]);
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
      const next = { silhouette: snap(doc, { fill: { kind: 'solid', color1: '#ffffff' } }, 160) };
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
        next[item.id] = snap(doc, style);
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
