const OPTIONS = { imageOrientation: 'flipY', premultiplyAlpha: 'premultiply', colorSpaceConversion: 'none' };
const HEAD = 262144;
const PNG_LIMIT = 67108864;

const text = (bytes, at, value) => {
  for (let index = 0; index < value.length; index += 1) {
    if (bytes[at + index] !== value.charCodeAt(index)) return false;
  }
  return true;
};

const exif = (bytes, start, end) => {
  if (end > bytes.length || start + 8 > end) return null;
  const little = bytes[start] === 0x49 && bytes[start + 1] === 0x49;
  if (!little && !(bytes[start] === 0x4d && bytes[start + 1] === 0x4d)) return null;
  const short = at => (little ? bytes[at] | (bytes[at + 1] << 8) : (bytes[at] << 8) | bytes[at + 1]);
  const long = at => (little ? short(at) + short(at + 2) * 65536 : short(at) * 65536 + short(at + 2));
  if (short(start + 2) !== 42) return null;
  const find = (directory, tags) => {
    if (directory + 2 > end) return false;
    const count = short(directory);
    if (directory + 2 + count * 12 > end) return false;
    for (let index = 0; index < count; index += 1) {
      const entry = directory + 2 + index * 12;
      const tag = short(entry);
      if (tag in tags) tags[tag] = short(entry + 2) === 4 ? long(entry + 8) : short(entry + 8);
    }
    return true;
  };
  const main = { 0x0112: 1, 0x8769: 0 };
  if (!find(start + long(start + 4), main)) return null;
  const detail = { 0xa001: 1 };
  if (main[0x8769] && !find(start + main[0x8769], detail)) return null;
  return { turned: main[0x0112] !== 1, tagged: detail[0xa001] !== 1 };
};

const jpegSafe = bytes => {
  let at = 2;
  let components = 0;
  let turned = false;
  let tagged = false;
  while (at + 4 <= bytes.length) {
    if (bytes[at] !== 0xff) return false;
    const marker = bytes[at + 1];
    if (marker === 0xff) {
      at += 1;
    } else if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      at += 2;
    } else {
      const size = (bytes[at + 2] << 8) | bytes[at + 3];
      if (size < 2) return false;
      if (marker === 0xda) return components === 3 && !(turned && tagged);
      if (marker === 0xe1 && text(bytes, at + 4, 'Exif\0\0')) {
        const info = exif(bytes, at + 10, at + 2 + size);
        if (!info) return false;
        turned = turned || info.turned;
        tagged = tagged || info.tagged;
      }
      if (marker === 0xe2 && text(bytes, at + 4, 'ICC_PROFILE\0')) tagged = true;
      const frame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (frame) components = bytes[at + 9];
      at += 2 + size;
    }
  }
  return false;
};

const pngSafe = bytes => {
  if (bytes[24] !== 8 || (bytes[25] !== 2 && bytes[25] !== 3)) return false;
  let at = 8;
  while (at + 12 <= bytes.length) {
    const size = bytes[at] * 16777216 + (bytes[at + 1] << 16) + (bytes[at + 2] << 8) + bytes[at + 3];
    if (text(bytes, at + 4, 'tRNS') || text(bytes, at + 4, 'eXIf') || text(bytes, at + 4, 'acTL')) return false;
    if (text(bytes, at + 4, 'IEND')) return true;
    at += 12 + size;
  }
  return false;
};

const webpSafe = bytes => {
  if (text(bytes, 12, 'VP8 ')) return true;
  if (text(bytes, 12, 'VP8L')) return bytes[20] === 0x2f && (bytes[24] & 0x10) === 0;
  if (text(bytes, 12, 'VP8X')) return (bytes[20] & 0x1a) === 0;
  return false;
};

const read = async (blob, length) => new Uint8Array(await blob.slice(0, length).arrayBuffer());

export async function identical(blob) {
  const head = await read(blob, 32);
  if (head.length < 32) return false;
  if (head[0] === 0xff && head[1] === 0xd8) return jpegSafe(await read(blob, HEAD));
  if (head[0] === 0x89 && text(head, 1, 'PNG\r\n\x1a\n')) {
    return blob.size <= PNG_LIMIT && pngSafe(await read(blob, blob.size));
  }
  if (text(head, 0, 'RIFF') && text(head, 8, 'WEBP')) return webpSafe(head);
  return false;
}

let flips = null;

const probe = async () => {
  try {
    const data = new ImageData(1, 2);
    data.data.set([255, 0, 0, 255, 0, 0, 255, 255]);
    const bitmap = await createImageBitmap(data, OPTIONS);
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 2;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(bitmap, 0, 0);
    bitmap.close();
    const pixels = context.getImageData(0, 0, 1, 2).data;
    return pixels[0] === 0 && pixels[2] === 255 && pixels[4] === 255 && pixels[6] === 0;
  } catch {
    return false;
  }
};

export async function decodeTexels(source) {
  if (typeof createImageBitmap !== 'function' || typeof ImageData === 'undefined') return null;
  try {
    if (!flips) flips = probe();
    if (!(await flips)) return null;
    const blob =
      typeof source === 'string' ? await fetch(source).then(reply => (reply.ok ? reply.blob() : null)) : source;
    if (!blob || !(await identical(blob))) return null;
    return await createImageBitmap(blob, OPTIONS);
  } catch {
    return null;
  }
}
