import { Engine } from '../engine/engine';
import { EFFECTS } from '../effects';
import { mediaFrame } from '../media';

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

export function fitSize(media, longSide, round = Math.round) {
  const scale = longSide ? longSide / Math.max(media.width, media.height) : 1;
  return { width: round(media.width * scale), height: round(media.height * scale) };
}

const BITS_PER_PIXEL = { standard: 0.07, high: 0.14, max: 0.28 };

export const bitrateFor = (quality, width, height, fps, format) => {
  const efficiency = format === 'webm' ? 0.65 : 1;
  const raw = width * height * fps * (BITS_PER_PIXEL[quality] || BITS_PER_PIXEL.standard) * efficiency;
  return Math.round(Math.min(Math.max(raw, 6e5), 8e7));
};

function exportEngine(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return { canvas, engine: new Engine(canvas, { preserve: true }) };
}

const renderFrame = (engine, layers, media, width, height, time, orient = null, strength = 1) =>
  engine.render(layers, EFFECTS, {
    width,
    height,
    time,
    frame: Math.round(time * 30),
    mirror: Boolean(media.mirror),
    rotation: orient?.rotation || 0,
    flip: Boolean(orient?.flip),
    strength
  });

const uploadMedia = (engine, media) => {
  const frame = mediaFrame(media);
  if (!frame) throw new Error('The picture is not ready yet. Try again in a moment.');
  engine.setSource(frame.image, frame.width, frame.height);
  return frame;
};

const uploadSample = (engine, sample) => {
  const image = sample.toCanvasImageSource();
  engine.setSource(image, image.displayWidth ?? image.width, image.displayHeight ?? image.height);
  return { rotation: sample.rotation || 0, flip: Boolean(sample.flip) };
};

const VIDEO_CODECS = { mp4: ['avc', 'hevc', 'av1', 'vp9'], webm: ['vp9', 'av1', 'vp8'] };
const AUDIO_CODECS = { mp4: ['aac', 'opus'], webm: ['opus', 'vorbis'] };
const FALLBACK_SIDES = [3840, 2560, 1920, 1280];

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

async function pickAudioCodec(mb, format, track) {
  if (!track) return null;
  const supported = outputFormat(mb, format).getSupportedAudioCodecs();
  const codecs = AUDIO_CODECS[format === 'webm' ? 'webm' : 'mp4'].filter(codec => supported.includes(codec));
  const numberOfChannels = (await track.getNumberOfChannels?.().catch(() => null)) ?? track.numberOfChannels ?? 2;
  const sampleRate = (await track.getSampleRate?.().catch(() => null)) ?? track.sampleRate ?? 48000;
  return mb.getFirstEncodableAudioCodec(codecs, { numberOfChannels, sampleRate }).catch(() => null);
}

const CODEC_NAMES = { avc: 'H.264', hevc: 'HEVC', av1: 'AV1', vp9: 'VP9', vp8: 'VP8' };

export async function renderStill({
  media,
  layers,
  strength = 1,
  time,
  width,
  height,
  mime = 'image/png',
  quality = 0.92
}) {
  const { canvas, engine } = exportEngine(width, height);
  try {
    const orient = uploadMedia(engine, media);
    renderFrame(engine, layers, media, width, height, time, orient, strength);
    return await new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('The image could not be encoded.'))),
        mime,
        quality
      );
    });
  } finally {
    engine.dispose();
  }
}

export async function videoSupport() {
  if (typeof VideoEncoder === 'undefined') return { mp4: false, webm: false };
  const { canEncodeVideo } = await import('mediabunny');
  const probe = codec => canEncodeVideo(codec, { width: 1280, height: 720 }).catch(() => false);
  const [avc, vp9] = await Promise.all([probe('avc'), probe('vp9')]);
  return { mp4: avc, webm: vp9 };
}

export async function renderVideoFromVideo({
  media,
  layers,
  strength = 1,
  trim,
  width,
  height,
  fps,
  format,
  quality,
  audio,
  signal,
  onProgress
}) {
  const mb = await import('mediabunny');
  const source = media.file ? new mb.BlobSource(media.file) : new mb.UrlSource(media.url);
  const input = new mb.Input({ source, formats: mb.ALL_FORMATS });
  const notes = [];
  let engine = null;
  try {
    const encoding = await pickVideoEncoding(mb, format, width, height, fps, quality);
    if (!encoding) throw new Error('This browser cannot encode video at this size. Try a smaller size or WebM.');
    if (encoding.width !== width || encoding.height !== height) {
      notes.push(`Saved at ${encoding.width} × ${encoding.height}, the largest size this browser can encode.`);
    }
    if (encoding.codec !== (format === 'webm' ? 'vp9' : 'avc'))
      notes.push(`Encoded as ${CODEC_NAMES[encoding.codec]}.`);
    const audioTrack = audio ? await input.getPrimaryAudioTrack().catch(() => null) : null;
    const audioCodec = audioTrack ? await pickAudioCodec(mb, format, audioTrack) : null;
    if (audioTrack && !audioCodec) notes.push('The sound was left out because this browser cannot encode it.');
    const exported = exportEngine(encoding.width, encoding.height);
    engine = exported.engine;
    const target = new mb.BufferTarget();
    const output = new mb.Output({ format: outputFormat(mb, format), target });
    let offset = null;
    const conversion = await mb.Conversion.init({
      input,
      output,
      trim: { start: trim[0], end: trim[1] },
      video: {
        codec: encoding.codec,
        quality: new mb.Quality({ bitrate: encoding.bitrate }),
        frameRate: fps || undefined,
        forceTranscode: true,
        allowTransformationMetadata: false,
        processedWidth: encoding.width,
        processedHeight: encoding.height,
        process: sample => {
          if (offset === null) offset = sample.timestamp < trim[0] - 0.05 ? trim[0] : 0;
          const orient = uploadSample(engine, sample);
          renderFrame(
            engine,
            layers,
            media,
            encoding.width,
            encoding.height,
            sample.timestamp + offset,
            orient,
            strength
          );
          return exported.canvas;
        }
      },
      audio: audioCodec ? { codec: audioCodec } : { discard: true }
    });
    if (!conversion.isValid) {
      const dropped =
        conversion.discardedTracks?.find(item => item.track?.type === 'video') ?? conversion.discardedTracks?.[0];
      const reasons = {
        undecodable_source_codec: 'This browser cannot decode this video.',
        unknown_source_codec: 'This video uses a codec this browser does not know.',
        no_encodable_target_codec: 'This browser cannot encode this video. Try a smaller size or WebM.'
      };
      throw new Error(reasons[dropped?.reason] || "This video can't be converted here.");
    }
    conversion.onProgress = value => onProgress?.({ phase: 'rendering', progress: value });
    const stop = () => conversion.cancel();
    signal?.addEventListener('abort', stop, { once: true });
    await conversion.execute();
    signal?.removeEventListener('abort', stop);
    guard(signal);
    return {
      blob: new Blob([target.buffer], { type: format === 'webm' ? 'video/webm' : 'video/mp4' }),
      width: encoding.width,
      height: encoding.height,
      notes
    };
  } finally {
    engine?.dispose();
    input.dispose?.();
  }
}

export async function renderVideoFromStill({
  media,
  layers,
  strength = 1,
  width,
  height,
  fps,
  duration,
  start,
  format,
  quality,
  signal,
  onProgress
}) {
  const mb = await import('mediabunny');
  const encoding = await pickVideoEncoding(mb, format, width, height, fps, quality);
  if (!encoding) throw new Error('This browser cannot encode video at this size. Try a smaller size or WebM.');
  const notes = [];
  if (encoding.width !== width || encoding.height !== height) {
    notes.push(`Saved at ${encoding.width} × ${encoding.height}, the largest size this browser can encode.`);
  }
  if (encoding.codec !== (format === 'webm' ? 'vp9' : 'avc')) notes.push(`Encoded as ${CODEC_NAMES[encoding.codec]}.`);
  const { canvas, engine } = exportEngine(encoding.width, encoding.height);
  const target = new mb.BufferTarget();
  const output = new mb.Output({ format: outputFormat(mb, format), target });
  let finished = false;
  try {
    const orient = uploadMedia(engine, media);
    const source = new mb.CanvasSource(canvas, {
      codec: encoding.codec,
      quality: new mb.Quality({ bitrate: encoding.bitrate }),
      keyFrameInterval: 2
    });
    output.addVideoTrack(source, { frameRate: fps });
    await output.start();
    const total = Math.max(1, Math.round(duration * fps));
    for (let index = 0; index < total; index += 1) {
      guard(signal);
      renderFrame(engine, layers, media, encoding.width, encoding.height, start + index / fps, orient, strength);
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
    engine.dispose();
  }
}

const sameFrame = (a, b) => {
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index += 1) if (a[index] !== b[index]) return false;
  return true;
};

export async function renderGif({
  media,
  layers,
  strength = 1,
  width,
  height,
  fps,
  duration,
  start,
  signal,
  onProgress
}) {
  const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
  const { canvas, engine } = exportEngine(width, height);
  const copy = document.createElement('canvas');
  copy.width = width;
  copy.height = height;
  const context = copy.getContext('2d', { willReadFrequently: true });
  const total = Math.max(1, Math.round(duration * fps));
  const gif = GIFEncoder();
  let sink = null;
  let input = null;
  try {
    if (media.kind === 'video') {
      const mb = await import('mediabunny');
      input = new mb.Input({
        source: media.file ? new mb.BlobSource(media.file) : new mb.UrlSource(media.url),
        formats: mb.ALL_FORMATS
      });
      const track = await input.getPrimaryVideoTrack();
      sink = new mb.VideoSampleSink(track);
    }
    let orient = sink ? null : uploadMedia(engine, media);
    const times = Array.from({ length: total }, (_, index) => start + index / fps);
    const samples = sink ? sink.samplesAtTimestamps(times) : null;
    const delay = Math.round(1000 / fps);
    let palette = null;
    let previous = null;
    let pending = null;
    const flush = () => {
      if (pending)
        gif.writeFrame(pending.indexed, width, height, { palette: pending.palette, delay: pending.delay, repeat: 0 });
      pending = null;
    };
    for (let index = 0; index < total; index += 1) {
      guard(signal);
      const time = times[index];
      if (samples) {
        const { value: sample } = await samples.next();
        if (sample) {
          try {
            orient = uploadSample(engine, sample);
          } finally {
            sample.close();
          }
        }
      }
      renderFrame(engine, layers, media, width, height, time, orient, strength);
      context.drawImage(canvas, 0, 0);
      const data = context.getImageData(0, 0, width, height).data;
      if (pending && previous && sameFrame(previous, data)) {
        pending.delay += delay;
      } else {
        flush();
        const local = media.kind === 'video' || !palette ? quantize(data, 256, { format: 'rgb565' }) : palette;
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
    engine.dispose();
    input?.dispose?.();
  }
}
