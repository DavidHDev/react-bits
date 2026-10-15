import { collectLayers, drawLayers } from './compose';
import { frameUrl, nextTask, waitForBridge } from './frame';

const FRAME_MS = 1000 / 60;
const HEAD_BUDGET = 480 * 1024 * 1024;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export const abortError = () => new DOMException('Export cancelled', 'AbortError');

const guard = signal => {
  if (signal?.aborted) throw abortError();
};

export const even = value => Math.max(2, Math.round(value / 2) * 2);

export async function createRenderer({ layout, output, ratio, theme, seed = 1 }) {
  const iframe = document.createElement('iframe');
  iframe.src = frameUrl({ theme, clock: 'manual', seed, dpr: ratio });
  iframe.setAttribute('aria-hidden', 'true');
  iframe.tabIndex = -1;
  Object.assign(iframe.style, {
    position: 'fixed',
    left: '0px',
    top: '0px',
    width: `${layout.width}px`,
    height: `${layout.height}px`,
    border: '0',
    opacity: '0',
    pointerEvents: 'none',
    zIndex: '-1',
    colorScheme: theme
  });
  document.body.appendChild(iframe);

  let api;
  try {
    api = await waitForBridge(iframe);
  } catch (problem) {
    iframe.remove();
    throw problem;
  }

  const canvas = document.createElement('canvas');
  canvas.width = output.width;
  canvas.height = output.height;
  const context = canvas.getContext('2d');

  return {
    canvas,
    context,
    async load(id, props, signal) {
      await api.load(id, props);
      const view = iframe.contentDocument;
      const started = performance.now();
      for (let frame = 0; ; frame += 1) {
        guard(signal);
        api.clock.step(1);
        await wait(16);
        const stage = api.stage();
        const layers = stage ? collectLayers(stage).layers.length : 0;
        const images = [...view.images].every(image => image.complete);
        const fonts = view.fonts?.status !== 'loading';
        if (frame >= 18 && layers > 0 && images && fonts) break;
        if (performance.now() - started > 9000) break;
      }
    },
    step(ms) {
      api.clock.step(ms);
    },
    draw(fill) {
      drawLayers(context, collectLayers(api.stage()), output.width, output.height, fill);
    },
    destroy() {
      iframe.remove();
    }
  };
}

async function advance(renderer, seconds, frameMs, signal, onTick) {
  const steps = Math.round((seconds * 1000) / frameMs);
  for (let index = 0; index < steps; index += 1) {
    renderer.step(frameMs);
    if (index % 3 === 2) {
      guard(signal);
      onTick?.(index / steps);
      await nextTask();
    }
  }
}

export async function renderImage({ entry, props, theme, layout, output, ratio, moment, fill, signal }) {
  const renderer = await createRenderer({ layout, output, ratio, theme });
  try {
    await renderer.load(entry.id, props, signal);
    await advance(renderer, moment, FRAME_MS, signal);
    guard(signal);
    renderer.step(FRAME_MS);
    renderer.draw(fill);
    return renderer.canvas;
  } finally {
    renderer.destroy();
  }
}

const smooth = t => t * t * (3 - 2 * t);

const BITS_PER_PIXEL = { standard: 0.06, high: 0.12, max: 0.25 };

const bitrateFor = (quality, output, fps, codec) => {
  const efficiency = codec === 'avc' || codec === 'vp8' ? 1 : 0.65;
  const raw = output.width * output.height * fps * (BITS_PER_PIXEL[quality] || BITS_PER_PIXEL.standard) * efficiency;
  return Math.round(Math.min(Math.max(raw, 1e6), 8e7));
};

export const estimateVideoBytes = ({ quality, output, fps, duration, format }) =>
  (bitrateFor(quality, output, fps, format === 'webm' ? 'vp9' : 'avc') * duration) / 8;

export async function videoSupport() {
  if (typeof VideoEncoder === 'undefined') return { mp4: false, webm: false };
  const { canEncodeVideo } = await import('mediabunny');
  const probe = codec => canEncodeVideo(codec, { width: 1920, height: 1080 }).catch(() => false);
  const [avc, vp9] = await Promise.all([probe('avc'), probe('vp9')]);
  return { mp4: avc, webm: vp9 };
}

export async function renderVideo({
  entry,
  props,
  theme,
  layout,
  output,
  ratio,
  fps,
  duration,
  start,
  loop,
  format,
  quality,
  fill,
  signal,
  onProgress
}) {
  const { Output, Mp4OutputFormat, WebMOutputFormat, BufferTarget, CanvasSource, Quality, canEncodeVideo } =
    await import('mediabunny');
  const codecs = format === 'webm' ? ['vp9', 'vp8', 'av1'] : ['avc', 'hevc'];
  let codec = null;
  for (const candidate of codecs) {
    if (await canEncodeVideo(candidate, { width: output.width, height: output.height }).catch(() => false)) {
      codec = candidate;
      break;
    }
  }
  if (!codec)
    throw new Error(`This browser can't encode ${format.toUpperCase()} at ${output.width} × ${output.height}.`);

  const renderer = await createRenderer({ layout, output, ratio, theme });
  const head = [];
  let media = null;
  let finished = false;
  try {
    onProgress?.({ phase: 'loading', progress: 0 });
    await renderer.load(entry.id, props, signal);

    const frameMs = 1000 / fps;
    await advance(renderer, start, frameMs, signal, progress => onProgress?.({ phase: 'warming', progress }));

    const total = Math.max(1, Math.round(duration * fps));
    const budget = Math.floor(HEAD_BUDGET / (output.width * output.height * 4));
    const blend = loop ? Math.max(0, Math.min(fps, Math.floor(total / 3), budget)) : 0;

    const target = new BufferTarget();
    media = new Output({
      format: format === 'webm' ? new WebMOutputFormat() : new Mp4OutputFormat({ fastStart: 'in-memory' }),
      target
    });
    const source = new CanvasSource(renderer.canvas, {
      codec,
      quality: new Quality({ bitrate: bitrateFor(quality, output, fps, codec) }),
      keyFrameInterval: 2
    });
    media.addVideoTrack(source, { frameRate: fps });
    await media.start();

    const started = performance.now();
    let written = 0;
    const frames = total + blend;

    for (let index = 0; index < frames; index += 1) {
      guard(signal);
      renderer.step(frameMs);
      renderer.draw(fill);

      if (index < blend) {
        head.push(await createImageBitmap(renderer.canvas));
      } else {
        if (index >= total) {
          const slot = index - total;
          renderer.context.save();
          renderer.context.globalAlpha = smooth((slot + 1) / (blend + 1));
          renderer.context.drawImage(head[slot], 0, 0, output.width, output.height);
          renderer.context.restore();
          head[slot].close();
        }
        await source.add(written / fps, 1 / fps);
        written += 1;
      }

      const elapsed = performance.now() - started;
      const done = index + 1;
      onProgress?.({
        phase: 'rendering',
        progress: done / frames,
        frame: done,
        frames,
        remaining: done > 4 ? ((frames - done) * elapsed) / done / 1000 : null
      });
      await nextTask();
    }

    guard(signal);
    onProgress?.({ phase: 'finishing', progress: 1 });
    source.close();
    await media.finalize();
    finished = true;
    return new Blob([target.buffer], { type: format === 'webm' ? 'video/webm' : 'video/mp4' });
  } finally {
    head.forEach(bitmap => bitmap.close?.());
    if (media && !finished) await media.cancel().catch(() => {});
    renderer.destroy();
  }
}
