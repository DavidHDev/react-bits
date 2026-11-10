import { clock } from './clock';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { getBackgroundById } from '../backgrounds';
import { errorListeners, getState, setState } from './store';
import Frame from './Frame';
import '../../../css/fonts.css';

const query = new URLSearchParams(window.location.search);

const PAGE = { dark: '#120f17', light: '#ffffff' };

const setTheme = theme => {
  const mode = theme === 'light' ? 'light' : 'dark';
  document.documentElement.style.colorScheme = mode;
  document.documentElement.style.background = PAGE[mode];
};

setTheme(query.get('theme'));

let loadToken = 0;
let refreshTimers = [];

const refreshSoon = () => {
  if (!clock.paused) return;
  clock.refresh();
  refreshTimers.forEach(timer => clearTimeout(timer));
  refreshTimers = [60, 180, 400].map(delay => setTimeout(() => clock.refresh(), delay));
};

const load = async (id, props = {}) => {
  loadToken += 1;
  const token = loadToken;
  const background = getBackgroundById(id);
  if (!background) throw new Error(`Unknown background: ${id}`);
  const module = await background.component();
  if (token !== loadToken) return false;
  flushSync(() =>
    setState({
      id,
      Component: module.default,
      props,
      key: getState().key + 1,
      wrapperStyle: background.wrapperStyle || null
    })
  );
  refreshSoon();
  if (clock.manual) await clock.settle();
  return true;
};

const preload = id => {
  const background = getBackgroundById(id);
  if (!background) return Promise.resolve(false);
  return background.component().then(
    () => true,
    () => false
  );
};

const update = props => {
  flushSync(() => setState({ props }));
  refreshSoon();
};

const restart = () => {
  flushSync(() => setState({ key: getState().key + 1 }));
  refreshSoon();
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
  preload,
  update,
  restart,
  setTheme,
  stage: () => document.querySelector('.frame-stage'),
  onError(listener) {
    errorListeners.add(listener);
    return () => errorListeners.delete(listener);
  }
};

createRoot(document.getElementById('root')).render(<Frame />);

window.parent?.postMessage({ type: 'rb-studio-frame' }, window.location.origin);
