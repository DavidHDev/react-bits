import { useEffect, useMemo, useRef, useState } from 'react';
import { clearFiles, loadFile, readSession, removeFile, saveFile, useSessionSave } from '../../session';
import { loadField } from '../engine/masks';
import { PRIMITIVES_BY_ID, defaultShapeParams } from '../engine/primitives';
import { MAX_LAYERS } from '../engine/shader';
import { PROCEDURAL_BY_ID } from '../materials';
import { MARKS_BY_ID } from '../presets/marks';
import { MATERIALS_BY_ID, METAL_DEFINITIONS } from '../presets/materials';
import {
  DEFAULT_ARTBOARD,
  DEFAULT_EFFECTS,
  DEFAULT_FILL,
  DEFAULT_MORPH,
  FONTS,
  LAYER_DEFAULTS,
  OPS,
  RATIOS,
  nextId
} from './doc';

export const SESSION_TOOL = 'shape-magic';

const FILL_KINDS = ['solid', 'linear', 'radial', 'conic', 'logo'];
const BACKGROUND_KINDS = ['none', 'color', 'linear'];
const OUTLINE_MODES = ['outside', 'center'];
const EXPORT_GROUPS = ['image', 'vector', 'icons', 'video'];
const LAYER_TYPES = new Set([...Object.keys(PRIMITIVES_BY_ID), 'text', 'image']);
const OP_VALUES = new Set(OPS.map(op => op.value));

const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isNumber = value => typeof value === 'number' && Number.isFinite(value);
const isText = (value, max = 200) => typeof value === 'string' && value.length <= max;

const entries = value => Object.entries(isObject(value) ? value : {});

const primitives = value =>
  Object.fromEntries(entries(value).filter(([, item]) => isNumber(item) || typeof item === 'boolean' || isText(item)));

const numbers = value => Object.fromEntries(entries(value).filter(([, item]) => isNumber(item)));

const shaped = (defaults, value) => {
  const source = primitives(value);
  return {
    ...source,
    ...Object.fromEntries(
      Object.entries(defaults).map(([key, base]) => [key, typeof source[key] === typeof base ? source[key] : base])
    )
  };
};

export const readFile = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const srcBlob = src => {
  const head = /^data:([^,]*?)(;base64)?,/.exec(src || '');
  if (!head) return null;
  try {
    const body = src.slice(head[0].length);
    if (!head[2]) return new Blob([decodeURIComponent(body)], { type: head[1] });
    const binary = atob(body);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
    return new Blob([bytes], { type: head[1] });
  } catch {
    return null;
  }
};

const logoSlot = key => `logo:${key}`;

const imageLayers = doc =>
  [...doc.mark.layers, ...(doc.morph.target?.layers || [])].filter(layer => layer.type === 'image' && layer.image?.key);

const logoKeys = doc => [...new Set(imageLayers(doc).map(layer => layer.image.key))];

const cleanLayer = (raw, ids) => {
  if (!isObject(raw) || !LAYER_TYPES.has(raw.type)) return null;
  const layer = shaped(LAYER_DEFAULTS, raw);
  if (!OP_VALUES.has(layer.op)) layer.op = LAYER_DEFAULTS.op;
  layer.id = isText(raw.id, 80) && raw.id && !ids.has(raw.id) ? raw.id : nextId();
  ids.add(layer.id);
  layer.params = { ...defaultShapeParams(raw.type), ...numbers(raw.params) };
  if (raw.type === 'text') {
    const text = isObject(raw.text) ? raw.text : {};
    const font = FONTS.find(item => item.value === text.font) || FONTS[0];
    layer.text = {
      value: isText(text.value) ? text.value : 'Mark',
      font: font.value,
      weight: font.weights.includes(text.weight) ? text.weight : font.weights.at(-1),
      tracking: isNumber(text.tracking) ? text.tracking : -0.02
    };
  }
  if (raw.type === 'image') {
    const image = isObject(raw.image) ? raw.image : {};
    if (!isText(image.key, 1000) || !image.key) return null;
    layer.image = { name: isText(image.name) ? image.name : 'Logo', key: image.key };
  }
  return layer;
};

const cleanMark = raw => {
  if (!isObject(raw) || !Array.isArray(raw.layers)) return null;
  const ids = new Set();
  const layers = raw.layers
    .map(layer => cleanLayer(layer, ids))
    .filter(Boolean)
    .slice(0, MAX_LAYERS);
  if (!layers.length) return null;
  const mark = shaped({ scale: 1, rotation: 0, x: 0, y: 0 }, raw);
  if (mark.scale <= 0) mark.scale = 1;
  return { ...mark, layers };
};

const definitionsFor = id => {
  if (id === 'metal') return METAL_DEFINITIONS;
  if (id.startsWith('fx:')) return PROCEDURAL_BY_ID[id.slice(3)]?.params || null;
  return MATERIALS_BY_ID[id]?.entry?.props || null;
};

const fits = (definition, value) => {
  if (definition.type === 'number') return isNumber(value);
  if (definition.type === 'boolean') return typeof value === 'boolean';
  if (definition.type === 'select') return isNumber(value) || isText(value);
  if (definition.type === 'colorArray') return Array.isArray(value) && value.every(item => isText(item, 64));
  if (definition.type === 'rgbArray') return Array.isArray(value) && value.every(isNumber);
  return isText(value, 2000);
};

const cleanProps = (props, definitions) =>
  Object.fromEntries(
    entries(props).filter(([name, value]) => {
      const definition = definitions.find(item => item.name === name);
      return Boolean(definition) && fits(definition, value);
    })
  );

const cleanMaterial = (raw, fallback) => {
  if (!isObject(raw) || !isText(raw.id)) return fallback;
  const preset = MATERIALS_BY_ID[raw.preset] ? { preset: raw.preset } : {};
  if (raw.id === 'flat') return { id: 'flat', props: {}, ...preset };
  const definitions = definitionsFor(raw.id);
  if (!definitions) return fallback;
  const material = { id: raw.id, props: cleanProps(raw.props, definitions), ...preset };
  if (isText(raw.base, 64)) material.base = raw.base;
  if (isNumber(raw.look) || isText(raw.look)) material.look = raw.look;
  if (isObject(raw.lookProps)) material.lookProps = cleanProps(raw.lookProps, definitions);
  return material;
};

const cleanDoc = (raw, fallback) => {
  if (!isObject(raw)) return null;
  const mark = cleanMark(raw.mark) || fallback.mark;
  const artboard = isObject(raw.artboard) ? raw.artboard : {};
  const background = shaped(DEFAULT_ARTBOARD.background, artboard.background);
  if (!BACKGROUND_KINDS.includes(background.kind)) background.kind = DEFAULT_ARTBOARD.background.kind;
  const fill = shaped(DEFAULT_FILL, raw.fill);
  if (!FILL_KINDS.includes(fill.kind)) fill.kind = DEFAULT_FILL.kind;
  if (fill.kind === 'logo' && !mark.layers.some(layer => layer.type === 'image')) fill.kind = 'solid';
  const effects = Object.fromEntries(
    Object.entries(DEFAULT_EFFECTS).map(([name, values]) => [name, shaped(values, raw.effects?.[name])])
  );
  if (!OUTLINE_MODES.includes(effects.outline.mode)) effects.outline.mode = DEFAULT_EFFECTS.outline.mode;
  const morph = isObject(raw.morph) ? raw.morph : {};
  const target = cleanMark(morph.target);
  return {
    ...fallback,
    name: isText(raw.name) && raw.name ? raw.name : fallback.name,
    preset: mark === fallback.mark ? fallback.preset : MARKS_BY_ID[raw.preset] ? raw.preset : null,
    artboard: {
      ratio: RATIOS.some(item => item.value === artboard.ratio) ? artboard.ratio : fallback.artboard.ratio,
      background
    },
    mark,
    fill,
    effects,
    material: cleanMaterial(raw.material, fallback.material),
    morph: {
      ...shaped({ duration: DEFAULT_MORPH.duration, hold: DEFAULT_MORPH.hold, ease: DEFAULT_MORPH.ease }, morph),
      on: morph.on === true && Boolean(target),
      target
    }
  };
};

const cleanExport = raw => {
  if (!isObject(raw)) return {};
  const settings = isText(raw.tab, 20) ? { tab: raw.tab } : {};
  EXPORT_GROUPS.forEach(group => {
    if (isObject(raw[group])) settings[group] = primitives(raw[group]);
  });
  return settings;
};

export const readSaved = fallback => {
  const empty = { doc: fallback, fallback, restored: false, exportSettings: {}, logo: false, logos: [] };
  try {
    const saved = readSession(SESSION_TOOL);
    const doc = isObject(saved) ? cleanDoc(saved.doc, fallback) : null;
    if (!doc) return empty;
    return {
      doc,
      fallback,
      restored: true,
      exportSettings: cleanExport(saved.export),
      logo: saved.logo === true,
      logos: logoKeys(doc)
    };
  } catch {
    return empty;
  }
};

const storedLayers = layers =>
  layers.map(layer =>
    layer.type === 'image' && layer.image
      ? { ...layer, image: { name: layer.image.name, key: layer.image.key } }
      : layer
  );

const storedDoc = doc => ({
  ...doc,
  mark: { ...doc.mark, layers: storedLayers(doc.mark.layers) },
  morph: doc.morph.target
    ? { ...doc.morph, target: { ...doc.morph.target, layers: storedLayers(doc.morph.target.layers) } }
    : doc.morph
});

const fillLogos = (layers, sources) => {
  let changed = false;
  const next = layers.flatMap(layer => {
    if (layer.type !== 'image' || layer.image?.src) return [layer];
    changed = true;
    const src = sources.get(layer.image?.key);
    return src ? [{ ...layer, image: { ...layer.image, src } }] : [];
  });
  return changed ? next : layers;
};

const withLogos = (sources, fallback) => doc => {
  const layers = fillLogos(doc.mark.layers, sources);
  const target = doc.morph.target ? fillLogos(doc.morph.target.layers, sources) : null;
  if (layers === doc.mark.layers && (!target || target === doc.morph.target.layers)) return doc;
  const mark = layers.length ? { ...doc.mark, layers } : fallback.mark;
  const logo = mark.layers.some(layer => layer.type === 'image');
  return {
    ...doc,
    preset: layers.length ? doc.preset : fallback.preset,
    mark,
    fill: doc.fill.kind === 'logo' && !logo ? { ...doc.fill, kind: 'solid' } : doc.fill,
    morph: !target
      ? doc.morph
      : target.length
        ? { ...doc.morph, target: { ...doc.morph.target, layers: target } }
        : { ...doc.morph, on: false, target: null }
  };
};

const restoreLogo = key =>
  loadFile(SESSION_TOOL, logoSlot(key))
    .then(file => (file ? readFile(file.blob) : null))
    .then(async src => {
      if (!src) return null;
      await loadField({ type: 'image', image: { key, src } });
      return [key, src];
    })
    .catch(() => null);

export function useShapeSession({ session, doc, patch, exportSettings, logo }) {
  const [restoring, setRestoring] = useState(session.logos.length > 0);
  const stored = useRef(new Set(session.logos));
  const docRef = useRef(doc);
  docRef.current = doc;
  const keys = logoKeys(doc).join('\n');
  const value = useMemo(() => ({ doc: storedDoc(doc), export: exportSettings, logo }), [doc, exportSettings, logo]);

  useSessionSave(SESSION_TOOL, value);

  useEffect(() => {
    if (!session.restored) return undefined;
    clearFiles(SESSION_TOOL, session.logos.map(logoSlot));
    if (!session.logos.length) return undefined;
    let cancelled = false;
    Promise.all(session.logos.map(restoreLogo)).then(found => {
      if (cancelled) return;
      patch(withLogos(new Map(found.filter(Boolean)), session.fallback));
      setRestoring(false);
    });
    return () => {
      cancelled = true;
    };
  }, [session, patch]);

  useEffect(() => {
    if (restoring) return;
    const images = new Map(imageLayers(docRef.current).map(layer => [layer.image.key, layer.image]));
    images.forEach((image, key) => {
      if (stored.current.has(key)) return;
      const blob = srcBlob(image.src);
      if (!blob) return;
      stored.current.add(key);
      saveFile(SESSION_TOOL, logoSlot(key), blob, { name: image.name, key });
    });
    [...stored.current].forEach(key => {
      if (images.has(key)) return;
      stored.current.delete(key);
      removeFile(SESSION_TOOL, logoSlot(key));
    });
  }, [keys, restoring]);
}
