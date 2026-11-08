import { clearFiles, loadFile, readSession, removeFile, saveFile } from '../../session';
import { DEFAULT_DOC, buildScene, normalizeDoc } from '../engine/scene';
import { PRESETS_BY_ID } from '../presets/index';
import { SAMPLES, openFile, roleOf, shrinkImage } from '../media';
import { decodeShot } from '../share';

export const TOOL = 'center-stage';

const MAX_SLOT = 4096;

const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isNumber = value => typeof value === 'number' && Number.isFinite(value);
const isSlot = value => Number.isInteger(value) && value >= 0 && value < MAX_SLOT;
const has = (map, key) => typeof key === 'string' && Object.prototype.hasOwnProperty.call(map, key);

const SECTIONS = Object.keys(DEFAULT_DOC).filter(key => isObject(DEFAULT_DOC[key]));

const screenKey = slot => `screen-${slot}`;

const restored = new WeakSet();

const checkDoc = doc => {
  if (!isObject(doc) || (doc.aspect !== undefined && typeof doc.aspect !== 'string')) return null;
  if (doc.devices !== undefined && (!Array.isArray(doc.devices) || !doc.devices.every(isObject))) return null;
  if (SECTIONS.some(key => key in doc && !isObject(doc[key]))) return null;
  try {
    const normal = normalizeDoc(doc);
    const scene = buildScene(normal, [], { width: 320, height: 180 });
    return scene.camera.viewProj.every(Number.isFinite) ? normal : null;
  } catch {
    return null;
  }
};

const restoreDoc = doc =>
  isObject(doc) && doc.version === DEFAULT_DOC.version && typeof doc.aspect === 'string' && doc.devices?.length
    ? checkDoc(doc)
    : null;

export const importedShot = text => checkDoc(decodeShot(text));

export const isShotFile = file =>
  Boolean(file) && (file.type === 'application/json' || /\.json$/i.test(file.name || ''));

const restoreScreen = item => {
  if (!isObject(item) || !isSlot(item.slot) || item.slot < SAMPLES.length) return null;
  const screen = { slot: item.slot };
  if (typeof item.name === 'string') screen.name = item.name;
  if (item.role === 'desktop' || item.role === 'mobile') screen.role = item.role;
  if (isNumber(item.side) && item.side > 0) screen.side = item.side;
  if (isNumber(item.screens)) screen.screens = item.screens;
  if (isObject(item.trim) && isNumber(item.trim.start) && isNumber(item.trim.end) && item.trim.end > item.trim.start)
    screen.trim = { start: item.trim.start, end: item.trim.end };
  return screen;
};

export function readSaved() {
  const saved = readSession(TOOL);
  if (!isObject(saved)) return { shot: null, exportSettings: null };
  const doc = restoreDoc(saved.doc);
  const screens = [];
  (Array.isArray(saved.screens) ? saved.screens : []).forEach(item => {
    const screen = restoreScreen(item);
    if (screen && !screens.some(other => other.slot === screen.slot)) screens.push(screen);
  });
  return {
    shot: doc && { doc, preset: has(PRESETS_BY_ID, saved.preset) ? saved.preset : null, screens },
    exportSettings: isObject(saved.exportSettings) ? saved.exportSettings : null
  };
}

export const firstFree = (doc, screens) => {
  const used = [
    ...screens.map(item => item.slot),
    ...(Array.isArray(doc?.devices) ? doc.devices.map(device => device?.slot) : []),
    doc?.background?.slot
  ].filter(isSlot);
  return Math.max(SAMPLES.length, ...used.map(slot => slot + 1));
};

export const keepable = media =>
  Boolean(media) && !media.sample && (media.kind === 'image' || (media.kind === 'video' && Boolean(media.file)));

export const fromSession = media => restored.has(media);

export const screenList = (slots, pending) => {
  const list = [];
  slots.forEach((media, slot) => {
    if (!keepable(media)) return;
    const item = { slot, name: media.name, role: roleOf(media) };
    if (media.kind === 'image') item.side = Math.max(media.width, media.height);
    if (media.screens) item.screens = media.screens;
    if (media.trim) item.trim = { start: media.trim.start, end: media.trim.end };
    list.push(item);
  });
  return [...list, ...pending];
};

const stillFile = media =>
  new Promise(resolve => {
    const source = media.element;
    const own = source instanceof HTMLCanvasElement;
    const canvas = own ? source : document.createElement('canvas');
    try {
      if (!own) {
        canvas.width = media.width;
        canvas.height = media.height;
        canvas.getContext('2d').drawImage(source, 0, 0, media.width, media.height);
      }
      canvas.toBlob(blob => {
        if (!own) canvas.width = 0;
        resolve(blob ? new File([blob], `${media.name || 'Screen'}.png`, { type: 'image/png' }) : null);
      }, 'image/png');
    } catch {
      resolve(null);
    }
  });

export async function storeScreen(slot, media, current) {
  const file = media.file || (await stillFile(media));
  if (file && current()) await saveFile(TOOL, screenKey(slot), file);
}

export async function reopenScreen(item) {
  const saved = await loadFile(TOOL, screenKey(item.slot));
  if (!saved) return null;
  const file =
    saved.blob instanceof File ? saved.blob : new File([saved.blob], item.name || 'Screen', { type: saved.blob.type });
  let media = await openFile(file);
  if (media.kind === 'image' && item.side && Math.max(media.width, media.height) > item.side + 1)
    media = shrinkImage(media, item.side);
  media.role = item.role || roleOf(media);
  if (item.name !== undefined) media.name = item.name;
  if (item.screens !== undefined) media.screens = item.screens;
  if (item.trim) media.trim = { ...item.trim };
  restored.add(media);
  return media;
}

export const dropScreen = slot => removeFile(TOOL, screenKey(slot));

export const keepScreens = slots => clearFiles(TOOL, slots.map(screenKey));
