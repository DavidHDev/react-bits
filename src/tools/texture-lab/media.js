import { openVideo, watchFrames } from './player';
import { decodeTexels } from './decode';

export const SAMPLES = [
  { id: 'neon', label: 'Neon', kind: 'video', url: '/assets/demo/neon-dancer.mp4' },
  { id: 'grass', label: 'Grass', kind: 'video', url: '/assets/demo/golden-grass.mp4' },
  { id: 'mountain', label: 'Mountain', kind: 'video', url: '/assets/demo/fuji-dawn.mp4' },
  { id: 'sky', label: 'Sky', kind: 'image', url: '/assets/demo/day-sky.webp' }
];

export function randomSampleVideo() {
  const videos = SAMPLES.filter(sample => sample.kind === 'video');
  return videos[Math.floor(Math.random() * videos.length)];
}

export const MAX_PREVIEW = 2048;
const MIN_PREVIEW = 1280;

export function workSize(media, limit = MAX_PREVIEW) {
  if (!media) return { width: 1, height: 1 };
  const long = Math.max(media.width, media.height);
  const scale = Math.min(limit / long, Math.max(1, MIN_PREVIEW / long));
  return {
    width: Math.max(1, Math.round(media.width * scale)),
    height: Math.max(1, Math.round(media.height * scale))
  };
}

const TEXEL_LIFE = 12000;
const texels = new WeakMap();
const decoding = new WeakMap();
const quick = new WeakSet();

const dropTexels = media => {
  const entry = texels.get(media);
  if (!entry) return;
  clearTimeout(entry.timer);
  entry.bitmap.close();
  texels.delete(media);
};

const keepTexels = (media, bitmap) => {
  dropTexels(media);
  texels.set(media, { bitmap, timer: setTimeout(() => dropTexels(media), TEXEL_LIFE) });
};

const liveTexels = media => {
  const entry = texels.get(media);
  if (!entry) return null;
  clearTimeout(entry.timer);
  entry.timer = setTimeout(() => dropTexels(media), TEXEL_LIFE);
  return entry.bitmap;
};

export function primeImage(media) {
  if (!media || !quick.has(media)) return Promise.resolve(false);
  if (liveTexels(media)) return Promise.resolve(true);
  if (!decoding.has(media)) {
    decoding.set(
      media,
      decodeTexels(media.file || media.url).then(bitmap => {
        decoding.delete(media);
        if (!bitmap) return false;
        if (!quick.has(media) || bitmap.width !== media.width || bitmap.height !== media.height) {
          bitmap.close();
          return false;
        }
        keepTexels(media, bitmap);
        return true;
      })
    );
  }
  return decoding.get(media);
}

export async function loadImage(src, extra = {}, { texels: wanted = false } = {}) {
  const image = new Image();
  image.decoding = 'async';
  image.crossOrigin = 'anonymous';
  const settled = wanted
    ? new Promise(resolve => {
        image.onload = () => resolve(true);
        image.onerror = () => resolve(false);
      })
    : null;
  image.src = src;
  const bitmap = wanted ? await decodeTexels(extra.file || src) : null;
  if (bitmap) {
    const sized = (await settled) && bitmap.width === image.naturalWidth && bitmap.height === image.naturalHeight;
    if (sized) {
      const media = { kind: 'image', element: image, width: image.naturalWidth, height: image.naturalHeight, ...extra };
      quick.add(media);
      keepTexels(media, bitmap);
      return media;
    }
    bitmap.close();
  }
  await image.decode();
  return { kind: 'image', element: image, width: image.naturalWidth, height: image.naturalHeight, ...extra };
}

export async function loadVideo(src, extra = {}) {
  const player = await openVideo({ file: extra.file, url: src });
  return {
    kind: 'video',
    player,
    width: player.width,
    height: player.height,
    duration: player.duration,
    ...extra
  };
}

export async function loadFile(file, options) {
  const url = URL.createObjectURL(file);
  const name = file.name.replace(/\.[^.]+$/, '') || 'media';
  try {
    if (file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(file.name)) {
      return await loadVideo(url, { file, url, name });
    }
    return await loadImage(url, { file, url, name }, options);
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

export async function loadSample(sample) {
  const name = sample.kind === 'video' ? `${sample.label} video` : `${sample.label} photo`;
  if (sample.kind === 'video') return loadVideo(sample.url, { name, sample: sample.id, url: sample.url });
  return loadImage(sample.url, { name, sample: sample.id, url: sample.url }, { texels: true });
}

export async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser does not offer camera access.');
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
    audio: false
  });
  const video = document.createElement('video');
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  await video.play();
  if (!video.videoWidth)
    await new Promise(resolve => video.addEventListener('loadedmetadata', resolve, { once: true }));
  return {
    kind: 'camera',
    element: video,
    width: video.videoWidth,
    height: video.videoHeight,
    stream,
    name: 'camera',
    mirror: true,
    frames: watchFrames(video)
  };
}

export function releaseMedia(media) {
  if (!media) return;
  quick.delete(media);
  dropTexels(media);
  media.frames?.stop?.();
  media.stream?.getTracks().forEach(track => track.stop());
  if (media.element?.pause) media.element.pause();
  media.player?.dispose();
  if (media.file && media.url) URL.revokeObjectURL(media.url);
}

export function mediaFrame(media) {
  if (!media) return null;
  if (media.kind === 'video') return media.player.drawable();
  const element = media.element;
  if (media.kind === 'camera') {
    if (element.readyState < 2 || !element.videoWidth) return null;
    return { image: element, width: element.videoWidth, height: element.videoHeight, rotation: 0, flip: false };
  }
  const bitmap = liveTexels(media);
  if (bitmap) {
    return { image: bitmap, width: media.width, height: media.height, rotation: 0, flip: false, bottomUp: true };
  }
  return { image: element, width: media.width, height: media.height, rotation: 0, flip: false };
}

export const isMediaFile = file =>
  Boolean(file) &&
  (file.type.startsWith('image/') || file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(file.name));
