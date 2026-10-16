import { openVideo } from './player';

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

export async function loadImage(src, extra = {}) {
  const image = new Image();
  image.decoding = 'async';
  image.crossOrigin = 'anonymous';
  image.src = src;
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

export async function loadFile(file) {
  const url = URL.createObjectURL(file);
  const name = file.name.replace(/\.[^.]+$/, '') || 'media';
  try {
    if (file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(file.name)) {
      return await loadVideo(url, { file, url, name });
    }
    return await loadImage(url, { file, url, name });
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

export async function loadSample(sample) {
  const name = sample.kind === 'video' ? `${sample.label} video` : `${sample.label} photo`;
  if (sample.kind === 'video') return loadVideo(sample.url, { name, sample: sample.id, url: sample.url });
  return loadImage(sample.url, { name, sample: sample.id, url: sample.url });
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
    mirror: true
  };
}

export function releaseMedia(media) {
  if (!media) return;
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
  return { image: element, width: media.width, height: media.height, rotation: 0, flip: false };
}

export const isMediaFile = file =>
  Boolean(file) &&
  (file.type.startsWith('image/') || file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(file.name));
