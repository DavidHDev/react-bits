import { useEffect, useRef, useState } from 'react';
import { createRenderer } from '../engine/renderer';
import { bindMasks, loadField, maskPlan, masksReady } from '../engine/masks';
import { isMaskLayer, ratioOf } from './doc';

let shared = null;

const maskRenderer = () => {
  if (shared) return shared;
  const canvas = document.createElement('canvas');
  shared = { canvas, renderer: createRenderer(canvas, { preserve: true }) };
  return shared;
};

export const renderSilhouette = async (doc, longSide = 1024) => {
  const ratio = ratioOf(doc.artboard);
  const width = ratio.w >= ratio.h ? longSide : Math.round((longSide * ratio.w) / ratio.h);
  const height = ratio.w >= ratio.h ? Math.round((longSide * ratio.h) / ratio.w) : longSide;
  const { canvas, renderer } = maskRenderer();
  const plan = maskPlan([doc.mark.layers]);
  const scene = { a: doc.mark, maskSlots: plan.slots };
  const style = { fill: { kind: 'solid', color1: '#ffffff' }, background: { kind: 'none' } };
  await renderer.prepareScene(scene, style);
  bindMasks(renderer, plan.keys);
  renderer.draw({
    scene,
    style,
    width,
    height
  });
  return canvas;
};

export function useMarkMask(doc, enabled) {
  const [url, setUrl] = useState(null);
  const docRef = useRef(doc);
  docRef.current = doc;
  const markKey = JSON.stringify([doc.mark, doc.artboard.ratio]);
  const timer = useRef(0);
  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const current = docRef.current;
      await Promise.all(current.mark.layers.filter(isMaskLayer).map(layer => loadField(layer).catch(() => null)));
      if (cancelled) return;
      const plan = maskPlan([current.mark.layers]);
      if (!masksReady(plan.keys)) return;
      const canvas = await renderSilhouette(current, 1024);
      if (!cancelled) setUrl(canvas.toDataURL('image/png'));
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(timer.current);
    };
  }, [markKey, enabled]);
  return url;
}
