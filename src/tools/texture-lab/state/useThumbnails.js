import { useEffect, useState } from 'react';
import { Engine } from '../engine/engine';
import { EFFECT_LIST, EFFECTS, lookPrimary } from '../effects';
import { LOOKS } from '../looks';
import { createLayer } from './useLayers';
import { mediaFrame } from '../media';

const THUMB_WIDTH = 320;
const THUMB_HEIGHT = 220;
const ZOOM = 2.5;
const ZOOMED_GROUPS = new Set(['type', 'print', 'art']);
const ZOOMED_CATEGORIES = new Set(['type', 'art', 'analog']);

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

const jobsFor = () => [
  ...LOOKS.map(look => ({
    key: `look:${look.id}`,
    zoom: lookZoom(look),
    layers: look.layers.map(item => createLayer(item.type, item))
  })),
  ...EFFECT_LIST.map(effect => ({
    key: `fx:${effect.id}`,
    zoom: effect.preview?.zoom ?? (ZOOMED_CATEGORIES.has(effect.category) ? ZOOM : 1),
    layers: [createLayer(effect.id, { params: effect.preview?.params })]
  }))
];

export function useThumbnails(media, version) {
  const [thumbs, setThumbs] = useState({});

  useEffect(() => {
    if (!media?.width) return undefined;
    let cancelled = false;
    let timer = 0;
    const canvas = document.createElement('canvas');
    const crop = document.createElement('canvas');
    crop.width = THUMB_WIDTH;
    crop.height = THUMB_HEIGHT;
    const cropContext = crop.getContext('2d');
    let engine;
    try {
      engine = new Engine(canvas, { preserve: true });
    } catch {
      return undefined;
    }
    let orient = null;
    try {
      const frame = mediaFrame(media);
      if (!frame) throw new Error('No frame');
      engine.setSource(frame.image, frame.width, frame.height);
      orient = frame;
    } catch {
      engine.dispose();
      return undefined;
    }
    const jobs = jobsFor();
    let disposed = false;
    const finish = () => {
      if (disposed) return;
      disposed = true;
      engine.dispose();
    };
    let pending = {};
    const flush = () => {
      const batch = pending;
      pending = {};
      if (!cancelled && Object.keys(batch).length) setThumbs(previous => ({ ...previous, ...batch }));
    };
    const run = index => {
      if (cancelled) return;
      if (index >= jobs.length) {
        flush();
        finish();
        return;
      }
      const job = jobs[index];
      const { width, height, x, y } = thumbLayout(media, job.zoom);
      try {
        engine.render(job.layers, EFFECTS, {
          width,
          height,
          time: 1.2,
          frame: 36,
          mirror: Boolean(media.mirror),
          rotation: orient.rotation,
          flip: orient.flip
        });
        cropContext.drawImage(canvas, x, y, THUMB_WIDTH, THUMB_HEIGHT, 0, 0, THUMB_WIDTH, THUMB_HEIGHT);
        pending[job.key] = crop.toDataURL('image/jpeg', 0.86);
      } catch {
        pending[job.key] = null;
      }
      if (index % 4 === 3) flush();
      timer = setTimeout(() => run(index + 1), 0);
    };
    timer = setTimeout(() => run(0), 60);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      finish();
    };
  }, [media, version]);

  return thumbs;
}
