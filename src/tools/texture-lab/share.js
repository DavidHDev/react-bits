import { EFFECTS, blendFor, defaultParams } from './effects';

const toBase64Url = text =>
  btoa(String.fromCharCode(...new TextEncoder().encode(text)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fromBase64Url = value => {
  const base = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base + '='.repeat((4 - (base.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(binary, char => char.charCodeAt(0)));
};

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function compactLayers(layers) {
  return layers.map(layer => {
    const defaults = defaultParams(EFFECTS[layer.type]);
    const params = Object.fromEntries(
      Object.entries(layer.params).filter(([key, value]) => !same(value, defaults[key]))
    );
    const item = { type: layer.type };
    if (Object.keys(params).length) item.params = params;
    if (layer.mix !== 1) item.mix = Math.round(layer.mix * 1000) / 1000;
    if (layer.blend && layer.blend !== blendFor(layer.type)) item.blend = layer.blend;
    if (layer.visible === false) item.visible = false;
    return item;
  });
}

const validLayers = (layers, version) =>
  Array.isArray(layers)
    ? layers
        .filter(item => item && typeof item.type === 'string' && EFFECTS[item.type])
        .map(item => (version >= 2 || item.blend ? item : { ...item, blend: 'normal' }))
    : null;

export const lookJson = (layers, name = 'Texture Lab style') =>
  JSON.stringify({ name, version: 2, layers: compactLayers(layers) }, null, 2);

export const shareUrl = layers => {
  const payload = toBase64Url(JSON.stringify({ v: 2, layers: compactLayers(layers) }));
  return `${window.location.origin}${window.location.pathname}#style=${payload}`;
};

export function decodeLook(text) {
  const value = String(text || '').trim();
  const match = value.match(/(?:style|look)=([\w-]+)/);
  if (match) {
    try {
      const look = JSON.parse(fromBase64Url(match[1]));
      return validLayers(look.layers, look.v);
    } catch {
      return null;
    }
  }
  if (value.startsWith('{')) {
    try {
      const look = JSON.parse(value);
      return validLayers(look.layers, look.version);
    } catch {
      return null;
    }
  }
  return null;
}

export const readSharedLook = () => (window.location.hash ? decodeLook(window.location.hash) : null);
