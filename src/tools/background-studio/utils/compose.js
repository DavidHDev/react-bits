const BLEND_MODES = {
  multiply: 'multiply',
  screen: 'screen',
  overlay: 'overlay',
  darken: 'darken',
  lighten: 'lighten',
  'color-dodge': 'color-dodge',
  'color-burn': 'color-burn',
  'hard-light': 'hard-light',
  'soft-light': 'soft-light',
  difference: 'difference',
  exclusion: 'exclusion',
  hue: 'hue',
  saturation: 'saturation',
  color: 'color',
  luminosity: 'luminosity',
  'plus-lighter': 'lighter'
};

const SIGNALS = [
  'load',
  'loadedmetadata',
  'resize',
  'pointerover',
  'pointerout',
  'pointerdown',
  'pointerup',
  'focusin',
  'focusout'
];
const IDLE_LIMIT = 30;
const MISS_LIMIT = 24;
const COOLDOWN = 240;
const scenes = new WeakMap();
const cooling = new WeakMap();

const sameBox = (a, b) => a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height;

const boxOf = element => {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { left, top, width, height };
};

const moving = animation => {
  const time = animation.currentTime;
  const end = animation.effect?.getComputedTiming().endTime;
  return time == null || end == null || time < end;
};

const animating = view =>
  typeof view.document.getAnimations === 'function' && view.document.getAnimations().some(moving);

function release(root, state) {
  state.observer.disconnect();
  state.signals.abort();
  scenes.delete(root);
}

function watch(root) {
  const view = root.ownerDocument.defaultView;
  if (!view || typeof MutationObserver !== 'function' || typeof AbortController !== 'function') return null;
  const state = {
    scene: null,
    bounds: null,
    boxes: [],
    valid: false,
    idle: 0,
    misses: 0,
    observer: null,
    signals: new AbortController()
  };
  const stale = () => {
    state.valid = false;
    state.scene = null;
    state.boxes = [];
    state.idle += 1;
    if (state.idle > IDLE_LIMIT) release(root, state);
  };
  state.observer = new MutationObserver(stale);
  state.observer.observe(view.document, { subtree: true, childList: true, attributes: true, characterData: true });
  const options = { capture: true, passive: true, signal: state.signals.signal };
  SIGNALS.forEach(type => view.document.addEventListener(type, stale, options));
  view.addEventListener('resize', stale, options);
  scenes.set(root, state);
  return state;
}

function measure(root, view, state) {
  const bounds = boxOf(root);
  const layers = [];
  const boxes = [];

  root.querySelectorAll('canvas, video').forEach(element => {
    const isVideo = element.tagName === 'VIDEO';
    if (isVideo ? !element.videoWidth : !element.width || !element.height) return;
    const rect = boxOf(element);
    if (rect.width < 1 || rect.height < 1) return;

    let opacity = 1;
    let blend = 'source-over';
    for (let node = element; node && node !== root.parentElement; node = node.parentElement) {
      const style = view.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      opacity *= Number(style.opacity);
      if (blend === 'source-over' && BLEND_MODES[style.mixBlendMode]) blend = BLEND_MODES[style.mixBlendMode];
    }
    if (opacity <= 0.001) return;

    const style = view.getComputedStyle(element);
    boxes.push({ element, rect });
    layers.push({
      element,
      x: rect.left - bounds.left,
      y: rect.top - bounds.top,
      width: rect.width,
      height: rect.height,
      opacity,
      blend,
      filter: style.filter && style.filter !== 'none' ? style.filter : 'none'
    });
  });

  const scene = { width: bounds.width, height: bounds.height, layers };
  if (state) Object.assign(state, { scene, bounds, boxes });
  return scene;
}

export function collectLayers(root) {
  const view = root.ownerDocument.defaultView;
  const rest = cooling.get(root);
  if (rest) {
    if (rest > 1) cooling.set(root, rest - 1);
    else cooling.delete(root);
    return measure(root, view, null);
  }
  const state = scenes.get(root) || watch(root);
  if (!state) return measure(root, view, null);
  state.idle = 0;
  const changed = state.observer.takeRecords().length > 0;
  if (
    state.valid &&
    !changed &&
    !animating(view) &&
    sameBox(root.getBoundingClientRect(), state.bounds) &&
    state.boxes.every(({ element, rect }) => sameBox(element.getBoundingClientRect(), rect))
  ) {
    state.misses = 0;
    return state.scene;
  }
  const scene = measure(root, view, state);
  state.valid = !animating(view);
  state.misses += 1;
  if (state.misses > MISS_LIMIT) {
    release(root, state);
    cooling.set(root, COOLDOWN);
  }
  return scene;
}

export function drawLayers(context, scene, width, height, fill) {
  const scaleX = width / Math.max(scene.width, 1);
  const scaleY = height / Math.max(scene.height, 1);
  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalAlpha = 1;
  context.globalCompositeOperation = 'source-over';
  context.filter = 'none';
  context.clearRect(0, 0, width, height);
  if (fill) {
    context.fillStyle = fill;
    context.fillRect(0, 0, width, height);
  }
  scene.layers.forEach(layer => {
    context.globalAlpha = layer.opacity;
    context.globalCompositeOperation = layer.blend;
    context.filter = layer.filter;
    try {
      context.drawImage(layer.element, layer.x * scaleX, layer.y * scaleY, layer.width * scaleX, layer.height * scaleY);
    } catch {
      return;
    }
  });
  context.restore();
}
