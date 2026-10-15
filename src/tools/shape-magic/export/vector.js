import { createRenderer } from '../engine/renderer';
import { bindMasks, maskPlan } from '../engine/masks';
import { materialFor } from '../presets/materials';
import { ratioOf } from '../state/doc';
import { prepareMasks } from './exporters';
import { componentName } from './code';

const loaders = import.meta.glob(['../geometry/svg.js', '../geometry/morph.js']);

const loadModule = async path => {
  const load = loaders[path];
  if (!load) throw new Error('Vector export is not ready yet.');
  return load();
};

const loadGeometry = () => loadModule('../geometry/svg.js');

const SPLINE = '0.45 0 0.55 1';

const morphTiming = morph => {
  const hold = Math.max(0, morph.hold ?? 0.8);
  const duration = Math.max(0.05, morph.duration ?? 1.6);
  const total = (hold + duration) * 2;
  const stops = [0, hold, hold + duration, hold * 2 + duration, total].map(
    t => Math.round((t / total) * 10000) / 10000
  );
  return {
    total: Math.round(total * 1000) / 1000,
    keyTimes: stops.join(';'),
    keySplines: ['0 0 1 1', SPLINE, '0 0 1 1', SPLINE].join(';')
  };
};

const animateMarkup = (from, to, timing, jsx) => {
  const values = [from, from, to, to, from].join(';');
  if (jsx) {
    return `<animate attributeName="d" dur="${timing.total}s" repeatCount="indefinite" calcMode="spline" keyTimes="${timing.keyTimes}" keySplines="${timing.keySplines}" values="${values}" />`;
  }
  return `<animate attributeName="d" dur="${timing.total}s" repeatCount="indefinite" calcMode="spline" keyTimes="${timing.keyTimes}" keySplines="${timing.keySplines}" values="${values}"/>`;
};

const injectAnimation = (markup, from, to, timing, jsx) => {
  const start = markup.indexOf('<path');
  if (start < 0) return markup;
  const end = markup.indexOf('/>', start);
  const open = markup.slice(start, end).replace(/\s+$/, '');
  const indent = markup.slice(markup.lastIndexOf('\n', start) + 1, start);
  return `${markup.slice(0, start)}${open}>\n${indent}  ${animateMarkup(from, to, timing, jsx)}\n${indent}</path>${markup.slice(end + 2)}`;
};

export async function readMarkField(doc, longSide = 1024) {
  await prepareMasks(doc);
  const ratio = ratioOf(doc.artboard);
  const width = ratio.w >= ratio.h ? longSide : Math.round((longSide * ratio.w) / ratio.h);
  const height = ratio.w >= ratio.h ? Math.round((longSide * ratio.h) / ratio.w) : longSide;
  const canvas = document.createElement('canvas');
  const renderer = createRenderer(canvas, { preserve: true });
  try {
    const plan = maskPlan([doc.mark.layers]);
    const scene = { a: doc.mark, maskSlots: plan.slots };
    await renderer.prepareScene(scene);
    bindMasks(renderer, plan.keys);
    return renderer.readField({ scene, width, height });
  } finally {
    renderer.dispose();
  }
}

export async function markSVG(doc, { background = false, longSide = 1024 } = {}) {
  const geometry = await loadGeometry();
  const field = await readMarkField(doc, longSide);
  const traced = geometry.fieldToPath(field, { tolerance: 0.5, viewBox: [field.width, field.height] });
  const flat = materialFor(doc).kind === 'flat';
  const outline = doc.effects.outline;
  const fill = !flat
    ? { kind: 'solid', color1: '#ffffff' }
    : doc.fill.kind === 'logo'
      ? { kind: 'solid', color1: doc.fill.color1 || '#111111' }
      : doc.fill;
  const parts = {
    d: traced.d,
    width: field.width,
    height: field.height,
    fill,
    background: background && doc.artboard.background.kind !== 'none' ? doc.artboard.background : null,
    outline:
      flat && outline.on
        ? { color: outline.color, width: outline.width * (Math.min(field.width, field.height) / 2), mode: outline.mode }
        : null,
    fillRule: 'evenodd'
  };
  const morphing = doc.morph?.on && doc.morph.target;
  if (morphing) {
    const morph = await loadModule('../geometry/morph.js');
    const targetField = await readMarkField(
      { ...doc, mark: doc.morph.target, morph: { ...doc.morph, on: false } },
      longSide
    );
    const tracedB = geometry.fieldToPath(targetField, {
      tolerance: 0.5,
      viewBox: [targetField.width, targetField.height]
    });
    const paths = morph.morphPaths(traced.contours, tracedB.contours);
    const timing = morphTiming(doc.morph);
    const animated = { ...parts, d: paths.from };
    const svg = injectAnimation(geometry.buildSVG(animated), paths.from, paths.to, timing, false);
    const react = injectAnimation(
      geometry.toReactComponent(animated, { name: componentName(doc.name) }),
      paths.from,
      paths.to,
      timing,
      true
    );
    const mask = geometry.buildSVG({
      d: traced.d,
      width: field.width,
      height: field.height,
      fill: { kind: 'solid', color1: '#000000' },
      fillRule: 'evenodd'
    });
    const segments = (paths.segments || []).reduce((sum, count) => sum + count, 0);
    return { svg, mask, react, d: paths.from, segments, animated: true };
  }
  const svg = geometry.buildSVG(parts);
  const mask = geometry.buildSVG({
    d: traced.d,
    width: field.width,
    height: field.height,
    fill: { kind: 'solid', color1: '#000000' },
    fillRule: 'evenodd'
  });
  const react = geometry.toReactComponent(parts, { name: componentName(doc.name) });
  return { svg, mask, react, d: traced.d, segments: traced.segments ?? traced.count ?? 0 };
}
