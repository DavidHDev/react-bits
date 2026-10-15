import { clock } from '../../../tools/background-studio/frame/clock';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { getBackgroundById } from '../../../tools/background-studio/backgrounds';
import { errorListeners, getState, setState } from '../../../tools/background-studio/frame/store';
import Frame from '../../../tools/background-studio/frame/Frame';
import { collectLayers, drawLayers } from '../../../tools/background-studio/utils/compose';
import '../../../css/fonts.css';

const MATERIALS = {
  metal: { component: () => import('../../../content/Animations/MetallicPaint/MetallicPaint') }
};

const resolveEntry = id => (id?.startsWith('bg:') ? getBackgroundById(id.slice(3)) : MATERIALS[id] || null);

document.documentElement.style.background = 'transparent';
document.documentElement.style.colorScheme = 'dark';

let loadToken = 0;

const refreshSoon = () => {
  if (!clock.paused) return;
  clock.refresh();
  [60, 180, 400].forEach(delay => setTimeout(() => clock.refresh(), delay));
};

const load = async (id, props = {}) => {
  loadToken += 1;
  const token = loadToken;
  const entry = resolveEntry(id);
  if (!entry) throw new Error(`Unknown material: ${id}`);
  const module = await entry.component();
  if (token !== loadToken) return false;
  flushSync(() =>
    setState({
      id,
      Component: module.default,
      props,
      key: getState().key + 1,
      wrapperStyle: entry.wrapperStyle || null
    })
  );
  refreshSoon();
  return true;
};

const update = props => {
  flushSync(() => setState({ props }));
  refreshSoon();
};

const restart = () => {
  flushSync(() => setState({ key: getState().key + 1 }));
  refreshSoon();
};

const capture = { on: false, canvas: document.createElement('canvas'), version: 0 };
const captureContext = capture.canvas.getContext('2d');

const grab = () => {
  if (!capture.on) return;
  const stage = document.querySelector('.frame-stage');
  if (stage) {
    const scene = collectLayers(stage);
    if (scene.layers.length) {
      const ratio = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.round(scene.width * ratio));
      const height = Math.max(1, Math.round(scene.height * ratio));
      if (capture.canvas.width !== width || capture.canvas.height !== height) {
        capture.canvas.width = width;
        capture.canvas.height = height;
      }
      drawLayers(captureContext, scene, width, height);
      capture.version += 1;
    }
  }
  clock.afterFrame(grab);
};

const setCapture = on => {
  if (on && !capture.on) {
    capture.on = true;
    clock.afterFrame(grab);
    refreshSoon();
  } else if (!on) {
    capture.on = false;
  }
};

let lastTarget = null;

const EVENTS = {
  move: ['pointermove', 'mousemove'],
  down: ['pointerdown', 'mousedown'],
  up: ['pointerup', 'mouseup']
};

const pointer = (type, x, y, buttons = 0) => {
  const init = {
    clientX: x,
    clientY: y,
    screenX: x,
    screenY: y,
    bubbles: true,
    cancelable: true,
    composed: true,
    view: window,
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true,
    buttons,
    button: type === 'down' || type === 'up' ? 0 : -1
  };
  if (type === 'leave') {
    if (lastTarget) lastTarget.dispatchEvent(new PointerEvent('pointerout', init));
    const chain = [];
    for (let node = lastTarget; node; node = node.parentElement) chain.push(node);
    [...chain, document, window].forEach(target => {
      target.dispatchEvent(new PointerEvent('pointerleave', { ...init, bubbles: false }));
      target.dispatchEvent(new MouseEvent('mouseleave', { ...init, bubbles: false }));
    });
    lastTarget = null;
    return;
  }
  const target = document.elementFromPoint(x, y) || document.querySelector('.frame-stage') || document.body;
  if (target !== lastTarget) {
    target.dispatchEvent(new PointerEvent('pointerover', init));
    target.dispatchEvent(new PointerEvent('pointerenter', { ...init, bubbles: false }));
    lastTarget = target;
  }
  const [pointerName, mouseName] = EVENTS[type] || EVENTS.move;
  target.dispatchEvent(new PointerEvent(pointerName, init));
  target.dispatchEvent(new MouseEvent(mouseName, init));
};

const clear = () => {
  loadToken += 1;
  flushSync(() => setState({ id: null, Component: null, props: {}, key: getState().key + 1 }));
};

[
  'pointermove',
  'pointerdown',
  'pointerup',
  'mousemove',
  'mousedown',
  'mouseup',
  'touchstart',
  'touchmove',
  'click',
  'wheel'
].forEach(type =>
  window.addEventListener(
    type,
    event => {
      if (clock.paused) event.stopImmediatePropagation();
    },
    { capture: true, passive: true }
  )
);

window.__rbStudio = {
  clock,
  load,
  update,
  restart,
  clear,
  setTheme: () => {},
  setCapture,
  capture: () => capture,
  pointer,
  stage: () => document.querySelector('.frame-stage'),
  onError(listener) {
    errorListeners.add(listener);
    return () => errorListeners.delete(listener);
  }
};

createRoot(document.getElementById('root')).render(<Frame />);

window.parent?.postMessage({ type: 'rb-shape-frame' }, window.location.origin);
