import { isMediaFile, loadFile, loadImage, loadVideo, releaseMedia as releaseBase } from '../texture-lab/media';

export const SAMPLES = [
  { id: 'dark', label: 'Landing, dark', url: '/assets/center-stage/desktop.webp', slot: 0, role: 'desktop' },
  { id: 'mobile', label: 'Landing, mobile', url: '/assets/center-stage/mobile.webp', slot: 1, role: 'mobile' },
  { id: 'light', label: 'Landing, light', url: '/assets/center-stage/desktop-light.webp', slot: 2, role: 'desktop' }
];

export const BACKGROUND_IMAGES = [
  { value: 'sky-day', label: 'Day sky', url: '/assets/demo/day-sky.webp' },
  { value: 'sky-night', label: 'Night sky', url: '/assets/demo/night-sky.webp' }
];

export { isMediaFile };

export const releaseMedia = media => {
  media?.release?.();
  releaseBase(media);
};

const inferRole = media => (media.width / media.height < 0.7 && media.width <= 1600 ? 'mobile' : 'desktop');

export const roleOf = media => (media ? media.role || inferRole(media) : null);

export async function openSample(sample) {
  return loadImage(sample.url, { name: sample.label, sample: sample.id, url: sample.url, role: sample.role });
}

export async function openFile(file) {
  return loadFile(file);
}

export async function openUrl(url, name) {
  if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)) return loadVideo(url, { name, url });
  return loadImage(url, { name, url });
}

export function clipRange(media) {
  const duration = media?.duration || 0;
  const start = Math.min(Math.max(media?.trim?.start ?? 0, 0), duration);
  const end = Math.min(Math.max(media?.trim?.end ?? duration, start), duration);
  return { start, end, length: Math.max(0.1, end - start) };
}

export function frameOf(media) {
  if (!media) return null;
  if (media.kind === 'video') return media.player.drawable();
  if (media.kind === 'live') return media.frame();
  return { image: media.element, width: media.width, height: media.height };
}

export const mediaSizes = slots =>
  slots.map(media =>
    media ? { width: media.width, height: media.height, role: roleOf(media), sample: Boolean(media.sample) } : null
  );

export function shrinkImage(media, maxSide) {
  if (!media || media.kind !== 'image') return media;
  const role = roleOf(media);
  const long = Math.max(media.width, media.height);
  if (long <= maxSide) return Object.assign(media, { role });
  const scale = maxSide / long;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(media.width * scale));
  canvas.height = Math.max(1, Math.round(media.height * scale));
  const context = canvas.getContext('2d');
  context.imageSmoothingQuality = 'high';
  context.drawImage(media.element, 0, 0, canvas.width, canvas.height);
  return Object.assign(media, { element: canvas, width: canvas.width, height: canvas.height, role });
}

export function carryOver(doc, slots, surfaceRole) {
  const pools = { desktop: [], mobile: [] };
  slots.forEach((media, index) => {
    if (media && !media.sample) pools[roleOf(media)].push(index);
  });
  if (!pools.desktop.length && !pools.mobile.length) return doc;
  const count = { desktop: 0, mobile: 0 };
  const devices = doc.devices.map(device => {
    const role = surfaceRole(device);
    const pool = pools[role];
    if (!pool.length || device.blank) return device;
    return { ...device, pick: undefined, slot: pool[count[role]++ % pool.length] };
  });
  let background = doc.background;
  if (background?.kind === 'ambient') {
    const wanted = background.slot === 1 ? 'mobile' : 'desktop';
    const pool = pools[wanted].length ? pools[wanted] : pools[wanted === 'mobile' ? 'desktop' : 'mobile'];
    background = { ...background, slot: pool[0] };
  }
  return { ...doc, devices, background };
}
