import { collectLayers, drawLayers } from '../../../tools/background-studio/utils/compose';
import { waitForBridge } from '../../../tools/background-studio/utils/frame';
import { createRenderer } from '../engine/renderer';
import { bindMasks, loadField, maskPlan } from '../engine/masks';
import { isMaskLayer, ratioOf } from '../state/doc';
import { styleFor } from '../state/style';
import { morphCycle, morphPhase } from '../state/motion';
import { backgroundValues, materialFor } from '../presets/materials';
import { frameUrl } from '../frame/path';
import { icoFromPngs, zipFiles } from './zip';

export const even = value => Math.max(2, Math.round(value / 2) * 2);

export const abortError = () => new DOMException('Export cancelled', 'AbortError');

const guard = signal => {
  if (signal?.aborted) throw abortError();
};

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const yieldTask = () =>
  new Promise(resolve => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => resolve();
    channel.port2.postMessage(0);
  });

export const outputSize = (doc, longSide) => {
  const ratio = ratioOf(doc.artboard);
  return ratio.w >= ratio.h
    ? { width: longSide, height: Math.round((longSide * ratio.h) / ratio.w) }
    : { width: Math.round((longSide * ratio.w) / ratio.h), height: longSide };
};

export const prepareMasks = async doc => {
  const layers = [...doc.mark.layers, ...(doc.morph.on && doc.morph.target ? doc.morph.target.layers : [])];
  await Promise.all(layers.filter(isMaskLayer).map(layer => loadField(layer)));
};

const canvasOf = (width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

const gpuCanvas = (width, height) => {
  const canvas = canvasOf(width, height);
  return { canvas, renderer: createRenderer(canvas, { preserve: true }) };
};

export const drawMark = (renderer, doc, { width, height, morphT = 0, style, time = 0 }) => {
  const morph = doc.morph.on && doc.morph.target;
  const plan = maskPlan([doc.mark.layers, morph ? doc.morph.target.layers : null]);
  bindMasks(renderer, plan.keys);
  renderer.draw({
    scene: { a: doc.mark, b: morph ? doc.morph.target : null, morph: morph ? morphT : 0, maskSlots: plan.slots },
    style: style || styleFor(doc),
    width,
    height,
    time,
    surfaceResolution: 1024
  });
};

const SILHOUETTE = { fill: { kind: 'solid', color1: '#ffffff' }, background: { kind: 'none' } };

export const hasMotion = doc => {
  const material = materialFor(doc);
  if (doc.morph.on && doc.morph.target) return true;
  if (material.kind === 'procedural') return Boolean(material.def.animated);
  return material.kind !== 'flat';
};

export const materialSettings = (doc, maskSrc) => {
  const material = materialFor(doc);
  if (material.kind === 'metal') {
    return {
      kind: 'metal',
      id: 'metal',
      props: { ...material.props, imageSrc: maskSrc, scale: 1, intro: false, backgroundColor: 'transparent' }
    };
  }
  if (material.kind === 'background') {
    return {
      kind: 'background',
      id: `bg:${material.entry.id}`,
      props: backgroundValues(material)
    };
  }
  return null;
};

async function createMaterialFrame({ layout, output }) {
  const iframe = document.createElement('iframe');
  iframe.src = frameUrl({ theme: 'dark', clock: 'manual', seed: 1, dpr: output.width / layout.width });
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
    colorScheme: 'dark'
  });
  document.body.appendChild(iframe);
  let api;
  try {
    api = await waitForBridge(iframe);
  } catch (problem) {
    iframe.remove();
    throw problem;
  }
  const canvas = canvasOf(output.width, output.height);
  const context = canvas.getContext('2d');
  return {
    canvas,
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
        if (frame >= 18 && layers > 0 && images) break;
        if (performance.now() - started > 9000) break;
      }
    },
    step(ms) {
      api.clock.step(ms);
    },
    draw() {
      drawLayers(context, collectLayers(api.stage()), output.width, output.height);
    },
    destroy() {
      iframe.remove();
    }
  };
}

const layoutFor = (output, previewWidth) => {
  const width = Math.max(240, Math.min(previewWidth || 560, 900));
  return { width, height: Math.round((width * output.height) / output.width) };
};

async function createComposer(doc, output, { previewWidth, background = true, signal }) {
  await prepareMasks(doc);
  guard(signal);
  const base = gpuCanvas(output.width, output.height);
  const mask = gpuCanvas(output.width, output.height);
  const result = canvasOf(output.width, output.height);
  const resultContext = result.getContext('2d');
  const baseStyle = background ? styleFor(doc) : { ...styleFor(doc), background: { kind: 'none' } };
  const motionMorph = doc.morph.on && Boolean(doc.morph.target);
  const kind = materialFor(doc).kind;
  const scene = { a: doc.mark, b: motionMorph ? doc.morph.target : null };
  try {
    await base.renderer.prepareScene(scene, baseStyle);
    if (kind === 'metal' && !motionMorph) await mask.renderer.prepareScene(scene, SILHOUETTE);
    guard(signal);
  } catch (problem) {
    base.renderer.dispose();
    mask.renderer.dispose();
    throw problem;
  }
  let frame = null;
  let settings = null;
  if (kind === 'background') {
    settings = materialSettings(doc, null);
  } else if (kind === 'metal' && !motionMorph) {
    drawMark(mask.renderer, doc, { width: output.width, height: output.height, style: SILHOUETTE });
    settings = materialSettings(doc, mask.canvas.toDataURL('image/png'));
  }
  if (settings) {
    frame = await createMaterialFrame({ layout: layoutFor(output, previewWidth), output });
    await frame.load(settings.id, settings.props, signal);
  }
  return {
    canvas: result,
    render(time, frameMs) {
      const morphT = motionMorph ? morphPhase(time, doc.morph) : 0;
      if (frame && settings.kind === 'background') {
        if (frameMs) frame.step(frameMs);
        frame.draw();
        base.renderer.setMaterialTexture(frame.canvas);
      }
      drawMark(base.renderer, doc, { width: output.width, height: output.height, morphT, style: baseStyle, time });
      resultContext.clearRect(0, 0, output.width, output.height);
      resultContext.drawImage(base.canvas, 0, 0);
      if (frame && settings.kind === 'metal') {
        if (frameMs) frame.step(frameMs);
        frame.draw();
        resultContext.drawImage(frame.canvas, 0, 0);
      }
    },
    advance(ms) {
      frame?.step(ms);
    },
    destroy() {
      frame?.destroy();
      base.renderer.dispose();
      mask.renderer.dispose();
    }
  };
}

const toBlob = (canvas, type = 'image/png', quality) =>
  new Promise((resolve, reject) =>
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('The image could not be encoded.'))), type, quality)
  );

export async function renderPNG(doc, { longSide = 2048, background = true, previewWidth, moment = 1.2, signal } = {}) {
  const output = outputSize(doc, longSide);
  const composer = await createComposer(doc, output, { previewWidth, background, signal });
  try {
    if (hasMotion(doc) && materialFor(doc).kind !== 'flat') {
      const steps = Math.round((moment * 1000) / 16);
      for (let index = 0; index < steps; index += 1) {
        composer.advance(16);
        if (index % 8 === 7) await yieldTask();
      }
    }
    composer.render(doc.morph.on ? 0 : moment, 16);
    return { blob: await toBlob(composer.canvas), width: output.width, height: output.height };
  } finally {
    composer.destroy();
  }
}

export async function renderSilhouetteBlob(doc, longSide = 1024) {
  await prepareMasks(doc);
  const output = outputSize(doc, longSide);
  const { canvas, renderer } = gpuCanvas(output.width, output.height);
  try {
    const scene = { a: doc.mark, b: doc.morph.on ? doc.morph.target : null };
    await renderer.prepareScene(scene, SILHOUETTE);
    drawMark(renderer, doc, { width: output.width, height: output.height, style: SILHOUETTE });
    return await toBlob(canvas);
  } finally {
    renderer.dispose();
  }
}

const VIDEO_CODECS = { mp4: ['avc', 'hevc', 'av1', 'vp9'], webm: ['vp9', 'av1', 'vp8'] };
const FALLBACK_SIDES = [2560, 1920, 1280, 1080, 720];
const BITS_PER_PIXEL = { standard: 0.08, high: 0.16, max: 0.3 };

const bitrateFor = (quality, width, height, fps, format) => {
  const efficiency = format === 'webm' ? 0.65 : 1;
  const raw = width * height * fps * (BITS_PER_PIXEL[quality] || BITS_PER_PIXEL.standard) * efficiency;
  return Math.round(Math.min(Math.max(raw, 6e5), 6e7));
};

const outputFormat = (mb, format) =>
  format === 'webm' ? new mb.WebMOutputFormat() : new mb.Mp4OutputFormat({ fastStart: 'in-memory' });

async function pickVideoEncoding(mb, format, width, height, fps, quality) {
  const supported = outputFormat(mb, format).getSupportedVideoCodecs();
  const codecs = VIDEO_CODECS[format === 'webm' ? 'webm' : 'mp4'].filter(codec => supported.includes(codec));
  const attempt = async (w, h) => {
    const bitrate = bitrateFor(quality, w, h, fps, format);
    const codec = await mb
      .getFirstEncodableVideoCodec(codecs, {
        width: w,
        height: h,
        quality: new mb.Quality({ bitrate }),
        frameRate: fps
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

export const defaultDuration = doc => (doc.morph.on && doc.morph.target ? morphCycle(doc.morph) : 6);

export async function renderVideo(
  doc,
  { format, longSide, fps, duration, quality = 'high', fill, previewWidth, signal, onProgress }
) {
  const mb = await import('mediabunny');
  const wanted = outputSize(doc, longSide);
  const encoding = await pickVideoEncoding(mb, format, even(wanted.width), even(wanted.height), fps, quality);
  if (!encoding) throw new Error('This browser cannot encode video at this size. Try a smaller size or WebM.');
  const notes = [];
  if (encoding.width !== even(wanted.width))
    notes.push(`Saved at ${encoding.width} × ${encoding.height}, the largest size this browser can encode.`);
  const output = { width: encoding.width, height: encoding.height };
  onProgress?.({ phase: 'loading', progress: 0 });
  const composer = await createComposer(doc, output, { previewWidth, background: true, signal });
  const frame = canvasOf(output.width, output.height);
  const context = frame.getContext('2d');
  const target = new mb.BufferTarget();
  const out = new mb.Output({ format: outputFormat(mb, format), target });
  let finished = false;
  try {
    const source = new mb.CanvasSource(frame, {
      codec: encoding.codec,
      quality: new mb.Quality({ bitrate: encoding.bitrate }),
      keyFrameInterval: 2
    });
    out.addVideoTrack(source, { frameRate: fps });
    await out.start();
    const total = Math.max(1, Math.round(duration * fps));
    const frameMs = 1000 / fps;
    for (let index = 0; index < total; index += 1) {
      guard(signal);
      composer.render(index / fps, index === 0 ? 0 : frameMs);
      context.fillStyle = fill;
      context.fillRect(0, 0, output.width, output.height);
      context.drawImage(composer.canvas, 0, 0);
      await source.add(index / fps, 1 / fps);
      onProgress?.({ phase: 'rendering', progress: (index + 1) / total });
      if (index % 2 === 1) await yieldTask();
    }
    source.close();
    await out.finalize();
    finished = true;
    return {
      blob: new Blob([target.buffer], { type: format === 'webm' ? 'video/webm' : 'video/mp4' }),
      width: output.width,
      height: output.height,
      notes
    };
  } finally {
    if (!finished) await out.cancel().catch(() => {});
    composer.destroy();
  }
}

export async function renderGif(doc, { longSide, fps, duration, fill, previewWidth, signal, onProgress }) {
  const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
  const output = outputSize(doc, longSide);
  onProgress?.({ phase: 'loading', progress: 0 });
  const composer = await createComposer(doc, output, { previewWidth, background: true, signal });
  const frame = canvasOf(output.width, output.height);
  const context = frame.getContext('2d', { willReadFrequently: true });
  const gif = GIFEncoder();
  try {
    const total = Math.max(1, Math.round(duration * fps));
    const delay = Math.round(1000 / fps);
    const frameMs = 1000 / fps;
    let palette = null;
    for (let index = 0; index < total; index += 1) {
      guard(signal);
      composer.render(index / fps, index === 0 ? 0 : frameMs);
      context.fillStyle = fill;
      context.fillRect(0, 0, output.width, output.height);
      context.drawImage(composer.canvas, 0, 0);
      const data = context.getImageData(0, 0, output.width, output.height).data;
      const local = palette && materialFor(doc).kind === 'flat' ? palette : quantize(data, 256, { format: 'rgb565' });
      if (!palette) palette = local;
      gif.writeFrame(applyPalette(data, local, 'rgb565'), output.width, output.height, {
        palette: local,
        delay,
        repeat: 0
      });
      onProgress?.({ phase: 'rendering', progress: (index + 1) / total });
      await yieldTask();
    }
    gif.finish();
    return {
      blob: new Blob([gif.bytes()], { type: 'image/gif' }),
      width: output.width,
      height: output.height,
      notes: []
    };
  } finally {
    composer.destroy();
  }
}

const squareDoc = doc => ({ ...doc, artboard: { ...doc.artboard, ratio: '1:1' } });

const iconPng = async (doc, size, { background }) => {
  const render = await renderPNG(squareDoc(doc), { longSide: size, background });
  return render.blob;
};

export async function renderFavicons(doc, { svg, appleBackground }) {
  const solidDoc = {
    ...doc,
    artboard: { ...doc.artboard, background: { ...doc.artboard.background, kind: 'color', color1: appleBackground } }
  };
  const [p16, p32, p48, p180, p192, p512] = await Promise.all([
    iconPng(doc, 16, { background: true }),
    iconPng(doc, 32, { background: true }),
    iconPng(doc, 48, { background: true }),
    iconPng(solidDoc, 180, { background: true }),
    iconPng(doc, 192, { background: true }),
    iconPng(doc, 512, { background: true })
  ]);
  const ico = await icoFromPngs([
    { size: 16, blob: p16 },
    { size: 32, blob: p32 },
    { size: 48, blob: p48 }
  ]);
  const manifest = JSON.stringify(
    {
      name: doc.name || 'App',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
      ]
    },
    null,
    2
  );
  const files = [
    { name: 'favicon.ico', data: ico },
    { name: 'apple-touch-icon.png', data: p180 },
    { name: 'icon-192.png', data: p192 },
    { name: 'icon-512.png', data: p512 },
    { name: 'site.webmanifest', data: manifest }
  ];
  if (svg) files.unshift({ name: 'favicon.svg', data: svg });
  return zipFiles(files);
}

export const FAVICON_HTML = `<link rel="icon" href="/favicon.ico" sizes="48x48" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />`;
