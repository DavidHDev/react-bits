import { openExportBackdrop } from '../backdrop';
import { Renderer } from '../engine/renderer';
import { TextCache, prepareShot, renderShot } from '../engine/shot';
import { normalizeDoc } from '../engine/scene';
import { clipRange, frameOf, mediaSizes } from '../media';
import { loadBackgroundImage } from '../state/useThumbnails';

export const even = value => Math.max(2, Math.round(value / 2) * 2);

export const abortError = () => new DOMException('Export cancelled', 'AbortError');

const guard = signal => {
  if (signal?.aborted) throw abortError();
};

const yieldTask = () =>
  new Promise(resolve => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => resolve();
    channel.port2.postMessage(0);
  });

const BITS_PER_PIXEL = { standard: 0.07, high: 0.14, max: 0.28 };

export const bitrateFor = (quality, width, height, fps, format) => {
  const efficiency = format === 'webm' ? 0.65 : 1;
  const raw = width * height * fps * (BITS_PER_PIXEL[quality] || BITS_PER_PIXEL.standard) * efficiency;
  return Math.round(Math.min(Math.max(raw, 6e5), 8e7));
};

export function shotSize(aspect, longSide, round = Math.round) {
  return aspect >= 1
    ? { width: round(longSide), height: round(longSide / aspect) }
    : { width: round(longSide * aspect), height: round(longSide) };
}

const VIDEO_CODECS = { mp4: ['avc', 'hevc', 'av1', 'vp9'], webm: ['vp9', 'av1', 'vp8'] };
const FALLBACK_SIDES = [3840, 2560, 1920, 1280];
const CODEC_NAMES = { avc: 'H.264', hevc: 'HEVC', av1: 'AV1', vp9: 'VP9', vp8: 'VP8' };

const outputFormat = (mb, format) =>
  format === 'webm' ? new mb.WebMOutputFormat() : new mb.Mp4OutputFormat({ fastStart: 'in-memory' });

async function pickVideoEncoding(mb, format, width, height, fps, quality) {
  const supported = outputFormat(mb, format).getSupportedVideoCodecs();
  const codecs = VIDEO_CODECS[format === 'webm' ? 'webm' : 'mp4'].filter(codec => supported.includes(codec));
  const attempt = async (w, h) => {
    const bitrate = bitrateFor(quality, w, h, fps || 30, format);
    const codec = await mb
      .getFirstEncodableVideoCodec(codecs, {
        width: w,
        height: h,
        quality: new mb.Quality({ bitrate }),
        frameRate: fps || 30
      })
      .catch(() => null);
    return codec ? { codec, width: w, height: h, bitrate } : null;
  };
  const exact = await attempt(width, height);
  if (exact) return exact;
  const long = Math.max(width, height);
  for (const side of FALLBACK_SIDES) {
    if (side >= long) continue;
    const scale = side / long;
    const found = await attempt(even(width * scale), even(height * scale));
    if (found) return found;
  }
  return null;
}

export async function videoSupport() {
  if (typeof VideoEncoder === 'undefined') return { mp4: false, webm: false };
  const { canEncodeVideo } = await import('mediabunny');
  const probe = codec => canEncodeVideo(codec, { width: 1280, height: 720 }).catch(() => false);
  const [avc, vp9] = await Promise.all([probe('avc'), probe('vp9')]);
  return { mp4: avc, webm: vp9 };
}

async function createStudio({ doc, slots, background, width, height }) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const pixels = width * height;
  const renderer = new Renderer(canvas, { preserve: true, samples: pixels > 9e6 ? 2 : 4 });
  if (Math.max(width, height) > renderer.maxSize) {
    renderer.dispose();
    throw new Error(`This browser can render up to ${renderer.maxSize}px. Pick a smaller size.`);
  }
  await prepareShot(doc);
  const bg = doc.background || {};
  if (bg.kind === 'image') {
    if (bg.image === 'custom' && background) {
      const frame = frameOf(background);
      if (frame) renderer.setBackgroundImage(frame.image, frame.width, frame.height);
    } else {
      const image = await loadBackgroundImage(bg.image);
      if (image) renderer.setBackgroundImage(image, image.naturalWidth, image.naturalHeight);
    }
  }
  slots.forEach((media, slot) => {
    if (!media || media.kind === 'video') return;
    const frame = frameOf(media);
    if (frame) renderer.setMedia(slot, frame.image, frame.width, frame.height);
  });
  let backdrop = null;
  if (bg.kind === 'reactbits') {
    try {
      backdrop = await openExportBackdrop(bg, width, height);
    } catch (problem) {
      renderer.dispose();
      throw problem;
    }
  }
  return { canvas, renderer, backdrop, cache: new TextCache(2), sizes: mediaSizes(slots) };
}

const syncBackdrop = (studio, time) => {
  if (!studio.backdrop) return;
  studio.backdrop.seek(time);
  studio.renderer.setBackgroundImage(
    studio.backdrop.canvas,
    studio.backdrop.canvas.width,
    studio.backdrop.canvas.height
  );
};

const closeStudio = studio => {
  studio.backdrop?.destroy();
  studio.renderer.dispose();
};

async function openVideoSinks(slots) {
  const sinks = [];
  for (let slot = 0; slot < slots.length; slot += 1) {
    const media = slots[slot];
    if (!media || media.kind !== 'video') continue;
    const mb = await import('mediabunny');
    const input = new mb.Input({
      source: media.file ? new mb.BlobSource(media.file) : new mb.UrlSource(media.url),
      formats: mb.ALL_FORMATS
    });
    const track = await input.getPrimaryVideoTrack();
    const first = await track.getFirstTimestamp();
    const last = await input.computeDuration();
    const range = media.trim ? clipRange(media) : null;
    const start = range ? Math.max(first, range.start) : first;
    const end = range ? Math.min(last, range.end) : last;
    sinks.push({ slot, input, sink: new mb.VideoSampleSink(track), start, duration: Math.max(0.1, end - start) });
  }
  return sinks;
}

function videoFrames(sinks, times) {
  return sinks.map(item => ({
    ...item,
    iterator: item.sink.samplesAtTimestamps(
      times.map(time => item.start + (((time % item.duration) + item.duration) % item.duration))
    )
  }));
}

async function uploadVideoFrames(renderer, streams) {
  for (const stream of streams) {
    const { value: sample } = await stream.iterator.next();
    if (!sample) continue;
    try {
      const image = sample.toCanvasImageSource();
      renderer.setMedia(stream.slot, image, sample.displayWidth ?? image.width, sample.displayHeight ?? image.height, {
        mips: true
      });
    } finally {
      sample.close();
    }
  }
}

const closeSinks = sinks => sinks.forEach(item => item.input.dispose?.());

export async function renderStill({
  doc: input,
  slots,
  background,
  time,
  width,
  height,
  mime = 'image/png',
  quality = 0.92
}) {
  const doc = normalizeDoc(input);
  const studio = await createStudio({ doc, slots, background, width, height });
  const sinks = await openVideoSinks(slots);
  try {
    if (sinks.length) await uploadVideoFrames(studio.renderer, videoFrames(sinks, [time]));
    syncBackdrop(studio, time);
    renderShot(studio.renderer, doc, studio.sizes, { width, height, time, cache: studio.cache, seed: 11 });
    return await new Promise((resolve, reject) => {
      studio.canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('The image could not be encoded.'))),
        mime,
        quality
      );
    });
  } finally {
    closeSinks(sinks);
    closeStudio(studio);
  }
}

export async function renderVideo({
  doc: input,
  slots,
  background,
  width,
  height,
  fps,
  duration,
  start = 0,
  format,
  quality,
  signal,
  onProgress
}) {
  const doc = normalizeDoc(input);
  const mb = await import('mediabunny');
  const encoding = await pickVideoEncoding(mb, format, width, height, fps, quality);
  if (!encoding) throw new Error('This browser cannot encode video at this size. Try a smaller size or WebM.');
  const notes = [];
  if (encoding.width !== width || encoding.height !== height)
    notes.push(`Saved at ${encoding.width} × ${encoding.height}, the largest size this browser can encode.`);
  if (encoding.codec !== (format === 'webm' ? 'vp9' : 'avc')) notes.push(`Encoded as ${CODEC_NAMES[encoding.codec]}.`);
  const studio = await createStudio({ doc, slots, background, width: encoding.width, height: encoding.height });
  const sinks = await openVideoSinks(slots);
  const target = new mb.BufferTarget();
  const output = new mb.Output({ format: outputFormat(mb, format), target });
  let finished = false;
  try {
    const source = new mb.CanvasSource(studio.canvas, {
      codec: encoding.codec,
      quality: new mb.Quality({ bitrate: encoding.bitrate }),
      keyFrameInterval: 2
    });
    output.addVideoTrack(source, { frameRate: fps });
    await output.start();
    const total = Math.max(1, Math.round(duration * fps));
    const times = Array.from({ length: total }, (_, index) => start + index / fps);
    const streams = videoFrames(sinks, times);
    for (let index = 0; index < total; index += 1) {
      guard(signal);
      if (streams.length) await uploadVideoFrames(studio.renderer, streams);
      syncBackdrop(studio, times[index]);
      renderShot(studio.renderer, doc, studio.sizes, {
        width: encoding.width,
        height: encoding.height,
        time: times[index],
        cache: studio.cache,
        seed: index % 97
      });
      await source.add(index / fps, 1 / fps);
      onProgress?.({ phase: 'rendering', progress: (index + 1) / total });
      await yieldTask();
    }
    source.close();
    await output.finalize();
    finished = true;
    return {
      blob: new Blob([target.buffer], { type: format === 'webm' ? 'video/webm' : 'video/mp4' }),
      width: encoding.width,
      height: encoding.height,
      notes
    };
  } finally {
    if (!finished) await output.cancel().catch(() => {});
    closeSinks(sinks);
    closeStudio(studio);
  }
}

const sameFrame = (a, b) => {
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index += 1) if (a[index] !== b[index]) return false;
  return true;
};

export async function renderGif({
  doc: input,
  slots,
  background,
  width,
  height,
  fps,
  duration,
  start = 0,
  signal,
  onProgress
}) {
  const doc = normalizeDoc(input);
  const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
  const studio = await createStudio({ doc, slots, background, width, height });
  const sinks = await openVideoSinks(slots);
  const copy = document.createElement('canvas');
  copy.width = width;
  copy.height = height;
  const context = copy.getContext('2d', { willReadFrequently: true });
  const total = Math.max(1, Math.round(duration * fps));
  const times = Array.from({ length: total }, (_, index) => start + index / fps);
  const streams = videoFrames(sinks, times);
  const gif = GIFEncoder();
  const delay = Math.round(1000 / fps);
  let palette = null;
  let previous = null;
  let pending = null;
  const flush = () => {
    if (pending)
      gif.writeFrame(pending.indexed, width, height, { palette: pending.palette, delay: pending.delay, repeat: 0 });
    pending = null;
  };
  try {
    for (let index = 0; index < total; index += 1) {
      guard(signal);
      if (streams.length) await uploadVideoFrames(studio.renderer, streams);
      syncBackdrop(studio, times[index]);
      renderShot(studio.renderer, doc, studio.sizes, {
        width,
        height,
        time: times[index],
        cache: studio.cache,
        seed: 3
      });
      context.drawImage(studio.canvas, 0, 0);
      const data = context.getImageData(0, 0, width, height).data;
      if (pending && previous && sameFrame(previous, data)) {
        pending.delay += delay;
      } else {
        flush();
        const local = sinks.length || !palette ? quantize(data, 256, { format: 'rgb565' }) : palette;
        if (!palette) palette = local;
        pending = { indexed: applyPalette(data, local, 'rgb565'), palette: local, delay };
        previous = data;
      }
      onProgress?.({ phase: 'rendering', progress: (index + 1) / total });
      await yieldTask();
    }
    flush();
    gif.finish();
    return new Blob([gif.bytes()], { type: 'image/gif' });
  } finally {
    closeSinks(sinks);
    closeStudio(studio);
  }
}
