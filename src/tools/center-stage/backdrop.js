import { BACKGROUNDS, getBackgroundById } from '../background-studio/backgrounds';
import { collectLayers, drawLayers } from '../background-studio/utils/compose';
import { frameUrl, waitForBridge } from '../background-studio/utils/frame';
import { createRenderer } from '../background-studio/utils/render';
import { loadPresets } from '../background-studio/utils/presets';
import { themeDefaults } from '../background-studio/utils/theme';

const SKIP = new Set([
  'click-spark',
  'ghost-cursor',
  'image-trail',
  'splash-cursor',
  'evil-eye',
  'grid-motion',
  'grid-distortion',
  'ribbons',
  'noise'
]);
const HIDDEN = /^(paused|intro)$|mouse|cursor|interactive|interaction|hover|click|parallax|touch|drag/i;
const OWN_BACKGROUND = /^(background|bg)(color)?$/i;

export const DEFAULT_BACKDROP = 'gradient-waves';

const luminance = color => {
  const hex = String(color || '').replace('#', '');
  const full = hex.length === 3 ? [...hex].map(digit => digit + digit).join('') : hex.slice(0, 6);
  const value = parseInt(full, 16);
  if (!Number.isFinite(value)) return 0;
  return (0.2126 * ((value >> 16) & 255) + 0.7152 * ((value >> 8) & 255) + 0.0722 * (value & 255)) / 255;
};

export const backdropIsLight = background => luminance(background?.colors?.[0]) > 0.5;

export const BACKDROPS = BACKGROUNDS.filter(entry => !SKIP.has(entry.id)).map(entry => ({
  value: entry.id,
  label: entry.label,
  thumb: `/assets/studio/${entry.id}-dark.webp`,
  thumbLight: `/assets/studio/${entry.id}-light.webp`
}));

export const backdropPresets = async id => {
  const entry = getBackgroundById(id || DEFAULT_BACKDROP);
  if (!entry) return [];
  const presets = await loadPresets(entry);
  return presets?.options || [];
};

export const backdropControls = id => {
  const entry = getBackgroundById(id || DEFAULT_BACKDROP);
  if (!entry) return { definitions: [], ownBackground: false };
  const definitions = entry.props.filter(prop => !HIDDEN.test(prop.name));
  const ownBackground = definitions.some(prop => prop.type === 'color' && OWN_BACKGROUND.test(prop.name));
  return { definitions, ownBackground };
};

export async function backdropProps(background) {
  const entry = getBackgroundById(background.component || DEFAULT_BACKDROP);
  if (!entry) return null;
  const light = backdropIsLight(background);
  const defaults = light
    ? themeDefaults(entry, true)
    : Object.fromEntries(entry.props.map(prop => [prop.name, prop.default]));
  let props = { ...defaults };
  if (background.preset) {
    const presets = await loadPresets(entry);
    if (presets) props = { ...props, ...presets.resolve(background.preset, { light, defaults, props }) };
  }
  const still = entry.props.some(prop => prop.name === 'intro') ? { intro: false } : {};
  return { id: entry.id, light, props: { ...props, ...(background.props || {}), ...still, paused: false } };
}

const hide = (iframe, width, height) =>
  Object.assign(iframe.style, {
    position: 'fixed',
    left: '0px',
    top: '0px',
    width: `${width}px`,
    height: `${height}px`,
    border: '0',
    opacity: '0',
    pointerEvents: 'none',
    zIndex: '-1'
  });

export function createLiveBackdrop() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  let iframe = null;
  let api = null;
  let boot = null;
  let key = null;
  let id = null;
  let version = 0;
  let fill = '#000000';
  let theme = 'dark';
  let disposed = false;
  let request = 0;

  const ensure = (width, height) => {
    if (boot) return boot;
    iframe = document.createElement('iframe');
    iframe.src = frameUrl({ theme: 'dark', dpr: 1 });
    iframe.setAttribute('aria-hidden', 'true');
    iframe.tabIndex = -1;
    hide(iframe, width, height);
    document.body.appendChild(iframe);
    boot = waitForBridge(iframe).then(bridge => {
      api = bridge;
      return bridge;
    });
    return boot;
  };

  return {
    canvas,
    get version() {
      return version;
    },
    async show(background, width, height) {
      const w = Math.max(2, Math.round(width));
      const h = Math.max(2, Math.round(height));
      request += 1;
      const ticket = request;
      fill = background.colors?.[0] || '#000000';
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      if (iframe) hide(iframe, w, h);
      const bridge = await ensure(w, h);
      const resolved = await backdropProps(background);
      if (disposed || ticket !== request || !resolved) return;
      const next = JSON.stringify(resolved);
      if (next === key) return;
      key = next;
      const wanted = resolved.light ? 'light' : 'dark';
      if (wanted !== theme) {
        theme = wanted;
        bridge.setTheme(theme);
      }
      if (id === resolved.id) {
        bridge.update(resolved.props);
        return;
      }
      id = resolved.id;
      await bridge.load(resolved.id, resolved.props);
    },
    capture() {
      if (!api || !key) return;
      api.clock.afterFrame(() => {
        const stage = api.stage();
        if (!stage) return;
        drawLayers(context, collectLayers(stage), canvas.width, canvas.height, fill);
        version += 1;
      });
    },
    playing(on) {
      if (!api) return;
      if (on) api.clock.resume();
      else api.clock.pause();
    },
    dispose() {
      disposed = true;
      iframe?.remove();
      iframe = null;
      api = null;
    }
  };
}

export async function openExportBackdrop(background, width, height, signal) {
  const resolved = await backdropProps(background);
  if (!resolved) return null;
  const ratio = Math.max(width, height) > 2200 ? 2 : 1;
  const renderer = await createRenderer({
    layout: { width: Math.round(width / ratio), height: Math.round(height / ratio) },
    output: { width, height },
    ratio,
    theme: resolved.light ? 'light' : 'dark'
  });
  try {
    await renderer.load(resolved.id, resolved.props, signal);
  } catch (problem) {
    renderer.destroy();
    throw problem;
  }
  const fill = background.colors?.[0] || '#000000';
  let at = 0;
  return {
    canvas: renderer.canvas,
    seek(time) {
      const target = Math.max(0, time * 1000);
      while (at < target - 0.01) {
        const step = Math.min(1000 / 60, target - at);
        renderer.step(step);
        at += step;
      }
      renderer.draw(fill);
    },
    destroy() {
      renderer.destroy();
    }
  };
}
